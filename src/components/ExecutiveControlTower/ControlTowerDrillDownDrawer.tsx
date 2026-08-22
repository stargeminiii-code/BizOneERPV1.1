import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  Plus,
  Send,
  Building2,
  Layers,
  ArrowRight,
  FileText,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Shield,
  Activity,
  Boxes,
  Zap,
  Check,
  BarChart3,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  EnterpriseExecutiveKpi,
  BusinessFunctionMetric,
  EnterpriseAlert
} from '../../data/controlTowerData';
import {
  Order,
  Customer,
  CrmTask,
  InventoryLayer,
  PurchaseOrder,
  CashTransaction,
  UserAccount,
  OrgLevel
} from '../../types';
import { formatNumberWithDots } from '../../data/administrativeData';

export type DrillDownTarget =
  | { type: 'kpi'; data: EnterpriseExecutiveKpi }
  | { type: 'function'; data: BusinessFunctionMetric }
  | { type: 'alert'; data: EnterpriseAlert }
  | { type: 'inventory'; data?: any }
  | { type: 'production'; data?: any }
  | { type: 'finance'; data?: any }
  | { type: 'sales'; data?: any };

interface ControlTowerDrillDownDrawerProps {
  target: DrillDownTarget | null;
  onClose: () => void;
  users: UserAccount[];
  orders: Order[];
  customers: Customer[];
  inventoryLots: InventoryLayer[];
  crmTasks: CrmTask[];
  cashTransactions: CashTransaction[];
  purchaseOrders: PurchaseOrder[];
  onDelegateTask: (newTask: Partial<CrmTask>) => void;
  onSelectOrder?: (order: Order) => void;
  onSelectCustomer?: (customer: Customer) => void;
}

