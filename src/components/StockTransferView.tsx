import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Search,
  Filter,
  Plus,
  Download,
  Warehouse as WarehouseIcon,
  Eye,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { StockTransfer, Warehouse, Branch, Product } from '../types';

interface StockTransferViewProps {
  stockTransfers: StockTransfer[];
  warehouses: Warehouse[];
  branches: Branch[];
  products: Product[];
  onOpenCreateTransfer: () => void;
}

export const StockTransferView: React.FC<StockTransferViewProps> = ({
  stockTransfers = [],
  warehouses = [],
  branches = [],
  products = [],
  onOpenCreateTransfer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSourceWh, setSelectedSourceWh] = useState('all');
  const [selectedDestWh, setSelectedDestWh] = useState('all');
  const [selectedTransferDetail, setSelectedTransferDetail] = useState<StockTransfer | null>(null);

  const filteredTransfers = stockTransfers.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = t.code.toLowerCase().includes(q);
      const matchNote = (t.note || '').toLowerCase().includes(q);
      const matchSku = t.items.some((item) => item.sku.toLowerCase().includes(q) || item.productName.toLowerCase().includes(q));
      if (!matchCode && !matchNote && !matchSku) return false;
    }

    if (selectedSourceWh !== 'all' && t.sourceWarehouseId !== selectedSourceWh) return false;
    if (selectedDestWh !== 'all' && t.destWarehouseId !== selectedDestWh) return false;

    return true;
  });

  const totalTransferCount = filteredTransfers.length;
  const totalTransferQty = filteredTransfers.reduce((sum, t) => sum + (t.totalQuantity || 0), 0);
  const totalTransferVal = filteredTransfers.reduce((sum, t) => sum + (t.totalValue || 0), 0);

  const handleExportExcel = () => {
    const headers = ['Mã phiếu', 'Ngày chuyển', 'Kho nguồn', 'Kho đích', 'Tổng SL', 'Tổng giá trị FIFO', 'Trạng thái', 'Ghi chú'];
    const rows = filteredTransfers.map((t) => [
      t.code,
      t.transferDate,
      `"${t.sourceWarehouseName}"`,
      `"${t.destWarehouseName}"`,
      t.totalQuantity,
      t.totalValue || 0,
      t.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý',
      `"${(t.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Phieu_chuyen_kho_${new Date().toISOString().split('T')[0]}.csv`);
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
            Chuyển kho
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
            onClick={onOpenCreateTransfer}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tạo phiếu chuyển kho
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TỔNG ĐỢT ĐIỀU CHUYỂN</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalTransferCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Phiếu đã hoàn tất</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TỔNG SỐ LƯỢNG ĐIỀU CHUYỂN</div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {totalTransferQty.toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] text-purple-600 font-semibold mt-0.5">Sản phẩm / Đơn vị</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TỔNG GIÁ TRỊ LUÂN CHUYỂN</div>
          <div className="text-2xl font-black text-indigo-900 mt-1">
            {totalTransferVal.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">Bảo toàn giá vốn từng lớp</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Mã CK, SKU, Tên sản phẩm, Ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedSourceWh}
              onChange={(e) => setSelectedSourceWh(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
            >
              <option value="all">Tất cả kho nguồn</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  Từ: {wh.name}
                </option>
              ))}
            </select>

            <select
              value={selectedDestWh}
              onChange={(e) => setSelectedDestWh(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
            >
              <option value="all">Tất cả kho đích</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  Đến: {wh.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Mã chuyển kho</th>
                <th className="py-3 px-3.5">Ngày chuyển</th>
                <th className="py-3 px-3.5">Kho nguồn (Xuất)</th>
                <th className="py-3 px-3.5 text-center">→</th>
                <th className="py-3 px-3.5">Kho đích (Nhập)</th>
                <th className="py-3 px-3.5 text-right">Tổng SL</th>
                <th className="py-3 px-3.5 text-right">Tổng giá trị FIFO</th>
                <th className="py-3 px-3.5 text-center">Trạng thái</th>
                <th className="py-3 px-3.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Chưa có phiếu chuyển kho nào.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3.5 font-mono font-bold text-purple-700">{t.code}</td>
                    <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">{t.transferDate}</td>
                    <td className="py-3 px-3.5 font-semibold text-slate-800">
                      {t.sourceWarehouseName}
                      <span className="text-[10px] text-slate-400 block">{t.sourceBranchName}</span>
                    </td>
                    <td className="py-3 px-3.5 text-center text-slate-400">
                      <ArrowRight className="w-4 h-4 mx-auto text-purple-500" />
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-slate-800">
                      {t.destWarehouseName}
                      <span className="text-[10px] text-slate-400 block">{t.destBranchName}</span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-black font-mono text-slate-900">
                      {t.totalQuantity.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-indigo-900">
                      {(t.totalValue || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        Hoàn thành
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <button
                        onClick={() => setSelectedTransferDetail(t)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition"
                        title="Xem chi tiết phiếu chuyển"
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

      {/* Modal Detail */}
      {selectedTransferDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                  Chi tiết Phiếu Chuyển Kho
                </span>
                <h3 className="text-lg font-black text-slate-900">{selectedTransferDetail.code}</h3>
              </div>
              <button
                onClick={() => setSelectedTransferDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50/50 rounded-xl">
                <div>
                  <span className="text-slate-400">Kho nguồn:</span>
                  <div className="font-bold text-slate-900">{selectedTransferDetail.sourceWarehouseName}</div>
                </div>
                <div>
                  <span className="text-slate-400">Kho đích:</span>
                  <div className="font-bold text-slate-900">{selectedTransferDetail.destWarehouseName}</div>
                </div>
                <div>
                  <span className="text-slate-400">Ngày chuyển:</span>
                  <div className="font-semibold text-slate-800">{selectedTransferDetail.transferDate}</div>
                </div>
                <div>
                  <span className="text-slate-400">Người thực hiện:</span>
                  <div className="font-semibold text-slate-800">{selectedTransferDetail.createdBy}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Mặt hàng điều chuyển:</h4>
                <div className="space-y-1.5">
                  {selectedTransferDetail.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{item.productName}</span>
                        <span className="text-[11px] text-slate-400 font-mono ml-2">({item.sku})</span>
                      </div>
                      <div className="font-black font-mono text-purple-800">
                        {item.quantity} {item.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTransferDetail(null)}
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
