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
  ArrowRight
} from 'lucide-react';
import {
  Customer,
  InventoryLayer,
  Order,
  PaymentMethod,
  Product,
  StockTransaction,
  CashTransaction,
  SalesChannel
} from '../../types';
import { PosService, PosCartItem } from '../../services/posService';
import { useLanguage } from '../../i18n';

interface PosQuickSaleViewProps {
  products: Product[];
  customers: Customer[];
  inventoryLots: InventoryLayer[];
  branches?: any[];
  warehouses?: any[];
  currentUser?: any;
  onCompleteSale: (
    newOrder: Order,
    updatedLayers?: InventoryLayer[],
    transactions?: StockTransaction[],
    cashTx?: CashTransaction
  ) => void;
  onOpenVietQr: (order: Order) => void;
  onQuickAddCustomer?: (customer: Customer) => void;
  tenantId?: string;
  actorName?: string;
}

export const PosQuickSaleView: React.FC<PosQuickSaleViewProps> = ({
  products = [],
  customers = [],
  inventoryLots = [],
  branches = [],
  warehouses = [],
  currentUser,
  onCompleteSale,
  onOpenVietQr,
  onQuickAddCustomer,
  tenantId = currentUser?.tenant || 'TENANT-DEFAULT',
  actorName = currentUser?.name || 'Thu ngân / Barista'
}) => {
  const { t, language } = useLanguage();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [tableOrArea, setTableOrArea] = useState<string>('Bàn 01');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vietqr');
  const [salesChannel, setSalesChannel] = useState<SalesChannel>('POS');
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [orderNote, setOrderNote] = useState<string>('');
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Derive categories dynamically from Product Master via PosService
  const categories = useMemo(() => {
    return PosService.extractCategories(products);
  }, [products]);

  // Fast search helper: includes abbreviation acronyms (e.g. "cfs" -> "Cà phê sữa")
  const getAcronym = (text: string) => {
    return text
      .toLowerCase()
      .split(/[\s-_]+/)
      .map((w) => w[0] || '')
      .join('');
  };

  const filteredProducts = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();

    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const pCat = p.category?.trim() || (p.isCombo || p.type === 'COMBO' ? 'Combo' : 'Khác');
        if (pCat.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }

      if (!cleanQuery) return true;

      const nameMatch = p.name.toLowerCase().includes(cleanQuery);
      const skuMatch = p.sku.toLowerCase().includes(cleanQuery);
      const codeMatch = p.code?.toLowerCase().includes(cleanQuery) || false;
      const barcodeMatch = p.barcode?.toLowerCase().includes(cleanQuery) || false;
      const acronymMatch = getAcronym(p.name).includes(cleanQuery);

      return nameMatch || skuMatch || codeMatch || barcodeMatch || acronymMatch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (product: Product) => {
    // Resolve price from temporal versioning if available
    const resolved = PosService.resolveCurrentPrice(tenantId, product.sku, salesChannel);
    const effectivePrice = resolved.isVersionResolved && resolved.price > 0
      ? resolved.price
      : product.sellingPrice || product.costPrice || 0;

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id || item.product.sku === product.sku);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: effectivePrice,
          priceVersionId: resolved.priceVersionId
        }
      ];
    });
  };

  const updateQuantity = (sku: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.sku === sku) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is PosCartItem => item !== null)
    );
  };

  const setItemQuantity = (sku: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(sku);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.sku === sku ? { ...item, quantity: qty } : item))
    );
  };

  const removeFromCart = (sku: string) => {
    setCart((prev) => prev.filter((item) => item.product.sku !== sku));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setOrderNote('');
  };

  // Financial Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return Math.round((subtotal * Math.min(100, Math.max(0, discountValue))) / 100);
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [subtotal, discountType, discountValue]);

  const finalTotal = Math.max(0, subtotal - discountAmount);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || {
      id: 'WALK_IN',
      name: language === 'vi' ? 'Khách lẻ' : 'Walk-in Customer',
      phone: ''
    };
  }, [customers, selectedCustomerId, language]);

  // Handle Checkout via PosService orchestration
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert(language === 'vi' ? 'Giỏ hàng đang trống!' : 'Cart is empty!');
      return;
    }

    const res = PosService.executeSale({
      tenantId,
      branchId: branches[0]?.id || 'BR01',
      branchName: branches[0]?.name || 'Chi nhánh Chính',
      warehouseId: warehouses[0]?.id || 'WH01',
      warehouseName: warehouses[0]?.name || 'Kho Tổng',
      channel: salesChannel,
      tableOrArea,
      customerId: selectedCustomer.id !== 'WALK_IN' ? selectedCustomer.id : undefined,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      items: cart,
      discountAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'credit' ? 'unpaid' : 'paid',
      actorName,
      currentUser,
      note: orderNote,
      existingLayers: inventoryLots,
      existingCustomers: customers,
      products
    });

    if (!res.success || !res.order) {
      alert(res.errorMessage || 'Lỗi xử lý đơn bán hàng POS');
      return;
    }

    // Notify parent
    onCompleteSale(res.order, res.updatedLayers, res.generatedStockTransactions, res.cashTransaction);
    setLastCompletedOrder(res.order);

    // If VietQR, trigger QR preview
    if (paymentMethod === 'vietqr') {
      onOpenVietQr(res.order);
    }

    // Reset cart
    clearCart();
  };

  // Keyboard shortcuts (F2: focus search, F9: checkout)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          handleCheckout();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, tableOrArea, selectedCustomer, paymentMethod, salesChannel, discountAmount, orderNote]);

  // Quick Customer Creation
  const handleCreateCustomer = () => {
    if (!newCustomerName.trim()) return;
    const newCust: Customer = {
      id: `CUST-${Date.now()}`,
      code: `KH-${Date.now().toString().slice(-4)}`,
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      email: '',
      address: '',
      group: 'Cá nhân',
      totalSpent: 0,
      debt: 0,
      lastPurchaseDate: new Date().toISOString().substring(0, 10),
      createdAt: new Date().toISOString()
    };

    if (onQuickAddCustomer) {
      onQuickAddCustomer(newCust);
    }
    setSelectedCustomerId(newCust.id);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setIsQuickCustomerModalOpen(false);
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div id="pos-quick-sale-container" className="h-[calc(100vh-64px)] flex flex-col bg-slate-100/70 overflow-hidden select-none">
      {/* Top POS Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            POS
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              {language === 'vi' ? 'Bán Nhanh & Thu Ngân' : 'Quick Sale & POS'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              {actorName} • {salesChannel}
            </p>
          </div>
        </div>

        {/* Channel & Table Selector */}
        <div className="flex items-center gap-2">
          {/* Table / Area */}
          <select
            value={tableOrArea}
            onChange={(e) => setTableOrArea(e.target.value)}
            className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="Bàn 01">Bàn 01 (Tầng 1)</option>
            <option value="Bàn 02">Bàn 02 (Tầng 1)</option>
            <option value="Bàn 03">Bàn 03 (Tầng 1)</option>
            <option value="Bàn 04">Bàn 04 (Tầng 1)</option>
            <option value="Bàn 05">Bàn 05 (Tầng 2)</option>
            <option value="Bàn 06">Bàn 06 (Tầng 2)</option>
            <option value="Mang đi">Mang đi (Takeaway)</option>
            <option value="Giao hàng">Giao hàng (Delivery)</option>
          </select>

          {/* Channel Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            {(['POS', 'TAKE_AWAY', 'GRABFOOD', 'SHOPEEFOOD'] as SalesChannel[]).map((ch) => (
              <button
                key={ch}
                onClick={() => setSalesChannel(ch)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  salesChannel === ch
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Product Master Catalog & Search (65% width) */}
        <div className="flex-1 flex flex-col bg-slate-50/50 border-r border-slate-200 p-3.5 space-y-3 overflow-hidden">
          {/* Search Bar & Fast Acronym Match */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'vi'
                    ? 'Tìm món, SKU, Barcode, Tên viết tắt (ví dụ: "cfs" -> Cà phê sữa)... [F2]'
                    : 'Search product, SKU, Barcode, Acronym (e.g. "cfs")... [F2]'
                }
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar shrink-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid (Fast Card View) */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <Package className="w-10 h-10 mb-2 stroke-[1.5] text-slate-300" />
                <p className="text-xs font-medium">
                  {language === 'vi' ? 'Không tìm thấy sản phẩm phù hợp' : 'No products found'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {language === 'vi' ? 'Thử tìm theo tên, mã SKU hoặc viết tắt' : 'Try searching by SKU, name or acronym'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {filteredProducts.map((p) => {
                  const resolved = PosService.resolveCurrentPrice(tenantId, p.sku, salesChannel);
                  const price = resolved.isVersionResolved && resolved.price > 0
                    ? resolved.price
                    : p.sellingPrice || p.costPrice || 0;
                  const inCartItem = cart.find((i) => i.product.sku === p.sku);

                  return (
                    <button
                      key={p.id || p.sku}
                      onClick={() => addToCart(p)}
                      className={`group relative text-left bg-white p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-sm active:scale-[0.98] min-h-[96px] ${
                        inCartItem
                          ? 'border-blue-600 ring-1 ring-blue-600/30'
                          : 'border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      {/* Top info */}
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[10px] font-mono text-slate-400 font-semibold truncate max-w-[80px]">
                            {p.sku}
                          </span>
                          {p.category && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium truncate max-w-[70px]">
                              {p.category}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-2 leading-snug group-hover:text-blue-600">
                          {p.name}
                        </h4>
                      </div>

                      {/* Bottom info */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">
                          {formatVND(price)}
                        </span>
                        {inCartItem ? (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                            {inCartItem.quantity}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600">
                            + {p.unit || 'Ly'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Order / Cart (35% width, max 420px) */}
        <div className="w-full sm:w-[380px] lg:w-[420px] bg-white flex flex-col justify-between shrink-0 shadow-lg border-l border-slate-200">
          {/* Cart Header & Customer Selector */}
          <div className="p-3.5 border-b border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {language === 'vi' ? 'Đơn Hàng Hiện Tại' : 'Current Order'}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded-full">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                >
                  {language === 'vi' ? 'Xóa giỏ' : 'Clear'}
                </button>
              )}
            </div>

            {/* Customer Selector */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="WALK_IN">
                    {language === 'vi' ? 'Khách lẻ (Walk-in)' : 'Walk-in Customer'}
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setIsQuickCustomerModalOpen(true)}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                title={language === 'vi' ? 'Thêm khách hàng nhanh' : 'Quick add customer'}
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingCart className="w-8 h-8 mb-2 stroke-[1.5] text-slate-300" />
                <p className="text-xs font-semibold text-slate-500">
                  {language === 'vi' ? 'Chưa có món nào trong giỏ' : 'Cart is empty'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {language === 'vi' ? 'Chọn món từ danh mục bên trái' : 'Select items from menu on the left'}
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.sku}
                  className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">
                      {item.product.name}
                    </h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-semibold text-slate-600">
                        {formatVND(item.unitPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.product.sku}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.product.sku, -1)}
                      className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => setItemQuantity(item.product.sku, parseInt(e.target.value) || 0)}
                      className="w-8 text-center text-xs font-bold text-slate-900 focus:outline-none"
                    />
                    <button
                      onClick={() => updateQuantity(item.product.sku, 1)}
                      className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Item Subtotal & Delete */}
                  <div className="text-right pl-1">
                    <p className="text-xs font-extrabold text-slate-900 whitespace-nowrap">
                      {formatVND(item.quantity * item.unitPrice)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.product.sku)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-0.5 mt-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer & Checkout Controls */}
          <div className="p-3.5 border-t border-slate-200 bg-slate-50/50 space-y-3 shrink-0">
            {/* Discount & Note Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{language === 'vi' ? 'Tạm tính' : 'Subtotal'}</span>
                <span className="font-bold text-slate-900">{formatVND(subtotal)}</span>
              </div>

              {/* Discount Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-600">
                    {language === 'vi' ? 'Giảm giá' : 'Discount'}
                  </span>
                  <button
                    onClick={() => setDiscountType(discountType === 'fixed' ? 'percent' : 'fixed')}
                    className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
                  >
                    {discountType === 'fixed' ? 'đ' : '%'}
                  </button>
                </div>
                <input
                  type="number"
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className="w-24 text-right px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Total Row */}
              <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase">
                  {language === 'vi' ? 'THANH TOÁN' : 'TOTAL DUE'}
                </span>
                <span className="text-lg font-black text-blue-600">
                  {formatVND(finalTotal)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[
                { id: 'vietqr', label: 'VietQR', icon: QrCode },
                { id: 'cash', label: language === 'vi' ? 'Tiền mặt' : 'Cash', icon: Banknote },
                { id: 'bank_transfer', label: language === 'vi' ? 'Chuyển khoản' : 'Bank', icon: CreditCard }
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                      paymentMethod === m.id
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Big Complete Sale Button */}
            <button
              id="btn-pos-complete-sale"
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 text-white transition-all shadow-md cursor-pointer ${
                cart.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 active:scale-[0.99]'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              <span>{language === 'vi' ? 'HOÀN TẤT ĐƠN' : 'COMPLETE ORDER'}</span>
              <span>•</span>
              <span>{formatVND(finalTotal)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {isQuickCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'vi' ? 'Thêm Khách Hàng Nhanh' : 'Quick Add Customer'}
              </h3>
              <button
                onClick={() => setIsQuickCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {language === 'vi' ? 'Họ và tên *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder={language === 'vi' ? 'VD: Anh Nam' : 'e.g. John Doe'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {language === 'vi' ? 'Số điện thoại' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="0901234567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsQuickCustomerModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateCustomer}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                {language === 'vi' ? 'Lưu' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
