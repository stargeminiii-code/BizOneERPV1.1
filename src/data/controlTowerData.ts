import { OrgLevel, OrgScope } from '../types';

export interface BusinessFunctionMetric {
  id: string;
  name: string;
  nameEn?: string;
  category:
    | 'sales'
    | 'marketing'
    | 'cskh'
    | 'finance'
    | 'procurement'
    | 'supply_chain'
    | 'warehouse'
    | 'logistics'
    | 'production'
    | 'rd'
    | 'qa_qc'
    | 'retail'
    | 'ecommerce'
    | 'hr'
    | 'it'
    | 'operations';
  headOfDepartment: string;
  planValue: number;
  actualValue: number;
  unit: string;
  achievementRate: number; // percentage (e.g., 89)
  gapValue: number;
  gapText: string;
  trend: 'up' | 'down' | 'flat';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  alertCount: number;
  primaryKpiSummary: string; // e.g. "Revenue 89% | MSKH 94% | Margin 24%"
  keyIndicators: {
    name: string;
    target: string;
    actual: string;
    rate: number;
    qualityScore?: number;
    status: 'good' | 'warning' | 'critical';
  }[];
  rootCauseAnalysis?: {
    isAtRisk: boolean;
    rootCause: string;
    evidenceData: string;
    responsiblePic: string;
    relatedDepartment: string;
    actionPlan: string;
    deadline: string;
    progress: number;
  };
  hierarchyBreakdown: {
    level: OrgLevel;
    levelName: string;
    units: {
      id: string;
      name: string;
      pic: string;
      target: number;
      actual: number;
      rate: number;
      status: 'good' | 'warning' | 'critical';
      subUnits?: {
        name: string;
        pic: string;
        target: number;
        actual: number;
        rate: number;
      }[];
    }[];
  }[];
}

export interface EnterpriseExecutiveKpi {
  id: string;
  title: string;
  code: string;
  planValue: number;
  actualValue: number;
  formattedPlan: string;
  formattedActual: string;
  formattedGap: string;
  unit: string;
  achievementRate: number;
  gap: number;
  trend: 'up' | 'down' | 'flat';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  dimension: 'revenue' | 'profit' | 'cash' | 'debt' | 'customers' | 'orders' | 'inventory' | 'production' | 'logistics' | 'cskh' | 'cost' | 'company_kpi';
  description: string;
  quantityMetric: string;
  qualityMetric: string;
  efficiencyMetric: string;
  timelinessMetric: string;
  outcomeMetric: string;
}

export interface EnterpriseAlert {
  id: string;
  type: 'critical_kpi' | 'overdue_task' | 'customer_sla' | 'contract_risk' | 'inventory_issue' | 'overdue_debt' | 'high_achiever';
  severity: 'critical' | 'warning' | 'success';
  title: string;
  description: string;
  impactValue: string;
  department: string;
  pic: string;
  deadline?: string;
  status: 'open' | 'in_progress' | 'resolved';
  linkedEntityId?: string;
  linkedEntityType?: 'kpi' | 'customer' | 'order' | 'sku' | 'lot' | 'task';
  rootCauseSnippet?: string;
}

export interface PerformanceTimeSlice {
  periodLabel: string;
  planRevenue: number;
  actualRevenue: number;
  forecastRevenue: number;
  planProfit: number;
  actualProfit: number;
  planCost: number;
  actualCost: number;
  achievementRate: number;
  orderCount: number;
  productionYield: number;
}

export const INITIAL_TIME_SLICES: Record<'year' | 'quarter' | 'month' | 'week' | 'day', PerformanceTimeSlice[]> = {
  year: [
    { periodLabel: '2023', planRevenue: 280000000000, actualRevenue: 275000000000, forecastRevenue: 275000000000, planProfit: 56000000000, actualProfit: 54000000000, planCost: 224000000000, actualCost: 221000000000, achievementRate: 98.2, orderCount: 45200, productionYield: 98.5 },
    { periodLabel: '2024', planRevenue: 320000000000, actualRevenue: 318000000000, forecastRevenue: 318000000000, planProfit: 67200000000, actualProfit: 68100000000, planCost: 252800000000, actualCost: 249900000000, achievementRate: 99.3, orderCount: 52100, productionYield: 98.8 },
    { periodLabel: '2025', planRevenue: 350000000000, actualRevenue: 342000000000, forecastRevenue: 342000000000, planProfit: 77000000000, actualProfit: 75200000000, planCost: 273000000000, actualCost: 266800000000, achievementRate: 97.7, orderCount: 58900, productionYield: 99.1 },
    { periodLabel: '2026 (YTD)', planRevenue: 420000000000, actualRevenue: 382000000000, forecastRevenue: 408000000000, planProfit: 92400000000, actualProfit: 84040000000, planCost: 327600000000, actualCost: 297960000000, achievementRate: 90.9, orderCount: 48200, productionYield: 98.6 }
  ],
  quarter: [
    { periodLabel: 'Q1-2026', planRevenue: 95000000000, actualRevenue: 98200000000, forecastRevenue: 98200000000, planProfit: 20900000000, actualProfit: 22100000000, planCost: 74100000000, actualCost: 76100000000, achievementRate: 103.3, orderCount: 12400, productionYield: 99.0 },
    { periodLabel: 'Q2-2026', planRevenue: 105000000000, actualRevenue: 102400000000, forecastRevenue: 102400000000, planProfit: 23100000000, actualProfit: 22528000000, planCost: 81900000000, actualCost: 79872000000, achievementRate: 97.5, orderCount: 13900, productionYield: 98.7 },
    { periodLabel: 'Q3-2026 (Hiện tại)', planRevenue: 110000000000, actualRevenue: 98500000000, forecastRevenue: 106200000000, planProfit: 24200000000, actualProfit: 21670000000, planCost: 85800000000, actualCost: 76830000000, achievementRate: 89.5, orderCount: 11800, productionYield: 98.2 },
    { periodLabel: 'Q4-2026 (Dự kiến)', planRevenue: 110000000000, actualRevenue: 82900000000, forecastRevenue: 101400000000, planProfit: 24200000000, actualProfit: 17742000000, planCost: 85800000000, actualCost: 65158000000, achievementRate: 75.3, orderCount: 10100, productionYield: 98.4 }
  ],
  month: [
    { periodLabel: 'T05-2026', planRevenue: 35000000000, actualRevenue: 36200000000, forecastRevenue: 36200000000, planProfit: 7700000000, actualProfit: 8100000000, planCost: 27300000000, actualCost: 28100000000, achievementRate: 103.4, orderCount: 4600, productionYield: 99.2 },
    { periodLabel: 'T06-2026', planRevenue: 37000000000, actualRevenue: 35800000000, forecastRevenue: 35800000000, planProfit: 8140000000, actualProfit: 7876000000, planCost: 28860000000, actualCost: 27924000000, achievementRate: 96.7, orderCount: 4450, productionYield: 98.6 },
    { periodLabel: 'T07-2026', planRevenue: 38000000000, actualRevenue: 37100000000, forecastRevenue: 37100000000, planProfit: 8360000000, actualProfit: 8162000000, planCost: 29640000000, actualCost: 28938000000, achievementRate: 97.6, orderCount: 4720, productionYield: 98.9 },
    { periodLabel: 'T08-2026 (Hiện tại)', planRevenue: 40000000000, actualRevenue: 35600000000, forecastRevenue: 38400000000, planProfit: 8800000000, actualProfit: 7832000000, planCost: 31200000000, actualCost: 27768000000, achievementRate: 89.0, orderCount: 4180, productionYield: 98.4 }
  ],
  week: [
    { periodLabel: 'Tuần 30', planRevenue: 9500000000, actualRevenue: 9800000000, forecastRevenue: 9800000000, planProfit: 2090000000, actualProfit: 2156000000, planCost: 7410000000, actualCost: 7644000000, achievementRate: 103.1, orderCount: 1150, productionYield: 99.1 },
    { periodLabel: 'Tuần 31', planRevenue: 10000000000, actualRevenue: 9400000000, forecastRevenue: 9400000000, planProfit: 2200000000, actualProfit: 2068000000, planCost: 7800000000, actualCost: 7332000000, achievementRate: 94.0, orderCount: 1080, productionYield: 98.5 },
    { periodLabel: 'Tuần 32', planRevenue: 10000000000, actualRevenue: 8900000000, forecastRevenue: 8900000000, planProfit: 2200000000, actualProfit: 1958000000, planCost: 7800000000, actualCost: 6942000000, achievementRate: 89.0, orderCount: 990, productionYield: 98.2 },
    { periodLabel: 'Tuần 33 (Hiện tại)', planRevenue: 10500000000, actualRevenue: 7500000000, forecastRevenue: 9800000000, planProfit: 2310000000, actualProfit: 1650000000, planCost: 8190000000, actualCost: 5850000000, achievementRate: 71.4, orderCount: 960, productionYield: 98.1 }
  ],
  day: [
    { periodLabel: '12/08', planRevenue: 1500000000, actualRevenue: 1620000000, forecastRevenue: 1620000000, planProfit: 330000000, actualProfit: 356400000, planCost: 1170000000, actualCost: 1263600000, achievementRate: 108.0, orderCount: 165, productionYield: 99.4 },
    { periodLabel: '13/08', planRevenue: 1500000000, actualRevenue: 1480000000, forecastRevenue: 1480000000, planProfit: 330000000, actualProfit: 325600000, planCost: 1170000000, actualCost: 1154400000, achievementRate: 98.6, orderCount: 152, productionYield: 98.8 },
    { periodLabel: '14/08', planRevenue: 1600000000, actualRevenue: 1550000000, forecastRevenue: 1550000000, planProfit: 352000000, actualProfit: 341000000, planCost: 1248000000, actualCost: 1209000000, achievementRate: 96.8, orderCount: 160, productionYield: 99.0 },
    { periodLabel: '15/08', planRevenue: 1600000000, actualRevenue: 1420000000, forecastRevenue: 1420000000, planProfit: 352000000, actualProfit: 312400000, planCost: 1248000000, actualCost: 1107600000, achievementRate: 88.7, orderCount: 144, productionYield: 97.9 },
    { periodLabel: '16/08 (Hôm nay)', planRevenue: 1650000000, actualRevenue: 1430000000, forecastRevenue: 1580000000, planProfit: 363000000, actualProfit: 314600000, planCost: 1287000000, actualCost: 1115400000, achievementRate: 86.6, orderCount: 149, productionYield: 98.3 }
  ]
};

