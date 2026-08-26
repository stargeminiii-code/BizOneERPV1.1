import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { ArrowRight } from 'lucide-react';
import { RevenueOrdersChartPoint } from '../../types';
import { formatVND, formatCompactVND } from '../../services/dashboardViewModel';
import { useLanguage } from '../../i18n';

interface ExecutiveRevenueOrdersChartProps {
  data: RevenueOrdersChartPoint[];
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  granularity: 'day' | 'week' | 'month';
  onGranularityChange?: (g: 'day' | 'week' | 'month') => void;
  onViewAllOrders?: () => void;
}

const CustomTooltip = ({ active, payload, label, t }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload as RevenueOrdersChartPoint;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg border border-slate-800 text-xs min-w-[180px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-2 font-bold text-slate-200">
          <span>{dataPoint.fullDate || label}</span>
          <span className="text-slate-400 font-normal">BizOne ERP</span>
        </div>
        <div className="space-y-1 font-medium">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">{t('dashboard.revenueChart.revenueOnly')}:</span>
            <span className="font-bold text-slate-100">{formatVND(dataPoint.revenue)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">{t('dashboard.revenueChart.ordersOnly')}:</span>
            <span className="font-bold text-amber-300">{dataPoint.orders} {t('dashboard.channels.ordersUnit')}</span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800">
            <span className="text-slate-400">AOV:</span>
            <span className="font-bold text-emerald-400">{formatVND(dataPoint.aov)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ExecutiveRevenueOrdersChart: React.FC<ExecutiveRevenueOrdersChartProps> = ({
  data,
  totalRevenue,
  totalOrders,
  averageOrderValue,
  onViewAllOrders
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'all' | 'revenue' | 'orders'>('all');

  return (
    <div id="executive-revenue-chart-card" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
      {/* Header with Title & controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {t('dashboard.revenueChart.title')}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {t('dashboard.revenueChart.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View filter toggles */}
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              {t('dashboard.revenueChart.both')}
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeTab === 'revenue' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              {t('dashboard.revenueChart.revenueOnly')}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeTab === 'orders' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              {t('dashboard.revenueChart.ordersOnly')}
            </button>
          </div>

          {onViewAllOrders && (
            <button
              id="btn-view-all-orders-chart"
              onClick={onViewAllOrders}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer min-h-[30px]"
            >
              <span>{t('dashboard.revenueChart.viewOrders')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Micro-strip */}
      <div className="grid grid-cols-3 gap-2 py-2.5 bg-slate-50 rounded-lg px-3 my-3 border border-slate-100 text-xs">
        <div>
          <span className="text-slate-500 block font-medium text-[11px]">{t('dashboard.revenueChart.totalRevenue')}</span>
          <span className="text-slate-900 font-bold sm:text-sm">{formatVND(totalRevenue)}</span>
        </div>
        <div>
          <span className="text-slate-500 block font-medium text-[11px]">{t('dashboard.revenueChart.totalOrders')}</span>
          <span className="text-slate-900 font-bold sm:text-sm">{totalOrders} {t('dashboard.channels.ordersUnit')}</span>
        </div>
        <div>
          <span className="text-slate-500 block font-medium text-[11px]">{t('dashboard.revenueChart.aov')}</span>
          <span className="text-emerald-700 font-bold sm:text-sm">{formatVND(averageOrderValue)}</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full mt-2">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            {t('dashboard.revenueChart.empty')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                tick={{ fill: '#64748B', fontSize: 11 }}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCompactVND(v)}
                tick={{ fill: '#64748B', fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#D97706', fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip t={t} />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
              />
              {(activeTab === 'all' || activeTab === 'revenue') && (
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  name={t('dashboard.revenueChart.revenueLegend')}
                  fill="#334155"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
              )}
              {(activeTab === 'all' || activeTab === 'orders') && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  name={t('dashboard.revenueChart.ordersLegend')}
                  stroke="#D97706"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#D97706' }}
                  activeDot={{ r: 4 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
