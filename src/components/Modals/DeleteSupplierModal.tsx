import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Building2, Layers, FileText, DollarSign, ShieldAlert } from 'lucide-react';
import { Supplier, PurchaseOrder, InventoryLayer } from '../../types';

interface DeleteSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  purchaseOrders?: PurchaseOrder[];
  inventoryLayers?: InventoryLayer[];
  onConfirmDelete: (supplierId: string) => void;
}

export const DeleteSupplierModal: React.FC<DeleteSupplierModalProps> = ({
  isOpen,
  onClose,
  supplier,
  purchaseOrders = [],
  inventoryLayers = [],
  onConfirmDelete
}) => {
  if (!isOpen || !supplier) return null;

  const linkedPOs = purchaseOrders.filter(
    (po) => po.supplierId === supplier.id || (po.supplierName && po.supplierName.toLowerCase() === supplier.name.toLowerCase())
  );
  
  const linkedLots = inventoryLayers.filter(
    (l) => (l.supplierId === supplier.id || (l.supplierName && l.supplierName.toLowerCase() === supplier.name.toLowerCase())) &&
      (l.quantityRemaining || l.remainingQuantity || 0) > 0
  );

  const hasDebt = (supplier.debt || 0) > 0;
  const hasHistory = linkedPOs.length > 0 || linkedLots.length > 0 || hasDebt;

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  const handleConfirm = () => {
    onConfirmDelete(supplier.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-600">
                Xác Nhận Xóa Dữ Liệu
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">
                Xóa Nhà Cung Cấp Khỏi Hệ Thống
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-300/80 text-slate-700 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          {/* Supplier Info Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Mã: {supplier.code}
              </span>
              <span className="font-bold text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {supplier.type === 'company' ? 'Doanh nghiệp' : 'Hộ kinh doanh / Cá nhân'}
              </span>
            </div>

            <div>
              <div className="font-black text-sm sm:text-base text-slate-900">
                {supplier.name}
              </div>
              {supplier.legalName && supplier.legalName !== supplier.name && (
                <p className="text-[11px] text-slate-500 font-medium">{supplier.legalName}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-400">MST:</span>{' '}
                <strong className="font-mono text-slate-800">{supplier.taxCode || '—'}</strong>
              </div>
              <div>
                <span className="text-slate-400">Điện thoại:</span>{' '}
                <strong className="font-mono text-slate-800">{supplier.phone || supplier.contactPhone || '—'}</strong>
              </div>
              <div>
                <span className="text-slate-400">Công nợ hiện tại:</span>{' '}
                <strong className={`font-mono ${hasDebt ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatVND(supplier.debt || 0)}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Tổng mua:</span>{' '}
                <strong className="font-mono text-slate-800">
                  {formatVND(supplier.totalPurchased || 0)}
                </strong>
              </div>
            </div>
          </div>

          {/* Linked Data Warning if exists */}
          {hasHistory ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-slate-700">
                <div className="font-black text-amber-900 text-xs">
                  Cảnh báo dữ liệu liên quan:
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Nhà cung cấp này đang có{' '}
                  {linkedPOs.length > 0 && <strong>{linkedPOs.length} đơn nhập PO</strong>}
                  {linkedPOs.length > 0 && linkedLots.length > 0 && ', '}
                  {linkedLots.length > 0 && <strong>{linkedLots.length} lô hàng tồn kho FIFO</strong>}
                  {hasDebt && <span className="text-rose-700 font-bold"> và khoản nợ {formatVND(supplier.debt || 0)}</span>}.
                </p>
                <p className="text-[10px] text-slate-500">
                  Việc xóa sẽ gỡ nhà cung cấp khỏi danh mục quản lý chung, các chứng từ giao dịch lịch sử vẫn được lưu trữ đối soát.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-slate-600 text-xs">
              Bạn có chắc chắn muốn xóa nhà cung cấp <strong>{supplier.name}</strong> không? Thao tác này sẽ xóa vĩnh viễn thông tin khỏi danh mục.
            </p>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xác Nhận Xóa NCC</span>
          </button>
        </div>
      </div>
    </div>
  );
};
