import React, { useState } from 'react';
import { X, QrCode, Copy, Check, Sparkles, Download, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order } from '../../types';

interface VietQrModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (orderId: string) => void;
}

export const VietQrModal: React.FC<VietQrModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmPayment
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const bankName = 'MBBank (Ngân hàng Quân Đội)';
  const bankAccount = '999988886666';
  const accountHolder = 'CONG TY CP BIZONE VIET NAM';
  const transferContent = order ? `THANHTOAN ${order.code}` : '';

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSuccess = () => {
    if (!order) return;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    onConfirmPayment(order.id);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  if (!isOpen || !order) return null;

  // Generate dynamic VietQR standard image link
  const qrUrl = `https://img.vietqr.io/image/MB-999988886666-compact2.png?amount=${order.totalAmount}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent(accountHolder)}`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Thanh toán VietQR 24/7</h3>
              <p className="text-xs text-blue-100">Quét mã bằng app ngân hàng bất kỳ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Body */}
        <div className="p-6 flex flex-col items-center space-y-4">
          <div className="relative p-3 bg-white rounded-2xl border-2 border-dashed border-blue-200 shadow-inner flex flex-col items-center">
            <img
              src={qrUrl}
              alt="VietQR Code"
              className="w-56 h-56 object-contain rounded-lg"
            />
            <div className="mt-2 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Số tiền cần thanh toán
              </span>
              <div className="text-xl font-extrabold text-blue-700">
                {formatVND(order.totalAmount)}
              </div>
            </div>
          </div>

          {/* Account Details Box */}
          <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ngân hàng:</span>
              <span className="font-bold text-slate-800">{bankName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Số tài khoản:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900">{bankAccount}</span>
                <button
                  onClick={() => copyToClipboard(bankAccount, 'acc')}
                  className="text-blue-600 hover:text-blue-700"
                  title="Sao chép STK"
                >
                  {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Chủ tài khoản:</span>
              <span className="font-bold text-slate-800">{accountHolder}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">Nội dung CK:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-800">{transferContent}</span>
                <button
                  onClick={() => copyToClipboard(transferContent, 'content')}
                  className="text-blue-600 hover:text-blue-700"
                  title="Sao chép nội dung"
                >
                  {copiedField === 'content' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              Để sau
            </button>
            <button
              onClick={handleSuccess}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận đã nhận tiền</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
