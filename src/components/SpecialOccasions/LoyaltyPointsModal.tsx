import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Sparkles,
  TrendingUp,
  Gift,
  CheckCircle2,
  Building2,
  AlertCircle
} from 'lucide-react';
import { Customer, LoyaltyTier, LoyaltyTransaction } from '../../types';
import { LOYALTY_TIER_CONFIG, formatVnd } from '../../data/specialOccasionsData';

interface LoyaltyPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSavePoints: (data: {
    customerId: string;
    pointsChange: number;
    transactionType: LoyaltyTransaction['type'];
    description: string;
    newTier?: LoyaltyTier;
  }) => void;
}

export const LoyaltyPointsModal: React.FC<LoyaltyPointsModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSavePoints
}) => {
  const [actionType, setActionType] = useState<'add_bonus' | 'redeem' | 'adjust'>('add_bonus');
  const [pointsAmount, setPointsAmount] = useState<number>(500);
  const [reason, setReason] = useState<string>('Thưởng điểm nhân dịp sinh nhật / Tri ân ngày lễ');
  const [tier, setTier] = useState<LoyaltyTier>(customer?.loyaltyTier || 'standard');

  useEffect(() => {
    if (customer) {
      setTier(customer.loyaltyTier || 'standard');
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const currentPoints = customer.loyaltyPoints || 0;
  const currentTier = customer.loyaltyTier || 'standard';
  const tierConfig = LOYALTY_TIER_CONFIG[currentTier];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointsAmount || pointsAmount <= 0) return;

    let delta = pointsAmount;
    let transType: LoyaltyTransaction['type'] = 'birthday_bonus';

    if (actionType === 'add_bonus') {
      delta = pointsAmount;
      transType = 'birthday_bonus';
    } else if (actionType === 'redeem') {
      delta = -Math.min(pointsAmount, currentPoints);
      transType = 'redeem_gift';
    } else {
      delta = pointsAmount;
      transType = 'manual_adjust';
    }

    onSavePoints({
      customerId: customer.id,
      pointsChange: delta,
      transactionType: transType,
      description: reason.trim() || 'Cập nhật điểm tích lũy',
      newTier: tier !== currentTier ? tier : undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Quản Lý Điểm Tích Lũy & Hạng Thẻ</h3>
              <p className="text-xs text-slate-500">{customer.code} - {customer.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Current Status Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Hạng thành viên hiện tại:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl">{tierConfig.icon}</span>
                <span className="font-extrabold text-sm text-amber-300">{tierConfig.label}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-medium">Điểm khả dụng:</span>
              <div className="text-xl font-black text-emerald-400">
                {currentPoints.toLocaleString('vi-VN')} <span className="text-xs font-bold text-slate-300">điểm</span>
              </div>
            </div>
          </div>

          {/* Action Tabs */}
          <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActionType('add_bonus');
                setReason('Tặng điểm thưởng tri ân ngày đặc biệt (Sinh nhật / Lễ Tết)');
              }}
              className={`flex-1 py-2 font-bold rounded-xl transition-all cursor-pointer ${
                actionType === 'add_bonus' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              + Tặng Điểm Thưởng
            </button>
            <button
              type="button"
              onClick={() => {
                setActionType('redeem');
                setReason('Đổi điểm lấy quà tặng / Voucher giảm giá');
              }}
              className={`flex-1 py-2 font-bold rounded-xl transition-all cursor-pointer ${
                actionType === 'redeem' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              - Đổi Quà / Trừ Điểm
            </button>
            <button
              type="button"
              onClick={() => {
                setActionType('adjust');
                setReason('Điều chỉnh điểm thủ công theo thỏa thuận');
              }}
              className={`flex-1 py-2 font-bold rounded-xl transition-all cursor-pointer ${
                actionType === 'adjust' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              ± Điều Chỉnh
            </button>
          </div>

          {/* Points input */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Số điểm {actionType === 'redeem' ? 'cần đổi / khấu trừ' : 'cần cộng thêm'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[200, 500, 1000, 2000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPointsAmount(preset)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    pointsAmount === preset
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={pointsAmount}
              onChange={(e) => setPointsAmount(Number(e.target.value))}
              min="1"
              max={actionType === 'redeem' ? currentPoints : 100000}
              className="mt-2 w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-bold text-slate-900 text-sm"
              required
            />
          </div>

          {/* Tier Selection */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Hạng thành viên
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as LoyaltyTier)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-semibold text-slate-800"
            >
              {Object.values(LOYALTY_TIER_CONFIG).map((t) => (
                <option key={t.tier} value={t.tier}>
                  {t.icon} {t.label} (Yêu cầu &gt;= {t.minPoints} điểm)
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Lý do ghi nhận / Diễn giải giao dịch
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none text-slate-800 font-medium"
              required
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận & Cập Nhật Điểm</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
