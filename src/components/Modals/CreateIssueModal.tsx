import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  Building2,
  Warehouse as WarehouseIcon,
  Info
} from 'lucide-react';
import {
  Product,
  InventoryLayer,
  StockIssue,
  StockIssueType,
  StockIssueItem,
  Customer,
  Warehouse,
  Branch
} from '../../types';
import { fifoEngine } from '../../services/fifoEngine';

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  inventoryLots: InventoryLayer[];
  warehouses: Warehouse[];
  branches: Branch[];
  customers?: Customer[];
  onSaveIssue: (newIssue: StockIssue) => void;
}

interface IssueFormRow {
  id: string;
  sku: string;
  quantity: number;
  salePrice: number;
  note?: string;
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen,
  onClose,
  products = [],
  inventoryLots = [],
  warehouses = [],
  branches = [],
  customers = [],
  onSaveIssue
}) => {
  const [issueType, setIssueType] = useState<StockIssueType>('Bán hàng');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || 'BR01');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || 'WH01');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().substring(0, 16).replace('T', ' '));
  const [note, setNote] = useState('');

  const [rows, setRows] = useState<IssueFormRow[]>([
    {
      id: 'row-1',
      sku: products[0]?.sku || '',
      quantity: 10,
      salePrice: products[0]?.sellingPrice || 0
    }
  ]);

  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];
  const currentWarehouse = warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setReceiverName(cust.name);
      setReceiverPhone(cust.phone || '');
    }
  };

  const handleAddRow = () => {
    const firstProd = products[0];
    setRows([
      ...rows,
      {
        id: `row-${Date.now()}`,
        sku: firstProd ? firstProd.sku : '',
        quantity: 1,
        salePrice: firstProd ? firstProd.sellingPrice : 0
      }
    ]);
  };

  const handleRemoveRow = (rowId: string) => {
    if (rows.length === 1) return;
    setRows(rows.filter((r) => r.id !== rowId));
  };

  const handleRowChange = (rowId: string, field: keyof IssueFormRow, value: any) => {
    setRows(
      rows.map((r) => {
        if (r.id !== rowId) return r;
        if (field === 'sku') {
          const prod = products.find((p) => p.sku === value);
          return {
            ...r,
            sku: value,
            salePrice: prod ? prod.sellingPrice : r.salePrice
          };
        }
        return { ...r, [field]: value };
      })
    );
  };

  // Preview FIFO Allocations in real-time
  const { previewAllocationsBySku, validationErrors, totalCogs, totalRevenue } = useMemo(() => {
    const previewMap: Record<string, any> = {};
    const errors: string[] = [];
    let cogsSum = 0;
    let revSum = 0;

    let workingLayers = inventoryLots.map((l) => ({ ...l }));

    for (const row of rows) {
      if (!row.sku || row.quantity <= 0) continue;

      const prod = products.find((p) => p.sku === row.sku);
      const available = fifoEngine.getTotalAvailableStock(workingLayers, row.sku, {
        branchId: selectedBranchId,
        warehouseId: selectedWarehouseId
      });

      if (row.quantity > available) {
        errors.push(
          `Không đủ tồn kho cho [${row.sku} - ${prod?.name || ''}]. Tồn khả dụng tại kho [${currentWarehouse?.name}]: ${available.toLocaleString('vi-VN')}, Yêu cầu xuất: ${row.quantity.toLocaleString('vi-VN')}, Thiếu: ${(row.quantity - available).toLocaleString('vi-VN')}.`
        );
      }

      const allocResult = fifoEngine.previewFifoAllocation(row.sku, row.quantity, workingLayers, {
        issueId: 'PREVIEW',
        issueCode: 'PX-PREVIEW',
        productName: prod?.name,
        salePrice: row.salePrice,
        branchId: selectedBranchId,
        warehouseId: selectedWarehouseId
      });

      workingLayers = allocResult.updatedLayers;
      previewMap[row.sku] = allocResult;
      cogsSum += allocResult.totalCost;
      revSum += row.quantity * row.salePrice;
    }

    return {
      previewAllocationsBySku: previewMap,
      validationErrors: errors,
      totalCogs: cogsSum,
      totalRevenue: revSum
    };
  }, [rows, inventoryLots, products, selectedBranchId, selectedWarehouseId, currentWarehouse]);

  const canSave = validationErrors.length === 0 && rows.length > 0 && receiverName.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    const issueItems: StockIssueItem[] = rows.map((r) => {
      const prod = products.find((p) => p.sku === r.sku);
      const alloc = previewAllocationsBySku[r.sku];
      return {
        sku: r.sku,
        productId: prod?.productId || `P-${r.sku}`,
        productName: prod?.name || r.sku,
        unit: prod?.unit || 'đơn vị',
        quantity: Number(r.quantity),
        salePrice: Number(r.salePrice),
        fifoCost: alloc ? alloc.totalCost : 0,
        fifoAllocations: alloc ? alloc.allocations : [],
        note: r.note
      };
    });

    const newIssue: StockIssue = {
      id: `issue-${Date.now()}`,
      code: `PX-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
      issueType,
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      branchId: selectedBranchId,
      branchName: currentBranch?.name || 'Chi nhánh Chính',
      warehouseId: selectedWarehouseId,
      warehouseName: currentWarehouse?.name || 'Kho Tổng',
      issueDate: issueDate || new Date().toISOString().substring(0, 16).replace('T', ' '),
      status: 'completed',
      items: issueItems,
      totalQuantity: rows.reduce((s, r) => s + Number(r.quantity), 0),
      totalCostAmount: totalCogs,
      totalRevenueAmount: totalRevenue,
      note: note.trim(),
      createdBy: 'Nguyễn Văn An (Kho)',
      createdAt: new Date().toISOString()
    };

    onSaveIssue(newIssue);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Chứng từ Xuất Kho
              </span>
              <h2 className="text-lg font-black tracking-tight">Tạo Phiếu Xuất Hàng (Strict FIFO)</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center text-sm font-bold transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Top Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Loại xuất kho *</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as StockIssueType)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Bán hàng">Bán hàng</option>
                <option value="Xuất nội bộ">Xuất nội bộ</option>
                <option value="Xuất chuyển kho">Xuất chuyển kho</option>
                <option value="Hàng lỗi">Hàng lỗi</option>
                <option value="Hủy hàng">Hủy hàng</option>
                <option value="Điều chỉnh">Điều chỉnh</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chi nhánh xuất *</label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kho xuất hàng *</label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian xuất *</label>
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Người nhận / Khách hàng *
              </label>
              <div className="flex gap-2">
                {customers.length > 0 && (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-1/2 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="">-- Chọn khách hàng sẵn có --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  placeholder="Nhập tên người nhận / đơn vị..."
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="flex-1 text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú phiếu xuất</label>
              <input
                type="text"
                placeholder="Ví dụ: Xuất theo đơn hàng ORD-1024, dự án..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
              />
            </div>
          </div>

          {/* Product Rows Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Danh sách Sản phẩm Xuất & Phân bổ Lớp FIFO
              </h3>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition"
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
                    <th className="py-2.5 px-3 text-center">Tồn khả dụng</th>
                    <th className="py-2.5 px-3 text-right">SL Xuất</th>
                    <th className="py-2.5 px-3 text-right">Giá bán</th>
                    <th className="py-2.5 px-3 text-right">Thành tiền</th>
                    <th className="py-2.5 px-3 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const prod = products.find((p) => p.sku === row.sku);
                    const available = fifoEngine.getTotalAvailableStock(inventoryLots, row.sku, {
                      branchId: selectedBranchId,
                      warehouseId: selectedWarehouseId
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
                            className={`w-24 text-right text-xs font-mono font-bold border rounded-lg px-2.5 py-1.5 ${
                              isOverStock
                                ? 'border-rose-400 bg-rose-50 text-rose-700'
                                : 'border-slate-200 bg-white text-slate-900'
                            }`}
                          />
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            value={row.salePrice}
                            onChange={(e) => handleRowChange(row.id, 'salePrice', Number(e.target.value))}
                            className="w-28 text-right text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5"
                          />
                        </td>

                        <td className="py-2.5 px-3 text-right font-black font-mono text-slate-900">
                          {(row.quantity * row.salePrice).toLocaleString('vi-VN')} đ
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

          {/* Real-Time FIFO Allocation Preview Breakdown */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-600" />
                Xem trước Phân bổ Lớp FIFO & Giá Vốn COGS Tự động
              </span>
              <span className="text-[11px] text-indigo-600 font-semibold">
                Hệ thống tự động trừ từ các lớp có ngày nhập sớm nhất
              </span>
            </div>

            {Object.keys(previewAllocationsBySku).map((sku) => {
              const allocResult = previewAllocationsBySku[sku];
              const prod = products.find((p) => p.sku === sku);

              return (
                <div key={sku} className="p-3 bg-white rounded-xl border border-indigo-100 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-700 font-mono">{sku}</span>
                      <span>{prod?.name}</span>
                    </div>
                    <div className="text-indigo-900">
                      Giá vốn FIFO: <span className="font-mono font-black">{allocResult.totalCost.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>

                  {allocResult.allocations.length > 0 ? (
                    <div className="space-y-1.5 pl-2 border-l-2 border-indigo-400">
                      {allocResult.allocations.map((a: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                          <span className="font-mono">
                            ↳ Lớp: <strong className="text-blue-800">{a.layerId}</strong> (từ PO: {a.sourceReceiptCode || 'N/A'})
                          </span>
                          <span className="font-mono text-slate-700">
                            {a.quantity} {prod?.unit || 'đv'} × {a.purchasePrice.toLocaleString('vi-VN')} đ ={' '}
                            <strong className="text-indigo-950 font-bold">{a.costAmount.toLocaleString('vi-VN')} đ</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-rose-500 italic">
                      Chưa có lớp khả dụng để phân bổ.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Validation Warnings */}
          {validationErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1 text-xs text-rose-800 font-medium">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Cảnh báo không thể lưu phiếu xuất:
              </div>
              {validationErrors.map((err, i) => (
                <div key={i} className="pl-5">
                  • {err}
                </div>
              ))}
            </div>
          )}

          {/* Summary & Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-slate-500">Tổng doanh thu xuất:</span>
                <div className="text-base font-black text-slate-900 font-mono">
                  {totalRevenue.toLocaleString('vi-VN')} đ
                </div>
              </div>
              <div>
                <span className="text-slate-500">Tổng giá vốn FIFO:</span>
                <div className="text-base font-black text-indigo-900 font-mono">
                  {totalCogs.toLocaleString('vi-VN')} đ
                </div>
              </div>
              <div>
                <span className="text-slate-500">Lợi nhuận gộp dự kiến:</span>
                <div className="text-base font-black text-emerald-700 font-mono">
                  {(totalRevenue - totalCogs).toLocaleString('vi-VN')} đ
                </div>
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
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Lưu & Xuất kho FIFO
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