export const INITIAL_EXECUTIVE_KPIS: EnterpriseExecutiveKpi[] = [
  {
    id: 'kpi-rev',
    title: 'DOANH THU TOÀN CÔNG TY',
    code: 'REV-CORP',
    planValue: 350000000000,
    actualValue: 312000000000,
    formattedPlan: '350.0 Tỷ',
    formattedActual: '312.0 Tỷ',
    formattedGap: '-38.0 Tỷ',
    unit: 'VNĐ',
    achievementRate: 89.1,
    gap: -38000000000,
    trend: 'down',
    status: 'warning',
    dimension: 'revenue',
    description: 'Doanh thu thuần hợp nhất toàn hệ thống (Bán buôn, Bán lẻ, E-commerce, Dự án)',
    quantityMetric: 'Tổng số 4,180 đơn hoàn tất',
    qualityMetric: 'Tỷ lệ đơn thanh toán đúng hạn: 94.2%',
    efficiencyMetric: 'Doanh thu trung bình/Nhân viên: 2.1 Tỷ',
    timelinessMetric: 'Tốc độ thực hiện kỳ: 89% kế hoạch',
    outcomeMetric: 'Đóng góp 100% dòng thu vận hành'
  },
  {
    id: 'kpi-profit',
    title: 'LỢI NHUẬN GỘP',
    code: 'GP-CORP',
    planValue: 84000000000,
    actualValue: 74880000000,
    formattedPlan: '84.0 Tỷ',
    formattedActual: '74.88 Tỷ',
    formattedGap: '-9.12 Tỷ',
    unit: 'VNĐ',
    achievementRate: 89.1,
    gap: -9120000000,
    trend: 'down',
    status: 'warning',
    dimension: 'profit',
    description: 'Biên lợi nhuận gộp toàn bộ các nhóm sản phẩm và kênh phân phối',
    quantityMetric: 'Lợi nhuận đóng góp: 74.88 Tỷ',
    qualityMetric: 'Tỷ suất lợi nhuận gộp (GPM): 24.0%',
    efficiencyMetric: 'Chi phí vốn FIFO tối ưu: 237.1 Tỷ',
    timelinessMetric: 'Ghi nhận theo kỳ phát sinh',
    outcomeMetric: 'Đảm bảo tỷ lệ sinh lời mục tiêu HĐQT'
  },
  {
    id: 'kpi-cash',
    title: 'DÒNG TIỀN THUẦN (CASH ON HAND)',
    code: 'CF-NET',
    planValue: 45000000000,
    actualValue: 48500000000,
    formattedPlan: '45.0 Tỷ',
    formattedActual: '48.5 Tỷ',
    formattedGap: '+3.5 Tỷ',
    unit: 'VNĐ',
    achievementRate: 107.8,
    gap: 3500000000,
    trend: 'up',
    status: 'excellent',
    dimension: 'cash',
    description: 'Số dư tiền mặt & tiền gửi thanh khoản sẵn sàng tại các ngân hàng',
    quantityMetric: 'Dòng tiền tự do dương: +3.5 Tỷ',
    qualityMetric: 'Hệ số thanh toán hiện hành: 2.15',
    efficiencyMetric: 'Vòng quay tiền mặt (CCC): 38 ngày',
    timelinessMetric: 'Thực thu hàng ngày đạt 98%',
    outcomeMetric: 'Đảm bảo thanh khoản trả NCC & Lương 100%'
  },
  {
    id: 'kpi-debt',
    title: 'CÔNG NỢ PHẢI THU (AR DEBT)',
    code: 'AR-OVERDUE',
    planValue: 18000000000,
    actualValue: 15200000000,
    formattedPlan: '< 18.0 Tỷ',
    formattedActual: '15.2 Tỷ',
    formattedGap: '-2.8 Tỷ (Tốt)',
    unit: 'VNĐ',
    achievementRate: 115.5,
    gap: -2800000000,
    trend: 'up',
    status: 'good',
    dimension: 'debt',
    description: 'Tổng nợ khách hàng trong hạn và quá hạn (Kiểm soát chặt dưới hạn mức)',
    quantityMetric: '88 Khách hàng đang có nợ',
    qualityMetric: 'Tỷ lệ nợ quá hạn >30d: 3.2% (rất thấp)',
    efficiencyMetric: 'DSO (Số ngày thu tiền TB): 28.5 ngày',
    timelinessMetric: 'Nhắc nợ tự động qua Zalo/SMS 100%',
    outcomeMetric: 'Thu hồi nợ an toàn không phát sinh nợ xấu'
  },
  {
    id: 'kpi-customer',
    title: 'KHÁCH HÀNG MỚI (MSKH)',
    code: 'NEW-CUST',
    planValue: 1950,
    actualValue: 1850,
    formattedPlan: '1,950 Khách',
    formattedActual: '1,850 Khách',
    formattedGap: '-100 Khách',
    unit: 'Khách',
    achievementRate: 94.8,
    gap: -100,
    trend: 'flat',
    status: 'good',
    dimension: 'customers',
    description: 'Mở rộng tệp khách hàng B2B, Đại lý, Showroom & Khách trực tuyến',
    quantityMetric: '1,850 Khách hàng mới phát sinh giao dịch',
    qualityMetric: 'Tỷ lệ khách đủ điều kiện (Qualified): 68%',
    efficiencyMetric: 'Chi phí mua khách hàng (CAC): 215,000 đ',
    timelinessMetric: 'Tiếp cận khách trong vòng 15 phút',
    outcomeMetric: 'Tăng trưởng quy mô thị phần 18% YoY'
  },
  {
    id: 'kpi-orders',
    title: 'ĐƠN HÀNG & OTIF',
    code: 'ORD-FULFILL',
    planValue: 4500,
    actualValue: 4180,
    formattedPlan: '4,500 Đơn',
    formattedActual: '4,180 Đơn',
    formattedGap: '-320 Đơn',
    unit: 'Đơn',
    achievementRate: 92.9,
    gap: -320,
    trend: 'flat',
    status: 'good',
    dimension: 'orders',
    description: 'Tổng số đơn hàng thực hiện và tỷ lệ giao đúng hạn - đủ số lượng',
    quantityMetric: '4,180 Đơn hàng hoàn tất',
    qualityMetric: 'Tỷ lệ giao hàng chuẩn OTIF: 96.8%',
    efficiencyMetric: 'Thời gian xử lý đơn TB: 2.2 giờ',
    timelinessMetric: 'Giao hàng đúng hẹn 97.8%',
    outcomeMetric: 'Tỷ lệ khiếu nại đơn < 0.3%'
  },
  {
    id: 'kpi-inventory',
    title: 'TỒN KHO & FIFO ACCURACY',
    code: 'INV-FIFO',
    planValue: 62000000000,
    actualValue: 60140000000,
    formattedPlan: '62.0 Tỷ',
    formattedActual: '60.14 Tỷ',
    formattedGap: '-1.86 Tỷ',
    unit: 'VNĐ',
    achievementRate: 97.0,
    gap: -1860000000,
    trend: 'up',
    status: 'good',
    dimension: 'inventory',
    description: 'Giá trị tồn kho tính theo chuẩn FIFO nhiều lớp (Multi-layer FIFO)',
    quantityMetric: '18,450 Đơn vị hàng hóa / 350 SKU',
    qualityMetric: 'Độ chính xác xuất kho FIFO: 99.4%',
    efficiencyMetric: 'Vòng quay tồn kho (ITR): 6.8 vòng/năm',
    timelinessMetric: 'Cảnh báo hạn dùng trước 45 ngày 100%',
    outcomeMetric: 'Tỷ lệ hàng cận date/hủy < 0.05%'
  },
  {
    id: 'kpi-prod',
    title: 'SẢN XUẤT & XƯỞNG (YIELD)',
    code: 'PROD-YIELD',
    planValue: 120000,
    actualValue: 109200,
    formattedPlan: '120,000 Sp',
    formattedActual: '109,200 Sp',
    formattedGap: '-10,800 Sp',
    unit: 'Sản phẩm',
    achievementRate: 91.0,
    gap: -10800,
    trend: 'down',
    status: 'warning',
    dimension: 'production',
    description: 'Tiến độ kế hoạch sản xuất tại các nhà máy và tỷ lệ thành phẩm đạt chuẩn (Yield)',
    quantityMetric: '109,200 Thành phẩm hoàn thành',
    qualityMetric: 'Tỷ lệ thành phẩm loại 1 (Yield): 98.8%',
    efficiencyMetric: 'OEE (Hiệu suất tổng thể thiết bị): 84.5%',
    timelinessMetric: 'Đúng tiến độ Lệnh SX: 92.4%',
    outcomeMetric: 'Tiết kiệm 2.4% định mức nguyên vật liệu'
  },
  {
    id: 'kpi-logistics',
    title: 'GIAO HÀNG & LOGISTICS',
    code: 'LOG-SLA',
    planValue: 100,
    actualValue: 97.8,
    formattedPlan: '99.0%',
    formattedActual: '97.8%',
    formattedGap: '-1.2%',
    unit: '%',
    achievementRate: 98.8,
    gap: -1.2,
    trend: 'flat',
    status: 'good',
    dimension: 'logistics',
    description: 'Chỉ số cam kết thời gian giao hàng, an toàn hàng hóa và chi phí chặng cuối',
    quantityMetric: '4,088 Chuyến giao thành công',
    qualityMetric: 'Tỷ lệ hàng hư hỏng vận chuyển: 0.08%',
    efficiencyMetric: 'Chi phí vận chuyển TB/Đơn: 24,000 đ',
    timelinessMetric: 'Thời gian giao nội thành < 4 giờ',
    outcomeMetric: 'Tỷ lệ hoàn trả do lỗi giao vận: 0.5%'
  },
  {
    id: 'kpi-cskh',
    title: 'CSKH (CSAT & RETENTION)',
    code: 'CS-CSAT',
    planValue: 95,
    actualValue: 96.5,
    formattedPlan: '95.0%',
    formattedActual: '96.5%',
    formattedGap: '+1.5%',
    unit: '%',
    achievementRate: 101.6,
    gap: 1.5,
    trend: 'up',
    status: 'excellent',
    dimension: 'cskh',
    description: 'Chỉ số hài lòng khách hàng CSAT, NPS và tỷ lệ khách hàng mua lại định kỳ',
    quantityMetric: '1,420 Đánh giá phản hồi',
    qualityMetric: 'Chỉ số Net Promoter Score (NPS): +78',
    efficiencyMetric: 'Thời gian giải quyết Ticket TB: 1.2 giờ',
    timelinessMetric: 'Phản hồi tin nhắn/Hotline < 30 giây',
    outcomeMetric: 'Tỷ lệ giữ chân khách hàng (Retention): 88.2%'
  },
  {
    id: 'kpi-cost',
    title: 'KIỂM SOÁT CHI PHÍ (OPEX / BUDGET)',
    code: 'OPEX-BUDGET',
    planValue: 32000000000,
    actualValue: 30080000000,
    formattedPlan: '< 32.0 Tỷ',
    formattedActual: '30.08 Tỷ',
    formattedGap: '-1.92 Tỷ (Tiết kiệm)',
    unit: 'VNĐ',
    achievementRate: 106.0,
    gap: -1920000000,
    trend: 'up',
    status: 'good',
    dimension: 'cost',
    description: 'Kiểm soát ngân sách chi phí quản lý doanh nghiệp, bán hàng và vận hành',
    quantityMetric: 'Tổng giải ngân: 30.08 Tỷ / 32.0 Tỷ',
    qualityMetric: 'Tỷ lệ phê duyệt chi đúng thẩm quyền: 100%',
    efficiencyMetric: 'Chi phí OPEX/Doanh thu: 9.6% (mục tiêu < 10%)',
    timelinessMetric: 'Quyết toán tạm ứng đúng hạn: 98%',
    outcomeMetric: 'Tiết kiệm ngân sách 1.92 Tỷ cho quỹ dự phòng'
  },
  {
    id: 'kpi-corp',
    title: 'KPI TỔNG THỂ DOANH NGHIỆP',
    code: 'CORP-INDEX',
    planValue: 100,
    actualValue: 94.2,
    formattedPlan: '100.0%',
    formattedActual: '94.2%',
    formattedGap: '-5.8%',
    unit: '%',
    achievementRate: 94.2,
    gap: -5.8,
    trend: 'flat',
    status: 'good',
    dimension: 'company_kpi',
    description: 'Chỉ số sức khỏe vận hành và hoàn thành chiến lược tổng hợp (BSC/OKRs)',
    quantityMetric: '85 Chỉ số KPI toàn diện',
    qualityMetric: '68 KPI Đạt/Vượt, 12 Cảnh báo, 5 Nguy cơ',
    efficiencyMetric: 'Tốc độ phản ứng sự cố: 2.5 giờ',
    timelinessMetric: 'Kế hoạch hành động hoàn tất: 91%',
    outcomeMetric: 'Doanh nghiệp duy trì tốc độ tăng trưởng ổn định'
  }
];

