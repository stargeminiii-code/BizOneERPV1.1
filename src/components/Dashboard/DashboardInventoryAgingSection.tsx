import React, { useState, useMemo } from 'react';
import {
  Clock,
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ArrowUpRight,
  Filter,
  Search,
  Warehouse as WarehouseIcon,
  Package,
  Calendar,
  DollarSign
} from 'lucide-react';
import { InventoryLayer, Product, InventoryAgingBucket } from '../../types';

interface DashboardInventoryAgingSectionProps {
  inventoryLots: InventoryLayer[];
  products: Product[];
  onSelectSku?: (sku: string) => void;
  onSelectLot?: (lot: InventoryLayer) => void;
  onDrilldownBucket?: (bucket: InventoryAgingBucket) => void;
}

export const DashboardInventoryAgingSection: React.FC<DashboardInventoryAgingSectionProps> = ({
  inventoryLots,
  products,
  onSelectSku,
  onSelectLot,
  onDrilldownBucket
}) => {
  const [selectedBucket, setSelectedBucket] = useState<InventoryAgingBucket | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const formatVND = (v: number) => {
    const val = Number(v) || 0;
    return new Intl.NumberFormat('vi-VN').format(isNaN(val) ? 0 : val) + ' đ';
  };

  const now = new Date('2026-08-16').getTime();

  // Active lots with remaining quantity
  const activeLots = useMemo(() => {
    return inventoryLots.filter((l) => (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0) > 0);
  }, [inventoryLots]);

  // Compute aging days and bucket for each active lot
  const lotsWithAging = useMemo(() => {
    return activeLots.map((l) => {
      const intakeDateStr = l.receivedAt || l.intakeDate || l.createdAt || '2026-08-01';
      const intakeTime = new Date(intakeDateStr).getTime();
      const diffDays = Math.max(0, Math.floor((now - intakeTime) / (1000 * 3600 * 24)));

      let bucket: InventoryAgingBucket = 'under_7d';
      let priority: 'normal' | 'monitor' | 'priority_out' | 'high_priority' | 'warning_stale' | 'critical_stale' = 'normal';
      let priorityLabel = 'Bình thường';
      let priorityColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';

      if (diffDays < 7) {
        bucket = 'under_7d';
        priority = 'normal';
        priorityLabel = 'FIFO Chuẩn';
        priorityColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      } else if (diffDays >= 7 && diffDays <= 30) {
        bucket = '7_30d';
        priority = 'normal';
        priorityLabel = 'FIFO Chuẩn';
        priorityColor = 'bg-teal-50 text-teal-700 border-teal-200';
      } else if (diffDays > 30 && diffDays <= 90) {
        bucket = '30_90d';
        priority = 'monitor';
        priorityLabel = 'Theo dõi xuất';
        priorityColor = 'bg-amber-50 text-amber-700 border-amber-200';
      } else if (diffDays > 90 && diffDays <= 180) {
        bucket = '90_180d';
        priority = 'priority_out';
        priorityLabel = 'Ưu tiên xuất';
        priorityColor = 'bg-orange-50 text-orange-700 border-orange-200';
      } else if (diffDays > 180 && diffDays <= 360) {
        bucket = '180_360d';
        priority = 'high_priority';
        priorityLabel = 'Ưu tiên cao';
        priorityColor = 'bg-rose-50 text-rose-700 border-rose-200';
      } else if (diffDays > 360 && diffDays <= 720) {
        bucket = '1_2y';
        priority = 'warning_stale';
        priorityLabel = 'Cảnh báo tồn lâu';
        priorityColor = 'bg-red-50 text-red-700 border-red-200';
      } else {
        bucket = 'over_2y';
        priority = 'critical_stale';
        priorityLabel = 'Rất cần xử lý';
        priorityColor = 'bg-purple-50 text-purple-700 border-purple-200';
      }

      const qty = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0;
      const unitCost = Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
      const fifoValue = qty * unitCost;

      return {
        ...l,
        diffDays,
        bucket,
        priority,
        priorityLabel,
        priorityColor,
        quantity: qty,
        unitCost,
        fifoValue
      };
    });
  }, [activeLots, now]);

  // Aggregate stats across the 7 buckets
  const bucketStats = useMemo(() => {
    const stats: Record<
      InventoryAgingBucket,
      {
        key: InventoryAgingBucket;
        label: string;
        range: string;
        count: number;
        qty: number;
        val: number;
        priorityBadge: string;
        colorHex: string;
      }
    > = {
      under_7d: {
        key: 'under_7d',
        label: '< 7 ngày',
        range: 'Dưới 1 tuần',
        count: 0,
        qty: 0,
        val: 0,
        priorityBadge: 'FIFO bình thường',
        colorHex: '#10b981'
      },
      '7_30d': {
        key: '7_30d',
        label: '7 – 30 ngày',
        range: '1 tuần – 1 tháng',
        count: 0,
        qty: 0,
        val: 0,
        priorityBadge: 'FIFO bình thường',
        colorHex: '#0d9488'
      },
      '30_90d': {
        key: '30_90d',
        label: '30 – 90 ngày',
        range: '1 – 3 tháng',
        count: 0,
        qty: 0,
        val: 0,
        priorityBadge: 'Cần theo dõi',
        colorHex: '#f59e0b'
      },
      '90_180d': {
        key: '90_180d',
        label: '90 – 180 ngày',
        range: '3 – 6 tháng',
        count: 0,
        qty: 0,
        val: 0,
        priorityBadge: 'Ưu tiên xuất',
        colorHex: '#f97316'
      },
      '180_360d': {
        key: '180_360d',
        label: '180 – 360 ngày',
        range: '6 tháng – 1 năm',
        count: 0,
        qty: 0,
        val: 0,
        priorityBadge: 'Ưu tiên cao',
        colorHex: '#e11d48'
      },
      '1_2y': {
        key: '1_2y',
        label: '1 – 2 năm',
        range: '360 – 720 ngày',
        count: 0,
        qty: 0,
        val: 0,
        priorityBadge: 'Cảnh báo tồn lâu',
        colorHex: '#b91c1c'
      },
      over_2y: {
        key: 'over_2y',
        label: '> 2 năm',
        range: 'Trên 720 ngày',
        count: 0,
        qty: 0,
        val: 0,
        priorityBadge: 'Rất cần xử lý',
        colorHex: '#7e22ce'
      }
    };

    lotsWithAging.forEach((l) => {
      const b = stats[l.bucket];
      if (b) {
        b.count += 1;
        b.qty += l.quantity;
        b.val += l.fifoValue;
      }
    });

    return stats;
  }, [lotsWithAging]);

  const totalInventoryVal = useMemo(() => {
    return lotsWithAging.reduce((sum, l) => sum + l.fifoValue, 0);
  }, [lotsWithAging]);

  // Filter lots by bucket and search
  const filteredLots = useMemo(() => {
    let list = lotsWithAging;
    if (selectedBucket !== 'ALL') {
      list = list.filter((l) => l.bucket === selectedBucket);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (l) =>
          (l.sku && l.sku.toLowerCase().includes(q)) ||
          (l.productName && l.productName.toLowerCase().includes(q)) ||
          (l.layerId && l.layerId.toLowerCase().includes(q)) ||
          (l.warehouse && l.warehouse.toLowerCase().includes(q)) ||
          (l.warehouseName && l.warehouseName.toLowerCase().includes(q))
      );
    }
    // Sort oldest first
    return list.sort((a, b) => b.diffDays - a.diffDays);
  }, [lotsWithAging, selectedBucket, searchTerm]);

  return (
    <div id="dashboard-fifo-aging-section" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-100 text-blue-700">
              <Clock className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              7 Nhóm Tuổi Tồn FIFO & Lớp Hàng Cần Ưu Tiên Xuất
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân loại tuổi tồn chuẩn xác theo 7 khung thời gian để tối ưu luân chuyển hàng hóa và hạn chế tồn đọng.
          </p>
        </div>

        {selectedBucket !== 'ALL' && (
          <button
            onClick={() => setSelectedBucket('ALL')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            ✕ Xem tất cả 7 nhóm
          </button>
        )}
      </div>

      {/* Visual Proportional Distribution Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
          <span>Tỷ lệ giá trị tồn theo tuổi</span>
          <span>Tổng giá trị FIFO: {formatVND(totalInventoryVal)}</span>
        </div>
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {(Object.keys(bucketStats) as InventoryAgingBucket[]).map((key) => {
            const b = bucketStats[key];
            const pct = totalInventoryVal > 0 ? (b.val / totalInventoryVal) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <div
                key={key}
                title={`${b.label}: ${formatVND(b.val)} (${pct.toFixed(1)}%)`}
                style={{ width: `${pct}%`, backgroundColor: b.colorHex }}
                className="h-full transition-all hover:opacity-85 cursor-pointer"
                onClick={() => {
                  setSelectedBucket(key);
                  if (onDrilldownBucket) onDrilldownBucket(key);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* 7 Interactive Bucket Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {(Object.keys(bucketStats) as InventoryAgingBucket[]).map((key) => {
          const b = bucketStats[key];
          const isSelected = selectedBucket === key;
          return (
            <div
              key={key}
              onClick={() => {
                setSelectedBucket(isSelected ? 'ALL' : key);
                if (onDrilldownBucket) onDrilldownBucket(key);
              }}
              className={`p-3 rounded-xl border transition cursor-pointer text-left flex flex-col justify-between ${
                isSelected
                  ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-extrabold text-slate-900">{b.label}</span>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: b.colorHex }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 mb-2">{b.priorityBadge}</div>
                <div className="text-xs sm:text-sm font-black text-slate-900">{formatVND(b.val)}</div>
              </div>
              <div className="text-[10px] font-bold text-slate-500 mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5">
                <span>{b.qty.toLocaleString()} SL</span>
                <span className="font-mono">{b.count} Lot</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drill-down Table for selected Bucket */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/30">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-800">
              Danh Sách Lô FIFO Chi Tiết ({filteredLots.length} Lô)
            </span>
            {selectedBucket !== 'ALL' && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Nhóm: {bucketStats[selectedBucket].label} ({bucketStats[selectedBucket].priorityBadge})
              </span>
            )}
          </div>

          <div className="w-full sm:w-64">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm SKU / Tên SP / Mã Lô..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-white text-[10px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="py-2.5 px-3">STT</th>
                <th className="py-2.5 px-3">KHO HÀNG</th>
                <th className="py-2.5 px-3">VỊ TRÍ (BIN)</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">TÊN SẢN PHẨM</th>
                <th className="py-2.5 px-3">MÃ LÔ FIFO</th>
                <th className="py-2.5 px-3">NGÀY NHẬP</th>
                <th className="py-2.5 px-3 text-center">TUỔI TỒN</th>
                <th className="py-2.5 px-3 text-right">SL CÒN</th>
                <th className="py-2.5 px-3 text-right">GIÁ FIFO</th>
                <th className="py-2.5 px-3 text-right">GIÁ TRỊ TỒN</th>
                <th className="py-2.5 px-3 text-center">ƯU TIÊN XUẤT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs bg-white">
              {filteredLots.map((l, idx) => (
                <tr key={l.id || idx} className="hover:bg-blue-50/40 transition">
                  <td className="py-2.5 px-3 text-slate-400 font-medium">{idx + 1}</td>
                  <td className="py-2.5 px-3 text-slate-800 font-semibold">{l.warehouseName || l.warehouse || 'Kho chính'}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">{l.locationCode || l.location || 'Khu A - Ô 01'}</td>
                  <td
                    onClick={() => onSelectSku && onSelectSku(l.sku)}
                    className="py-2.5 px-3 font-mono font-bold text-blue-700 cursor-pointer hover:underline"
                  >
                    {l.sku}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{l.productName}</td>
                  <td
                    onClick={() => onSelectLot && onSelectLot(l)}
                    className="py-2.5 px-3 font-mono text-slate-700 cursor-pointer hover:underline"
                  >
                    {l.layerId || l.lotId}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{l.receivedAt || l.intakeDate || '2026-08-01'}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                    {l.diffDays} ngày
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">{l.quantity} {l.unit || 'Cái'}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatVND(l.unitCost)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">{formatVND(l.fifoValue)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${l.priorityColor}`}>
                      {l.priorityLabel}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLots.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-xs text-slate-400">
                    Không tìm thấy lô hàng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
