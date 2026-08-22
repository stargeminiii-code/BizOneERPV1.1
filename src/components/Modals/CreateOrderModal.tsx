import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  ShoppingBag,
  CheckCircle,
  Clock,
  Search,
  User,
  Package,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  DollarSign,
  Boxes,
  Phone,
  MapPin,
  CreditCard,
  Building2
} from 'lucide-react';
import {
  Customer,
  InventoryLayer,
  Order,
  OrderItem,
  PaymentMethod,
  Product,
  Supplier,
  Warehouse,
  Branch
} from '../../types';
import { ProductSearchCombobox, FlatProductItem } from '../ProductSearchCombobox';
import { QuickAddCustomerModal } from './QuickAddCustomerModal';
import { QuickAddProductModal } from './QuickAddProductModal';
import { ProductCatalogPickerModal } from './ProductCatalogPickerModal';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  inventoryLots: InventoryLayer[];
  suppliers?: Supplier[];
  warehouses?: Warehouse[];
  branches?: Branch[];
  onAddOrder: (newOrder: Order) => void;
  onQuickAddCustomer?: (customer: Customer) => void;
  onQuickAddSupplier?: (supplier: Supplier) => void;
  onQuickAddProduct?: (
    product: Product,
    openingStock?: {
      quantity: number;
      costPrice: number;
      warehouseId: string;
      branchId: string;
    }
  ) => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  products,
  customers,
  inventoryLots,
  suppliers = [],
  warehouses = [],
  branches = [],
  onAddOrder,
  onQuickAddCustomer,
  onQuickAddSupplier,
  onQuickAddProduct
}) => {
  // Order Header States
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Line items state
  const [items, setItems] = useState<OrderItem[]>(() => {
    const firstProd = products[0];
    const initialSku = firstProd?.sku || firstProd?.code || 'SKU-001';
    const initialPrice = firstProd?.sellingPrice || 32000;
    return [
      {
        productId: firstProd?.id || 'p-1',
        productName: firstProd?.name || 'Sản phẩm mẫu',
        sku: initialSku,
        quantity: 10,
        unit: firstProd?.unit || 'Hộp',
        unitPrice: initialPrice,
        totalPrice: initialPrice * 10
      }
    ];
  });

  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vietqr');
  const [note, setNote] = useState('');
  const [expandedFifoRow, setExpandedFifoRow] = useState<number | null>(null);

  // Sub-modal states
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);

  // Currently selected customer object
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  // Filtered customer list for combobox
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.taxCode && c.taxCode.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, customerSearchQuery]);

  // Handlers for Items
  const handleAddItem = () => {
    const defaultProd = products[0] || {
      id: `p-${Date.now()}`,
      name: 'Mặt hàng mới',
      sku: 'SKU-NEW',
      unit: 'Hộp',
      sellingPrice: 50000
    };
    setItems([
      ...items,
      {
        productId: defaultProd.id,
        productName: defaultProd.name,
        sku: defaultProd.sku,
        quantity: 10,
        unit: defaultProd.unit,
        unitPrice: defaultProd.sellingPrice,
        totalPrice: defaultProd.sellingPrice * 10
      }
    ]);
  };

  const handleUpdateProductFromCombobox = (index: number, flatItem: FlatProductItem) => {
    const newItems = [...items];
    const qty = newItems[index]?.quantity || 1;
    newItems[index] = {
      ...newItems[index],
      productId: flatItem.parentProductId || flatItem.productId,
      productName: flatItem.variantName && flatItem.variantName !== 'Tiêu chuẩn'
        ? `${flatItem.productName} (${flatItem.variantName})`
        : flatItem.productName,
      sku: flatItem.sku,
      unit: flatItem.unit,
      unitPrice: flatItem.sellingPrice,
      totalPrice: flatItem.sellingPrice * qty
    };
    setItems(newItems);
  };

  const handleUpdateQuantity = (index: number, qty: number) => {
    const newItems = [...items];
    const safeQty = Math.max(1, qty);
    newItems[index].quantity = safeQty;
    newItems[index].totalPrice = safeQty * newItems[index].unitPrice;
    setItems(newItems);
  };

  const handleUpdateUnitPrice = (index: number, price: number) => {
    const newItems = [...items];
    const safePrice = Math.max(0, price);
    newItems[index].unitPrice = safePrice;
    newItems[index].totalPrice = newItems[index].quantity * safePrice;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
    if (expandedFifoRow === index) setExpandedFifoRow(null);
  };

  // Quick Customer Saved Callback
  const handleCustomerCreated = (newCust: Customer) => {
    if (onQuickAddCustomer) {
      onQuickAddCustomer(newCust);
    }
    setSelectedCustomerId(newCust.id);
  };

  // Quick Product Saved Callback
  const handleProductCreated = (
    newProd: Product,
    openingStock?: {
      quantity: number;
      costPrice: number;
      warehouseId: string;
      branchId: string;
    }
  ) => {
    if (onQuickAddProduct) {
      onQuickAddProduct(newProd, openingStock);
    }
  };

  // Callback when a product is quick-added or picked from catalog directly to order
  const handleSelectProductDirectly = (prod: Product | FlatProductItem, quantity: number = 10, unitPrice?: number) => {
    const price = unitPrice !== undefined ? unitPrice : prod.sellingPrice;
    const isFlat = 'parentProductId' in prod;
    const sku = isFlat ? (prod as FlatProductItem).sku : (prod as Product).sku;
    const name = isFlat
      ? (prod as FlatProductItem).variantName && (prod as FlatProductItem).variantName !== 'Tiêu chuẩn'
        ? `${prod.productName || (prod as any).name} (${(prod as FlatProductItem).variantName})`
        : prod.productName || (prod as any).name
      : prod.name;

    const newItem: OrderItem = {
      productId: isFlat ? (prod as FlatProductItem).parentProductId : prod.id,
      productName: name,
      sku: sku || 'SKU-001',
      quantity: Math.max(1, quantity),
      unit: prod.unit || 'Hộp',
      unitPrice: price,
      totalPrice: price * Math.max(1, quantity)
    };

    setItems((prev) => [...prev, newItem]);
  };

  // Real-time FIFO simulation for the modal items
  const fifoCalculation = useMemo(() => {
    const simulatedLots = inventoryLots.map((l) => ({
      ...l,
      remainingQuantity: l.remainingQuantity !== undefined ? l.remainingQuantity : l.quantityRemaining || 0,
      costPrice: l.purchasePrice || l.costPrice || 0,
      lotId: l.layerId || l.lotId || l.id,
      intakeDate: l.intakeDate || l.receivedAt || l.createdAt || '2026-08-01'
    }));

    let totalCogs = 0;

    const calculatedItems = items.map((item) => {
      let needed = item.quantity;
      let itemCogs = 0;
      const deductions: {
        lotId: string;
        quantity: number;
        costPrice: number;
        intakeDate?: string;
        warehouseName?: string;
      }[] = [];

      // Find matching FIFO lots for this SKU / Variant / Product, sorted earliest first
      const itemBasePrefix = (item.sku || '').split('-C')[0].split('-V')[0];
      const parentProd = products.find(
        (p) =>
          p.sku === item.sku ||
          p.variantSku === item.sku ||
          p.code === item.sku ||
          p.productCode === item.sku ||
          p.id === item.productId ||
          p.productId === item.productId ||
          p.variants?.some((v) => v.sku === item.sku || v.variantSku === item.sku)
      );
      const parentCode = parentProd?.code || parentProd?.productCode || itemBasePrefix;

      const skuLots = simulatedLots
        .filter((l) => {
          if (l.remainingQuantity <= 0) return false;
          if (l.sku === item.sku || (l as any).variantSku === item.sku) return true;
          if (parentCode && (l.productCode === parentCode || l.sku === parentCode || l.sku.startsWith(parentCode))) return true;
          if (item.productId && (l.productId === item.productId || (l as any).parentProductId === item.productId)) return true;
          if (itemBasePrefix && itemBasePrefix.length >= 3 && (l.sku.startsWith(itemBasePrefix) || l.productCode?.startsWith(itemBasePrefix))) {
            return true;
          }
          return false;
        })
        .sort((a, b) => new Date(a.intakeDate).getTime() - new Date(b.intakeDate).getTime());

      for (const lot of skuLots) {
        if (needed <= 0) break;
        const take = Math.min(needed, lot.remainingQuantity);
        itemCogs += take * lot.costPrice;
        lot.remainingQuantity -= take;
        needed -= take;
        deductions.push({
          lotId: lot.lotId,
          quantity: take,
          costPrice: lot.costPrice,
          intakeDate: lot.intakeDate,
          warehouseName: lot.warehouseName || lot.warehouse
        });
      }

      // If lots are insufficient, fallback to estimated product cost price
      if (needed > 0) {
        const prod = products.find((p) => p.sku === item.sku || p.code === item.sku || p.id === item.productId);
        const fallbackPrice = prod?.costPrice || 25000;
        itemCogs += needed * fallbackPrice;
        deductions.push({
          lotId: 'LOT-FIFO-EST (Dự phòng)',
          quantity: needed,
          costPrice: fallbackPrice,
          intakeDate: 'Đang đặt hàng',
          warehouseName: 'Kho Chờ'
        });
      }

      totalCogs += itemCogs;
      const itemGross = item.totalPrice - itemCogs;

      return {
        ...item,
        fifoCost: itemCogs,
        grossProfit: itemGross,
        fifoDeductions: deductions,
        hasShortage: needed > 0
      };
    });

    const subtotal = calculatedItems.reduce((acc, cur) => acc + cur.totalPrice, 0);
    const totalAmount = Math.max(0, subtotal - discount);
    const totalGrossProfit = totalAmount - totalCogs;
    const profitMargin = totalAmount > 0 ? (totalGrossProfit / totalAmount) * 100 : 0;

    return {
      subtotal,
      totalAmount,
      totalCogs,
      totalGrossProfit,
      profitMargin,
      calculatedItems
    };
  }, [items, inventoryLots, products, discount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      alert('Vui lòng chọn khách hàng!');
      return;
    }

    if (items.length === 0) {
      alert('Đơn hàng cần có ít nhất một mặt hàng!');
      return;
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      code: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerAddress: selectedCustomer.address,
      items: fifoCalculation.calculatedItems,
      subtotal: fifoCalculation.subtotal,
      discount,
      tax: 0,
      totalAmount: fifoCalculation.totalAmount,
      cogs: fifoCalculation.totalCogs,
      grossProfit: fifoCalculation.totalGrossProfit,
      status: 'processing',
      paymentMethod,
      paymentStatus: paymentMethod === 'vietqr' || paymentMethod === 'cash' ? 'paid' : 'unpaid',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      creator: 'Lê Hoàng Nam (Kinh doanh)',
      note
    };

    onAddOrder(newOrder);
    onClose();
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 z-50 animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold tracking-tight">Tạo Đơn Bán Hàng Mới (Khấu Trừ FIFO)</h2>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                    Realtime COGS
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Tự động cấn trừ từng Lô nhập sớm nhất, tra cứu đa trường SKU & tính Lợi nhuận gộp tức thì
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            {/* Section 1: Customer Selection & Quick Add */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Thông tin Khách Hàng / Đối Tác Mua Hàng</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsQuickCustomerOpen(true)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tạo nhanh KH / NCC</span>
                  </button>
                </div>
              </div>

              {/* Customer Selector / Combobox */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="md:col-span-2 relative">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={customerSearchQuery || (selectedCustomer ? `${selectedCustomer.name} - ${selectedCustomer.phone} (${selectedCustomer.group})` : '')}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        if (!isCustomerDropdownOpen) setIsCustomerDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setIsCustomerDropdownOpen(true);
                      }}
                      placeholder="Tìm kiếm khách hàng theo Tên, SĐT, Mã KH, MST..."
                      className="w-full pl-8.5 pr-8 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Customer Dropdown */}
                  {isCustomerDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-3 text-center text-slate-400">
                          Không tìm thấy khách hàng.
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomerDropdownOpen(false);
                              setIsQuickCustomerOpen(true);
                            }}
                            className="block mx-auto mt-1 font-bold text-blue-600"
                          >
                            + Tạo mới ngay
                          </button>
                        </div>
                      ) : (
                        filteredCustomers.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setCustomerSearchQuery('');
                              setIsCustomerDropdownOpen(false);
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between ${
                              selectedCustomerId === c.id ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{c.name}</span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                                  {c.code}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                                </span>
                                <span>•</span>
                                <span>{c.city || 'Toàn quốc'}</span>
                                {c.taxCode && (
                                  <>
                                    <span>•</span>
                                    <span>MST: {c.taxCode}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                                {c.group}
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Nợ: {formatVND(c.debt || 0)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Customer Badges */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-center text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Hạn mức nợ:</span>
                    <span className="font-bold text-slate-800">
                      {formatVND(selectedCustomer?.creditLimit || 50000000)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Điều khoản:</span>
                    <span className="font-bold text-blue-700">
                      {selectedCustomer?.creditTermsSummary || 'Trả trước 70% - Nợ 30%'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 truncate">
                    <span className="truncate">📍 {selectedCustomer?.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Items List & Multi-Field Search */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-blue-600" />
                    <span>Danh sách mặt hàng & Biến thể ({items.length})</span>
                  </label>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Tra cứu đa trường: SKU, Tên SP, Biến thể, Quy cách, Mã Cha
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCatalogPickerOpen(true)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1 border border-slate-300 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-slate-500" />
                    <span>🔍 Tra cứu catalog SKU</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsQuickProductOpen(true)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm mặt hàng nhanh</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm dòng</span>
                  </button>
                </div>
              </div>

              {/* Items List Rows */}
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const calculated = fifoCalculation.calculatedItems[idx];
                  const isExpanded = expandedFifoRow === idx;

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all space-y-2"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                        {/* Searchable Combobox for Product */}
                        <div className="flex-1 min-w-[280px]">
                          <ProductSearchCombobox
                            products={products}
                            selectedSkuOrId={item.sku}
                            onSelect={(flatItem) => handleUpdateProductFromCombobox(idx, flatItem)}
                            onOpenQuickAddProduct={() => setIsQuickProductOpen(true)}
                            placeholder="Gõ SKU, Tên SP, Biến thể, Quy cách, Product ID..."
                          />
                        </div>

                        {/* Quantity, Unit Price, Total */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                          {/* Quantity */}
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 font-semibold">SL:</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(idx, parseInt(e.target.value) || 1)}
                              className="w-16 text-center font-extrabold bg-white border border-slate-300 rounded-lg py-1.5 px-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <span className="font-bold text-slate-700 min-w-[32px]">{item.unit}</span>
                          </div>

                          {/* Unit Price */}
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 font-semibold">Đơn giá:</span>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateUnitPrice(idx, parseInt(e.target.value) || 0)}
                              className="w-24 text-right font-bold bg-white border border-slate-300 rounded-lg py-1.5 px-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>

                          {/* Total Row */}
                          <div className="text-right min-w-[110px]">
                            <div className="font-extrabold text-sm text-slate-900">{formatVND(item.totalPrice)}</div>
                            {calculated && (
                              <div className="text-[10px] text-slate-400">
                                Vốn FIFO: {formatVND(calculated.fifoCost)}
                              </div>
                            )}
                          </div>

                          {/* Remove button */}
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                              title="Xóa dòng này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Realtime FIFO Lot Allocation Bar */}
                      {calculated && (
                        <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-600 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-blue-600" />
                              Lô FIFO cấn trừ ({calculated.fifoDeductions.length} lớp):
                            </span>

                            {calculated.fifoDeductions.map((d, dIdx) => (
                              <span
                                key={dIdx}
                                className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                                  d.lotId.includes('EST')
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {d.lotId}: {d.quantity} {item.unit} @ {formatVND(d.costPrice)}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 font-bold shrink-0">
                            <span className="text-emerald-700">
                              Lãi gộp dòng: +{formatVND(calculated.grossProfit)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setExpandedFifoRow(isExpanded ? null : idx)}
                              className="text-blue-600 hover:text-blue-700 p-0.5 cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expandable Lot Allocation Detail */}
                      {isExpanded && calculated && (
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] space-y-1.5 animate-in fade-in">
                          <div className="font-bold text-slate-700 flex items-center justify-between">
                            <span>Chi tiết nguồn lô nhập kho theo nguyên tắc Nhập Trước - Xuất Trước:</span>
                            <span className="text-slate-500">Mã SKU: {item.sku}</span>
                          </div>
                          <div className="space-y-1">
                            {calculated.fifoDeductions.map((d, dIdx) => (
                              <div key={dIdx} className="flex items-center justify-between text-slate-600 bg-slate-50 p-1.5 rounded">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-blue-700">{d.lotId}</span>
                                  {d.intakeDate && <span>(Ngày nhập: {d.intakeDate})</span>}
                                  {d.warehouseName && <span className="text-slate-400">• {d.warehouseName}</span>}
                                </div>
                                <div className="font-semibold">
                                  {d.quantity} {item.unit} × {formatVND(d.costPrice)} ={' '}
                                  <strong className="text-slate-900">{formatVND(d.quantity * d.costPrice)}</strong>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Summary & Realtime Gross Profit Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              {/* Payment & Notes */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hình thức thanh toán
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="vietqr">Quét mã VietQR 24/7 (Khuyến nghị - Tự động đối soát)</option>
                    <option value="cash">Tiền mặt tại quầy / COD</option>
                    <option value="bank_transfer">Chuyển khoản trực tiếp</option>
                    <option value="credit">Ghi nhận công nợ (Hạn mức 30 ngày)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ghi chú đơn hàng & Vận chuyển
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Giao hàng trước 11h, liên hệ bảo vệ nhận hàng..."
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white"
                  />
                </div>
              </div>

              {/* Financial Calculation Box */}
              <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Tổng tiền hàng (Tạm tính):</span>
                  <span className="font-bold text-slate-900">{formatVND(fifoCalculation.subtotal)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Chiết khấu / Giảm giá:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 text-right border border-slate-300 rounded-lg p-1 bg-white font-bold text-slate-800 text-xs"
                    />
                    <span>đ</span>
                  </div>
                </div>

                <div className="flex justify-between text-slate-700 pt-1.5 border-t border-slate-200">
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Tổng giá vốn (FIFO COGS):
                  </span>
                  <span className="font-bold text-slate-800">{formatVND(fifoCalculation.totalCogs)}</span>
                </div>

                <div className="flex justify-between items-center text-emerald-700 font-bold bg-emerald-50/80 p-2 rounded-xl border border-emerald-200">
                  <span>Lợi nhuận gộp ước tính:</span>
                  <div className="text-right">
                    <span className="text-sm">+{formatVND(fifoCalculation.totalGrossProfit)}</span>
                    <span className="text-[10px] ml-1.5 bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-full font-bold">
                      {fifoCalculation.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-slate-900 font-extrabold text-base pt-1 border-t border-slate-200">
                  <span>Tổng thanh toán:</span>
                  <span className="text-blue-700 text-lg">{formatVND(fifoCalculation.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-slate-500 text-[11px] hidden sm:block">
                Hệ thống tự động cập nhật số dư tồn kho, thẻ kho và hạch toán sổ quỹ
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Xác nhận & Khấu trừ Lô FIFO</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Sub Modals */}
      <QuickAddCustomerModal
        isOpen={isQuickCustomerOpen}
        onClose={() => setIsQuickCustomerOpen(false)}
        onSaveCustomer={handleCustomerCreated}
        onSaveSupplier={onQuickAddSupplier}
        existingCustomers={customers}
        existingSuppliers={suppliers}
      />

      <QuickAddProductModal
        isOpen={isQuickProductOpen}
        onClose={() => setIsQuickProductOpen(false)}
        onSaveProduct={handleProductCreated}
        onSelectForOrder={handleSelectProductDirectly}
        existingProducts={products}
        warehouses={warehouses}
        branches={branches}
      />

      <ProductCatalogPickerModal
        isOpen={isCatalogPickerOpen}
        onClose={() => setIsCatalogPickerOpen(false)}
        products={products}
        onSelectProduct={handleSelectProductDirectly}
        onOpenQuickAdd={() => setIsQuickProductOpen(true)}
      />
    </>
  );
};
