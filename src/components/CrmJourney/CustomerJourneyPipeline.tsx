import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  Sparkles,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Filter,
  UserCheck,
  Zap,
  PhoneCall,
  FileText
} from 'lucide-react';
import { Customer, CustomerJourneyStage, CustomerLifecyclePhase, CrmTask } from '../../types';
import { formatNumberWithDots } from '../../data/administrativeData';

interface CustomerJourneyPipelineProps {
  customers: Customer[];
  onUpdateCustomerStage?: (customer: Customer, newStage: CustomerJourneyStage) => void;
  onOpenCustomerDetail?: (customer: Customer) => void;
  onOpenCreateOrder?: (customerName?: string) => void;
  onOpenCrmTask?: (customerName?: string, taskTitle?: string) => void;
}

export const STAGES_CONFIG: {
  stage: CustomerJourneyStage;
  phase: CustomerLifecyclePhase;
  label: string;
  badgeColor: string;
  defaultProgress: number;
}[] = [
  // PRE-SALES
  { stage: 'lead_search', phase: 'pre_sales', label: '1. Tìm kiếm Lead', badgeColor: 'bg-slate-100 text-slate-800', defaultProgress: 15 },
  { stage: 'lead_qualification', phase: 'pre_sales', label: '2. Qualification', badgeColor: 'bg-blue-100 text-blue-800', defaultProgress: 30 },
  { stage: 'initial_consult', phase: 'pre_sales', label: '3. Khảo sát / Gặp', badgeColor: 'bg-indigo-100 text-indigo-800', defaultProgress: 45 },
  // DURING SALES
  { stage: 'demo_proposal', phase: 'during_sales', label: '4. Báo giá / Proposal', badgeColor: 'bg-purple-100 text-purple-800', defaultProgress: 60 },
  { stage: 'negotiation_terms', phase: 'during_sales', label: '5. Đàm phán ĐK', badgeColor: 'bg-amber-100 text-amber-800', defaultProgress: 75 },
  { stage: 'contract_closing', phase: 'during_sales', label: '6. Ký HĐ / Đặt cọc', badgeColor: 'bg-emerald-100 text-emerald-800', defaultProgress: 90 },
  // AFTER SALES
  { stage: 'delivery_fulfillment', phase: 'after_sales', label: '7. Giao hàng & NT', badgeColor: 'bg-teal-100 text-teal-800', defaultProgress: 95 },
  { stage: 'cskh_care', phase: 'after_sales', label: '8. Chăm sóc CSKH', badgeColor: 'bg-cyan-100 text-cyan-800', defaultProgress: 98 },
  { stage: 'retention_upsell', phase: 'after_sales', label: '9. Tái Mua & Up-sell', badgeColor: 'bg-green-100 text-green-800', defaultProgress: 100 }
];

