import React, { useState } from 'react';
import {
  X,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Warehouse as WarehouseIcon,
  Search,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Info
} from 'lucide-react';
import {
  Product,
  InventoryLayer,
  Stocktake,
  StocktakeItem,
  Warehouse,
  Branch
} from '../../types';
import { fifoEngine } from '../../services/fifoEngine';

interface StocktakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  inventoryLots: InventoryLayer[];
  warehouses: Warehouse[];
  branches: Branch[];
  onSaveStocktake: (stocktake: Stocktake) => void;
}

interface StocktakeRow {
  sku: string;
  systemQty: number;
  actualQty: number;
  costPrice: number;
  note?: string;
}

export const StocktakeModal: React.FC<StocktakeModalProps> = ({
  isOpen,
  onClose,
  products = [],
  inventoryLots = [],
  warehouses = [],
  branches = [],
  onSaveStocktake
}) => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || 'WH01');
  const [stocktakeDate, setStocktakeDate] = useState(new Date().toISOString().substring(0, 10));
  const [note, setNote] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const currentWarehouse = warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];
  const currentBranch = branches.find((b) => b.id === currentWarehouse?.branchId) || branches[0];

  // Initialize stocktake rows with current system quantity from inventoryLots
  const [rows, setRows] = useState<StocktakeRow[]>(() => {
    return products.map((p) => {
      const sysQty = fifoEngine.getTotalAvailableStock(inventoryLots, p.sku, {
        warehouseId: selectedWarehouseId
      });
      return {
        sku: p.sku,
        systemQty: sysQty,
        actualQty: sysQty,
        costPrice: p.costPrice || 0
      };
    });
  });

  // When warehouse changes, refresh system quantities
  const handleWarehouseChange = (whId: string) => {
    setSelectedWarehouseId(whId);
    setRows(
      products.map((p) => {
        const sysQty = fifoEngine.getTotalAvailableStock(inventoryLots, p.sku, {
          warehouseId: whId
        });
        return {
          sku: p.sku,
          systemQty: sysQty,
          actualQty: sysQty,
          costPrice: p.costPrice || 0
        };
      })
    );
  };

  const handleActualQtyChange = (sku: string, actualVal: number) => {
    setRows(
      rows.map((r) => {
        if (r.sku !== sku) return r;
        return {
          ...r,
          actualQty: Math.max(0, actualVal)
        };
      })
    );
  };

  const handleReasonChange = (sku: string, noteVal: string) => {
    setRows(
      rows.map((r) => {
        if (r.sku !== sku) return r;
        return { ...r, note: noteVal };
      })
    );
  };

  const filteredRows = rows.filter((r) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const prod = products.find((p) => p.sku === r.sku);
    return r.sku.toLowerCase().includes(q) || (prod?.name || '').toLowerCase().includes(q);
  });

  // Diff summary
  const diffItems = rows.filter((r) => r.actualQty !== r.systemQty);
  const totalIncreaseQty = diffItems
    .filter((r) => r.actualQty > r.systemQty)
    .reduce((s, r) => s + (r.actualQty - r.systemQty), 0);
  const totalDecreaseQty = diffItems
    .filter((r) => r.actualQty < r.systemQty)
    .reduce((s, r) => s + (r.systemQty - r.actualQty), 0);
  const totalDiffValue = diffItems.reduce((s, r) => {
    const diff = r.actualQty - r.systemQty;
    return s + diff * r.costPrice;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const stocktakeItems: StocktakeItem[] = rows.map((r) => {
      const prod = products.find((p) => p.sku === r.sku);
      const diffQty = r.actualQty - r.systemQty;
      return {
        sku: r.sku,
        productId: prod?.productId || `P-${r.sku}`,
        productName: prod?.name || r.sku,
        unit: prod?.unit || 'đv',
        systemQuantity: r.systemQty,
        actualQuantity: r.actualQty,
        differenceQuantity: diffQty,
        costPrice: r.costPrice,
        differenceValue: diffQty * r.costPrice,
        reason: r.note
      };
    });

    const newStocktake: Stocktake = {
      id: `stocktake-${Date.now()}`,
      code: `KK-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
      branchId: currentBranch?.id || 'BR01',
      branchName: currentBranch?.name || 'Chi nhánh Chính',
      warehouseId: selectedWarehouseId,
      warehouseName: currentWarehouse?.name || 'Kho Tổng',
      stocktakeDate,
      status: 'completed',
      items: stocktakeItems,
      totalSystemQuantity: rows.reduce((s, r) => s + r.systemQty, 0),
      totalActualQuantity: rows.reduce((s, r) => s + r.actualQty, 0),
      totalDifferenceQuantity: totalIncreaseQty - totalDecreaseQty,
      totalDifferenceValue: totalDiffValue,
      note: note.trim(),
      createdBy: 'Lê Hoàng Nam (Kiểm kê viên)',
      createdAt: new Date().toISOString()
    };

    onSaveStocktake(newStocktake);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                Phiếu Kiểm Kê & Cân Bằng Kho
              </span>
              <h2 className="text-lg font-black tracking-tight">Tạo Phiếu Kiểm Kê Kho Thực Tế</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-amber-800 hover:bg-amber-700 text-amber-200 flex items-center justify-center text-sm font-bold transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Top Config */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kho kiểm kê *</label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-amber-500"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code}) - {w.branchName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày kiểm kê *</label>
              <input
                type="date"
                value={stocktakeDate}
                onChange={(e) => setStocktakeDate(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú đợt kiểm kê</label>
              <input
                type="text"
                placeholder="Kiểm kê định kỳ tháng, cuối quý..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
              />
            </div>
          </div>

          {/* FIFO Compliance Rule Box */}
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Nguyên tắc Bất biến FIFO khi Điều chỉnh:</strong>
              <div className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                Hệ thống không ghi đè số lượng trực tiếp. Nếu <strong>Lệch giảm</strong>: hệ thống tự động sinh bút toán xuất trừ các lớp FIFO cũ nhất. Nếu <strong>Lệch tăng</strong>: hệ thống tự động tạo lớp tồn kho mới mang loại <code>ADJUSTMENT_IN</code> để duy trì chuỗi lịch sử thẻ kho.
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lọc nhanh SKU hoặc Tên sản phẩm trong danh sách kiểm..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Mã SKU</th>
                  <th className="py-2.5 px-3">Tên sản phẩm</th>
                  <th className="py-2.5 px-3 text-right">Tồn hệ thống</th>
                  <th className="py-2.5 px-3 text-right">Thực tế kiểm đếm</th>
                  <th className="py-2.5 px-3 text-right">Chênh lệch</th>
                  <th className="py-2.5 px-3 text-right">Giá trị chênh lệch</th>
                  <th className="py-2.5 px-3">Lý do điều chỉnh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => {
                  const prod = products.find((p) => p.sku === row.sku);
                  const diffQty = row.actualQty - row.systemQty;
                  const diffVal = diffQty * row.costPrice;

                  return (
                    <tr
                      key={row.sku}
                      className={`hover:bg-slate-50 transition ${
                        diffQty !== 0 ? 'bg-amber-50/40' : 'bg-white'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{row.sku}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{prod?.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {row.systemQty.toLocaleString('vi-VN')} {prod?.unit || 'đv'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={row.actualQty}
                          onChange={(e) => handleActualQtyChange(row.sku, Number(e.target.value))}
                          className="w-24 text-right text-xs font-mono font-bold border border-amber-300 bg-white rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-black font-mono">
                        {diffQty > 0 ? (
                          <span className="text-emerald-700 flex items-center justify-end gap-1">
                            <TrendingUp className="w-3.5 h-3.5" /> +{diffQty}
                          </span>
                        ) : diffQty < 0 ? (
                          <span className="text-rose-700 flex items-center justify-end gap-1">
                            <TrendingDown className="w-3.5 h-3.5" /> {diffQty}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span
                          className={
                            diffVal > 0
                              ? 'text-emerald-700'
                              : diffVal < 0
                              ? 'text-rose-700'
                              : 'text-slate-400'
                          }
                        >
                          {diffVal > 0 ? `+${diffVal.toLocaleString('vi-VN')}` : diffVal.toLocaleString('vi-VN')} đ
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          placeholder="Nguyên nhân lệch..."
                          value={row.note || ''}
                          onChange={(e) => handleReasonChange(row.sku, e.target.value)}
                          className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Discrepancy Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-100 rounded-xl text-xs">
            <div>
              <span className="text-slate-500">Số mặt hàng có chênh lệch:</span>
              <div className="text-base font-black text-amber-800 mt-0.5">
                {diffItems.length} / {rows.length} SKU
              </div>
            </div>
            <div>
              <span className="text-slate-500">Tổng lệch tăng / lệch giảm:</span>
              <div className="text-base font-black text-slate-800 mt-0.5 font-mono">
                <span className="text-emerald-700">+{totalIncreaseQty}</span> /{' '}
                <span className="text-rose-700">-{totalDecreaseQty}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-500">Tổng giá trị điều chỉnh chênh lệch:</span>
              <div className="text-base font-black font-mono mt-0.5 text-indigo-900">
                {totalDiffValue > 0 ? `+${totalDiffValue.toLocaleString('vi-VN')}` : totalDiffValue.toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-amber-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Lưu & Cân bằng Tồn kho FIFO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
