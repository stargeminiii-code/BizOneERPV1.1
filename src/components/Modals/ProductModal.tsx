import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Layers,
  Building2,
  DollarSign,
  Tag,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Warehouse as WarehouseIcon,
  HelpCircle,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Search,
  FileText,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Product, Supplier, Warehouse, Branch, ProductVariant, EInvoiceData, EInvoiceItem } from '../../types';
import { eInvoiceService, sampleEInvoices } from '../../services/eInvoiceService';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  existingProducts?: Product[];
  suppliers?: Supplier[];
  warehouses?: Warehouse[];
  branches?: Branch[];
  onSaveProduct: (
    product: Product,
    openingStock?: {
      quantity: number;
      costPrice: number;
      warehouseId: string;
      branchId: string;
    }
  ) => void;
  onOpenEInvoiceEntry?: () => void;
}

const CATEGORY_OPTIONS = [
  'Đồ uống',
  'Thực phẩm',
  'Thép & Kim loại',
  'Tôn & Xà gồ',
  'Vật tư phụ kiện',
  'Nhôm kính & Cửa',
  'Sơn & Hóa chất',
  'Ống nhựa & Phụ kiện',
  'Xi măng & Cát đá',
  'Khác'
];

const BRAND_SUGGESTIONS = [
  'Vietcoco',
  'Hòa Phát',
  'Hoa Sen',
  'Pomina',
  'Kim Tín',
  'Posco',
  'Đại Bàng',
  'Hoàng Hà',
  'Vina One',
  'Đông Á'
];