export const INITIAL_BUSINESS_FUNCTIONS: BusinessFunctionMetric[] = [
  {
    id: 'bf-sales',
    name: 'Kinh Doanh',
    nameEn: 'Sales & Revenue',
    category: 'sales',
    headOfDepartment: 'Trần Văn Nam (Phó TGĐ Kinh Doanh)',
    planValue: 280000000000,
    actualValue: 250000000000,
    unit: 'VNĐ',
    achievementRate: 89.3,
    gapValue: -30000000000,
    gapText: '-30.0 Tỷ',
    trend: 'down',
    status: 'warning',
    alertCount: 3,
    primaryKpiSummary: 'Revenue 89% | MSKH 94% | Conversion 10.8% | TQT 82% | Margin 24% | ⚠ 3 KPI',
    keyIndicators: [
      { name: 'Doanh thu thuần', target: '280.0 Tỷ', actual: '250.0 Tỷ', rate: 89.3, status: 'warning' },
      { name: 'Khách hàng mới (MSKH)', target: '1,500 Khách', actual: '1,410 Khách', rate: 94.0, status: 'good' },
      { name: 'Tỷ lệ chuyển đổi Lead-to-Order', target: '12.0%', actual: '10.8%', rate: 90.0, status: 'warning' },
      { name: 'Giá trị đơn trung bình (TQT)', target: '75.0 Tr', actual: '61.5 Tr', rate: 82.0, status: 'warning' },
      { name: 'Biên lợi nhuận gộp', target: '25.0%', actual: '24.0%', rate: 96.0, status: 'good' }
    ],
    rootCauseAnalysis: {
      isAtRisk: true,
      rootCause: 'Thị trường Miền Bắc tăng trưởng chậm 15% do chuyển giao danh mục hàng mới; Đội B2B chốt deal dự án bị dời tiến độ sang tháng 9',
      evidenceData: 'Doanh thu Chi nhánh Hà Nội đạt 78.5 Tỷ / 95 Tỷ (82.6%); 4 Hợp đồng dự án lớn trị giá 18.5 Tỷ đang ở bước thương thảo',
      responsiblePic: 'Lê Hoàng Nam (GĐ Kinh Doanh B2B)',
      relatedDepartment: 'Khối Kinh Doanh & Chi Nhánh Hà Nội',
      actionPlan: 'Đẩy mạnh chốt 4 deal dự án trước 30/08; Triển khai chương trình khuyến mãi bundle kích cầu cho mạng lưới đại lý',
      deadline: '2026-08-30',
      progress: 65
    },
    hierarchyBreakdown: [
      {
        level: 'director',
        levelName: 'Chi Nhánh / Vùng',
        units: [
          { id: 'u-hn', name: 'Chi Nhánh Miền Bắc (Hà Nội)', pic: 'Lê Hoàng Nam', target: 95000000000, actual: 78500000000, rate: 82.6, status: 'warning' },
          { id: 'u-hcm', name: 'Chi Nhánh Miền Nam (TP.HCM)', pic: 'Nguyễn Thị Mai', target: 135000000000, actual: 128000000000, rate: 94.8, status: 'good' },
          { id: 'u-dn', name: 'Chi Nhánh Miền Trung (Đà Nẵng)', pic: 'Trần Văn Hưng', target: 50000000000, actual: 43500000000, rate: 87.0, status: 'warning' }
        ]
      },
      {
        level: 'team_lead',
        levelName: 'Phòng Ban / Kênh Bán Hàng',
        units: [
          { id: 'u-b2b', name: 'Phòng Bán Hàng B2B & Dự Án', pic: 'Phạm Đức Anh', target: 120000000000, actual: 102000000000, rate: 85.0, status: 'warning' },
          { id: 'u-dl', name: 'Phòng Phân Phối Đại Lý (GT)', pic: 'Vũ Thị Loan', target: 110000000000, actual: 104500000000, rate: 95.0, status: 'good' },
          { id: 'u-tele', name: 'Phòng Telesales & Direct Sales', pic: 'Hoàng Minh Quân', target: 50000000000, actual: 43500000000, rate: 87.0, status: 'warning' }
        ]
      }
    ]
  },
  {
    id: 'bf-marketing',
    name: 'Marketing',
    nameEn: 'Marketing & Growth',
    category: 'marketing',
    headOfDepartment: 'Nguyễn Bích Ngọc (GĐ Marketing)',
    planValue: 8500000000,
    actualValue: 8160000000,
    unit: 'VNĐ',
    achievementRate: 96.0,
    gapValue: -340000000,
    gapText: '-340 Tr',
    trend: 'up',
    status: 'good',
    alertCount: 1,
    primaryKpiSummary: 'Lead 108% | Qualified Lead 91% | CPA 96% | ROI 112% | ⚠ 1 KPI',
    keyIndicators: [
      { name: 'Số lượng Lead mới', target: '12,000 Lead', actual: '12,960 Lead', rate: 108.0, status: 'good' },
      { name: 'Tỷ lệ Lead đạt chuẩn (Qualified)', target: '35.0%', actual: '31.8%', rate: 90.9, status: 'warning' },
      { name: 'Chi phí trên Lead (CPL)', target: '70,000 đ', actual: '63,000 đ', rate: 110.0, status: 'good' },
      { name: 'Chi phí trên Khách hàng (CPA)', target: '250,000 đ', actual: '240,000 đ', rate: 104.0, status: 'good' },
      { name: 'Hiệu quả đầu tư Marketing (ROI)', target: '4.5x', actual: '5.04x', rate: 112.0, status: 'good' }
    ],
    rootCauseAnalysis: {
      isAtRisk: false,
      rootCause: 'Kênh TikTok Ads mang lại lượng lead cao nhưng tỷ lệ lọc chưa sạch so với Google Search Ads',
      evidenceData: 'Tỷ lệ Qualified Lead TikTok là 22%, trong khi Google Search đạt 54%',
      responsiblePic: 'Đặng Tuấn Tú (Lead Digital Marketing)',
      relatedDepartment: 'Phòng Digital Marketing',
      actionPlan: 'Tối ưu form thu thập thông tin trên landing page và siết chặt tiêu chí phân loại lead trước khi chuyển Sales',
      deadline: '2026-08-25',
      progress: 80
    },
    hierarchyBreakdown: [
      {
        level: 'team_lead',
        levelName: 'Kênh Marketing',
        units: [
          { id: 'mkt-search', name: 'Google & SEO Organic', pic: 'Vũ Đức Thịnh', target: 3500, actual: 3850, rate: 110.0, status: 'good' },
          { id: 'mkt-social', name: 'Facebook & Social Ads', pic: 'Lê Thu Hà', target: 5000, actual: 5200, rate: 104.0, status: 'good' },
          { id: 'mkt-video', name: 'TikTok & Video Viral', pic: 'Ngô Hải Yến', target: 3500, actual: 3910, rate: 111.7, status: 'good' }
        ]
      }
    ]
  },
  {
    id: 'bf-cskh',
    name: 'Chăm Sóc Khách Hàng',
    nameEn: 'Customer Service',
    category: 'cskh',
    headOfDepartment: 'Hoàng Kim Dung (Trưởng Phòng CSKH)',
    planValue: 95,
    actualValue: 96.5,
    unit: '%',
    achievementRate: 101.6,
    gapValue: 1.5,
    gapText: '+1.5%',
    trend: 'up',
    status: 'excellent',
    alertCount: 0,
    primaryKpiSummary: 'CSAT 96.5% | NPS 78 | SLA 98.2% | Resolution 1.2h | Retention 88% | ✓ Đạt',
    keyIndicators: [
      { name: 'Chỉ số hài lòng khách hàng (CSAT)', target: '95.0%', actual: '96.5%', rate: 101.6, status: 'good' },
      { name: 'Điểm giới thiệu khách hàng (NPS)', target: '+70', actual: '+78', rate: 111.4, status: 'good' },
      { name: 'Tuân thủ cam kết dịch vụ (SLA)', target: '95.0%', actual: '98.2%', rate: 103.4, status: 'good' },
      { name: 'Thời gian xử lý khiếu nại TB', target: '2.0h', actual: '1.2h', rate: 140.0, status: 'good' },
      { name: 'Tỷ lệ khách hàng mua lại (Retention)', target: '85.0%', actual: '88.2%', rate: 103.8, status: 'good' }
    ],
    hierarchyBreakdown: [
      {
        level: 'team_lead',
        levelName: 'Đội ngũ Hỗ Trợ',
        units: [
          { id: 'cs-vip', name: 'Đội Chăm Sóc Khách Hàng VIP / Doanh Nghiệp', pic: 'Hoàng Kim Dung', target: 98, actual: 99.2, rate: 101.2, status: 'good' },
          { id: 'cs-mass', name: 'Đội Tổng Đài & Phản Hồi Trực Tuyến', pic: 'Trần Thảo Linh', target: 95, actual: 95.8, rate: 100.8, status: 'good' }
        ]
      }
    ]
  },
  {
    id: 'bf-finance',
    name: 'Tài Chính - Kế Toán',
    nameEn: 'Finance & Accounting',
    category: 'finance',
    headOfDepartment: 'Nguyễn Văn Hùng (Giám Đốc Tài Chính - CFO)',
    planValue: 45000000000,
    actualValue: 48500000000,
    unit: 'VNĐ',
    achievementRate: 107.8,
    gapValue: 3500000000,
    gapText: '+3.5 Tỷ',
    trend: 'up',
    status: 'excellent',
    alertCount: 1,
    primaryKpiSummary: 'Cash +4.2B | Gross Margin 32% | Thu nợ 92% | Chi phí/Budget 94% | ⚠ 1 KPI',
    keyIndicators: [
      { name: 'Số dư thanh khoản tiền mặt', target: '45.0 Tỷ', actual: '48.5 Tỷ', rate: 107.8, status: 'good' },
      { name: 'Tỷ lệ thu hồi nợ đến hạn', target: '90.0%', actual: '92.4%', rate: 102.7, status: 'good' },
      { name: 'Biên EBITDA toàn hệ thống', target: '18.0%', actual: '18.6%', rate: 103.3, status: 'good' },
      { name: 'Tỷ lệ giải ngân đúng dự toán', target: '100%', actual: '94.0%', rate: 94.0, status: 'warning' },
      { name: 'Thời gian đóng sổ sách kế toán', target: '3 ngày', actual: '2 ngày', rate: 133.0, status: 'good' }
    ],
    rootCauseAnalysis: {
      isAtRisk: false,
      rootCause: 'Khoản chi phí mua sắm thiết bị xưởng 1.8 Tỷ được đàm phán giảm giá thành công giúp tiết kiệm chi phí',
      evidenceData: 'Báo cáo lưu chuyển tiền tệ và bảng cân đối thử nghiệm ngày 16/08/2026',
      responsiblePic: 'Lê Thị Thu Thủy (Kế Toán Trưởng)',
      relatedDepartment: 'Phòng Kế Toán Tổng Hợp',
      actionPlan: 'Duy trì hạn mức thấu chi ưu đãi tại Vietcombank & BIDV để sẵn sàng mở rộng quy mô quý 4',
      deadline: '2026-09-05',
      progress: 90
    },
    hierarchyBreakdown: [
      {
        level: 'team_lead',
        levelName: 'Phòng Chức Năng',
        units: [
          { id: 'fin-ar', name: 'Tổ Quản Lý Công Nợ & Thu Tiền', pic: 'Lê Thị Thu Thủy', target: 95, actual: 96.5, rate: 101.5, status: 'good' },
          { id: 'fin-tax', name: 'Tổ Kế Toán Thuế & HĐĐT AI', pic: 'Đỗ Thị Minh', target: 100, actual: 100, rate: 100.0, status: 'good' }
        ]
      }
    ]
  },
  {
    id: 'bf-warehouse',
    name: 'Kho Vận & FIFO',
    nameEn: 'Warehouse & Inventory',
    category: 'warehouse',
    headOfDepartment: 'Nguyễn Văn Toàn (Trưởng Ban Quản Lý Kho)',
    planValue: 62000000000,
    actualValue: 60140000000,
    unit: 'VNĐ',
    achievementRate: 97.0,
    gapValue: -1860000000,
    gapText: '-1.86 Tỷ',
    trend: 'up',
    status: 'good',
    alertCount: 2,
    primaryKpiSummary: 'Inventory 97% | FIFO Accuracy 99.4% | Stockout 2.1% | Aging >30d 4.5% | ⚠ 2 Lot',
    keyIndicators: [
      { name: 'Độ chính xác tồn kho & FIFO', target: '99.0%', actual: '99.4%', rate: 100.4, status: 'good' },
      { name: 'Tỷ lệ thiếu hàng (Stockout Rate)', target: '< 2.0%', actual: '2.1%', rate: 95.0, status: 'warning' },
      { name: 'Hàng tồn kho lưu > 30 ngày', target: '< 5.0%', actual: '4.5%', rate: 110.0, status: 'good' },
      { name: 'Tốc độ soạn hàng và dán tem QR', target: '15 phút', actual: '12 phút', rate: 120.0, status: 'good' },
      { name: 'Hàng lỗi/hư hỏng trong kho', target: '< 0.1%', actual: '0.04%', rate: 160.0, status: 'good' }
    ],
    rootCauseAnalysis: {
      isAtRisk: true,
      rootCause: '2 Lô hàng bột nguyên liệu tại Kho Tổng Hà Nội có ngày nhập từ tháng 05/2026 còn tồn 120 bao chưa xuất hết',
      evidenceData: 'Lot LOT-20260515-A1 và LOT-20260520-B2 đang lưu 92 ngày tại Khu vực A3-R2',
      responsiblePic: 'Nguyễn Văn Toàn (Quản Lý Kho Tổng)',
      relatedDepartment: 'Kho Tổng Hà Nội & Phòng Mua Hàng',
      actionPlan: 'Ưu tiên gán xuất tự động theo thuật toán FIFO cho các đơn hàng sản xuất tuần 34',
      deadline: '2026-08-23',
      progress: 75
    },
    hierarchyBreakdown: [
      {
        level: 'director',
        levelName: 'Hệ Thống Kho Bãi',
        units: [
          { id: 'wh-main', name: 'Kho Tổng Hà Nội (Mega Hub)', pic: 'Nguyễn Văn Toàn', target: 35000000000, actual: 34100000000, rate: 97.4, status: 'good' },
          { id: 'wh-south', name: 'Kho Chi Nhánh TP.HCM', pic: 'Võ Minh Trí', target: 20000000000, actual: 19500000000, rate: 97.5, status: 'good' },
          { id: 'wh-cold', name: 'Kho Lạnh Bảo Quản Đặc Biệt', pic: 'Trần Hữu Thắng', target: 7000000000, actual: 6540000000, rate: 93.4, status: 'good' }
        ]
      }
    ]
  },
  {
    id: 'bf-production',
    name: 'Sản Xuất & Nhà Máy',
    nameEn: 'Manufacturing & Factory',
    category: 'production',
    headOfDepartment: 'Kỹ Sư Đỗ Đức Thịnh (Giám Đốc Khối Sản Xuất)',
    planValue: 120000,
    actualValue: 109200,
    unit: 'Sp',
    achievementRate: 91.0,
    gapValue: -10800,
    gapText: '-10,800 Sp',
    trend: 'down',
    status: 'warning',
    alertCount: 2,
    primaryKpiSummary: 'Sản lượng 91% | Công suất 88% | Phế phẩm 1.2% | Yield 98.8% | ⚠ 1 Chuyền',
    keyIndicators: [
      { name: 'Sản lượng hoàn thành', target: '120,000 Sp', actual: '109,200 Sp', rate: 91.0, status: 'warning' },
      { name: 'Hiệu suất công suất dây chuyền', target: '92.0%', actual: '88.0%', rate: 95.6, status: 'warning' },
      { name: 'Tỷ lệ thành phẩm đạt chuẩn (Yield)', target: '98.5%', actual: '98.8%', rate: 100.3, status: 'good' },
      { name: 'Tỷ lệ phế phẩm & hư hỏng', target: '< 1.5%', actual: '1.2%', rate: 120.0, status: 'good' },
      { name: 'Tuân thủ định mức nguyên vật liệu', target: '100%', actual: '98.2%', rate: 98.2, status: 'good' }
    ],
    rootCauseAnalysis: {
      isAtRisk: true,
      rootCause: 'Chuyền đóng gói số 2 tại Nhà Máy 1 bảo trì đột xuất motor biến tần trong 18 giờ gây chậm tiến độ 3 Lệnh sản xuất',
      evidenceData: 'Nhật ký vận hành thiết bị Nhà Máy 1 ngày 13-14/08/2026 ghi nhận downtime 18.5h',
      responsiblePic: 'Kỹ Sư Đỗ Đức Thịnh (Quản Đốc NM1)',
      relatedDepartment: 'Nhà Máy Sản Xuất 1 & Phòng Cơ Điện',
      actionPlan: 'Tăng ca kíp 3 từ ngày 18-22/08 để bù lại 10,800 sản phẩm thiếu hụt cho kho xuất hàng',
      deadline: '2026-08-25',
      progress: 50
    },
    hierarchyBreakdown: [
      {
        level: 'director',
        levelName: 'Nhà Máy & Phân Xưởng',
        units: [
          { id: 'fact-1', name: 'Nhà Máy Sản Xuất Số 1 (KCN Bắc Thăng Long)', pic: 'Đỗ Đức Thịnh', target: 75000, actual: 66800, rate: 89.0, status: 'warning' },
          { id: 'fact-2', name: 'Nhà Máy Chế Biến Số 2 (KCN Tân Bình)', pic: 'Lý Quốc Cường', target: 45000, actual: 42400, rate: 94.2, status: 'good' }
        ]
      }
    ]
  },
  {
    id: 'bf-procurement',
    name: 'Mua Hàng & NCC',
    nameEn: 'Procurement & Sourcing',
    category: 'procurement',
    headOfDepartment: 'Trương Mỹ Hạnh (Trưởng Phòng Mua Hàng)',
    planValue: 42000000000,
    actualValue: 39900000000,
    unit: 'VNĐ',
    achievementRate: 95.0,
    gapValue: -2100000000,
    gapText: '-2.1 Tỷ (Tiết kiệm)',
    trend: 'up',
    status: 'good',
    alertCount: 1,
    primaryKpiSummary: 'PO Fulfilled 95% | On-time 92% | Supplier SLA 97% | Cost saving 4.8% | ⚠ 1 PO',
    keyIndicators: [
      { name: 'Tỷ lệ hoàn thành Đơn Mua Hàng (PO)', target: '98.0%', actual: '95.0%', rate: 96.9, status: 'good' },
      { name: 'Giao hàng đúng hẹn từ NCC', target: '95.0%', actual: '92.4%', rate: 97.2, status: 'warning' },
      { name: 'Đánh giá chất lượng NCC (SLA)', target: '95.0%', actual: '97.2%', rate: 102.3, status: 'good' },
      { name: 'Tỷ lệ tiết kiệm chi phí mua sắm', target: '3.0%', actual: '4.8%', rate: 160.0, status: 'good' }
    ],
    hierarchyBreakdown: [
      {
        level: 'team_lead',
        levelName: 'Đội Mua Hàng Chuyên Trách',
        units: [
          { id: 'pur-raw', name: 'Mua Nguyên Vật Liệu & Bao Bì', pic: 'Trương Mỹ Hạnh', target: 30000000000, actual: 28500000000, rate: 95.0, status: 'good' },
          { id: 'pur-equip', name: 'Mua Thiết Bị & Dịch Vụ Vận Hành', pic: 'Lê Minh Tuấn', target: 12000000000, actual: 11400000000, rate: 95.0, status: 'good' }
        ]
      }
    ]
  },
  {
    id: 'bf-supply-chain',
    name: 'Chuỗi Cung Ứng',
    nameEn: 'Supply Chain',
    category: 'supply_chain',
    headOfDepartment: 'Nguyễn Thanh Tùng (Giám Đốc Supply Chain)',
    planValue: 98,
    actualValue: 96.2,
    unit: '%',
    achievementRate: 98.1,
    gapValue: -1.8,
    gapText: '-1.8%',
    trend: 'up',
    status: 'good',
    alertCount: 0,
    primaryKpiSummary: 'OTIF 96.2% | Lead Time 3.4d | Fill Rate 98.1% | Disruption Risk 0 | ✓ Tốt',
    keyIndicators: [
      { name: 'Chỉ số On-Time In-Full (OTIF)', target: '98.0%', actual: '96.2%', rate: 98.1, status: 'good' },
      { name: 'Thời gian chu kỳ cung ứng (Lead Time)', target: '4.0 ngày', actual: '3.4 ngày', rate: 117.0, status: 'good' },
      { name: 'Tỷ lệ lấp đầy đơn hàng (Fill Rate)', target: '98.0%', actual: '98.1%', rate: 100.1, status: 'good' },
      { name: 'Độ chính xác dự báo cung cầu (Demand Accuracy)', target: '90.0%', actual: '91.5%', rate: 101.6, status: 'good' }
    ],
    hierarchyBreakdown: [
      {
        level: 'team_lead',
        levelName: 'Tổ Điều Phối Cung Ứng',
        units: [
          { id: 'sc-plan', name: 'Bộ Phận Kế Hoạch Cung Cầu (S&OP)', pic: 'Nguyễn Thanh Tùng', target: 95, actual: 96.5, rate: 101.5, status: 'good' }
        ]
      }
    ]
  },
  {
    id: 'bf-logistics',
    name: 'Logistics & Vận Tải',
    nameEn: 'Logistics & Transport',
    category: 'logistics',
    headOfDepartment: 'Lâm Văn Khoa (Trưởng Ban Điều Phối Giao Vận)',
    planValue: 4200,
    actualValue: 4088,
    unit: 'Chuyến',
    achievementRate: 97.3,
    gapValue: -112,
    gapText: '-112 Chuyến',
    trend: 'up',
    status: 'good',
    alertCount: 0,
    primaryKpiSummary: 'Giao thành công 97.8% | Thời gian TB 18h | Chi phí 24k/đơn | Tỷ lệ hoàn 1.9% | ✓ Tốt',
    keyIndicators: [
      { name: 'Tỷ lệ giao hàng thành công', target: '97.0%', actual: '97.8%', rate: 100.8, status: 'good' },
      { name: 'Thời gian giao hàng trung bình', target: '24.0h', actual: '18.0h', rate: 133.0, status: 'good' },
      { name: 'Chi phí vận chuyển trên đơn hàng', target: '28,000 đ', actual: '24,000 đ', rate: 116.0, status: 'good' },
      { name: 'Tỷ lệ đơn hàng hoàn trả (Return Rate)', target: '< 2.5%', actual: '1.9%', rate: 124.0, status: 'good' }
    ],
    hierarchyBreakdown: [
      {
        level: 'team_lead',
        levelName: 'Đội Xe & Đối Tác Vận Chuyển',
        units: [
          { id: 'log-fleet', name: 'Đội Xe Tải Nội Bộ (BizExpress)', pic: 'Lâm Văn Khoa', target: 2500, actual: 2480, rate: 99.2, status: 'good' },
          { id: 'log-3pl', name: 'Đối Tác 3PL (ViettelPost / GHN / Ahamove)', pic: 'Bùi Hải Long', target: 1700, actual: 1608, rate: 94.5, status: 'good' }
        ]
      }
    ]
  },
  {
    id: 'bf-rd',
    name: 'Nghiên Cứu & Phát Triển',
    nameEn: 'R&D & Innovation',
    category: 'rd',
    headOfDepartment: 'TS. Phan Thanh Sơn (Viện Trưởng R&D)',
    planValue: 6,
    actualValue: 6,
    unit: 'Dự án',
    achievementRate: 100.0,
    gapValue: 0,
    gapText: '0 (Đúng hạn)',
    trend: 'up',
    status: 'excellent',
    alertCount: 0,
    primaryKpiSummary: 'Dự án mới 6/6 | Tiến độ Milestone 92% | Sẵn sàng thương mại 100% | ✓ Tốt',
    keyIndicators: [
      { name: 'Số lượng sản phẩm mới phát triển', target: '6 Dự án', actual: '6 Dự án', rate: 100.0, status: 'good' },
      { name: 'Tiến độ hoàn thành mốc thử nghiệm (Milestone)', target: '90.0%', actual: '92.4%', rate: 102.6, status: 'good' },
      { name: 'Thời gian đưa sản phẩm ra thị trường (Time-to-Market)', target: '6 tháng', actual: '5.2 tháng', rate: 115.0, status: 'good' }
    ],
    hierarchyBreakdown: [
      {
        level: 'team_lead',
        levelName: 'Phòng Thí Nghiệm & Thử Nghiệm',
        units: [
          { id: 'rd-formula', name: 'Phòng Nghiên Cứu Công Thức & Sản Phẩm', pic: 'TS. Phan Thanh Sơn', target: 100, actual: 100, rate: 100.0, status: 'good' }
        ]
      }
    ]
  },
  {
    id: 'bf-qa-qc',
    name: 'Kiểm Soát Chất Lượng',
    nameEn: 'Quality Assurance (QA/QC)',
    category: 'qa_qc',
    headOfDepartment: 'Vũ Thị Minh Hạnh (Trưởng Ban QA/QC)',
    planValue: 99,
    actualValue: 99.1,
    unit: '%',
    achievementRate: 100.1,
    gapValue: 0.1,
    gapText: '+0.1%',
    trend: 'up',
    status: 'excellent',
    alertCount: 0,
    primaryKpiSummary: 'First Pass Yield 99.1% | NCR 1 vụ | Khiếu nại chất lượng 0.2% | ✓ Tốt',
    keyIndicators: [
      { name: 'Tỷ lệ kiểm định đạt chuẩn lần đầu (FPY)', target: '99.0%', actual: '99.1%', rate: 100.1, status: 'good' },
      { name: 'Số vụ việc không phù hợp (NCR)', target: '< 3 vụ', actual: '1 vụ', rate: 150.0, status: 'good' },
      { name: 'Tuân thủ tiêu chuẩn ISO & HACCP', target: '100%', actual: '100%', rate: 100.0, status: 'good' }
    ],
    hierarchyBreakdown: [
      {
        level: 'team_lead',
        levelName: 'Tổ Kiểm Soát Chất Lượng',
        units: [
          { id: 'qa-factory', name: 'Tổ Kiểm Soát Chất Lượng Hiện Trường (IQC/PQC/OQC)', pic: 'Vũ Thị Minh Hạnh', target: 100, actual: 100, rate: 100.0, status: 'good' }
        ]
      }
    ]
  },
  {
    id: 'bf-retail',
    name: 'Chuỗi Bán Lẻ',
    nameEn: 'Retail & Showrooms',
    category: 'retail',
    headOfDepartment: 'Đặng Quốc Bảo (Giám Đốc Khối Bán Lẻ)',
    planValue: 25000000000,
    actualValue: 20000000000,
    unit: 'VNĐ',
    achievementRate: 80.0,
    gapValue: -5000000000,
    gapText: '-5.0 Tỷ',
    trend: 'down',
    status: 'warning',
    alertCount: 1,
    primaryKpiSummary: 'Doanh số chuỗi 80% | Khách 1.2k/ngày | Doanh số/m2 82% | Tốc độ POS 42s | ⚠ 1 Showroom',
    keyIndicators: [
      { name: 'Doanh thu chuỗi Showroom', target: '25.0 Tỷ', actual: '20.0 Tỷ', rate: 80.0, status: 'warning' },
      { name: 'Lượt khách tham quan Showroom', target: '1,500/ngày', actual: '1,200/ngày', rate: 80.0, status: 'warning' },
      { name: 'Giá trị giỏ hàng trung bình (Basket Size)', target: '850,000 đ', actual: '790,000 đ', rate: 92.9, status: 'good' },
      { name: 'Tốc độ thanh toán thu ngân (POS)', target: '< 60s', actual: '42s', rate: 140.0, status: 'good' }
    ],
    rootCauseAnalysis: {
      isAtRisk: true,
      rootCause: 'Showroom 3 tại Cầu Giấy đang thi công cải tạo mặt tiền trong tuần đầu tháng 8 làm giảm lưu lượng khách ghé thăm 35%',
      evidenceData: 'Dữ liệu camera đếm người và doanh thu POS tại Showroom Cầu Giấy đạt 4.2 Tỷ / 6.5 Tỷ',
      responsiblePic: 'Đặng Quốc Bảo (GĐ Bán Lẻ)',
      relatedDepartment: 'Khối Bán Lẻ & Showroom',
      actionPlan: 'Hoàn thiện mặt tiền trước 20/08 và tổ chức sự kiện Grand Re-opening kèm bốc thăm trúng thưởng cuối tuần',
      deadline: '2026-08-24',
      progress: 70
    },
    hierarchyBreakdown: [
      {
        level: 'team_lead',
        levelName: 'Cửa Hàng / Showroom',
        units: [
          { id: 'ret-1', name: 'Showroom Flagship Hoàn Kiếm', pic: 'Lê Ngọc Lan', target: 10000000000, actual: 9500000000, rate: 95.0, status: 'good' },
          { id: 'ret-2', name: 'Showroom Cầu Giấy (Đang sửa)', pic: 'Trần Văn Quyết', target: 6500000000, actual: 4200000000, rate: 64.6, status: 'critical' },
          { id: 'ret-3', name: 'Showroom Quận 1 (TP.HCM)', pic: 'Nguyễn Thúy Hằng', target: 8500000000, actual: 6300000000, rate: 74.1, status: 'warning' }
        ]
      }
    ]
  },
  {
    id: 'bf-ecommerce',
    name: 'Thương Mại Điện Tử',
    nameEn: 'E-Commerce & Digital',
    category: 'ecommerce',
    headOfDepartment: 'Trịnh Hoài Nam (Trưởng Ban Thương Mại Điện Tử)',
    planValue: 35000000000,
    actualValue: 32000000000,
    unit: 'VNĐ',
    achievementRate: 91.4,
    gapValue: -3000000000,
    gapText: '-3.0 Tỷ',
    trend: 'up',
    status: 'good',
    alertCount: 0,
    primaryKpiSummary: 'GMV 91.4% | Bỏ giỏ 58% | CAC 45k | Traffic 120k/tháng | ✓ Tốt',
    keyIndicators: [
      { name: 'Tổng giá trị hàng hóa (GMV)', target: '35.0 Tỷ', actual: '32.0 Tỷ', rate: 91.4, status: 'good' },
      { name: 'Tỷ lệ hủy/hoàn đơn trực tuyến', target: '< 4.0%', actual: '2.8%', rate: 130.0, status: 'good' },
      { name: 'Lượt truy cập gian hàng (Traffic)', target: '100,000/tháng', actual: '120,000/tháng', rate: 120.0, status: 'good' },
      { name: 'Tỷ lệ chuyển đổi trang Web/App', target: '2.5%', actual: '2.8%', rate: 112.0, status: 'good' }
    ],
    hierarchyBreakdown: [
      {
        level: 'team_lead',
        levelName: 'Gian Hàng Số',
        units: [
          { id: 'ecom-web', name: 'Website BizOne E-Store', pic: 'Trịnh Hoài Nam', target: 15000000000, actual: 14200000000, rate: 94.7, status: 'good' },
          { id: 'ecom-shopee', name: 'Shopee & Lazada Mall', pic: 'Nguyễn Thị Oanh', target: 12000000000, actual: 11100000000, rate: 92.5, status: 'good' },
          { id: 'ecom-tiktok', name: 'TikTok Shop Mega Live', pic: 'Bùi Đức Anh', target: 8000000000, actual: 6700000000, rate: 83.8, status: 'warning' }
        ]
      }
    ]
  },
  {
    id: 'bf-hr',
    name: 'Nhân Sự & Tổ Chức',
    nameEn: 'Human Resources (HR)',
    category: 'hr',
    headOfDepartment: 'Nguyễn Thị Phương Thảo (GĐ Nhân Sự)',
    planValue: 150,
    actualValue: 148,
    unit: 'Nhân sự',
    achievementRate: 98.7,
    gapValue: -2,
    gapText: '-2 Người',
    trend: 'up',
    status: 'excellent',
    alertCount: 0,
    primaryKpiSummary: 'Định biên 148/150 | Năng suất 104% | Đúng giờ 97% | Đào tạo 95% | ✓ Tốt',
    keyIndicators: [
      { name: 'Tổng định biên nhân sự toàn công ty', target: '150 Người', actual: '148 Người', rate: 98.7, status: 'good' },
      { name: 'Năng suất bình quân đầu người', target: '2.0 Tỷ/người', actual: '2.1 Tỷ/người', rate: 105.0, status: 'good' },
      { name: 'Tỷ lệ đi làm và chấm công đúng giờ', target: '95.0%', actual: '97.2%', rate: 102.3, status: 'good' },
      { name: 'Tỷ lệ hoàn thành đào tạo nội bộ', target: '90.0%', actual: '95.0%', rate: 105.6, status: 'good' }
    ],
    hierarchyBreakdown: [
      {
        level: 'team_lead',
        levelName: 'Ban Nhân Sự',
        units: [
          { id: 'hr-rec', name: 'Tuyển Dụng & Đào Tạo', pic: 'Nguyễn Thị Phương Thảo', target: 100, actual: 98, rate: 98.0, status: 'good' }
        ]
      }
    ]
  },
  {
    id: 'bf-it',
    name: 'Công Nghệ Thông Tin',
    nameEn: 'Information Tech (IT)',
    category: 'it',
    headOfDepartment: 'Kỹ Sư Trần Tuấn Kiệt (CTO)',
    planValue: 99.9,
    actualValue: 99.98,
    unit: '%',
    achievementRate: 100.1,
    gapValue: 0.08,
    gapText: '+0.08%',
    trend: 'up',
    status: 'excellent',
    alertCount: 0,
    primaryKpiSummary: 'Uptime 99.98% | Sự cố 0 | Sao lưu 100% | Phản hồi < 5 phút | ✓ Tốt',
    keyIndicators: [
      { name: 'Thời gian sẵn sàng hệ thống (System Uptime)', target: '99.9%', actual: '99.98%', rate: 100.1, status: 'good' },
      { name: 'Số sự cố an ninh & mất dữ liệu', target: '0 Sự cố', actual: '0 Sự cố', rate: 100.0, status: 'good' },
      { name: 'Thời gian phản hồi ticket hỗ trợ IT', target: '< 15 phút', actual: '4.5 phút', rate: 150.0, status: 'good' }
    ],
    hierarchyBreakdown: [
      {
        level: 'team_lead',
        levelName: 'Đội Ngũ Kỹ Thuật',
        units: [
          { id: 'it-dev', name: 'Phòng Phát Triển BizOne ERP & Cloud Infrastructure', pic: 'Trần Tuấn Kiệt', target: 100, actual: 100, rate: 100.0, status: 'good' }
        ]
      }
    ]
  },
  {
    id: 'bf-operations',
    name: 'Vận Hành Chung',
    nameEn: 'General Operations',
    category: 'operations',
    headOfDepartment: 'Hoàng Văn Thắng (Chánh Văn Phòng)',
    planValue: 98,
    actualValue: 97.5,
    unit: '%',
    achievementRate: 99.5,
    gapValue: -0.5,
    gapText: '-0.5%',
    trend: 'flat',
    status: 'good',
    alertCount: 0,
    primaryKpiSummary: 'SLA nội bộ 99% | Hiệu suất tài sản 96% | Tiết kiệm điện 8% | ✓ Tốt',
    keyIndicators: [
      { name: 'Tuân thủ quy chế hành chính & an toàn', target: '100%', actual: '99.5%', rate: 99.5, status: 'good' },
      { name: 'Hiệu suất vận hành cơ sở vật chất', target: '95.0%', actual: '96.2%', rate: 101.3, status: 'good' },
      { name: 'Tiết kiệm chi phí năng lượng & văn phòng phẩm', target: '5.0%', actual: '8.2%', rate: 164.0, status: 'good' }
    ],
    hierarchyBreakdown: [
      {
        level: 'team_lead',
        levelName: 'Ban Hành Chính',
        units: [
          { id: 'adm-main', name: 'Ban Quản Trị Tài Sản & Dịch Vụ Nội Bộ', pic: 'Hoàng Văn Thắng', target: 100, actual: 98, rate: 98.0, status: 'good' }
        ]
      }
    ]
  }
];

