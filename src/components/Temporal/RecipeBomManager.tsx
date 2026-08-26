import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  GitBranch,
  FileSpreadsheet,
  Package,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Eye
} from 'lucide-react';
import { RecipeVersionService } from '../../services/recipe/recipeVersionService';
import { RecipeCostService } from '../../services/recipe/recipeCostService';
import { RecipeVersion, RecipeComponent, RecipePackaging } from '../../types';
import { formatNumberWithDots } from '../../data/administrativeData';

interface RecipeBomManagerProps {
  tenantId?: string;
  warehouseId?: string;
  actorName?: string;
}

export const RecipeBomManager: React.FC<RecipeBomManagerProps> = ({
  tenantId = 'TENANT-DEFAULT',
  warehouseId = 'WH01',
  actorName = 'Trưởng Pha Chế / Bếp Trưởng'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSku, setSelectedSku] = useState<string>('DU-CF-SUA');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // New Recipe Form State
  const [newSku, setNewSku] = useState('DU-CF-SUA');
  const [newProductName, setNewProductName] = useState('Cà phê sữa Sài Gòn');
  const [newRecipeCode, setNewRecipeCode] = useState('REC-CFSUA-03');
  const [newRecipeName, setNewRecipeName] = useState('Công thức cải tiến vụ mùa 2026');
  const [newYieldQty, setNewYieldQty] = useState(1);
  const [newYieldUnit, setNewYieldUnit] = useState('ly');
  const [newEffectiveFrom, setNewEffectiveFrom] = useState(
    new Date().toISOString().substring(0, 10) + 'T00:00:00Z'
  );
  const [componentsList, setComponentsList] = useState<RecipeComponent[]>([
    {
      componentId: 'C1',
      componentSku: 'BTP-CF-COT',
      componentName: 'Cốt cà phê phin',
      componentType: 'SEMI_FINISHED',
      quantity: 80,
      unit: 'ml',
      standardCost: 140,
      consumptionPolicy: 'PER_TRANSACTION'
    },
    {
      componentId: 'C2',
      componentSku: 'NL-SUA-DAC',
      componentName: 'Sữa đặc Ngôi Sao',
      componentType: 'RAW_MATERIAL',
      quantity: 35,
      unit: 'ml',
      standardCost: 25,
      consumptionPolicy: 'ACCUMULATED_THRESHOLD',
      consumptionThreshold: 500
    }
  ]);

  // All Recipes
  const allRecipes = useMemo(() => {
    return RecipeVersionService.getAllRecipes(tenantId);
  }, [tenantId, refreshKey]);

  // Unique Products with recipes
  const uniqueProducts = useMemo(() => {
    const map = new Map<string, { sku: string; name: string }>();
    allRecipes.forEach((r) => {
      if (!map.has(r.productSku)) {
        map.set(r.productSku, { sku: r.productSku, name: r.productName });
      }
    });
    return Array.from(map.values());
  }, [allRecipes]);

  // Versions for selected SKU
  const versionsForSku = useMemo(() => {
    if (!selectedSku) return [];
    return RecipeVersionService.getRecipeVersions(tenantId, selectedSku);
  }, [tenantId, selectedSku, refreshKey]);

  // Active / Selected Version
  const activeVersion = useMemo(() => {
    if (selectedVersionId) {
      return versionsForSku.find((v) => v.versionId === selectedVersionId) || versionsForSku[0];
    }
    return versionsForSku.find((v) => v.status === 'ACTIVE') || versionsForSku[0];
  }, [versionsForSku, selectedVersionId]);

  // Multi-level BOM expansion
  const multiLevelBOM = useMemo(() => {
    if (!selectedSku || !activeVersion) return null;
    return RecipeVersionService.expandMultiLevelBOM(
      tenantId,
      selectedSku,
      1,
      activeVersion.effectiveFrom
    );
  }, [tenantId, selectedSku, activeVersion, refreshKey]);

  // Cost Comparison (Standard vs Actual FIFO)
  const costCalculation = useMemo(() => {
    if (!selectedSku) return null;
    return RecipeCostService.calculateRecipeCost(tenantId, selectedSku, 1, warehouseId);
  }, [tenantId, selectedSku, warehouseId, refreshKey]);

  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku || componentsList.length === 0) {
      alert('Vui lòng điền đầy đủ SKU và ít nhất 1 thành phần định mức');
      return;
    }

    const estimatedCost = componentsList.reduce(
      (sum, c) => sum + (c.quantity * (c.standardCost || 0)),
      0
    );

    const res = RecipeVersionService.createRecipeVersion(
      {
        tenantId,
        productSku: newSku,
        productId: `PROD-${newSku}`,
        productName: newProductName,
        recipeCode: newRecipeCode,
        name: newRecipeName,
        yieldQuantity: newYieldQty,
        yieldUnit: newYieldUnit,
        effectiveFrom: newEffectiveFrom,
        effectiveTo: null,
        components: componentsList,
        estimatedStandardCost: estimatedCost
      },
      actorName
    );

    if (!res.success) {
      alert(`Lỗi tạo phiên bản định mức: ${res.errorMessage}`);
      return;
    }

    setIsCreateModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" />
            <span>Quản lý Định Mức & Cây Cấu Trúc BOM Đa Cấp (Multi-Level BOM)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Định mức F&B hỗ trợ bán thành phẩm (cốt, sốt), bao bì đóng gói, tiêu hao tức thời hoặc tích lũy theo ngưỡng.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Phiên Bản Công Thức Mới</span>
        </button>
      </div>

      {/* Main Grid: SKU Picker & Recipe Details */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Col: Products / Drink List */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Danh mục F&B ({uniqueProducts.length})
            </span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lọc món F&B..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {uniqueProducts
              .filter(
                (p) =>
                  !searchTerm ||
                  p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((p) => {
                const isSelected = selectedSku === p.sku;
                return (
                  <button
                    key={p.sku}
                    onClick={() => {
                      setSelectedSku(p.sku);
                      setSelectedVersionId(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition cursor-pointer flex flex-col gap-0.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="font-mono text-[11px] opacity-80">{p.sku}</span>
                    <span className="truncate">{p.name}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Right 3 Cols: Recipe Versions & Multi-Level BOM */}
        <div className="lg:col-span-3 space-y-6">
          {activeVersion ? (
            <>
              {/* Recipe Version Banner */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {activeVersion.recipeCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {activeVersion.productName} — Phiên bản {activeVersion.version}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          activeVersion.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {activeVersion.status}
                      </span>
                      {activeVersion.isReferencedByTransactions && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Lock className="w-3 h-3" />
                          <span>Đã liên kết giao dịch (Bất biến)</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Hiệu lực: <strong className="font-mono text-slate-700">{activeVersion.effectiveFrom.substring(0, 10)}</strong> đến{' '}
                      <strong className="font-mono text-slate-700">
                        {activeVersion.effectiveTo ? activeVersion.effectiveTo.substring(0, 10) : 'Hiện tại'}
                      </strong>
                    </p>
                  </div>

                  {/* Version Picker Pills */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-medium">Phiên bản:</span>
                    {versionsForSku.map((v) => (
                      <button
                        key={v.versionId}
                        onClick={() => setSelectedVersionId(v.versionId)}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition cursor-pointer ${
                          v.versionId === activeVersion.versionId
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        v{v.version}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cost Variance Card */}
                {costCalculation && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div>
                      <span className="text-slate-500">Giá vốn Định mức (Standard Cost):</span>
                      <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                        {formatNumberWithDots(costCalculation.totalExpectedCost)} đ / {activeVersion.yieldUnit}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Giá vốn FIFO Thực tế (Actual FIFO):</span>
                      <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                        {formatNumberWithDots(costCalculation.totalActualFifoCost)} đ / {activeVersion.yieldUnit}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Chênh lệch Giá vốn (Cost Variance):</span>
                      <div
                        className={`text-sm font-mono font-bold mt-0.5 flex items-center gap-1 ${
                          costCalculation.totalCostVariance <= 0
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {costCalculation.totalCostVariance <= 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : (
                          <TrendingUp className="w-4 h-4" />
                        )}
                        <span>
                          {costCalculation.totalCostVariance > 0 ? '+' : ''}
                          {formatNumberWithDots(costCalculation.totalCostVariance)} đ
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recipe Direct Components */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Thành phần & Định mức Trực tiếp (Direct Components)
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                        <tr>
                          <th className="py-2 px-3">Mã SKU</th>
                          <th className="py-2 px-3">Tên Nguyên Liệu / Bán Thành Phẩm</th>
                          <th className="py-2 px-3">Loại</th>
                          <th className="py-2 px-3 text-right">Định Lượng</th>
                          <th className="py-2 px-3 text-right">Giá vốn Tiêu Chuẩn</th>
                          <th className="py-2 px-3">Chính Sách Trừ Kho</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {activeVersion.components.map((comp) => (
                          <tr key={comp.componentId} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-900">{comp.componentSku}</td>
                            <td className="py-2 px-3 font-sans text-slate-800">{comp.componentName}</td>
                            <td className="py-2 px-3 font-sans">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  comp.componentType === 'SEMI_FINISHED'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {comp.componentType === 'SEMI_FINISHED' ? 'Bán thành phẩm' : 'Nguyên liệu thô'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {comp.quantity} {comp.unit}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-900">
                              {formatNumberWithDots((comp.quantity * (comp.standardCost || 0)))} đ
                            </td>
                            <td className="py-2 px-3 font-sans text-slate-600 text-[11px]">
                              {comp.consumptionPolicy === 'ACCUMULATED_THRESHOLD'
                                ? `Tích lũy (Ngưỡng ${comp.consumptionThreshold} ${comp.unit})`
                                : 'Trừ tức thời từng đơn'}
                            </td>
                          </tr>
                        ))}
                        {activeVersion.packaging?.map((pkg, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-900">{pkg.packagingSku}</td>
                            <td className="py-2 px-3 font-sans text-slate-800">{pkg.packagingName}</td>
                            <td className="py-2 px-3 font-sans">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                Bao bì đóng gói
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {pkg.quantity} {pkg.unit}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-900">
                              {formatNumberWithDots(pkg.quantity * (pkg.standardCost || 0))} đ
                            </td>
                            <td className="py-2 px-3 font-sans text-slate-600 text-[11px]">
                              Trừ tức thời từng đơn
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Multi-Level BOM Tree Expansion */}
                {multiLevelBOM?.success && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4 text-indigo-600" />
                      <span>Cây Khai Triển Đa Cấp Thực Tế (Multi-Level Expanded BOM - Level 1 to N)</span>
                    </h4>
                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/30">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                          <tr>
                            <th className="py-2 px-3">Cấp bậc (Level)</th>
                            <th className="py-2 px-3">Mã SKU</th>
                            <th className="py-2 px-3">Tên Thành phần</th>
                            <th className="py-2 px-3 text-right">Tổng Định Lượng</th>
                            <th className="py-2 px-3">Chính Sách</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {multiLevelBOM.expandedComponents.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-sans text-slate-600">
                                <span className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-bold text-slate-800">
                                  L{item.level}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-900">{item.sku}</td>
                              <td className="py-2 px-3 font-sans text-slate-800">{item.name}</td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900">
                                {item.totalRequiredQuantity} {item.unit}
                              </td>
                              <td className="py-2 px-3 font-sans text-slate-600 text-[11px]">
                                {item.consumptionPolicy === 'ACCUMULATED_THRESHOLD'
                                  ? `Tích lũy ngưỡng ${item.consumptionThreshold} ${item.unit}`
                                  : 'Trừ tức thời (FIFO)'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p>Chưa chọn món hoặc không tìm thấy công thức định mức.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Recipe Version Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Tạo Phiên Bản Công Thức / Định Mức Mới
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecipe} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã SKU Món F&B</label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên Món F&B</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Phiên Bản Công Thức</label>
                  <input
                    type="text"
                    required
                    value={newRecipeCode}
                    onChange={(e) => setNewRecipeCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên Mô Tả Công Thức</label>
                  <input
                    type="text"
                    value={newRecipeName}
                    onChange={(e) => setNewRecipeName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sản lượng hoàn thành (Yield)</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={newYieldQty}
                    onChange={(e) => setNewYieldQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn vị hoàn thành</label>
                  <input
                    type="text"
                    value={newYieldUnit}
                    onChange={(e) => setNewYieldUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hiệu lực Từ Ngày</label>
                  <input
                    type="datetime-local"
                    value={newEffectiveFrom.substring(0, 16)}
                    onChange={(e) => setNewEffectiveFrom(e.target.value + ':00Z')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Components List Editor */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Thành phần định mức ({componentsList.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setComponentsList((prev) => [
                        ...prev,
                        {
                          componentId: `C-${Date.now()}`,
                          componentSku: 'NL-MOI',
                          componentName: 'Nguyên liệu mới',
                          componentType: 'RAW_MATERIAL',
                          quantity: 10,
                          unit: 'gam',
                          standardCost: 50,
                          consumptionPolicy: 'PER_TRANSACTION'
                        }
                      ]);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                  >
                    + Thêm thành phần
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {componentsList.map((comp, idx) => (
                    <div
                      key={comp.componentId}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Mã SKU"
                          value={comp.componentSku}
                          onChange={(e) => {
                            const val = e.target.value;
                            setComponentsList((prev) =>
                              prev.map((c, i) => (i === idx ? { ...c, componentSku: val } : c))
                            );
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Tên nguyên liệu"
                          value={comp.componentName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setComponentsList((prev) =>
                              prev.map((c, i) => (i === idx ? { ...c, componentName: val } : c))
                            );
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="SL"
                          value={comp.quantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setComponentsList((prev) =>
                              prev.map((c, i) => (i === idx ? { ...c, quantity: val } : c))
                            );
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="text"
                          placeholder="ĐVT"
                          value={comp.unit}
                          onChange={(e) => {
                            const val = e.target.value;
                            setComponentsList((prev) =>
                              prev.map((c, i) => (i === idx ? { ...c, unit: val } : c))
                            );
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={comp.consumptionPolicy || 'PER_TRANSACTION'}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setComponentsList((prev) =>
                              prev.map((c, i) => (i === idx ? { ...c, consumptionPolicy: val } : c))
                            );
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[11px]"
                        >
                          <option value="PER_TRANSACTION">Trừ tức thời</option>
                          <option value="ACCUMULATED_THRESHOLD">Tích lũy ngưỡng</option>
                        </select>
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setComponentsList((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="text-rose-500 hover:text-rose-700 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Xác nhận Tạo Công Thức
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
