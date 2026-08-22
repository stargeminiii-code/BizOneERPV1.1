import React, { useState, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { Customer, InventoryLot, Order, OrderItem, PaymentMethod, Product } from '../types';

interface PosViewProps {
  products: Product[];
  customers: Customer[];
  inventoryLots: InventoryLot[];
  onCompleteSale: (newOrder: Order) => void;
  onOpenVietQr: (order: Order) => void;
}

export const PosView: React.FC<PosViewProps> = ({
  products = [],
  customers = [],
  inventoryLots = [],
  onCompleteSale,
  onOpenVietQr
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>(() => {
    const initialCart: { product: Product; quantity: number }[] = [];
    if (products[0]) initialCart.push({ product: products[0], quantity: 100 });
    if (products[3]) initialCart.push({ product: products[3], quantity: 50 });
    return initialCart;
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vietqr');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const categories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'Thép & Kim loại', name: 'Thép & Kim loại' },
    { id: 'Tôn & Xà gồ', name: 'Tôn & Xà gồ' },
    { id: 'Vật tư phụ kiện', name: 'Vật tư phụ kiện' }
  ];

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (product: Product) => {
    // Check available lot stock across matching variants/parent code
    const prodPrefix = (product.sku || '').split('-C')[0].split('-V')[0];
    const availableLots = inventoryLots.filter(
      (l) =>
        l.remainingQuantity > 0 &&
        (l.sku === product.sku ||
          l.sku === product.variantSku ||
          (product.code && l.productCode === product.code) ||
          (prodPrefix && l.sku.startsWith(prodPrefix)))
    );
    const totalAvail = availableLots.reduce((sum, l) => sum + l.remainingQuantity, 0);

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + 1 > totalAvail && totalAvail > 0) {
        alert(`Không đủ tồn kho khả dụng cho ${product.name} (Tồn tối đa theo lô: ${totalAvail} ${product.unit})`);
        return prev;
      }

      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;

            // Check lot stock
            const prodPrefix = (item.product.sku || '').split('-C')[0].split('-V')[0];
            const availableLots = inventoryLots.filter(
              (l) =>
                l.remainingQuantity > 0 &&
                (l.sku === item.product.sku ||
                  l.sku === item.product.variantSku ||
                  (item.product.code && l.productCode === item.product.code) ||
                  (prodPrefix && l.sku.startsWith(prodPrefix)))
            );
            const totalAvail = availableLots.reduce((sum, l) => sum + l.remainingQuantity, 0);
            if (newQty > totalAvail && totalAvail > 0) {
              alert(`Tồn kho theo các Lô chỉ còn ${totalAvail} ${item.product.unit}!`);
              return item;
            }

            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number }[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Real-time FIFO Calculation per Cart Item
  const fifoCalculation = useMemo(() => {
    // Copy inventory lots remaining quantities to simulate FIFO deduction
    const simulatedLots = inventoryLots.map((l) => ({ ...l }));
    let totalCogs = 0;

    const itemDetails = cart.map((cartItem) => {
      let needed = cartItem.quantity;
      let itemCogs = 0;
      const deductions: { lotId: string; quantity: number; costPrice: number }[] = [];

      // Sort lots by intake date ascending (FIFO)
      const prodPrefix = (cartItem.product.sku || '').split('-C')[0].split('-V')[0];
      const skuLots = simulatedLots
        .filter(
          (l) =>
            l.remainingQuantity > 0 &&
            (l.sku === cartItem.product.sku ||
              l.sku === cartItem.product.variantSku ||
              (cartItem.product.code && l.productCode === cartItem.product.code) ||
              (prodPrefix && l.sku.startsWith(prodPrefix)))
        )
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
          costPrice: lot.costPrice
        });
      }

      // If stock exhausted but quantity still needed, fallback to product costPrice
      if (needed > 0) {
        itemCogs += needed * cartItem.product.costPrice;
        deductions.push({
          lotId: 'LOT-OVERSTOCK',
          quantity: needed,
          costPrice: cartItem.product.costPrice
        });
      }

      totalCogs += itemCogs;
      const itemRevenue = cartItem.product.sellingPrice * cartItem.quantity;
      const itemGrossProfit = itemRevenue - itemCogs;

      return {
        product: cartItem.product,
        quantity: cartItem.quantity,
        itemRevenue,
        itemCogs,
        itemGrossProfit,
        deductions
      };
    });

    const subtotal = cart.reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0);
    const totalAmount = Math.max(0, subtotal - discountAmount);
    const totalGrossProfit = totalAmount - totalCogs;
    const profitMargin = totalAmount > 0 ? (totalGrossProfit / totalAmount) * 100 : 0;

    return {
      subtotal,
      totalAmount,
      totalCogs,
      totalGrossProfit,
      profitMargin,
      itemDetails
    };
  }, [cart, inventoryLots, discountAmount]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm vào giỏ hàng');
      return;
    }

    const orderItems: OrderItem[] = fifoCalculation.itemDetails.map((detail) => ({
      productId: detail.product.id,
      productName: detail.product.name,
      sku: detail.product.sku,
      quantity: detail.quantity,
      unit: detail.product.unit,
      unitPrice: detail.product.sellingPrice,
      totalPrice: detail.itemRevenue,
      fifoCost: detail.itemCogs,
      grossProfit: detail.itemGrossProfit,
      fifoDeductions: detail.deductions
    }));

    const newOrder: Order = {
      id: `ord-pos-${Date.now()}`,
      code: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerAddress: selectedCustomer.address,
      items: orderItems,
      subtotal: fifoCalculation.subtotal,
      discount: discountAmount,
      tax: 0,
      totalAmount: fifoCalculation.totalAmount,
      cogs: fifoCalculation.totalCogs,
      grossProfit: fifoCalculation.totalGrossProfit,
      status: 'completed',
      paymentMethod,
      paymentStatus: paymentMethod === 'credit' ? 'partial' : 'paid',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      creator: 'Nguyễn Thu Thảo (POS Quầy)'
    };

    onCompleteSale(newOrder);

    if (paymentMethod === 'vietqr') {
      onOpenVietQr(newOrder);
    } else {
      alert(`Đã xuất bán & trừ kho FIFO thành công đơn hàng ${newOrder.code} qua ${paymentMethod}!`);
    }

    setCart([]);
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="p-3.5 sm:p-5 md:p-6 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-h-[calc(100vh-5rem)]">
      {/* Left: Product Catalog (Col 7/8) */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Category Filter Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 space-y-2.5 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã SKU, tên sản phẩm sắt thép hoặc quét mã..."
                className="w-full bg-white text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => alert('Mở camera quét mã Barcode / QR trên kiện hàng')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shrink-0"
            >
              <Barcode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quét Barcode</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
          {filteredProducts.map((product) => {
            const prodLots = inventoryLots.filter((l) => l.sku === product.sku && l.remainingQuantity > 0);
            const nextCost = prodLots[0]?.costPrice || product.costPrice;

            return (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col justify-between hover:border-blue-400 hover:shadow-md cursor-pointer transition-all active:scale-98 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                      {product.sku}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        product.isLowStock
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      Tồn: {product.stock} {product.unit}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h4>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Vốn Lô 1: {formatVND(nextCost)}/{product.unit}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-700">
                    {formatVND(product.sellingPrice)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">/{product.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Order Cart with Realtime FIFO Deduction Preview (Col 5/4) */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Customer Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/50 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Khách hàng
            </span>
            <span className="text-[11px] text-blue-600 font-bold">
              Công nợ: {formatVND(selectedCustomer?.debt || 0)}
            </span>
          </div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl p-2 text-slate-800 focus:outline-none"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.phone} ({c.group})
              </option>
            ))}
          </select>
        </div>

        {/* Cart Item List with FIFO Lots Breakdown */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingCart className="w-8 h-8 stroke-1" />
              <p className="text-xs font-medium">Chưa có sản phẩm trong giỏ hàng</p>
            </div>
          ) : (
            fifoCalculation.itemDetails.map((detail, idx) => (
              <div
                key={detail.product.id}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{detail.product.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatVND(detail.product.sellingPrice)} × {detail.quantity} {detail.product.unit} ={' '}
                      <strong className="text-slate-900">{formatVND(detail.itemRevenue)}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(detail.product.id, -1)}
                      className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-bold text-slate-800">{detail.quantity}</span>
                    <button
                      onClick={() => updateQuantity(detail.product.id, 1)}
                      className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(detail.product.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* FIFO Deductions Preview Tag */}
                <div className="p-1.5 bg-blue-50/60 rounded-lg border border-blue-200/60 text-[10px] space-y-0.5">
                  <div className="flex justify-between items-center text-blue-900 font-bold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      Khấu trừ FIFO theo Lô:
                    </span>
                    <span>Vốn: {formatVND(detail.itemCogs)}</span>
                  </div>
                  {detail.deductions.map((ded, dIdx) => (
                    <div key={dIdx} className="text-slate-600 flex justify-between">
                      <span className="font-mono">{ded.lotId}: {ded.quantity} {detail.product.unit}</span>
                      <span>@ {formatVND(ded.costPrice)}</span>
                    </div>
                  ))}
                  <div className="text-emerald-700 font-semibold flex justify-between pt-0.5 border-t border-blue-200">
                    <span>Lợi nhuận gộp dòng:</span>
                    <span>+{formatVND(detail.itemGrossProfit)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Real-time Profit & Cost Analysis */}
        {cart.length > 0 && (
          <div className="px-3.5 py-2 bg-emerald-50/50 border-t border-emerald-200/60 text-[11px] grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500 block">Tổng giá vốn FIFO (COGS):</span>
              <span className="font-extrabold text-slate-800">{formatVND(fifoCalculation.totalCogs)}</span>
            </div>
            <div>
              <span className="text-emerald-800 font-bold block">Lợi nhuận gộp thực tế:</span>
              <span className="font-extrabold text-emerald-700">
                +{formatVND(fifoCalculation.totalGrossProfit)} ({fifoCalculation.profitMargin.toFixed(1)}%)
              </span>
            </div>
          </div>
        )}

        {/* Payment & Checkout Box */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50/70 space-y-2.5">
          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setPaymentMethod('vietqr')}
              className={`p-1.5 sm:p-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                paymentMethod === 'vietqr'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>VietQR</span>
            </button>
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-1.5 sm:p-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                paymentMethod === 'cash'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Tiền mặt</span>
            </button>
            <button
              onClick={() => setPaymentMethod('credit')}
              className={`p-1.5 sm:p-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                paymentMethod === 'credit'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Ghi nợ</span>
            </button>
          </div>

          {/* Pricing Totals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính ({cart.reduce((s, c) => s + c.quantity, 0)} sản phẩm):</span>
              <span className="font-semibold">{formatVND(fifoCalculation.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Chiết khấu đơn:</span>
              <input
                type="number"
                min="0"
                step="50000"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 text-right border border-slate-300 rounded p-1 bg-white font-semibold text-xs"
              />
            </div>
            <div className="flex justify-between text-slate-900 font-extrabold text-base pt-1.5 border-t border-slate-200">
              <span>Tổng thanh toán:</span>
              <span className="text-blue-700">{formatVND(fifoCalculation.totalAmount)}</span>
            </div>
          </div>

          {/* Submit Checkout Button */}
          <button
            id="btn-pos-checkout"
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-xs transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>Thanh toán & Trừ kho FIFO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
