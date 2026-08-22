import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit2,
  Truck,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building,
  RotateCw,
  MoreVertical,
  ShieldCheck,
  CheckSquare,
  ArrowDownRight,
  Calendar,
  Clock,
  Trash2,
  UserCheck,
  LayoutGrid,
  List
} from 'lucide-react';
import {
  Supplier,
  SupplierType,
  PurchaseOrder,
  Product,
  InventoryLayer,
  Branch,
  Warehouse,
  SupplierTask,
  SupplierPaymentVoucher
} from '../types';
import { SupplierModal } from './Modals/SupplierModal';
import { SupplierDetailModal } from './Modals/SupplierDetailModal';
import { SupplierTaskModal } from './Modals/SupplierTaskModal';
import { SupplierPaymentModal } from './Modals/SupplierPaymentModal';
import { SupplierImportModal } from './Modals/SupplierImportModal';
import { DeleteSupplierModal } from './Modals/DeleteSupplierModal';

interface SupplierViewProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  inventoryLayers: InventoryLayer[];
  branches?: Branch[];
  warehouses?: Warehouse[];
  supplierTasks?: SupplierTask[];
  supplierPayments?: SupplierPaymentVoucher[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier?: (supplierId: string) => void;
  onToggleStatus?: (supplierId: string) => void;
  onOpenCreatePO: (supplierName?: string) => void;
  onSaveSupplierTask?: (task: SupplierTask) => void;
  onToggleSupplierTask?: (taskId: string) => void;
  onDeleteSupplierTask?: (taskId: string) => void;
  onSaveSupplierPayment?: (payment: SupplierPaymentVoucher) => void;
  onImportSuppliers?: (suppliers: Supplier[]) => void;
}