export const CustomerJourneyPipeline: React.FC<CustomerJourneyPipelineProps> = ({
  customers = [],
  onUpdateCustomerStage,
  onOpenCustomerDetail,
  onOpenCreateOrder,
  onOpenCrmTask
}) => {
  const [selectedPhase, setSelectedPhase] = useState<'all' | CustomerLifecyclePhase>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Map each customer into a stage if undefined
  const mappedCustomers = customers.map((c, index) => {
    let stage = c.journeyStage;
    if (!stage) {
      if (c.totalSpent > 10000000) stage = 'retention_upsell';
      else if (c.totalSpent > 0) stage = 'delivery_fulfillment';
      else if (index % 3 === 0) stage = 'demo_proposal';
      else if (index % 3 === 1) stage = 'negotiation_terms';
      else stage = 'lead_qualification';
    }

    const matchedConfig = STAGES_CONFIG.find((s) => s.stage === stage) || STAGES_CONFIG[0];
    const progressPercent = c.journeyProgressPercent || matchedConfig.defaultProgress;

    return {
      ...c,
      journeyStage: stage,
      lifecyclePhase: matchedConfig.phase,
      journeyProgressPercent: progressPercent,
      currentTaskTitle: c.currentTaskTitle || `Xử lý bước [${matchedConfig.label}]`,
      nextTaskTitle: c.nextTaskTitle || 'Theo dõi tiến độ trong tuần',
      potentialValue: c.potentialValue || (c.totalSpent > 0 ? c.totalSpent * 1.2 : 25000000),
      isAtRisk: c.isAtRisk || ((c.debt ?? 0) > 5000000)
    };
  });

  const filteredCustomers = mappedCustomers.filter((c) => {
    const matchPhase = selectedPhase === 'all' || c.lifecyclePhase === selectedPhase;
    const matchSearch =
      !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.assignedStaff || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchPhase && matchSearch;
  });

  const getCustomersInStage = (stage: CustomerJourneyStage) => {
    return filteredCustomers.filter((c) => c.journeyStage === stage);
  };

  const handleNextStage = (c: Customer) => {
    const currentIndex = STAGES_CONFIG.findIndex((s) => s.stage === c.journeyStage);
    if (currentIndex < STAGES_CONFIG.length - 1) {
      const nextStage = STAGES_CONFIG[currentIndex + 1].stage;
      if (onUpdateCustomerStage) {
        onUpdateCustomerStage(c, nextStage);
      }
    }
  };

  const handlePrevStage = (c: Customer) => {
    const currentIndex = STAGES_CONFIG.findIndex((s) => s.stage === c.journeyStage);
    if (currentIndex > 0) {
      const prevStage = STAGES_CONFIG[currentIndex - 1].stage;
      if (onUpdateCustomerStage) {
        onUpdateCustomerStage(c, prevStage);
      }
    }
  };

  return (
    <div id="customer-journey-pipeline" className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>HÀNH TRÌNH KHÁCH HÀNG & TIẾN ĐỘ BÁN HÀNG TOÀN DIỆN (CUSTOMER JOURNEY PIPELINE)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi từng bước: Pre-Sales (Tiếp cận) → During Sales (Báo giá & Ký HĐ) → After Sales (Nghiệm thu & Tái mua)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl font-semibold">
            <button
              onClick={() => setSelectedPhase('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedPhase === 'all' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toàn Bộ Giai Đoạn
            </button>
            <button
              onClick={() => setSelectedPhase('pre_sales')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedPhase === 'pre_sales' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Pre-Sales (Tiếp cận)
            </button>
            <button
              onClick={() => setSelectedPhase('during_sales')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedPhase === 'during_sales' ? 'bg-purple-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. During Sales (Chốt đơn)
            </button>
            <button
              onClick={() => setSelectedPhase('after_sales')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedPhase === 'after_sales' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. After Sales (CSKH & Up-sell)
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm khách hàng trong phễu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs w-48 focus:w-60 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* 9-Column Kanban Journey Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-[1550px]">
          {STAGES_CONFIG.filter((s) => selectedPhase === 'all' || s.phase === selectedPhase).map((col) => {
            const list = getCustomersInStage(col.stage);
            const totalStagePotential = list.reduce((sum, c) => sum + (c.potentialValue || 0), 0);

            return (
              <div
                key={col.stage}
                className="w-72 shrink-0 bg-slate-100/90 rounded-2xl p-3 border border-slate-200 flex flex-col max-h-[75vh]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                  <div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${col.badgeColor}`}>
                      {col.label}
                    </span>
                    <div className="text-[11px] text-slate-500 font-semibold mt-1">
                      {list.length} khách • {formatNumberWithDots(totalStagePotential)} đ
                    </div>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-white text-slate-700 font-extrabold text-xs flex items-center justify-center border border-slate-200 shadow-xs">
                    {list.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                  {list.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs italic">
                      Chưa có khách ở giai đoạn này
                    </div>
                  ) : (
                    list.map((c) => (
                      <div
                        key={c.id}
                        className={`bg-white rounded-xl p-3.5 border shadow-xs hover:shadow-md transition-all space-y-2.5 ${
                          c.isAtRisk ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        {/* Title & Risk flag */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <button
                              onClick={() => onOpenCustomerDetail && onOpenCustomerDetail(c)}
                              className="font-bold text-xs text-slate-900 hover:text-blue-600 transition-colors text-left"
                            >
                              {c.name}
                            </button>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{c.phone}</div>
                          </div>
                          {c.isAtRisk && (
                            <span
                              title="Khách hàng có nguy cơ mất hoặc nợ quá hạn"
                              className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-extrabold uppercase flex items-center gap-0.5"
                            >
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                              <span>At-Risk</span>
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>Tiến độ hành trình:</span>
                            <span className="font-bold text-blue-700">{c.journeyProgressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${c.journeyProgressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Current & Next Action */}
                        <div className="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-600 space-y-1">
                          <div className="flex items-start gap-1">
                            <span className="font-bold text-slate-700 shrink-0">Đang làm:</span>
                            <span className="line-clamp-1">{c.currentTaskTitle}</span>
                          </div>
                          <div className="flex items-start gap-1 text-blue-700">
                            <span className="font-bold shrink-0">Kế tiếp:</span>
                            <span className="line-clamp-1">{c.nextTaskTitle}</span>
                          </div>
                        </div>

                        {/* PIC & Value */}
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                          <span className="text-slate-500 truncate max-w-[110px]">
                            PIC: <strong>{c.assignedStaff || 'Lê Hoàng Nam'}</strong>
                          </span>
                          <span className="font-bold text-emerald-600">
                            {formatNumberWithDots(c.potentialValue || 0)} đ
                          </span>
                        </div>

                        {/* Stage Transition Action Buttons */}
                        <div className="flex items-center justify-between pt-1 gap-1">
                          <button
                            onClick={() => handlePrevStage(c)}
                            title="Lùi về bước trước"
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded text-[10px]"
                          >
                            ← Lùi
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onOpenCrmTask && onOpenCrmTask(c.name, `[Hành trình] CSKH ${c.name}`)}
                              title="Tạo tác vụ liên kết"
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded text-[10px] font-semibold"
                            >
                              + Task
                            </button>
                            <button
                              onClick={() => onOpenCreateOrder && onOpenCreateOrder(c.name)}
                              title="Lên đơn / Báo giá"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded text-[10px] font-semibold"
                            >
                              + Đơn
                            </button>
                          </div>

                          <button
                            onClick={() => handleNextStage(c)}
                            title="Chuyển sang bước tiếp theo (Tự động kích hoạt task mới)"
                            className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer shadow-2xs"
                          >
                            <span>Tiếp</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
