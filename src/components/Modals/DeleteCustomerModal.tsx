import React from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { Customer } from '../../types';
import { formatNumberWithDots } from '../../data/administrativeData';

interface DeleteCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onConfirmDelete: (customerId: string) => void;
}

export const DeleteCustomerModal: React.FC<DeleteCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onConfirmDelete
}) => {
  if (!isOpen || !customer) return null;

  const hasDebt = (customer.debt || 0) > 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden text-xs">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Xác Nhận Xóa Khách Hàng</h2>
              <p className="text-rose-600 font-bold text-[11px]">Hành động này không thể hoàn tác</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Mã khách hàng:</span>
              <span className="font-mono font-bold text-blue-600">{customer.code}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Tên khách hàng:</span>
              <span className="font-bold text-slate-900">{customer.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Số điện thoại:</span>
              <span className="font-mono text-slate-800">{customer.phone}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-500 font-bold">Công nợ hiện tại:</span>
              <span className={`font-black font-mono ${hasDebt ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatNumberWithDots(customer.debt || 0)} đ
              </span>
            </div>
          </div>

          {hasDebt && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="block text-amber-800">Cảnh báo công nợ chưa thu!</strong>
                Khách hàng này hiện còn dư nợ <strong>{formatNumberWithDots(customer.debt || 0)} đ</strong>.
                Nếu xóa, công nợ này sẽ bị loại bỏ khỏi danh sách theo dõi khách hàng.
              </div>
            </div>
          )}

          <p className="text-slate-600 text-center leading-relaxed">
            Bạn có chắc chắn muốn xóa khách hàng <strong>"{customer.name}"</strong> khỏi hệ thống ERP không?
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => {
              onConfirmDelete(customer.id);
              onClose();
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xác nhận xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
