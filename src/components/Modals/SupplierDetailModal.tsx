import React, { useState, useMemo } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Briefcase,
  Globe,
  Calendar,
  Truck,
  FileText,
  DollarSign,
  Package,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ExternalLink,
  ShieldCheck,
  Building
} from 'lucide-react';
import { Supplier, PurchaseOrder, Product, InventoryLayer, Branch, Warehouse } from '../../types';

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  inventoryLayers: InventoryLayer[];
  branches?: Branch[];
  warehouses?: Warehouse[];
  onEditSupplier: (supplier: Supplier) => void;
  onOpenCreatePO: (supplierName?: string) => void;
}

export const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  isOpen,
  onClose,
  supplier,
  purchaseOrders = [],
  products = [],
  inventoryLayers = [],
  branches = [],
  warehouses = [],
  onEditSupplier,
  onOpenCreatePO
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'overview' | 'products' | 'layers'>('history');

  // Filter states for Purchase Order history tab
  const [historySearch, setHistorySearch] = useState('');
  const [filterSku, setFilterSku] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // All POs belonging to this supplier (matched by supplierId or supplierName)
  const supplierPOs = useMemo(() => {
    if (!supplier) return [];
    return purchaseOrders.filter((po) => {
      const matchId = po.supplierId && po.supplierId === supplier.id;
      const matchName = po.supplierName && po.supplierName.toLowerCase() === supplier.name.toLowerCase();
      return matchId || matchName;
    });
  }, [purchaseOrders, supplier]);

  // Filtered POs
  const filteredPOs = useMemo(() => {
    return supplierPOs.filter((po) => {
      if (historySearch) {
        const s = historySearch.toLowerCase();
        const matchesCode = po.code.toLowerCase().includes(s);
        const matchesItem = po.items?.some(
          (i) => i.productName.toLowerCase().includes(s) || (i.sku && i.sku.toLowerCase().includes(s))
        );
        if (!matchesCode && !matchesItem) return false;
      }

      if (filterSku !== 'all') {
        const hasSku = po.items?.some((i) => i.sku === filterSku);
        if (!hasSku) return false;
      }

      if (filterBranch !== 'all' && po.branchId && po.branchId !== filterBranch) {
        return false;
      }

      const poDate = po.createdAt.substring(0, 10);
      if (filterStartDate && poDate < filterStartDate) return false;
      if (filterEndDate && poDate > filterEndDate) return false;

      return true;
    });
  }, [supplierPOs, historySearch, filterSku, filterBranch, filterStartDate, filterEndDate]);

  // Unique SKUs supplied in history
  const supplierSkus = useMemo(() => {
    const set = new Set<string>();
    supplierPOs.forEach((po) => {
      po.items?.forEach((i) => {
        if (i.sku) set.add(i.sku);
      });
    });
    return Array.from(set);
  }, [supplierPOs]);

  // Inventory Layers from this supplier
  const supplierLayers = useMemo(() => {
    if (!supplier) return [];
    return inventoryLayers.filter((l) => {
      const matchId = l.supplierId && l.supplierId === supplier.id;
      const matchName = l.supplierName && l.supplierName.toLowerCase() === supplier.name.toLowerCase();
      return matchId || matchName;
    });
  }, [inventoryLayers, supplier]);

  // Summary Metrics
  const totalPOAmount = useMemo(
    () => supplierPOs.reduce((sum, po) => sum + po.totalAmount, 0),
    [supplierPOs]
  );
  const totalPOQty = useMemo(() => {
    return supplierPOs.reduce((sum, po) => {
      const itemSum = po.items?.reduce((iSum, i) => iSum + i.quantity, 0) || 0;
      return sum + itemSum;
    }, 0);
  }, [supplierPOs]);
  const totalPODebt = useMemo(
    () => supplierPOs.reduce((sum, po) => sum + (po.debtAmount || 0), 0),
    [supplierPOs]
  );

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  if (!isOpen || !supplier) return null;

  return (
    <div
      id="supplier-detail-modal-backdrop"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="supplier-detail-modal-content"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-extrabold text-slate-900">{supplier.name}</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                  {supplier.code}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    supplier.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {supplier.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {supplier.legalName || supplier.name} • MST:{' '}
                <span className="font-mono font-bold text-slate-700">{supplier.taxCode || 'Chưa cập nhật'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditSupplier(supplier)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Sửa thông tin
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenCreatePO(supplier.name);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shadow-blue-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nhập hàng</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KPI Mini Header */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
            <span className="text-slate-500 block text-[11px]">Tổng phiếu nhập</span>
            <span className="text-sm font-extrabold text-slate-900">{supplierPOs.length} phiếu</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
            <span className="text-slate-500 block text-[11px]">Tổng giá trị đã nhập</span>
            <span className="text-sm font-extrabold text-blue-600">{formatVND(totalPOAmount)}</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
            <span className="text-slate-500 block text-[11px]">Công nợ phải trả hiện tại</span>
            <span className={`text-sm font-extrabold ${supplier.debt > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {formatVND(supplier.debt)}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
            <span className="text-slate-500 block text-[11px]">Lô tồn kho FIFO khả dụng</span>
            <span className="text-sm font-extrabold text-emerald-600">
              {supplierLayers.filter((l) => l.quantityRemaining > 0).length} lô active
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-4 bg-white text-xs font-bold">
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Lịch sử nhập hàng ({supplierPOs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('layers')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'layers'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Lô hàng FIFO ({supplierLayers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Thông tin pháp lý & Ngân hàng</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: LỊCH SỬ NHẬP HÀNG */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[160px]">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm mã PO, sản phẩm, SKU..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:border-blue-500 text-xs"
                    />
                  </div>

                  {supplierSkus.length > 0 && (
                    <select
                      value={filterSku}
                      onChange={(e) => setFilterSku(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    >
                      <option value="all">Tất cả SKU ({supplierSkus.length})</option>
                      {supplierSkus.map((sku) => (
                        <option key={sku} value={sku}>
                          {sku}
                        </option>
                      ))}
                    </select>
                  )}

                  {branches.length > 0 && (
                    <select
                      value={filterBranch}
                      onChange={(e) => setFilterBranch(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    >
                      <option value="all">Tất cả chi nhánh</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Từ:</span>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <span className="text-slate-500 font-semibold">Đến:</span>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Table of Purchase Orders */}
              {filteredPOs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Chưa có phiếu nhập nào khớp bộ lọc</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Bấm &quot;+ Nhập hàng&quot; ở góc trên để tạo phiếu nhập kho đầu tiên cho nhà cung cấp này
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Mã Phiếu</th>
                        <th className="py-2.5 px-3">Ngày Nhập</th>
                        <th className="py-2.5 px-3">Sản phẩm & SKU</th>
                        <th className="py-2.5 px-3 text-right">Số Lượng</th>
                        <th className="py-2.5 px-3 text-right">Tổng Tiền</th>
                        <th className="py-2.5 px-3 text-right">Còn Nợ</th>
                        <th className="py-2.5 px-3">Kho Nhập</th>
                        <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredPOs.map((po) => {
                        const totalItemsQty = po.items?.reduce((s, i) => s + i.quantity, 0) || 0;
                        return (
                          <tr key={po.id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-blue-700">
                              {po.code}
                            </td>
                            <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                              {po.createdAt.substring(0, 10)}
                            </td>
                            <td className="py-3 px-3 max-w-[260px]">
                              <div className="space-y-1">
                                {po.items?.map((item, idx) => (
                                  <div key={idx} className="text-[11px]">
                                    <span className="font-semibold text-slate-800">{item.productName}</span>
                                    <span className="text-slate-400 font-mono ml-1">({item.sku})</span>
                                    <span className="text-slate-500 ml-1.5 font-bold">
                                      {item.quantity} {item.unit} × {new Intl.NumberFormat('vi-VN').format(item.price)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                              {new Intl.NumberFormat('vi-VN').format(totalItemsQty)}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                              {formatVND(po.totalAmount)}
                            </td>
                            <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                              {(po.debtAmount || 0) > 0 ? (
                                <span className="text-amber-600">{formatVND(po.debtAmount)}</span>
                              ) : (
                                <span className="text-emerald-600">Đã thanh toán</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-slate-600 text-[11px]">
                              {po.warehouse || 'Kho Tổng'}
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  po.status === 'received' || po.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : po.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {po.status === 'received'
                                  ? 'Đã nhập kho'
                                  : po.status === 'pending'
                                  ? 'Chờ duyệt'
                                  : po.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3">
                          Tổng cộng ({filteredPOs.length} phiếu):
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                          {new Intl.NumberFormat('vi-VN').format(
                            filteredPOs.reduce((s, p) => s + (p.items?.reduce((is, i) => is + i.quantity, 0) || 0), 0)
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-blue-700">
                          {formatVND(filteredPOs.reduce((s, p) => s + p.totalAmount, 0))}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-amber-600">
                          {formatVND(filteredPOs.reduce((s, p) => s + (p.debtAmount || 0), 0))}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LÔ HÀNG FIFO HIỆN HÀNH */}
          {activeTab === 'layers' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Danh sách Lô / Lớp Tồn Kho (FIFO Layers) thuộc Nhà Cung Cấp
                </h4>
                <span className="text-xs text-slate-500 font-semibold">
                  {supplierLayers.length} lô tồn được quản lý
                </span>
              </div>

              {supplierLayers.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  Chưa có lô hàng FIFO nào phát sinh từ nhà cung cấp này
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-2 px-3">Mã Lô (Lot ID)</th>
                        <th className="py-2 px-3">Ngày Nhập</th>
                        <th className="py-2 px-3">SKU & Sản phẩm</th>
                        <th className="py-2 px-3 text-right">Giá Vốn Nhập</th>
                        <th className="py-2 px-3 text-right">Ban Đầu</th>
                        <th className="py-2 px-3 text-right">Đã Xuất</th>
                        <th className="py-2 px-3 text-right">Còn Lại (FIFO)</th>
                        <th className="py-2 px-3 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {supplierLayers.map((layer) => (
                        <tr key={layer.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                            {layer.layerId || layer.lotId}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {layer.receivedAt || layer.intakeDate || layer.createdAt?.substring(0, 10)}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{layer.productName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{layer.sku}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                            {formatVND(layer.purchasePrice || layer.costPrice || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-500">
                            {layer.quantityReceived || layer.initialQuantity} {layer.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-500">
                            {layer.quantityIssued || (layer.quantityReceived || 0) - (layer.quantityRemaining || 0)}{' '}
                            {layer.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                            {layer.quantityRemaining || layer.remainingQuantity} {layer.unit}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                (layer.quantityRemaining || 0) > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {(layer.quantityRemaining || 0) > 0 ? 'Đang xuất FIFO' : 'Đã hết hàng'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: THÔNG TIN PHÁP LÝ & NGÂN HÀNG */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Box 1: Thông tin pháp lý & Thuế */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Thông Tin Pháp Lý & Thuế</span>
                </h4>
                <div className="space-y-1.5 text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-500">Tên pháp lý:</span>{' '}
                    <span className="font-bold uppercase text-slate-900">{supplier.legalName || supplier.name}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Mã số thuế:</span>{' '}
                    <span className="font-mono font-bold text-blue-700">{supplier.taxCode || '—'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Người đại diện:</span>{' '}
                    <span className="font-semibold">{supplier.representative || '—'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Địa chỉ ĐKKD:</span>{' '}
                    <span>{supplier.address || '—'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Cơ quan thuế:</span>{' '}
                    <span>{supplier.taxAuthority || 'Cục Thuế quản lý trực tiếp'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Trạng thái MST:</span>{' '}
                    <span className="text-emerald-700 font-semibold">{supplier.taxStatus || 'NNT đang hoạt động'}</span>
                  </p>
                </div>
              </div>

              {/* Box 2: Tài Khoản Ngân Hàng */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  <span>Tài Khoản Ngân Hàng & Thanh Toán</span>
                </h4>
                <div className="space-y-1.5 text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-500">Ngân hàng:</span>{' '}
                    <span className="font-bold text-slate-900">{supplier.bankName || 'Chưa cập nhật'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Số tài khoản:</span>{' '}
                    <span className="font-mono font-bold text-slate-900 text-sm">{supplier.bankAccount || '—'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Chủ tài khoản:</span>{' '}
                    <span className="font-semibold uppercase">{supplier.bankAccountName || supplier.legalName || '—'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Chi nhánh NH:</span>{' '}
                    <span>{supplier.bankBranch || '—'}</span>
                  </p>
                </div>
              </div>

              {/* Box 3: Người liên hệ & Sale */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <span>Đại Diện Liên Hệ & Sale</span>
                </h4>
                <div className="space-y-1.5 text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-500">Người liên hệ:</span>{' '}
                    <span className="font-bold text-slate-900">{supplier.contactPerson || 'Chưa có'}</span>
                    {supplier.contactTitle && <span className="text-slate-500 ml-1">({supplier.contactTitle})</span>}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Điện thoại Sale / Zalo:</span>{' '}
                    <span className="font-semibold text-blue-700">{supplier.contactPhone || supplier.phone}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Email:</span>{' '}
                    <span>{supplier.email || '—'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Website:</span>{' '}
                    <span>{supplier.website || '—'}</span>
                  </p>
                </div>
              </div>

              {/* Box 4: Chính sách tín dụng & Công nợ */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>Chính Sách Tín Dụng & Điều Khoản</span>
                </h4>
                <div className="space-y-1.5 text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-500">Hạn mức công nợ:</span>{' '}
                    <span className="font-bold text-slate-900">{formatVND(supplier.creditLimit || 0)}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Thời hạn thanh toán:</span>{' '}
                    <span className="font-bold text-slate-900">{supplier.paymentTermDays || 30} ngày</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Điều khoản:</span>{' '}
                    <span>{supplier.paymentTerms || 'Chuyển khoản theo thỏa thuận hợp đồng'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Bảng giá áp dụng:</span>{' '}
                    <span>{supplier.defaultPriceList || 'Bảng giá chuẩn'}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
