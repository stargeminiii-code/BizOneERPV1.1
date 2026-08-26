import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { ConsumptionService } from '../../services/fnb/consumptionService';
import { ConsumptionEvent, AccumulatedConsumptionState } from '../../types';
import { formatNumberWithDots } from '../../data/administrativeData';

interface ConsumptionLedgerViewProps {
  tenantId?: string;
  warehouseId?: string;
}

export const ConsumptionLedgerView: React.FC<ConsumptionLedgerViewProps> = ({
  tenantId = 'TENANT-DEFAULT',
  warehouseId = 'WH01'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPolicy, setFilterPolicy] = useState<'ALL' | 'PER_TRANSACTION' | 'ACCUMULATED_THRESHOLD'>('ALL');
  const [refreshKey, setRefreshKey] = useState(0);

  const ledger = useMemo(() => {
    return ConsumptionService.getLedger(tenantId);
  }, [tenantId, refreshKey]);

  const accumulationStates = useMemo(() => {
    return ConsumptionService.getAllAccumulationStates(tenantId);
  }, [tenantId, refreshKey]);

  const filteredLedger = useMemo(() => {
    return ledger.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.componentSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.orderCode && item.orderCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.productSku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPolicy = filterPolicy === 'ALL' || item.policy === filterPolicy;
      return matchSearch && matchPolicy;
    });
  }, [ledger, searchTerm, filterPolicy]);

  const handleFlushRemainder = (state: AccumulatedConsumptionState) => {
    if (state.pendingQuantity <= 0) {
      alert('Số lượng tồn đọng hiện tại bằng 0, không cần xả kho.');
      return;
    }

    const confirm = window.confirm(
      `Bạn có chắc chắn muốn xuất trừ phần tồn đọng ${state.pendingQuantity} ${state.unit} của ${state.sku} cho kiểm kê thực tế?`
    );
    if (!confirm) return;

    ConsumptionService.flushPendingAccumulation(
      tenantId,
      state.warehouseId,
      state.sku,
      'Thủ kho (Kiểm kê cuối ca)'
    );

    alert(`Đã xuất kho phần tồn đọng ${state.pendingQuantity} ${state.unit}!`);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Sổ Cái Tiêu Hao & Theo Dõi Tích Lũy Ngưỡng (Consumption Ledger & Accumulator)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận bất biến mọi lượt xuất tiêu hao nguyên liệu F&B; theo dõi các mặt hàng xuất theo gói/lon tích lũy (như Sữa đặc 500g, Bột 1kg).
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới Sổ Cái</span>
        </button>
      </div>

      {/* Threshold Accumulator Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Trạng thái Tích lũy Ngưỡng Định lượng (Threshold Accumulation Monitors)
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {accumulationStates.length} mặt hàng đang theo dõi tích lũy
          </span>
        </div>

        {accumulationStates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accumulationStates.map((state) => {
              const percent = Math.min(
                100,
                Math.round((state.pendingQuantity / (state.thresholdQuantity || 1)) * 100)
              );
              return (
                <div
                  key={`${state.warehouseId}-${state.componentSku}`}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        {state.componentSku}
                      </div>
                      <div className="text-xs text-slate-700 font-medium mt-0.5">
                        {state.componentName || state.componentSku}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded text-[10px] font-bold">
                      Ngưỡng: {state.thresholdQuantity} {state.unit}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Đang chờ tích lũy:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {state.pendingQuantity} / {state.thresholdQuantity} {state.unit} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          percent >= 80 ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <div>
                      Tổng tiêu hao: <strong className="font-mono text-slate-800">{state.accumulatedQuantity} {state.unit}</strong>
                    </div>
                    <div>
                      Đã xuất kho: <strong className="font-mono text-slate-800">{state.totalIssuedQuantity} {state.unit}</strong>
                    </div>
                  </div>

                  {state.pendingQuantity > 0 && (
                    <button
                      onClick={() => handleFlushRemainder(state)}
                      className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md text-[11px] font-semibold transition cursor-pointer"
                    >
                      Xuất kho phần dở dang ({state.pendingQuantity} {state.unit})
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-lg">
            Chưa có mặt hàng nào tích lũy tiêu hao. Khi thực hiện bán hàng các món có nguyên liệu tích lũy (như Sữa đặc), trạng thái sẽ tự động xuất hiện tại đây.
          </div>
        )}
      </div>

      {/* Append-Only Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Nhật Ký Tiêu Hao Bất Biến ({filteredLedger.length} bản ghi)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã đơn, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <select
              value={filterPolicy}
              onChange={(e) => setFilterPolicy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">Tất cả chính sách</option>
              <option value="PER_TRANSACTION">Trừ tức thời (FIFO)</option>
              <option value="ACCUMULATED_THRESHOLD">Tích lũy theo ngưỡng</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
              <tr>
                <th className="py-2.5 px-3">Mã Nhật Ký</th>
                <th className="py-2.5 px-3">Mã Đơn Hàng</th>
                <th className="py-2.5 px-3">Món Bán Ra</th>
                <th className="py-2.5 px-3">Nguyên Liệu Tiêu Hao</th>
                <th className="py-2.5 px-3 text-right">Lượng Tiêu Hao</th>
                <th className="py-2.5 px-3">Chính Sách</th>
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLedger.map((item) => (
                <tr key={item.eventId} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{item.eventId}</td>
                  <td className="py-2.5 px-3 font-semibold text-indigo-700">{item.orderCode || item.orderId}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-800">{item.productSku}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-800">
                    <div className="font-semibold">{item.componentName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{item.componentSku}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.policy === 'ACCUMULATED_THRESHOLD'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {item.policy === 'ACCUMULATED_THRESHOLD' ? 'Tích lũy' : 'Trừ tức thời'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                    {item.timestamp.substring(0, 16).replace('T', ' ')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.status === 'ISSUED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {item.status === 'ISSUED' ? 'Đã xuất kho' : 'Đang tích lũy'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    Chưa có lượt tiêu hao nào được ghi nhận trong sổ cái.
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
