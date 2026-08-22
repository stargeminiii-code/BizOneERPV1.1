import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  Smartphone,
  Sparkles,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Activity,
  Layers,
  Copy,
  Check,
  ExternalLink,
  Plus,
  RotateCcw
} from 'lucide-react';
import {
  PaymentOrder,
  PaymentProviderConfig,
  PaymentMethodConfig,
  PaymentReconciliationItem,
  PaymentWebhookLog,
  PaymentStatus,
  PaymentProviderId,
  PaymentMethodType
} from '../../types';
import { PaymentHubService } from '../../services/paymentHubService';

export const PaymentHubView: React.FC = () => {
  const [subTab, setSubTab] = useState<'orders' | 'providers' | 'reconciliation' | 'webhooks'>('orders');

  // Datasets state
  const [orders, setOrders] = useState<PaymentOrder[]>(PaymentHubService.getOrders());
  const [providers, setProviders] = useState<PaymentProviderConfig[]>(PaymentHubService.getProviders());
  const [methods, setMethods] = useState<PaymentMethodConfig[]>(PaymentHubService.getMethods());
  const [reconciliations, setReconciliations] = useState<PaymentReconciliationItem[]>(PaymentHubService.getReconciliations());
  const [webhookLogs, setWebhookLogs] = useState<PaymentWebhookLog[]>(PaymentHubService.getWebhookLogs());

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');

  // Modals & Details
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<PaymentWebhookLog | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [orderToRefund, setOrderToRefund] = useState<PaymentOrder | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshAllData = () => {
    setOrders(PaymentHubService.getOrders());
    setProviders(PaymentHubService.getProviders());
    setMethods(PaymentHubService.getMethods());
    setReconciliations(PaymentHubService.getReconciliations());
    setWebhookLogs(PaymentHubService.getWebhookLogs());
  };

  // Metrics
  const totalPaidRevenue = orders
    .filter((o) => o.status === 'PAID')
    .reduce((sum, o) => sum + o.amount, 0);

  const paidCount = orders.filter((o) => o.status === 'PAID').length;
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const matchedCount = reconciliations.filter((r) => r.status === 'MATCHED').length;
  const totalReconciled = reconciliations.length;
  const matchRate = totalReconciled > 0 ? Math.round((matchedCount / totalReconciled) * 100) : 100;

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.taxCode && o.taxCode.includes(searchTerm));

    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchProvider = providerFilter === 'ALL' || o.providerId === providerFilter;

    return matchSearch && matchStatus && matchProvider;
  });

  const handleToggleMethod = (methodId: string, currentStatus: boolean) => {
    PaymentHubService.toggleMethod(methodId, !currentStatus);
    setMethods(PaymentHubService.getMethods());
  };

  const handleVerifyOrderManually = async (orderId: string) => {
    const res = await PaymentHubService.verifyPayment(orderId);
    if (res.success) {
      refreshAllData();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(res.order || null);
      }
    }
  };

  const handleOpenRefund = (order: PaymentOrder) => {
    setOrderToRefund(order);
    setRefundReason('Hoàn tiền theo yêu cầu hủy đăng ký dịch vụ của khách hàng.');
    setIsRefundModalOpen(true);
  };

  const handleConfirmRefund = async () => {
    if (!orderToRefund) return;
    setIsRefunding(true);
    try {
      const res = await PaymentHubService.refundPayment(orderToRefund.id, refundReason, 'Đức Tăng (Super Admin)');
      setIsRefunding(false);
      setIsRefundModalOpen(false);
      setOrderToRefund(null);
      refreshAllData();
    } catch {
      setIsRefunding(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> PAID (Đã thu)
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> PENDING (Chờ TT)
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> EXPIRED (Hết hạn)
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /> REFUNDED (Đã hoàn)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> FAILED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Doanh Thu Thu Qua Hub</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-white mt-2">
            {totalPaidRevenue.toLocaleString('vi-VN')} đ
          </p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" /> {paidCount} giao dịch thanh toán thành công
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Đơn Chờ Xử Lý / Hết Hạn</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-amber-400 mt-2">{pendingCount} Đơn</p>
          <p className="text-[11px] text-slate-400 mt-1">Đếm ngược 15 phút & hỗ trợ thanh toán lại</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tỷ Lệ Đối Soát Webhook</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-400 mt-2">{matchRate}%</p>
          <p className="text-[11px] text-slate-400 mt-1">Khớp 100% chữ ký số HMAC-SHA256</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Cổng Thanh Toán Hoạt Động</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-indigo-400 mt-2">
            {providers.filter((p) => p.status === 'active').length} / {providers.length} Gateway
          </p>
          <p className="text-[11px] text-slate-400 mt-1">NAPAS, MoMo, Stripe, Ngân hàng 24/7</p>
        </div>
      </div>

      {/* Sub-Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('orders')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'orders'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Đơn Thanh Toán (Payment Orders)
            <span className="px-1.5 py-0.2 text-[10px] bg-slate-950/60 rounded-md font-mono">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('providers')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'providers'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Cấu Hình Gateway & Phương Thức
          </button>

          <button
            onClick={() => setSubTab('reconciliation')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'reconciliation'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Bảng Đối Soát Tự Động (Reconciliation)
            <span className="px-1.5 py-0.2 text-[10px] bg-slate-950/60 rounded-md font-mono">
              {reconciliations.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('webhooks')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'webhooks'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Nhật Ký Webhook & Chữ Ký Số
          </button>
        </div>

        <button
          onClick={refreshAllData}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* =========================================================================
         SUB-TAB 1: PAYMENT ORDERS
         ========================================================================= */}
      {subTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo Mã đơn (PAY-...), Tên khách hàng, MST, Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PAID">PAID (Đã thanh toán)</option>
                <option value="PENDING">PENDING (Chờ TT)</option>
                <option value="EXPIRED">EXPIRED (Hết hạn)</option>
                <option value="REFUNDED">REFUNDED (Đã hoàn tiền)</option>
              </select>

              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">Tất cả Gateway</option>
                <option value="napas">Cổng NAPAS</option>
                <option value="momo">Ví MoMo</option>
                <option value="stripe">Stripe Gateway</option>
                <option value="manual_bank">Ngân hàng MB</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-4 font-bold">Mã Đơn / Thời Gian</th>
                    <th className="py-3 px-4 font-bold">Doanh Nghiệp / Khách Hàng</th>
                    <th className="py-3 px-4 font-bold">Gói Bản Quyền</th>
                    <th className="py-3 px-4 font-bold">Số Tiền</th>
                    <th className="py-3 px-4 font-bold">Phương Thức</th>
                    <th className="py-3 px-4 font-bold">Trạng Thái</th>
                    <th className="py-3 px-4 font-bold text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Không tìm thấy đơn thanh toán phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-blue-400">{o.orderCode}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {new Date(o.createdAt).toLocaleString('vi-VN')}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{o.customerName}</div>
                          <div className="text-[11px] text-slate-400">{o.customerEmail}</div>
                          {o.taxCode && (
                            <span className="text-[10px] font-mono text-slate-500">MST: {o.taxCode}</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{o.planName}</div>
                          <div className="text-[10px] text-slate-400">3 User • Full ERP</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-emerald-400 text-sm">
                            {o.amount.toLocaleString('vi-VN')} {o.currency}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 capitalize">
                            {o.paymentMethod || 'vietqr'}
                          </span>
                        </td>

                        <td className="py-3 px-4">{getStatusBadge(o.status)}</td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg transition cursor-pointer"
                            >
                              Chi tiết
                            </button>

                            {o.status === 'PENDING' && (
                              <button
                                onClick={() => handleVerifyOrderManually(o.id)}
                                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold rounded-lg transition cursor-pointer"
                              >
                                Xác nhận thu
                              </button>
                            )}

                            {o.status === 'PAID' && (
                              <button
                                onClick={() => handleOpenRefund(o)}
                                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-semibold rounded-lg transition cursor-pointer"
                              >
                                Hoàn tiền
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
        </div>
      )}

      {/* =========================================================================
         SUB-TAB 2: PROVIDERS & METHODS CONFIGURATION
         ========================================================================= */}
      {subTab === 'providers' && (
        <div className="space-y-6">
          {/* Providers List */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Cổng Thanh Toán Tích Hợp (Payment Providers)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((p) => (
                <div key={p.id} className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{p.name}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase font-mono ${
                          p.environment === 'production'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {p.environment}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl space-y-1.5 text-xs text-slate-300 font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Merchant ID:</span>
                      <strong className="text-blue-400">{p.merchantId}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>API Endpoint:</span>
                      <span className="text-slate-300 truncate max-w-[200px]">{p.apiEndpoint}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>PCI-DSS Tokenized:</span>
                      <span className={p.pciCompliantHosted ? 'text-emerald-400' : 'text-slate-500'}>
                        {p.pciCompliantHosted ? '✓ Hosted Tokenized' : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5" /> Webhook Secret: Configured
                    </div>
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ACTIVE (Hoạt Động)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods List */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              Phương Thức Thanh Toán Khách Hàng (Customer Checkout Methods)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {methods.map((m) => (
                <div key={m.id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-xs">{m.name}</div>
                      {m.badge && (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500 text-slate-950 rounded">
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{m.tagline}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">Provider: {m.providerId}</span>
                    <button
                      onClick={() => handleToggleMethod(m.id, m.isAvailable)}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        m.isAvailable
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {m.isAvailable ? '✓ Đang Bật' : '✕ Đã Tắt'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         SUB-TAB 3: RECONCILIATION
         ========================================================================= */}
      {subTab === 'reconciliation' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Bảng Đối Soát Doanh Thu & Giao Dịch Cổng</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Tự động đối chiếu số tiền trên đơn hàng với biến động số dư / kết quả Webhook xác thực
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              100% Khớp Đối Soát
            </span>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4 font-bold">Mã Đơn / Giao Dịch Gateway</th>
                  <th className="py-3 px-4 font-bold">Cổng Thanh Toán</th>
                  <th className="py-3 px-4 font-bold">Số Tiền Đơn Hàng</th>
                  <th className="py-3 px-4 font-bold">Số Tiền Thực Nhận</th>
                  <th className="py-3 px-4 font-bold">Trạng Thái Đối Soát</th>
                  <th className="py-3 px-4 font-bold">Ghi Chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {reconciliations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-blue-400">{r.orderCode}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">{r.providerTxId}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[11px] uppercase">
                        {r.providerId}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                      {r.orderAmount.toLocaleString('vi-VN')} {r.currency}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {r.receivedAmount.toLocaleString('vi-VN')} {r.currency}
                    </td>

                    <td className="py-3 px-4">
                      {r.status === 'MATCHED' ? (
                        <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ✓ MATCHED (Khớp 100%)
                        </span>
                      ) : r.status === 'REFUNDED' ? (
                        <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          ↺ REFUNDED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Chờ đối soát
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-400">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
         SUB-TAB 4: WEBHOOK LOGS
         ========================================================================= */}
      {subTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Nhật Ký Webhook & Chữ Ký Điện Tử</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Kiểm tra Idempotency và xác thực tính toàn vẹn chữ ký HMAC-SHA256 của các cổng
              </p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4 font-bold">Thời Gian</th>
                  <th className="py-3 px-4 font-bold">Cổng / Event</th>
                  <th className="py-3 px-4 font-bold">Mã Đơn / TxID</th>
                  <th className="py-3 px-4 font-bold">Số Tiền</th>
                  <th className="py-3 px-4 font-bold">Chữ Ký Số</th>
                  <th className="py-3 px-4 font-bold">Trạng Thái Xử Lý</th>
                  <th className="py-3 px-4 font-bold text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {webhookLogs.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{w.receivedAt}</td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-white uppercase">{w.providerId}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{w.eventType}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-blue-400">{w.orderCode}</div>
                      <div className="text-[10px] font-mono text-slate-500">{w.transactionId}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {w.amount.toLocaleString('vi-VN')} {w.currency}
                    </td>

                    <td className="py-3 px-4">
                      {w.isSignatureValid ? (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Hợp lệ (HMAC-SHA256)
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Chữ ký lỗi
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {w.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedWebhook(w)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg transition cursor-pointer"
                      >
                        Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
         DRAWER / MODAL: ORDER DETAILS
         ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold">Chi Tiết Đơn Thanh Toán</h3>
                <p className="text-xs font-mono text-blue-400 mt-0.5">{selectedOrder.orderCode}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Khách hàng:</span>
                  <strong className="text-white">{selectedOrder.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-300">{selectedOrder.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gói SaaS:</span>
                  <span className="text-white font-bold">{selectedOrder.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số tiền:</span>
                  <strong className="text-emerald-400 text-sm">
                    {selectedOrder.amount.toLocaleString('vi-VN')} {selectedOrder.currency}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phương thức:</span>
                  <span className="text-slate-200 capitalize">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mã giao dịch:</span>
                  <span className="text-blue-400">{selectedOrder.transactionId || 'Chưa ghi nhận'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Idempotency Key:</span>
                  <span className="text-slate-400 text-[10px]">{selectedOrder.idempotencyKey}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl">
                <span className="text-slate-400">Trạng thái đơn:</span>
                {getStatusBadge(selectedOrder.status)}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         DRAWER / MODAL: WEBHOOK RAW PAYLOAD
         ========================================================================= */}
      {selectedWebhook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-white space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold">Raw Webhook Payload</h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  {selectedWebhook.providerId.toUpperCase()} • {selectedWebhook.eventType}
                </p>
              </div>
              <button
                onClick={() => setSelectedWebhook(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-60">
              {JSON.stringify(selectedWebhook.rawPayload, null, 2)}
            </pre>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedWebhook(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         REFUND CONFIRMATION MODAL
         ========================================================================= */}
      {isRefundModalOpen && orderToRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác Nhận Hoàn Tiền Giao Dịch</h3>
                <p className="text-xs text-rose-300 mt-0.5">Mã đơn: {orderToRefund.orderCode}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Khách hàng:</span>
                <strong className="text-white">{orderToRefund.customerName}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Số tiền hoàn:</span>
                <strong className="text-rose-400 text-sm">
                  {orderToRefund.amount.toLocaleString('vi-VN')} {orderToRefund.currency}
                </strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Lý do hoàn tiền (Ghi vào Audit Trail):
              </label>
              <textarea
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmRefund}
                disabled={isRefunding}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isRefunding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>Xác nhận hoàn tiền</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
