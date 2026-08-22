import React from 'react';
import {
  Users,
  Target,
  FileCheck,
  HeartHandshake,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PhoneCall,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Customer, CrmTask } from '../../types';
import { formatNumberWithDots } from '../../data/administrativeData';

interface CustomerLifecycleSummaryWidgetProps {
  customers?: Customer[];
  crmTasks?: CrmTask[];
  onSelectCustomer?: (customer: Customer) => void;
  onNavigateToCrm?: () => void;
}

export const CustomerLifecycleSummaryWidget: React.FC<CustomerLifecycleSummaryWidgetProps> = ({
  customers = [],
  crmTasks = [],
  onSelectCustomer,
  onNavigateToCrm
}) => {
  // 4 Lifecycle Phases
  const phases = [
    {
      id: 'pre-sales',
      name: '1. Trước Bán',
      subStages: 'Lead → Khảo sát → Nhu cầu',
      customerCount: 142,
      progressPercent: 82,
      activeTasks: 48,
      atRiskCount: 8,
      potentialRevenue: '18.5 Tỷ',
      color: 'blue'
    },
    {
      id: 'during-sales',
      name: '2. Trong Bán',
      subStages: 'Báo giá → Đàm phán → Dự thảo HĐ',
      customerCount: 68,
      progressPercent: 65,
      activeTasks: 35,
      atRiskCount: 4,
      potentialRevenue: '32.0 Tỷ',
      color: 'indigo'
    },
    {
      id: 'closing',
      name: '3. Chốt Bán',
      subStages: 'Ký hợp đồng → Đặt cọc → Lên đơn',
      customerCount: 29,
      progressPercent: 91,
      activeTasks: 18,
      atRiskCount: 1,
      potentialRevenue: '24.8 Tỷ',
      color: 'emerald'
    },
    {
      id: 'after-sales',
      name: '4. Sau Bán',
      subStages: 'Giao hàng → Nghiệm thu → CSKH',
      customerCount: 310,
      progressPercent: 96,
      activeTasks: 52,
      atRiskCount: 2,
      potentialRevenue: '65.2 Tỷ',
      color: 'amber'
    }
  ];

  // Top at-risk customers needing immediate attention
  const atRiskCustomers = [
    {
      id: 'cust-1',
      name: 'Công ty CP Xây Dựng Nam Cường',
      code: 'KH-000412',
      stage: 'Đàm phán điều khoản thanh toán',
      phase: 'Trong bán',
      potentialValue: '6.5 Tỷ',
      pic: 'Lê Hoàng Nam',
      riskReason: 'Chưa phản hồi báo giá điều chỉnh sau 4 ngày',
      nextAction: 'Gặp trực tiếp GĐ Tài chính Nam Cường ngày 23/08'
    },
    {
      id: 'cust-2',
      name: 'Tập Đoàn Đầu Tư Hạ Tầng Phúc Long',
      code: 'KH-000589',
      stage: 'Khảo sát dự án KCN Yên Phong',
      phase: 'Trước bán',
      potentialValue: '12.0 Tỷ',
      pic: 'Nguyễn Văn Hưng',
      riskReason: 'Đối thủ chào giá thép cuộn thấp hơn 1.5%',
      nextAction: 'Lập phương án chiết khấu khối lượng lớn và bảo hành 2 năm'
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
              Customer Lifecycle Engine
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span>HÀNH TRÌNH KHÁCH HÀNG & TIẾN ĐỘ CHUYỂN ĐỔI</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị tiến độ khách hàng 4 giai đoạn: Trước bán → Trong bán → Chốt bán → Sau bán
          </p>
        </div>

        <button
          onClick={() => onNavigateToCrm && onNavigateToCrm()}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto hover:underline"
        >
          <span>Mở chi tiết CRM Pipeline</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4 Phases Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {phases.map((phase) => (
          <div
            key={phase.id}
            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all shadow-2xs space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-900">{phase.name}</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {phase.customerCount} Khách
              </span>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              {phase.subStages}
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Tiến độ quy trình:</span>
                <strong className="text-slate-900">{phase.progressPercent}%</strong>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${phase.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
              <span>Quy mô tiềm năng:</span>
              <strong className="text-emerald-700">{phase.potentialRevenue}</strong>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Đang mở {phase.activeTasks} Task</span>
              {phase.atRiskCount > 0 && (
                <span className="text-rose-600 font-extrabold flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{phase.atRiskCount} Nguy cơ trễ</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Top At-risk Customer Alerts */}
      <div className="bg-rose-50/40 border border-rose-200 p-4 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-rose-800 font-extrabold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>CẢNH BÁO TIẾN ĐỘ KHÁCH HÀNG TRỌNG ĐIỂM CÓ NGUY CƠ DỪNG GIAO DỊCH</span>
          </div>
          <span className="text-[10px] font-bold text-rose-700">Cần hành động trong 24h</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {atRiskCustomers.map((c) => (
            <div key={c.id} className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs space-y-1.5 text-xs">
              <div className="flex items-start justify-between gap-1">
                <div>
                  <span className="font-bold text-slate-900 block">{c.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{c.code} • Giai đoạn: {c.stage}</span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                  {c.potentialValue}
                </span>
              </div>

              <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg">
                <strong>Vấn đề:</strong> {c.riskReason}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1">
                <span>Phụ trách: <strong>{c.pic}</strong></span>
                <span className="text-blue-700 font-semibold">{c.nextAction}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
