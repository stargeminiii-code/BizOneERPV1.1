import React, { useState } from 'react';
import { X, Upload, Download, FileText, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { Product } from '../../types';
import { useLanguage } from '../../i18n';

interface ExcelImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  tenantId?: string;
  onImportProducts: (newProducts: Product[]) => void;
}

export const ExcelImportExportModal: React.FC<ExcelImportExportModalProps> = ({
  isOpen,
  onClose,
  products,
  tenantId = 'tenant-001',
  onImportProducts
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [fileContent, setFileContent] = useState<string>('');
  const [parsedCount, setParsedCount] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    let csv =
      'STT,Mã Sản Phẩm,Tên Sản Phẩm,Mã SKU,Loại Sản Phẩm,Danh Mục,Thương Hiệu,Đơn Vị,Quy Cách,Giá Vốn FIFO,Giá Bán Niêm Yết,Trạng Thái,Ghi Chú\n';
    products.forEach((p, idx) => {
      const line = [
        idx + 1,
        `"${p.productCode || p.code || ''}"`,
        `"${(p.productName || p.name || '').replace(/"/g, '""')}"`,
        `"${p.variantSku || p.sku || ''}"`,
        `"${p.productType || 'FINISHED_GOOD'}"`,
        `"${p.category || ''}"`,
        `"${p.brand || ''}"`,
        `"${p.unit || 'Hộp'}"`,
        `"${p.packSize || '1'}"`,
        p.costPrice || 0,
        p.sellingPrice || 0,
        `"${p.status || 'ACTIVE'}"`,
        `"${(p.note || '').replace(/"/g, '""')}"`
      ];
      csv += line.join(',') + '\n';
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bizone_product_master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      setFileContent(text);
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      setParsedCount(Math.max(0, lines.length - 1));
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (!fileContent) return;
    const lines = fileContent.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return;

    const newItems: Product[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      if (cols.length >= 4) {
        const prodCode = cols[1] || `SP-${Date.now()}-${i}`;
        const prodName = cols[2] || `Sản phẩm ${i}`;
        const sku = cols[3] || prodCode;
        const pType = cols[4] || 'FINISHED_GOOD';
        const cat = cols[5] || 'Mặc định';
        const brd = cols[6] || 'Vietcoco';
        const unt = cols[7] || 'Hộp';
        const pSize = cols[8] || '1';
        const cost = Number(cols[9]) || 0;
        const sell = Number(cols[10]) || 0;

        newItems.push({
          id: `prod-imp-${Date.now()}-${i}`,
          productId: `P${Math.floor(100000 + Math.random() * 900000)}`,
          tenantId,
          code: prodCode,
          productCode: prodCode,
          name: prodName,
          productName: prodName,
          sku,
          variantSku: sku,
          productType: pType as any,
          category: cat,
          brand: brd,
          unit: unt,
          packSize: pSize,
          costPrice: cost,
          sellingPrice: sell,
          minStock: 10,
          location: 'Khu A - Kệ 01',
          supplierName: brd,
          status: 'ACTIVE'
        });
      }
    }

    if (newItems.length > 0) {
      onImportProducts(newItems);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-slate-800" />
            <h3 className="text-sm font-bold text-slate-900">{t('productMaster.excel.title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-4 pt-2 bg-slate-50">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t('productMaster.excel.importTab')}</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('productMaster.excel.exportTab')}</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h4 className="text-sm font-bold text-slate-900">{t('productMaster.excel.importSuccess')}</h4>
            </div>
          ) : activeTab === 'import' ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-slate-400 transition-colors">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">
                  {t('productMaster.excel.uploadDesc')}
                </p>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload-input"
                />
                <label
                  htmlFor="excel-upload-input"
                  className="mt-3 inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  {t('productMaster.excel.chooseFile')}
                </label>
              </div>

              {parsedCount > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center justify-between">
                  <span>
                    <strong>{parsedCount}</strong> {t('productMaster.excel.recordsReady')}
                  </span>
                  <button
                    onClick={handleExecuteImport}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                  >
                    {t('productMaster.excel.executeImport')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-center py-4">
              <p className="text-xs text-slate-600">
                {t('productMaster.excel.exportDesc')}
              </p>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{t('productMaster.excel.exportBtn')} ({products.length} {t('productMaster.stats.totalProducts')})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
