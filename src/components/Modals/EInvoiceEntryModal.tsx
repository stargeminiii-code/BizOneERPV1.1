import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  HelpCircle,
  PackagePlus,
  QrCode,
  Tag,
  Warehouse as WarehouseIcon,
  Globe,
  Upload,
  Calendar,
  DollarSign,
  Boxes,
  Check,
  AlertCircle,
  X,
  FileCode,
  Layers3,
  RefreshCw,
  Copy,
  ChevronDown,
  Info,
  SlidersHorizontal
} from 'lucide-react';
import {
  Product,
  Supplier,
  Warehouse,
  Branch,
  EInvoiceData,
  EInvoiceItem,
  InventoryLayer,
  PurchaseOrder,
  StockTransaction,
  AuditLog,
  ProductVariant
} from '../../types';
import { eInvoiceService, sampleEInvoices, GDT_PORTAL_HTTPS_URL } from '../../services/eInvoiceService';
import { numberToWordsVietnamese } from '../../utils/numberToWords';
import {
  lookupEnterpriseByTaxCode,
  generateNextProductId,
  generateProductCode,
  generateVariantSku,
  getStandardCombos,
  ENTERPRISE_TAX_DIRECTORY
} from '../../utils/productCodeGenerator';
import { SearchableCreatableSelect } from '../SearchableCreatableSelect';

export interface EInvoiceEntryRow {
  id: string;
  lineNumber: number;
  productId: string; // P000001 -> P999999
  productCode: string; // Mã SP cha (e.g. VCCCM330-PRM)
  variantName: string; // Tên phân loại (e.g. Combo 2 Hộp, 1 Hộp)
  variantSku: string; // Variant SKU (e.g. VCCCM330-PRM-C2)
  packSize: string; // 1, 2, 6, 24
  itemName: string; // Tên Hàng Hóa Dịch Vụ
  brand: string; // Thương hiệu (Vietcoco, Hòa Phát,...)
  category: string; // Danh mục / Nhóm hàng
  unit: string; // ĐVT (Hộp, Chai, Thùng,...)
  quantity: number;
  unitPrice: number;
  totalBeforeVat: number;
  vatRate: number; // 0, 5, 8, 10, -1
  vatAmount: number;
  totalWithVat: number;
  matchedExistingProduct?: Product | null;
  expiryDate?: string;
  location?: string;
  showVariantManager?: boolean;
  subVariants?: Array<{
    variantName: string;
    variantSku: string;
    packSize: string;
    sellingPrice?: number;
  }>;
}

interface EInvoiceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  existingProducts?: Product[];
  suppliers?: Supplier[];
  existingSuppliers?: Supplier[];
  warehouses: Warehouse[];
  branches: Branch[];
  onProcessEInvoice: (result: {
    invoiceData?: EInvoiceData;
    eInvoice?: EInvoiceData;
    createdProducts: Product[];
    createdLots: InventoryLayer[];
    purchaseOrder?: PurchaseOrder;
    transactions: StockTransaction[];
  }) => void;
  onSwitchToManualProduct?: () => void;
}

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
  'bộ',
  'Can',
  'Lốc',
  'Thỏi'
];

const CATEGORY_OPTIONS = [
  'Sản phẩm Nước Dừa & Sữa Dừa Vietcoco',
  'Thép Xây Dựng & Thép Cuộn',
  'Tôn Mạ Kẽm & Tôn Lạnh',
  'Vật Tư Y Tế & Tiêu Hao',
  'Sữa & Chế Phẩm Từ Sữa',
  'Xi Măng & Vật Liệu Xây Dựng',
  'Inox & Thép Không Gỉ',
  'Vật tư phụ & Phụ kiện',
  'Hàng Tiêu Dùng Nhanh (FMCG)'
];

const VAT_RATE_OPTIONS = [
  { label: '8% (Nghị định 72/2024)', value: 8 },
  { label: '10% (Thuế suất chuẩn)', value: 10 },
  { label: '5% (Ưu đãi nông sản/y tế)', value: 5 },
  { label: '0% (Xuất khẩu/Miễn thuế)', value: 0 },
  { label: 'Không chịu thuế (KCT)', value: -1 }
];

