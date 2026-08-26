import React, { useState, useEffect } from 'react';
import { X, Settings, ShieldCheck, Check, AlertCircle, Save, Sliders, RefreshCw, Zap } from 'lucide-react';
import { DailyTransactionConfig } from '../../types';
import { TransactionEngineService } from '../../services/transactionEngine';

interface TransactionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  isAdmin?: boolean;
}

export const TransactionConfigModal: React.FC<TransactionConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  isAdmin = true
}) => {
  const [config, setConfig] = useState<DailyTransactionConfig>({
    enabled: true,
    min: 4,
    max: 6,
    maxPerDay: 6,
    adaptiveAdOpportunity: true,
    updatedAt: new Date().toISOString()
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await TransactionEngineService.getConfig();
      if (res.success && res.config) {
        setConfig(res.config);
      }
    } catch (e: any) {
      setErrorMessage('Không thể tải cấu hình từ máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    const minVal = Number(config.min);
    const maxVal = Number(config.max);
    const maxPerDayVal = Number(config.maxPerDay ?? config.max);

    if (isNaN(minVal) || minVal < 0) {
      setErrorMessage('Mục tiêu tối thiểu (Min) phải là số không âm (>= 0).');
      return;
    }
    if (isNaN(maxVal) || maxVal < minVal) {
      setErrorMessage('Mục tiêu tối đa (Max) phải lớn hơn hoặc bằng mục tiêu tối thiểu (Min).');
      return;
    }
    if (isNaN(maxPerDayVal) || maxPerDayVal < maxVal) {
      setErrorMessage('Giới hạn trần tối đa trong ngày (Max/Ngày) phải lớn hơn hoặc bằng Max target.');
      return;
    }

    setSaving(true);
    try {
      const res = await TransactionEngineService.saveConfig({
        enabled: config.enabled,
        min: minVal,
        max: maxVal,
        maxPerDay: maxPerDayVal,
        adaptiveAdOpportunity: config.adaptiveAdOpportunity
      });

      if (res.success) {
        setSuccessMessage('Đã lưu cấu hình mục tiêu giao dịch và cơ chế Ad Opportunity thành công!');
        if (res.config) setConfig(res.config);
        if (onSaved) onSaved();
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setErrorMessage(res.error || 'Lỗi khi lưu cấu hình');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Lỗi kết nối khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide">CẤU HÌNH GIAO DỊCH & AD OPPORTUNITY</h3>
              <p className="text-xs text-slate-300">Thiết lập mục tiêu ngày và cơ chế điều phối quảng cáo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start space-x-3 text-emerald-600 dark:text-emerald-400 text-xs">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {!isAdmin && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-300 text-xs">
              Chỉ Quản trị viên (Admin/Super Admin) mới có quyền chỉnh sửa cấu hình này.
            </div>
          )}

          {/* Toggle: Kích hoạt Target */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div>
              <div className="font-semibold text-sm text-slate-900 dark:text-white">Kích hoạt Mục Tiêu Giao Dịch Ngày</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Hiển thị và theo dõi tiến độ trên Dashboard Hệ thống 2</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                disabled={!isAdmin || loading || saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Range Inputs: Min & Max Target */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mục tiêu tối thiểu (Min / ngày)
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                value={config.min}
                onChange={(e) => setConfig({ ...config, min: parseInt(e.target.value) || 0 })}
                disabled={!isAdmin || loading || saving}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">Mức tối thiểu được phân bổ ngẫu nhiên ổn định trong ngày</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mục tiêu tối đa (Max / ngày)
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                value={config.max}
                onChange={(e) => setConfig({ ...config, max: parseInt(e.target.value) || 0 })}
                disabled={!isAdmin || loading || saving}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">Mức trần mục tiêu ngày</p>
            </div>
          </div>

          {/* Max Per Day Limit */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Giới hạn trần tối đa trong ngày (Max Per Day)
            </label>
            <input
              type="number"
              min="0"
              max="2000"
              value={config.maxPerDay ?? config.max}
              onChange={(e) => setConfig({ ...config, maxPerDay: parseInt(e.target.value) || 0 })}
              disabled={!isAdmin || loading || saving}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">
              Khi số giao dịch SALE đạt ngưỡng này, Ad Opportunity Engine chuyển sang trạng thái <strong>STOP / GIẢM THẦU</strong> để tiết kiệm ngân sách.
            </p>
          </div>

          {/* Toggle: Adaptive Ad Opportunity */}
          <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800/40">
            <div className="pr-4">
              <div className="font-semibold text-sm text-indigo-950 dark:text-indigo-200 flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-indigo-500" />
                <span>Tự động điều chỉnh Cơ Hội Quảng Cáo (Ad Opportunity)</span>
              </div>
              <div className="text-xs text-indigo-700/80 dark:text-indigo-400 mt-0.5">
                Tự động phát tín hiệu HIGH khi thiếu đơn và STOP khi vượt hạn mức
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={config.adaptiveAdOpportunity}
                onChange={(e) => setConfig({ ...config, adaptiveAdOpportunity: e.target.checked })}
                disabled={!isAdmin || loading || saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Audit Timestamp info */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div>
              <strong>Cập nhật lần cuối:</strong> {config.updatedAt ? new Date(config.updatedAt).toLocaleString('vi-VN') : 'Mặc định'}
            </div>
            {config.updatedBy && (
              <div>
                <strong>Người cập nhật:</strong> {config.updatedBy}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Đóng
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>LƯU CẤU HÌNH</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
