import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckSquare,
  Building2,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Download
} from 'lucide-react';
import { CrmTask, CrmTaskPriority, CrmTaskStatus } from '../../types';
import { exportTasksToExcel } from '../../utils/excelEngine';

interface TaskListViewProps {
  tasks: CrmTask[];
  onCheckinTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onOpenTaskModal: (task?: CrmTask) => void;
  onDeleteTask: (taskId: string) => void;
  onBatchCheckin?: (taskIds: string[]) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onCheckinTask,
  onToggleComplete,
  onOpenTaskModal,
  onDeleteTask,
  onBatchCheckin
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [fieldFilter, setFieldFilter] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'unupdated' | 'overdue' | 'today'>('all');

  // Pagination state (Tính Năng 3)
  const [pageSize, setPageSize] = useState<number>(25); // 10, 25, 50, 100
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [visibleLimit, setVisibleLimit] = useState<number>(25); // For lazy-load mode

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // Search keyword
    const matchSearch =
      (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.assignedTo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.field || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.customerCode || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;

    // Priority filter
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    // Staff filter
    const matchStaff = staffFilter === 'all' || t.assignedTo.includes(staffFilter);

    // Field filter
    const matchField = fieldFilter === 'all' || (t.field || 'CSKH & Bán hàng') === fieldFilter;

    // Quick filter
    let matchQuick = true;
    if (quickFilter === 'unupdated') {
      if (t.status === 'completed') return false;
      const lastDate = t.lastCheckinDate || t.updatedAt || t.createdAt;
      const daysDiff = (new Date('2026-08-21').getTime() - new Date(lastDate.slice(0, 10)).getTime()) / (1000 * 3600 * 24);
      matchQuick = daysDiff > 3;
    } else if (quickFilter === 'overdue') {
      matchQuick = t.status !== 'completed' && new Date(t.dueDate) < new Date('2026-08-21');
    } else if (quickFilter === 'today') {
      matchQuick = t.dueDate === '2026-08-21';
    }

    return matchSearch && matchStatus && matchPriority && matchStaff && matchField && matchQuick;
  });

  // Calculate pagination
  const totalItems = filteredTasks.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // Distinct staff
  const staffList = Array.from(new Set(tasks.map((t) => t.assignedTo)));

  // Tasks requiring checkin (unupdated in 3 days)
  const unupdatedTasks = tasks.filter((t) => {
    if (t.status === 'completed') return false;
    const lastDate = t.lastCheckinDate || t.updatedAt || t.createdAt;
    const daysDiff = (new Date('2026-08-21').getTime() - new Date(lastDate.slice(0, 10)).getTime()) / (1000 * 3600 * 24);
    return daysDiff > 3;
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleLoadMore = () => {
    setPageSize((prev) => prev + 25);
  };

  const getPriorityBadge = (priority: CrmTaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold text-[10px]">Khẩn cấp</span>;
      case 'high':
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[10px]">Ưu tiên cao</span>;
      case 'normal':
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[10px]">Bình thường</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium text-[10px]">Thấp</span>;
    }
  };

  const isTaskUnupdated = (t: CrmTask) => {
    if (t.status === 'completed') return false;
    const lastDate = t.lastCheckinDate || t.updatedAt || t.createdAt;
    const daysDiff = (new Date('2026-08-21').getTime() - new Date(lastDate.slice(0, 10)).getTime()) / (1000 * 3600 * 24);
    return daysDiff > 3;
  };

  return (
    <div className="space-y-4">
      {/* 1. Quick Banner Alert for Unupdated Tasks with 1-Click Checkin */}
      {unupdatedTasks.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-white shrink-0">
              <Zap className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Cảnh báo: Có {unupdatedTasks.length} công việc chưa cập nhật trong hơn 3 ngày!
              </h3>
              <p className="text-xs text-amber-100 mt-0.5">
                Nhấn <strong>"Check-in nhanh"</strong> để xác nhận bạn vẫn đang thực hiện và cập nhật tiến độ mà không cần mở form.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setQuickFilter(quickFilter === 'unupdated' ? 'all' : 'unupdated')}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition-colors"
            >
              {quickFilter === 'unupdated' ? 'Xem tất cả' : `Lọc ${unupdatedTasks.length} việc này`}
            </button>

            {onBatchCheckin && (
              <button
                onClick={() => onBatchCheckin(unupdatedTasks.map((t) => t.id))}
                className="px-4 py-2 bg-white text-amber-800 hover:bg-amber-50 text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>Check-in tất cả 1-click</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Search row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên công việc, khách hàng, mã KH hoặc nhân sự phụ trách..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="in_progress">Đang thực hiện</option>
              <option value="pending">Chờ thực hiện</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="paused">Tạm dừng</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Tất cả ưu tiên</option>
              <option value="urgent">Khẩn cấp</option>
              <option value="high">Ưu tiên cao</option>
              <option value="normal">Bình thường</option>
            </select>

            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Tất cả nhân sự</option>
              {staffList.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            <select
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Tất cả lĩnh vực / phòng ban</option>
              <option value="CSKH & Bán hàng">CSKH & Bán hàng</option>
              <option value="Kế toán & Tài chính">Kế toán & Tài chính</option>
              <option value="Mua hàng & Kho vận">Mua hàng & Kho vận</option>
              <option value="Sản xuất & Kỹ thuật">Sản xuất & Kỹ thuật</option>
              <option value="Marketing & SEO">Marketing & SEO</option>
              <option value="Ban Giám Đốc">Ban Giám Đốc</option>
            </select>

            <button
              onClick={() => exportTasksToExcel(filteredTasks, `Danh_Sach_Nhiem_Vu_CRM_${new Date().toISOString().slice(0, 10)}.xlsx`)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all text-xs shrink-0 cursor-pointer"
              title="Xuất danh sách công việc ra Excel (.xlsx)"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Xuất Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => onOpenTaskModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all text-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm việc mới</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Tags & Page Size Selector */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 text-[11px] font-medium">Bộ lọc nhanh:</span>
            <button
              onClick={() => setQuickFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                quickFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả ({tasks.length})
            </button>
            <button
              onClick={() => setQuickFilter('unupdated')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                quickFilter === 'unupdated' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              ⚠️ Chưa cập nhật &gt; 3 ngày ({unupdatedTasks.length})
            </button>
            <button
              onClick={() => setQuickFilter('overdue')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                quickFilter === 'overdue' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              🚨 Quá hạn ({tasks.filter((t) => t.status !== 'completed' && new Date(t.dueDate) < new Date('2026-08-21')).length})
            </button>
          </div>

          {/* Page Size Selector (Tính Năng 3) */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value={10}>10 việc/trang</option>
              <option value={25}>25 việc/trang</option>
              <option value={50}>50 việc/trang</option>
              <option value={100}>100 việc/trang</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Task List Items with 1-Click Checkin (Tính Năng 1) */}
      <div className="space-y-2.5">
        {paginatedTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-500" />
            <p className="font-bold text-slate-700">Không có công việc nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          paginatedTasks.map((task) => {
            const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date('2026-08-21');
            const isUnupdated = isTaskUnupdated(task);

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-blue-300 ${
                  task.status === 'completed'
                    ? 'border-slate-200 bg-slate-50/70 opacity-80'
                    : isOverdue
                    ? 'border-rose-200 bg-rose-50/20'
                    : isUnupdated
                    ? 'border-amber-200 bg-amber-50/15'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => onToggleComplete(task.id)}
                    className="w-5 h-5 rounded-lg text-blue-600 border-slate-300 focus:ring-blue-500 mt-0.5 cursor-pointer"
                    title="Đánh dấu hoàn thành"
                  />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        onClick={() => onOpenTaskModal(task)}
                        className={`font-bold text-sm cursor-pointer hover:text-blue-600 transition-colors ${
                          task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </h4>
                      {getPriorityBadge(task.priority)}

                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-[11px]">
                        {task.customerName}
                      </span>

                      {isOverdue && (
                        <span className="bg-rose-100 text-rose-700 font-bold px-2 py-0.2 rounded text-[10px]">
                          Quá hạn
                        </span>
                      )}

                      {isUnupdated && (
                        <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.2 rounded text-[10px] flex items-center gap-1">
                          ⚠️ Chưa cập nhật &gt; 3 ngày
                        </span>
                      )}
                    </div>

                    {task.note && <p className="text-slate-600 text-xs leading-relaxed">{task.note}</p>}

                    {/* Extended tags, Opportunity binding, and recurrence metadata */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        🏢 {task.field || 'CSKH & Bán hàng'}
                      </span>
                      {task.opportunityTitle && (
                        <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          💼 Cơ hội: {task.opportunityTitle}
                        </span>
                      )}
                      {task.contractId && (
                        <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          📄 HĐ: {task.contractId}
                        </span>
                      )}
                      {task.recurrence && task.recurrence !== 'none' && (
                        <span className="text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5" /> Lặp: {task.recurrence === 'daily' ? 'Hàng ngày' : task.recurrence === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'}
                        </span>
                      )}
                      {task.tags && task.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          ✓ {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} mục con
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-mono text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Hạn: <strong className={isOverdue ? 'text-rose-600' : 'text-slate-900'}>{task.dueDate}</strong>
                      </span>
                      <span>• 👤 Phụ trách: <strong className="text-slate-800">{task.assignedTo}</strong></span>
                      {task.lastCheckinDate && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded font-medium border border-emerald-200">
                          ⚡ Check-in: {task.lastCheckinDate} (Vẫn đang làm)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons: 1-Click Checkin (Tính Năng 1) */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {task.status !== 'completed' && (
                    <button
                      onClick={() => onCheckinTask(task.id)}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102"
                      title="1-Click Check-in: Xác nhận vẫn đang làm (loại khỏi danh sách chưa cập nhật)"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
                      <span>Vẫn đang làm</span>
                    </button>
                  )}

                  <button
                    onClick={() => onOpenTaskModal(task)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Cập nhật chi tiết"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Xóa công việc"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Pagination & Load More Controls (Tính Năng 3) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="text-slate-500 text-center sm:text-left">
          Đang hiển thị <strong>{totalItems > 0 ? startIndex + 1 : 0}</strong> - <strong>{endIndex}</strong> trong tổng số <strong>{totalItems}</strong> công việc
        </div>

        <div className="flex items-center gap-2">
          {/* Load More Button */}
          {endIndex < totalItems && (
            <button
              onClick={handleLoadMore}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl border border-blue-200 transition-colors mr-2 cursor-pointer"
            >
              Tải thêm 25 việc
            </button>
          )}

          {/* Page Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-7 h-7 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
