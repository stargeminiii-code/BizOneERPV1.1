import React, { useState } from 'react';
import {
  Globe,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRightLeft,
  Key,
  Shield,
  FileCode,
  Zap,
  RotateCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Server,
  Activity
} from 'lucide-react';
import {
  INITIAL_ECOMMERCE_CHANNELS,
  INITIAL_SKU_MAPPINGS,
  INITIAL_SYNC_LOGS,
  INITIAL_SYNC_ERRORS,
  EcommerceChannel,
  SkuMapping,
  SyncLogEntry,
  SyncErrorQueueItem
} from '../data/ecommerceData';
import { formatNumberWithDots } from '../data/administrativeData';

export const ApiIntegrationsView: React.FC = () => {
  const [channels, setChannels] = useState<EcommerceChannel[]>(INITIAL_ECOMMERCE_CHANNELS);
  const [skuMappings, setSkuMappings] = useState<SkuMapping[]>(INITIAL_SKU_MAPPINGS);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>(INITIAL_SYNC_LOGS);
  const [syncErrors, setSyncErrors] = useState<SyncErrorQueueItem[]>(INITIAL_SYNC_ERRORS);
  const [activeTab, setActiveTab] = useState<'channels' | 'sku_mapping' | 'sync_logs' | 'error_queue'>('channels');
  const [isSimulatingSync, setIsSimulatingSync] = useState(false);

  const handleSimulateSync = () => {
    setIsSimulatingSync(true);
    setTimeout(() => {
      setIsSimulatingSync(false);
      const newLog: SyncLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        platform: 'Shopee & TikTok Shop',
        eventType: 'STOCK_PUSH',
        httpStatus: 200,
        latencyMs: 165,
        status: 'SUCCESS',
        message: 'Đã hoàn tất đồng bộ tồn kho an toàn 2 chiều và khớp lệnh 3 đơn mới thành công.',
        payloadSummary: '{"sync_status": "synced", "items_updated": 42, "latency": "165ms"}'
      };
      setSyncLogs((prev) => [newLog, ...prev]);
    }, 800);
  };

  const handleRetryError = (errId: string) => {
    setSyncErrors((prev) => prev.filter((e) => e.id !== errId));
    const retryLog: SyncLogEntry = {
      id: `log-retry-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      platform: 'Shopee Mall',
      eventType: 'ORDER_CREATED',
      orderCode: 'SP-260822-11094',
      httpStatus: 200,
      latencyMs: 120,
      status: 'SUCCESS',
      message: 'Đã retry xử lý đơn lỗi thành công sau khi ánh xạ SKU tương ứng.',
      payloadSummary: '{"retry": "success", "order_id": "SP-260822-11094"}'
    };
    setSyncLogs((prev) => [retryLog, ...prev]);
  };

  return (
    <div id="api-integrations-container" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1680px] mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-blue-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-400" />
            <span>TMĐT & API</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateSync}
            disabled={isSimulatingSync}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isSimulatingSync ? 'animate-spin' : ''}`} />
            <span>{isSimulatingSync ? 'Đang đồng bộ...' : 'Đồng Bộ Realtime Ngay'}</span>
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'channels'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Kênh Kết Nối ({channels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sku_mapping')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'sku_mapping'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>SKU Mapping ({skuMappings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sync_logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'sync_logs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Nhật Ký API & Webhook ({syncLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('error_queue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'error_queue'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Hàng Đợi Lỗi / Retry ({syncErrors.length})</span>
        </button>
      </div>

      {/* Tab 1: Channels */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {channels.map((ch) => (
            <div key={ch.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    ch.platform === 'shopee'
                      ? 'bg-orange-100 text-orange-800'
                      : ch.platform === 'tiktok'
                      ? 'bg-slate-900 text-white'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {ch.platform.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đã Kết Nối
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900">{ch.name}</h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">Shop ID: {ch.shopId}</div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Webhook:</span>
                    <span className="font-mono text-slate-600 truncate max-w-[170px]" title={ch.webhookUrl}>
                      {ch.webhookUrl}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kho xuất FIFO:</span>
                    <span className="font-bold text-slate-800">{ch.assignedWarehouseName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Đơn đã đồng bộ:</span>
                    <span className="font-black text-slate-900">{ch.totalOrdersSynced} đơn</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Doanh thu sàn:</span>
                    <span className="font-black text-emerald-600">{formatNumberWithDots(ch.totalRevenueSynced)} đ</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Cập nhật: {ch.lastSyncTime}</span>
                <button className="text-blue-600 font-bold hover:underline">Cấu hình API →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: SKU Mapping */}
      {activeTab === 'sku_mapping' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Bảng Ánh Xạ Mã Hàng (SKU Mapping Engine)</h2>
              <p className="text-xs text-slate-500">Quy đổi mã SKU trên Shopee, TikTok Shop về đúng Master SKU trong kho để tự động trừ tồn kho chính xác</p>
            </div>
            <button className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Thêm SKU Mapping Mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">Sàn / Kênh</th>
                  <th className="py-3 px-3">Mã SKU Trên Sàn</th>
                  <th className="py-3 px-3">Tên Sản Phẩm Trên Sàn</th>
                  <th className="py-3 px-3">Mã SKU Hệ Thống</th>
                  <th className="py-3 px-3">Tên Master SKU</th>
                  <th className="py-3 px-3 text-right">Tỷ Lệ Quy Đổi</th>
                  <th className="py-3 px-3 text-right">Tồn Đã Đẩy Lên Sàn</th>
                  <th className="py-3 px-3">Tự Động Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {skuMappings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-bold text-slate-700">{m.channelShopName}</td>
                    <td className="py-3 px-3 font-mono font-bold text-orange-700 bg-orange-50/50 rounded-lg">{m.channelSku}</td>
                    <td className="py-3 px-3 font-medium text-slate-800 max-w-[200px] truncate">{m.channelProductName}</td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 bg-blue-50/50 rounded-lg">{m.systemSku}</td>
                    <td className="py-3 px-3 font-medium text-slate-800 max-w-[200px] truncate">{m.systemProductName}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">1 : {m.conversionRatio}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600">{m.lastStockPushed} sp</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                        Bật Realtime
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Sync Logs */}
      {activeTab === 'sync_logs' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Nhật Ký API Webhook & Đồng Bộ Realtime</h2>
              <p className="text-xs text-slate-500">Ghi lại toàn bộ HTTP requests, độ trễ phản hồi (latency ms) và thông điệp payload</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {syncLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] font-mono">
                      HTTP {log.httpStatus} OK
                    </span>
                    <span className="font-mono text-slate-400">{log.timestamp}</span>
                    <span className="font-bold text-slate-900">{log.platform}</span>
                    <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[10px] rounded font-mono">
                      {log.eventType}
                    </span>
                  </div>
                  <div className="font-medium text-slate-800">{log.message}</div>
                  <div className="font-mono text-[11px] text-slate-400 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    {log.payloadSummary}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono font-bold text-slate-500">{log.latencyMs} ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Error Queue */}
      {activeTab === 'error_queue' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hàng Đợi Lỗi Đồng Bộ (Sync Error & Retry Queue)</h2>
              <p className="text-xs text-slate-500">Các giao dịch webhook gặp sự cố (ví dụ SKU chưa map hoặc mạng gián đoạn)</p>
            </div>
          </div>

          {syncErrors.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              Không có lỗi nào đang tồn đọng trong hàng đợi!
            </div>
          ) : (
            <div className="space-y-3">
              {syncErrors.map((err) => (
                <div key={err.id} className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-red-800">{err.platform}</span>
                      <span className="font-mono text-slate-600">Đơn hàng: {err.externalOrderCode}</span>
                      <span className="text-slate-400">({err.receivedAt})</span>
                    </div>
                    <div className="text-red-700 font-medium">Nguyên nhân: {err.errorReason}</div>
                    <div className="text-[11px] text-slate-500">Đã thử lại: {err.retryAttempts}/{err.maxAttempts} lần</div>
                  </div>

                  <button
                    onClick={() => handleRetryError(err.id)}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Thử Lại Ngay (Retry)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
