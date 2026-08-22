import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles
} from 'lucide-react';
import { Supplier, SupplierType } from '../../types';

interface SupplierImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuppliers: (suppliers: Supplier[]) => void;
  existingSuppliers?: Supplier[];
}

export const SupplierImportModal: React.FC<SupplierImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuppliers,
  existingSuppliers = []
}) => {
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<Partial<Supplier>[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewStep, setPreviewStep] = useState(false);

  const sampleCsv = `Mã NCC,Tên nhà cung cấp,Mã số thuế,Số điện thoại,Email,Địa chỉ,Người đại diện,Số tài khoản,Ngân hàng,Hạn mức nợ
NCC000004,Công ty Thép Việt Ý,0101239876,024 3822 1111,sales@viety.vn,KCN Phố Nối A Hưng Yên,Nguyễn Văn Hùng,1902888999,Techcombank,300000000
NCC000005,Công ty Sơn Jotun Việt Nam,0301777888,028 3829 0000,order@jotun.com.vn,KCN Sóng Thần 1 Bình Dương,Lê Thị Mai,007100334455,Vietcombank,150000000
NCC000006,Xưởng Cơ Khí Đúc Đồng Hải Phòng,,0912 333 444,ducphong@gmail.com,Hải Phòng,Trần Phong,1022334455,MBBank,50000000`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Mau_Nhap_Nha_Cung_Cap_BizOne.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const parseCsv = (csv: string) => {
    setErrorMsg('');
    const lines = csv.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length <= 1) {
      setErrorMsg('File hoặc dữ liệu không đủ dòng (Cần ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu).');
      return;
    }

    const items: Partial<Supplier>[] = [];
    const rows = lines.slice(1);

    rows.forEach((row, index) => {
      const cols = row.split(/[,;\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length >= 2) {
        const code = cols[0] || `NCC${String(existingSuppliers.length + index + 1).padStart(6, '0')}`;
        const name = cols[1];
        const taxCode = cols[2] || '';
        const phone = cols[3] || '';
        const email = cols[4] || '';
        const address = cols[5] || 'Chưa cập nhật';
        const representative = cols[6] || '';
        const bankAccount = cols[7] || '';
        const bankName = cols[8] || '';
        const creditLimit = parseFloat(cols[9]) || 200000000;

        if (name) {
          items.push({
            id: `sup-import-${Date.now()}-${index}`,
            code,
            name,
            legalName: name,
            taxCode,
            phone,
            email,
            address,
            representative,
            bankAccount,
            bankName,
            creditLimit,
            debt: 0,
            totalPurchased: 0,
            purchaseOrderCount: 0,
            type: (taxCode ? 'company' : 'other') as SupplierType,
            status: 'active',
            taxStatus: taxCode ? 'NNT đang hoạt động (Đã cấp GCN ĐKT)' : undefined,
            suppliedProducts: ['Vật tư kim khí', 'Thép xây dựng'],
            notes: 'Nhà cung cấp nhập từ file Excel / CSV.',
            createdAt: new Date().toISOString().slice(0, 10)
          });
        }
      }
    });

    if (items.length === 0) {
      setErrorMsg('Không thể trích xuất được dòng nhà cung cấp hợp lệ nào.');
      return;
    }

    setParsedData(items);
    setPreviewStep(true);
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;
    onImportSuppliers(parsedData as Supplier[]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Nhập Nhà Cung Cấp Hàng Loạt (Excel / CSV)
              </h2>
              <p className="text-xs text-slate-500">
                Tải lên danh sách đối tác cung ứng kèm MST, ngân hàng và thông tin hợp đồng
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {!previewStep ? (
            <>
              {/* Template Download */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Tải file Excel mẫu Nhà cung cấp</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Mẫu gồm các cột: Mã NCC, Tên NCC, MST, SĐT, Email, Địa chỉ, Đại diện, STK, Ngân hàng...
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file mẫu</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                <p className="font-bold text-slate-700 mb-1">
                  Chọn file từ máy tính hoặc kéo thả vào đây
                </p>
                <p className="text-[11px] text-slate-400 mb-4">Hỗ trợ định dạng .CSV, .TXT</p>
                <label className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-sm transition-colors inline-block">
                  <span>Duyệt tìm file CSV</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Text Paste */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hoặc dán trực tiếp dữ liệu từ bảng tính vào đây:
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Mã NCC\tTên nhà cung cấp\tMã số thuế\tSố điện thoại\tĐịa chỉ\nNCC001\tTập đoàn Thép Việt Ý\t0101239876\t02438221111\tHưng Yên`}
                  className="w-full font-mono text-[11px] border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </>
          ) : (
            /* PREVIEW STEP */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã trích xuất thành công {parsedData.length} nhà cung cấp:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewStep(false)}
                  className="text-blue-600 font-bold hover:underline"
                >
                  ← Chọn lại file khác
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Mã NCC</th>
                      <th className="p-2.5">Tên nhà cung cấp</th>
                      <th className="p-2.5">Mã số thuế</th>
                      <th className="p-2.5">SĐT</th>
                      <th className="p-2.5">Ngân hàng</th>
                      <th className="p-2.5 text-right">Hạn mức</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-blue-600">{item.code}</td>
                        <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                        <td className="p-2.5 font-mono text-slate-700">{item.taxCode || '—'}</td>
                        <td className="p-2.5 font-mono text-slate-600">{item.phone}</td>
                        <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                          {item.bankAccount ? `${item.bankAccount} (${item.bankName})` : '—'}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-700">
                          {(item.creditLimit ?? 0).toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-xs"
          >
            Hủy
          </button>
          {!previewStep ? (
            <button
              type="button"
              onClick={() => parseCsv(rawText)}
              disabled={!rawText.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xem trước dữ liệu</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận nhập ({parsedData.length} NCC)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