export const SupplierView: React.FC<SupplierViewProps> = ({
  suppliers = [],
  purchaseOrders = [],
  products = [],
  inventoryLayers = [],
  branches = [],
  warehouses = [],
  supplierTasks = [],
  supplierPayments = [],
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onToggleStatus,
  onOpenCreatePO,
  onSaveSupplierTask,
  onToggleSupplierTask,
  onDeleteSupplierTask,
  onSaveSupplierPayment,
  onImportSuppliers
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'suppliers' | 'tasks' | 'payments'>('suppliers');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<SupplierTask | null>(null);
  const [defaultSupplierForTask, setDefaultSupplierForTask] = useState<string>('');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [defaultSupplierForPayment, setDefaultSupplierForPayment] = useState<string>('');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Filters & Search for Suppliers
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [debtFilter, setDebtFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [viewLayout, setViewLayout] = useState<'table' | 'cards'>('table');

  // Filters for Tasks
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('all');

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = (s.code || '').toLowerCase().includes(q);
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchLegal = (s.legalName || '').toLowerCase().includes(q);
        const matchTax = (s.taxCode || '').toLowerCase().includes(q);
        const matchPhone = (s.phone || '').toLowerCase().includes(q) || (s.contactPhone || '').toLowerCase().includes(q);
        const matchContact = (s.contactPerson || '').toLowerCase().includes(q);
        const matchProduct = s.suppliedProducts?.some((p) => p.toLowerCase().includes(q));

        if (!matchCode && !matchName && !matchLegal && !matchTax && !matchPhone && !matchContact && !matchProduct) {
          return false;
        }
      }

      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (debtFilter === 'has_debt' && (s.debt || 0) <= 0) return false;
      if (debtFilter === 'no_debt' && (s.debt || 0) > 0) return false;
      if (branchFilter !== 'all' && s.branchId && s.branchId !== branchFilter) return false;

      return true;
    });
  }, [suppliers, searchQuery, typeFilter, statusFilter, debtFilter, branchFilter]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return supplierTasks.filter((t) => {
      if (taskSearchQuery.trim()) {
        const q = taskSearchQuery.toLowerCase().trim();
        const matchTitle = (t.title || '').toLowerCase().includes(q);
        const matchSup = (t.supplierName || '').toLowerCase().includes(q);
        const matchStaff = (t.assignedTo || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSup && !matchStaff) return false;
      }
      if (taskStatusFilter !== 'all' && t.status !== taskStatusFilter) return false;
      if (taskPriorityFilter !== 'all' && t.priority !== taskPriorityFilter) return false;
      return true;
    });
  }, [supplierTasks, taskSearchQuery, taskStatusFilter, taskPriorityFilter]);

  // Overall Metrics
  const totalSuppliersCount = suppliers.length;
  const activeSuppliersCount = suppliers.filter((s) => s.status === 'active').length;
  const totalPayableDebt = useMemo(() => suppliers.reduce((sum, s) => sum + (s.debt || 0), 0), [suppliers]);
  const totalPurchasedValue = useMemo(() => suppliers.reduce((sum, s) => sum + (s.totalPurchased || 0), 0), [suppliers]);
  const pendingTasksCount = supplierTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Mã NCC',
      'Tên Nhà Cung Cấp',
      'Tên Pháp Lý',
      'Mã Số Thuế',
      'Loại Đối Tượng',
      'Số Điện Thoại',
      'Email',
      'Địa Chỉ',
      'Tỉnh/TP',
      'Người Đại Diện',
      'Người Liên Hệ',
      'SĐT Liên Hệ',
      'Ngân Hàng',
      'Số Tài Khoản',
      'Hạn Mức Công Nợ',
      'Công Nợ Hiện Tại',
      'Tổng Mua',
      'Trạng Thái'
    ];

    const rows = filteredSuppliers.map((s) => [
      s.code,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${(s.legalName || '').replace(/"/g, '""')}"`,
      `'${s.taxCode || ''}`,
      s.type || 'company',
      `'${s.phone || ''}`,
      s.email || '',
      `"${(s.address || '').replace(/"/g, '""')}"`,
      s.city || '',
      s.representative || '',
      s.contactPerson || '',
      `'${s.contactPhone || ''}`,
      s.bankName || '',
      `'${s.bankAccount || ''}`,
      s.creditLimit || 0,
      s.debt || 0,
      s.totalPurchased || 0,
      s.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh_sach_Nha_Cung_Cap_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'price_negotiation':
        return '🤝';
      case 'rfq_quote':
        return '📋';
      case 'debt_reconciliation':
        return '💰';
      case 'delivery_tracking':
        return '🚚';
      case 'quality_inspection':
        return '🔍';
      case 'contract_renewal':
        return '📝';
      default:
        return '📌';
    }
  };

  return (
    <div id="supplier-management-view" className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Mua hàng & NCC
              </h1>
            </div>
          </div>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Nhập Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Xuất file</span>
          </button>

          <button
            onClick={() => {
              setDefaultSupplierForTask('');
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <span>+ Tác vụ NCC</span>
          </button>

          <button
            onClick={() => {
              setDefaultSupplierForPayment('');
              setIsPaymentModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            <span>+ Lập phiếu chi</span>
          </button>

          <button
            onClick={() => {
              setEditingSupplier(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Thêm Nhà Cung Cấp</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Nhà Cung Cấp</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalSuppliersCount}</span>
            <span className="text-xs text-emerald-600 font-bold">({activeSuppliersCount} hoạt động)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Công Nợ Phải Trả NCC</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-600 font-mono">{formatVND(totalPayableDebt)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Mua Hàng Tích Lũy</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{formatVND(totalPurchasedValue)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tác Vụ Thu Mua Chờ Xử Lý</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <CheckSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">{pendingTasksCount}</span>
            <span className="text-xs text-slate-500">nhiệm vụ cần làm</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-2xl shadow-xs gap-6">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'suppliers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Danh Sách Nhà Cung Cấp ({filteredSuppliers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'tasks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Quản Lý Tác Vụ & Công Việc NCC ({filteredTasks.length})</span>
          {pendingTasksCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingTasksCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Sổ Quỹ & Phiếu Chi Trả Nợ ({supplierPayments.length})</span>
        </button>
      </div>

      {/* TAB 1: SUPPLIERS LIST */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo Tên NCC, Tên Pháp Lý, MST, Mã NCC, Số điện thoại, Sản phẩm cung ứng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">Tất cả loại đối tượng</option>
                  <option value="company">Doanh nghiệp / Cty</option>
                  <option value="branch">Chi nhánh</option>
                  <option value="office">VP Đại diện</option>
                  <option value="other">Cá nhân / Khác</option>
                </select>

                <select
                  value={debtFilter}
                  onChange={(e) => setDebtFilter(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">Tất cả công nợ</option>
                  <option value="has_debt">Đang có nợ phải trả</option>
                  <option value="no_debt">Không nợ (0 đ)</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngừng giao dịch</option>
                </select>

                {/* View Layout Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewLayout('table')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewLayout === 'table' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'
                    }`}
                    title="Xem dạng Bảng"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewLayout('cards')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewLayout === 'cards' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'
                    }`}
                    title="Xem dạng Thẻ"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewLayout === 'table' ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Mã NCC</th>
                      <th className="py-3.5 px-4 min-w-[200px]">Tên Nhà Cung Cấp</th>
                      <th className="py-3.5 px-4 min-w-[120px]">Mã Số Thuế</th>
                      <th className="py-3.5 px-4 min-w-[140px]">Người Liên Hệ / SĐT</th>
                      <th className="py-3.5 px-4 min-w-[150px]">Ngân Hàng</th>
                      <th className="py-3.5 px-4 text-right">Công Nợ Phải Trả</th>
                      <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                      <th className="py-3.5 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="font-bold">Không tìm thấy nhà cung cấp nào phù hợp.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredSuppliers.map((supplier) => (
                        <tr key={supplier.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                              {supplier.code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div>
                              <button
                                onClick={() => setDetailSupplier(supplier)}
                                className="font-bold text-slate-900 hover:text-blue-600 text-left transition-colors"
                              >
                                {supplier.name}
                              </button>
                              {supplier.legalName && supplier.legalName !== supplier.name && (
                                <p className="text-[11px] text-slate-400 line-clamp-1">{supplier.legalName}</p>
                              )}
                              {supplier.address && (
                                <p className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{supplier.address}</span>
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {supplier.taxCode ? (
                              <div>
                                <span className="font-bold text-slate-800">{supplier.taxCode}</span>
                                {supplier.taxStatus && (
                                  <span className="block text-[10px] text-emerald-600 truncate max-w-[140px]">
                                    ✓ Đang hoạt động
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Chưa có MST</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-slate-800">
                                {supplier.contactPerson || supplier.representative || '—'}
                              </p>
                              <p className="font-mono text-slate-600 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{supplier.contactPhone || supplier.phone || '—'}</span>
                              </p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[11px]">
                            {supplier.bankAccount ? (
                              <div>
                                <p className="font-mono font-bold text-slate-800">{supplier.bankAccount}</p>
                                <p className="text-slate-500 truncate max-w-[140px]">{supplier.bankName || 'Ngân hàng'}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`font-mono font-black text-sm ${
                                (supplier.debt || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            >
                              {formatVND(supplier.debt || 0)}
                            </span>
                            {supplier.creditLimit ? (
                              <span className="block text-[10px] text-slate-400 font-mono">
                                Hạn mức: {(supplier.creditLimit / 1000000).toFixed(0)}M
                              </span>
                            ) : null}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                supplier.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {supplier.status === 'active' ? 'Hoạt động' : 'Ngừng'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setDetailSupplier(supplier)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Xem hồ sơ & lịch sử nhập kho"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => onOpenCreatePO(supplier.name)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                                title="Lập phiếu nhập hàng từ nhà cung cấp này"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Nhập</span>
                              </button>

                              <button
                                onClick={() => {
                                  setDefaultSupplierForPayment(supplier.id);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Lập phiếu chi thanh toán nợ NCC"
                              >
                                <ArrowDownRight className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setDefaultSupplierForTask(supplier.name);
                                  setTaskToEdit(null);
                                  setIsTaskModalOpen(true);
                                }}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Thêm tác vụ công việc với NCC"
                              >
                                <CheckSquare className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setEditingSupplier(supplier);
                                  setIsAddModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Chỉnh sửa thông tin NCC"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {onDeleteSupplier && (
                                <button
                                  onClick={() => setSupplierToDelete(supplier)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Xóa nhà cung cấp"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                          {supplier.code}
                        </span>
                        <h3
                          onClick={() => setDetailSupplier(supplier)}
                          className="text-base font-bold text-slate-900 mt-1 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          {supplier.name}
                        </h3>
                        {supplier.legalName && (
                          <p className="text-xs text-slate-500 font-medium uppercase line-clamp-1">{supplier.legalName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            supplier.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {supplier.status === 'active' ? 'Hoạt động' : 'Ngừng'}
                        </span>
                        {onDeleteSupplier && (
                          <button
                            onClick={() => setSupplierToDelete(supplier)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa nhà cung cấp"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Mã số thuế:</span>
                        <span className="font-mono font-bold text-slate-800">{supplier.taxCode || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Người liên hệ:</span>
                        <span className="font-semibold text-slate-800">{supplier.contactPerson || supplier.representative || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Điện thoại:</span>
                        <span className="font-mono font-bold text-blue-700">{supplier.contactPhone || supplier.phone || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Công nợ hiện tại:</span>
                        <span
                          className={`font-black ${
                            (supplier.debt || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {formatVND(supplier.debt || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => setDetailSupplier(supplier)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Hồ sơ</span>
                    </button>

                    <button
                      onClick={() => {
                        setDefaultSupplierForTask(supplier.name);
                        setTaskToEdit(null);
                        setIsTaskModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Thêm tác vụ NCC"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tác vụ</span>
                    </button>

                    <button
                      onClick={() => {
                        setDefaultSupplierForPayment(supplier.id);
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Lập phiếu chi"
                    >
                      <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Chi nợ</span>
                    </button>

                    <button
                      onClick={() => onOpenCreatePO(supplier.name)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>+ Nhập</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUPPLIER TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4 text-xs">
          {/* Task Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                placeholder="Tìm công việc theo tiêu đề, tên nhà cung cấp hoặc nhân viên thu mua..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ thực hiện</option>
                <option value="in_progress">Đang xử lý</option>
                <option value="completed">Đã hoàn thành</option>
              </select>

              <select
                value={taskPriorityFilter}
                onChange={(e) => setTaskPriorityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">Tất cả độ ưu tiên</option>
                <option value="urgent">Khẩn cấp</option>
                <option value="high">Ưu tiên cao</option>
                <option value="normal">Bình thường</option>
              </select>

              <button
                onClick={() => {
                  setDefaultSupplierForTask('');
                  setTaskToEdit(null);
                  setIsTaskModalOpen(true);
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm tác vụ NCC</span>
              </button>
            </div>
          </div>

          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40 text-blue-500" />
              <p className="font-bold text-slate-700">Không có công việc NCC nào phù hợp bộ lọc.</p>
              <button
                onClick={() => {
                  setDefaultSupplierForTask('');
                  setTaskToEdit(null);
                  setIsTaskModalOpen(true);
                }}
                className="mt-3 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Thêm công việc mới
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    task.status === 'completed'
                      ? 'border-slate-200 bg-slate-50/70 opacity-75'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => onToggleSupplierTask && onToggleSupplierTask(task.id)}
                      className="w-5 h-5 rounded-lg text-blue-600 border-slate-300 focus:ring-blue-500 mt-0.5 cursor-pointer"
                      title="Đánh dấu hoàn thành"
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold">{getTaskTypeIcon(task.type)}</span>
                        <h4
                          className={`font-bold text-sm ${
                            task.status === 'completed'
                              ? 'line-through text-slate-400'
                              : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            task.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-700'
                              : task.priority === 'high'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {task.priority === 'urgent'
                            ? 'Khẩn cấp'
                            : task.priority === 'high'
                            ? 'Ưu tiên cao'
                            : 'Bình thường'}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          NCC: {task.supplierName}
                        </span>
                      </div>

                      {task.note && <p className="text-slate-600 mt-1 text-xs">{task.note}</p>}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-2">
                        <span className="flex items-center gap-1 font-mono text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Hạn xử lý: {task.dueDate} {task.dueTime || ''}
                        </span>
                        <span>• Phụ trách: <strong className="text-slate-800">{task.assignedTo}</strong></span>
                        <span>• Khởi tạo: {task.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        task.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {task.status === 'completed'
                        ? 'Đã hoàn tất'
                        : task.status === 'in_progress'
                        ? 'Đang thực hiện'
                        : 'Chờ xử lý'}
                    </span>

                    {onDeleteSupplierTask && (
                      <button
                        onClick={() => onDeleteSupplierTask(task.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Xóa tác vụ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENT VOUCHERS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Sổ Quỹ Chi Trả Tiền Hàng Cho NCC</h3>
              <p className="text-xs text-slate-500">Lịch sử phiếu chi, phương thức thanh toán và giảm trừ công nợ đối tác</p>
            </div>
            <button
              onClick={() => {
                setDefaultSupplierForPayment('');
                setIsPaymentModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Lập Phiếu Chi Mới</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3">Mã phiếu chi</th>
                  <th className="p-3">Nhà cung cấp</th>
                  <th className="p-3">Thời gian chi</th>
                  <th className="p-3">Hình thức</th>
                  <th className="p-3 text-right">Số tiền chi</th>
                  <th className="p-3">Chứng từ PO</th>
                  <th className="p-3">Người lập</th>
                  <th className="p-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Chưa có phiếu chi nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  supplierPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-600">{p.code}</td>
                      <td className="p-3 font-bold text-slate-900">{p.supplierName}</td>
                      <td className="p-3 font-mono text-slate-600">{p.paymentDate}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                          {p.paymentMethod === 'bank_transfer'
                            ? 'Chuyển khoản'
                            : p.paymentMethod === 'vietqr'
                            ? 'VietQR'
                            : 'Tiền mặt'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-black text-emerald-600 text-sm">
                        {formatVND(p.amount)}
                      </td>
                      <td className="p-3 font-mono text-slate-500">{p.referencePoCode || '—'}</td>
                      <td className="p-3 text-slate-600">{p.creator}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                          Đã hạch toán
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      <SupplierModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSupplier(null);
        }}
        supplierToEdit={editingSupplier}
        existingSuppliers={suppliers}
        branches={branches}
        onSave={(savedSupplier) => {
          if (editingSupplier) {
            onUpdateSupplier(savedSupplier);
          } else {
            onAddSupplier(savedSupplier);
          }
        }}
        onViewExisting={(existingSup) => {
          setIsAddModalOpen(false);
          setEditingSupplier(null);
          setDetailSupplier(existingSup);
        }}
      />

      {/* Detail / History Modal */}
      <SupplierDetailModal
        isOpen={Boolean(detailSupplier)}
        onClose={() => setDetailSupplier(null)}
        supplier={detailSupplier}
        purchaseOrders={purchaseOrders}
        products={products}
        inventoryLayers={inventoryLayers}
        branches={branches}
        warehouses={warehouses}
        onEditSupplier={(sup) => {
          setDetailSupplier(null);
          setEditingSupplier(sup);
          setIsAddModalOpen(true);
        }}
        onOpenCreatePO={(supplierName) => {
          setDetailSupplier(null);
          onOpenCreatePO(supplierName);
        }}
      />

      {/* Supplier Task Modal */}
      <SupplierTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        defaultSupplierName={defaultSupplierForTask}
        suppliers={suppliers}
        taskToEdit={taskToEdit}
        onSaveTask={(savedTask) => {
          if (onSaveSupplierTask) {
            onSaveSupplierTask(savedTask);
          }
        }}
      />

      {/* Supplier Payment Voucher Modal */}
      <SupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setDefaultSupplierForPayment('');
        }}
        defaultSupplierId={defaultSupplierForPayment}
        suppliers={suppliers}
        onSavePayment={(savedVoucher) => {
          if (onSaveSupplierPayment) {
            onSaveSupplierPayment(savedVoucher);
          }
        }}
      />

      {/* Supplier Import Excel Modal */}
      <SupplierImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingSuppliers={suppliers}
        onImportSuppliers={(imported) => {
          if (onImportSuppliers) {
            onImportSuppliers(imported);
          }
        }}
      />

      {/* Delete Supplier Confirmation Modal */}
      <DeleteSupplierModal
        isOpen={Boolean(supplierToDelete)}
        onClose={() => setSupplierToDelete(null)}
        supplier={supplierToDelete}
        purchaseOrders={purchaseOrders}
        inventoryLayers={inventoryLayers}
        onConfirmDelete={(id) => {
          if (onDeleteSupplier) {
            onDeleteSupplier(id);
          }
          setSupplierToDelete(null);
        }}
      />
    </div>
  );
};
