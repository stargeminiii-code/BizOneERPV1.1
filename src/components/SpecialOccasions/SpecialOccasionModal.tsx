import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Gift,
  Sparkles,
  User,
  Building2,
  DollarSign,
  Percent,
  Clock,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Customer, CustomerSpecialOccasion, SpecialOccasionType } from '../../types';
import { OCCASION_TYPE_CONFIG } from '../../data/specialOccasionsData';

interface SpecialOccasionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (occasion: CustomerSpecialOccasion) => void;
  occasionToEdit?: CustomerSpecialOccasion | null;
  customers: Customer[];
  selectedCustomerId?: string;
}

export const SpecialOccasionModal: React.FC<SpecialOccasionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  occasionToEdit,
  customers = [],
  selectedCustomerId
}) => {
  const [customerId, setCustomerId] = useState(selectedCustomerId || (customers[0]?.id ?? ''));
  const [type, setType] = useState<SpecialOccasionType>('birthday');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-08-21');
  const [isLunar, setIsLunar] = useState(false);
  const [lunarDateStr, setLunarDateStr] = useState('');
  const [reminderDaysBefore, setReminderDaysBefore] = useState(3);
  const [giftBudget, setGiftBudget] = useState(500000);
  const [giftName, setGiftName] = useState('');
  const [giftStatus, setGiftStatus] = useState<'not_sent' | 'prepared' | 'delivering' | 'delivered'>('not_sent');
  const [bonusPoints, setBonusPoints] = useState(500);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [assignedStaff, setAssignedStaff] = useState('Lê Hoàng Nam');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (occasionToEdit) {
      setCustomerId(occasionToEdit.customerId);
      setType(occasionToEdit.type);
      setTitle(occasionToEdit.title);
      setDate(occasionToEdit.date);
      setIsLunar(occasionToEdit.isLunar || false);
      setLunarDateStr(occasionToEdit.lunarDateStr || '');
      setReminderDaysBefore(occasionToEdit.reminderDaysBefore);
      setGiftBudget(occasionToEdit.giftBudget || 0);
      setGiftName(occasionToEdit.giftName || '');
      setGiftStatus(occasionToEdit.giftStatus || 'not_sent');
      setBonusPoints(occasionToEdit.bonusPoints || 0);
      setDiscountPercent(occasionToEdit.discountPercent || 0);
      setAssignedStaff(occasionToEdit.assignedStaff || 'Lê Hoàng Nam');
      setNotes(occasionToEdit.notes || '');
    } else {
      const targetCust = customers.find((c) => c.id === (selectedCustomerId || customerId)) || customers[0];
      if (targetCust) {
        setCustomerId(targetCust.id);
        setAssignedStaff(targetCust.assignedStaff || 'Lê Hoàng Nam');
      }
      const config = OCCASION_TYPE_CONFIG[type];
      setTitle(`${config.shortLabel} - ${targetCust?.name || ''}`);
      setReminderDaysBefore(config.defaultReminderDays);
      setGiftBudget(500000);
      setGiftName(config.defaultGift);
      setBonusPoints(config.defaultBonusPoints);
      setDiscountPercent(config.defaultDiscount);
      setDate('2026-08-25');
      setIsLunar(type === 'mid_autumn' || type === 'tet_holiday');
      setLunarDateStr(type === 'mid_autumn' ? '15/08 Âm lịch' : '');
      setGiftStatus('not_sent');
      setNotes('');
    }
  }, [occasionToEdit, isOpen, selectedCustomerId]);

  // Handle Type Change
  const handleTypeChange = (newType: SpecialOccasionType) => {
    setType(newType);
    const config = OCCASION_TYPE_CONFIG[newType];
    const targetCust = customers.find((c) => c.id === customerId);
    setTitle(`${config.shortLabel} - ${targetCust?.name || ''}`);
    setReminderDaysBefore(config.defaultReminderDays);
    setGiftName(config.defaultGift);
    setBonusPoints(config.defaultBonusPoints);
    setDiscountPercent(config.defaultDiscount);
    if (newType === 'mid_autumn') {
      setIsLunar(true);
      setLunarDateStr('15/08 Âm lịch');
      setDate('2026-09-08');
    } else if (newType === 'tet_holiday') {
      setIsLunar(true);
      setLunarDateStr('01/01 Âm lịch');
      setDate('2027-02-06');
    } else if (newType === 'women_day_vn') {
      setDate('2026-10-20');
      setIsLunar(false);
    } else if (newType === 'business_day_vn') {
      setDate('2026-10-13');
      setIsLunar(false);
    } else if (newType === 'christmas') {
      setDate('2026-12-25');
      setIsLunar(false);
    } else if (newType === 'new_year') {
      setDate('2027-01-01');
      setIsLunar(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCust = customers.find((c) => c.id === customerId);
    if (!targetCust || !title.trim()) return;

    const occasion: CustomerSpecialOccasion = {
      id: occasionToEdit ? occasionToEdit.id : `occ-${Date.now()}`,
      customerId: targetCust.id,
      customerName: targetCust.name,
      customerPhone: targetCust.phone,
      customerGroup: targetCust.group,
      type,
      title: title.trim(),
      date,
      isLunar,
      lunarDateStr: isLunar ? lunarDateStr : undefined,
      reminderDaysBefore,
      giftBudget,
      giftName: giftName.trim(),
      giftStatus,
      bonusPoints,
      discountPercent,
      assignedStaff,
      status: 'upcoming',
      notes: notes.trim()
    };

    onSave(occasion);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-rose-50 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {occasionToEdit ? 'Chỉnh Sửa Dịp Đặc Biệt' : 'Thiết Lập Dịp Đặc Biệt & Nhắc Nhở'}
              </h3>
              <p className="text-xs text-slate-500">
                Ghi nhớ sinh nhật, ngày thành lập, lễ Tết & tự động kích hoạt ưu đãi tri ân
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Customer & Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Đối tác / Khách hàng <span className="text-rose-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-semibold text-slate-800"
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.group})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Loại dịp đặc biệt <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as SpecialOccasionType)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-semibold text-slate-800"
              >
                {Object.values(OCCASION_TYPE_CONFIG).map((cfg) => (
                  <option key={cfg.type} value={cfg.type}>
                    {cfg.icon} {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Tiêu đề sự kiện / Tên người được chúc mừng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Sinh nhật Tổng Giám Đốc Nguyễn Văn A / Kỷ niệm 10 năm thành lập..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-slate-800"
              required
            />
          </div>

          {/* Date and Calendar Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Ngày diễn ra (Dương lịch) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none font-semibold text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Nhắc trước (Số ngày)
              </label>
              <select
                value={reminderDaysBefore}
                onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none font-semibold text-slate-800"
              >
                <option value={1}>Trước 1 ngày</option>
                <option value={3}>Trước 3 ngày (Khuyên dùng)</option>
                <option value={5}>Trước 5 ngày</option>
                <option value={7}>Trước 7 ngày (1 tuần)</option>
                <option value={10}>Trước 10 ngày</option>
                <option value={15}>Trước 15 ngày (Dịp Tết)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>Âm lịch (Lunar)</span>
                <input
                  type="checkbox"
                  checked={isLunar}
                  onChange={(e) => setIsLunar(e.target.checked)}
                  className="rounded text-rose-600 cursor-pointer"
                />
              </label>
              <input
                type="text"
                value={lunarDateStr}
                onChange={(e) => setLunarDateStr(e.target.value)}
                placeholder="VD: 15/08 Âm lịch"
                disabled={!isLunar}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none font-semibold text-slate-800 disabled:opacity-40"
              />
            </div>
          </div>

          {/* Loyalty Bonus & Gift Planning */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Điểm thưởng tặng (+Điểm)
              </label>
              <input
                type="number"
                value={bonusPoints}
                onChange={(e) => setBonusPoints(Number(e.target.value))}
                step="50"
                min="0"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-bold text-amber-700"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-rose-500" />
                Voucher giảm giá (%)
              </label>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                min="0"
                max="50"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-bold text-rose-700"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Ngân sách quà tặng (VNĐ)
              </label>
              <input
                type="number"
                value={giftBudget}
                onChange={(e) => setGiftBudget(Number(e.target.value))}
                step="50000"
                min="0"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-bold text-emerald-700"
              />
            </div>
          </div>

          {/* Gift item name & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-purple-600" />
                Tên món quà / Hiện vật dự kiến
              </label>
              <input
                type="text"
                value={giftName}
                onChange={(e) => setGiftName(e.target.value)}
                placeholder="VD: Hộp bánh Trung Thu Kinh Đô, Lẵng hoa lan, Rượu vang..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Nhân sự Sales phụ trách
              </label>
              <input
                type="text"
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Ghi chú riêng về sở thích / quy cách tặng quà
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Giám đốc thích hoa lan vàng, gửi kèm thiệp tay viết riêng, giao trước 9h sáng..."
              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none text-slate-700 resize-none"
            />
          </div>

          {/* Actions Button */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{occasionToEdit ? 'Lưu Thay Đổi' : 'Tạo Nhắc Nhở'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
