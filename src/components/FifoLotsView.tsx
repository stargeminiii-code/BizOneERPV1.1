import React, { useState } from 'react';
import {
  Layers,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  Warehouse as WarehouseIcon,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowUpDown,
  History,
  Zap
} from 'lucide-react';
import { InventoryLayer, Product, Warehouse, Branch } from '../types';

interface FifoLotsViewProps {
  inventoryLots: InventoryLayer[];
  products: Product[];
  warehouses: Warehouse[];
  branches: Branch[];
  onOpenStockCard?: (sku: string) => void;
  onOpenSyncEInvoice?: () => void;
}

export const FifoLotsView: React.FC<FifoLotsViewProps> = ({
  inventoryLots = [],
  products = [],
  warehouses = [],
  branches = [],
  onOpenStockCard,
  onOpenSyncEInvoice
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // 'all', 'active', 'exhausted'
  const [selectedLayerDetail, setSelectedLayerDetail] = useState<InventoryLayer | null>(null);

  // Filter and sort by receivedAt ASC (earliest first by default for strict FIFO)
  const filteredAndSortedLayers = [...inventoryLots]
    .filter((layer) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSku = layer.sku.toLowerCase().includes(q);
        const matchName = layer.productName.toLowerCase().includes(q);
        const matchLot = (layer.layerId || layer.lotId || '').toLowerCase().includes(q);
        const matchPo = (layer.receiptCode || layer.poCode || '').toLowerCase().includes(q);
        const matchSupplier = (layer.supplierName || '').toLowerCase().includes(q);
        if (!matchSku && !matchName && !matchLot && !matchPo && !matchSupplier) return false;
      }

      // Warehouse
      if (selectedWarehouse !== 'all' && layer.warehouseId !== selectedWarehouse && layer.warehouse !== selectedWarehouse) {
        return false;
      }

      // Branch
      if (selectedBranch !== 'all' && layer.branchId && layer.branchId !== selectedBranch) {
        return false;
      }

      // Status
      if (selectedStatus === 'active' && layer.quantityRemaining <= 0) return false;
      if (selectedStatus === 'exhausted' && layer.quantityRemaining > 0) return false;

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.receivedAt || a.intakeDate || a.createdAt).getTime();
      const dateB = new Date(b.receivedAt || b.intakeDate || b.createdAt).getTime();
      return dateA - dateB; // ASCENDING: Earliest First
    });

  // Calculate totals with bulletproof NaN safeguards
  const totalLayers = filteredAndSortedLayers.length;
  const activeLayersCount = filteredAndSortedLayers.filter((l) => {
    const qty = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0);
    return !isNaN(qty) && qty > 0;
  }).length;

  const totalRemainingQuantity = filteredAndSortedLayers.reduce((sum, l) => {
    const qty = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0);
    return sum + (isNaN(qty) ? 0 : qty);
  }, 0);

  const totalFifoValue = filteredAndSortedLayers.reduce((sum, l) => {
    const qty = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0);
    const price = Number(l.purchasePrice ?? l.costPrice ?? 0);
    const validQty = isNaN(qty) ? 0 : qty;
    const validPrice = isNaN(price) ? 0 : price;
    return sum + validQty * validPrice;
  }, 0);

  const handleExportExcel = () => {
    const headers = ['Mã Lớp', 'SKU', 'Tên sản phẩm', 'Ngày nhập', 'Phiếu nhập', 'Nhà cung cấp', 'Kho', 'SL Nhập', 'Đã xuất', 'Tồn còn', 'Giá nhập', 'Giá bán', 'Giá trị tồn', 'Trạng thái'];
    const rows = filteredAndSortedLayers.map((l) => [
      l.layerId || l.lotId,
      l.sku,
      `"${l.productName.replace(/"/g, '""')}"`,
      l.receivedAt || l.intakeDate,
      l.receiptCode || l.poCode || '',
      `"${(l.supplierName || '').replace(/"/g, '""')}"`,
      `"${(l.warehouseName || l.warehouse || '').replace(/"/g, '""')}"`,
      l.quantityReceived || l.initialQuantity,
      l.quantityIssued,
      l.quantityRemaining,
      l.purchasePrice || l.costPrice,
      l.salePrice,
      l.quantityRemaining * (l.purchasePrice || l.costPrice || 0),
      l.quantityRemaining > 0 ? 'Còn hàng' : 'Đã xuất hết'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_cao_Lop_FIFO_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Lô & FIFO
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSyncEInvoice && (
            <button
              onClick={onOpenSyncEInvoice}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer"
              title="Đồng bộ lô hàng từ hóa đơn điện tử đối tác"
            >
              <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Đồng Bộ HĐĐT Đối Tác</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Xuất Excel Lô FIFO
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TỔNG LỚP FIFO</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalLayers} <span className="text-xs font-normal text-slate-400">lớp</span></div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {activeLayersCount} lớp đang còn tồn
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TỔNG LƯỢNG TỒN KHẢ DỤNG</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {totalRemainingQuantity.toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tổng số lượng các lớp</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">GIÁ TRỊ TỒN THEO LỚP FIFO</div>
          <div className="text-2xl font-black text-blue-900 mt-1">
            {totalFifoValue.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
            Tính theo đơn giá gốc từng lần nhập
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase">TIÊU CHUẨN XUẤT HÀNG</div>
          <div className="text-lg font-black text-purple-700 mt-1.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
            Strict FIFO 100%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tự động trừ lớp sớm nhất</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Mã Lớp, SKU, Tên sản phẩm, Mã PO, Nhà cung cấp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả kho hàng</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">🟢 Đang còn tồn</option>
              <option value="exhausted">⚪ Đã xuất hết</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main FIFO Layers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Thứ tự FIFO</th>
                <th className="py-3 px-3.5">Mã Lớp (Layer ID)</th>
                <th className="py-3 px-3.5">SKU & Sản phẩm</th>
                <th className="py-3 px-3.5">Chứng từ Nhập</th>
                <th className="py-3 px-3.5">Ngày nhập</th>
                <th className="py-3 px-3.5">Kho hàng</th>
                <th className="py-3 px-3.5 text-right">SL Nhập</th>
                <th className="py-3 px-3.5 text-right">Đã xuất</th>
                <th className="py-3 px-3.5 text-right font-bold text-slate-800">Tồn còn</th>
                <th className="py-3 px-3.5 text-right">Giá nhập</th>
                <th className="py-3 px-3.5 text-right">Giá bán</th>
                <th className="py-3 px-3.5 text-right">Giá trị tồn</th>
                <th className="py-3 px-3.5 text-center">Trạng thái</th>
                <th className="py-3 px-3.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedLayers.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400 text-xs">
                    Không tìm thấy lớp tồn kho FIFO nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredAndSortedLayers.map((layer, index) => {
                  const unitCost = Number(layer.purchasePrice ?? layer.costPrice ?? 0) || 0;
                  const remQty = Number(layer.quantityRemaining ?? layer.remainingQuantity ?? 0) || 0;
                  const layerRemainingVal = remQty * unitCost;
                  const isAvailable = remQty > 0;

                  return (
                    <tr
                      key={layer.id}
                      className={`hover:bg-blue-50/30 transition ${
                        isAvailable ? 'bg-white' : 'bg-slate-50/50 opacity-60'
                      }`}
                    >
                      {/* FIFO Priority Index */}
                      <td className="py-3 px-3.5 font-bold text-center">
                        {isAvailable ? (
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] inline-flex items-center justify-center font-mono">
                            #{index + 1}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[10px]">-</span>
                        )}
                      </td>

                      {/* Layer ID */}
                      <td className="py-3 px-3.5 font-mono">
                        <div className="font-bold text-blue-700">{layer.layerId || layer.lotId}</div>
                        {(layer.eInvoiceNumber || layer.invoiceNumber || layer.layerId?.includes('HD') || layer.receiptCode?.includes('HD')) && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-black bg-amber-50 text-amber-800 border border-amber-200 mt-0.5">
                            <Zap className="w-2.5 h-2.5 text-amber-600" />
                            HĐĐT #{layer.eInvoiceNumber || layer.invoiceNumber || layer.receiptCode?.replace('PO-HD', '') || 'SYNC'}
                          </span>
                        )}
                      </td>

                      {/* SKU & Product */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">{layer.productName}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                          <span>SKU: {layer.sku}</span>
                          {layer.variantName && (
                            <span className="text-purple-600 bg-purple-50 px-1 rounded text-[10px]">
                              {layer.variantName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Receipt PO */}
                      <td className="py-3 px-3.5 font-mono text-slate-600">
                        {layer.receiptCode || layer.poCode || 'Tồn đầu kỳ'}
                        {layer.supplierName && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {layer.supplierName}
                          </div>
                        )}
                      </td>

                      {/* Received Date */}
                      <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">
                        <div className="font-semibold">{layer.receivedAt || layer.intakeDate}</div>
                        {layer.expiryDate && (
                          <div className="text-[10px] text-amber-600">HSD: {layer.expiryDate}</div>
                        )}
                      </td>

                      {/* Warehouse */}
                      <td className="py-3 px-3.5 text-slate-600">
                        {layer.warehouseName || layer.warehouse || 'Kho Tổng'}
                      </td>

                      {/* Quantities */}
                      <td className="py-3 px-3.5 text-right text-slate-600 font-mono">
                        {(layer.quantityReceived || layer.initialQuantity || 0).toLocaleString('vi-VN')} {layer.unit}
                      </td>
                      <td className="py-3 px-3.5 text-right text-slate-500 font-mono">
                        {(layer.quantityIssued || 0).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-3.5 text-right font-black font-mono text-emerald-700 text-sm">
                        {(layer.quantityRemaining ?? layer.remainingQuantity ?? 0).toLocaleString('vi-VN')} {layer.unit}
                      </td>

                      {/* Prices */}
                      <td className="py-3 px-3.5 text-right font-mono text-slate-800">
                        {unitCost.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-slate-500">
                        {(layer.salePrice || 0).toLocaleString('vi-VN')} đ
                      </td>

                      {/* Layer Valuation */}
                      <td className="py-3 px-3.5 text-right font-bold font-mono text-indigo-900">
                        {layerRemainingVal.toLocaleString('vi-VN')} đ
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 text-center">
                        {isAvailable ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Khả dụng
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            Đã xuất hết
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedLayerDetail(layer)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 transition"
                            title="Xem chi tiết lớp FIFO"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {onOpenStockCard && (
                            <button
                              onClick={() => onOpenStockCard(layer.sku)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition"
                              title="Xem thẻ kho SKU"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Layer Detail Modal */}
      {selectedLayerDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Chi tiết Lớp FIFO</span>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedLayerDetail.layerId || selectedLayerDetail.lotId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLayerDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400">Sản phẩm:</span>
                  <div className="font-bold text-slate-900">{selectedLayerDetail.productName}</div>
                </div>
                <div>
                  <span className="text-slate-400">SKU Variant:</span>
                  <div className="font-mono font-bold text-blue-700">{selectedLayerDetail.sku}</div>
                </div>
                <div>
                  <span className="text-slate-400">Chứng từ Nhập / PO:</span>
                  <div className="font-mono font-semibold text-slate-800">
                    {selectedLayerDetail.receiptCode || selectedLayerDetail.poCode || 'Tồn đầu kỳ'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Ngày nhập (receivedAt):</span>
                  <div className="font-semibold text-slate-800">
                    {selectedLayerDetail.receivedAt || selectedLayerDetail.intakeDate}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Nhà cung cấp:</span>
                  <div className="font-semibold text-slate-800">
                    {selectedLayerDetail.supplierName || 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Kho lưu trữ:</span>
                  <div className="font-semibold text-slate-800">
                    {selectedLayerDetail.warehouseName || selectedLayerDetail.warehouse}
                  </div>
                </div>
              </div>

              {/* Quantitative Metrics */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-slate-100">
                  <div className="text-[11px] text-slate-500 font-semibold">SL Ban đầu</div>
                  <div className="text-base font-black text-slate-800 mt-0.5">
                    {(selectedLayerDetail.quantityReceived || selectedLayerDetail.initialQuantity || 0).toLocaleString('vi-VN')} {selectedLayerDetail.unit}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <div className="text-[11px] text-blue-600 font-semibold">Đã xuất FIFO</div>
                  <div className="text-base font-black text-blue-800 mt-0.5">
                    {(selectedLayerDetail.quantityIssued || 0).toLocaleString('vi-VN')} {selectedLayerDetail.unit}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50">
                  <div className="text-[11px] text-emerald-700 font-semibold">Tồn khả dụng</div>
                  <div className="text-base font-black text-emerald-700 mt-0.5">
                    {(selectedLayerDetail.quantityRemaining ?? selectedLayerDetail.remainingQuantity ?? 0).toLocaleString('vi-VN')} {selectedLayerDetail.unit}
                  </div>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-indigo-600 font-semibold">Đơn giá vốn gốc (Inward Cost):</span>
                  <div className="text-sm font-black text-indigo-950 font-mono">
                    {(selectedLayerDetail.purchasePrice || selectedLayerDetail.costPrice || 0).toLocaleString('vi-VN')} đ / {selectedLayerDetail.unit}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-indigo-600 font-semibold">Giá trị tồn lớp:</span>
                  <div className="text-base font-black text-indigo-900 font-mono">
                    {(
                      (selectedLayerDetail.quantityRemaining ?? selectedLayerDetail.remainingQuantity ?? 0) *
                      (selectedLayerDetail.purchasePrice || selectedLayerDetail.costPrice || 0)
                    ).toLocaleString('vi-VN')}{' '}
                    đ
                  </div>
                </div>
              </div>

              {selectedLayerDetail.notes && (
                <div className="text-[11px] text-slate-500 italic">
                  Ghi chú: {selectedLayerDetail.notes}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLayerDetail(null)}
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
