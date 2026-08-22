import React from 'react';
import {
  FileText,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Building2,
  Calendar,
  Layers,
  Download,
  Printer,
  ExternalLink,
  Tag
} from 'lucide-react';
import { EInvoiceData, InventoryLayer } from '../../types';

interface EInvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: EInvoiceData | null;
  linkedLots?: InventoryLayer[];
}

export const EInvoiceDetailModal: React.FC<EInvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  linkedLots = []
}) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(invoice, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `HDDT_${invoice.invoiceSerial}_${invoice.invoiceNumber}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider text-blue-300 uppercase">
                  HÓA ĐƠN ĐIỆN TỬ GTGT (E-INVOICE)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> CQT Đã Cấp Mã
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2 mt-0.5">
                <span>Số HĐ: #{invoice.invoiceNumber}</span>
                <span className="text-slate-400 font-normal">| Ký hiệu: {invoice.invoiceSerial}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="In hóa đơn"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadJson}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Tải tệp JSON dữ liệu"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Invoice Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Certificate & Verification Strip */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-900">
                  Hóa đơn điện tử hợp pháp theo Thông tư 78/2021/TT-BTC
                </div>
                <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                  Mã CQT cấp: <strong className="select-all">{invoice.lookupCode}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-slate-500">Ký bởi: {invoice.signedBy || invoice.sellerName}</span>
            </div>
          </div>

          {/* Electronic Invoice Document Form */}
          <div className="border border-slate-300 rounded-2xl p-4 sm:p-5 bg-white shadow-2xs space-y-4">
            {/* Title Header */}
            <div className="text-center pb-3 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
                HÓA ĐƠN GIÁ TRỊ GIA TĂNG
              </h3>
              <div className="text-xs text-slate-500 font-semibold mt-0.5">
                (Bản thể hiện của hóa đơn điện tử)
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600 mt-2 font-mono">
                <span>Ngày lập: <strong>{invoice.invoiceDate}</strong></span>
                <span>Mẫu số: <strong>{invoice.invoiceFormSymbol || '1'}</strong></span>
                <span>Ký hiệu: <strong className="text-blue-700">{invoice.invoiceSerial}</strong></span>
                <span>Số: <strong className="text-rose-600 text-sm">#{invoice.invoiceNumber}</strong></span>
              </div>
            </div>

            {/* Seller & Buyer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 border-b border-slate-200">
              {/* Seller */}
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5 text-blue-700">
                  <Building2 className="w-3.5 h-3.5" />
                  ĐƠN VỊ BÁN HÀNG (NHÀ CUNG CẤP)
                </div>
                <div className="font-bold text-slate-900 text-xs">{invoice.sellerLegalName || invoice.sellerName}</div>
                <div className="text-[11px] text-slate-600 font-mono">
                  Mã số thuế: <strong className="text-slate-900">{invoice.sellerTaxCode}</strong>
                </div>
                {invoice.sellerAddress && (
                  <div className="text-[11px] text-slate-500">Địa chỉ: {invoice.sellerAddress}</div>
                )}
                {invoice.sellerBankAccount && (
                  <div className="text-[11px] text-slate-500">
                    Số TK: {invoice.sellerBankAccount} {invoice.sellerBankName ? `- ${invoice.sellerBankName}` : ''}
                  </div>
                )}
              </div>

              {/* Buyer */}
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5 text-slate-700">
                  <Building2 className="w-3.5 h-3.5" />
                  ĐƠN VỊ MUA HÀNG (DOANH NGHIỆP)
                </div>
                <div className="font-bold text-slate-900 text-xs">{invoice.buyerName}</div>
                <div className="text-[11px] text-slate-600 font-mono">
                  Mã số thuế: <strong className="text-slate-900">{invoice.buyerTaxCode || '0108998822'}</strong>
                </div>
                {invoice.buyerAddress && (
                  <div className="text-[11px] text-slate-500">Địa chỉ: {invoice.buyerAddress}</div>
                )}
                <div className="text-[11px] text-slate-500">Hình thức thanh toán: Chuyển khoản / TM</div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 font-bold text-slate-700 text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2 text-center w-8">STT</th>
                    <th className="py-2 px-2.5">Tên hàng hóa, dịch vụ</th>
                    <th className="py-2 px-2 text-center w-14">ĐVT</th>
                    <th className="py-2 px-2.5 text-right w-16">Số lượng</th>
                    <th className="py-2 px-2.5 text-right w-24">Đơn giá</th>
                    <th className="py-2 px-2.5 text-right w-28">Thành tiền (chưa VAT)</th>
                    <th className="py-2 px-2 text-center w-14">Thuế %</th>
                    <th className="py-2 px-2.5 text-right w-28">Tiền thuế</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2 px-2 text-center font-mono text-slate-500">{item.lineNumber || idx + 1}</td>
                      <td className="py-2 px-2.5">
                        <div className="font-bold text-slate-900">{item.itemName}</div>
                        {item.itemCode && (
                          <div className="text-[10px] text-slate-400 font-mono">Mã hàng: {item.itemCode}</div>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-600">{item.unit}</td>
                      <td className="py-2 px-2.5 text-right font-mono font-semibold text-slate-800">
                        {item.quantity.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-700">
                        {item.unitPrice.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                        {item.totalBeforeVat.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-purple-700 font-bold">
                        {item.vatRate}%
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-purple-900">
                        {item.vatAmount.toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tổng tiền hàng chưa có thuế GTGT:</span>
                <span className="font-mono font-bold text-slate-800">
                  {invoice.totalBeforeVat.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between text-purple-700">
                <span>Tiền thuế giá trị gia tăng ({invoice.vatRate}%):</span>
                <span className="font-mono font-bold">
                  {invoice.totalVatAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between text-slate-900 text-sm font-black pt-1.5 border-t border-slate-200">
                <span>TỔNG TIỀN THANH TOÁN (ĐÃ CÓ THUẾ):</span>
                <span className="font-mono text-emerald-700 text-base">
                  {invoice.totalAmountWithVat.toLocaleString('vi-VN')} đ
                </span>
              </div>
              {invoice.totalAmountInWords && (
                <div className="text-[11px] text-slate-500 italic pt-1">
                  Số tiền viết bằng chữ: <strong>{invoice.totalAmountInWords}</strong>
                </div>
              )}
            </div>

            {/* Digital Signature & Verification Strip */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 w-full sm:w-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">Chữ ký số bên bán hợp lệ</div>
                  <div className="text-[10px] text-emerald-700">{invoice.signedBy || invoice.sellerName} ({invoice.signedDate || invoice.invoiceDate})</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <QrCode className="w-5 h-5 text-slate-700" />
                <span>Quét mã tra cứu tại hoadondientu.gdt.gov.vn</span>
              </div>
            </div>
          </div>

          {/* Linked FIFO Lots Section (if already synchronized into inventory) */}
          {linkedLots.length > 0 && (
            <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-blue-900 text-xs">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Các Lô Tồn Kho FIFO (Inventory Lots) Đã Tạo Từ HĐĐT Này ({linkedLots.length})</span>
                </div>
                <span className="text-[11px] text-blue-600 font-semibold">Tự động trừ FIFO khi xuất bán</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {linkedLots.map((lot) => (
                  <div
                    key={lot.id}
                    className="p-2.5 rounded-xl bg-white border border-blue-100 shadow-2xs text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-700">{lot.layerId || lot.lotId}</span>
                      <span className="font-black text-emerald-700 font-mono">
                        {lot.quantityRemaining} / {lot.quantityReceived} {lot.unit}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 text-[11px] truncate">{lot.productName}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>SKU: {lot.sku}</span>
                      <span>Giá vốn: {(lot.purchasePrice || lot.costPrice || 0).toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span>Nhà cung cấp giải pháp:</span>
            <strong className="text-slate-700">{invoice.providerName}</strong>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
