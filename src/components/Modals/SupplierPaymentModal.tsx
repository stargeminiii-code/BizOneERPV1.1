import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building2,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  QrCode,
  ArrowDownRight
} from 'lucide-react';
import { Supplier, SupplierPaymentVoucher, PaymentMethod } from '../../types';

interface SupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSupplierId?: string;
  suppliers: Supplier[];
  onSavePayment: (payment: SupplierPaymentVoucher) => void;
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  defaultSupplierId,
  suppliers,
  onSavePayment
}) => {
  const initialSupplier = suppliers.find((s) => s.id === defaultSupplierId) || suppliers[0];

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(initialSupplier?.id || '');
  const [amount, setAmount] = useState<number>(initialSupplier?.debt || 10000000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 16).replace('T', ' ')
  );
  const [referencePoCode, setReferencePoCode] = useState<string>('');
  const [note, setNote] = useState<string>('Thanh toán công nợ tiền hàng');

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) || initialSupplier;

  useEffect(() => {
    if (defaultSupplierId) {
      setSelectedSupplierId(defaultSupplierId);
      const sup = suppliers.find((s) => s.id === defaultSupplierId);
      if (sup) {
        setAmount(sup.debt > 0 ? sup.debt : 10000000);
      }
    }
  }, [defaultSupplierId, suppliers]);

  const handleSupplierChange = (sId: string) => {
    setSelectedSupplierId(sId);
    const sup = suppliers.find((s) => s.id === sId);
    if (sup && sup.debt > 0) {
      setAmount(sup.debt);
    }
  };

  const handleQuickPercent = (percent: number) => {
    if (!selectedSupplier) return;
    const currentDebt = selectedSupplier.debt || 0;
    setAmount(Math.round((currentDebt * percent) / 100));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Vui lòng nhập số tiền thanh toán lớn hơn 0!');
      return;
    }

    const voucher: SupplierPaymentVoucher = {
      id: `pay-${Date.now()}`,
      code: `PC-NCC-${Date.now().toString().slice(-4)}`,
      supplierId: selectedSupplier?.id || '',
      supplierName: selectedSupplier?.name || 'Nhà cung cấp',
      supplierCode: selectedSupplier?.code,
      amount: Number(amount),
      paymentMethod,
      paymentDate,
      referencePoCode: referencePoCode.trim() || undefined,
      bankAccount: selectedSupplier?.bankAccount ? `${selectedSupplier.bankAccount} (${selectedSupplier.bankName || ''})` : undefined,
      note: note.trim(),
      creator: 'Trần Thị Mai (Kế toán)',
      status: 'completed'
    };

    onSavePayment(voucher);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Lập Phiếu Chi Thanh Toán NCC
              </h2>
              <p className="text-xs text-slate-500">
                Ghi nhận chi trả nợ nhà cung cấp & tự động trừ công nợ đối tác
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {/* Select Supplier */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nhà cung cấp thụ hưởng <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.code}] {s.name} - Đang nợ: {(s.debt ?? 0).toLocaleString('vi-VN')} đ
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Bank Info Card */}
          {selectedSupplier && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>Thông tin thụ hưởng thanh toán:</span>
                <span className="text-rose-600 font-mono">
                  Dư nợ: {(selectedSupplier.debt ?? 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="text-slate-600 space-y-0.5 text-[11px]">
                {selectedSupplier.bankAccount ? (
                  <>
                    <p>
                      Ngân hàng: <strong className="text-slate-800">{selectedSupplier.bankName || 'Ngân hàng'}</strong>
                    </p>
                    <p>
                      Số TK: <strong className="font-mono text-slate-900">{selectedSupplier.bankAccount}</strong> - Chủ TK: <strong className="text-slate-900">{selectedSupplier.bankAccountName || selectedSupplier.name}</strong>
                    </p>
                  </>
                ) : (
                  <p className="text-amber-700">Chưa có thông tin số tài khoản ngân hàng của NCC này.</p>
                )}
              </div>
            </div>
          )}

          {/* Amount to Pay */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">
                Số tiền thanh toán (VNĐ) <span className="text-rose-500">*</span>
              </label>
              {selectedSupplier && selectedSupplier.debt > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(50)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-[10px]"
                  >
                    50% nợ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(100)}
                    className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md font-bold text-[10px]"
                  >
                    100% hết nợ
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={1000}
                step={100000}
                required
                className="w-full text-base font-bold font-mono border border-slate-300 rounded-xl px-4 py-2.5 text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Bằng chữ: {(amount ?? 0).toLocaleString('vi-VN')} Việt Nam Đồng
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phương thức chi trả</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-semibold focus:outline-none"
              >
                <option value="bank_transfer">Chuyển khoản Ngân hàng</option>
                <option value="vietqr">VietQR / Quét mã QR</option>
                <option value="cash">Tiền mặt tại quỹ</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Thời gian thanh toán</label>
              <input
                type="text"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Reference PO code & Note */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Chứng từ / Phiếu nhập tham chiếu (Nếu có)</label>
            <input
              type="text"
              value={referencePoCode}
              onChange={(e) => setReferencePoCode(e.target.value)}
              placeholder="VD: PO-2026-088 hoặc Hợp đồng số 12/2026"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nội dung chi</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thanh toán tiền hàng..."
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-bold text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận lập phiếu chi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