const UNIT_OPTIONS = [
  'Hộp',
  'Chai',
  'Thùng',
  'Lon',
  'Gói',
  'kg',
  'tấn',
  'cây',
  'tấm',
  'cuộn',
  'm',
  'm2',
  'cái',
  'bao',
  'bộ'
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  existingProducts = [],
  suppliers = [],
  warehouses = [],
  branches = [],
  onSaveProduct,
  onOpenEInvoiceEntry
}) => {
  // Form State
  const [productId, setProductId] = useState('');
  const [code, setCode] = useState('');
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Vietcoco');
  const [variant, setVariant] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [unit, setUnit] = useState(UNIT_OPTIONS[0]);
  const [customUnit, setCustomUnit] = useState('');
  const [packSize, setPackSize] = useState('1');
  const [note, setNote] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(10);
  const [maxStock, setMaxStock] = useState<number>(500);
  const [location, setLocation] = useState('Khu A - Kệ 01');
  const [supplierName, setSupplierName] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [branchId, setBranchId] = useState('BR01');
  const [warehouseId, setWarehouseId] = useState('WH01');

  // Variant list
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);

  // Opening Stock option (only for new products)
  const [hasOpeningStock, setHasOpeningStock] = useState(false);
  const [openingQuantity, setOpeningQuantity] = useState<number>(0);
  const [openingCostPrice, setOpeningCostPrice] = useState<number>(0);

  // Errors & UI
  const [errors, setErrors] = useState<Record<string, string>>({});

  // E-Invoice Quick Auto-Fill
  const [showEInvoicePanel, setShowEInvoicePanel] = useState(false);
  const [einvoiceTaxCode, setEinvoiceTaxCode] = useState('0101389216');
  const [einvoiceNumber, setEinvoiceNumber] = useState('00097453');
  const [einvoiceSerial, setEinvoiceSerial] = useState('1C26MYT');
  const [einvoiceLookupCode, setEinvoiceLookupCode] = useState('M1-26-HKYFC-00003100243');
  const [einvoiceSearching, setEinvoiceSearching] = useState(false);
  const [loadedEInvoice, setLoadedEInvoice] = useState<EInvoiceData | null>(sampleEInvoices[0]);
  const [einvoiceError, setEinvoiceError] = useState<string | null>(null);

  const handleLookupEInvoiceForProduct = async () => {
    setEinvoiceSearching(true);
    setEinvoiceError(null);
    try {
      const res = await eInvoiceService.lookupOnlineInvoice({
        sellerTaxCode: einvoiceTaxCode,
        invoiceNumber: einvoiceNumber,
        invoiceSerial: einvoiceSerial,
        lookupCode: einvoiceLookupCode
      });
      if (res) {
        setLoadedEInvoice(res);
      } else {
        setEinvoiceError('Không tìm thấy hóa đơn điện tử phù hợp!');
      }
    } catch (e: any) {
      setEinvoiceError(e.message || 'Lỗi tra cứu hóa đơn');
    } finally {
      setEinvoiceSearching(false);
    }
  };

  const handleApplyEInvoiceItem = (item: EInvoiceItem) => {
    if (!loadedEInvoice) return;
    setName(item.itemName);
    const generatedCode = (item.itemCode || item.matchedSku || 'SKU-' + Date.now().toString().slice(-4)).toUpperCase();
    setCode(generatedCode);
    setSku(item.matchedSku || generatedCode);
    
    if (UNIT_OPTIONS.includes(item.unit)) {
      setUnit(item.unit);
      setCustomUnit('');
    } else {
      setUnit('custom');
      setCustomUnit(item.unit);
    }

    setCostPrice(item.unitPrice || 0);
    setSellingPrice(Math.round((item.unitPrice || 0) * 1.25));
    setSupplierName(loadedEInvoice.sellerName);
    setSupplierId(loadedEInvoice.sellerTaxCode);

    // Try inferring brand
    if (loadedEInvoice.sellerName.includes('MediPlus') || item.itemName.includes('MediPlus')) {
      setBrand('MediPlus');
      setCategory('Vật tư phụ kiện');
    } else if (loadedEInvoice.sellerName.includes('Vietcoco') || item.itemName.includes('Vietcoco')) {
      setBrand('Vietcoco');
      setCategory('Đồ uống');
    } else if (loadedEInvoice.sellerName.includes('Hòa Phát')) {
      setBrand('Hòa Phát');
      setCategory('Thép & Kim loại');
    } else if (loadedEInvoice.sellerName.includes('Hoa Sen')) {
      setBrand('Hoa Sen');
      setCategory('Tôn & Xà gồ');
    }

    setNote(`Nhập theo HĐĐT Số: ${loadedEInvoice.invoiceNumber}, Ký hiệu: ${loadedEInvoice.invoiceSerial}, Mã CQT: ${loadedEInvoice.lookupCode}`);
    setShowEInvoicePanel(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      setProductId(productToEdit.productId || `P${String(productToEdit.id).padStart(6, '0')}`);
      setCode(productToEdit.code || productToEdit.productCode || '');
      setSku(productToEdit.sku || productToEdit.variantSku || '');
      setName(productToEdit.name || productToEdit.productName || '');
      setBrand(productToEdit.brand || 'Vietcoco');
      setVariant(productToEdit.variant || productToEdit.variantName || '');
      setNote(productToEdit.note || productToEdit.notes || '');

      if (CATEGORY_OPTIONS.includes(productToEdit.category)) {
        setCategory(productToEdit.category);
        setCustomCategory('');
      } else {
        setCategory('Khác');
        setCustomCategory(productToEdit.category);
      }

      if (UNIT_OPTIONS.includes(productToEdit.unit)) {
        setUnit(productToEdit.unit);
        setCustomUnit('');
      } else {
        setUnit('custom');
        setCustomUnit(productToEdit.unit);
      }

      setPackSize(String(productToEdit.packSize || '1'));
      setCostPrice(productToEdit.costPrice || 0);
      setSellingPrice(productToEdit.sellingPrice || 0);
      setMinStock(productToEdit.minStock || 10);
      setMaxStock(productToEdit.maxStock || 500);
      setLocation(productToEdit.location || 'Khu A - Kệ 01');
      setSupplierName(productToEdit.supplierName || '');
      setSupplierId(productToEdit.supplierId || '');
      setBranchId(productToEdit.branchId || 'BR01');
      setWarehouseId(productToEdit.warehouseId || 'WH01');
      setVariantsList(productToEdit.variants || []);
      setHasOpeningStock(false);
      setOpeningQuantity(0);
      setOpeningCostPrice(0);
    } else {
      // Auto generate next Product ID & Code
      const nextIndex = existingProducts.length + 1;
      const nextPId = `P${String(nextIndex).padStart(6, '0')}`;
      setProductId(nextPId);
      setCode(`VCC-${String(nextIndex).padStart(3, '0')}`);
      setSku('');
      setName('');
      setBrand('Vietcoco');
      setVariant('1 Hộp');
      setCategory(CATEGORY_OPTIONS[0]);
      setCustomCategory('');
      setUnit(UNIT_OPTIONS[0]);
      setCustomUnit('');
      setPackSize('1');
      setNote('');
      setCostPrice(0);
      setSellingPrice(0);
      setMinStock(10);
      setMaxStock(500);
      setLocation('KHO-DU-01');
      setSupplierName(suppliers[0]?.name || 'Công ty TNHH Chế Biến Dừa Lương Quới (Vietcoco)');
      setSupplierId(suppliers[0]?.id || '');
      setBranchId(branches[0]?.id || 'BR01');
      setWarehouseId(warehouses[0]?.id || 'WH01');
      setVariantsList([]);
      setHasOpeningStock(false);
      setOpeningQuantity(0);
      setOpeningCostPrice(0);
    }
    setErrors({});
  }, [isOpen, productToEdit, existingProducts.length]);

  // Handle Name change
  const handleNameChange = (val: string) => {
    setName(val);
  };

  const handleSupplierSelect = (sId: string) => {
    setSupplierId(sId);
    const found = suppliers.find((s) => s.id === sId);
    if (found) {
      setSupplierName(found.name);
    }
  };

  // Quick Preset Combos generator for Vietcoco beverages
  const handleGenerateVietcocoCombos = () => {
    const baseCode = code.trim().toUpperCase() || 'VCC-PROD';
    const basePrice = Number(sellingPrice) || 30000;
    const baseCost = Number(costPrice) || Math.round(basePrice * 0.75);

    const newCombos: ProductVariant[] = [
      {
        id: `var-${Date.now()}-1`,
        variantName: '1 Hộp',
        sku: `${baseCode}-C1`,
        variantSku: `${baseCode}-C1`,
        packSize: 1,
        unit: unit === 'custom' ? customUnit : unit,
        sellingPrice: basePrice,
        costPrice: baseCost,
        note: note
      },
      {
        id: `var-${Date.now()}-2`,
        variantName: 'Combo 2 Hộp',
        sku: `${baseCode}-C2`,
        variantSku: `${baseCode}-C2`,
        packSize: 2,
        unit: unit === 'custom' ? customUnit : unit,
        sellingPrice: Math.round(basePrice * 2 * 0.95),
        costPrice: baseCost * 2,
        note: note
      },
      {
        id: `var-${Date.now()}-3`,
        variantName: 'Combo 3 Hộp',
        sku: `${baseCode}-C3`,
        variantSku: `${baseCode}-C3`,
        packSize: 3,
        unit: unit === 'custom' ? customUnit : unit,
        sellingPrice: Math.round(basePrice * 3 * 0.93),
        costPrice: baseCost * 3
      },
      {
        id: `var-${Date.now()}-4`,
        variantName: 'Combo 5 Hộp',
        sku: `${baseCode}-C5`,
        variantSku: `${baseCode}-C5`,
        packSize: 5,
        unit: unit === 'custom' ? customUnit : unit,
        sellingPrice: Math.round(basePrice * 5 * 0.9),
        costPrice: baseCost * 5
      },
      {
        id: `var-${Date.now()}-5`,
        variantName: 'Combo 6 Hộp',
        sku: `${baseCode}-C6`,
        variantSku: `${baseCode}-C6`,
        packSize: 6,
        unit: unit === 'custom' ? customUnit : unit,
        sellingPrice: Math.round(basePrice * 6 * 0.88),
        costPrice: baseCost * 6
      },
      {
        id: `var-${Date.now()}-6`,
        variantName: 'Combo 10 Hộp',
        sku: `${baseCode}-C10`,
        variantSku: `${baseCode}-C10`,
        packSize: 10,
        unit: unit === 'custom' ? customUnit : unit,
        sellingPrice: Math.round(basePrice * 10 * 0.85),
        costPrice: baseCost * 10
      },
      {
        id: `var-${Date.now()}-7`,
        variantName: '1/2 Thùng (12 Hộp)',
        sku: `${baseCode}-C12`,
        variantSku: `${baseCode}-C12`,
        packSize: 12,
        unit: unit === 'custom' ? customUnit : unit,
        sellingPrice: Math.round(basePrice * 12 * 0.82),
        costPrice: baseCost * 12
      },
      {
        id: `var-${Date.now()}-8`,
        variantName: 'Thùng 24 Hộp',
        sku: `${baseCode}-C24`,
        variantSku: `${baseCode}-C24`,
        packSize: 24,
        unit: unit === 'custom' ? customUnit : unit,
        sellingPrice: Math.round(basePrice * 24 * 0.8),
        costPrice: baseCost * 24
      }
    ];

    setVariantsList(newCombos);
  };

  const handleAddCustomVariant = () => {
    const baseCode = code.trim().toUpperCase() || 'SP';
    const index = variantsList.length + 1;
    setVariantsList((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}-${index}`,
        variantName: `Combo ${index}`,
        sku: `${baseCode}-C${index}`,
        variantSku: `${baseCode}-C${index}`,
        packSize: index,
        unit: unit === 'custom' ? customUnit : unit,
        sellingPrice: Number(sellingPrice) * index || 0,
        costPrice: Number(costPrice) * index || 0
      }
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariantsList((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Vui lòng nhập tên sản phẩm';
    if (!code.trim()) errs.code = 'Vui lòng nhập mã sản phẩm cha';
    if (hasOpeningStock && openingQuantity <= 0) {
      errs.openingQuantity = 'Số lượng tồn đầu kỳ phải lớn hơn 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalCategory = category === 'Khác' ? customCategory.trim() || 'Khác' : category;
    const finalUnit = unit === 'custom' ? customUnit.trim() || 'cái' : unit;
    const finalCode = code.trim().toUpperCase();
    const finalSku = sku.trim()
      ? sku.trim().toUpperCase()
      : variantsList.length > 0 && variantsList[0].sku
      ? variantsList[0].sku.trim().toUpperCase()
      : finalCode;

    const productData: Product = {
      id: productToEdit ? productToEdit.id : `prod-${Date.now()}`,
      productId: productId.trim() || `P${String(existingProducts.length + 1).padStart(6, '0')}`,
      code: finalCode,
      productCode: finalCode,
      sku: finalSku,
      variantSku: finalSku,
      name: name.trim(),
      productName: name.trim(),
      brand: brand.trim() || 'Vietcoco',
      variant: variant.trim() || undefined,
      variantName: variant.trim() || undefined,
      category: finalCategory,
      unit: finalUnit,
      packSize: packSize.trim() || undefined,
      note: note.trim() || undefined,
      notes: note.trim() || undefined,
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      stock: productToEdit ? productToEdit.stock : hasOpeningStock ? Number(openingQuantity) || 0 : 0,
      minStock: Number(minStock) || 0,
      maxStock: Number(maxStock) || undefined,
      location: location.trim() || 'Khu A',
      branchId,
      warehouseId,
      supplierName: supplierName.trim() || brand.trim() || 'Vietcoco',
      supplierId: supplierId || undefined,
      variants: variantsList.length > 0 ? variantsList : undefined,
      isLowStock:
        (productToEdit ? productToEdit.stock : hasOpeningStock ? Number(openingQuantity) || 0 : 0) <=
        (Number(minStock) || 0)
    };

    const openingData =
      !productToEdit && hasOpeningStock && openingQuantity > 0
        ? {
            quantity: Number(openingQuantity),
            costPrice: Number(openingCostPrice) || Number(costPrice) || 0,
            warehouseId: warehouseId || 'WH01',
            branchId: branchId || 'BR01'
          }
        : undefined;

    onSaveProduct(productData, openingData);
    onClose();
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {productToEdit ? 'Chỉnh Sửa Sản Phẩm & Biến Thể SKU' : 'Thêm Mới Sản Phẩm & Cấu Hình Biến Thể'}
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Cấu trúc chuẩn: Category, Brand, Product Name, Variant Name, Variant SKU, Pack Size, Product ID...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto text-xs flex-1">
          {/* E-Invoice Auto-fill Banner & Panel */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black">
                  <Zap className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <div className="font-black text-blue-900 text-xs flex items-center gap-1.5">
                    <span>⚡ Trích Xuất Thông Tin Từ Hóa Đơn Điện Tử (HĐĐT)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      Tự động điền giá, đơn vị, tên SP, MST bên bán
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-700">
                    Tra cứu theo MST, Số HĐ, Ký hiệu hoặc Mã CQT để tự động lấy tên SP, giá vốn và đơn vị tính
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenEInvoiceEntry && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenEInvoiceEntry();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                    title="Chuyển sang chế độ nhập HĐĐT đầy đủ gồm nhiều mặt hàng và hạch toán tự động"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Mở Phương Án 2 (Nhập HĐĐT Tổng Thể)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowEInvoicePanel(!showEInvoicePanel)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
                >
                  {showEInvoicePanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showEInvoicePanel ? 'Thu gọn panel HĐĐT' : 'Mở tra cứu HĐĐT'}</span>
                </button>
              </div>
            </div>

            {showEInvoicePanel && (
              <div className="mt-3 pt-3 border-t border-blue-200 space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Mã Số Thuế Đơn Vị (MST Bên Bán)
                    </label>
                    <input
                      type="text"
                      value={einvoiceTaxCode}
                      onChange={(e) => setEinvoiceTaxCode(e.target.value)}
                      placeholder="0101389216"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Số Hóa Đơn</label>
                    <input
                      type="text"
                      value={einvoiceNumber}
                      onChange={(e) => setEinvoiceNumber(e.target.value)}
                      placeholder="00097453"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Ký Hiệu Hóa Đơn</label>
                    <input
                      type="text"
                      value={einvoiceSerial}
                      onChange={(e) => setEinvoiceSerial(e.target.value.toUpperCase())}
                      placeholder="1C26MYT"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Mã Cơ Quan Thuế / CQT</label>
                    <input
                      type="text"
                      value={einvoiceLookupCode}
                      onChange={(e) => setEinvoiceLookupCode(e.target.value)}
                      placeholder="M1-26-HKYFC-00003100243"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-emerald-800"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-bold">Nạp nhanh:</span>
                    {sampleEInvoices.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setEinvoiceTaxCode(s.sellerTaxCode);
                          setEinvoiceNumber(s.invoiceNumber);
                          setEinvoiceSerial(s.invoiceSerial);
                          setEinvoiceLookupCode(s.lookupCode);
                          setLoadedEInvoice(s);
                          setEinvoiceError(null);
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-blue-100 text-[10px] font-bold text-slate-700 hover:text-blue-800 rounded border border-slate-200 cursor-pointer"
                      >
                        {s.sellerName.split('(')[1]?.replace(')', '') || s.sellerName.split(' ')[0]} (#{s.invoiceNumber})
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleLookupEInvoiceForProduct}
                    disabled={einvoiceSearching}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{einvoiceSearching ? 'Đang tra cứu...' : 'Tra cứu HĐ'}</span>
                  </button>
                </div>

                {einvoiceError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                    {einvoiceError}
                  </div>
                )}

                {loadedEInvoice && (
                  <div className="border border-blue-100 rounded-xl p-3 bg-blue-50/40 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                      <span>NCC: {loadedEInvoice.sellerName} (MST: {loadedEInvoice.sellerTaxCode})</span>
                      <span className="font-mono text-blue-700">HĐ #{loadedEInvoice.invoiceNumber} - {loadedEInvoice.invoiceSerial}</span>
                    </div>

                    <div className="text-[11px] font-bold text-slate-600">Chọn 1 mặt hàng từ HĐ để áp dụng vào form:</div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {loadedEInvoice.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition gap-2 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-900 truncate">{it.itemName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              SL: <strong>{it.quantity}</strong> {it.unit} | Đơn giá: <strong>{it.unitPrice.toLocaleString('vi-VN')} đ</strong> | VAT {it.vatRate}%
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApplyEInvoiceItem(it)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Áp dụng vào Form</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Top Identifiers Row */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Product ID (Mã định danh)</label>
              <input
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="P000001"
                className="w-full font-mono font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Product Code (Mã SP cha) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VCCCM330-UHT"
                className={`w-full font-mono font-bold bg-white border rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.code ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              {errors.code && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.code}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pack Size (Quy cách mặc định)</label>
              <input
                type="text"
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                placeholder="1, 2, 6, 12, 24..."
                className="w-full font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Product Name (Tên Sản Phẩm) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ví dụ: Sữa dừa UHT Vietcoco 330ml / Nước cốt dừa tươi Vietcoco"
                className={`w-full font-bold bg-white border rounded-xl px-3.5 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              {errors.name && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.name}</p>}
            </div>

            {/* Brand */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Thương Hiệu (Brand)</label>
              <div className="relative">
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  list="brand-list"
                  placeholder="Vietcoco, Hòa Phát..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-blue-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <datalist id="brand-list">
                  {BRAND_SUGGESTIONS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Variant Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Variant Name (Tên Biến thể / Combo)</label>
              <input
                type="text"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="Ví dụ: Combo 2 Hộp, 1 Hộp, Thùng 24 Hộp..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Danh Mục (Category)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Đơn Vị Tính (Unit)</label>
              <div className="flex gap-2">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                  <option value="custom">Tùy chỉnh khác...</option>
                </select>
                {unit === 'custom' && (
                  <input
                    type="text"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="Nhập ĐVT..."
                    className="w-1/2 bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                )}
              </div>
            </div>

            {/* Ghi chú / Note */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">
                Ghi Chú (Ký hiệu viết tắt / Tiêu chuẩn)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: CM = Coconut Milk (Sữa dừa), CC = Coconut Cream (Nước cốt dừa)..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing & Stock Min/Max */}
          <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Giá Vốn Ước Tính (FIFO)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={costPrice || ''}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  placeholder="28,000"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2 font-bold text-slate-400">đ</span>
              </div>
              <span className="text-[10px] text-slate-400">Giá vốn lô nhập</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Giá Bán Niêm Yết <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={sellingPrice || ''}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  placeholder="36,000"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-blue-700 font-extrabold pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2 font-bold text-slate-400">đ</span>
              </div>
              <span className="text-[10px] text-slate-400">Giá bán POS/Đơn hàng</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tồn Kho Tối Thiểu (Min)</label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                placeholder="10"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Cảnh báo sắp hết</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Vị Trí Lưu Kho</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="KHO-DU-01"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Mã ô/kệ lưu trữ</span>
            </div>
          </div>

          {/* Multiple Variants / Combos Section */}
          <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-extrabold text-purple-900 text-xs flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-purple-600" />
                  <span>Danh Sách Quy Cách & Combo Biến Thể ({variantsList.length} quy cách)</span>
                </h4>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  Cấu hình các bộ Combo (2, 3, 5, 6, 10 hộp, 1/2 thùng, thùng 24) theo đúng bảng Vietcoco
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateVietcocoCombos}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tự động tạo combo Vietcoco</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomVariant}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-purple-200 text-purple-700 hover:bg-purple-100/50 rounded-xl font-bold cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm quy cách</span>
                </button>
              </div>
            </div>

            {variantsList.length > 0 ? (
              <div className="border border-purple-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-purple-100/60 text-purple-900 font-extrabold text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Variant Name</th>
                      <th className="py-2 px-3 font-mono">Variant SKU</th>
                      <th className="py-2 px-3 text-center">Pack Size</th>
                      <th className="py-2 px-3 text-center bg-purple-100/80">SL Nhập (Tồn Đầu)</th>
                      <th className="py-2 px-3 text-right">Giá Vốn</th>
                      <th className="py-2 px-3 text-right">Thành Tiền Vốn</th>
                      <th className="py-2 px-3 text-right">Giá Bán</th>
                      <th className="py-2 px-3 text-center w-10">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    {variantsList.map((v, i) => {
                      const lineQty = Number(v.importQuantity) || 0;
                      const lineCost = Number(v.costPrice) || 0;
                      const lineTotal = lineQty * lineCost;

                      return (
                        <tr key={i} className="hover:bg-purple-50/40">
                          <td className="py-1.5 px-3">
                            <input
                              type="text"
                              value={v.variantName}
                              onChange={(e) => {
                                const updated = [...variantsList];
                                updated[i].variantName = e.target.value;
                                setVariantsList(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold"
                            />
                          </td>
                          <td className="py-1.5 px-3 font-mono">
                            <input
                              type="text"
                              value={v.sku}
                              onChange={(e) => {
                                const updated = [...variantsList];
                                updated[i].sku = e.target.value.toUpperCase();
                                updated[i].variantSku = e.target.value.toUpperCase();
                                setVariantsList(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-purple-700"
                            />
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            <input
                              type="text"
                              value={v.packSize}
                              onChange={(e) => {
                                const updated = [...variantsList];
                                updated[i].packSize = e.target.value;
                                setVariantsList(updated);
                              }}
                              className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                            />
                          </td>
                          <td className="py-1.5 px-3 text-center bg-purple-50/30">
                            <input
                              type="number"
                              min="0"
                              value={v.importQuantity ?? ''}
                              onChange={(e) => {
                                const updated = [...variantsList];
                                updated[i].importQuantity = e.target.value === '' ? undefined : Number(e.target.value);
                                setVariantsList(updated);
                              }}
                              placeholder="0"
                              className="w-16 text-center bg-white border border-purple-300 focus:ring-1 focus:ring-purple-500 rounded-lg px-2 py-1 text-xs font-extrabold text-purple-900"
                              title="Số lượng nhập kho / tồn ban đầu của biến thể này"
                            />
                          </td>
                          <td className="py-1.5 px-3 text-right">
                            <input
                              type="number"
                              value={v.costPrice || 0}
                              onChange={(e) => {
                                const updated = [...variantsList];
                                updated[i].costPrice = Number(e.target.value);
                                setVariantsList(updated);
                              }}
                              className="w-20 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium"
                            />
                          </td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-700 font-mono text-[11px]">
                            {lineTotal > 0 ? lineTotal.toLocaleString('vi-VN') + ' đ' : '-'}
                          </td>
                          <td className="py-1.5 px-3 text-right font-bold text-blue-700">
                            <input
                              type="number"
                              value={v.sellingPrice || 0}
                              onChange={(e) => {
                                const updated = [...variantsList];
                                updated[i].sellingPrice = Number(e.target.value);
                                setVariantsList(updated);
                              }}
                              className="w-20 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-extrabold text-blue-700"
                            />
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(i)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {variantsList.some((v) => (v.importQuantity || 0) > 0) && (
                    <tfoot className="bg-purple-100/80 font-bold text-purple-950 border-t border-purple-200">
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-right text-[11px]">
                          Tổng Lượng Nhập Các Biến Thể:
                        </td>
                        <td className="py-2 px-3 text-center text-xs font-extrabold text-purple-950">
                          {variantsList.reduce((sum, v) => sum + (Number(v.importQuantity) || 0), 0).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2 px-3 text-right text-[11px]">Tổng Tiền Vốn Biến Thể:</td>
                        <td className="py-2 px-3 text-right text-xs font-black text-purple-950 font-mono">
                          {variantsList
                            .reduce((sum, v) => sum + (Number(v.importQuantity) || 0) * (Number(v.costPrice) || 0), 0)
                            .toLocaleString('vi-VN')}{' '}
                          đ
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                Chưa tạo danh sách biến thể phụ. Nhấp "Tự động tạo combo Vietcoco" hoặc "+ Thêm quy cách" để thêm.
              </p>
            )}
          </div>

          {/* Opening FIFO Balance */}
          {!productToEdit && (
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOpeningStock}
                    onChange={(e) => setHasOpeningStock(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
                  />
                  <span className="font-extrabold text-emerald-900 text-xs">
                    Khởi tạo Tồn Kho Đầu Kỳ (Tạo Lô FIFO ban đầu)
                  </span>
                </label>
                <span className="text-[11px] text-emerald-700 font-medium">Khuyên dùng khi bắt đầu sử dụng</span>
              </div>

              {hasOpeningStock && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-emerald-200">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Số Lượng Tồn Ban Đầu ({unit || 'ĐVT'}) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={openingQuantity || ''}
                      onChange={(e) => setOpeningQuantity(Number(e.target.value))}
                      placeholder="100"
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Giá Vốn Lô Đầu Kỳ</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={openingCostPrice || costPrice || ''}
                      onChange={(e) => setOpeningCostPrice(Number(e.target.value))}
                      placeholder="Giá vốn..."
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kho Nhận Hàng</label>
                    <select
                      value={warehouseId}
                      onChange={(e) => setWarehouseId(e.target.value)}
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 font-medium text-slate-800"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors cursor-pointer text-xs"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{productToEdit ? 'Lưu Thay Đổi Sản Phẩm' : 'Tạo Sản Phẩm & SKU Mới'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
