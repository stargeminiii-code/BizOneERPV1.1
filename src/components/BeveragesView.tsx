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
  Flame
} from 'lucide-react';
import {
  INITIAL_BEVERAGES,
  INITIAL_INGREDIENTS,
  BeverageItem,
  IngredientStock,
  RecipeIngredient
} from '../data/beveragesData';
import { formatNumberWithDots } from '../data/administrativeData';

export const BeveragesView: React.FC = () => {
  const [beverages, setBeverages] = useState<BeverageItem[]>(INITIAL_BEVERAGES);
  const [ingredients, setIngredients] = useState<IngredientStock[]>(INITIAL_INGREDIENTS);
  const [activeTab, setActiveTab] = useState<'menu' | 'recipe_bom' | 'ingredients' | 'pos_quick'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBeverage, setSelectedBeverage] = useState<BeverageItem | null>(null);

  // Stats calculation
  const totalBeverageTypes = beverages.length;
  const totalRevenueToday = useMemo(() => {
    return beverages.reduce((sum, b) => sum + (b.totalRevenueToday || 0), 0);
  }, [beverages]);
  const totalCupsSoldToday = useMemo(() => {
    return beverages.reduce((sum, b) => sum + (b.totalSoldToday || 0), 0);
  }, [beverages]);
  const avgGrossMargin = useMemo(() => {
    if (beverages.length === 0) return 0;
    return (beverages.reduce((sum, b) => sum + b.marginPercent, 0) / beverages.length).toFixed(1);
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

  // Order Quick Simulation
  const handleQuickOrder = (bev: BeverageItem) => {
    setBeverages((prev) =>
      prev.map((b) =>
        b.id === bev.id
          ? {
              ...b,
              totalSoldToday: b.totalSoldToday + 1,
              totalRevenueToday: b.totalRevenueToday + b.sellingPrice
            }
          : b
      )
    );
    // Deduct ingredients FIFO
    setIngredients((prev) =>
      prev.map((ing) => {
        const recipeItem = bev.recipe.find((r) => r.ingredientSku === ing.sku);
        if (recipeItem) {
          const newQty = Math.max(0, ing.currentStock - recipeItem.quantity);
          return { ...ing, currentStock: newQty };
        }
        return ing;
      })
    );
  };

  return (
    <div id="beverages-view-container" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1680px] mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white rounded-3xl p-6 shadow-xl border border-amber-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <Coffee className="w-8 h-8 text-amber-300" />
            <span>F&B & Recipe</span>
          </h1>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto shrink-0">
          <div className="bg-amber-950/60 border border-amber-700/60 rounded-2xl p-3 text-center min-w-[100px]">
            <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Số món Menu</div>
            <div className="text-lg font-black text-white mt-0.5">{totalBeverageTypes} món</div>
          </div>
          <div className="bg-amber-950/60 border border-amber-700/60 rounded-2xl p-3 text-center min-w-[100px]">
            <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Đã pha hôm nay</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">{totalCupsSoldToday} ly</div>
          </div>
          <div className="bg-amber-950/60 border border-amber-700/60 rounded-2xl p-3 text-center min-w-[100px]">
            <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Doanh thu F&B</div>
            <div className="text-lg font-black text-amber-200 mt-0.5">{formatNumberWithDots(totalRevenueToday)} đ</div>
          </div>
          <div className="bg-amber-950/60 border border-amber-700/60 rounded-2xl p-3 text-center min-w-[100px]">
            <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Biên LN gộp TB</div>
            <div className="text-lg font-black text-sky-300 mt-0.5">{avgGrossMargin}%</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'menu'
              ? 'bg-amber-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>Menu Đồ Uống & POS Bán Nhanh</span>
        </button>

        <button
          onClick={() => setActiveTab('recipe_bom')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'recipe_bom'
              ? 'bg-amber-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Định Lượng Công Thức (Recipe / BOM)</span>
        </button>

        <button
          onClick={() => setActiveTab('ingredients')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ingredients'
              ? 'bg-amber-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Kho Nguyên Liệu Pha Chế (FIFO)</span>
        </button>
      </div>

      {/* Tab 1: Menu & POS Quick Dispense */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm món đồ uống, mã món..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
              >
                <option value="all">Tất cả danh mục</option>
                <option value="cafe">Cà phê</option>
                <option value="tea">Trà & Matcha</option>
                <option value="smoothie">Sinh tố</option>
                <option value="healthy">Thảo mộc & Healthy</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Hiển thị <span className="font-bold text-slate-900">{filteredBeverages.length}</span> món
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBeverages.map((bev) => (
              <div
                key={bev.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={bev.image}
                      alt={bev.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg font-mono">
                      {bev.code}
                    </div>
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-lg">
                      Margin {bev.marginPercent}%
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{bev.categoryName}</span>
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> {bev.preparationTimeMinutes} phút
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{bev.name}</h3>

                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <div className="text-xs text-slate-400">Giá bán</div>
                        <div className="text-base font-black text-amber-800">
                          {formatNumberWithDots(bev.sellingPrice)} đ
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Giá vốn BOM</div>
                        <div className="text-xs font-bold text-slate-600">
                          {formatNumberWithDots(bev.estimatedCostPrice)} đ
                        </div>
                      </div>
                    </div>

                    {/* Recipe summary pill */}
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                      <div className="font-bold text-slate-700 flex items-center gap-1 text-[10px] uppercase">
                        <Utensils className="w-3 h-3 text-amber-600" />
                        Định lượng gồm ({bev.recipe.length} thành phần):
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {bev.recipe.map((r) => `${r.ingredientName} (${r.quantity}${r.unit})`).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleQuickOrder(bev)}
                    className="w-full py-2.5 bg-amber-800 hover:bg-amber-900 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Flame className="w-4 h-4 text-amber-300" />
                    <span>Pha Chế & Trừ Kho 1 Ly</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Recipe BOM Detail */}
      {activeTab === 'recipe_bom' && (
        <div className="space-y-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Bảng Công Thức Định Lượng (Bill of Materials)</h2>
              <p className="text-xs text-slate-500">Mỗi ly đồ uống tự động tính giá vốn chính xác theo giá lô nhập kho FIFO</p>
            </div>
            <button className="px-3.5 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Thêm Công Thức Mới
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {beverages.map((bev) => (
              <div key={bev.id} className="py-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <img src={bev.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <div className="font-bold text-sm text-slate-900">{bev.name}</div>
                      <div className="text-xs text-slate-500">Mã món: <span className="font-mono font-bold text-slate-700">{bev.code}</span> • Giá bán: <span className="font-bold text-amber-800">{formatNumberWithDots(bev.sellingPrice)} đ</span></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Tổng giá vốn BOM: <span className="font-black text-slate-900">{formatNumberWithDots(bev.estimatedCostPrice)} đ</span></div>
                    <div className="text-xs font-bold text-emerald-600">Lãi gộp: {formatNumberWithDots(bev.sellingPrice - bev.estimatedCostPrice)} đ ({bev.marginPercent}%)</div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold border-b border-slate-200/60 pb-2">
                        <th className="py-1.5 px-2">Mã Nguyên Liệu</th>
                        <th className="py-1.5 px-2">Tên Nguyên Liệu / Bao Bì</th>
                        <th className="py-1.5 px-2 text-right">Định Lượng / 1 Ly</th>
                        <th className="py-1.5 px-2 text-right">Đơn Giá Vốn FIFO</th>
                        <th className="py-1.5 px-2 text-right">Thành Tiền Vốn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/40">
                      {bev.recipe.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-100/50">
                          <td className="py-2 px-2 font-mono text-slate-600">{r.ingredientSku}</td>
                          <td className="py-2 px-2 font-medium text-slate-800">{r.ingredientName}</td>
                          <td className="py-2 px-2 text-right font-bold text-slate-900">{r.quantity} {r.unit}</td>
                          <td className="py-2 px-2 text-right text-slate-600">{formatNumberWithDots(r.costPerUnit)} đ/{r.unit}</td>
                          <td className="py-2 px-2 text-right font-black text-amber-900">{formatNumberWithDots(r.subtotalCost)} đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Ingredients Stock FIFO */}
      {activeTab === 'ingredients' && (
        <div className="space-y-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Tồn Kho Nguyên Liệu Pha Chế (FIFO Costing)</h2>
              <p className="text-xs text-slate-500">Theo dõi tồn kho gam/ml của Matcha, Cà phê, Sữa và Hạn sử dụng nguyên liệu</p>
            </div>
            <button className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Nhập Kho Nguyên Liệu (PO)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">Mã SKU</th>
                  <th className="py-3 px-3">Tên Nguyên Liệu</th>
                  <th className="py-3 px-3">Phân Loại</th>
                  <th className="py-3 px-3 text-right">Tồn Kho Thực Tế</th>
                  <th className="py-3 px-3 text-right">Định Mức Tối Thiểu</th>
                  <th className="py-3 px-3 text-right">Giá Vốn FIFO</th>
                  <th className="py-3 px-3">Hạn Dùng (Expiry)</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ingredients.map((ing) => {
                  const isLow = ing.currentStock <= ing.minAlertStock;
                  return (
                    <tr key={ing.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">{ing.sku}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{ing.name}</td>
                      <td className="py-3 px-3 text-slate-600">{ing.category}</td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        {formatNumberWithDots(ing.currentStock)} {ing.unit}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        {formatNumberWithDots(ing.minAlertStock)} {ing.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-blue-700">
                        {formatNumberWithDots(ing.fifoCostPrice)} đ/{ing.unit}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{ing.expiryDate}</td>
                      <td className="py-3 px-3">
                        {isLow ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded-full text-[10px] flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Cảnh báo sắp hết
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded-full text-[10px] flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Đủ tồn an toàn
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
