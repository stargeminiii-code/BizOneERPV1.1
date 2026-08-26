import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  QrCode,
  CreditCard,
  Banknote,
  Receipt,
  CheckCircle2,
  Package,
  User,
  Barcode,
  Layers,
  Clock,
  TrendingUp,
  AlertCircle,
  X,
  UserPlus,
  Percent,
  DollarSign,
  Coffee,
  Sparkles,
  ArrowRight,
  Printer,
  Globe,
  Tag,
  Share2,
  Calendar,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import {
  Customer,
  InventoryLayer,
  Order,
  PaymentMethod,
  Product,
  StockTransaction,
  CashTransaction,
  SalesChannel,
  Branch,
  Warehouse,
  UserAccount,
  SalesReturn
} from '../types';
import { PosService, PosCartItem } from '../services/posService';
import { useLanguage } from '../i18n';

interface OrdersViewProps {
  orders: Order[];
  products?: Product[];
  inventoryLots?: InventoryLayer[];
  customers?: Customer[];
  branches?: Branch[];
  warehouses?: Warehouse[];
  salesReturns?: SalesReturn[];
  currentUser?: UserAccount;
  initialTab?: string;
  onOpenCreateOrder?: () => void;
  onSelectOrder?: (order: Order) => void;
  onOpenVietQr?: (order: Order) => void;
  onCompleteSale?: (
    order: Order,
    updatedLayers?: InventoryLayer[],
    transactions?: StockTransaction[],
    cashTx?: CashTransaction
  ) => void;
  onProcessReturn?: (ret: SalesReturn) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders = [],
  products = [],
  inventoryLots = [],
  customers = [],
  branches = [],
  warehouses = [],
  currentUser,
  onSelectOrder,
  onOpenVietQr,
  onCompleteSale
}) => {
  const { t, language } = useLanguage();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Tenant / Actor
  const tenantId = currentUser?.tenant || 'TENANT-DEFAULT';
  const actorName = currentUser?.name || 'Thu ngân / Sales';

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<'all' | 'fb' | 'commercial'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart & Order State
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState<string>('Khách vãng lai / Khách sàn');
  const [customCustomerPhone, setCustomCustomerPhone] = useState<string>(''); // NOT MANDATORY
  const [tableOrArea, setTableOrArea] = useState<string>('Bàn 01');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vietqr');
  const [salesChannel, setSalesChannel] = useState<SalesChannel>('POS');
  
  // Marketplace Specific Fields
  const [marketplaceOrderId, setMarketplaceOrderId] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');

  // Warehouse / Branch
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || 'BR01');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || 'WH01');

  // Discount & Note
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [orderNote, setOrderNote] = useState<string>('');

  // Modals & Recipe Customization
  const [customizingItem, setCustomizingItem] = useState<{
    product: Product;
    options: {
      size: string;
      sugar: string;
      ice: string;
      toppings: string[];
      notes: string;
    };
  } | null>(null);
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  // Auto focus search
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Update marketplace order prefix when channel changes
  useEffect(() => {
    if (['SHOPEE', 'TIKTOK', 'LAZADA', 'TIKI', 'GRABFOOD'].includes(salesChannel)) {
      if (!marketplaceOrderId) {
        const randNum = Math.floor(1000 + Math.random() * 9000);
        setMarketplaceOrderId(`${salesChannel}-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}-${randNum}`);
      }
    }
  }, [salesChannel]);

  // Categories extracted from products
  const categories = useMemo(() => {
    return PosService.extractCategories(products);
  }, [products]);

  // Acronym helper (e.g., 'cfs' -> 'Cà phê sữa')
  const getAcronym = (text: string) => {
    return text
      .toLowerCase()
      .split(/[\s-_]+/)
      .map((w) => w[0] || '')
      .join('');
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();

    return products.filter((p) => {
      // Industry Filter
      if (selectedIndustry === 'fb' && !(p.hasBom || p.productType === 'RECIPE' || p.category?.toLowerCase().includes('f&b') || p.category?.toLowerCase().includes('uống'))) {
        return false;
      }
      if (selectedIndustry === 'commercial' && (p.hasBom || p.productType === 'RECIPE' || p.category?.toLowerCase().includes('f&b') || p.category?.toLowerCase().includes('uống'))) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const pCat = p.category?.trim() || (p.isCombo || p.type === 'COMBO' ? 'Combo' : 'Khác');
        if (pCat.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }

      if (!cleanQuery) return true;

      const nameMatch = p.name.toLowerCase().includes(cleanQuery);
      const skuMatch = p.sku?.toLowerCase().includes(cleanQuery) || false;
      const variantSkuMatch = p.variantSku?.toLowerCase().includes(cleanQuery) || false;
      const codeMatch = p.code?.toLowerCase().includes(cleanQuery) || false;
      const barcodeMatch = p.barcode?.toLowerCase().includes(cleanQuery) || false;
      const acronymMatch = getAcronym(p.name).includes(cleanQuery);

      return nameMatch || skuMatch || variantSkuMatch || codeMatch || barcodeMatch || acronymMatch;
    });
  }, [products, selectedCategory, selectedIndustry, searchQuery]);

  // Add product to cart
  const handleAddToCart = (product: Product, customOptions?: any) => {
    // If it's a beverage with BOM and not yet customized, open customizer modal if desired, or add with default
    const isBom = Boolean(product.hasBom || product.productType === 'BEVERAGE' || product.category?.toLowerCase().includes('f&b'));

    // Resolve price from temporal versioning if available
    const resolved = PosService.resolveCurrentPrice(tenantId, product.sku, salesChannel);
    let effectivePrice = resolved.isVersionResolved && resolved.price > 0
      ? resolved.price
      : product.sellingPrice || product.costPrice || 0;

    if (customOptions?.size === 'Size L (+10k)') {
      effectivePrice += 10000;
    }
    if (customOptions?.toppings?.length) {
      effectivePrice += customOptions.toppings.length * 5000;
    }

    setCart((prev) => {
      const optionKey = customOptions ? JSON.stringify(customOptions) : 'default';
      const idx = prev.findIndex(
        (item) => (item.product.id === product.id || item.product.sku === product.sku) && (item.notes === optionKey || !customOptions)
      );

      if (idx >= 0 && !customOptions) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }

      const noteText = customOptions
        ? `[${customOptions.size || 'M'}, ${customOptions.sugar || '100% đường'}, ${customOptions.ice || '100% đá'}${customOptions.toppings?.length ? ', ' + customOptions.toppings.join('+') : ''}${customOptions.notes ? ' - ' + customOptions.notes : ''}]`
        : '';

      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: effectivePrice,
          resolvedPriceVersionId: resolved.priceVersionId,
          isPriceResolved: resolved.isVersionResolved,
          isBomItem: isBom,
          notes: noteText,
          sku: product.sku || product.variantSku || product.code
        }
      ];
    });
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setOrderNote('');
  };

  // Financial calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return Math.round((subtotal * Math.min(Math.max(discountValue, 0), 100)) / 100);
    }
    return Math.min(Math.max(discountValue, 0), subtotal);
  }, [subtotal, discountType, discountValue]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  // Selected customer object
  const activeCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const finalCustomerName = activeCustomer ? activeCustomer.name : (customCustomerName || 'Khách vãng lai');
  const finalCustomerPhone = activeCustomer ? activeCustomer.phone : (customCustomerPhone || '');

  // Checkout execution via PosService & Order Engine
  const handleExecuteCheckout = () => {
    if (cart.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm vào đơn hàng');
      return;
    }

    const posItems = cart.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      priceVersionId: item.resolvedPriceVersionId,
      note: item.notes
    }));

    const noteDetails = [
      orderNote,
      marketplaceOrderId ? `Mã sàn: ${marketplaceOrderId}` : '',
      trackingNumber ? `Vận đơn: ${trackingNumber}` : ''
    ].filter(Boolean).join(' | ');

    const saleResult = PosService.executeSale({
      tenantId,
      branchId: selectedBranchId,
      warehouseId: selectedWarehouseId,
      channel: salesChannel,
      tableOrArea: salesChannel === 'POS' ? tableOrArea : undefined,
      customerId: selectedCustomerId || undefined,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone || undefined, // NOT mandatory
      items: posItems,
      discountAmount,
      paymentMethod,
      actorName,
      existingLayers: inventoryLots,
      existingCustomers: customers,
      products,
      note: noteDetails
    });

    if (!saleResult.success || !saleResult.order) {
      alert(`Không thể hoàn tất đơn hàng: ${saleResult.errorMessage || 'Lỗi xử lý đơn'}`);
      return;
    }

    // Call upstream complete sale
    if (onCompleteSale) {
      onCompleteSale(
        saleResult.order,
        saleResult.updatedLayers,
        saleResult.generatedStockTransactions,
        saleResult.cashTransaction
      );
    }

    // Save last completed order for modal feedback
    setLastCompletedOrder(saleResult.order);

    // If VietQR, trigger VietQR popup immediately
    if (paymentMethod === 'vietqr' && onOpenVietQr) {
      onOpenVietQr(saleResult.order);
    }

    // Reset cart
    handleClearCart();
    setMarketplaceOrderId('');
    setTrackingNumber('');
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div id="sales-pos-workspace" className="p-2 sm:p-4 max-w-[1680px] mx-auto space-y-3">
      {/* Top Station Status & Channel Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">Bán hàng & POS Đa kênh</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                FIFO & Temporal Engine Sẵn sàng
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Điểm bán hàng thống nhất F&B và Sản phẩm thương mại • Quản lý đa kênh POS, Shopee, TikTok, Lazada
            </p>
          </div>
        </div>

        {/* Branch & Warehouse Selector */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              {branches.length > 0 ? (
                branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))
              ) : (
                <option value="BR01">Chi nhánh Hà Nội</option>
              )}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              {warehouses.length > 0 ? (
                warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))
              ) : (
                <option value="WH01">Kho Tổng Hà Nội</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Product Catalog (60%) | Right Order Station (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* LEFT COLUMN: Product Catalog & Fast Filter (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-3">
          {/* Search & Industry Selector */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  id="input-pos-product-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên, SKU (vd: VCCCM330-PRM-C2), mã vạch, viết tắt (cfs)..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Industry Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 text-xs">
                <button
                  onClick={() => setSelectedIndustry('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    selectedIndustry === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({products.length})
                </button>
                <button
                  onClick={() => setSelectedIndustry('fb')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    selectedIndustry === 'fb'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Coffee className="w-3 h-3" />
                  <span>F&B / Pha chế</span>
                </button>
                <button
                  onClick={() => setSelectedIndustry('commercial')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    selectedIndustry === 'commercial'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-3 h-3" />
                  <span>Thương mại / SKU</span>
                </button>
              </div>
            </div>

            {/* Category Scroll Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả nhóm
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory.toLowerCase() === cat.name.toLowerCase()
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">Không tìm thấy sản phẩm nào phù hợp với từ khóa</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isBom = product.hasBom || product.productType === 'RECIPE' || product.category?.toLowerCase().includes('f&b');
                const price = product.sellingPrice || product.costPrice || 0;
                const skuCode = product.sku || product.variantSku || product.code;

                return (
                  <div
                    key={product.id}
                    className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 hover:shadow-xs transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider line-clamp-1">
                          {product.category || 'Hàng hóa'}
                        </span>
                        {isBom && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                            <Coffee className="w-2.5 h-2.5" />
                            <span>BOM</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition">
                        {product.name}
                      </h3>

                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-mono text-[10px] text-slate-400">{skuCode}</span>
                        <span>{product.unit || 'cái'}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div className="font-bold text-blue-600 text-xs sm:text-sm">
                        {formatVND(price)}
                      </div>

                      <div className="flex items-center gap-1">
                        {isBom ? (
                          <button
                            onClick={() =>
                              setCustomizingItem({
                                product,
                                options: {
                                  size: 'Size M (500ml)',
                                  sugar: '100% Đường',
                                  ice: '100% Đá',
                                  toppings: [],
                                  notes: ''
                                }
                              })
                            }
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-[11px] transition cursor-pointer"
                            title="Tùy chỉnh pha chế"
                          >
                            Chọn
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition shadow-2xs cursor-pointer"
                          title="Thêm nhanh vào đơn"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Order Setup, Cart & Checkout Engine (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
            {/* Sales Channel Selector Bar */}
            <div className="p-3 bg-slate-50/80 border-b border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Nguồn đơn hàng / Kênh bán
                </span>
                <span className="text-[11px] font-semibold text-blue-600">
                  {salesChannel === 'POS' ? 'Tại quầy POS' : salesChannel}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 text-[11px]">
                {[
                  { id: 'POS', label: 'Tại quầy' },
                  { id: 'TAKE_AWAY', label: 'Mang đi' },
                  { id: 'SHOPEE', label: 'Shopee' },
                  { id: 'TIKTOK', label: 'TikTok' },
                  { id: 'LAZADA', label: 'Lazada' },
                  { id: 'TIKI', label: 'Tiki' },
                  { id: 'FACEBOOK', label: 'Facebook' },
                  { id: 'GRABFOOD', label: 'GrabFood' },
                  { id: 'DIRECT', label: 'Trực tiếp' }
                ].map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSalesChannel(ch.id as SalesChannel)}
                    className={`py-1.5 px-1 text-center rounded-lg font-bold transition cursor-pointer ${
                      salesChannel === ch.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>

              {/* Dedicated Marketplace Fields (When Shopee, TikTok, Lazada, Tiki, GrabFood selected) */}
              {['SHOPEE', 'TIKTOK', 'LAZADA', 'TIKI', 'GRABFOOD'].includes(salesChannel) && (
                <div className="mt-2 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      Thông tin đơn sàn TMĐT ({salesChannel})
                    </span>
                    <span className="text-[10px] text-blue-600 font-medium">Auto-mapping SKU</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 mb-0.5 block">
                        Mã đơn trên sàn (Marketplace ID)
                      </label>
                      <input
                        type="text"
                        value={marketplaceOrderId}
                        onChange={(e) => setMarketplaceOrderId(e.target.value)}
                        placeholder={`VD: ${salesChannel}-2026-8899`}
                        className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-mono font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 mb-0.5 block">
                        Mã vận đơn (Tracking ID / AWB)
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="VD: SPX-VN-992102"
                        className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customer & Table Setup */}
            <div className="p-3 border-b border-slate-200/80 space-y-2 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                    Khách hàng
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => {
                        setSelectedCustomerId(e.target.value);
                        if (!e.target.value) {
                          setCustomCustomerName('Khách vãng lai / Khách sàn');
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Khách vãng lai / Khách sàn</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setIsQuickCustomerModalOpen(true)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg shrink-0 cursor-pointer"
                      title="Thêm khách hàng nhanh"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                    {salesChannel === 'POS' ? 'Bàn / Khu vực' : 'SĐT liên hệ (Không bắt buộc)'}
                  </label>
                  {salesChannel === 'POS' ? (
                    <input
                      type="text"
                      value={tableOrArea}
                      onChange={(e) => setTableOrArea(e.target.value)}
                      placeholder="Bàn 01 / Mang đi / Quầy bar"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={customCustomerPhone}
                      onChange={(e) => setCustomCustomerPhone(e.target.value)}
                      placeholder="SĐT người nhận (Tùy chọn)"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="p-3 flex-1 min-h-[220px] max-h-[300px] overflow-y-auto divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ShoppingCart className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs">Chưa có sản phẩm nào trong đơn hàng</p>
                  <p className="text-[11px] text-slate-400">Chọn sản phẩm từ danh mục bên trái</p>
                </div>
              ) : (
                cart.map((item, idx) => {
                  const skuDisplay = item.sku || item.product.sku || item.product.variantSku || item.product.code;
                  return (
                    <div key={idx} className="py-2.5 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{item.product.name}</span>
                          {item.isBomItem && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              BOM
                            </span>
                          )}
                        </div>

                        {/* SKU Tag for Marketplace & Inventory Tracking */}
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                          <span className="font-mono bg-slate-100 px-1 rounded text-slate-600">
                            SKU: {skuDisplay}
                          </span>
                          <span>{formatVND(item.unitPrice)}</span>
                        </div>

                        {item.notes && (
                          <div className="text-[10px] text-purple-700 italic mt-0.5">
                            {item.notes}
                          </div>
                        )}
                      </div>

                      {/* Quantity Controls & Subtotal */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            onClick={() => handleUpdateQuantity(idx, -1)}
                            className="px-1.5 py-1 text-slate-600 hover:bg-slate-200 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 py-0.5 text-xs font-bold text-slate-900 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(idx, 1)}
                            className="px-1.5 py-1 text-slate-600 hover:bg-slate-200 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right font-bold text-xs text-slate-900 min-w-[70px]">
                          {formatVND(item.unitPrice * item.quantity)}
                        </div>

                        <button
                          onClick={() => handleRemoveFromCart(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Discount, Note & Summary Footer */}
            <div className="p-3 bg-slate-50/90 border-t border-slate-200 space-y-2.5">
              {/* Discount and Note Input */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                    <span>Chiết khấu</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDiscountType('fixed')}
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          discountType === 'fixed' ? 'bg-blue-600 text-white' : 'text-slate-500'
                        }`}
                      >
                        VNĐ
                      </button>
                      <button
                        onClick={() => setDiscountType('percent')}
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          discountType === 'percent' ? 'bg-blue-600 text-white' : 'text-slate-500'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    placeholder={discountType === 'fixed' ? 'Số tiền giảm' : '% giảm'}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 mb-1 block">
                    Ghi chú đơn
                  </label>
                  <input
                    type="text"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Giao nhanh, ít ngọt..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Price Calculation Row */}
              <div className="space-y-1 pt-1 text-xs border-t border-slate-200/80">
                <div className="flex justify-between text-slate-500">
                  <span>Tổng tiền hàng ({cart.reduce((s, i) => s + i.quantity, 0)} món):</span>
                  <span className="font-semibold text-slate-800">{formatVND(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Chiết khấu:</span>
                    <span className="font-semibold">-{formatVND(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm sm:text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Khách cần trả:</span>
                  <span className="text-blue-600">{formatVND(totalAmount)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-4 gap-1 text-[11px] pt-1">
                <button
                  onClick={() => setPaymentMethod('vietqr')}
                  className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    paymentMethod === 'vietqr'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>VietQR</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Tiền mặt</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Chuyển khoản</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('credit')}
                  className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    paymentMethod === 'credit'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Công nợ</span>
                </button>
              </div>

              {/* Complete Sale Action Button */}
              <button
                id="btn-pos-complete-sale"
                onClick={handleExecuteCheckout}
                disabled={cart.length === 0}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer ${
                  cart.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Hoàn tất & Xuất kho ({formatVND(totalAmount)})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Customizer Modal for F&B items */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{customizingItem.product.name}</h3>
                <p className="text-[11px] text-purple-700 font-semibold">Tùy chỉnh định mức pha chế & BOM</p>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Size */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Kích cỡ (Size)</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Size M (500ml)', 'Size L (+10k)'].map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        setCustomizingItem({
                          ...customizingItem,
                          options: { ...customizingItem.options, size: s }
                        })
                      }
                      className={`py-2 px-3 rounded-xl border text-center font-bold transition cursor-pointer ${
                        customizingItem.options.size === s
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Đường */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lượng đường</label>
                <div className="grid grid-cols-4 gap-1">
                  {['100% Đường', '70% Đường', '50% Đường', '0% Không đường'].map((sug) => (
                    <button
                      key={sug}
                      onClick={() =>
                        setCustomizingItem({
                          ...customizingItem,
                          options: { ...customizingItem.options, sugar: sug }
                        })
                      }
                      className={`py-1.5 px-1 rounded-lg border text-[11px] text-center font-semibold transition cursor-pointer ${
                        customizingItem.options.sugar === sug
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {sug.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Đá */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lượng đá</label>
                <div className="grid grid-cols-4 gap-1">
                  {['100% Đá', '70% Đá', '50% Đá', 'Nóng (Hot)'].map((ice) => (
                    <button
                      key={ice}
                      onClick={() =>
                        setCustomizingItem({
                          ...customizingItem,
                          options: { ...customizingItem.options, ice }
                        })
                      }
                      className={`py-1.5 px-1 rounded-lg border text-[11px] text-center font-semibold transition cursor-pointer ${
                        customizingItem.options.ice === ice
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {ice.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú pha chế</label>
                <input
                  type="text"
                  value={customizingItem.options.notes}
                  onChange={(e) =>
                    setCustomizingItem({
                      ...customizingItem,
                      options: { ...customizingItem.options, notes: e.target.value }
                    })
                  }
                  placeholder="VD: Nhiều kem muối, ít béo..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setCustomizingItem(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  handleAddToCart(customizingItem.product, customizingItem.options);
                  setCustomizingItem(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Xác nhận thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Customer Create Modal */}
      {isQuickCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Thêm nhanh khách hàng</h3>
              <button
                onClick={() => setIsQuickCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên khách hàng</label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="VD: Anh Tuấn (Shopee / Grab)"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Số điện thoại <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
                </label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="0912..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsQuickCustomerModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  if (!newCustomerName.trim()) {
                    alert('Vui lòng nhập tên khách hàng');
                    return;
                  }
                  setCustomCustomerName(newCustomerName);
                  setCustomCustomerPhone(newCustomerPhone);
                  setSelectedCustomerId('');
                  setIsQuickCustomerModalOpen(false);
                  setNewCustomerName('');
                  setNewCustomerPhone('');
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Lưu & Chọn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Last Completed Order Feedback Modal */}
      {lastCompletedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 space-y-4 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Giao dịch thành công!</h3>
              <p className="text-xs text-slate-500">
                Đơn hàng <span className="font-bold text-blue-600">{lastCompletedOrder.code}</span> đã được ghi nhận vào sổ cái và trừ kho FIFO.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-bold text-slate-800">{lastCompletedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kênh bán:</span>
                <span className="font-bold text-blue-600">{lastCompletedOrder.channel || 'POS'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng thanh toán:</span>
                <span className="font-bold text-emerald-700">{formatVND(lastCompletedOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phương thức:</span>
                <span className="font-bold uppercase text-slate-800">{lastCompletedOrder.paymentMethod}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  if (onOpenVietQr && lastCompletedOrder.paymentMethod === 'vietqr') {
                    onOpenVietQr(lastCompletedOrder);
                  }
                  setLastCompletedOrder(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Tạo đơn tiếp theo
              </button>

              <button
                onClick={() => {
                  if (onSelectOrder) onSelectOrder(lastCompletedOrder);
                  setLastCompletedOrder(null);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Xem chi tiết đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
