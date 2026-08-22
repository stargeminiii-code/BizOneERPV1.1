import React, { useState } from 'react';
import {
  PieChart as PieChartIcon,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HelpCircle,
  Users,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { CrmTask } from '../../types';

interface TaskReportsViewProps {
  tasks: CrmTask[];
}

export const TaskReportsView: React.FC<TaskReportsViewProps> = ({ tasks }) => {
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedStaff === 'all') return true;
    return t.assignedTo.includes(selectedStaff);
  });

  const total = filteredTasks.length;
  const completed = filteredTasks.filter((t) => t.status === 'completed').length;
  const inProgress = filteredTasks.filter((t) => t.status === 'in_progress').length;
  const paused = filteredTasks.filter((t) => t.status === 'paused').length;
  const pending = filteredTasks.filter((t) => t.status === 'pending').length;

  // Overdue tasks
  const overdueTasks = filteredTasks.filter((t) => {
    if (t.status === 'completed') return false;
    return new Date(t.dueDate) < new Date('2026-08-21');
  });
  const overdueCount = overdueTasks.length;

  // Unupdated in 3 days
  const unupdatedCount = filteredTasks.filter((t) => {
    if (t.status === 'completed') return false;
    const lastDate = t.lastCheckinDate || t.updatedAt || t.createdAt;
    const daysDiff = (new Date('2026-08-21').getTime() - new Date(lastDate.slice(0, 10)).getTime()) / (1000 * 3600 * 24);
    return daysDiff > 3;
  }).length;

  // On-time completed tasks
  const onTimeCompleted = filteredTasks.filter((t) => {
    if (t.status !== 'completed') return false;
    if (!t.completedAt) return true;
    return new Date(t.completedAt.slice(0, 10)) <= new Date(t.dueDate);
  }).length;

  // Calculations
  const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';
  const onTimeRate = completed > 0 ? ((onTimeCompleted / completed) * 100).toFixed(1) : '100';
  const overdueRate = total > 0 ? ((overdueCount / total) * 100).toFixed(1) : '0';

  // Distinct staff
  const staffList: string[] = Array.from(new Set(tasks.map((t) => t.assignedTo || 'Chưa phân công')));

  // Staff breakdown
  const staffStats = staffList.map((staff: string) => {
    const sTasks = tasks.filter((t) => t.assignedTo === staff);
    const sCompleted = sTasks.filter((t) => t.status === 'completed').length;
    const sOverdue = sTasks.filter((t) => t.status !== 'completed' && new Date(t.dueDate) < new Date('2026-08-21')).length;
    const sRate = sTasks.length > 0 ? Math.round((sCompleted / sTasks.length) * 100) : 0;
    return {
      name: staff,
      total: sTasks.length,
      completed: sCompleted,
      overdue: sOverdue,
      rate: sRate
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Báo Cáo Thống Kê & Hiệu Suất Công Việc</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân tích chuyên sâu tiến độ hoàn thành, tỷ lệ đúng hạn và đánh giá hiệu năng nhân sự
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="month">Tháng 8/2026 (Tháng này)</option>
            <option value="quarter">Quý 3/2026</option>
            <option value="year">Năm 2026</option>
          </select>

          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Tất cả nhân sự ({staffList.length})</option>
            {staffList.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. KPI Cards With Formula Tooltips (Tính Năng 7: Chú thích giải thích công thức) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tỷ lệ hoàn thành */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative group hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              Tỷ Lệ Hoàn Thành
              {/* Tooltip Icon Giải Thích Công Thức (Tính Năng 7) */}
              <div className="relative inline-block cursor-help group/tooltip">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover/tooltip:text-blue-600 transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl z-50 pointer-events-none leading-relaxed">
                  <div className="font-bold text-emerald-400 mb-1">📐 Công thức tính Tỷ lệ hoàn thành:</div>
                  <code>(Số việc đã xong / Tổng số việc) × 100%</code>
                  <div className="mt-1 text-slate-300">
                    = ({completed} / {total}) × 100% = <strong>{completionRate}%</strong>
                  </div>
                </div>
              </div>
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {completionRate}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({completed}/{total} việc)
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        {/* KPI 2: Tỷ lệ đúng hạn */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative group hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              Tỷ Lệ Đúng Hạn
              {/* Tooltip Icon Giải Thích Công Thức (Tính Năng 7) */}
              <div className="relative inline-block cursor-help group/tooltip">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover/tooltip:text-blue-600 transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl z-50 pointer-events-none leading-relaxed">
                  <div className="font-bold text-blue-400 mb-1">📐 Công thức tính Tỷ lệ đúng hạn:</div>
                  <code>(Việc xong đúng hạn / Tổng việc đã xong) × 100%</code>
                  <div className="mt-1 text-slate-300">
                    = ({onTimeCompleted} / {completed}) × 100% = <strong>{onTimeRate}%</strong>
                  </div>
                </div>
              </div>
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {onTimeRate}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({onTimeCompleted}/{completed} việc)
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${onTimeRate}%` }} />
          </div>
        </div>

        {/* KPI 3: Tỷ lệ quá hạn */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative group hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              Tỷ Lệ Quá Hạn
              {/* Tooltip Icon Giải Thích Công Thức (Tính Năng 7) */}
              <div className="relative inline-block cursor-help group/tooltip">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover/tooltip:text-rose-600 transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl z-50 pointer-events-none leading-relaxed">
                  <div className="font-bold text-rose-400 mb-1">📐 Công thức tính Tỷ lệ quá hạn:</div>
                  <code>(Số việc quá hạn chưa xong / Tổng số việc) × 100%</code>
                  <div className="mt-1 text-slate-300">
                    = ({overdueCount} / {total}) × 100% = <strong>{overdueRate}%</strong>
                  </div>
                </div>
              </div>
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight font-mono">
              {overdueRate}%
            </span>
            <span className="text-xs text-rose-500 font-medium font-bold">
              ({overdueCount} việc quá hạn)
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${overdueRate}%` }} />
          </div>
        </div>

        {/* KPI 4: Chưa cập nhật > 3 ngày */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative group hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              Chưa Cập Nhật &gt; 3 Ngày
              {/* Tooltip Icon Giải Thích Công Thức (Tính Năng 7) */}
              <div className="relative inline-block cursor-help group/tooltip">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover/tooltip:text-amber-600 transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl z-50 pointer-events-none leading-relaxed">
                  <div className="font-bold text-amber-400 mb-1">📐 Tiêu chí Chưa Cập Nhật:</div>
                  <div className="text-slate-300">
                    Công việc đang mở (Đang làm/Tạm dừng/Chờ) không phát sinh thao tác sửa hoặc Check-in trong hơn 3 ngày qua.
                  </div>
                </div>
              </div>
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight font-mono">
              {unupdatedCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({Math.round((unupdatedCount / total) * 100)}% tổng số việc)
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(unupdatedCount / total) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* 3. Phân Bổ Trạng Thái & Hiệu Suất Theo Nhân Sự */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Donut / Bar Status Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-blue-600" />
            <span>Phân Bổ Theo Trạng Thái ({total} việc)</span>
          </h3>

          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Đã hoàn thành
                </span>
                <span className="font-mono text-slate-800">{completed} ({completionRate}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${(completed / total) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-rose-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Quá hạn chưa xong
                </span>
                <span className="font-mono text-slate-800">{overdueCount} ({overdueRate}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${(overdueCount / total) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-blue-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Đang thực hiện
                </span>
                <span className="font-mono text-slate-800">{inProgress} ({((inProgress / total) * 100).toFixed(1)}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${(inProgress / total) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-amber-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Tạm dừng
                </span>
                <span className="font-mono text-slate-800">{paused} ({((paused / total) * 100).toFixed(1)}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${(paused / total) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Chưa thực hiện
                </span>
                <span className="font-mono text-slate-800">{pending} ({((pending / total) * 100).toFixed(1)}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400" style={{ width: `${(pending / total) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Staff Performance Ranking */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Đánh Giá Hiệu Suất Theo Nhân Sự Thực Hiện</span>
            </h3>
            <span className="text-xs text-slate-400">{staffStats.length} nhân sự</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">Nhân sự</th>
                  <th className="p-3 text-center">Tổng việc</th>
                  <th className="p-3 text-center">Đã xong</th>
                  <th className="p-3 text-center">Quá hạn</th>
                  <th className="p-3 text-right">Tỷ lệ hoàn thành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffStats.map((st) => (
                  <tr key={st.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {st.name.charAt(0)}
                      </div>
                      <span>{st.name}</span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-700">{st.total}</td>
                    <td className="p-3 text-center font-mono text-emerald-600 font-bold">{st.completed}</td>
                    <td className="p-3 text-center font-mono text-rose-600 font-bold">{st.overdue}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full bg-blue-600" style={{ width: `${st.rate}%` }} />
                        </div>
                        <span className="font-mono font-bold text-slate-900">{st.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
