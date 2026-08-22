import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Zap,
  Tag,
  Info
} from 'lucide-react';
import { CrmTask } from '../../types';

interface TaskCalendarViewProps {
  tasks: CrmTask[];
  onCheckinTask: (taskId: string) => void;
  onOpenTaskModal: (task?: CrmTask) => void;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onCheckinTask,
  onOpenTaskModal
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 21)); // Tháng 8/2026
  const [hoveredTask, setHoveredTask] = useState<CrmTask | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedDayTasks, setSelectedDayTasks] = useState<{ date: string; tasks: CrmTask[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = CN, 1 = T2...
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Adjust for Monday as first day of week
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 7, 21));
  };

  const getTaskStatusStyle = (task: CrmTask) => {
    if (task.status === 'completed') {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
        dot: 'bg-emerald-500',
        label: 'Đã xong'
      };
    }
    const isOverdue = new Date(task.dueDate) < new Date('2026-08-21');
    if (isOverdue) {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
        dot: 'bg-rose-500',
        label: 'Quá hạn'
      };
    }
    if (task.status === 'in_progress') {
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
        dot: 'bg-blue-500',
        label: 'Đang làm'
      };
    }
    if (task.status === 'paused') {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
        dot: 'bg-amber-500',
        label: 'Tạm dừng'
      };
    }
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
      dot: 'bg-slate-400',
      label: 'Chưa làm'
    };
  };

  // Get tasks for a specific day string (YYYY-MM-DD)
  const getTasksForDay = (day: number) => {
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    const formattedMonth = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    return tasks.filter((t) => t.dueDate === dateStr);
  };

  // Upcoming tasks in next 7 days
  const upcomingTasks = tasks
    .filter((t) => {
      if (t.status === 'completed') return false;
      const d = new Date(t.dueDate);
      const today = new Date('2026-08-21');
      const diffDays = (d.getTime() - today.getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    })
    .slice(0, 6);

  return (
    <div className="space-y-4">
      {/* 1. Tooltip & Chú Thích Màu Sắc (Legend) Theo Yêu Cầu Tính Năng 4 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Navigation Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-sm text-slate-800">
              {monthNames[month]} / {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Hôm nay (21/08/2026)
          </button>
        </div>

        {/* Chú thích màu sắc (Legend) */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-400 font-medium text-[11px]">Chú thích trạng thái:</span>
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Đã hoàn thành (48)</span>
          </div>
          <div className="flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Quá hạn (39)</span>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Đang thực hiện (8)</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Tạm dừng (4)</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>Chưa thực hiện (2)</span>
          </div>
        </div>
      </div>

      {/* 2. Lưới Lịch Tháng (Calendar Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main 7-Column Calendar Grid */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header 7 Ngày Trong Tuần */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2.5 text-xs font-bold text-slate-600">
            <div>Thứ Hai</div>
            <div>Thứ Ba</div>
            <div>Thứ Tư</div>
            <div>Thứ Năm</div>
            <div>Thứ Sáu</div>
            <div className="text-blue-600">Thứ Bảy</div>
            <div className="text-rose-600">Chủ Nhật</div>
          </div>

          {/* Ô Lịch 35 - 42 ngày */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {/* Empty offset days */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="min-h-[110px] p-2 bg-slate-50/40 text-slate-300 text-xs">
                {/* Empty cell */}
              </div>
            ))}

            {/* Days in current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayTasks = getTasksForDay(dayNum);
              const isToday = dayNum === 21 && month === 7 && year === 2026;
              const formattedDate = `${year}-${month + 1 < 10 ? '0' + (month + 1) : month + 1}-${dayNum < 10 ? '0' + dayNum : dayNum}`;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDayTasks({ date: formattedDate, tasks: dayTasks })}
                  className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors hover:bg-slate-50/90 cursor-pointer ${
                    isToday ? 'bg-blue-50/30 ring-1 ring-inset ring-blue-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        isToday
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {dayTasks.length} việc
                      </span>
                    )}
                  </div>

                  {/* Tasks Preview with Full Name Hover Tooltip */}
                  <div className="space-y-1 overflow-y-auto max-h-[75px] custom-scrollbar">
                    {dayTasks.slice(0, 3).map((t) => {
                      const style = getTaskStatusStyle(t);
                      return (
                        <div
                          key={t.id}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltipPos({ x: rect.left + window.scrollX, y: rect.bottom + window.scrollY });
                            setHoveredTask(t);
                          }}
                          onMouseLeave={() => setHoveredTask(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTaskModal(t);
                          }}
                          className={`px-1.5 py-0.5 rounded border text-[10px] truncate font-medium flex items-center gap-1 transition-all ${style.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                          <span className="truncate">{t.title}</span>
                        </div>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-blue-600 font-bold hover:underline text-center pt-0.5">
                        +{dayTasks.length - 3} việc khác...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột Công Việc Sắp Đến Hạn & Cảnh Báo */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Sắp Đến Hạn (7 ngày tới)</span>
              </h3>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {upcomingTasks.length}
              </span>
            </div>

            {upcomingTasks.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-4">Không có việc nào sắp đến hạn.</p>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onOpenTaskModal(t)}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-blue-200 transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{t.title}</h4>
                      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0">
                        {t.dueDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>👤 {t.assignedTo}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCheckinTask(t.id);
                        }}
                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 flex items-center gap-1 text-[10px]"
                        title="Check-in nhanh: Vẫn đang làm"
                      >
                        <Zap className="w-3 h-3 text-emerald-600" />
                        <span>Check-in</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Tip Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 rounded-2xl border border-blue-200/70 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Hướng dẫn tương tác Lịch</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              - Rê chuột vào các dòng công việc bị cắt dấu <code className="bg-white px-1 rounded border">...</code> để xem tooltip chi tiết.<br />
              - Bấm vào bất kỳ ô ngày nào để xem danh sách toàn bộ tác vụ của ngày đó.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Floating Tooltip Hiển Thị Đầy Đủ Tên & Chi Tiết Khi Hover (Tính Năng 4) */}
      {hoveredTask && (
        <div
          className="fixed z-50 bg-slate-900 text-white p-3 rounded-xl shadow-xl max-w-sm pointer-events-none text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: `${Math.min(window.innerHeight - 180, tooltipPos.y + 8)}px`,
            left: `${Math.min(window.innerWidth - 300, Math.max(10, tooltipPos.x - 50))}px`
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1">
            <span className="text-[10px] text-slate-400 font-mono">ID: {hoveredTask.id}</span>
            <span className={`px-2 py-0.2 rounded-full font-bold text-[10px] ${
              hoveredTask.status === 'completed'
                ? 'bg-emerald-900 text-emerald-300'
                : hoveredTask.status === 'in_progress'
                ? 'bg-blue-900 text-blue-300'
                : 'bg-rose-900 text-rose-300'
            }`}>
              {hoveredTask.status === 'completed' ? 'Đã xong' : hoveredTask.status === 'in_progress' ? 'Đang làm' : 'Quá hạn / Chưa làm'}
            </span>
          </div>

          <p className="font-bold text-slate-100 text-sm leading-snug">
            {hoveredTask.title}
          </p>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-300 pt-1">
            <div>🏢 Đối tác: <strong className="text-white">{hoveredTask.customerName}</strong></div>
            <div>👤 Phụ trách: <strong className="text-white">{hoveredTask.assignedTo}</strong></div>
            <div>📅 Hạn xử lý: <strong className="text-amber-300">{hoveredTask.dueDate}</strong></div>
            <div>⚡ Tiến độ: <strong className="text-emerald-300">{hoveredTask.progressPercent ?? (hoveredTask.status === 'completed' ? 100 : 35)}%</strong></div>
          </div>

          {hoveredTask.lastCheckinDate && (
            <div className="text-[10px] text-emerald-400 pt-1 border-t border-slate-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Check-in gần nhất: {hoveredTask.lastCheckinDate} (Vẫn đang làm)</span>
            </div>
          )}
        </div>
      )}

      {/* 4. Modal Chi Tiết Ngày Đã Chọn */}
      {selectedDayTasks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Công Việc Ngày {selectedDayTasks.date}
                </h3>
                <p className="text-xs text-slate-500">
                  Tổng số: {selectedDayTasks.tasks.length} nhiệm vụ
                </p>
              </div>
              <button
                onClick={() => setSelectedDayTasks(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-2.5 custom-scrollbar">
              {selectedDayTasks.tasks.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Không có công việc nào trong ngày này.
                </div>
              ) : (
                selectedDayTasks.tasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-slate-900">{t.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>🏢 {t.customerName}</span>
                        <span>• 👤 {t.assignedTo}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onCheckinTask(t.id);
                          setSelectedDayTasks(null);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Check-in</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
