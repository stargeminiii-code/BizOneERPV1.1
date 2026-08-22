import React from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  ArrowUpRight,
  Download,
  Calendar
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const PnlView: React.FC = () => {
  const pnlMonthlyData = [
    { month: 'T5', doanhThu: 110.5, giaVon: 70.2, chiPhi: 14.5, loiNhuanRong: 25.8 },
    { month: 'T6', doanhThu: 125.0, giaVon: 79.5, chiPhi: 15.0, loiNhuanRong: 30.5 },
    { month: 'T7', doanhThu: 118.2, giaVon: 75.0, chiPhi: 14.2, loiNhuanRong: 29.0 },
    { month: 'T8', doanhThu: 135.4, giaVon: 86.0, chiPhi: 16.1, loiNhuanRong: 33.3 },
    { month: 'T9', doanhThu: 142.0, giaVon: 90.5, chiPhi: 17.0, loiNhuanRong: 34.5 },
    { month: 'T10 (Nay)', doanhThu: 124.5, giaVon: 79.3, chiPhi: 15.2, loiNhuanRong: 30.0 }
  ];

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            P&L
          </h1>
        </div>

        <button
          onClick={() => alert('Xuất báo cáo tài chính P&L định dạng Excel')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Xuất báo cáo P&L</span>
        </button>
      </div>

      {/* Financial Statement Table Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">DOANH THU THUẦN</p>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">124,500,000 đ</div>
          <span className="text-xs font-semibold text-emerald-600">↑ 12.5% so với kỳ trước</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">GIÁ VỐN HÀNG BÁN (COGS)</p>
          <div className="text-2xl font-extrabold text-slate-700 mt-2">79,300,000 đ</div>
          <span className="text-xs text-slate-400 font-medium">Chiếm 63.7% doanh thu</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">LỢI NHUẬN GỘP</p>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">45,200,000 đ</div>
          <span className="text-xs font-bold text-emerald-600">Biên LN gộp: 36.3%</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">LỢI NHUẬN RÒNG (NET PROFIT)</p>
          <div className="text-2xl font-extrabold text-blue-700 mt-2">30,000,000 đ</div>
          <span className="text-xs font-bold text-blue-600">Biên LN ròng: 24.1%</span>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Biểu Đồ So Sánh Doanh Thu - Giá Vốn - Lợi Nhuận (6 Tháng Gần Nhất)
        </h2>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pnlMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" tickLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}M`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-bold">{label}</p>
                        <p className="text-blue-400">Doanh thu: {payload[0]?.value} triệu đ</p>
                        <p className="text-slate-400">Giá vốn: {payload[1]?.value} triệu đ</p>
                        <p className="text-emerald-400">Lợi nhuận ròng: {payload[2]?.value} triệu đ</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="doanhThu" name="Doanh thu" fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="giaVon" name="Giá vốn" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="loiNhuanRong" name="Lợi nhuận ròng" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
