import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Warehouse as WarehouseIcon,
  Layers,
  Package,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Boxes,
  Maximize2
} from 'lucide-react';
import {
  WarehouseLocation,
  SkuLocationAllocation,
  Warehouse,
  Product,
  InventoryLayer
} from '../../types';

interface DashboardLocationMatrixSectionProps {
  locations: WarehouseLocation[];
  allocations: SkuLocationAllocation[];
  warehouses: Warehouse[];
  products: Product[];
  inventoryLots: InventoryLayer[];
  onSelectSku?: (sku: string) => void;
  onSelectLocation?: (location: WarehouseLocation) => void;
}

export const DashboardLocationMatrixSection: React.FC<DashboardLocationMatrixSectionProps> = ({
  locations,
  allocations,
  warehouses,
  products,
  inventoryLots,
  onSelectSku,
  onSelectLocation
}) => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('WH03'); // Default Kho HCM
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<WarehouseLocation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'matrix' | 'sku_multi_location'>('matrix');

  const formatVND = (v: number) => {
    const val = Number(v) || 0;
    return new Intl.NumberFormat('vi-VN').format(isNaN(val) ? 0 : val) + ' đ';
  };

  // Filter locations for selected warehouse
  const whLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (selectedWarehouseId !== 'ALL' && loc.warehouseId !== selectedWarehouseId) return false;
      if (selectedZone !== 'ALL' && !loc.zone.includes(selectedZone)) return false;
      return true;
    });
  }, [locations, selectedWarehouseId, selectedZone]);

  // Aggregate items in each location
  const locationItemMap = useMemo(() => {
    const map = new Map<string, SkuLocationAllocation[]>();
    allocations.forEach((alloc) => {
      const code = alloc.locationCode;
      if (!map.has(code)) map.set(code, []);
      map.get(code)!.push(alloc);
    });
    return map;
  }, [allocations]);

  // Distinct zones in this warehouse
  const availableZones = useMemo(() => {
    const zoneSet = new Set<string>();
    locations
      .filter((loc) => selectedWarehouseId === 'ALL' || loc.warehouseId === selectedWarehouseId)
      .forEach((loc) => zoneSet.add(loc.zone));
    return Array.from(zoneSet);
  }, [locations, selectedWarehouseId]);

  // SKU Multi-location aggregation (Group allocations by SKU)
  const skuMultiLocationGroup = useMemo(() => {
    const map = new Map<
      string,
      {
        sku: string;
        productName: string;
        variant?: string;
        totalQty: number;
        totalValue: number;
        locations: SkuLocationAllocation[];
      }
    >();

    allocations.forEach((alloc) => {
      if (!map.has(alloc.sku)) {
        map.set(alloc.sku, {
          sku: alloc.sku,
          productName: alloc.productName,
          variant: alloc.variant,
          totalQty: 0,
          totalValue: 0,
          locations: []
        });
      }
      const item = map.get(alloc.sku)!;
      item.totalQty += alloc.quantity;
      item.totalValue += alloc.quantity * alloc.unitCost;
      item.locations.push(alloc);
    });

    return Array.from(map.values());
  }, [allocations]);

  // Selected location's item allocations
  const activeLocationItems = selectedLocation ? locationItemMap.get(selectedLocation.code) || [] : [];
  const activeLocationTotalQty = activeLocationItems.reduce((sum, it) => sum + it.quantity, 0);
  const activeLocationTotalVal = activeLocationItems.reduce((sum, it) => sum + it.quantity * it.unitCost, 0);

  return (
    <div id="dashboard-location-matrix-section" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-rose-100 text-rose-700">
              <MapPin className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Quản Trị Vị Trí Hàng Hóa Trong Kho (Bin & Location Matrix)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu trúc phân cấp 5 tầng: <strong>Kho → Khu vực → Kệ → Tầng → Ô/Vị trí</strong>. Theo dõi chính xác vị trí và phân bổ của từng SKU & Lô hàng.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                viewMode === 'matrix' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ma trận Kệ/Ô
            </button>
            <button
              onClick={() => setViewMode('sku_multi_location')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                viewMode === 'sku_multi_location' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SKU Đa Vị Trí
            </button>
          </div>
        </div>
      </div>

      {/* Warehouse & Zone Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
            <WarehouseIcon className="w-3.5 h-3.5 text-blue-600" />
            Chọn kho:
          </span>
          <select
            value={selectedWarehouseId}
            onChange={(e) => {
              setSelectedWarehouseId(e.target.value);
              setSelectedZone('ALL');
              setSelectedLocation(null);
            }}
            className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">🏢 Tất cả kho</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <span className="text-xs font-bold text-slate-600 ml-2">Khu vực:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">📍 Tất cả khu vực</option>
            {availableZones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-600">
          Hiển thị: <strong>{whLocations.length}</strong> vị trí lưu trữ
        </div>
      </div>

      {/* VIEW 1: MATRIX OF RACKS & BINS */}
      {viewMode === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Cols: Location Grid */}
          <div className="lg:col-span-2 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {whLocations.map((loc) => {
                const items = locationItemMap.get(loc.code) || [];
                const totalQty = items.reduce((sum, it) => sum + it.quantity, 0);
                const isSelected = selectedLocation?.id === loc.id;
                const isOccupied = items.length > 0;

                return (
                  <div
                    key={loc.id}
                    onClick={() => {
                      setSelectedLocation(loc);
                      if (onSelectLocation) onSelectLocation(loc);
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer text-left flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/30 shadow-md'
                        : isOccupied
                        ? 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs'
                        : 'border-dashed border-slate-200 bg-slate-50/50 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-mono font-black text-blue-800">{loc.code}</span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                            isOccupied
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isOccupied ? `${items.length} SKU` : 'Trống'}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-700 truncate">{loc.zone}</div>
                      <div className="text-[10px] text-slate-500">
                        {loc.rack} • {loc.shelf} • {loc.bin}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-500 font-medium">SL đang chứa:</span>
                      <span className="font-mono font-black text-slate-900">
                        {totalQty > 0 ? `${totalQty.toLocaleString()}` : '0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Col: Location Deep Inspection Box */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Chi tiết ô/vị trí:</span>
                <h4 className="text-sm font-extrabold text-slate-900">
                  {selectedLocation ? selectedLocation.code : 'Chọn một vị trí trên sơ đồ'}
                </h4>
              </div>
              {selectedLocation && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {activeLocationItems.length} SKU đang lưu
                </span>
              )}
            </div>

            {selectedLocation ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Kho & Khu:</span>
                    <div className="font-semibold text-slate-800 truncate">{selectedLocation.warehouseName}</div>
                    <div className="text-[10px] text-slate-500 truncate">{selectedLocation.zone}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Tổng giá trị FIFO:</span>
                    <div className="font-mono font-black text-blue-900">{formatVND(activeLocationTotalVal)}</div>
                    <div className="text-[10px] font-bold text-slate-600">{activeLocationTotalQty} SL</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-700">Mặt hàng tại vị trí này:</span>
                  {activeLocationItems.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="bg-white p-3 rounded-xl border border-slate-200 hover:border-blue-400 transition space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          onClick={() => onSelectSku && onSelectSku(it.sku)}
                          className="font-mono font-bold text-xs text-blue-700 cursor-pointer hover:underline"
                        >
                          {it.sku}
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {it.quantity} SL
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 truncate">{it.productName}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-50">
                        <span>Lô: {it.lotId}</span>
                        <span>Đơn giá: {formatVND(it.unitCost)}</span>
                      </div>
                    </div>
                  ))}
                  {activeLocationItems.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                      Vị trí này hiện đang trống.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-400">
                Nhấp vào bất kỳ ô vị trí nào bên trái để xem danh sách SKU, Lot FIFO và giá trị tồn tại chỗ.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: SKU STORED IN MULTIPLE LOCATIONS */}
      {viewMode === 'sku_multi_location' && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 flex items-center gap-3">
            <Boxes className="w-5 h-5 text-blue-700 shrink-0" />
            <div className="text-xs text-blue-900">
              <strong>Phân bổ 1 SKU tại nhiều vị trí khác nhau:</strong> Hệ thống tự động phân rã số lượng tồn của từng SKU theo từng Kệ, Tầng, Ô và Lô nhập để thủ kho có thể tìm kiếm và xuất hàng chính xác nhất.
            </div>
          </div>

          <div className="space-y-3">
            {skuMultiLocationGroup.map((grp) => (
              <div key={grp.sku} className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => onSelectSku && onSelectSku(grp.sku)}
                        className="font-mono font-black text-xs text-blue-700 cursor-pointer hover:underline"
                      >
                        {grp.sku}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{grp.productName}</span>
                    </div>
                    {grp.variant && (
                      <span className="text-[10px] font-semibold text-slate-500">Phân loại: {grp.variant}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tổng tồn trên toàn kho:</span>
                    <div className="text-sm font-black text-blue-950">
                      {grp.totalQty.toLocaleString()} SL ({formatVND(grp.totalValue)})
                    </div>
                  </div>
                </div>

                {/* Sub-allocations */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {grp.locations.map((loc, idx) => (
                    <div key={loc.id || idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-800">{loc.locationCode}</span>
                        <span className="font-mono font-black text-emerald-700">{loc.quantity} SL</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{loc.zone}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1">
                        <span>Lô: {loc.lotId}</span>
                        <span>{formatVND(loc.unitCost)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
