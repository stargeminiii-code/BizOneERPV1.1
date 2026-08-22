import React, { useState } from 'react';
import {
  ClipboardCheck,
  Search,
  Filter,
  Plus,
  Download,
  Warehouse as WarehouseIcon,
  Eye,
  Calendar,
  Layers,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { Stocktake, Warehouse, Branch, Product } from '../types';

interface StocktakeViewProps {
  stocktakes: Stocktake[];
  warehouses: Warehouse[];
  branches: Branch[];
  products: Product[];
  onOpenStocktake: () => void;
}

export const StocktakeView: React.FC<StocktakeViewProps> = ({
  stocktakes = [],
  warehouses = [],
  branches = [],
  products = [],
  onOpenStocktake
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedStocktakeDetail, setSelectedStocktakeDetail] = useState<Stocktake | null>(null);

  const filteredStocktakes = stocktakes.filter((st) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = st.code.toLowerCase().includes(q);
      const matchNote = (st.note || '').toLowerCase().includes(q);
      if (!matchCode && !matchNote) return false;
    }
    if (selectedWarehouse !== 'all' && st.warehouseId !== selectedWarehouse) return false;
    return true;
  });

  const handleExportExcel = () => {
    const headers = ['Mã kiểm kê', 'Ngày kiểm kê', 'Kho kiểm kê', 'Chi nhánh', 'SL Hệ thống', 'SL Thực tế', 'Lệch SL', 'Giá trị lệch', 'Trạng thái'];
    const rows = filteredStocktakes.map((st) => [
      st.code,
      st.stocktakeDate,
      `"${st.warehouseName}"`,
      `"${st.branchName}"`,
      st.totalSystemQuantity,
      st.totalActualQuantity,
      st.totalDifferenceQuantity,
      st.totalDifferenceValue || 0,
      'Hoàn thành'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Phieu_kiem_ke_kho_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kiểm kê
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Xuất Excel
          </button>
          <button
            onClick={onOpenStocktake}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tạo phiếu kiểm kê
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TỔNG ĐỢT KIỂM KÊ</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{filteredStocktakes.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Đã cân đối kho</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TỔNG CHÊNH LỆCH SỐ LƯỢNG</div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {filteredStocktakes.reduce((s, st) => s + (st.totalDifferenceQuantity || 0), 0).toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sản phẩm / Đơn vị</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TỔNG GIÁ TRỊ ĐIỀU CHỈNH</div>
          <div className="text-2xl font-black text-indigo-900 mt-1">
            {filteredStocktakes.reduce((s, st) => s + (st.totalDifferenceValue || 0), 0).toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">Đã sinh bút toán FIFO</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Mã phiếu KK, Ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
          >
            <option value="all">Tất cả kho hàng</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Mã kiểm kê</th>
                <th className="py-3 px-3.5">Ngày kiểm</th>
                <th className="py-3 px-3.5">Kho hàng</th>
                <th className="py-3 px-3.5 text-right">SL Sổ sách</th>
                <th className="py-3 px-3.5 text-right">SL Thực tế</th>
                <th className="py-3 px-3.5 text-right">Chênh lệch</th>
                <th className="py-3 px-3.5 text-right">Giá trị chênh lệch</th>
                <th className="py-3 px-3.5 text-center">Trạng thái</th>
                <th className="py-3 px-3.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStocktakes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Chưa có phiếu kiểm kê nào.
                  </td>
                </tr>
              ) : (
                filteredStocktakes.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3.5 font-mono font-bold text-amber-700">{st.code}</td>
                    <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">{st.stocktakeDate}</td>
                    <td className="py-3 px-3.5 font-semibold text-slate-800">
                      {st.warehouseName}
                      <span className="text-[10px] text-slate-400 block">{st.branchName}</span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                      {(st.totalSystemQuantity || 0).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-800">
                      {(st.totalActualQuantity || 0).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-black font-mono">
                      {st.totalDifferenceQuantity > 0 ? (
                        <span className="text-emerald-700">+{st.totalDifferenceQuantity}</span>
                      ) : st.totalDifferenceQuantity < 0 ? (
                        <span className="text-rose-700">{st.totalDifferenceQuantity}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-indigo-900">
                      {(st.totalDifferenceValue || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Đã cân đối
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <button
                        onClick={() => setSelectedStocktakeDetail(st)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 transition"
                        title="Xem chi tiết kiểm kê"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stocktake Detail Modal */}
      {selectedStocktakeDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                  Chi tiết Phiếu Kiểm Kê
                </span>
                <h3 className="text-lg font-black text-slate-900">{selectedStocktakeDetail.code}</h3>
              </div>
              <button
                onClick={() => setSelectedStocktakeDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/50 rounded-xl">
                <div>
                  <span className="text-slate-400">Kho kiểm:</span>
                  <div className="font-bold text-slate-900">{selectedStocktakeDetail.warehouseName}</div>
                </div>
                <div>
                  <span className="text-slate-400">Ngày kiểm:</span>
                  <div className="font-semibold text-slate-800">{selectedStocktakeDetail.stocktakeDate}</div>
                </div>
                <div>
                  <span className="text-slate-400">Người thực hiện:</span>
                  <div className="font-semibold text-slate-800">{selectedStocktakeDetail.createdBy}</div>
                </div>
                <div>
                  <span className="text-slate-400">Chênh lệch ròng:</span>
                  <div className="font-bold font-mono text-amber-800">
                    {selectedStocktakeDetail.totalDifferenceQuantity} đv ({(selectedStocktakeDetail.totalDifferenceValue || 0).toLocaleString('vi-VN')} đ)
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Bảng kiểm kê từng mặt hàng:</h4>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {selectedStocktakeDetail.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{item.productName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          SKU: {item.sku} | Sổ: {item.systemQuantity} → Thực: {item.actualQuantity}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-black font-mono ${
                            item.differenceQuantity > 0
                              ? 'text-emerald-700'
                              : item.differenceQuantity < 0
                              ? 'text-rose-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {item.differenceQuantity > 0 ? `+${item.differenceQuantity}` : item.differenceQuantity} {item.unit}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {(item.differenceValue || 0).toLocaleString('vi-VN')} đ
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedStocktakeDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
