import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Plus,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { Product } from '../../types';

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProducts: (importedProducts: Product[]) => void;
  existingProducts?: Product[];
}

export const ProductImportModal: React.FC<ProductImportModalProps> = ({
  isOpen,
  onClose,
  onImportProducts,
  existingProducts = []
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<Product[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadSample = () => {
    const csvContent =
      'Category,Brand,Product Name,Variant Name,Variant SKU,Pack Size,Product ID,Product Code,Unit,Ghi chú,Giá bán,Giá vốn\n' +
      'Đồ uống,Vietcoco,Sữa dừa UHT Vietcoco 330ml,Combo 2 Hộp,VCCCM330-UHT-C02,2,P000001,VCCCM330-UHT,Hộp,CM = Coconut Milk (Sữa dừa),36000,28000\n' +
      'Đồ uống,Vietcoco,Sữa dừa UHT Vietcoco 330ml,Combo 6 Hộp,VCCCM330-UHT-C06,6,P000001,VCCCM330-UHT,Hộp,CM = Coconut Milk,105000,84000\n' +
      'Đồ uống,Vietcoco,Sữa dừa Premium Vietcoco 330ml,Combo 2 Hộp,VCCCM330-PRM-C2,2,P000002,VCCCM330-PRM,Hộp,CM = Coconut Milk (Sữa dừa),42000,32000\n' +
      'Đồ uống,Vietcoco,Nước Cốt Dừa Tươi VIETCOCO Premium 400ml,1 Hộp,VCCCC400-PRM-C1,1,P000003,VCCCC400-PRM,Hộp,CC = Coconut Cream (Nước cốt dừa),32000,25000\n' +
      'Đồ uống,Vietcoco,Nước Cốt Dừa Tươi VIETCOCO 160ml,Combo 3 Hộp,VCCCC160-NOR-C3,3,P000004,VCCCC160-NOR,Hộp,CC = Coconut Cream (Nước cốt dừa),46000,36000\n' +
      'Thép & Kim loại,Hòa Phát,Thép cuộn mạ kẽm Ø6 Hòa Phát,Cuộn Ø6 tiêu chuẩn,THEP-MK-06-HP,Cuộn 500kg,P000006,THEP-MK-06,kg,Thép cuộn tiêu chuẩn TCVN,18000,15000';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'mau_danh_muc_san_pham_sku_vietcoco.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
      if (lines.length <= 1) {
        setErrorMsg('File CSV trống hoặc chỉ có dòng tiêu đề');
        return;
      }

      const rows: Product[] = [];
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Handle quoted CSV cells
        const tokens: string[] = [];
        let current = '';
        let insideQuote = false;

        for (let char of line) {
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            tokens.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        tokens.push(current.trim());

        if (tokens.length >= 4) {
          const category = tokens[0] || 'Đồ uống';
          const brand = tokens[1] || 'Vietcoco';
          const productName = tokens[2] || 'Sản phẩm mới';
          const variantName = tokens[3] || 'Quy cách chuẩn';
          const variantSku = tokens[4] || `SKU-${Date.now()}-${i}`;
          const packSize = tokens[5] || '1';
          const productId = tokens[6] || `P${String(existingProducts.length + i).padStart(6, '0')}`;
          const productCode = tokens[7] || variantSku.split('-')[0] || `SP-${i}`;
          const unit = tokens[8] || 'Hộp';
          const note = tokens[9] || '';
          const sellingPrice = parseFloat(tokens[10]?.replace(/[^\d.]/g, '') || '0') || 50000;
          const costPrice = parseFloat(tokens[11]?.replace(/[^\d.]/g, '') || '0') || Math.round(sellingPrice * 0.8);

          rows.push({
            id: `prod-import-${Date.now()}-${i}`,
            productId,
            code: productCode,
            productCode,
            sku: variantSku,
            variantSku,
            name: productName,
            productName,
            variant: variantName,
            variantName,
            category,
            brand,
            packSize,
            unit,
            note,
            notes: note,
            sellingPrice,
            costPrice,
            stock: 100,
            minStock: 20,
            location: 'KHO-A1',
            supplierName: brand ? `Thương hiệu ${brand}` : 'Nội bộ',
            isLowStock: false
          });
        }
      }

      if (rows.length === 0) {
        setErrorMsg('Không đọc được dòng dữ liệu hợp lệ nào từ file');
      } else {
        setPreviewData(rows);
        setErrorMsg('');
        setSuccessCount(rows.length);
      }
    } catch (err) {
      setErrorMsg('Lỗi khi đọc file CSV: ' + (err as Error).message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      parseCSV(content);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        parseCSV(content);
      };
      reader.readAsText(file);
    }
  };

  const handleApplyImport = () => {
    if (previewData.length === 0) return;
    onImportProducts(previewData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Nhập Danh Mục Sản Phẩm & Biến Thể SKU từ Excel / CSV
              </h2>
              <p className="text-xs text-slate-500">
                Hỗ trợ mẫu chuẩn: Category, Brand, Product Name, Variant Name, Variant SKU, Pack Size, Product ID, Code...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Instructions & Sample Download */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-900 text-xs">Tải mẫu Excel / CSV chuẩn cấu trúc</p>
                <p className="text-blue-700 text-[11px] mt-0.5">
                  Đầy đủ các cột Category, Brand (Vietcoco, Hòa Phát), Product Name, Variant SKU, Pack Size, Note...
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 rounded-xl font-bold shadow-xs cursor-pointer transition-all shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file mẫu CSV</span>
            </button>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/40'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 text-emerald-600 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">
                Kéo thả file CSV vào đây hoặc <span className="text-emerald-600 underline">chọn từ máy tính</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Định dạng hỗ trợ: .csv, .txt (mã hóa UTF-8)</p>
            </div>
            {fileName && (
              <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs mt-1">
                📄 Đã chọn: {fileName}
              </span>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-3 flex items-center gap-2 font-medium text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {previewData.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <span>Xem trước danh mục ({previewData.length} biến thể SKU)</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Hợp lệ
                  </span>
                </h3>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs max-h-[320px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-extrabold text-[10px] uppercase sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Brand</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Variant Name</th>
                      <th className="py-2.5 px-3 font-mono">Variant SKU</th>
                      <th className="py-2.5 px-3 text-center">Pack Size</th>
                      <th className="py-2.5 px-3 font-mono">Product ID</th>
                      <th className="py-2.5 px-3 font-mono">Product Code</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Ghi chú</th>
                      <th className="py-2.5 px-3 text-right">Giá bán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 font-medium text-slate-700">{p.category}</td>
                        <td className="py-2 px-3 font-bold text-blue-700">{p.brand}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{p.name}</td>
                        <td className="py-2 px-3 text-emerald-800 font-medium">{p.variant}</td>
                        <td className="py-2 px-3 font-mono text-purple-700 font-bold">{p.sku}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-600">{p.packSize}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{p.productId}</td>
                        <td className="py-2 px-3 font-mono text-slate-700 font-semibold">{p.code}</td>
                        <td className="py-2 px-3 text-slate-600">{p.unit}</td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">{p.note}</td>
                        <td className="py-2 px-3 text-right font-extrabold text-blue-600">
                          {p.sellingPrice.toLocaleString('vi-VN')} đ
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
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors cursor-pointer text-xs"
          >
            Hủy bỏ
          </button>
          <button
            disabled={previewData.length === 0}
            onClick={handleApplyImport}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-extrabold text-xs shadow-md transition-all ${
              previewData.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Nhập {previewData.length} biến thể sản phẩm vào hệ thống</span>
          </button>
        </div>
      </div>
    </div>
  );
};