export const ControlTowerDrillDownDrawer: React.FC<ControlTowerDrillDownDrawerProps> = ({
  target,
  onClose,
  users = [],
  orders = [],
  customers = [],
  inventoryLots = [],
  crmTasks = [],
  cashTransactions = [],
  purchaseOrders = [],
  onDelegateTask,
  onSelectOrder,
  onSelectCustomer
}) => {
  if (!target) return null;

  // Tab inside drawer
  const [drawerTab, setDrawerTab] = useState<'hierarchy' | 'dimensions' | 'root_cause' | 'delegate_task' | 'transactions'>('hierarchy');
  const [currentLevel, setCurrentLevel] = useState<OrgLevel>('ceo_chairman');
  const [selectedSubUnit, setSelectedSubUnit] = useState<string | null>(null);

  // Form for "+ Giao Việc Ngay"
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState(users[0]?.name || 'Lê Hoàng Nam');
  const [taskRequirements, setTaskRequirements] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('2026-08-25');
  const [taskPriority, setTaskPriority] = useState<'normal' | 'high' | 'urgent'>('high');
  const [taskTargetOutcome, setTaskTargetOutcome] = useState('');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // Title and basic stats from target
  let title = '';
  let code = '';
  let plan = '';
  let actual = '';
  let gap = '';
  let achievementRate = 100;
  let status: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
  let rootCauseSnippet = '';
  let responsiblePic = '';

  if (target.type === 'kpi') {
    title = target.data.title;
    code = target.data.code;
    plan = target.data.formattedPlan;
    actual = target.data.formattedActual;
    gap = target.data.formattedGap;
    achievementRate = target.data.achievementRate;
    status = target.data.status;
    rootCauseSnippet = target.data.description;
  } else if (target.type === 'function') {
    title = target.data.name;
    code = target.data.category.toUpperCase();
    plan = formatNumberWithDots(target.data.planValue) + ' ' + target.data.unit;
    actual = formatNumberWithDots(target.data.actualValue) + ' ' + target.data.unit;
    gap = target.data.gapText;
    achievementRate = target.data.achievementRate;
    status = target.data.status;
    responsiblePic = target.data.headOfDepartment;
    rootCauseSnippet = target.data.rootCauseAnalysis?.rootCause || '';
  } else if (target.type === 'alert') {
    title = target.data.title;
    code = target.data.type.toUpperCase();
    plan = 'Tiêu chuẩn 100%';
    actual = target.data.impactValue;
    gap = target.data.impactValue;
    achievementRate = target.data.severity === 'critical' ? 65 : target.data.severity === 'warning' ? 82 : 110;
    status = target.data.severity === 'critical' ? 'critical' : target.data.severity === 'warning' ? 'warning' : 'excellent';
    responsiblePic = target.data.pic;
    rootCauseSnippet = target.data.rootCauseSnippet || target.data.description;
  } else {
    title = 'CHI TIẾT VẬN HÀNH & KHO VẬN FIFO';
    code = 'OPS-FIFO';
    plan = '62.0 Tỷ';
    actual = '60.14 Tỷ';
    gap = '-1.86 Tỷ';
    achievementRate = 97.0;
    status = 'good';
  }

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;

    onDelegateTask({
      title: taskTitle,
      assignedTo: taskAssignee,
      notes: `[Giao việc trực tiếp từ Dashboard] - Chỉ số liên kết: ${title} (${code})\nNội dung: ${taskRequirements}\nMục tiêu cần đạt: ${taskTargetOutcome}`,
      dueDate: taskDeadline,
      priority: taskPriority,
      status: 'pending',
      customerName: title
    });

    setIsSubmittedSuccess(true);
    setTimeout(() => {
      setIsSubmittedSuccess(false);
      setTaskTitle('');
      setTaskRequirements('');
      setTaskTargetOutcome('');
      setDrawerTab('hierarchy');
    }, 1200);
  };

  return (
    <div
      id="control-tower-drilldown-drawer"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end transition-opacity"
    >
      <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white">
                {code}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  status === 'excellent'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : status === 'good'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : status === 'warning'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                Hoàn thành: {achievementRate}%
              </span>
              {responsiblePic && (
                <span className="text-xs text-slate-400 font-medium">
                  Phụ trách: <strong className="text-slate-200">{responsiblePic}</strong>
                </span>
              )}
            </div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <span>{title}</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">{rootCauseSnippet}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive Numbers Summary Strip */}
        <div className="bg-slate-800/90 text-white px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-700 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Kế Hoạch (Plan)</span>
            <span className="font-bold text-sm text-slate-200">{plan}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Thực Hiện (Actual)</span>
            <span className="font-extrabold text-sm text-blue-400">{actual}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Độ Lệch (Gap)</span>
            <span
              className={`font-bold text-sm ${
                gap.includes('-') && !gap.includes('Tiết kiệm') ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {gap}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Tốc Độ Run-Rate</span>
            <span className="font-bold text-sm text-amber-400">{achievementRate >= 90 ? 'Ổn định' : 'Cần hành động ⚠'}</span>
          </div>
        </div>

        {/* Drawer Sub Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 bg-slate-50 overflow-x-auto">
          <button
            onClick={() => setDrawerTab('hierarchy')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              drawerTab === 'hierarchy'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Phân Rã 5 Cấp Quản Trị</span>
          </button>

          <button
            onClick={() => setDrawerTab('dimensions')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              drawerTab === 'dimensions'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>5 Chiều Đánh Giá (Quality / Speed / Cost)</span>
          </button>

          <button
            onClick={() => setDrawerTab('root_cause')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              drawerTab === 'root_cause'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Root Cause & Chứng Minh Dữ Liệu</span>
          </button>

          <button
            onClick={() => setDrawerTab('transactions')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              drawerTab === 'transactions'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Nguồn Giao Dịch & Chứng Từ</span>
          </button>

          <button
            onClick={() => setDrawerTab('delegate_task')}
            className={`ml-auto pb-2.5 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap text-emerald-700 ${
              drawerTab === 'delegate_task' ? 'border-emerald-600' : 'border-transparent hover:text-emerald-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ GIAO VIỆC NGAY</span>
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-100/50">
          {/* TAB 1: 5-LEVEL DRILLDOWN HIERARCHY */}
          {drawerTab === 'hierarchy' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-xs font-extrabold uppercase text-slate-700 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Cây Phân Rã Dữ Liệu 5 Cấp Quản Trị (Top-down & Bottom-up)</span>
                </h3>

                {/* 5-Level Interactive Step Tree */}
                <div className="space-y-3">
                  {/* Level 5 */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-[11px] flex items-center justify-center">
                          L5
                        </span>
                        <div>
                          <span className="font-bold text-slate-900">CẤP TỔNG CÔNG TY (CEO / CHỦ TỊCH)</span>
                          <div className="text-[11px] text-slate-500">Mục tiêu: {plan} • Thực tế: {actual}</div>
                        </div>
                      </div>
                      <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {achievementRate}%
                      </span>
                    </div>
                  </div>

                  {/* Level 4 */}
                  <div className="pl-4 border-l-2 border-blue-400 space-y-2">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-extrabold text-[11px] flex items-center justify-center">
                            L4
                          </span>
                          <div>
                            <span className="font-bold text-slate-900">CẤP KHỐI / BAN ĐIỀU HÀNH</span>
                            <div className="text-[11px] text-slate-500">
                              Phụ trách: {responsiblePic || 'Lãnh đạo Khối'} • Tỷ lệ đóng góp: 88.5%
                            </div>
                          </div>
                        </div>
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {achievementRate}%
                        </span>
                      </div>
                    </div>

                    {/* Level 3: Chi nhánh / Vùng */}
                    <div className="pl-4 border-l-2 border-indigo-400 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">Chi Nhánh Miền Bắc (Hà Nội)</span>
                            <span className="text-amber-700 font-extrabold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              82.6%
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">PIC: Lê Hoàng Nam • Đạt: 78.5 Tỷ / 95 Tỷ</div>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">Chi Nhánh Miền Nam (TP.HCM)</span>
                            <span className="text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              94.8%
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">PIC: Nguyễn Thị Mai • Đạt: 128 Tỷ / 135 Tỷ</div>
                        </div>
                      </div>

                      {/* Level 2: Phòng ban / Team */}
                      <div className="pl-4 border-l-2 border-amber-400 space-y-2">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                          <span className="font-bold text-slate-800 block mb-1">
                            L2: Phòng Ban / Team Phụ Trách Trực Tiếp
                          </span>
                          <div className="space-y-1.5 text-[11px] text-slate-600">
                            <div className="flex items-center justify-between">
                              <span>Phòng Kinh Doanh Dự Án & B2B:</span>
                              <strong className="text-slate-900">102.0 Tỷ / 120.0 Tỷ (85.0%)</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Phòng Phân Phối Đại Lý (GT):</span>
                              <strong className="text-emerald-700">104.5 Tỷ / 110.0 Tỷ (95.0%)</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Phòng Telesales & Chăm Sóc Khách:</span>
                              <strong className="text-slate-900">43.5 Tỷ / 50.0 Tỷ (87.0%)</strong>
                            </div>
                          </div>
                        </div>

                        {/* Level 1: Nhân viên & Giao dịch */}
                        <div className="pl-4 border-l-2 border-emerald-400">
                          <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs">
                            <span className="font-bold text-emerald-900 block mb-1">
                              L1: Chuyên Viên / Cá Nhân / Nguồn Khách / SKU
                            </span>
                            <p className="text-[11px] text-emerald-800">
                              Dữ liệu giao dịch được tổng hợp tự động từ 18 chuyên viên kinh doanh, 4,180 đơn hàng và 350
                              mã SKU lưu kho FIFO.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 5 DIMENSIONS MATRIX */}
          {drawerTab === 'dimensions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                    <BarChart3 className="w-4 h-4" />
                    <span>1. QUANTITY (KHỐI LƯỢNG / SỐ LƯỢNG)</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    Tổng số lượng thực hiện đạt 91.2% định mức kỳ, tương đương 4,180 giao dịch / sản phẩm hoàn tất.
                  </p>
                  <div className="text-[11px] text-slate-500">Đo lường: Sản lượng, doanh số, số lượt xử lý.</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                    <Shield className="w-4 h-4" />
                    <span>2. QUALITY (CHẤT LƯỢNG & ĐỘ CHÍNH XÁC)</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    Độ chính xác đạt 98.8%, tỷ lệ phế phẩm / hoàn trả duy trì dưới 1.2%, CSAT đạt 96.5%.
                  </p>
                  <div className="text-[11px] text-slate-500">Đo lường: First Pass Yield, NPS, tỷ lệ sai sót.</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                    <Zap className="w-4 h-4" />
                    <span>3. EFFICIENCY (HIỆU SUẤT & CHI PHÍ)</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    Năng suất 2.1 Tỷ/người, ROI Marketing 5.04x, OEE nhà máy 84.5%, tiết kiệm 4.8% giá mua NCC.
                  </p>
                  <div className="text-[11px] text-slate-500">Đo lường: Chi phí đơn vị, suất đầu tư, thời gian chu kỳ.</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                    <Clock className="w-4 h-4" />
                    <span>4. TIMELINESS (ĐÚNG HẠN & SLA)</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    Tỷ lệ giao hàng đúng hẹn đạt 97.8%, thời gian phản hồi tin nhắn / hotline &lt; 30 giây.
                  </p>
                  <div className="text-[11px] text-slate-500">Đo lường: Lead Time, SLA, OTIF.</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>5. OUTCOME (KẾT QUẢ KINH DOANH & ĐÓNG GÓP TẬP ĐOÀN)</span>
                </div>
                <p className="text-xs text-slate-700 font-medium">
                  Đảm bảo hoàn thành 89.1% kế hoạch doanh thu và 107.8% thanh khoản tiền mặt sẵn sàng, không gây áp lực
                  dòng tiền cho chuỗi cung ứng quý 3/2026.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ROOT CAUSE & DATA PROOF */}
          {drawerTab === 'root_cause' && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ENGINE)</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block">Nguyên nhân cốt lõi:</span>
                    <p className="text-slate-800 mt-0.5 bg-white p-2.5 rounded-xl border border-rose-200">
                      {target.type === 'function' && target.data.rootCauseAnalysis
                        ? target.data.rootCauseAnalysis.rootCause
                        : 'Thị trường Miền Bắc tăng trưởng chậm 15% do chuyển giao danh mục hàng mới; Đội B2B chốt deal dự án bị dời tiến độ sang tháng 9.'}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block">Dữ liệu chứng minh (Data Evidence):</span>
                    <p className="text-slate-800 mt-0.5 bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-[11px]">
                      {target.type === 'function' && target.data.rootCauseAnalysis
                        ? target.data.rootCauseAnalysis.evidenceData
                        : 'Doanh thu Chi nhánh Hà Nội đạt 78.5 Tỷ / 95 Tỷ (82.6%); 4 Hợp đồng dự án lớn trị giá 18.5 Tỷ đang ở bước thương thảo.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="font-bold text-slate-600 block text-[10px]">Người chịu trách nhiệm (PIC):</span>
                      <strong className="text-slate-900">{responsiblePic || 'Lê Hoàng Nam (GĐ Kinh Doanh B2B)'}</strong>
                    </div>
                    <div>
                      <span className="font-bold text-slate-600 block text-[10px]">Hạn hoàn thành khắc phục:</span>
                      <strong className="text-blue-700">2026-08-30 (Còn 9 ngày)</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <h4 className="text-xs font-bold text-slate-800">Phương án khắc phục đề xuất:</h4>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                  <li>Tập trung đôn đốc 4 hợp đồng dự án B2B trọng điểm để chốt dứt điểm trước ngày 30/08.</li>
                  <li>Tự động kích hoạt thông báo xuất hàng FIFO cho các lô hàng lưu kho trên 45 ngày.</li>
                  <li>Hỗ trợ kinh phí kích cầu cho hệ thống đại lý cấp 1 và kênh thương mại điện tử.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: RAW TRANSACTIONS & SOURCE DATA */}
          {drawerTab === 'transactions' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-xs font-extrabold uppercase text-slate-700 mb-3 flex items-center justify-between">
                  <span>Dữ Liệu Giao Dịch Thực Tế Liên Quan ({orders.length} Đơn hàng gần nhất)</span>
                  <span className="text-[11px] text-blue-600 font-bold">Real-time Sync</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                        <th className="py-2 px-3">Mã Đơn</th>
                        <th className="py-2 px-3">Khách Hàng</th>
                        <th className="py-2 px-3">Ngày Lên Đơn</th>
                        <th className="py-2 px-3 text-right">Tổng Tiền</th>
                        <th className="py-2 px-3">Trạng Thái</th>
                        <th className="py-2 px-3 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {orders.slice(0, 6).map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-mono font-bold text-blue-600">{ord.orderNumber || ord.id}</td>
                          <td className="py-2 px-3">{ord.customerName}</td>
                          <td className="py-2 px-3 text-slate-500">{ord.createdAt?.slice(0, 10) || '2026-08-16'}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatNumberWithDots(ord.totalAmount || 0)} đ
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {ord.status || 'Hoàn tất'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => onSelectOrder && onSelectOrder(ord)}
                              className="text-blue-600 hover:text-blue-800 font-bold text-[11px]"
                            >
                              Xem Đơn
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GIAO VIỆC TRỰC TIẾP TỪ DASHBOARD (+ GIAO VIỆC) */}
          {drawerTab === 'delegate_task' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>GIAO VIỆC & CHỈ ĐẠO TRỰC TIẾP TỪ DASHBOARD</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tác vụ sẽ được đồng bộ ngay lập tức vào danh mục công việc của nhân sự và báo cáo tiến độ về Dashboard.
                </p>
              </div>

              {isSubmittedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-bold animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Đã giao việc thành công! Hệ thống đã gửi thông báo đến nhân sự phụ trách.</span>
                </div>
              )}

              <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tiêu đề công việc / Chỉ đạo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`Ví dụ: Đẩy mạnh chốt hợp đồng và xử lý vấn đề [${title}]`}
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Người nhận việc (PIC)</label>
                    <select
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-medium"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Thời hạn hoàn thành (Deadline)</label>
                    <input
                      type="date"
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-medium"
                    >
                    </input>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mức độ ưu tiên</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-medium"
                    >
                      <option value="normal">Bình thường (Normal)</option>
                      <option value="high">Ưu tiên cao (High)</option>
                      <option value="urgent">Khẩn cấp (Urgent - Báo cáo hàng ngày)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mục tiêu định lượng cần đạt</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Đạt 100% mục tiêu doanh thu 95 Tỷ"
                      value={taskTargetOutcome}
                      onChange={(e) => setTaskTargetOutcome(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Yêu cầu cụ thể & Kế hoạch hành động</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả chi tiết yêu cầu, giải pháp phối hợp liên phòng ban và các mốc kiểm tra..."
                    value={taskRequirements}
                    onChange={(e) => setTaskRequirements(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDrawerTab('hierarchy')}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Giao Việc & Kích Hoạt Tác Vụ</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="bg-white px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            BizOne ERP • Quản trị và Điều hành Doanh nghiệp
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
