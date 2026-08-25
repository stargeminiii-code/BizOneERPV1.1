import React, { useMemo } from 'react';
import { AlertTriangle, Boxes, CheckCircle2, Clock, DollarSign, Layers, Package, TrendingUp, X } from 'lucide-react';
import { InventoryLayer, Product } from '../../types';

export type DashboardSummaryKey =
  | 'kpi-rev'
  | 'kpi-profit'
  | 'kpi-cash'
  | 'kpi-debt'
  | 'kpi-inv'
  | 'kpi-order'
  | 'kpi-cust'
  | 'kpi-prod'
  | 'kpi-otif'
  | 'kpi-cskh'
  | 'kpi-cost'
  | 'kpi-overall';

export interface DashboardSummaryData {
  key: DashboardSummaryKey;
  title: string;
  actual: string;
  plan: string;
  gap: string;
  achievementRate: number;
  status?: 'excellent' | 'good' | 'warning' | 'critical';
  description?: string;
}

interface Props {
  data: DashboardSummaryData | null;
  products: Product[];
  inventoryLots: InventoryLayer[];
  onClose: () => void;
  onViewDetail?: (key: DashboardSummaryKey) => void;
}

const qtyOf = (l: InventoryLayer) => Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0;
const costOf = (l: InventoryLayer) => Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
const money = (v: number) => new Intl.NumberFormat('vi-VN').format(Math.round(v)) + ' đ';

export const DashboardDataSummaryPanel: React.FC<Props> = ({ data, products, inventoryLots, onClose, onViewDetail }) => {
  const inventory = useMemo(() => {
    const active = inventoryLots.filter((l) => qtyOf(l) > 0 && l.status !== 'locked');
    const stockBySku = new Map<string, number>();
    active.forEach((l) => stockBySku.set(l.sku, (stockBySku.get(l.sku) || 0) + qtyOf(l)));

    const fifoValue = active.reduce((sum, l) => sum + qtyOf(l) * costOf(l), 0);
    const quantity = active.reduce((sum, l) => sum + qtyOf(l), 0);
    const now = Date.now();
    const agedValue = active.reduce((sum, l) => {
      const received = new Date(l.receivedAt || l.intakeDate || l.createdAt || '').getTime();
      return Number.isFinite(received) && now - received >= 90 * 86400000 ? sum + qtyOf(l) * costOf(l) : sum;
    }, 0);
    const lowStock = products.filter((p) => {
      const q = stockBySku.get(p.sku) || 0;
      return q > 0 && q <= Number(p.minStock ?? 0);
    }).length;
    const outOfStock = products.filter((p) => (stockBySku.get(p.sku) || 0) <= 0).length;
    const top = [...active.reduce((m, l) => {
      const current = m.get(l.sku) || { sku: l.sku, name: l.productName, value: 0, qty: 0 };
      current.value += qtyOf(l) * costOf(l);
      current.qty += qtyOf(l);
      m.set(l.sku, current);
      return m;
    }, new Map<string, { sku: string; name: string; value: number; qty: number }>()).values()]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { quantity, fifoValue, agedValue, lowStock, outOfStock, activeLayers: active.length, top };
  }, [inventoryLots, products]);

  if (!data) return null;

  const statusLabel = data.status === 'critical' ? 'Nguy cơ' : data.status === 'warning' ? 'Cảnh báo' : data.status === 'excellent' ? 'Tốt' : 'Ổn định';
  const statusClass = data.status === 'critical'
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : data.status === 'warning'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <div className="relative bg-white rounded-2xl border-2 border-blue-500/70 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">Dashboard Summary</span>
            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black ${statusClass}`}>{statusLabel}</span>
          </div>
          <h3 className="text-sm sm:text-base font-black truncate mt-0.5">{data.title}</h3>
        </div>
        <button type="button" onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 transition-colors" aria-label="Đóng tóm tắt">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Metric label="Thực hiện" value={data.actual} />
          <Metric label="Kế hoạch" value={data.plan} />
          <Metric label="Độ lệch" value={data.gap} />
          <Metric label="Đạt" value={`${data.achievementRate}%`} />
        </div>

        {data.description && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            {data.description}
          </div>
        )}

        {data.key === 'kpi-inv' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <MiniStat icon={<Package className="w-3.5 h-3.5" />} label="SL tồn" value={inventory.quantity.toLocaleString('vi-VN')} />
              <MiniStat icon={<DollarSign className="w-3.5 h-3.5" />} label="Giá trị FIFO" value={money(inventory.fifoValue)} />
              <MiniStat icon={<Clock className="w-3.5 h-3.5" />} label="Tồn >90 ngày" value={money(inventory.agedValue)} />
              <MiniStat icon={<Layers className="w-3.5 h-3.5" />} label="FIFO Layers" value={inventory.activeLayers.toLocaleString('vi-VN')} />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Sắp hết hàng</span>
                <strong className="text-amber-700">{inventory.lowStock}</strong>
              </div>
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Hết hàng</span>
                <strong className="text-rose-700">{inventory.outOfStock}</strong>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-black text-slate-800"><TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Top giá trị tồn FIFO</div>
              <div className="space-y-1.5">
                {inventory.top.map((item) => (
                  <div key={item.sku} className="flex items-center justify-between gap-3 text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="truncate font-semibold text-slate-700">{item.sku} · {item.name}</span>
                    <strong className="shrink-0 text-slate-900">{money(item.value)}</strong>
                  </div>
                ))}
                {inventory.top.length === 0 && <span className="text-xs text-slate-400">Chưa có dữ liệu tồn kho.</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Nguồn tóm tắt: Product Master → SKU → Warehouse → Inventory/FIFO Layers.
            </div>
          </div>
        )}

        {data.status === 'critical' && (
          <div className="flex items-start gap-2 p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Chỉ số đang ở trạng thái cần xử lý. Xem chi tiết chỉ được mở khi người dùng chủ động yêu cầu.</span>
          </div>
        )}

        {onViewDetail && (
          <div className="flex justify-end pt-1">
            <button type="button" onClick={() => onViewDetail(data.key)} className="text-xs font-black text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5" /> Xem chi tiết
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 min-w-0">
    <div className="text-[9px] uppercase font-bold text-slate-500">{label}</div>
    <div className="text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5">{value}</div>
  </div>
);

const MiniStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-slate-500">{icon}{label}</div>
    <div className="text-xs font-black text-slate-900 mt-1 truncate">{value}</div>
  </div>
);
