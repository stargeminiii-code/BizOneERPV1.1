import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Layers,
  Smartphone,
  Monitor,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  Filter,
  User,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { CrmTask } from '../../types';

interface TaskGanttViewProps {
  tasks: CrmTask[];
  onCheckinTask: (taskId: string) => void;
  onOpenTaskModal: (task?: CrmTask) => void;
}

export const TaskGanttView: React.FC<TaskGanttViewProps> = ({
  tasks,
  onCheckinTask,
  onOpenTaskModal
}) => {
  // Check if screen is mobile (< 768px) and default view mode
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  // User manual view mode override: 'auto' | 'desktop_gantt' | 'mobile_timeline'
  const [viewMode, setViewMode] = useState<'desktop_gantt' | 'mobile_timeline'>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile_timeline' : 'desktop_gantt';
  });

  const [staffFilter, setStaffFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter tasks for Gantt
  const filteredTasks = tasks.filter((t) => {
    const matchStaff = staffFilter === 'all' || t.assignedTo.includes(staffFilter);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchStaff && matchStatus;
  });

  // Distinct staff list for filter
  const staffList = Array.from(new Set(tasks.map((t) => t.assignedTo)));

  // Days in August 2026 for Desktop Gantt columns (1 -> 31)
  const augustDays = Array.from({ length: 31 }, (_, i) => i + 1);

  // Group tasks by week for Mobile Timeline View (Tính năng 5)
  const groupTasksByWeek = () => {
    const weeks: { [key: string]: { title: string; range: string; tasks: CrmTask[] } } = {
      w1: { title: 'Tuần 1 (01/08 - 07/08)', range: '01 - 07 Tháng 8', tasks: [] },
      w2: { title: 'Tuần 2 (08/08 - 14/08)', range: '08 - 14 Tháng 8', tasks: [] },
      w3: { title: 'Tuần 3 (15/08 - 21/08 - Hiện tại)', range: '15 - 21 Tháng 8', tasks: [] },
      w4: { title: 'Tuần 4 (22/08 - 28/08)', range: '22 - 28 Tháng 8', tasks: [] },
      w5: { title: 'Tuần 5 (29/08 - 31/08)', range: '29 - 31 Tháng 8', tasks: [] }
    };

    filteredTasks.forEach((task) => {
      const dueDay = parseInt(task.dueDate.split('-')[2] || '15', 10);
      if (dueDay <= 7) weeks.w1.tasks.push(task);
      else if (dueDay <= 14) weeks.w2.tasks.push(task);
      else if (dueDay <= 21) weeks.w3.tasks.push(task);
      else if (dueDay <= 28) weeks.w4.tasks.push(task);
      else weeks.w5.tasks.push(task);
    });

    return weeks;
  };

  const weeklyGroups = groupTasksByWeek();

  // Helper to calculate position in Desktop Gantt
  const getGanttBarPosition = (task: CrmTask) => {
    const startDay = task.startDate ? parseInt(task.startDate.split('-')[2] || '1', 10) : Math.max(1, parseInt(task.dueDate.split('-')[2] || '15', 10) - 4);
    const endDay = parseInt(task.dueDate.split('-')[2] || '15', 10);
    const clampedStart = Math.max(1, Math.min(31, startDay));
    const clampedEnd = Math.max(clampedStart, Math.min(31, endDay));
    const leftPercent = ((clampedStart - 1) / 31) * 100;
    const widthPercent = Math.max(5.0, ((clampedEnd - clampedStart + 1) / 31) * 100);

    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  const getTaskColorTheme = (task: CrmTask) => {
    if (task.status === 'completed') {
      return {
        bar: 'bg-emerald-500 text-white shadow-emerald-500/20',
        badge: 'bg-emerald-100 text-emerald-800'
      };
    }
    const isOverdue = new Date(task.dueDate) < new Date('2026-08-21');
    if (isOverdue) {
      return {
        bar: 'bg-rose-500 text-white shadow-rose-500/20',
        badge: 'bg-rose-100 text-rose-800'
      };
    }
    if (task.status === 'in_progress') {
      return {
        bar: 'bg-blue-600 text-white shadow-blue-500/20',
        badge: 'bg-blue-100 text-blue-800'
      };
    }
    if (task.status === 'paused') {
      return {
        bar: 'bg-amber-500 text-white shadow-amber-500/20',
        badge: 'bg-amber-100 text-amber-800'
      };
    }
    return {
      bar: 'bg-slate-400 text-white',
      badge: 'bg-slate-100 text-slate-700'
    };
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar & Mode Switcher (Tính Năng 5: Gantt Rút Gọn Mobile) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Sơ Đồ Tiến Độ Gantt & Timeline Dự Án</span>
            </h2>
            {isMobileScreen && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                Mobile Detected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi phân bổ thời gian thực hiện, hạn chót và trạng thái của {filteredTasks.length} nhiệm vụ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter By Staff */}
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Tất cả nhân sự ({staffList.length})</option>
            {staffList.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          {/* Filter By Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="pending">Chưa thực hiện</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="paused">Tạm dừng</option>
          </select>

          {/* Switch View Mode: Desktop Gantt vs Mobile Timeline */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('desktop_gantt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'desktop_gantt'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem biểu đồ Gantt ngang (Phù hợp màn hình lớn)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gantt Ngang (Desktop)</span>
              <span className="sm:hidden">Gantt</span>
            </button>

            <button
              onClick={() => setViewMode('mobile_timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'mobile_timeline'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem Timeline rút gọn gom nhóm theo tuần (Phù hợp Mobile)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rút gọn (Mobile)</span>
              <span className="sm:hidden">Rút gọn</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CHẾ ĐỘ 1: GANTT NGANG CHUYÊN SÂU (DESKTOP VIEW) */}
      {viewMode === 'desktop_gantt' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1100px]">
              {/* Gantt Header Timeline (Days 1 -> 31) */}
              <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                <div className="w-[320px] p-3 border-r border-slate-200 shrink-0">
                  Tên công việc & Người phụ trách
                </div>
                <div className="flex-1 flex divide-x divide-slate-200">
                  {augustDays.map((d) => {
                    const isToday = d === 21;
                    return (
                      <div
                        key={d}
                        className={`flex-1 py-2 text-center text-[10px] ${
                          isToday ? 'bg-blue-600 text-white font-black' : d % 7 === 0 || d % 7 === 6 ? 'bg-slate-100/70 text-slate-500' : 'text-slate-700'
                        }`}
                      >
                        {d}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gantt Rows */}
              <div className="divide-y divide-slate-100 text-xs">
                {filteredTasks.slice(0, 35).map((task) => {
                  const pos = getGanttBarPosition(task);
                  const theme = getTaskColorTheme(task);
                  const progress = task.progressPercent ?? (task.status === 'completed' ? 100 : 35);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onOpenTaskModal(task)}
                      className="flex items-center hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Left info column */}
                      <div className="w-[320px] p-3 border-r border-slate-100 shrink-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-slate-900 truncate max-w-[200px]" title={task.title}>
                            {task.title}
                          </h4>
                          <span className={`px-2 py-0.2 rounded-md font-bold text-[10px] ${theme.badge}`}>
                            {task.status === 'completed' ? 'Đã xong' : task.status === 'in_progress' ? 'Đang làm' : 'Quá hạn'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>👤 {task.assignedTo}</span>
                          <span className="font-mono text-slate-700 font-bold">Hạn: {task.dueDate}</span>
                        </div>
                      </div>

                      {/* Right timeline canvas */}
                      <div className="flex-1 relative h-12 flex items-center px-1">
                        {/* Background grid vertical lines */}
                        <div className="absolute inset-0 flex divide-x divide-slate-100 pointer-events-none opacity-50">
                          {augustDays.map((d) => (
                            <div key={d} className={`flex-1 ${d === 21 ? 'bg-blue-50/60' : ''}`} />
                          ))}
                        </div>

                        {/* Today red vertical marker */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10 pointer-events-none"
                          style={{ left: `${((21 - 1) / 31) * 100}%` }}
                          title="Hôm nay 21/08"
                        />

                        {/* Gantt Bar with minWidth and checklist icons */}
                        <div
                          className={`absolute h-7 rounded-lg ${theme.bar} p-1 shadow-xs flex items-center justify-between px-2 text-[10px] font-bold z-10 transition-transform group-hover:scale-y-105 min-w-[45px]`}
                          style={{ left: pos.left, width: pos.width }}
                        >
                          <span className="truncate pr-1">{task.customerName}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {task.subtasks && task.subtasks.length > 0 && (
                              <span className="text-[9px] bg-black/30 px-1 rounded font-mono" title={`${task.subtasks.filter((s) => s.completed).length}/${task.subtasks.length} mục đã xong`}>
                                ☑ {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                              </span>
                            )}
                            <span className="text-[9px] bg-black/20 px-1 rounded">{progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {filteredTasks.length > 35 && (
            <div className="p-3 bg-slate-50 text-center text-xs text-slate-500 border-t border-slate-100">
              Đang hiển thị 35 / {filteredTasks.length} công việc. Dùng bộ lọc nhân sự để thu hẹp phạm vi.
            </div>
          )}
        </div>
      )}

      {/* 3. CHẾ ĐỘ 2: TIMELINE DỌC RÚT GỌN CHO MOBILE (TÍNH NĂNG 5) */}
      {viewMode === 'mobile_timeline' && (
        <div className="space-y-4">
          {Object.entries(weeklyGroups).map(([key, week]) => {
            if (week.tasks.length === 0) return null;
            const isCurrentWeek = key === 'w3';

            return (
              <div
                key={key}
                className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 ${
                  isCurrentWeek ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
                }`}
              >
                {/* Week Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      {week.title}
                    </h3>
                  </div>
                  <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {week.tasks.length} việc
                  </span>
                </div>

                {/* Vertical Timeline Task Cards */}
                <div className="space-y-2.5">
                  {week.tasks.map((task) => {
                    const theme = getTaskColorTheme(task);
                    const isOverdue = new Date(task.dueDate) < new Date('2026-08-21') && task.status !== 'completed';
                    const progress = task.progressPercent ?? (task.status === 'completed' ? 100 : 35);

                    return (
                      <div
                        key={task.id}
                        onClick={() => onOpenTaskModal(task)}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-blue-200 transition-all cursor-pointer space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-xs text-slate-900 leading-snug">
                            {task.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] shrink-0 ${theme.badge}`}>
                            {task.status === 'completed' ? 'Đã xong' : isOverdue ? 'Quá hạn' : 'Đang làm'}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Tiến độ:</span>
                            <span className="font-bold font-mono">{progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${task.status === 'completed' ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-blue-600'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Card Meta & Quick Check-in */}
                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                          <div className="space-y-0.5">
                            <div>🏢 {task.customerName}</div>
                            <div>👤 {task.assignedTo} • 📅 <strong className={isOverdue ? 'text-rose-600' : 'text-slate-800'}>{task.dueDate}</strong></div>
                          </div>

                          {task.status !== 'completed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCheckinTask(task.id);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1 shadow-xs text-xs"
                              title="Check-in nhanh 1-click: Vẫn đang làm"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Check-in</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
