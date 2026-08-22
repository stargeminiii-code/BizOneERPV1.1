import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Layers,
  Target,
  DollarSign,
  UserCheck,
  CheckCircle2,
  Building2,
  Briefcase,
  Sliders,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { EnterprisePlan, PlanType, PlanPeriodGranularity, UserAccount, KpiDefinition } from '../../types';
import { INITIAL_KPI_DEFINITIONS, INITIAL_WORK_CATEGORIES } from '../../data/enterprisePlanningData';

interface EnterprisePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlan: (plan: EnterprisePlan) => void;
  initialPlan?: EnterprisePlan | null;
  parentPlans?: EnterprisePlan[];
  users?: UserAccount[];
  currentUser?: UserAccount;
}

export const EnterprisePlanModal: React.FC<EnterprisePlanModalProps> = ({
  isOpen,
  onClose,
  onSavePlan,
  initialPlan,
  parentPlans = [],
  users = [],
  currentUser
}) => {
  const [planName, setPlanName] = useState('');
  const [planType, setPlanType] = useState<PlanType>('sales');
  const [granularity, setGranularity] = useState<PlanPeriodGranularity>('month');
  const [periodYear, setPeriodYear] = useState<number>(2026);
  const [periodMonth, setPeriodMonth] = useState<number>(8);
  const [periodQuarter, setPeriodQuarter] = useState<number>(3);
  const [division, setDivision] = useState('Khối Kinh Doanh');
  const [unitName, setUnitName] = useState('Chi nhánh Chính - Hà Nội & Miền Bắc');
  const [department, setDepartment] = useState('Phòng Bán Hàng & Dự Án');
  const [teamName, setTeamName] = useState('Team Kinh Doanh KV1');
  const [picName, setPicName] = useState(users[0]?.name || 'Lê Hoàng Nam');
  const [parentPlanId, setParentPlanId] = useState<string>('');
  const [objective, setObjective] = useState('');
  const [workCategoryId, setWorkCategoryId] = useState(INITIAL_WORK_CATEGORIES[0]?.id || '');
  const [workGroup, setWorkGroup] = useState('Telesales & Gọi điện');
  const [kpiCode, setKpiCode] = useState('KPI_REVENUE');
  const [target, setTarget] = useState<number>(150000000);
  const [unit, setUnit] = useState('VNĐ');
  const [weight, setWeight] = useState<number>(35);
  const [budget, setBudget] = useState<number>(10000000);
  const [expectedResult, setExpectedResult] = useState('');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-31');

  useEffect(() => {
    if (initialPlan) {
      setPlanName(initialPlan.planName);
      setPlanType(initialPlan.planType);
      setGranularity(initialPlan.granularity);
      setPeriodYear(initialPlan.periodYear || 2026);
      setPeriodMonth(initialPlan.periodMonth || 8);
      setPeriodQuarter(initialPlan.periodQuarter || 3);
      setDivision(initialPlan.division);
      setUnitName(initialPlan.unitName);
      setDepartment(initialPlan.department);
      setTeamName(initialPlan.teamName || '');
      setPicName(initialPlan.picName);
      setParentPlanId(initialPlan.parentPlanId || '');
      setObjective(initialPlan.objective);
      setWorkCategoryId(initialPlan.workCategoryId || INITIAL_WORK_CATEGORIES[0]?.id || '');
      setWorkGroup(initialPlan.workGroup || '');
      setKpiCode(initialPlan.kpiCode);
      setTarget(initialPlan.target);
      setUnit(initialPlan.unit);
      setWeight(initialPlan.weight);
      setBudget(initialPlan.budget);
      setExpectedResult(initialPlan.expectedResult);
      setStartDate(initialPlan.startDate);
      setEndDate(initialPlan.endDate);
    } else {
      setPlanName('');
      setObjective('');
      setExpectedResult('');
      setParentPlanId('');
    }
  }, [initialPlan, isOpen]);

  if (!isOpen) return null;

  const handleKpiChange = (code: string) => {
    setKpiCode(code);
    const kpi = INITIAL_KPI_DEFINITIONS.find((k) => k.kpiCode === code);
    if (kpi) {
      setUnit(kpi.unit);
      setTarget(kpi.defaultTarget);
      setWeight(kpi.weight);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    const matchedKpi = INITIAL_KPI_DEFINITIONS.find((k) => k.kpiCode === kpiCode);
    const matchedCategory = INITIAL_WORK_CATEGORIES.find((c) => c.id === workCategoryId);

    let periodLabel = `Năm ${periodYear}`;
    if (granularity === 'quarter') periodLabel = `Quý ${periodQuarter}/${periodYear}`;
    if (granularity === 'month') periodLabel = `Tháng ${periodMonth < 10 ? '0' + periodMonth : periodMonth}/${periodYear}`;

    const newPlan: EnterprisePlan = {
      id: initialPlan?.id || `pln-${Date.now()}`,
      planCode:
        initialPlan?.planCode ||
        `PLN-${periodYear}-${planType.toUpperCase().slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`,
      planName,
      planType,
      granularity,
      periodYear,
      periodQuarter: granularity === 'quarter' ? periodQuarter : undefined,
      periodMonth: granularity === 'month' ? periodMonth : undefined,
      periodLabel,
      division,
      unitName,
      department,
      teamName,
      ownerName: currentUser?.name || 'Võ Minh Đăng (CEO)',
      ownerRole: currentUser?.position || currentUser?.roleTitle || 'CEO / Lãnh Đạo',
      picName,
      parentPlanId: parentPlanId || undefined,
      objective,
      workCategoryId,
      workCategoryName: matchedCategory?.name || 'HẠNG MỤC HOẠT ĐỘNG CHUNG',
      workGroup,
      kpiCode,
      kpiName: matchedKpi?.kpiName || 'Chỉ Tiêu Kinh Doanh',
      target: Number(target),
      unit,
      weight: Number(weight),
      budget: Number(budget),
      expectedResult,
      startDate,
      endDate,
      actual: initialPlan?.actual || 0,
      achievementRate: initialPlan?.achievementRate || 0,
      qualityScore: initialPlan?.qualityScore || 90,
      efficiencyRate: initialPlan?.efficiencyRate || 88,
      timelinessRate: initialPlan?.timelinessRate || 90,
      gap: initialPlan?.gap || Number(target),
      forecast: initialPlan?.forecast || Number(target),
      forecastStatus: initialPlan?.forecastStatus || 'on_track',
      status: initialPlan?.status || 'in_execution',
      createdAt: initialPlan?.createdAt || new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    onSavePlan(newPlan);
    onClose();
  };

  return (
    <div
      id="enterprise-plan-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        id="enterprise-plan-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-300 font-bold border border-white/20">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialPlan ? 'CHỈNH SỬA KẾ HOẠCH DOANH NGHIỆP' : 'THIẾT LẬP KẾ HOẠCH DOANH NGHIỆP (BM01.QC11-EWH)'}
              </h2>
              <p className="text-xs text-blue-200">
                Chuẩn hóa kế hoạch: Năm → Quý → Tháng → Tuần → Ngày → KPI → Tác Vụ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto text-xs">
          {/* Tên Kế Hoạch */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tên kế hoạch hành động <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="VD: Kế hoạch Bán Hàng & Mở Rộng 20 Đại Lý Mới Tháng 08/2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Phân loại & Chu kỳ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Loại Kế Hoạch</label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value as PlanType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="strategic">Chiến lược Toàn Công Ty</option>
                <option value="business">Kinh Doanh & Phát Triển</option>
                <option value="sales">Bán Hàng & Mở Rộng Thị Trường</option>
                <option value="marketing">Marketing & Digital Leads</option>
                <option value="production">Sản Xuất & Gia Công Tôn Thép</option>
                <option value="procurement">Thu Mua & Chuỗi Cung Ứng</option>
                <option value="inventory">Tồn Kho & Quản Trị FIFO</option>
                <option value="finance">Tài Chính & Thu Hồi Nợ</option>
                <option value="employee_work">Kế Hoạch Làm Việc Cá Nhân</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Chu Kỳ Phân Rã</label>
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value as PlanPeriodGranularity)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="year">Theo Năm (Yearly)</option>
                <option value="quarter">Theo Quý (Quarterly)</option>
                <option value="month">Theo Tháng (Monthly)</option>
                <option value="week">Theo Tuần (Weekly)</option>
                <option value="day">Theo Ngày (Daily)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Kỳ Thực Hiện (Tháng / Quý)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={periodYear}
                  onChange={(e) => setPeriodYear(Number(e.target.value))}
                  className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  placeholder="2026"
                />
                {granularity === 'month' ? (
                  <select
                    value={periodMonth}
                    onChange={(e) => setPeriodMonth(Number(e.target.value))}
                    className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        T{m}
                      </option>
                    ))}
                  </select>
                ) : granularity === 'quarter' ? (
                  <select
                    value={periodQuarter}
                    onChange={(e) => setPeriodQuarter(Number(e.target.value))}
                    className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    {[1, 2, 3, 4].map((q) => (
                      <option key={q} value={q}>
                        Quý {q}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </div>
          </div>

          {/* Cơ Cấu Tổ Chức & PIC */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 uppercase text-[11px] text-blue-700">
              <Building2 className="w-3.5 h-3.5" />
              <span>Phân Bổ Cấp Quản Lý (CÔNG TY → KHỐI → ĐƠN VỊ → PHÒNG BAN → TEAM → NHÂN SỰ)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Khối / Division</label>
                <input
                  type="text"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Đơn Vị / Chi Nhánh</label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phòng Ban / Team</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Người Chịu Trách Nhiệm Chính (PIC)</span>
                </label>
                <select
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} - {u.position || u.roleTitle || 'Nhân sự'} ({u.department || 'BizOne'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Liên kết Kế hoạch cấp trên (Parent Plan)
                </label>
                <select
                  value={parentPlanId}
                  onChange={(e) => setParentPlanId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- Không có (Kế hoạch cấp cao nhất) --</option>
                  {parentPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.planCode}] {p.planName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Mục tiêu & Hạng mục công việc */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Mục Tiêu Cốt Lõi (Objective) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="VD: Đạt 150 triệu doanh số, mở rộng 20 khách hàng mới qua kênh Telesales và Đi thị trường..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Chỉ tiêu KPI & Ngân sách */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-3">
            <div className="font-bold text-blue-900 flex items-center gap-1.5 uppercase text-[11px]">
              <Target className="w-3.5 h-3.5 text-blue-700" />
              <span>Chỉ Tiêu KPI & Ngân Sách Phân Bổ (4 Chiều Đánh Giá)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Chỉ Số KPI Đo Lường</label>
                <select
                  value={kpiCode}
                  onChange={(e) => handleKpiChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-900"
                >
                  {INITIAL_KPI_DEFINITIONS.map((k) => (
                    <option key={k.kpiCode} value={k.kpiCode}>
                      [{k.kpiCode}] {k.kpiName} ({k.categoryLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mục Tiêu (Target)</label>
                <input
                  type="number"
                  required
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Đơn Vị Tính</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Trọng Số Kế Hoạch (%)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Ngân Sách Được Cấp (VNĐ)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Hạn Thực Hiện (End Date)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Kết quả kỳ vọng */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Kết Quả Kỳ Vọng (Expected Outcome)
            </label>
            <input
              type="text"
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              placeholder="VD: Doanh thu 150 triệu, nợ quá hạn < 2%, 100% đối chiếu VietQR khớp đúng"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialPlan ? 'Lưu Thay Đổi Kế Hoạch' : 'Phê Duyệt & Ban Hành Kế Hoạch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
