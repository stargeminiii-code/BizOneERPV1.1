import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  FileText,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { Customer } from '../../types';
import {
  parseExcelFile,
  validateCustomerImportData,
  downloadExcelTemplate,
  CustomerImportValidationResult,
  sanitizePhoneNumber
} from '../../utils/excelEngine';

interface CustomerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCustomers: (customers: Customer[]) => void;
  existingCustomers?: Customer[];
}

export const CustomerImportModal: React.FC<CustomerImportModalProps> = ({
  isOpen,
  onClose,
  onImportCustomers,
  existingCustomers = []
}) => {
  const [duplicateMode, setDuplicateMode] = useState<'update_existing' | 'create_new' | 'skip_existing'>('update_existing');
  const [validationResult, setValidationResult] = useState<CustomerImportValidationResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rawRows, setRawRows] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);

    try {
      const rows = await parseExcelFile(file);
      setRawRows(rows);
      const res = validateCustomerImportData(rows, existingCustomers, duplicateMode);
      setValidationResult(res);
    } catch (err: any) {
      alert(`Lỗi đọc file Excel: ${err.message || 'Định dạng không hỗ trợ'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateModeChange = (mode: 'update_existing' | 'create_new' | 'skip_existing') => {
    setDuplicateMode(mode);
    if (rawRows.length > 0) {
      const res = validateCustomerImportData(rawRows, existingCustomers, mode);
      setValidationResult(res);
    }
  };

  const handleConfirmImport = () => {
    if (!validationResult || validationResult.validCustomers.length === 0) return;
    onImportCustomers(validationResult.validCustomers);
    onClose();
  };

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(val || 0)) + ' đ';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Nhập Khách Hàng Từ Excel (.xlsx)</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Excel Engine 2.0
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hỗ trợ file .xlsx, .xls, .csv • Tự động chuẩn hóa SĐT 0 đầu • Nhận diện trùng lặp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Action Bar: Download template + Duplicate Strategy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">File Mẫu Chuẩn (.xlsx)</div>
                <div className="text-[11px] text-slate-500">Đầy đủ cột Mã, Tên, SĐT, MST, Hạn mức</div>
              </div>
              <button
                type="button"
                onClick={() => downloadExcelTemplate('customers')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tải Mẫu</span>
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>Xử lý khi trùng SĐT / Mã KH:</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="dupMode"
                    checked={duplicateMode === 'update_existing'}
                    onChange={() => handleDuplicateModeChange('update_existing')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Cập nhật</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="dupMode"
                    checked={duplicateMode === 'create_new'}
                    onChange={() => handleDuplicateModeChange('create_new')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Tạo mới</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="dupMode"
                    checked={duplicateMode === 'skip_existing'}
                    onChange={() => handleDuplicateModeChange('skip_existing')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Bỏ qua</span>
                </label>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="p-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center text-center relative cursor-pointer group transition-all">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">
              {fileName ? fileName : 'Kéo thả hoặc nhấn để chọn file Excel (.xlsx)'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Hệ thống tự động loại bỏ ký tự rác, định dạng số điện thoại 0 đầu và làm sạch dữ liệu
            </p>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="p-8 text-center text-xs text-slate-500 font-semibold flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Đang đọc và phân tích cấu trúc file Excel...</span>
            </div>
          )}

          {/* Validation Result Preview */}
          {validationResult && !isLoading && (
            <div className="space-y-4">
              {/* Metric badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-500 font-semibold">Tổng dòng:</span>
                  <div className="text-base font-black text-slate-900 mt-0.5">{validationResult.totalRows}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800">
                  <span className="font-semibold">Hợp lệ để nhập:</span>
                  <div className="text-base font-black text-emerald-900 mt-0.5">{validationResult.validCustomers.length}</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-blue-800">
                  <span className="font-semibold">Trùng lặp cập nhật:</span>
                  <div className="text-base font-black text-blue-900 mt-0.5">{validationResult.duplicateCount}</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800">
                  <span className="font-semibold">Lỗi cấu trúc:</span>
                  <div className="text-base font-black text-rose-900 mt-0.5">{validationResult.errors.length}</div>
                </div>
              </div>

              {/* Errors if any */}
              {validationResult.errors.length > 0 && (
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800 space-y-1 max-h-32 overflow-y-auto">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Chi tiết các dòng bị lỗi cấu trúc:</span>
                  </div>
                  {validationResult.errors.map((err, i) => (
                    <div key={i} className="text-[11px]">
                      • Dòng {err.row}: Cột [{err.column}] - {err.reason} (Giá trị: "{err.value}")
                    </div>
                  ))}
                </div>
              )}

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 border-b border-slate-200 flex items-center justify-between">
                  <span>Xem Trước Dữ Liệu Khách Hàng (5 dòng đầu tiên)</span>
                  <span className="text-[11px] text-slate-500">
                    Hiển thị {Math.min(5, validationResult.validCustomers.length)} / {validationResult.validCustomers.length} khách hàng
                  </span>
                </div>
                <div className="overflow-x-auto max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/80 sticky top-0 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Mã KH</th>
                        <th className="p-2.5">Tên khách hàng</th>
                        <th className="p-2.5">Số điện thoại</th>
                        <th className="p-2.5">Địa chỉ</th>
                        <th className="p-2.5">Nhóm</th>
                        <th className="p-2.5 text-right">Công nợ ban đầu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validationResult.validCustomers.slice(0, 5).map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-blue-600">{c.code}</td>
                          <td className="p-2.5 font-semibold text-slate-900">{c.name}</td>
                          <td className="p-2.5 font-mono text-emerald-700 font-bold">{sanitizePhoneNumber(c.phone)}</td>
                          <td className="p-2.5 text-slate-600 max-w-[200px] truncate">{c.address}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {c.group}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(c.debt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={!validationResult || validationResult.validCustomers.length === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Xác Nhận Nhập {validationResult?.validCustomers.length || 0} Khách Hàng</span>
          </button>
        </div>
      </div>
    </div>
  );
};
