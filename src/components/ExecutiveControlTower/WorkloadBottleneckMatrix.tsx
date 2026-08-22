import React from 'react';
import {
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Plus,
  ArrowRight,
  ShieldAlert,
  Flame,
  BatteryCharging
} from 'lucide-react';
import { UserAccount, CrmTask } from '../../types';

interface WorkloadBottleneckMatrixProps {
  users?: UserAccount[];
  crmTasks?: CrmTask[];
  onOpenDelegateTask: (assignee?: string) => void;
}

export const WorkloadBottleneckMatrix: React.FC<WorkloadBottleneckMatrixProps> = ({
  users = [],
  crmTasks = [],
  onOpenDelegateTask
}) => {
  // Compute workload statistics
  const workloadData = [
    {
      id: 'usr-1',
      name: 'Lê Hoàng Nam',
      role: 'Giám Đốc Kinh Doanh B2B',
      department: 'Khối Kinh Doanh',
      assignedTasks: 28,
      completedTasks: 19,
      overdueTasks: 6,
      kpiAchievement: 82.6,
      workloadStatus: 'overloaded' as const,
      workloadLevel: 'Quá tải (140%)',
      qualityScore: 86
    },
    {
      id: 'usr-2',
      name: 'Nguyễn Thị Mai',
      role: 'GĐ Chi Nhánh TP.HCM',
      department: 'Chi Nhánh Miền Nam',
      assignedTasks: 18,
      completedTasks: 16,
      overdueTasks: 1,
      kpiAchievement: 94.8,
      workloadStatus: 'optimal' as const,
      workloadLevel: 'Tối ưu (92%)',
      qualityScore: 95
    },
    {
      id: 'usr-3',
      name: 'Đỗ Thùy Linh',
      role: 'Trưởng Phòng Marketing & Growth',
      department: 'Khối Marketing',
      assignedTasks: 22,
      completedTasks: 18,
      overdueTasks: 3,
      kpiAchievement: 95.0,
      workloadStatus: 'high' as const,
      workloadLevel: 'Cao (110%)',
      qualityScore: 91
    },
    {
      id: 'usr-4',
      name: 'Trần Văn Cường',
      role: 'Quản Đốc Kho & FIFO Lead',
      department: 'Khối Kho Vận',
      assignedTasks: 15,
      completedTasks: 14,
      overdueTasks: 0,
      kpiAchievement: 98.3,
      workloadStatus: 'optimal' as const,
      workloadLevel: 'Tối ưu (88%)',
      qualityScore: 98
    },
    {
      id: 'usr-5',
      name: 'Phạm Minh Đức',
      role: 'Kế Toán Trưởng & CFO',
      department: 'Khối Tài Chính',
      assignedTasks: 12,
      completedTasks: 11,
      overdueTasks: 0,
      kpiAchievement: 107.8,
      workloadStatus: 'optimal' as const,
      workloadLevel: 'Tối ưu (85%)',
      qualityScore: 99
    },
    {
      id: 'usr-6',
      name: 'Vũ Đình Trọng',
      role: 'Kỹ Sư Trưởng Sản Xuất',
      department: 'Khối Sản Xuất',
      assignedTasks: 25,
      completedTasks: 17,
      overdueTasks: 5,
      kpiAchievement: 84.5,
      workloadStatus: 'overloaded' as const,
      workloadLevel: 'Quá tải (135%)',
      qualityScore: 82
    }
  ];

  // Critical Bottlenecks
  const bottlenecks = [
    {
      id: 'bn-1',
      title: 'Dây chuyền dập tôn NM1 bảo trì phát sinh',
      impact: 'Chậm tiến độ 350 tấn thành phẩm',
      owner: 'Vũ Đình Trọng',
      severity: 'critical' as const,
      solution: 'Kích hoạt phụ tùng dự phòng và điều phối ca 3'
    },
    {
      id: 'bn-2',
      title: '4 Deal B2B lớn tại Hà Nội vướng thủ tục bảo lãnh',
      impact: '18.5 Tỷ doanh số có nguy cơ trễ sang T9',
      owner: 'Lê Hoàng Nam',
      severity: 'warning' as const,
      solution: 'Tài chính phối hợp Vietcombank duyệt hạn mức ưu tiên'
    },
    {
      id: 'bn-3',
      title: 'Tồn kho 45 tấn thép hộp lưu kho quá 40 ngày',
      impact: 'Đọng vốn 1.15 Tỷ tại Kho Long Biên',
      owner: 'Trần Văn Cường',
      severity: 'warning' as const,
      solution: 'Đẩy vào đơn hàng phân phối đại lý ưu đãi chiết khấu 2%'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 1. Personnel Workload & Capacity Radar */}
      <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                Resource Allocation
              </span>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span>QUẢN TRỊ TẢI CÔNG VIỆC & HIỆU SUẤT NHÂN SỰ (WORKLOAD MATRIX)</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Phát hiện tức thời nhân sự đang quá tải, task quá hạn dồn ứ hoặc KPI chưa đạt để tái phân bổ nguồn lực
            </p>
          </div>

          <button
            onClick={() => onOpenDelegateTask()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Giao việc điều phối</span>
          </button>
        </div>

        {/* Workload List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                <th className="py-2.5 px-3">Nhân sự & Vị trí</th>
                <th className="py-2.5 px-3 text-center">Tổng Task</th>
                <th className="py-2.5 px-3 text-center">Hoàn thành</th>
                <th className="py-2.5 px-3 text-center">Quá hạn</th>
                <th className="py-2.5 px-3 text-center">KPI %</th>
                <th className="py-2.5 px-3">Tải trọng (Workload)</th>
                <th className="py-2.5 px-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {workloadData.map((item) => {
                const isOverloaded = item.workloadStatus === 'overloaded';
                const isHigh = item.workloadStatus === 'high';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900 block">{item.name}</span>
                      <span className="text-[10px] text-slate-500">{item.role} • {item.department}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">{item.assignedTasks}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">{item.completedTasks}</td>
                    <td className="py-2.5 px-3 text-center">
                      {item.overdueTasks > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                          {item.overdueTasks} trễ
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-blue-700">{item.kpiAchievement}%</td>
                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span
                            className={`font-extrabold ${
                              isOverloaded ? 'text-rose-600' : isHigh ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            {item.workloadLevel}
                          </span>
                          <span className="text-slate-400">Quality: {item.qualityScore}đ</span>
                        </div>
                        <div className="w-24 sm:w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOverloaded ? 'bg-rose-500' : isHigh ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(item.assignedTasks * 4, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onOpenDelegateTask(item.name)}
                        className="text-blue-600 hover:text-blue-800 font-bold text-[11px] hover:underline"
                      >
                        {isOverloaded ? 'Hỗ trợ việc' : 'Giao thêm'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Bottlenecks & SLA Breaches Resolution Center */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-rose-700 font-extrabold text-xs">
            <Flame className="w-4 h-4 text-rose-600" />
            <span>ĐIỂM NGHẼN & RỦI RO VẬN HÀNH (BOTTLENECK)</span>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
            {bottlenecks.length} Điểm nghẽn
          </span>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
          {bottlenecks.map((bn) => (
            <div
              key={bn.id}
              className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                bn.severity === 'critical' ? 'border-rose-300 bg-rose-50/30' : 'border-amber-300 bg-amber-50/30'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-bold text-slate-900 line-clamp-1">{bn.title}</span>
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded shrink-0 ${
                    bn.severity === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                  }`}
                >
                  {bn.severity === 'critical' ? 'Khẩn cấp' : 'Cảnh báo'}
                </span>
              </div>

              <div className="text-[11px] text-slate-700">
                <strong>Tác động:</strong> {bn.impact}
              </div>

              <div className="text-[11px] text-emerald-800 bg-white/80 p-2 rounded-xl border border-slate-200">
                <strong>Giải pháp:</strong> {bn.solution}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>PIC: <strong>{bn.owner}</strong></span>
                <button
                  onClick={() => onOpenDelegateTask(bn.owner)}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Đôn đốc ngay $\rightarrow$
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 text-center">
          <span className="text-[11px] text-slate-500">
            Hệ thống tự động liên kết task khắc phục trực tiếp với KPI và Scorecard
          </span>
        </div>
      </div>
    </div>
  );
};
