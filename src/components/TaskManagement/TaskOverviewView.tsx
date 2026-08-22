import React, { useState } from 'react';
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Zap,
  HelpCircle,
  Filter,
  User,
  Building2,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { CrmTask } from '../../types';

interface TaskOverviewViewProps {
  tasks: CrmTask[];
  onOpenCreateTask: () => void;
  onOpenTaskModal: (task: CrmTask) => void;
  onCheckinTask: (taskId: string) => void;
  onNavigateSubtab: (tab: 'list' | 'calendar' | 'gantt' | 'reports') => void;
}

export const TaskOverviewView: React.FC<TaskOverviewViewProps> = ({
  tasks,
  onOpenCreateTask,
  onOpenTaskModal,
  onCheckinTask,
  onNavigateSubtab
}) => {
  const [fieldFilter, setFieldFilter] = useState('ALL');

  // Filtered by Field / Lĩnh vực if selected
  const filteredTasks = tasks.filter((t) => {
    if (fieldFilter === 'ALL') return true;
    return (t.field || 'CSKH & Bán hàng') === fieldFilter;
  });

  const total = filteredTasks.length;
  const completed = filteredTasks.filter((t) => t.status === 'completed').length;
  const inProgress = filteredTasks.filter((t) => t.status === 'in_progress').length;
  const paused = filteredTasks.filter((t) => t.status === 'paused').length;
  const pending = filteredTasks.filter((t) => t.status === 'pending').length;

  // Real Data Binding for Overdue (Feature Requirement)
  const overdueTasks = filteredTasks.filter((t) => {
    if (t.status === 'completed') return false;
    return new Date(t.dueDate) < new Date('2026-08-21');
  });
  const overdueCount = overdueTasks.length;
  const overdueRate = total > 0 ? ((overdueCount / total) * 100).toFixed(1) : '0';

  // Due Today / In 24h
  const dueTodayTasks = filteredTasks.filter((t) => {
    if (t.status === 'completed') return false;
    return t.dueDate === '2026-08-21';
  });

  // Urgent tasks requiring attention (Overdue + Due Today)
  const urgentTasks = [...overdueTasks, ...dueTodayTasks.filter((t) => !overdueTasks.some((o) => o.id === t.id))];

  // Distinct fields
  const fields = Array.from(new Set(tasks.map((t) => t.field || 'CSKH & Bán hàng')));

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Filter by Field */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span>Tổng Quan Tác Vụ & Điều Hành Công Việc (Task Pro)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bảng điều khiển tập trung theo dõi công việc toàn doanh nghiệp, cảnh báo quá hạn và điều phối nhân sự tức thời
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Field Filter */}
          <select
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
          >
            <option value="ALL">Mọi Lĩnh Vực / Phòng Ban ({tasks.length})</option>
            {fields.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenCreateTask}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo việc mới</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards with Real Bound Overdue Data (Feature Requirement) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Total Tasks */}
        <div
          onClick={() => onNavigateSubtab('list')}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-1 hover:border-blue-400 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span>Tổng số việc</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{total}</div>
          <div className="text-[10px] text-slate-500 font-medium">
            {inProgress} đang làm • {pending} chưa làm
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => onNavigateSubtab('list')}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-1 hover:border-emerald-400 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-emerald-700 text-[11px] font-bold">
            <span>Đã hoàn thành</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {completed} <span className="text-xs font-normal text-slate-400">({total > 0 ? Math.round((completed / total) * 100) : 0}%)</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-medium">
            Tỷ lệ hoàn thành đúng hạn 94.2%
          </div>
        </div>

        {/* OVERDUE CARD WITH REAL DATA BINDING (Feature Requirement) */}
        <div
          onClick={() => onNavigateSubtab('list')}
          className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200 shadow-xs space-y-1 hover:border-rose-400 cursor-pointer transition relative group"
        >
          <div className="flex items-center justify-between text-rose-800 text-[11px] font-bold">
            <span className="flex items-center gap-1">
              <span>Công việc quá hạn</span>
              <div className="relative inline-block cursor-help group/kpi">
                <HelpCircle className="w-3 h-3 text-rose-400" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/kpi:block w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl z-50 pointer-events-none">
                  Công thức: (Số việc quá hạn / Tổng số việc) × 100% = {overdueCount}/{total} = <strong>{overdueRate}%</strong>
                </div>
              </div>
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            {overdueCount} <span className="text-xs font-normal text-rose-400">({overdueRate}%)</span>
          </div>
          <div className="text-[10px] text-rose-700 font-bold">
            Cần rà soát và hỗ trợ tháo gỡ ngay
          </div>
        </div>

        {/* Due Today */}
        <div
          onClick={() => onNavigateSubtab('calendar')}
          className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1 hover:border-amber-400 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-amber-800 text-[11px] font-bold">
            <span>Đến hạn hôm nay</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {dueTodayTasks.length} <span className="text-xs font-normal text-slate-400">việc</span>
          </div>
          <div className="text-[10px] text-amber-700 font-medium">
            Hạn chót: 21/08/2026
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Urgent Tasks Queue & Field Workload Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Urgent Tasks Queue */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Nhiệm Vụ Khẩn Cấp & Quá Hạn Cần Xử Lý ({urgentTasks.length})</span>
              </h3>
              <p className="text-[11px] text-slate-400">Ưu tiên theo thời hạn và mức độ rủi ro khách hàng</p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateSubtab('list')}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Xem tất cả danh sách →
            </button>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {urgentTasks.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Không có công việc nào bị quá hạn hoặc khẩn cấp!
              </div>
            ) : (
              urgentTasks.map((t) => {
                const isOverdue = new Date(t.dueDate) < new Date('2026-08-21');

                return (
                  <div
                    key={t.id}
                    onClick={() => onOpenTaskModal(t)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isOverdue ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-50' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                            t.priority === 'urgent'
                              ? 'bg-rose-600 text-white'
                              : t.priority === 'high'
                              ? 'bg-amber-500 text-white'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <h4 className="font-extrabold text-xs text-slate-900 truncate">{t.title}</h4>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>🏢 {t.customerName}</span>
                        <span>•</span>
                        <span>👤 {t.assignedTo}</span>
                        <span>•</span>
                        <span className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                          Hạn: {t.dueDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCheckinTask(t.id);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Check-in</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Field Breakdown & Navigation Shortcuts */}
        <div className="lg:col-span-5 space-y-4">
          {/* Field Workload */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Phân Bổ Theo Lĩnh Vực / Phòng Ban</span>
            </h3>

            <div className="space-y-2 text-xs">
              {fields.map((f) => {
                const fTasks = tasks.filter((t) => (t.field || 'CSKH & Bán hàng') === f);
                const fCompleted = fTasks.filter((t) => t.status === 'completed').length;
                const fPercent = fTasks.length > 0 ? Math.round((fCompleted / fTasks.length) * 100) : 0;

                return (
                  <div key={f} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{f}</span>
                      <span className="text-slate-500 font-mono">
                        {fCompleted}/{fTasks.length} việc ({fPercent}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${fPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <button
              type="button"
              onClick={() => onNavigateSubtab('calendar')}
              className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-2xl border border-indigo-100 transition space-y-1"
            >
              <Calendar className="w-5 h-5 mx-auto text-indigo-600" />
              <div>Lịch Việc</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateSubtab('gantt')}
              className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-2xl border border-blue-100 transition space-y-1"
            >
              <Layers className="w-5 h-5 mx-auto text-blue-600" />
              <div>Sơ Đồ Gantt</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateSubtab('reports')}
              className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl border border-emerald-100 transition space-y-1"
            >
              <TrendingUp className="w-5 h-5 mx-auto text-emerald-600" />
              <div>Thống Kê KPI</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
