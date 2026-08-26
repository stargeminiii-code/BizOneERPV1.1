import React, { useState, useMemo } from 'react';
import {
  Coffee,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  DollarSign,
  TrendingUp,
  Package,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Calculator,
  Utensils,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  History,
  ShieldCheck,
  Zap,
  ShoppingBag
} from 'lucide-react';
import {
  INITIAL_BEVERAGES,
  INITIAL_INGREDIENTS,
  BeverageItem,
  IngredientStock
} from '../data/beveragesData';
import { formatNumberWithDots } from '../data/administrativeData';
import { TemporalPriceManager } from './Temporal/TemporalPriceManager';
import { RecipeBomManager } from './Temporal/RecipeBomManager';
import { PreparationBatchManager } from './Temporal/PreparationBatchManager';
import { ConsumptionLedgerView } from './Temporal/ConsumptionLedgerView';
import { HistoricalOrderInspector } from './Temporal/HistoricalOrderInspector';
import { TemporalBusinessEngine } from '../services/temporal/temporalService';
import { Order } from '../types';

interface BeveragesViewProps {
  onAddOrder?: (order: Order) => void;
  tenantId?: string;
  actorName?: string;
}

export const BeveragesView: React.FC<BeveragesViewProps> = ({
  onAddOrder,
  tenantId = 'TENANT-DEFAULT',
  actorName = 'Quản trị viên / Barista'
}) => {
  const [beverages, setBeverages] = useState<BeverageItem[]>(INITIAL_BEVERAGES);
  const [activeTab, setActiveTab] = useState<
    'menu' | 'recipe_bom' | 'temporal_prices' | 'batches' | 'consumption' | 'snapshots'
  >('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<Array<{ beverage: BeverageItem; quantity: number }>>([]);
  const [recentOrderSuccess, setRecentOrderSuccess] = useState<string | null>(null);

  // Initialize Temporal Engine
  TemporalBusinessEngine.initialize();

  // Metrics
  const totalBeverageTypes = beverages.length;
  const totalRevenueToday = useMemo(() => {
    return beverages.reduce((sum, b) => sum + (b.totalRevenueToday || 0), 0);
  }, [beverages]);
  const totalCupsSoldToday = useMemo(() => {
    return beverages.reduce((sum, b) => sum + (b.totalSoldToday || 0), 0);
  }, [beverages]);

  const filteredBeverages = useMemo(() => {
    return beverages.filter((b) => {
      const matchCat = selectedCategory === 'all' || b.category === selectedCategory;
      const matchSearch =
        !searchTerm ||
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [beverages, selectedCategory, searchTerm]);

  // Cart operations
  const addToCart = (bev: BeverageItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.beverage.id === bev.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [...prev, { beverage: bev, quantity: 1 }];
    });
  };

  const removeFromCart = (bevId: string) => {
    setCart((prev) => prev.filter((item) => item.beverage.id !== bevId));
  };

  const updateCartQty = (bevId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.beverage.id === bevId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as Array<{ beverage: BeverageItem; quantity: number }>
    );
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.beverage.sellingPrice * item.quantity, 0);
  }, [cart]);

  // Execute Order
  const handleCheckoutCart = () => {
    if (cart.length === 0) return;

    const orderId = `ORD-FNB-${Date.now()}`;
    const orderCode = `FNB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowTime = new Date().toISOString();

    const orderItems = cart.map((item) => ({
      productId: item.beverage.id,
      sku: item.beverage.code,
      productName: item.beverage.name,
      quantity: item.quantity,
      price: item.beverage.sellingPrice,
      totalPrice: item.beverage.sellingPrice * item.quantity,
      fifoCost: item.beverage.standardCost * item.quantity
    }));

    const order: Order = {
      id: orderId,
      code: orderCode,
      customerName: 'Khách mua tại quầy F&B',
      customerPhone: '0900000000',
      warehouseId: 'WH01',
      branchId: 'BR01',
      totalAmount: cartSubtotal,
      discount: 0,
      tax: 0,
      status: 'completed',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      createdAt: nowTime.replace('T', ' ').substring(0, 16),
      creator: actorName,
      items: orderItems
    };
    (order as any).tenantId = tenantId;

    // 1. Process Consumption Engine (Deducts FIFO or Accumulates threshold)
    TemporalBusinessEngine.processOrderConsumption(order, actorName);

    // 2. Create Immutable Snapshot
    TemporalBusinessEngine.createOrderSnapshot(order, nowTime);

    // 3. Callback to main app if available
    if (onAddOrder) {
      onAddOrder(order);
    }

    // Update local sales stats
    setBeverages((prev) =>
      prev.map((b) => {
        const inCart = cart.find((c) => c.beverage.id === b.id);
        if (inCart) {
          return {
            ...b,
            totalSoldToday: (b.totalSoldToday || 0) + inCart.quantity,
            totalRevenueToday: (b.totalRevenueToday || 0) + inCart.quantity * b.sellingPrice
          };
        }
        return b;
      })
    );

    setCart([]);
    setRecentOrderSuccess(`Đã chốt đơn ${orderCode} thành công! Đã tạo Snapshot bất biến.`);
    setTimeout(() => setRecentOrderSuccess(null), 5000);
  };

  return (
    <div id="beverages-view-container" className="p-4 sm:p-6 space-y-5 max-w-[1680px] mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Coffee className="w-5 h-5 text-blue-600" />
            <span>Định mức Công thức & BOM</span>
          </h1>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-500 text-[11px]">Doanh thu F&B:</span>
            <div className="text-sm sm:text-base font-bold font-mono text-slate-900 mt-0.5">
              {formatNumberWithDots(totalRevenueToday)} đ
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-500 text-[11px]">Số ly đã bán:</span>
            <div className="text-sm sm:text-base font-bold font-mono text-blue-600 mt-0.5">
              {totalCupsSoldToday} ly
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('menu')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'menu'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>Menu & Bán Nhanh POS</span>
        </button>

        <button
          onClick={() => setActiveTab('recipe_bom')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'recipe_bom'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Định Mức & Cây BOM Đa Cấp</span>
        </button>

        <button
          onClick={() => setActiveTab('temporal_prices')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'temporal_prices'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Phiên Bản Giá & Effective Dating</span>
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'batches'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Mẻ Sơ Chế Bán Thành Phẩm</span>
        </button>

        <button
          onClick={() => setActiveTab('consumption')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'consumption'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Sổ Cái Tiêu Hao & Tích Lũy</span>
        </button>

        <button
          onClick={() => setActiveTab('snapshots')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'snapshots'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Thanh Tra Snapshot Bất Biến</span>
        </button>
      </div>

      {/* Success Alert */}
      {recentOrderSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{recentOrderSuccess}</span>
          </div>
          <button
            onClick={() => setActiveTab('snapshots')}
            className="text-emerald-700 hover:underline text-xs font-bold cursor-pointer"
          >
            Xem Snapshot Bất Biến →
          </button>
        </div>
      )}

      {/* TAB 1: MENU & QUICK POS */}
      {activeTab === 'menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Menu Catalog */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'coffee', label: 'Cà phê' },
                  { id: 'tea', label: 'Trà & Matcha' },
                  { id: 'smoothie', label: 'Sinh tố & Đá xay' },
                  { id: 'snack', label: 'Bánh & Ăn nhẹ' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm đồ uống, mã món..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Drink Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredBeverages.map((bev) => (
                <div
                  key={bev.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                          {bev.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{bev.name}</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-900 shrink-0">
                        {formatNumberWithDots(bev.sellingPrice)} đ
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{bev.description}</p>
                    
                    <div className="mt-2 text-[10px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 space-y-0.5 font-mono">
                      <div>Định mức: {bev.recipe?.length || 0} thành phần</div>
                      <div>Giá vốn tiêu chuẩn: {formatNumberWithDots(bev.standardCost)} đ</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Đã bán: <strong>{bev.totalSoldToday || 0} ly</strong>
                    </span>
                    <button
                      onClick={() => addToCart(bev)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm đơn</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 1 Col: Quick POS Cart & Snapshot Trigger */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  <span>Giỏ Hàng Quầy F&B ({cart.length})</span>
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[11px] text-rose-600 hover:underline font-semibold"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="mt-3 space-y-2.5 max-h-[400px] overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.beverage.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{item.beverage.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {formatNumberWithDots(item.beverage.sellingPrice)} đ x {item.quantity}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-300 rounded-md bg-white">
                        <button
                          onClick={() => updateCartQty(item.beverage.id, -1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 font-bold font-mono text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.beverage.id, 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.beverage.id)}
                        className="text-slate-400 hover:text-rose-600 font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium">
                    Giỏ hàng trống. Bấm "+ Thêm đơn" trên từng món để bắt đầu.
                  </div>
                )}
              </div>
            </div>

            {/* Cart Footer */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">Tổng thanh toán:</span>
                <span className="font-mono font-bold text-base text-slate-900">
                  {formatNumberWithDots(cartSubtotal)} đ
                </span>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={handleCheckoutCart}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 ${
                  cart.length > 0
                    ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Chốt Đơn & Tạo Snapshot Bất Biến</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECIPE & MULTI-LEVEL BOM */}
      {activeTab === 'recipe_bom' && (
        <RecipeBomManager tenantId={tenantId} actorName={actorName} />
      )}

      {/* TAB 3: TEMPORAL PRICES & TIMELINE */}
      {activeTab === 'temporal_prices' && (
        <TemporalPriceManager tenantId={tenantId} actorName={actorName} />
      )}

      {/* TAB 4: PREPARATION BATCHES */}
      {activeTab === 'batches' && (
        <PreparationBatchManager tenantId={tenantId} actorName={actorName} />
      )}

      {/* TAB 5: CONSUMPTION LEDGER */}
      {activeTab === 'consumption' && (
        <ConsumptionLedgerView tenantId={tenantId} />
      )}

      {/* TAB 6: IMMUTABLE SNAPSHOTS */}
      {activeTab === 'snapshots' && (
        <HistoricalOrderInspector tenantId={tenantId} />
      )}
    </div>
  );
};
