import React, { useState, useMemo } from 'react';
import {
  X,
  PackagePlus,
  Plus,
  Trash2,
  Check,
  Building2,
  Zap,
  Search,
  ChevronDown,
  ChevronUp,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { Product, PurchaseOrder, Supplier, Branch, EInvoiceData, EInvoiceItem } from '../../types';
import { SupplierModal } from './SupplierModal';
import { eInvoiceService, sampleEInvoices } from '../../services/eInvoiceService';

interface CreatePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProductName?: string;
  defaultSupplierName?: string;
  poToEdit?: PurchaseOrder | null;
  products: Product[];
  suppliers: Supplier[];
  branches?: Branch[];
  onAddPurchaseOrder: (po: PurchaseOrder) => void;
  onUpdatePurchaseOrder?: (po: PurchaseOrder) => void;
  onAddSupplier?: (supplier: Supplier) => void;
}

interface PurchaseItemInput {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  lotCode: string;
  expiryDate?: string;
}

export const CreatePurchaseModal: React.FC<CreatePurchaseModalProps> = ({
  isOpen,
  onClose,
  defaultProductName,
  defaultSupplierName,
  poToEdit,
  products = [],
  suppliers = [],
  branches = [],
  onAddPurchaseOrder,
  onUpdatePurchaseOrder,
  onAddSupplier
}) => {
  const matchedProduct = products.find((p) =>
    defaultProductName ? p.name.toLowerCase().includes(defaultProductName.toLowerCase()) : false
  ) || products[0];

  const initialSupplier =
    suppliers.find((s) => s.name === defaultSupplierName) ||
    suppliers.find((s) => s.name === matchedProduct?.supplierName) ||
    suppliers[0];

  const todayStr = new Date().toISOString().substring(0, 10);
  const generateLotCode = (index: number = 1) => {
    const d = todayStr.replace(/-/g, '');
    const rand = Math.floor(10 + Math.random() * 90);
    return `LOT-${d}-${rand + index}`;
  };

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(initialSupplier?.id || '');
  const [warehouse, setWarehouse] = useState('Kho Tổng TP.HCM (Khu A)');
  const [intakeDate, setIntakeDate] = useState(todayStr);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [isQuickSupplierModalOpen, setIsQuickSupplierModalOpen] = useState(false);

  // Sync state with poToEdit if provided
  React.useEffect(() => {
    if (poToEdit) {
      const matchedSup = suppliers.find(
        (s) => s.id === poToEdit.supplierId || s.name.toLowerCase() === (poToEdit.supplierName || '').toLowerCase()
      );
      if (matchedSup) setSelectedSupplierId(matchedSup.id);
      if (poToEdit.warehouse) setWarehouse(poToEdit.warehouse);
      if (poToEdit.createdAt) setIntakeDate(poToEdit.createdAt.substring(0, 10));
      setPaidAmount(poToEdit.paidAmount || 0);
      setNote(poToEdit.note || '');

      if (poToEdit.items && poToEdit.items.length > 0) {
        setItems(
          poToEdit.items.map((it, idx) => ({
            productId: it.sku || `p-edit-${idx + 1}`,
            sku: it.sku || `SKU-EDIT-${idx + 1}`,
            productName: it.productName,
            quantity: it.quantity,
            unit: it.unit,
            price: it.price,
            lotCode: it.lotCode || it.lotId || generateLotCode(idx + 1),
            expiryDate: it.expiryDate || '2027-12-31'
          }))
        );
      }
    }
  }, [poToEdit, suppliers]);

  // E-Invoice Sync in PO State
  const [showEInvoicePanel, setShowEInvoicePanel] = useState(false);
  const [sellerTaxCode, setSellerTaxCode] = useState('0101389216');
  const [invoiceNumber, setInvoiceNumber] = useState('00097453');
  const [invoiceSerial, setInvoiceSerial] = useState('1C26MYT');
  const [lookupCode, setLookupCode] = useState('M1-26-HKYFC-00003100243');
  const [isSearchingEInvoice, setIsSearchingEInvoice] = useState(false);
  const [loadedEInvoice, setLoadedEInvoice] = useState<EInvoiceData | null>(sampleEInvoices[0]);
  const [eInvoiceError, setEInvoiceError] = useState<string | null>(null);

  const handleLookupEInvoiceForPO = async () => {
    setIsSearchingEInvoice(true);
    setEInvoiceError(null);
    try {
      const res = await eInvoiceService.lookupOnlineInvoice({
        sellerTaxCode,
        invoiceNumber,
        invoiceSerial,
        lookupCode
      });
      if (res) {
        setLoadedEInvoice(res);
      } else {
        setEInvoiceError('Không tìm thấy hóa đơn điện tử!');
      }
    } catch (e: any) {
      setEInvoiceError(e.message || 'Lỗi tra cứu hóa đơn điện tử');
    } finally {
      setIsSearchingEInvoice(false);
    }
  };

  const handleApplyEInvoiceToPO = () => {
    if (!loadedEInvoice || loadedEInvoice.items.length === 0) return;

    // 1. Check or Match Supplier
    let targetSupplier = suppliers.find(
      (s) => s.taxCode === loadedEInvoice.sellerTaxCode || s.name.toLowerCase().includes(loadedEInvoice.sellerName.toLowerCase())
    );

    if (targetSupplier) {
      setSelectedSupplierId(targetSupplier.id);
    } else if (onAddSupplier) {
      // Auto register supplier
      const newSup: Supplier = {
        id: `sup-${Date.now()}`,
        code: `NCC-${loadedEInvoice.sellerTaxCode.slice(-4) || 'HDDT'}`,
        name: loadedEInvoice.sellerName,
        legalName: loadedEInvoice.sellerLegalName || loadedEInvoice.sellerName,
        taxCode: loadedEInvoice.sellerTaxCode,
        address: loadedEInvoice.sellerAddress || 'Hà Nội, Việt Nam',
        phone: '024 3987 6543',
        email: 'contact@partner-supplier.com',
        debt: loadedEInvoice.totalAmountWithVat,
        suppliedProducts: loadedEInvoice.items.map((i) => i.itemName),
        type: 'company'
      };
      onAddSupplier(newSup);
      setSelectedSupplierId(newSup.id);
    }

    // 2. Populate Items
    const mappedPOItems: PurchaseItemInput[] = loadedEInvoice.items.map((it, idx) => {
      const existingP = products.find(
        (p) => p.sku === it.matchedSku || p.code === it.itemCode || p.name.toLowerCase().includes(it.itemName.toLowerCase())
      );

      const lotCode = it.suggestedLotId || `LOT-HD${loadedEInvoice.invoiceNumber}-${String(idx + 1).padStart(2, '0')}`;

      return {
        productId: existingP?.id || `p-hd-${idx + 1}`,
        sku: existingP?.sku || it.itemCode || `SKU-HD-${idx + 1}`,
        productName: it.itemName,
        quantity: it.quantity,
        unit: it.unit,
        price: it.unitPrice,
        lotCode,
        expiryDate: it.expiryDate || '2028-12-31'
      };
    });

    setItems(mappedPOItems);
    setNote(
      `Đồng bộ nhập kho theo HĐĐT Số: ${loadedEInvoice.invoiceNumber}, Ký hiệu: ${loadedEInvoice.invoiceSerial}, Mã CQT: ${loadedEInvoice.lookupCode}, Đơn vị bán: ${loadedEInvoice.sellerName}`
    );
    setShowEInvoicePanel(false);
  };

  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
  }, [suppliers, selectedSupplierId]);

  const [items, setItems] = useState<PurchaseItemInput[]>([
    {
      productId: matchedProduct?.id || 'p-1',
      sku: matchedProduct?.sku || 'SKU-001',
      productName: matchedProduct?.name || 'Thép cuộn cán nóng phi 6 Hòa Phát',
      quantity: 500,
      unit: matchedProduct?.unit || 'kg',
      price: matchedProduct?.costPrice || 15000,
      lotCode: generateLotCode(1),
      expiryDate: '2027-12-31'
    }
  ]);

  const handleAddItem = () => {
    const defaultP = products[0] || {
      id: 'p-new',
      sku: 'SKU-NEW',
      name: 'Hàng hóa mới',
      unit: 'cái',
      costPrice: 50000
    };
    setItems([
      ...items,
      {
        productId: defaultP.id,
        sku: defaultP.sku,
        productName: defaultP.name,
        quantity: 100,
        unit: defaultP.unit,
        price: defaultP.costPrice,
        lotCode: generateLotCode(items.length + 1),
        expiryDate: '2027-12-31'
      }
    ]);
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: prod.id,
      sku: prod.sku,
      productName: prod.name,
      unit: prod.unit,
      price: prod.costPrice
    };
    setItems(newItems);
  };

  const handleItemChange = <K extends keyof PurchaseItemInput>(
    index: number,
    field: K,
    value: PurchaseItemInput[K]
  ) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const remainingDebt = Math.max(0, totalAmount - paidAmount);
  const overpaid = paidAmount > totalAmount ? paidAmount - totalAmount : 0;

  const handleQuickSupplierSaved = (newSup: Supplier) => {
    if (onAddSupplier) {
      onAddSupplier(newSup);
    }
    setSelectedSupplierId(newSup.id);
    setIsQuickSupplierModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert('Vui lòng thêm ít nhất 1 mặt hàng vào phiếu nhập');
      return;
    }

    const currentSupName = selectedSupplier?.name || 'Nhà cung cấp đối tác';

    if (poToEdit) {
      const updatedPO: PurchaseOrder = {
        ...poToEdit,
        supplierId: selectedSupplier?.id,
        supplierName: currentSupName,
        createdAt: intakeDate,
        totalAmount,
        paidAmount,
        debtAmount: remainingDebt,
        overpaidAmount: overpaid,
        status: poToEdit.status || 'received',
        paymentStatus: paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
        warehouse,
        note,
        items: items.map((item) => ({
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          lotId: item.lotCode || generateLotCode(),
          expiryDate: item.expiryDate
        }))
      };

      if (onUpdatePurchaseOrder) {
        onUpdatePurchaseOrder(updatedPO);
      } else {
        onAddPurchaseOrder(updatedPO);
      }
    } else {
      const newPO: PurchaseOrder = {
        id: `po-${Date.now()}`,
        code: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        supplierId: selectedSupplier?.id,
        supplierName: currentSupName,
        createdAt: intakeDate,
        totalAmount,
        paidAmount,
        debtAmount: remainingDebt,
        overpaidAmount: overpaid,
        status: 'received',
        paymentStatus: paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
        warehouse,
        note,
        items: items.map((item) => ({
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          lotId: item.lotCode || generateLotCode(),
          expiryDate: item.expiryDate
        }))
      };

      onAddPurchaseOrder(newPO);
    }
    onClose();
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-blue-500/5 to-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-600/20">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {poToEdit ? `Chỉnh Sửa Phiếu Nhập Hàng (${poToEdit.code})` : 'Lập Phiếu Nhập Hàng (Tạo Lô Hàng FIFO)'}
                </h2>
                <p className="text-xs text-slate-500">
                  {poToEdit
                    ? 'Điều chỉnh / bổ sung thông tin hàng hóa, đơn giá, nhà cung cấp và số tiền thanh toán'
                    : 'Liên kết Nhà Cung Cấp, tự động tra cứu MST, lưu vết Lô tồn kho & tính giá vốn FIFO'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            {/* ⚡ E-Invoice Quick Auto-Import Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black">
                    <Zap className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <div className="font-black text-blue-900 text-xs flex items-center gap-1.5">
                      <span>⚡ Đồng Bộ Dữ Liệu Từ Hóa Đơn Điện Tử (HĐĐT) Bên Bán</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        Auto-fill NCC, Lô hàng & Bảng sản phẩm PO
                      </span>
                    </div>
                    <div className="text-[11px] text-blue-700">
                      Tự động tra cứu hóa đơn điện tử theo MST, Số HĐ, Ký hiệu hoặc Mã CQT để nạp toàn bộ danh mục hàng hóa
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEInvoicePanel(!showEInvoicePanel)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
                >
                  {showEInvoicePanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showEInvoicePanel ? 'Thu gọn panel HĐĐT' : 'Mở công cụ HĐĐT'}</span>
                </button>
              </div>

              {showEInvoicePanel && (
                <div className="mt-3 pt-3 border-t border-blue-200 space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">MST Bên Bán (NCC)</label>
                      <input
                        type="text"
                        value={sellerTaxCode}
                        onChange={(e) => setSellerTaxCode(e.target.value)}
                        placeholder="0101389216"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Số HĐĐT (7-8 số)</label>
                      <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="00097453"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Ký Hiệu Mẫu HĐ</label>
                      <input
                        type="text"
                        value={invoiceSerial}
                        onChange={(e) => setInvoiceSerial(e.target.value)}
                        placeholder="1C26MYT"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Mã CQT / Tra Cứu</label>
                      <input
                        type="text"
                        value={lookupCode}
                        onChange={(e) => setLookupCode(e.target.value)}
                        placeholder="M1-26-HKYFC-00003100243"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-bold">Mẫu thực tế:</span>
                      {sampleEInvoices.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSellerTaxCode(s.sellerTaxCode);
                            setInvoiceNumber(s.invoiceNumber);
                            setInvoiceSerial(s.invoiceSerial);
                            setLookupCode(s.lookupCode);
                            setLoadedEInvoice(s);
                            setEInvoiceError(null);
                          }}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-blue-100 text-[10px] font-bold text-slate-700 hover:text-blue-800 rounded border border-slate-200 cursor-pointer"
                        >
                          {s.sellerName.split('(')[1]?.replace(')', '') || s.sellerName.split(' ')[0]} (#{s.invoiceNumber})
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleLookupEInvoiceForPO}
                      disabled={isSearchingEInvoice}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isSearchingEInvoice ? 'Đang tra cứu...' : 'Tra cứu HĐ'}</span>
                    </button>
                  </div>

                  {eInvoiceError && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                      {eInvoiceError}
                    </div>
                  )}

                  {loadedEInvoice && (
                    <div className="border border-blue-100 rounded-xl p-3 bg-blue-50/40 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="font-bold text-blue-950">
                          Bên bán: <span className="text-slate-900">{loadedEInvoice.sellerName}</span> (MST: {loadedEInvoice.sellerTaxCode})
                        </div>
                        <div className="font-mono text-emerald-700 font-bold">
                          Tổng tiền HĐ: {loadedEInvoice.totalAmountWithVat.toLocaleString('vi-VN')} đ ({loadedEInvoice.items.length} mặt hàng)
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Hóa đơn hợp lệ theo chuẩn Cục Thuế. Mã CQT: {loadedEInvoice.lookupCode}</span>
                        </div>

                        <button
                          type="button"
                          onClick={handleApplyEInvoiceToPO}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Nạp tất cả {loadedEInvoice.items.length} mặt hàng vào Phiếu PO này</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 1. Supplier & Warehouse Selection */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Supplier Picker */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Nhà Cung Cấp</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsQuickSupplierModalOpen(true)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tạo nhanh NCC</span>
                    </button>
                  </div>

                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.code}] {s.name} {s.taxCode ? `(MST: ${s.taxCode})` : ''} - 📞 {s.phone || s.contactPhone || 'Chưa có SĐT'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Warehouse */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kho tiếp nhận
                  </label>
                  <select
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800"
                  >
                    <option value="Kho Tổng TP.HCM (Khu A)">Kho Tổng TP.HCM (Khu A)</option>
                    <option value="Kho Thép Bình Dương (Khu B)">Kho Thép Bình Dương (Khu B)</option>
                    <option value="Kho Phụ Kiện Hà Nội (Khu C)">Kho Phụ Kiện Hà Nội (Khu C)</option>
                  </select>
                </div>
              </div>

              {/* Selected Supplier Info Card */}
              {selectedSupplier && (
                <div className="p-3 bg-white rounded-xl border border-blue-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {selectedSupplier.code}
                    </span>
                    <span className="font-bold text-slate-900">{selectedSupplier.name}</span>
                    {selectedSupplier.taxCode && (
                      <span className="text-slate-500">
                        • MST: <strong className="font-mono text-slate-800">{selectedSupplier.taxCode}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {selectedSupplier.bankAccount && (
                      <span className="text-slate-500">
                        NH: <strong>{selectedSupplier.bankName}</strong> ({selectedSupplier.bankAccount})
                      </span>
                    )}
                    <span className="text-slate-500">
                      Công nợ hiện tại:{' '}
                      <strong className={selectedSupplier.debt > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                        {formatVND(selectedSupplier.debt || 0)}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Date & Note Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ngày nhập kho
                  </label>
                  <input
                    type="date"
                    value={intakeDate}
                    onChange={(e) => setIntakeDate(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-2 text-slate-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ghi chú / Số hóa đơn đỏ
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="VD: Hóa đơn GTGT số 0048291, giao hàng đợt 1..."
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2"
                  />
                </div>
              </div>
            </div>

            {/* 2. Items & Lots List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Chi tiết mặt hàng & Lô FIFO ({items.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm dòng sản phẩm</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Mặt hàng / SKU
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl p-2 text-slate-800"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.sku}] {p.name} ({p.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="self-end sm:self-center text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa dòng này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Số lượng ({item.unit})
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl p-2"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Đơn giá nhập (đ/{item.unit})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(idx, 'price', Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl p-2"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Mã Lô (Lot Code FIFO)
                        </label>
                        <input
                          type="text"
                          value={item.lotCode}
                          onChange={(e) => handleItemChange(idx, 'lotCode', e.target.value)}
                          className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl p-2 text-blue-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Hạn sử dụng
                        </label>
                        <input
                          type="date"
                          value={item.expiryDate || ''}
                          onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                          className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl p-2 text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-slate-600 text-[11px] pt-1 border-t border-slate-100">
                      <span>
                        Mã SKU: <strong className="font-mono text-slate-800">{item.sku}</strong>
                      </span>
                      <span>
                        Thành tiền dòng:{' '}
                        <strong className="text-slate-900 text-xs">
                          {formatVND(item.quantity * item.price)}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Payment & Total Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Số tiền thanh toán ngay cho NCC (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs font-extrabold bg-white border border-slate-300 rounded-xl p-2 text-slate-900"
                  placeholder="Nhập số tiền đã trả..."
                />
                <div className="flex gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setPaidAmount(totalAmount)}
                    className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold hover:bg-emerald-100"
                  >
                    Thanh toán đủ 100%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(0)}
                    className="px-2 py-1 bg-slate-100 text-slate-700 rounded font-bold hover:bg-slate-200"
                  >
                    Chưa trả (Nợ 100%)
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Tổng giá trị đơn nhập:</span>
                  <span className="font-extrabold text-slate-900">{formatVND(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Đã thanh toán:</span>
                  <span className="font-bold">{formatVND(paidAmount)}</span>
                </div>
                {remainingDebt > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Còn nợ nhà cung cấp:</span>
                    <span>{formatVND(remainingDebt)}</span>
                  </div>
                )}
                {overpaid > 0 && (
                  <div className="flex justify-between text-blue-600 font-bold">
                    <span>Đã trả thừa (Dư nợ NCC):</span>
                    <span>{formatVND(overpaid)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-amber-200 flex justify-between items-center text-slate-900 font-extrabold">
                  <span>Trạng thái thanh toán:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                      paidAmount >= totalAmount
                        ? 'bg-emerald-100 text-emerald-800'
                        : paidAmount > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {paidAmount >= totalAmount
                      ? 'Đã tất toán'
                      : paidAmount > 0
                      ? 'Thanh toán một phần'
                      : 'Chưa thanh toán (Ghi nợ)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md shadow-amber-600/20 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{poToEdit ? 'Lưu Cập Nhật Đơn PO' : 'Xác nhận Lưu Phiếu Nhập & Tạo Lô'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Quick Add Supplier Modal */}
      <SupplierModal
        isOpen={isQuickSupplierModalOpen}
        onClose={() => setIsQuickSupplierModalOpen(false)}
        existingSuppliers={suppliers}
        branches={branches}
        isQuickCreate={true}
        onSave={handleQuickSupplierSaved}
      />
    </>
  );
};