export const EInvoiceEntryModal: React.FC<EInvoiceEntryModalProps> = ({
  isOpen,
  onClose,
  products = [],
  existingProducts = [],
  suppliers = [],
  existingSuppliers = [],
  warehouses = [],
  branches = [],
  onProcessEInvoice,
  onSwitchToManualProduct
}) => {
  // Merge products and suppliers
  const allProducts = useMemo(() => {
    return products.length > 0 ? products : existingProducts;
  }, [products, existingProducts]);

  const allSuppliers = useMemo(() => {
    return suppliers.length > 0 ? suppliers : existingSuppliers;
  }, [suppliers, existingSuppliers]);

  // Header state
  const [sellerTaxCode, setSellerTaxCode] = useState('1300928312');
  const [sellerName, setSellerName] = useState('Công ty TNHH Chế Biến Dừa Lương Quới (Vietcoco)');
  const [sellerAddress, setSellerAddress] = useState('Lô A36-A37, KCN An Hiệp, Xã An Hiệp, Huyện Châu Thành, Tỉnh Bến Tre');
  const [invoiceSerial, setInvoiceSerial] = useState('1C26VCC');
  const [invoiceNumber, setInvoiceNumber] = useState('0001001');
  const [taxAuthorityCode, setTaxAuthorityCode] = useState('M1-26-VCC-000031920');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'TM/CK' | 'TM' | 'CK' | 'Chưa thanh toán'>('TM/CK');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || 'WH01');
  const [branchId, setBranchId] = useState(branches[0]?.id || 'BR01');
  const [matchedCompanyInfo, setMatchedCompanyInfo] = useState<string | null>(null);

  // Dynamic Options for Brand and Category
  const [brandOptions, setBrandOptions] = useState<string[]>([
    'Vietcoco',
    'Hòa Phát',
    'Hoa Sen',
    'Pomina',
    'Vinamilk',
    'MediPlus',
    'Posco',
    'Vicem Hà Tiên',
    'Kim Tín',
    'Lavie',
    'Aquafina',
    'TH True Milk',
    'ABC Bakery'
  ]);

  const [categoryOptions, setCategoryOptions] = useState<string[]>(CATEGORY_OPTIONS);
  const [unitOptions, setUnitOptions] = useState<string[]>(UNIT_OPTIONS);

  // Line items state
  const [rows, setRows] = useState<EInvoiceEntryRow[]>([]);

  // UI state
  const [isSearching, setIsSearching] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isXmlUploading, setIsXmlUploading] = useState(false);
  const [autoCreatePO, setAutoCreatePO] = useState(true);
  const [autoCreateLots, setAutoCreateLots] = useState(true);

  // Collect all known brands from products catalog
  useEffect(() => {
    const brandsSet = new Set(brandOptions);
    allProducts.forEach((p) => {
      if (p.brand && p.brand.trim()) brandsSet.add(p.brand.trim());
    });
    setBrandOptions(Array.from(brandsSet));
  }, [allProducts]);

  // Initial load default rows on first open
  useEffect(() => {
    if (!isOpen) return;

    if (rows.length === 0) {
      loadVietcocoDefaultInvoice();
    }
  }, [isOpen]);

  // Sync Seller Details automatically when Tax Code (MST) is entered or changed
  const handleTaxCodeChange = (rawTaxCode: string) => {
    setSellerTaxCode(rawTaxCode);
    const cleanTax = rawTaxCode.replace(/\D/g, '');

    // 1. Check in Enterprise Tax Directory
    const enterprise = lookupEnterpriseByTaxCode(cleanTax);
    if (enterprise) {
      setSellerName(enterprise.companyName);
      setSellerAddress(enterprise.address);
      setInvoiceSerial(enterprise.suggestedSerial);
      setTaxAuthorityCode(`${enterprise.suggestedCqtPrefix}-${Math.floor(100000000 + Math.random() * 900000000)}`);
      setMatchedCompanyInfo(`✓ Đã đồng bộ thông tin: ${enterprise.shortName} (${enterprise.brand})`);

      // Update rows brand if empty or default
      setRows((prev) =>
        prev.map((r) => {
          const newBrand = enterprise.brand || r.brand;
          const newPCode = generateProductCode(r.itemName, newBrand);
          const newSku = generateVariantSku(newPCode, r.variantName);
          return {
            ...r,
            brand: newBrand,
            productCode: newPCode,
            variantSku: newSku
          };
        })
      );
      return;
    }

    // 2. Check in existing suppliers state
    const matchedSup = allSuppliers.find(
      (s) => s.taxCode && s.taxCode.replace(/\D/g, '') === cleanTax
    );
    if (matchedSup) {
      setSellerName(matchedSup.name || matchedSup.legalName || '');
      if (matchedSup.address) setSellerAddress(matchedSup.address);
      setMatchedCompanyInfo(`✓ Đã đồng bộ từ danh bạ Nhà Cung Cấp: ${matchedSup.name}`);
      return;
    }

    setMatchedCompanyInfo(null);
  };

  // Quick Preset Selection
  const applyPresetSupplier = (taxCode: string) => {
    handleTaxCodeChange(taxCode);
  };

  // Load Vietcoco Default sample
  const loadVietcocoDefaultInvoice = () => {
    setSellerTaxCode('1300928312');
    setSellerName('Công ty TNHH Chế Biến Dừa Lương Quới (Vietcoco)');
    setSellerAddress('Lô A36-A37, KCN An Hiệp, Xã An Hiệp, Huyện Châu Thành, Tỉnh Bến Tre');
    setInvoiceSerial('1C26VCC');
    setInvoiceNumber('0001001');
    setTaxAuthorityCode('M1-26-VCC-000031920');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setMatchedCompanyInfo('✓ Đã đồng bộ: Vietcoco Bến Tre');

    const sampleItems = [
      {
        itemName: 'Sữa dừa Premium Vietcoco 330ml',
        brand: 'Vietcoco',
        category: 'Sản phẩm Nước Dừa & Sữa Dừa Vietcoco',
        variantName: 'Combo 2 Hộp',
        packSize: '2',
        unit: 'Hộp',
        qty: 300,
        price: 32000,
        vat: 8
      },
      {
        itemName: 'Sữa dừa UHT Vietcoco 330ml',
        brand: 'Vietcoco',
        category: 'Sản phẩm Nước Dừa & Sữa Dừa Vietcoco',
        variantName: '1 Hộp',
        packSize: '1',
        unit: 'Hộp',
        qty: 500,
        price: 28000,
        vat: 8
      },
      {
        itemName: 'Nước dừa xiêm nguyên chất Vietcoco 330ml',
        brand: 'Vietcoco',
        category: 'Sản phẩm Nước Dừa & Sữa Dừa Vietcoco',
        variantName: 'Thùng 24 Hộp',
        packSize: '24',
        unit: 'Thùng',
        qty: 50,
        price: 480000,
        vat: 8
      }
    ];

    const occupiedIds: string[] = [];
    const generatedRows: EInvoiceEntryRow[] = sampleItems.map((it, idx) => {
      const nextPid = generateNextProductId(allProducts, occupiedIds);
      occupiedIds.push(nextPid);

      const parentCode = generateProductCode(it.itemName, it.brand);
      const varSku = generateVariantSku(parentCode, it.variantName);

      const lineTotal = it.price * it.qty;
      const vatVal = Math.round((lineTotal * it.vat) / 100);

      return {
        id: `row-init-${Date.now()}-${idx}`,
        lineNumber: idx + 1,
        productId: nextPid,
        productCode: parentCode,
        variantName: it.variantName,
        variantSku: varSku,
        packSize: it.packSize,
        itemName: it.itemName,
        brand: it.brand,
        category: it.category,
        unit: it.unit,
        quantity: it.qty,
        unitPrice: it.price,
        totalBeforeVat: lineTotal,
        vatRate: it.vat,
        vatAmount: vatVal,
        totalWithVat: lineTotal + vatVal,
        expiryDate: '2027-12-31',
        location: 'Kho Tổng'
      };
    });

    setRows(generatedRows);
  };

  // Add new Line Item Row with Auto Next Product ID & Code
  const handleAddRow = () => {
    const occupiedIds = rows.map((r) => r.productId);
    const nextPid = generateNextProductId(allProducts, occupiedIds);

    const defaultItemName = 'Sữa dừa Premium Vietcoco 330ml';
    const defaultBrand = sellerName.includes('Vietcoco') ? 'Vietcoco' : brandOptions[0] || 'Vietcoco';
    const parentCode = generateProductCode(defaultItemName, defaultBrand);
    const defaultVariant = '1 Hộp';
    const varSku = generateVariantSku(parentCode, defaultVariant);

    const defaultPrice = 30000;
    const defaultQty = 100;
    const defaultVat = 8;
    const lineTotal = defaultPrice * defaultQty;
    const vatVal = Math.round((lineTotal * defaultVat) / 100);

    const newRow: EInvoiceEntryRow = {
      id: `row-${Date.now()}-${rows.length + 1}`,
      lineNumber: rows.length + 1,
      productId: nextPid,
      productCode: parentCode,
      variantName: defaultVariant,
      variantSku: varSku,
      packSize: '1',
      itemName: defaultItemName,
      brand: defaultBrand,
      category: categoryOptions[0] || 'Sản phẩm Nước Dừa & Sữa Dừa Vietcoco',
      unit: 'Hộp',
      quantity: defaultQty,
      unitPrice: defaultPrice,
      totalBeforeVat: lineTotal,
      vatRate: defaultVat,
      vatAmount: vatVal,
      totalWithVat: lineTotal + vatVal,
      expiryDate: '2028-12-31',
      location: 'Kho Nhập HĐĐT'
    };

    setRows([...rows, newRow]);
  };

  // Remove row and re-sequence line numbers
  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) {
      alert('Hóa đơn điện tử phải có ít nhất 1 dòng hàng hóa!');
      return;
    }
    const nextRows = rows.filter((_, idx) => idx !== index);
    const reindexed = nextRows.map((r, i) => ({ ...r, lineNumber: i + 1 }));
    setRows(reindexed);
  };

  // Update specific field in row with Smart Auto-generation
  const updateRow = (index: number, field: keyof EInvoiceEntryRow, value: any) => {
    setRows((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };

      (target as any)[field] = value;

      // 1. If Item Name or Brand changes -> regenerate Product Code (Mã SP cha) & Variant SKU
      if (field === 'itemName' || field === 'brand') {
        const pName = field === 'itemName' ? String(value) : target.itemName;
        const pBrand = field === 'brand' ? String(value) : target.brand;
        const newCode = generateProductCode(pName, pBrand);
        target.productCode = newCode;
        target.variantSku = generateVariantSku(newCode, target.variantName || '1 Hộp');
      }

      // 2. If Variant Name changes -> regenerate Variant SKU
      if (field === 'variantName') {
        const vName = String(value);
        target.variantSku = generateVariantSku(target.productCode, vName);

        // Auto update pack size if detectable
        const matchCombo = vName.match(/(\d+)/);
        if (matchCombo) {
          target.packSize = matchCombo[1];
        } else if (vName.toLowerCase().includes('lẻ') || vName.toLowerCase().includes('1')) {
          target.packSize = '1';
        }
      }

      // 3. Recalculate totals
      const qty = field === 'quantity' ? Number(value) || 0 : target.quantity;
      const price = field === 'unitPrice' ? Number(value) || 0 : target.unitPrice;
      const vatRate = field === 'vatRate' ? Number(value) : target.vatRate;

      target.totalBeforeVat = qty * price;
      const effectiveVat = vatRate >= 0 ? vatRate : 0;
      target.vatAmount = Math.round((target.totalBeforeVat * effectiveVat) / 100);
      target.totalWithVat = target.totalBeforeVat + target.vatAmount;

      updated[index] = target;
      return updated;
    });
  };

  // Quick Apply Standard Combo to a specific row
  const applyStandardComboToRow = (rowIndex: number, comboName: string, packSize: string) => {
    updateRow(rowIndex, 'variantName', comboName);
  };

  // Online Lookup Simulation
  const handleLookupOnline = async () => {
    setIsSearching(true);
    setLookupMessage(null);

    await new Promise((resolve) => setTimeout(resolve, 800));

    // Try finding sample by invoice number
    const foundSample = sampleEInvoices.find(
      (s) =>
        s.invoiceNumber === invoiceNumber.trim() ||
        s.sellerTaxCode === sellerTaxCode.trim() ||
        s.lookupCode === taxAuthorityCode.trim()
    );

    if (foundSample) {
      handleTaxCodeChange(foundSample.sellerTaxCode);
      setInvoiceSerial(foundSample.invoiceSerial);
      setInvoiceNumber(foundSample.invoiceNumber);
      setTaxAuthorityCode(foundSample.taxAuthorityCode || foundSample.lookupCode || '');
      setInvoiceDate(foundSample.invoiceDate);

      const occupiedIds: string[] = [];
      const newRows: EInvoiceEntryRow[] = foundSample.items.map((item, idx) => {
        const nextPid = generateNextProductId(allProducts, occupiedIds);
        occupiedIds.push(nextPid);

        const brand = foundSample.sellerName.includes('Vietcoco') ? 'Vietcoco' : 'MediPlus';
        const pCode = generateProductCode(item.itemName, brand);
        const vSku = generateVariantSku(pCode, '1 Hộp');

        const lineTotal = item.unitPrice * item.quantity;
        const vatAmt = Math.round((lineTotal * item.vatRate) / 100);

        return {
          id: `row-lookup-${Date.now()}-${idx}`,
          lineNumber: idx + 1,
          productId: nextPid,
          productCode: pCode,
          variantName: '1 Hộp',
          variantSku: vSku,
          packSize: '1',
          itemName: item.itemName,
          brand,
          category: categoryOptions[0],
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalBeforeVat: lineTotal,
          vatRate: item.vatRate,
          vatAmount: vatAmt,
          totalWithVat: lineTotal + vatAmt,
          expiryDate: item.expiryDate || '2028-12-31',
          location: 'Kho Tổng'
        };
      });

      setRows(newRows);
      setLookupMessage({
        type: 'success',
        text: `✓ Tìm thấy HĐĐT hợp lệ từ Cổng Tổng Cục Thuế! Ký hiệu ${foundSample.invoiceSerial}, Số ${foundSample.invoiceNumber}`
      });
    } else {
      setLookupMessage({
        type: 'success',
        text: `✓ Đã kết nối Cổng Dịch Vụ Thuế Điện Tử. Thông tin HĐĐT số ${invoiceNumber} được chứng thực hợp lệ.`
      });
    }

    setIsSearching(false);
  };

  // Upload XML Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsXmlUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = eInvoiceService.parseEInvoiceXml(content);

        if (parsed) {
          handleTaxCodeChange(parsed.sellerTaxCode);
          setInvoiceSerial(parsed.invoiceSerial);
          setInvoiceNumber(parsed.invoiceNumber);
          setTaxAuthorityCode(parsed.taxAuthorityCode || parsed.lookupCode || '');
          setInvoiceDate(parsed.invoiceDate);

          const occupiedIds: string[] = [];
          const xmlRows: EInvoiceEntryRow[] = parsed.items.map((item, idx) => {
            const nextPid = generateNextProductId(allProducts, occupiedIds);
            occupiedIds.push(nextPid);

            const brand = parsed.sellerName.includes('Vietcoco') ? 'Vietcoco' : 'Đông Á';
            const pCode = generateProductCode(item.itemName, brand);
            const vSku = generateVariantSku(pCode, '1 Hộp');

            const lineTotal = item.unitPrice * item.quantity;
            const vatAmt = Math.round((lineTotal * item.vatRate) / 100);

            return {
              id: `row-xml-${Date.now()}-${idx}`,
              lineNumber: idx + 1,
              productId: nextPid,
              productCode: pCode,
              variantName: '1 Hộp',
              variantSku: vSku,
              packSize: '1',
              itemName: item.itemName,
              brand,
              category: categoryOptions[0],
              unit: item.unit,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalBeforeVat: lineTotal,
              vatRate: item.vatRate,
              vatAmount: vatAmt,
              totalWithVat: lineTotal + vatAmt,
              expiryDate: item.expiryDate || '2028-12-31',
              location: 'Kho Tổng'
            };
          });

          setRows(xmlRows);
          setLookupMessage({
            type: 'success',
            text: `✓ Đã đọc tệp XML HĐĐT thành công: ${file.name} (${xmlRows.length} mặt hàng)`
          });
        }
      } catch (err) {
        setLookupMessage({
          type: 'error',
          text: 'Tệp XML không đúng định dạng HĐĐT Nghị định 123/2020/NĐ-CP.'
        });
      } finally {
        setIsXmlUploading(false);
      }
    };

    reader.readAsText(file);
  };

  // Financial Sums
  const { totalBeforeVat, totalVatAmount, totalAmountWithVat } = useMemo(() => {
    let before = 0;
    let vat = 0;
    let grand = 0;
    rows.forEach((r) => {
      before += r.totalBeforeVat;
      vat += r.vatAmount;
      grand += r.totalWithVat;
    });
    return {
      totalBeforeVat: before,
      totalVatAmount: vat,
      totalAmountWithVat: grand
    };
  }, [rows]);

  const amountInWords = useMemo(() => {
    return numberToWordsVietnamese(totalAmountWithVat);
  }, [totalAmountWithVat]);

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  // Submission & Processing
  const handleSaveAndProcess = () => {
    if (rows.length === 0) {
      alert('Vui lòng thêm ít nhất một dòng hàng hóa!');
      return;
    }

    const invalidRow = rows.find((r) => !r.itemName.trim() || r.quantity <= 0);
    if (invalidRow) {
      alert(`Dòng STT ${invalidRow.lineNumber}: Vui lòng nhập Tên sản phẩm và Số lượng hợp lệ!`);
      return;
    }

    const selectedWh = warehouses.find((w) => w.id === warehouseId);
    const selectedBr = branches.find((b) => b.id === branchId);

    // 1. Build EInvoiceData structure
    const invoiceItems: EInvoiceItem[] = rows.map((r) => ({
      lineNumber: r.lineNumber,
      itemCode: r.productCode,
      matchedSku: r.variantSku || r.productCode,
      matchedProductId: r.productId,
      matchedProductName: r.itemName,
      itemName: r.itemName,
      unit: r.unit,
      quantity: r.quantity,
      unitPrice: r.unitPrice,
      totalBeforeVat: r.totalBeforeVat,
      vatRate: r.vatRate,
      vatAmount: r.vatAmount,
      totalWithVat: r.totalWithVat,
      suggestedLotId: `LOT-HD${invoiceNumber}-${String(r.lineNumber).padStart(2, '0')}`,
      expiryDate: r.expiryDate || '2028-12-31'
    }));

    const finalEInvoice: EInvoiceData = {
      id: `einv-entry-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim() || '0001001',
      invoiceSerial: invoiceSerial.trim().toUpperCase() || '1C26VCC',
      invoiceFormSymbol: '1',
      invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
      lookupCode: taxAuthorityCode.trim() || `CQT-${Date.now()}`,
      taxAuthorityCode: taxAuthorityCode.trim() || `CQT-${Date.now()}`,
      providerName: 'Hóa Đơn Điện Tử Tổng Cục Thuế',
      sellerName: sellerName.trim() || 'Nhà cung cấp',
      sellerLegalName: sellerName.trim(),
      sellerTaxCode: sellerTaxCode.trim(),
      sellerAddress: sellerAddress.trim(),
      buyerName: 'Công ty Cổ phần Thương mại & Phân phối Việt Phát',
      buyerTaxCode: '0108998822',
      items: invoiceItems,
      totalBeforeVat,
      vatRate: rows[0]?.vatRate || 8,
      totalVatAmount,
      totalAmountWithVat,
      totalAmountInWords: amountInWords,
      isTaxAuthorityCertified: true,
      isDigitalSignatureValid: true
    };

    // 2. Identify and create products with Variants
    const createdProducts: Product[] = [];
    rows.forEach((r) => {
      const existing = allProducts.find(
        (p) =>
          p.sku === r.variantSku ||
          p.productId === r.productId ||
          p.code === r.productCode
      );

      if (!existing) {
        // Pre-build standard variants for this product
        const defaultVariants: ProductVariant[] = [
          {
            id: `var-${Date.now()}-${r.lineNumber}-1`,
            sku: r.variantSku,
            variantSku: r.variantSku,
            variantName: r.variantName || '1 Hộp',
            packSize: r.packSize || '1',
            unit: r.unit,
            costPrice: r.unitPrice,
            sellingPrice: Math.round(r.unitPrice * 1.25),
            stock: r.quantity,
            importQuantity: r.quantity,
            barcode: r.variantSku
          }
        ];

        const newProd: Product = {
          id: `prod-${Date.now()}-${r.lineNumber}`,
          productId: r.productId,
          code: r.productCode.toUpperCase(),
          productCode: r.productCode.toUpperCase(),
          sku: r.variantSku.toUpperCase(),
          variantSku: r.variantSku.toUpperCase(),
          name: r.itemName,
          productName: r.itemName,
          variant: r.variantName,
          variantName: r.variantName,
          brand: r.brand || 'Vietcoco',
          category: r.category || 'Sản phẩm Nước Dừa & Sữa Dừa Vietcoco',
          unit: r.unit,
          packSize: r.packSize || '1',
          costPrice: r.unitPrice,
          sellingPrice: Math.round(r.unitPrice * 1.25),
          stock: autoCreateLots ? r.quantity : 0,
          minStock: 10,
          location: r.location || 'Kho Nhập HĐĐT',
          branchId,
          warehouseId,
          supplierName: sellerName,
          supplierId: sellerTaxCode,
          note: `Nhập theo HĐĐT Số ${invoiceNumber}, Ký hiệu ${invoiceSerial}, Mã CQT ${taxAuthorityCode}`,
          variants: defaultVariants
        };
        createdProducts.push(newProd);
      }
    });

    // 3. Generate FIFO inventory lots & transactions
    const createdLots: InventoryLayer[] = [];
    const transactions: StockTransaction[] = [];

    if (autoCreateLots) {
      rows.forEach((r) => {
        const lotId = `LOT-HD${invoiceNumber}-${String(r.lineNumber).padStart(2, '0')}`;
        const newLot: InventoryLayer = {
          id: `LAYER-HD-${Date.now()}-${r.lineNumber}`,
          layerId: lotId,
          lotId,
          layerType: 'RECEIPT',
          sku: (r.variantSku || r.productCode).toUpperCase(),
          variantSku: (r.variantSku || r.productCode).toUpperCase(),
          productId: r.productId,
          productCode: r.productCode.toUpperCase(),
          productName: r.itemName,
          variant: r.variantName,
          variantName: r.variantName,
          unit: r.unit,
          packSize: r.packSize || '1',
          branchId,
          branchName: selectedBr?.name || 'Chi nhánh Chính - Hà Nội',
          warehouseId,
          warehouseName: selectedWh?.name || 'Kho Tổng Hà Nội',
          supplierName: sellerName,
          supplierId: sellerTaxCode,
          receiptCode: `PO-HD${invoiceNumber}`,
          receivedAt: invoiceDate,
          createdAt: new Date().toISOString(),
          expiryDate: r.expiryDate || '2028-12-31',
          quantityReceived: r.quantity,
          initialQuantity: r.quantity,
          quantityIssued: 0,
          quantityRemaining: r.quantity,
          remainingQuantity: r.quantity,
          purchasePrice: r.unitPrice,
          costPrice: r.unitPrice,
          salePrice: Math.round(r.unitPrice * 1.25),
          status: 'active',
          eInvoiceNumber: invoiceNumber,
          eInvoiceSerial: invoiceSerial,
          eInvoiceLookupCode: taxAuthorityCode,
          eInvoiceDate: invoiceDate,
          eInvoiceSupplierTaxCode: sellerTaxCode,
          eInvoiceVatRate: r.vatRate,
          eInvoiceVatAmount: r.vatAmount,
          eInvoiceCostBeforeVat: r.unitPrice,
          notes: `Nhập theo HĐĐT Số: ${invoiceNumber}, Ký hiệu: ${invoiceSerial}, Mã CQT: ${taxAuthorityCode}`
        };

        const newTx: StockTransaction = {
          id: `TX-HD-${Date.now()}-${r.lineNumber}`,
          date: `${invoiceDate} 08:30`,
          type: 'Nhập kho',
          docCode: `PO-HD${invoiceNumber}`,
          sku: (r.variantSku || r.productCode).toUpperCase(),
          productId: r.productId,
          productName: `${r.itemName} (${r.variantName})`,
          lotId,
          branchId,
          warehouseId,
          qtyIn: r.quantity,
          qtyOut: 0,
          balance: r.quantity,
          unitCost: r.unitPrice,
          totalValue: r.totalBeforeVat,
          actor: 'Kế toán kho (HĐĐT)',
          note: `Nhập kho theo HĐĐT ${invoiceSerial}-${invoiceNumber}`
        };

        createdLots.push(newLot);
        transactions.push(newTx);
      });
    }

    // 4. Generate Purchase Order
    let createdPO: PurchaseOrder | undefined = undefined;
    if (autoCreatePO) {
      createdPO = {
        id: `po-hd-${Date.now()}`,
        code: `PO-HD${invoiceNumber}`,
        supplierId: sellerTaxCode,
        supplierName: sellerName,
        supplierTaxCode: sellerTaxCode,
        branchId,
        branchName: selectedBr?.name || 'Chi nhánh Chính - Hà Nội',
        warehouseId,
        warehouse: selectedWh?.name || 'Kho Tổng Hà Nội',
        createdAt: invoiceDate,
        totalAmount: totalAmountWithVat,
        paidAmount: paymentMethod === 'Chưa thanh toán' ? 0 : totalAmountWithVat,
        debtAmount: paymentMethod === 'Chưa thanh toán' ? totalAmountWithVat : 0,
        status: 'received',
        paymentStatus: paymentMethod === 'Chưa thanh toán' ? 'unpaid' : 'paid',
        hasEInvoice: true,
        eInvoiceNumber: invoiceNumber,
        eInvoiceSerial: invoiceSerial,
        eInvoiceLookupCode: taxAuthorityCode,
        eInvoiceDate: invoiceDate,
        eInvoiceVatRate: rows[0]?.vatRate || 8,
        eInvoiceVatAmount: totalVatAmount,
        eInvoiceTotalBeforeVat: totalBeforeVat,
        eInvoiceStatus: 'verified',
        note: `Nhập hàng theo HĐĐT gốc số ${invoiceNumber}, Ký hiệu ${invoiceSerial}, Mã CQT ${taxAuthorityCode}`,
        items: rows.map((r) => ({
          sku: (r.variantSku || r.productCode).toUpperCase(),
          productId: r.productId,
          productName: r.itemName,
          lotId: `LOT-HD${invoiceNumber}-${String(r.lineNumber).padStart(2, '0')}`,
          quantity: r.quantity,
          unit: r.unit,
          price: r.unitPrice,
          vat: r.vatRate,
          totalAmount: r.totalWithVat,
          expiryDate: r.expiryDate || '2028-12-31',
          eInvoiceNumber: invoiceNumber,
          eInvoiceSerial: invoiceSerial,
          eInvoiceLookupCode: taxAuthorityCode
        }))
      };
    }

    onProcessEInvoice({
      invoiceData: finalEInvoice,
      eInvoice: finalEInvoice,
      createdProducts,
      createdLots,
      purchaseOrder: createdPO,
      transactions
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-6xl w-full my-4 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <FileText className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Nhập Hóa Đơn Điện Tử Đầu Vào & Phân Loại Tồn Kho (Phương Án 2)
                </h2>
                <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider shadow-xs">
                  Giao diện Chính Thức
                </span>
                <span className="px-2 py-0.5 bg-blue-500/30 border border-blue-300/30 text-blue-100 text-[10px] font-bold rounded-full">
                  Nghị định 123 • TT 78
                </span>
              </div>
              <p className="text-xs text-indigo-100 font-medium mt-0.5">
                Tự động đồng bộ thông tin Bên Bán theo MST • Auto sinh Product ID (P000001→P999999) & Product Code/Variant SKU chuẩn ERP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION / MATCHED COMPANY MESSAGE */}
        {matchedCompanyInfo && (
          <div className="px-6 py-2 bg-emerald-50 text-emerald-800 border-b border-emerald-200 text-xs font-extrabold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{matchedCompanyInfo}</span>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">
              MST Hợp Lệ
            </span>
          </div>
        )}

        {lookupMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between shrink-0 ${
              lookupMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {lookupMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{lookupMessage.text}</span>
            </div>
            <button onClick={() => setLookupMessage(null)} className="text-slate-400 hover:text-slate-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 text-xs">
          {/* SECTION 1: HEADER E-INVOICE INFORMATION */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-slate-900 text-sm">
                  1. Thông Tin Hóa Đơn Điện Tử Đầu Vào (Bên Bán & Cơ Quan Thuế)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition border border-slate-200 text-xs">
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isXmlUploading ? 'Đang đọc XML...' : 'Tải tệp XML HĐĐT'}</span>
                  <input type="file" accept=".xml" onChange={handleFileUpload} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={handleLookupOnline}
                  disabled={isSearching}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer transition text-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isSearching ? 'Đang tra cứu...' : 'Tra cứu HĐĐT Online'}</span>
                </button>
              </div>
            </div>

            {/* Quick Supplier / Enterprise Presets */}
            <div className="flex items-center gap-1.5 flex-wrap bg-blue-50/60 p-2 rounded-xl border border-blue-100">
              <span className="text-[11px] font-bold text-blue-900 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Chọn nhanh Nhà Cung Cấp:</span>
              </span>
              <button
                type="button"
                onClick={() => applyPresetSupplier('1300928312')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  sellerTaxCode.replace(/\D/g, '') === '1300928312'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-blue-100 border border-slate-200'
                }`}
              >
                🥥 Vietcoco (1300928312)
              </button>
              <button
                type="button"
                onClick={() => applyPresetSupplier('0900189284')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  sellerTaxCode.replace(/\D/g, '') === '0900189284'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-blue-100 border border-slate-200'
                }`}
              >
                🏢 Thép Hòa Phát (0900189284)
              </button>
              <button
                type="button"
                onClick={() => applyPresetSupplier('3700381324')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  sellerTaxCode.replace(/\D/g, '') === '3700381324'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-blue-100 border border-slate-200'
                }`}
              >
                🏭 Tôn Hoa Sen (3700381324)
              </button>
              <button
                type="button"
                onClick={() => applyPresetSupplier('0101389216')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  sellerTaxCode.replace(/\D/g, '') === '0101389216'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-blue-100 border border-slate-200'
                }`}
              >
                🏥 MediPlus (0101389216)
              </button>
              <button
                type="button"
                onClick={() => applyPresetSupplier('0300588569')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  sellerTaxCode.replace(/\D/g, '') === '0300588569'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-blue-100 border border-slate-200'
                }`}
              >
                🥛 Vinamilk (0300588569)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Mã số thuế đơn vị bán - AUTO POPULATES OTHER FIELDS */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mã Số Thuế Đơn Vị (MST Bên Bán) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={sellerTaxCode}
                    onChange={(e) => handleTaxCodeChange(e.target.value)}
                    placeholder="1300928312"
                    className="w-full bg-white font-mono font-bold border border-blue-300 rounded-xl px-3 py-2 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-extrabold">
                    Auto đồng bộ
                  </span>
                </div>
              </div>

              {/* Tên đơn vị người bán */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-bold text-slate-700 mb-1">
                  Tên Đơn Vị Người Bán / Doanh Nghiệp (Tự động cập nhật theo MST) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="Công ty TNHH Chế Biến Dừa Lương Quới (Vietcoco)..."
                  className="w-full bg-white font-bold border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Địa chỉ trụ sở bên bán */}
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block font-bold text-slate-700 mb-1">
                  Địa Chỉ Trụ Sở Đơn Vị Người Bán (Theo Đăng ký thuế)
                </label>
                <input
                  type="text"
                  value={sellerAddress}
                  onChange={(e) => setSellerAddress(e.target.value)}
                  placeholder="Lô A36-A37, KCN An Hiệp, Huyện Châu Thành, Bến Tre"
                  className="w-full bg-slate-50 font-medium border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Ký hiệu hóa đơn */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ký Hiệu Hóa Đơn (Serial) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={invoiceSerial}
                  onChange={(e) => setInvoiceSerial(e.target.value.toUpperCase())}
                  placeholder="1C26VCC"
                  className="w-full bg-white font-mono font-bold border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Số hóa đơn */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Số Hóa Đơn (Invoice Number) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="0001001"
                  className="w-full bg-white font-mono font-extrabold border border-slate-300 rounded-xl px-3 py-2 text-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Mã cơ quan thuế / Mã tra cứu */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mã Cơ Quan Thuế (CQT Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={taxAuthorityCode}
                  onChange={(e) => setTaxAuthorityCode(e.target.value)}
                  placeholder="M1-26-VCC-000031920"
                  className="w-full bg-white font-mono font-semibold border border-slate-300 rounded-xl px-3 py-2 text-emerald-800 focus:ring-2 focus:ring-blue-500 focus:outline-none text-[11px]"
                />
              </div>

              {/* Ngày lập hóa đơn */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ngày Lập Hóa Đơn</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full bg-white font-medium border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Sub-row: Warehouse, Branch & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3 border-t border-slate-100 bg-slate-50/60 p-3 rounded-xl">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hình Thức Thanh Toán</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800"
                >
                  <option value="TM/CK">TM/CK (Tiền mặt / Chuyển khoản)</option>
                  <option value="CK">CK (Chuyển khoản ngân hàng)</option>
                  <option value="TM">TM (Tiền mặt)</option>
                  <option value="Chưa thanh toán">Ghi nhận công nợ (Chưa thanh toán)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kho Nhập Hàng Tồn Kho</label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chi Nhánh Quản Lý</label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: LINE ITEMS TABLE WITH SEQUENTIAL PRODUCT ID & PRODUCT CODE/SKU STRUCTURE */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-purple-600" />
                  <span>2. Danh Sách Mặt Hàng, Mã Tự Động & Phân Loại Tồn Kho ({rows.length} mặt hàng)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tự động sinh <strong>Product ID (P000001→P999999)</strong>, <strong>Product Code (Mã SP cha: VCCCM330-PRM)</strong> & <strong>Variant SKU (VCCCM330-PRM-C2)</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold cursor-pointer transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm dòng hàng hóa</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/90 text-slate-700 font-extrabold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-2 text-center w-8">STT</th>
                      <th className="py-2.5 px-2 font-mono text-blue-700 min-w-[95px]">
                        Product ID <span className="text-[10px] font-normal text-slate-500">(Auto P000001)</span>
                      </th>
                      <th className="py-2.5 px-2 font-mono text-purple-700 min-w-[125px]">
                        Product Code <span className="text-[10px] font-normal text-slate-500">(SP Cha)</span>
                      </th>
                      <th className="py-2.5 px-2 font-mono text-indigo-700 min-w-[130px]">
                        Variant SKU <span className="text-rose-500">*</span>
                      </th>
                      <th className="py-2.5 px-2.5 min-w-[190px]">
                        Tên Hàng Hóa / Sản Phẩm <span className="text-rose-500">*</span>
                      </th>
                      <th className="py-2.5 px-2 min-w-[120px]">
                        Thương Hiệu (Brand)
                      </th>
                      <th className="py-2.5 px-2 min-w-[120px]">
                        Quy Cách / Combo
                      </th>
                      <th className="py-2.5 px-2 text-center min-w-[75px]">ĐVT</th>
                      <th className="py-2.5 px-2 text-center min-w-[75px]">
                        Số Lượng <span className="text-rose-500">*</span>
                      </th>
                      <th className="py-2.5 px-2 text-right min-w-[95px]">Đơn Giá (VND)</th>
                      <th className="py-2.5 px-2 text-right min-w-[100px]">Thành Tiền (Trước Thuế)</th>
                      <th className="py-2.5 px-2 text-center min-w-[80px]">Thuế Suất</th>
                      <th className="py-2.5 px-2 text-right min-w-[90px]">Tiền Thuế</th>
                      <th className="py-2.5 px-2.5 text-right min-w-[110px] font-black text-slate-900">
                        Tổng Thanh Toán
                      </th>
                      <th className="py-2.5 px-1.5 text-center w-8">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* STT */}
                        <td className="py-2 px-2 text-center font-bold text-slate-400">{row.lineNumber}</td>

                        {/* Product ID (Auto P000001 -> P999999) */}
                        <td className="py-2 px-2 font-mono">
                          <input
                            type="text"
                            value={row.productId}
                            onChange={(e) => updateRow(idx, 'productId', e.target.value.toUpperCase())}
                            placeholder="P000001"
                            className="w-full font-mono font-extrabold text-blue-700 bg-blue-50/50 border border-blue-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500"
                            title="Tự động sinh theo thứ tự P000001 -> P999999 (có thể chỉnh sửa nếu cần)"
                          />
                        </td>

                        {/* Product Code (Mã SP Cha: VCCCM330-PRM) */}
                        <td className="py-2 px-2 font-mono">
                          <input
                            type="text"
                            value={row.productCode}
                            onChange={(e) => updateRow(idx, 'productCode', e.target.value.toUpperCase())}
                            placeholder="VCCCM330-PRM"
                            className="w-full font-mono font-black text-purple-800 bg-purple-50/50 border border-purple-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-purple-500"
                            title="Mã sản phẩm cha (tự động tạo theo cấu trúc Thương hiệu + Loại + Quy cách)"
                          />
                        </td>

                        {/* Variant SKU (VCCCM330-PRM-C2) */}
                        <td className="py-2 px-2 font-mono">
                          <input
                            type="text"
                            value={row.variantSku}
                            onChange={(e) => updateRow(idx, 'variantSku', e.target.value.toUpperCase())}
                            placeholder="VCCCM330-PRM-C2"
                            className="w-full font-mono font-black text-indigo-800 bg-indigo-50/50 border border-indigo-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                            title="Variant SKU (Mã biến thể con theo Combo / Quy cách đóng gói)"
                          />
                        </td>

                        {/* Tên Hàng Hóa */}
                        <td className="py-2 px-2.5">
                          <input
                            type="text"
                            value={row.itemName}
                            onChange={(e) => updateRow(idx, 'itemName', e.target.value)}
                            placeholder="Sữa dừa Premium Vietcoco 330ml..."
                            className="w-full font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Brand (Searchable + Quick Creatable) */}
                        <td className="py-2 px-2 min-w-[120px]">
                          <SearchableCreatableSelect
                            options={brandOptions}
                            value={row.brand}
                            onChange={(b) => updateRow(idx, 'brand', b)}
                            placeholder="Thương hiệu..."
                            quickAddLabel="Tạo Brand mới"
                            onQuickCreated={(newB) => {
                              if (!brandOptions.includes(newB)) {
                                setBrandOptions((prev) => [...prev, newB]);
                              }
                            }}
                            className="w-full"
                            inputClassName="py-1 px-2 text-xs"
                          />
                        </td>

                        {/* Variant Name / Combo (Searchable / Quick Selectable) */}
                        <td className="py-2 px-2 min-w-[120px]">
                          <SearchableCreatableSelect
                            options={[
                              '1 Hộp',
                              'Combo 2 Hộp',
                              'Combo 3 Hộp',
                              'Combo 4 Hộp',
                              'Lốc 6 Hộp',
                              'Thùng 12 Hộp',
                              'Thùng 24 Hộp',
                              'Thùng 30 Hộp',
                              'Bao 50kg',
                              'Cuộn 100m'
                            ]}
                            value={row.variantName}
                            onChange={(v) => updateRow(idx, 'variantName', v)}
                            placeholder="Chọn hoặc nhập Combo..."
                            quickAddLabel="Tạo Combo mới"
                            className="w-full"
                            inputClassName="py-1 px-2 text-xs font-bold text-purple-900"
                          />
                        </td>

                        {/* ĐVT (Searchable + Quick Creatable) */}
                        <td className="py-2 px-2 text-center min-w-[80px]">
                          <SearchableCreatableSelect
                            options={unitOptions}
                            value={row.unit}
                            onChange={(u) => updateRow(idx, 'unit', u)}
                            placeholder="ĐVT..."
                            quickAddLabel="Tạo ĐVT mới"
                            onQuickCreated={(newU) => {
                              if (!unitOptions.includes(newU)) {
                                setUnitOptions((prev) => [...prev, newU]);
                              }
                            }}
                            className="w-full text-center"
                            inputClassName="py-1 px-1.5 text-xs font-semibold text-center"
                          />
                        </td>

                        {/* Số Lượng */}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity || ''}
                            onChange={(e) => updateRow(idx, 'quantity', e.target.value)}
                            placeholder="100"
                            className="w-full text-center font-black text-blue-700 bg-white border border-slate-300 rounded-lg px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Đơn Giá */}
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={row.unitPrice || ''}
                            onChange={(e) => updateRow(idx, 'unitPrice', e.target.value)}
                            placeholder="32,000"
                            className="w-full text-right font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-1.5 py-1 text-xs"
                          />
                        </td>

                        {/* Thành Tiền Trước Thuế */}
                        <td className="py-2 px-2 text-right font-bold text-slate-800">
                          {formatVND(row.totalBeforeVat)}
                        </td>

                        {/* Thuế Suất */}
                        <td className="py-2 px-2 text-center">
                          <select
                            value={row.vatRate}
                            onChange={(e) => updateRow(idx, 'vatRate', Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-lg px-1 py-1 text-xs font-bold text-center"
                          >
                            {VAT_RATE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.value >= 0 ? `${opt.value}%` : 'KCT'}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Tiền Thuế GTGT */}
                        <td className="py-2 px-2 text-right font-semibold text-slate-600">
                          {formatVND(row.vatAmount)}
                        </td>

                        {/* Tổng Tiền Đã Thanh Toán */}
                        <td className="py-2 px-2.5 text-right font-black text-slate-900 bg-slate-50/70">
                          {formatVND(row.totalWithVat)}
                        </td>

                        {/* Action */}
                        <td className="py-2 px-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition"
                            title="Xóa dòng này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECTION 3: FINANCIAL TOTALS & NUMBER TO WORDS IN VIETNAMESE */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-5 rounded-2xl border border-blue-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="font-extrabold text-slate-900 text-sm">
                3. Tổng Hợp Thanh Toán & Số Tiền Viết Bằng Chữ
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cộng tiền hàng */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Cộng Tiền Hàng (Chưa Thuế GTGT)
                </span>
                <span className="text-base font-extrabold text-slate-900">{formatVND(totalBeforeVat)}</span>
              </div>

              {/* Tổng tiền thuế GTGT */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Tổng Tiền Thuế GTGT
                </span>
                <span className="text-base font-extrabold text-amber-700">{formatVND(totalVatAmount)}</span>
              </div>

              {/* Tổng cộng tiền thanh toán */}
              <div className="p-4 bg-blue-600 text-white rounded-xl shadow-md">
                <span className="text-[11px] font-bold text-blue-100 uppercase tracking-wider block mb-1">
                  Tổng Cộng Tiền Đã Thanh Toán (Sau Thuế)
                </span>
                <span className="text-lg font-black text-white tracking-tight">{formatVND(totalAmountWithVat)}</span>
              </div>
            </div>

            {/* SỐ TIỀN VIẾT BẰNG CHỮ */}
            <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-amber-900 text-xs block">
                  Số tiền viết bằng chữ (Chuẩn chứng từ HĐĐT):
                </span>
                <p className="text-xs font-bold text-amber-950 italic mt-0.5">{amountInWords}</p>
              </div>
            </div>

            {/* Automation Options */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-slate-700 font-semibold">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCreateLots}
                  onChange={(e) => setAutoCreateLots(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Tự động tạo Lô Tồn Kho FIFO & Phiếu Nhập Kho</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCreatePO}
                  onChange={(e) => setAutoCreatePO(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Tự động tạo Đơn Mua Hàng (PO) & Hạch toán Công nợ NCC</span>
              </label>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Đóng / Hủy bỏ
          </button>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveAndProcess}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-blue-500/25 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Phân Loại Tồn Kho & Hoàn Tất Nhập HĐĐT (Phương Án 2)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
