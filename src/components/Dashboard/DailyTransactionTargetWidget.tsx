import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Plus,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { TransactionDashboardResponse, UserAccount, TransactionSource } from '../../types';
import { TransactionEngineService } from '../../services/transactionEngine';
import { AdOpportunityEngine } from '../../services/adOpportunityEngine';
import { TransactionConfigModal } from './TransactionConfigModal';
import { TransactionAuditModal } from './TransactionAuditModal';
import { useLanguage } from '../../i18n';
import { formatVND } from '../../services/dashboardViewModel';

interface DailyTransactionTargetWidgetProps {
  currentUser?: UserAccount;
  onNavigateToOrders?: () => void;
}

export const DailyTransactionTargetWidget: React.FC<DailyTransactionTargetWidgetProps> = ({
  currentUser
}) => {
  const { t, language } = useLanguage();
  const [data, setData] = useState<TransactionDashboardResponse>({
    success: true,
    date: new Date().toISOString().substring(0, 10),
    target: { min: 4, max: 6, today: 5 },
    actual: 0,
    remaining: 5,
    progress: 0,
    status: 'IN_PROGRESS',
    adOpportunity: {
      level: 'HIGH',
      enabled: true,
      reason: 'Cần thêm 5 giao dịch để đạt mục tiêu ngày.'
    },
    metrics: {
      sales: 0,
      revenue: 0,
      confirmed: 0,
      cancelled: 0,
      refunded: 0
    }
  });

  const [loading, setLoading] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // New Sale Form State
  const [newSaleSource, setNewSaleSource] = useState<TransactionSource>('ERP');
  const [newSaleAmount, setNewSaleAmount] = useState<number>(1500000);
  const [newSaleOrderId, setNewSaleOrderId] = useState<string>('');
  const [customIdempotencyKey, setCustomIdempotencyKey] = useState<string>('');
  const [creatingSale, setCreatingSale] = useState(false);

  // Idempotency Test Key
  const [lastUsedIdempotencyKey, setLastUsedIdempotencyKey] = useState<string>('');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const showNotification = (type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await TransactionEngineService.getDashboardMetrics();
      if (res && res.success) {
        setData(res);
      }
    } catch (e) {
      console.warn('Error loading transaction dashboard metrics:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    // Auto seed demo transactions if zero data to ensure smooth first experience
    const timer = setTimeout(() => {
      TransactionEngineService.seedDemoTransactions().then((r) => {
        if (r.success && r.count > 0) {
          fetchMetrics();
        }
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [fetchMetrics]);

  const handleOpenCreateSale = () => {
    const defaultId = `ORD-${Date.now().toString().slice(-4)}`;
    setNewSaleOrderId(defaultId);
    setCustomIdempotencyKey(TransactionEngineService.generateIdempotencyKey(newSaleSource, defaultId));
    setIsCreateModalOpen(true);
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIdempotencyKey) {
      showNotification('error', 'Vui lòng nhập hoặc tạo Idempotency Key.');
      return;
    }

    setCreatingSale(true);
    try {
      const res = await TransactionEngineService.createSaleTransaction({
        idempotencyKey: customIdempotencyKey,
        orderId: newSaleOrderId,
        source: newSaleSource,
        amount: Number(newSaleAmount) || 0,
        status: 'CONFIRMED',
        metadata: {
          creator: currentUser?.name || currentUser?.username || 'User',
          createdVia: 'Dashboard Widget'
        }
      });

      if (res.success) {
        setLastUsedIdempotencyKey(customIdempotencyKey);
        if (res.isDuplicate) {
          showNotification(
            'info',
            `Idempotency Replay: Key '${customIdempotencyKey}' đã tồn tại trước đó. Giao dịch được giữ nguyên, KHÔNG tăng số đếm giao dịch.`
          );
        } else {
          showNotification(
            'success',
            `Tạo giao dịch SALE thành công (+1 giao dịch)! Kênh: ${newSaleSource}, Giá trị: ${(Number(newSaleAmount) || 0).toLocaleString('vi-VN')} đ`
          );
        }
        setIsCreateModalOpen(false);
        fetchMetrics();
      } else {
        showNotification('error', res.error || 'Không thể tạo giao dịch bán');
      }
    } catch (e: any) {
      showNotification('error', e?.message || 'Lỗi kết nối tạo giao dịch');
    } finally {
      setCreatingSale(false);
    }
  };

  const handleTestIdempotencyDuplicate = async () => {
    const testKey = lastUsedIdempotencyKey || `TEST_IDEMPOTENCY_FIXED_KEY_2026`;
    setLoading(true);
    try {
      const res = await TransactionEngineService.createSaleTransaction({
        idempotencyKey: testKey,
        orderId: 'TEST-ORD-DUP',
        source: 'API',
        amount: 2500000,
        status: 'CONFIRMED',
        metadata: { test: true }
      });

      if (res.success) {
        setLastUsedIdempotencyKey(testKey);
        if (res.isDuplicate) {
          showNotification(
            'success',
            `Thử nghiệm Idempotency Chuẩn Xác: Máy chủ phát hiện key trùng lặp '${testKey}' và trả về bản ghi cũ. Tổng giao dịch hôm nay không bị trùng lặp (+0).`
          );
        } else {
          showNotification(
            'info',
            `Khởi tạo key '${testKey}' thành công lần đầu. Hãy nhấn 'Thử nghiệm Idempotency' lần nữa để kiểm chứng cơ chế chống trùng lặp!`
          );
        }
        fetchMetrics();
      }
    } catch (e: any) {
      showNotification('error', 'Lỗi kiểm thử idempotency');
    } finally {
      setLoading(false);
    }
  };

  const adMeta = AdOpportunityEngine.getLevelMeta(data.adOpportunity.level);
  const numberFormatter = new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US');

  // Status Badge Logic
  const getStatusBadge = () => {
    switch (data.status) {
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{t('dashboard.targetEngine.completed')}</span>
          </span>
        );
      case 'EXCEEDED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 text-white border border-slate-900 flex items-center gap-1">
            <span>{t('dashboard.targetEngine.exceeded')}</span>
          </span>
        );
      case 'DISABLED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {t('dashboard.targetEngine.disabled')}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
            <span>{t('dashboard.targetEngine.inProgress')}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3 rounded-lg text-xs font-medium border flex items-start justify-between gap-2.5 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-slate-100 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-slate-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Core Widget Card */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {t('dashboard.targetEngine.title')}
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                {t('dashboard.targetEngine.singleSource')}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {t('dashboard.targetEngine.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {getStatusBadge()}
            <button
              onClick={fetchMetrics}
              disabled={loading}
              title={t('dashboard.refreshTooltip')}
              aria-label={t('dashboard.refreshTooltip')}
              className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer min-h-[30px] min-w-[30px] flex items-center justify-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Core KPI & Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4">
          {/* Left Block: Big Transaction Counter & Progress */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {data.actual}
                </span>
                <span className="text-lg sm:text-xl font-bold text-slate-400">
                  / {data.target.today}
                </span>
                <span className="text-xs font-medium text-slate-500 ml-1">
                  ({t('dashboard.targetEngine.dailyQuota')} {data.target.min} - {data.target.max})
                </span>
              </div>

              <div className="text-right">
                <span className="text-base font-bold text-slate-900">
                  {data.progress}%
                </span>
                <span className="block text-[10px] text-slate-400 font-medium">{t('dashboard.kpi.progress')}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-slate-900 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(2, data.progress))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>
                  {data.remaining > 0 ? (
                    <span className="text-slate-700 font-medium">
                      {t('dashboard.targetEngine.remainingText').replace('{n}', String(data.remaining))}
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">
                      {t('dashboard.targetEngine.goalAchievedText')}
                    </span>
                  )}
                </span>
                <span>{t('dashboard.targetEngine.quotaLabel')} {data.target.today} {t('dashboard.targetEngine.ordersUnit')}</span>
              </div>
            </div>

            {/* Sub Metrics Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-500 font-medium">{t('dashboard.targetEngine.revenueLabel')}</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                  {formatVND(data.metrics.revenue || 0)}
                </div>
              </div>

              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-500 font-medium">{t('dashboard.targetEngine.confirmedLabel')}</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  {numberFormatter.format(data.metrics.confirmed)} {t('dashboard.targetEngine.ordersUnit')}
                </div>
              </div>

              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-500 font-medium">{t('dashboard.targetEngine.cancelledLabel')}</div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">
                  {numberFormatter.format(data.metrics.cancelled)} {t('dashboard.targetEngine.ordersUnit')}
                </div>
              </div>

              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-500 font-medium">{t('dashboard.targetEngine.refundedLabel')}</div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">
                  {numberFormatter.format(data.metrics.refunded)} {t('dashboard.targetEngine.ordersUnit')}
                </div>
              </div>
            </div>
          </div>

          {/* Right Block: Ad Opportunity Engine Signal Card */}
          <div className="lg:col-span-5 flex flex-col justify-between p-3.5 rounded-lg border bg-slate-50/70 border-slate-200 space-y-2.5">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span>{t('dashboard.targetEngine.adSignalTitle')}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${adMeta.badgeClass}`}>
                  {adMeta.label}
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {data.adOpportunity.reason}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>{t('dashboard.targetEngine.noSimulation')}</span>
              </span>
              <span>{t('dashboard.targetEngine.adChannels')}</span>
            </div>
          </div>
        </div>

        {/* Action Bar Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenCreateSale}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer min-h-[32px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('dashboard.targetEngine.createSaleBtn')}</span>
            </button>

            <button
              onClick={handleTestIdempotencyDuplicate}
              disabled={loading}
              title="Gửi cùng một Idempotency Key để kiểm chứng hệ thống giữ nguyên số đếm"
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 cursor-pointer min-h-[32px]"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>{t('dashboard.targetEngine.testIdempotencyBtn')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer min-h-[32px]"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('dashboard.targetEngine.auditLogBtn')}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer min-h-[32px]"
              >
                <span>{t('dashboard.targetEngine.configBtn')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Create SALE Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">{t('dashboard.targetEngine.recordModalTitle')}</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                aria-label={t('common.close')}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  {t('dashboard.targetEngine.sourceLabel')}
                </label>
                <select
                  value={newSaleSource}
                  onChange={(e) => {
                    const src = e.target.value as TransactionSource;
                    setNewSaleSource(src);
                    setCustomIdempotencyKey(TransactionEngineService.generateIdempotencyKey(src, newSaleOrderId));
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                >
                  <option value="ERP">ERP Direct</option>
                  <option value="POS">POS Retail</option>
                  <option value="SHOPEE">Shopee Mall</option>
                  <option value="TIKTOK_SHOP">TikTok Shop</option>
                  <option value="LAZADA">Lazada Mall</option>
                  <option value="WEBSITE">Website E-Commerce</option>
                  <option value="API">External API</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  {t('dashboard.targetEngine.orderIdLabel')}
                </label>
                <input
                  type="text"
                  value={newSaleOrderId}
                  onChange={(e) => {
                    setNewSaleOrderId(e.target.value);
                    setCustomIdempotencyKey(TransactionEngineService.generateIdempotencyKey(newSaleSource, e.target.value));
                  }}
                  placeholder="e.g. ORD-8921"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  {t('dashboard.targetEngine.amountLabel')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={newSaleAmount}
                  onChange={(e) => setNewSaleAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 flex items-center justify-between">
                  <span>{t('dashboard.targetEngine.idempotencyKeyLabel')}</span>
                  <span className="text-[10px] text-slate-500">{t('dashboard.targetEngine.idempotencyAntiDup')}</span>
                </label>
                <input
                  type="text"
                  value={customIdempotencyKey}
                  onChange={(e) => setCustomIdempotencyKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-800 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-600 flex items-start gap-2 border border-slate-200">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
                <span>
                  {t('dashboard.targetEngine.recordModalNote')}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creatingSale}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg flex items-center gap-1.5"
                >
                  {creatingSale ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>{t('dashboard.targetEngine.recording')}</span>
                    </>
                  ) : (
                    <span>{t('dashboard.targetEngine.confirmSaleBtn')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Config Modal */}
      <TransactionConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSaved={fetchMetrics}
        isAdmin={isAdmin}
      />

      {/* Audit Modal */}
      <TransactionAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
};
