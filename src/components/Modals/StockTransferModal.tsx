import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Building2,
  Warehouse as WarehouseIcon,
  Layers
} from 'lucide-react';
import {
  Product,
  InventoryLayer,
  StockTransfer,
  StockTransferItem,
  Warehouse,
  Branch
} from '../../types';
import { fifoEngine } from '../../services/fifoEngine';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  inventoryLots: InventoryLayer[];
  warehouses: Warehouse[];
  branches: Branch[];
  onSaveTransfer: (transfer: StockTransfer) => void;
}

interface TransferFormRow {
  id: string;
  sku: string;
  quantity: number;
  note?: string;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  products = [],
  inventoryLots = [],
  warehouses = [],
  branches = [],
  onSaveTransfer
}) => {
  const [sourceWarehouseId, setSourceWarehouseId] = useState(warehouses[0]?.id || 'WH01');
  const [destWarehouseId, setDestWarehouseId] = useState(warehouses[1]?.id || 'WH02');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().substring(0, 10));
  const [note, setNote] = useState('');

  const [rows, setRows] = useState<TransferFormRow[]>([
    {
      id: 'tr-row-1',
      sku: products[0]?.sku || '',
      quantity: 5
    }
  ]);

  const sourceWarehouse = warehouses.find((w) => w.id === sourceWarehouseId) || warehouses[0];
  const destWarehouse = warehouses.find((w) => w.id === destWarehouseId) || warehouses[1];

  const sourceBranch = branches.find((b) => b.id === sourceWarehouse?.branchId) || branches[0];
  const destBranch = branches.find((b) => b.id === destWarehouse?.branchId) || branches[0];

  const handleAddRow = () => {
    const firstProd = products[0];
    setRows([
      ...rows,
      {
        id: `tr-row-${Date.now()}`,
        sku: firstProd ? firstProd.sku : '',
        quantity: 1
      }
    ]);
  };

  const handleRemoveRow = (rowId: string) => {
    if (rows.length === 1) return;
    setRows(rows.filter((r) => r.id !== rowId));
  };

  const handleRowChange = (rowId: string, field: keyof TransferFormRow, value: any) => {
    setRows(
      rows.map((r) => {
        if (r.id !== rowId) return r;
        return { ...r, [field]: value };
      })
    );
  };

  // Validation and FIFO previews
  const { validationErrors, totalTransferredValue } = useMemo(() => {
    const errors: string[] = [];
    let valueSum = 0;

    if (sourceWarehouseId === destWarehouseId) {
      errors.push('Kho nguồn và kho đích không được trùng nhau.');
    }

    let workingLayers = inventoryLots.map((l) => ({ ...l }));

    for (const row of rows) {
      if (!row.sku || row.quantity <= 0) continue;

      const prod = products.find((p) => p.sku === row.sku);
      const available = fifoEngine.getTotalAvailableStock(workingLayers, row.sku, {
        warehouseId: sourceWarehouseId
      });

      if (row.quantity > available) {
        errors.push(
          `Không đủ tồn cho [${row.sku} - ${prod?.name || ''}] tại [${sourceWarehouse?.name}]. Tồn: ${available}, Yêu cầu: ${row.quantity}`
        );
      }

      // Preview cost
      const previewAlloc = fifoEngine.previewFifoAllocation(row.sku, row.quantity, workingLayers, {
        warehouseId: sourceWarehouseId
      });
      workingLayers = previewAlloc.updatedLayers;
      valueSum += previewAlloc.totalCost;
    }

    return {
      validationErrors: errors,
      totalTransferredValue: valueSum
    };
  }, [rows, inventoryLots, products, sourceWarehouseId, destWarehouseId, sourceWarehouse]);

  const canSave = validationErrors.length === 0 && rows.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    const transferItems: StockTransferItem[] = rows.map((r) => {
      const prod = products.find((p) => p.sku === r.sku);
      return {
        sku: r.sku,
        productId: prod?.productId || `P-${r.sku}`,
        productName: prod?.name || r.sku,
        unit: prod?.unit || 'đv',
        quantity: Number(r.quantity),
        note: r.note
      };
    });

    const newTransfer: StockTransfer = {
      id: `trans-${Date.now()}`,
      code: `CK-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
      sourceBranchId: sourceBranch?.id || 'BR01',
      sourceBranchName: sourceBranch?.name || 'Chi nhánh Chính',
      sourceWarehouseId: sourceWarehouseId,
      sourceWarehouseName: sourceWarehouse?.name || 'Kho Tổng',
      destBranchId: destBranch?.id || 'BR01',
      destBranchName: destBranch?.name || 'Chi nhánh Chính',
      destWarehouseId: destWarehouseId,
      destWarehouseName: destWarehouse?.name || 'Kho 2',
      transferDate,
      status: 'completed',
      items: transferItems,
      totalQuantity: rows.reduce((s, r) => s + Number(r.quantity), 0),
      totalValue: totalTransferredValue,
      note: note.trim(),
      createdBy: 'Trần Văn Bình (Điều chuyển)',
      createdAt: new Date().toISOString()
    };

    onSaveTransfer(newTransfer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                Điều chuyển Nội bộ (Bảo toàn FIFO)
              </span>
              <h2 className="text-lg font-black tracking-tight">Tạo Phiếu Chuyển Kho</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Transfer Route Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
            {/* Source Warehouse */}
            <div className="p-3.5 bg-white rounded-xl border border-purple-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-800 mb-2 uppercase">
                <WarehouseIcon className="w-4 h-4" />
                Kho Nguồn (Xuất chuyển đi)
              </div>
              <select
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code}) - {w.branchName}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Warehouse */}
            <div className="p-3.5 bg-white rounded-xl border border-indigo-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 mb-2 uppercase">
                <WarehouseIcon className="w-4 h-4" />
                Kho Đích (Nhập nhận về)
              </div>
              <select
                value={destWarehouseId}
                onChange={(e) => setDestWarehouseId(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code}) - {w.branchName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày chuyển hàng *</label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú điều chuyển</label>
              <input
                type="text"
                placeholder="Lý do chuyển kho, bổ sung hàng..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
              />
            </div>
          </div>

          {/* Product Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                Mặt hàng Điều chuyển (Bảo lưu đơn giá vốn và ngày nhập gốc)
              </h3>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm mặt hàng
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Sản phẩm / SKU</th>
                    <th className="py-2.5 px-3 text-center">Tồn tại kho nguồn</th>
                    <th className="py-2.5 px-3 text-right">SL Chuyển</th>
                    <th className="py-2.5 px-3 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const prod = products.find((p) => p.sku === row.sku);
                    const available = fifoEngine.getTotalAvailableStock(inventoryLots, row.sku, {
                      warehouseId: sourceWarehouseId
                    });
                    const isOverStock = row.quantity > available;

                    return (
                      <tr key={row.id} className={isOverStock ? 'bg-rose-50/50' : 'bg-white'}>
                        <td className="py-2.5 px-3">
                          <select
                            value={row.sku}
                            onChange={(e) => handleRowChange(row.id, 'sku', e.target.value)}
                            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.sku}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                              available > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {available.toLocaleString('vi-VN')} {prod?.unit || 'đv'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => handleRowChange(row.id, 'quantity', Number(e.target.value))}
                            className={`w-28 text-right text-xs font-mono font-bold border rounded-lg px-2.5 py-1.5 ${
                              isOverStock
                                ? 'border-rose-400 bg-rose-50 text-rose-700'
                                : 'border-slate-200 bg-white text-slate-900'
                            }`}
                          />
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            disabled={rows.length === 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation Warnings */}
          {validationErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1 text-xs text-rose-800 font-medium">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Cảnh báo không thể chuyển kho:
              </div>
              {validationErrors.map((err, i) => (
                <div key={i} className="pl-5">
                  • {err}
                </div>
              ))}
            </div>
          )}

          {/* Summary & Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs">
              <span className="text-slate-500">Tổng giá trị điều chuyển FIFO:</span>
              <div className="text-base font-black text-purple-900 font-mono">
                {totalTransferredValue.toLocaleString('vi-VN')} đ
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={!canSave}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition shadow-md shadow-purple-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Thực hiện Chuyển kho
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