export const INITIAL_ENTERPRISE_ALERTS: EnterpriseAlert[] = [
  {
    id: 'alt-kpi-1',
    type: 'critical_kpi',
    severity: 'critical',
    title: '5 Chỉ tiêu KPI đang dưới mục tiêu (At-Risk)',
    description: 'Doanh thu Chi nhánh Hà Nội (-16.5 Tỷ), Sản lượng Chuyền 2 (-10.8k Sp), Doanh số Showroom Cầu Giấy (-2.3 Tỷ), Lead B2B (-15%), Stockout SKU-004',
    impactValue: '-38.0 Tỷ Doanh thu',
    department: 'Khối Kinh Doanh, Sản Xuất & Bán Lẻ',
    pic: 'Lê Hoàng Nam, Đỗ Đức Thịnh, Đặng Quốc Bảo',
    status: 'open',
    linkedEntityType: 'kpi',
    rootCauseSnippet: 'Chậm trễ giao hàng nguyên liệu và mặt bằng showroom sửa chữa làm giảm sản lượng và doanh thu tại điểm'
  },
  {
    id: 'alt-task-1',
    type: 'overdue_task',
    severity: 'warning',
    title: '12 Tác vụ quá hạn xử lý cần đôn đốc ngay',
    description: 'Bao gồm 4 biên bản nghiệm thu giao hàng, 5 báo giá dự án B2B cần gửi lại, và 3 hồ sơ đối chiếu công nợ NCC',
    impactValue: '12 Tác vụ chậm trễ',
    department: 'Kinh Doanh B2B & Kế Toán',
    pic: 'Phạm Đức Anh, Lê Thị Thu Thủy',
    deadline: '2026-08-18',
    status: 'in_progress',
    linkedEntityType: 'task'
  },
  {
    id: 'alt-cust-1',
    type: 'customer_sla',
    severity: 'warning',
    title: '8 Khách hàng VIP quá hạn chăm sóc định kỳ',
    description: 'Công ty Cổ phần Xây dựng Hà Đô, Dược phẩm An Sinh, Tập đoàn Hoàng Mai chưa được Sales liên hệ trong 14 ngày qua',
    impactValue: '14.5 Tỷ Doanh số tiềm năng',
    department: 'Khối Kinh Doanh & CSKH',
    pic: 'Trần Văn Nam, Hoàng Kim Dung',
    deadline: '2026-08-19',
    status: 'open',
    linkedEntityType: 'customer'
  },
  {
    id: 'alt-contract-1',
    type: 'contract_risk',
    severity: 'critical',
    title: '3 Hợp đồng mua bán có nguy cơ chậm tiến độ ký kết',
    description: 'Hợp đồng Cung cấp thiết bị dự án Tân Bình (8.2 Tỷ), HĐ Đại lý Miền Trung (4.5 Tỷ), HĐ Xuất khẩu thử nghiệm (3.8 Tỷ)',
    impactValue: '16.5 Tỷ Giá trị hợp đồng',
    department: 'Phòng Pháp Chế & Kinh Doanh',
    pic: 'Lê Hoàng Nam, Vũ Thị Loan',
    deadline: '2026-08-25',
    status: 'in_progress',
    linkedEntityType: 'order'
  },
  {
    id: 'alt-inv-1',
    type: 'inventory_issue',
    severity: 'critical',
    title: '2 Lô hàng FIFO lưu kho > 90 ngày (Mega Hub Hà Nội)',
    description: 'Lot LOT-20260515-A1 (120 bao bột nguyên liệu) và LOT-20260520-B2 đang có nguy cơ cận hạn dùng trong 45 ngày tới',
    impactValue: '480,000,000 đ Giá trị hàng hóa',
    department: 'Kho Vận & Quản Lý FIFO',
    pic: 'Nguyễn Văn Toàn',
    status: 'open',
    linkedEntityType: 'lot',
    rootCauseSnippet: 'Quy trình xuất kho chưa kích hoạt tự động ưu tiên lô cũ nhất sang nhà máy chế biến'
  },
  {
    id: 'alt-debt-1',
    type: 'overdue_debt',
    severity: 'warning',
    title: '5 Khoản công nợ phải thu quá hạn > 30 ngày',
    description: 'Đại lý Minh Phát (185 Tr), Công ty Hòa Bình (220 Tr), Showroom Vĩnh Phúc (95 Tr) chậm thanh toán so với hợp đồng',
    impactValue: '685,000,000 đ Công nợ',
    department: 'Tài Chính - Kế Toán',
    pic: 'Lê Thị Thu Thủy',
    deadline: '2026-08-22',
    status: 'open',
    linkedEntityType: 'customer'
  },
  {
    id: 'alt-high-1',
    type: 'high_achiever',
    severity: 'success',
    title: '12 Chỉ số KPI vượt kế hoạch xuất sắc (> 105%)',
    description: 'Chi nhánh TP.HCM (+12%), Dòng tiền thanh khoản (+3.5 Tỷ), NPS Khách hàng (+78), Tỷ lệ lấp đầy Supply Chain (98.1%)',
    impactValue: '+18.5 Tỷ Vượt dự toán',
    department: 'Toàn Công Ty',
    pic: 'Ban Lãnh Đạo & Các Khối',
    status: 'resolved',
    linkedEntityType: 'kpi'
  }
];
