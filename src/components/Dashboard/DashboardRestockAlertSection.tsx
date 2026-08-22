import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Package,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Building2,
  Warehouse as WarehouseIcon,
  Search,
  Filter,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Mail,
  MessageSquare
} from 'lucide-react';
import {
  RestockAlertItem,
  RestockNotificationLog,
  RestockAlertLevel,
  Product,
  Warehouse,
  Supplier
} from '../../types';

interface DashboardRestockAlertSectionProps {
  alerts: RestockAlertItem[];
  notificationLogs: RestockNotificationLog[];
  onOpenCreatePO?: (skuOrName?: string) => void;
  onSendRestockNotification: (log: RestockNotificationLog) => void;
  onSelectSku?: (sku: string) => void;
}

export const DashboardRestockAlertSection: React.FC<DashboardRestockAlertSectionProps> = ({
  alerts,
  notificationLogs,
  onOpenCreatePO,
  onSendRestockNotification,
  onSelectSku
}) => {
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<RestockAlertLevel | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [activeAlertToNotify, setActiveAlertToNotify] = useState<RestockAlertItem | null>(null);
  const [notifyChannel, setNotifyChannel] = useState<'telegram' | 'zalo_oa' | 'email'>('telegram');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const formatVND = (v: number) => {
    const val = Number(v) || 0;
    return new Intl.NumberFormat('vi-VN').format(isNaN(val) ? 0 : val) + ' đ';
  };

  // KPIs
  const totalNeedReorderCount = alerts.filter((a) => a.status === 'alerting').length;
  const totalCriticalCount = alerts.filter((a) => a.alertLevel === 'critical' && a.status === 'alerting').length;
  const totalUrgentCount = alerts.filter((a) => a.alertLevel === 'urgent' && a.status === 'alerting').length;
  const totalWarningCount = alerts.filter((a) => a.alertLevel === 'warning' && a.status === 'alerting').length;

  const totalReorderQty = alerts
    .filter((a) => a.status === 'alerting')
    .reduce((sum, a) => sum + a.reorderQuantity, 0);

  const totalEstPurchaseValue = alerts
    .filter((a) => a.status === 'alerting')
    .reduce((sum, a) => sum + a.reorderQuantity * a.lastPurchasePrice, 0);

  const uniqueWarehousesAffected = Array.from(
    new Set(alerts.filter((a) => a.status === 'alerting').map((a) => a.warehouseName))
  ).length;

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    let list = alerts;
    if (selectedLevelFilter !== 'ALL') {
      list = list.filter((a) => a.alertLevel === selectedLevelFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          a.sku.toLowerCase().includes(q) ||
          a.productName.toLowerCase().includes(q) ||
          a.warehouseName.toLowerCase().includes(q) ||
          a.preferredSupplierName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [alerts, selectedLevelFilter, searchTerm]);

  const handleOpenNotifyModal = (item: RestockAlertItem) => {
    setActiveAlertToNotify(item);
    const msg = `⚠️ [BIZONE ERP - CẢNH BÁO BỔ SUNG HÀNG]\nKho: ${item.warehouseName}\nSKU: ${item.sku} - ${item.productName}\nTồn khả dụng: ${item.availableStock} ${item.unit} (Mức cảnh báo: ${item.warningThreshold})\nTồn mục tiêu: ${item.targetStock} ${item.unit}\nĐang về: ${item.incomingStock} ${item.unit}\nCẦN MUA: ${item.reorderQuantity} ${item.unit}\nNCC Đề xuất: ${item.preferredSupplierName}\nVui lòng tạo PO bổ sung hàng!`;
    setNotifyMessage(msg);
    setShowNotifyModal(true);
  };

  const handleSendNotification = () => {
    if (!activeAlertToNotify) return;

    const newLog: RestockNotificationLog = {
      id: `restock-notif-${Date.now()}`,
      alertId: activeAlertToNotify.id,
      sku: activeAlertToNotify.sku,
      productName: activeAlertToNotify.productName,
      warehouseName: activeAlertToNotify.warehouseName,
      recipientName: activeAlertToNotify.purchaserStaff,
      recipientRole: 'purchasing',
      channel: notifyChannel,
      contact: notifyChannel === 'telegram' ? '@purchasing_lead' : '0912 345 678',
      sentAt: '2026-08-16 08:50',
      messageContent: notifyMessage,
      status: 'sent'
    };

    onSendRestockNotification(newLog);
    setShowNotifyModal(false);
    setToastMessage(`Đã gửi cảnh báo bổ sung hàng qua ${notifyChannel.toUpperCase()} cho ${activeAlertToNotify.purchaserStaff}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div id="dashboard-restock-alert-section" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-5">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Cảnh Báo Tồn Kho & Nhắc Bổ Sung Hàng Tự Động (Restock Warning Engine)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự động phát hiện SKU dưới mức tồn tối thiểu / mức cảnh báo, tính toán số lượng cần mua (Reorder Qty) và gửi thông báo đa kênh.
          </p>
        </div>

        {onOpenCreatePO && (
          <button
            onClick={() => onOpenCreatePO()}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo Đơn Mua Hàng (PO) Mới
          </button>
        )}
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* KPI 1: SKU cần bổ sung */}
        <div
          onClick={() => setSelectedLevelFilter('ALL')}
          className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 cursor-pointer hover:border-rose-300 transition"
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-bold uppercase">SKU Cần Bổ Sung</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-rose-800">{totalNeedReorderCount} SKU</div>
          <div className="text-[10px] text-rose-600 font-semibold mt-1">
            🔴 {totalCriticalCount} Nguy cấp • 🟠 {totalUrgentCount} Gấp
          </div>
        </div>

        {/* KPI 2: Tổng SL cần mua */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold uppercase">Tổng SL Cần Mua</span>
            <Package className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-amber-800">{totalReorderQty.toLocaleString()} Đơn vị</div>
          <div className="text-[10px] text-amber-600 font-semibold mt-1">Đã trừ tồn & hàng đang về</div>
        </div>

        {/* KPI 3: Giá trị dự kiến */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-[11px] font-bold uppercase">Giá Trị Dự Kiến Mua</span>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-indigo-900">{formatVND(totalEstPurchaseValue)}</div>
          <div className="text-[10px] text-indigo-600 font-semibold mt-1">Theo giá nhập gần nhất</div>
        </div>

        {/* KPI 4: Số kho ảnh hưởng */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-700 mb-1">
            <span className="text-[11px] font-bold uppercase">Kho Đang Thiếu Hàng</span>
            <WarehouseIcon className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-slate-900">{uniqueWarehousesAffected} Kho hàng</div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1">Cần điều chuyển / nhập</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedLevelFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedLevelFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({alerts.length})
          </button>
          <button
            onClick={() => setSelectedLevelFilter('critical')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedLevelFilter === 'critical'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            🔴 Nguy cấp ({totalCriticalCount})
          </button>
          <button
            onClick={() => setSelectedLevelFilter('urgent')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedLevelFilter === 'urgent'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}
          >
            🟠 Bổ sung gấp ({totalUrgentCount})
          </button>
          <button
            onClick={() => setSelectedLevelFilter('warning')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedLevelFilter === 'warning'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            🟡 Cảnh báo ({totalWarningCount})
          </button>
        </div>

        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm SKU / Tên SP / Kho..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Restock Alerts Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="py-3 px-3">STT</th>
                <th className="py-3 px-3">MỨC ĐỘ</th>
                <th className="py-3 px-3">KHO HÀNG</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">TÊN SẢN PHẨM</th>
                <th className="py-3 px-3 text-right">TỒN THỰC</th>
                <th className="py-3 px-3 text-right">TỒN KHẢ DỤNG</th>
                <th className="py-3 px-3 text-right">CẢNH BÁO / MỤC TIÊU</th>
                <th className="py-3 px-3 text-right">ĐANG VỀ</th>
                <th className="py-3 px-3 text-right">CẦN MUA</th>
                <th className="py-3 px-3">NCC ĐỀ XUẤT</th>
                <th className="py-3 px-3 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAlerts.map((item, idx) => {
                let badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                let badgeText = '🟡 Cảnh báo';
                if (item.alertLevel === 'critical') {
                  badgeColor = 'bg-red-100 text-red-800 border-red-300';
                  badgeText = '🔴 Nguy cấp';
                } else if (item.alertLevel === 'urgent') {
                  badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
                  badgeText = '🟠 Bổ sung gấp';
                }

                return (
                  <tr key={item.id} className="hover:bg-rose-50/30 transition">
                    <td className="py-3 px-3 font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.warehouseName}</td>
                    <td
                      onClick={() => onSelectSku && onSelectSku(item.sku)}
                      className="py-3 px-3 font-mono font-bold text-blue-700 cursor-pointer hover:underline"
                    >
                      {item.sku}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{item.productName}</td>
                    <td className="py-3 px-3 text-right font-mono">{item.physicalStock} {item.unit}</td>
                    <td className="py-3 px-3 text-right font-mono font-black text-rose-700">
                      {item.availableStock} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {item.warningThreshold} / {item.targetStock}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-blue-700 font-bold">
                      +{item.incomingStock}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/50">
                      {item.reorderQuantity} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-slate-700 truncate max-w-xs">{item.preferredSupplierName}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenNotifyModal(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          title="Gửi cảnh báo đến người phụ trách"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        {onOpenCreatePO && (
                          <button
                            onClick={() => onOpenCreatePO(item.sku)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                          >
                            Tạo PO
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-xs text-slate-400">
                    Không có SKU nào cần cảnh báo bổ sung trong bộ lọc này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Notification */}
      {showNotifyModal && activeAlertToNotify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                Gửi Cảnh Báo Nhắc Mua Hàng
              </h3>
              <button
                onClick={() => setShowNotifyModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Người nhận (Thu mua):</span>
                <div className="font-bold text-slate-800">{activeAlertToNotify.purchaserStaff}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Thủ kho phụ trách:</span>
                <div className="font-semibold text-slate-800">{activeAlertToNotify.warehouseStaff}</div>
              </div>
            </div>

            {/* Select Channel */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Chọn kênh gửi thông báo:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNotifyChannel('telegram')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    notifyChannel === 'telegram'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 text-sky-500" />
                  Telegram
                </button>
                <button
                  type="button"
                  onClick={() => setNotifyChannel('zalo_oa')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    notifyChannel === 'zalo_oa'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  Zalo OA
                </button>
                <button
                  type="button"
                  onClick={() => setNotifyChannel('email')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    notifyChannel === 'email'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  Email
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nội dung thông điệp:</label>
              <textarea
                rows={5}
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNotifyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSendNotification}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Gửi cảnh báo ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
