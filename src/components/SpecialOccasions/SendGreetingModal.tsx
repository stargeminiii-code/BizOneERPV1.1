import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Copy,
  Check,
  MessageCircle,
  Phone,
  Mail,
  Gift,
  Award,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { CustomerSpecialOccasion, Customer } from '../../types';
import { DEFAULT_GREETING_TEMPLATES, formatVnd } from '../../data/specialOccasionsData';

interface SendGreetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  occasion: CustomerSpecialOccasion | null;
  customer?: Customer;
  onConfirmSend: (data: {
    occasionId: string;
    customerId: string;
    channel: 'zalo' | 'sms' | 'email';
    content: string;
    bonusPointsGranted: number;
    giftStatusUpdated?: 'not_sent' | 'prepared' | 'delivering' | 'delivered';
  }) => void;
}

export const SendGreetingModal: React.FC<SendGreetingModalProps> = ({
  isOpen,
  onClose,
  occasion,
  customer,
  onConfirmSend
}) => {
  const [channel, setChannel] = useState<'zalo' | 'sms' | 'email'>('zalo');
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [grantBonusPoints, setGrantBonusPoints] = useState(true);
  const [bonusPoints, setBonusPoints] = useState(500);
  const [updateGiftStatus, setUpdateGiftStatus] = useState(true);
  const [giftStatus, setGiftStatus] = useState<'not_sent' | 'prepared' | 'delivering' | 'delivered'>('delivered');
  const [isSuccessSent, setIsSuccessSent] = useState(false);

  useEffect(() => {
    if (!occasion) return;

    setBonusPoints(occasion.bonusPoints || 500);
    setGiftStatus(occasion.giftStatus === 'delivered' ? 'delivered' : 'delivering');

    // Find default template
    const tmpl = DEFAULT_GREETING_TEMPLATES.find((t) => t.occasionType === occasion.type) || DEFAULT_GREETING_TEMPLATES[0];
    
    // Interpolate message
    const custName = customer?.name || occasion.customerName;
    const repName = customer?.representative || customer?.contactPerson || 'Quý đối tác';
    const staffName = occasion.assignedStaff || customer?.assignedStaff || 'Lê Hoàng Nam';
    const staffPhone = customer?.assignedStaffPhone || '0912 345 678';
    const pointsStr = (occasion.bonusPoints || 500).toLocaleString('vi-VN');
    const discountStr = (occasion.discountPercent || 10).toString();

    let text = tmpl.content
      .replace(/{{CUSTOMER_NAME}}/g, custName)
      .replace(/{{REPRESENTATIVE_NAME}}/g, repName)
      .replace(/{{STAFF_NAME}}/g, staffName)
      .replace(/{{STAFF_PHONE}}/g, staffPhone)
      .replace(/{{POINTS}}/g, pointsStr)
      .replace(/{{DISCOUNT}}/g, discountStr);

    setContent(text);
    setIsSuccessSent(false);
  }, [occasion, customer, isOpen]);

  if (!isOpen || !occasion) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendAction = () => {
    onConfirmSend({
      occasionId: occasion.id,
      customerId: occasion.customerId,
      channel,
      content,
      bonusPointsGranted: grantBonusPoints ? bonusPoints : 0,
      giftStatusUpdated: updateGiftStatus ? giftStatus : undefined
    });
    setIsSuccessSent(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-rose-50 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Gửi Lời Chúc Mừng & Tri Ân
              </h3>
              <p className="text-xs text-slate-500">
                {occasion.title} ({occasion.customerName})
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

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Channel selector */}
          <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setChannel('zalo')}
              className={`flex-1 py-2 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                channel === 'zalo' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Gửi qua Zalo</span>
            </button>
            <button
              onClick={() => setChannel('sms')}
              className={`flex-1 py-2 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                channel === 'sms' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Gửi tin nhắn SMS</span>
            </button>
            <button
              onClick={() => setChannel('email')}
              className={`flex-1 py-2 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                channel === 'email' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Gửi Email Brand</span>
            </button>
          </div>

          {/* Recipient summary */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-slate-500 font-medium">Người nhận:</span>{' '}
              <strong className="text-slate-900">{customer?.representative || occasion.customerName}</strong>
              {customer?.phone && <span className="text-slate-400 font-mono ml-2">({customer.phone})</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full">
                {occasion.date}
              </span>
              {occasion.isLunar && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  {occasion.lunarDateStr || 'Âm lịch'}
                </span>
              )}
            </div>
          </div>

          {/* Editable message content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700">Nội dung tin nhắn chúc mừng & tri ân</label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép tin nhắn'}</span>
              </button>
            </div>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3.5 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 leading-relaxed font-sans"
            />
          </div>

          {/* Bonus Points and Gift Action Triggers */}
          <div className="bg-gradient-to-br from-amber-50/70 to-rose-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={grantBonusPoints}
                  onChange={(e) => setGrantBonusPoints(e.target.checked)}
                  className="rounded text-amber-600 w-4 h-4 cursor-pointer"
                />
                <Award className="w-4 h-4 text-amber-600" />
                <span>Kích hoạt tặng điểm thưởng tích lũy:</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={bonusPoints}
                  onChange={(e) => setBonusPoints(Number(e.target.value))}
                  disabled={!grantBonusPoints}
                  className="w-24 px-2 py-1 border border-amber-300 rounded-lg bg-white font-bold text-amber-800 text-right disabled:opacity-40"
                />
                <span className="font-bold text-amber-800">điểm</span>
              </div>
            </div>

            {occasion.giftName && (
              <div className="flex items-center justify-between pt-2 border-t border-amber-200/60">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={updateGiftStatus}
                    onChange={(e) => setUpdateGiftStatus(e.target.checked)}
                    className="rounded text-rose-600 w-4 h-4 cursor-pointer"
                  />
                  <Gift className="w-4 h-4 text-rose-600" />
                  <span>Cập nhật trạng thái quà ({occasion.giftName}):</span>
                </label>
                <select
                  value={giftStatus}
                  onChange={(e) => setGiftStatus(e.target.value as any)}
                  disabled={!updateGiftStatus}
                  className="px-2.5 py-1 border border-rose-300 rounded-lg bg-white font-bold text-rose-800 disabled:opacity-40"
                >
                  <option value="prepared">Đã chuẩn bị quà</option>
                  <option value="delivering">Đang giao quà</option>
                  <option value="delivered">Đã trao tận tay (Hoàn tất)</option>
                </select>
              </div>
            )}
          </div>

          {/* Success Message Banner if sent */}
          {isSuccessSent && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Đã gửi lời chúc mừng & cập nhật điểm thưởng thành công!</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSendAction}
              disabled={isSuccessSent}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Gửi Ngay & Kích Hoạt Tri Ân</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
