import React, { useState, useEffect } from 'react';
import { X, History, Filter, RefreshCw, CheckCircle2, AlertTriangle, Shield, Copy, Check } from 'lucide-react';
import { TransactionAuditEntry } from '../../types';
import { TransactionEngineService } from '../../services/transactionEngine';

interface TransactionAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionAuditModal: React.FC<TransactionAuditModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<TransactionAuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await TransactionEngineService.getAuditLogs();
      if (res.success && res.logs) {
        setLogs(res.logs);
      }
    } catch (e) {
      console.warn('Error loading audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'ALL') return true;
    return log.action === filterAction;
  });

  const getActionMeta = (action: string) => {
    switch (action) {
      case 'TRANSACTION_CONFIRMED':
      case 'TRANSACTION_CREATED':
        return {
          label: 'GIAO DỊCH SALE',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          dotColor: 'bg-emerald-500'
        };
      case 'IDEMPOTENCY_DUPLICATE_HIT':
        return {
          label: 'TRÙNG LẶP IDEMPOTENCY',
          badgeClass: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
          dotColor: 'bg-purple-500'
        };
      case 'TRANSACTION_CANCELLED':
        return {
          label: 'HỦY GIAO DỊCH',
          badgeClass: 'bg-red-500/10 text-red-600 border-red-500/20',
          dotColor: 'bg-red-500'
        };
      case 'TRANSACTION_REFUNDED':
        return {
          label: 'HOÀN TIỀN',
          badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          dotColor: 'bg-amber-500'
        };
      case 'TARGET_CREATED':
      case 'TARGET_UPDATED':
        return {
          label: 'MỤC TIÊU NGÀY',
          badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
          dotColor: 'bg-blue-500'
        };
      case 'CONFIG_UPDATED':
        return {
          label: 'CẬP NHẬT CẤU HÌNH',
          badgeClass: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
          dotColor: 'bg-indigo-500'
        };
      default:
        return {
          label: action,
          badgeClass: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
          dotColor: 'bg-slate-500'
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide">NHẬT KÝ KIỂM TOÁN GIAO DỊCH & TARGET</h3>
              <p className="text-xs text-slate-300">Theo dõi toàn bộ lịch sử tạo giao dịch SALE, Idempotency và Cấu hình</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Tải lại"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">Lọc theo hành động:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">Tất cả hành động ({logs.length})</option>
              <option value="TRANSACTION_CONFIRMED">Giao dịch SALE xác nhận</option>
              <option value="IDEMPOTENCY_DUPLICATE_HIT">Trùng lặp Idempotency</option>
              <option value="TARGET_CREATED">Tạo Target Snapshot</option>
              <option value="CONFIG_UPDATED">Cập nhật cấu hình</option>
              <option value="TRANSACTION_CANCELLED">Hủy giao dịch</option>
            </select>
          </div>
          <span className="text-[11px] text-slate-400">Hiển thị {filteredLogs.length} bản ghi</span>
        </div>

        {/* Logs List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span>Đang tải nhật ký kiểm toán...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Chưa có bản ghi kiểm toán nào phù hợp với bộ lọc.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const meta = getActionMeta(log.action);
              return (
                <div
                  key={log.id}
                  className="p-3.5 bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${meta.dotColor}`}></span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.actorName || log.actorId}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <div className="text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {log.details || 'Không có mô tả chi tiết'}
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-700/40">
                    <span className="font-mono text-[10px]">ID: {log.id}</span>
                    {log.entityId && (
                      <button
                        type="button"
                        onClick={() => handleCopy(log.id, log.entityId)}
                        className="flex items-center space-x-1 hover:text-slate-600 dark:hover:text-slate-200 font-mono text-[10px]"
                      >
                        <span>Entity: {log.entityId}</span>
                        {copiedId === log.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
