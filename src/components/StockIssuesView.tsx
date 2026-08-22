import React, { useState } from 'react';
import {
  ArrowUpRight,
  Search,
  Filter,
  Plus,
  Download,
  Calendar,
  Layers,
  FileText,
  User,
  Warehouse as WarehouseIcon,
  Building2,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { StockIssue, Branch, Warehouse, Product } from '../types';

interface StockIssuesViewProps {
  stockIssues: StockIssue[];
  branches: Branch[];
  warehouses: Warehouse[];
  products: Product[];
  onOpenCreateIssue: () => void;
}

export const StockIssuesView: React.FC<StockIssuesViewProps> = ({
  stockIssues = [],
  branches = [],
  warehouses = [],
  products = [],
  onOpenCreateIssue
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedIssueDetail, setSelectedIssueDetail] = useState<StockIssue | null>(null);

  const filteredIssues = stockIssues.filter((issue) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = issue.code.toLowerCase().includes(q);
      const matchReceiver = (issue.receiverName || '').toLowerCase().includes(q);
      const matchNote = (issue.note || '').toLowerCase().includes(q);
      const matchSku = issue.items.some((item) => item.sku.toLowerCase().includes(q) || item.productName.toLowerCase().includes(q));
      if (!matchCode && !matchReceiver && !matchNote && !matchSku) return false;
    }

    if (selectedBranch !== 'all' && issue.branchId && issue.branchId !== selectedBranch) return false;
    if (selectedWarehouse !== 'all' && issue.warehouseId && issue.warehouseId !== selectedWarehouse) return false;
    if (selectedType !== 'all' && issue.issueType !== selectedType) return false;

    return true;
  });

  const totalIssueCount = filteredIssues.length;
  const totalIssueQuantity = filteredIssues.reduce((sum, issue) => sum + (issue.totalQuantity || 0), 0);
  const totalIssueCost = filteredIssues.reduce((sum, issue) => sum + (issue.totalCostAmount || 0), 0);
  const totalIssueRevenue = filteredIssues.reduce((sum, issue) => sum + (issue.totalRevenueAmount || 0), 0);

  const handleExportExcel = () => {
    const headers = ['Mã phiếu', 'Ngày xuất', 'Loại xuất', 'Người nhận', 'Chi nhánh', 'Kho xuất', 'Tổng SL', 'Tổng giá vốn FIFO', 'Tổng doanh thu', 'Trạng thái'];
    const rows = filteredIssues.map((iss) => [
      iss.code,
      iss.issueDate,
      `"${iss.issueType}"`,
      `"${(iss.receiverName || '').replace(/"/g, '""')}"`,
      `"${iss.branchName || ''}"`,
      `"${iss.warehouseName || ''}"`,
      iss.totalQuantity,
      iss.totalCostAmount || 0,
      iss.totalRevenueAmount || 0,
      iss.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh_sach_phieu_xuat_kho_${new Date().toISOString().split('T')[0]}.csv`);
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
            Xuất kho
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
            onClick={onOpenCreateIssue}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tạo phiếu xuất mới
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TỔNG PHIẾU XUẤT</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalIssueCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Chứng từ đã lập</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TỔNG LƯỢNG XUẤT</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {totalIssueQuantity.toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sản phẩm / Đơn vị</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TỔNG GIÁ VỐN FIFO (COGS)</div>
          <div className="text-2xl font-black text-indigo-900 mt-1">
            {totalIssueCost.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">
            Cấn trừ từ lớp nhập tương ứng
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">DOANH THU & LỢI NHUẬN GỘP</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            {(totalIssueRevenue - totalIssueCost).toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Doanh thu: {totalIssueRevenue.toLocaleString('vi-VN')} đ
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Mã phiếu PX, Người nhận, SKU, Tên sản phẩm, Ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
            >
              <option value="all">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

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

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
            >
              <option value="all">Tất cả loại xuất</option>
              <option value="Bán hàng">Bán hàng</option>
              <option value="Xuất nội bộ">Xuất nội bộ</option>
              <option value="Xuất chuyển kho">Xuất chuyển kho</option>
              <option value="Hủy hàng">Hủy hàng</option>
              <option value="Hàng lỗi">Hàng lỗi</option>
              <option value="Điều chỉnh">Điều chỉnh</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Mã phiếu xuất</th>
                <th className="py-3 px-3.5">Thời gian</th>
                <th className="py-3 px-3.5">Loại xuất</th>
                <th className="py-3 px-3.5">Người nhận / Khách hàng</th>
                <th className="py-3 px-3.5">Kho xuất hàng</th>
                <th className="py-3 px-3.5 text-right">Tổng SL</th>
                <th className="py-3 px-3.5 text-right">Giá vốn FIFO</th>
                <th className="py-3 px-3.5 text-right">Doanh thu</th>
                <th className="py-3 px-3.5 text-center">Trạng thái</th>
                <th className="py-3 px-3.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                    Chưa có phiếu xuất kho nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3.5 font-mono font-bold text-emerald-700">
                      {issue.code}
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">
                      {issue.issueDate}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {issue.issueType}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-900">{issue.receiverName}</div>
                      {issue.receiverPhone && (
                        <div className="text-[11px] text-slate-400">{issue.receiverPhone}</div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600">
                      {issue.warehouseName}
                      <span className="text-[10px] text-slate-400 block">{issue.branchName}</span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-black font-mono text-slate-900">
                      {issue.totalQuantity.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-indigo-900">
                      {(issue.totalCostAmount || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-700">
                      {(issue.totalRevenueAmount || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Hoàn thành
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <button
                        onClick={() => setSelectedIssueDetail(issue)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition"
                        title="Xem chi tiết phân bổ FIFO"
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

      {/* Stock Issue Detail Modal */}
      {selectedIssueDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  Chi tiết Phiếu Xuất & Phân bổ FIFO
                </span>
                <h3 className="text-lg font-black text-slate-900">{selectedIssueDetail.code}</h3>
              </div>
              <button
                onClick={() => setSelectedIssueDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400">Người nhận / Khách hàng:</span>
                  <div className="font-bold text-slate-900">{selectedIssueDetail.receiverName}</div>
                </div>
                <div>
                  <span className="text-slate-400">Loại xuất:</span>
                  <div className="font-semibold text-slate-800">{selectedIssueDetail.issueType}</div>
                </div>
                <div>
                  <span className="text-slate-400">Kho xuất:</span>
                  <div className="font-semibold text-slate-800">
                    {selectedIssueDetail.warehouseName} ({selectedIssueDetail.branchName})
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Ngày xuất:</span>
                  <div className="font-semibold text-slate-800">{selectedIssueDetail.issueDate}</div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Mặt hàng & Chi tiết Lớp FIFO đã trừ:
                </h4>

                {selectedIssueDetail.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <div>
                        <span>{item.productName}</span>
                        <span className="text-slate-400 font-mono text-[11px] ml-2">({item.sku})</span>
                      </div>
                      <div className="text-right">
                        <span>
                          {item.quantity} {item.unit} × {(item.salePrice || 0).toLocaleString('vi-VN')} đ ={' '}
                          <strong className="text-emerald-700">
                            {(item.quantity * (item.salePrice || 0)).toLocaleString('vi-VN')} đ
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[11px] font-bold text-indigo-700 uppercase">
                        Các lớp FIFO cấn trừ (Giá vốn: {(item.fifoCost || 0).toLocaleString('vi-VN')} đ):
                      </span>
                      {item.fifoAllocations && item.fifoAllocations.length > 0 ? (
                        <div className="mt-1.5 space-y-1">
                          {item.fifoAllocations.map((alloc, aIdx) => (
                            <div
                              key={aIdx}
                              className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded"
                            >
                              <span className="font-mono">
                                ↳ Lớp: <strong className="text-blue-700">{alloc.layerId}</strong> (PO: {alloc.sourceReceiptCode || 'N/A'})
                              </span>
                              <span className="font-mono">
                                {alloc.quantity} {item.unit} × {(alloc.purchasePrice || 0).toLocaleString('vi-VN')} đ ={' '}
                                <strong className="text-indigo-900">{(alloc.costAmount || 0).toLocaleString('vi-VN')} đ</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">Được xuất từ kho chung</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedIssueDetail(null)}
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
