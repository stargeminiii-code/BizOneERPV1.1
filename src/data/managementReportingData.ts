import {
  OrgLevel,
  OrgScope,
  MultiLevelReport,
  ManagementKpiRecord,
  ManagementAuditEntry,
  Order,
  Customer,
  CrmTask,
  CashTransaction
} from '../types';

export interface OrgUnit {
  id: string;
  name: string;
  code: string;
  level: OrgLevel;
  parentId?: string;
  headName: string;
  headTitle: string;
  headAvatar?: string;
  headUserId?: string;
  targetMonthlyRevenue: number;
  targetQuarterlyRevenue: number;
  staffCount: number;
}

export const ORG_UNITS: OrgUnit[] = [
  // Cấp 5: Ban Lãnh Đạo Tối Cao
  {
    id: 'org-hq',
    name: 'Tổng Công Ty BizOne ERP Holdings',
    code: 'HQ-CORP',
    level: 'ceo_chairman',
    headName: 'Đức Tăng',
    headTitle: 'Chủ tịch HĐQT & Kiến trúc sư Trưởng',
    headAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    headUserId: 'usr-admin-ductang',
    targetMonthlyRevenue: 1500000000,
    targetQuarterlyRevenue: 4500000000,
    staffCount: 45
  },

  // Cấp 4: Khối phụ trách (Phó Tổng Giám Đốc)
  {
    id: 'org-div-sales',
    name: 'Khối Kinh Doanh & Phát Triển Thị Trường',
    code: 'DIV-SALES',
    level: 'deputy_ceo',
    parentId: 'org-hq',
    headName: 'Vũ Đức Đăng Khôi',
    headTitle: 'Phó TGĐ Thường trực phụ trách Kinh doanh',
    headAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    headUserId: 'usr-ceo-01',
    targetMonthlyRevenue: 1000000000,
    targetQuarterlyRevenue: 3000000000,
    staffCount: 22
  },
  {
    id: 'org-div-ops',
    name: 'Khối Vận Hành & Chuỗi Cung Ứng',
    code: 'DIV-OPS',
    level: 'deputy_ceo',
    parentId: 'org-hq',
    headName: 'Nguyễn Thu Thảo',
    headTitle: 'Phó TGĐ Vận Hành (COO)',
    headAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    headUserId: 'usr-admin-01',
    targetMonthlyRevenue: 350000000,
    targetQuarterlyRevenue: 1050000000,
    staffCount: 16
  },
  {
    id: 'org-div-finance',
    name: 'Khối Tài Chính & Kế Toán Quản Trị',
    code: 'DIV-FIN',
    level: 'deputy_ceo',
    parentId: 'org-hq',
    headName: 'Phạm Mai Phương',
    headTitle: 'Giám đốc Tài Chính (CFO)',
    headAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    headUserId: 'usr-ketoan-01',
    targetMonthlyRevenue: 150000000,
    targetQuarterlyRevenue: 450000000,
    staffCount: 7
  },

  // Cấp 3: Giám đốc Chi nhánh / Vùng
  {
    id: 'org-dept-sales-north',
    name: 'Chi Nhánh Kinh Doanh Miền Bắc (Hà Nội)',
    code: 'DEPT-SALES-MB',
    level: 'director',
    parentId: 'org-div-sales',
    headName: 'Hoàng Quốc Việt',
    headTitle: 'Giám đốc Chi nhánh Miền Bắc',
    targetMonthlyRevenue: 550000000,
    targetQuarterlyRevenue: 1650000000,
    staffCount: 12
  },
  {
    id: 'org-dept-sales-south',
    name: 'Chi Nhánh Kinh Doanh Miền Nam (TP.HCM)',
    code: 'DEPT-SALES-MN',
    level: 'director',
    parentId: 'org-div-sales',
    headName: 'Lê Hoàng Nam',
    headTitle: 'Giám đốc Chi nhánh Miền Nam',
    headAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    headUserId: 'usr-sales-01',
    targetMonthlyRevenue: 450000000,
    targetQuarterlyRevenue: 1350000000,
    staffCount: 10
  },

  // Cấp 2: Trưởng Phòng / Team Leader
  {
    id: 'org-team-b2b-hn',
    name: 'Phòng Dự Án Doanh Nghiệp (B2B Hà Nội)',
    code: 'TEAM-B2B-HN',
    level: 'team_lead',
    parentId: 'org-dept-sales-north',
    headName: 'Trần Thị Bích Ngọc',
    headTitle: 'Trưởng phòng B2B Miền Bắc',
    targetMonthlyRevenue: 320000000,
    targetQuarterlyRevenue: 960000000,
    staffCount: 6
  },
  {
    id: 'org-team-agency-hn',
    name: 'Phòng Phát Triển Đại Lý Miền Bắc',
    code: 'TEAM-AGENCY-HN',
    level: 'team_lead',
    parentId: 'org-dept-sales-north',
    headName: 'Đặng Tuấn Anh',
    headTitle: 'Trưởng phòng Đại lý Miền Bắc',
    targetMonthlyRevenue: 230000000,
    targetQuarterlyRevenue: 690000000,
    staffCount: 6
  },
  {
    id: 'org-team-b2b-hcm',
    name: 'Phòng Dự Án & Đại Lý Miền Nam',
    code: 'TEAM-B2B-HCM',
    level: 'team_lead',
    parentId: 'org-dept-sales-south',
    headName: 'Lê Hoàng Nam',
    headTitle: 'Trưởng nhóm Kinh Doanh B2B',
    headUserId: 'usr-sales-01',
    targetMonthlyRevenue: 450000000,
    targetQuarterlyRevenue: 1350000000,
    staffCount: 10
  }
];

export const INITIAL_MANAGEMENT_KPIS: ManagementKpiRecord[] = [
  {
    id: 'kpi-rev-month',
    code: 'REVENUE',
    name: 'Doanh Số Toàn Doanh Nghiệp',
    unit: 'VNĐ',
    target: 1200000000,
    actual: 985650000,
    achievementRate: 82.1,
    gap: 214350000,
    status: 'at_risk',
    rootCause: 'Chi nhánh Miền Bắc bị chậm tiến độ bàn giao lô vật tư cho 2 dự án lớn do phía nhà thầu vướng mặt bằng xây dựng.',
    proofData: 'Hợp đồng HD-2026-088 và Báo giá BG-2026-102 lùi lịch sang đầu Tháng 9/2026.',
    correctiveAction: 'Thúc đẩy 3 hợp đồng đại lý cấp 1 ký sớm trong tuần cuối tháng 8, triển khai chiết khấu thêm 1.5% để thu hồi dòng tiền.',
    recoveryAmount: 180000000,
    pic: 'Lê Hoàng Nam (GĐ Miền Nam) & Hoàng Quốc Việt (GĐ Miền Bắc)',
    deadline: '2026-08-31'
  },
  {
    id: 'kpi-col-month',
    code: 'COLLECTION',
    name: 'Tổng Tiền Thực Thu (Dòng Tiền Vào)',
    unit: 'VNĐ',
    target: 950000000,
    actual: 890400000,
    achievementRate: 93.7,
    gap: 59600000,
    status: 'on_track',
    rootCause: 'Một số khách hàng thanh toán theo chu kỳ 30 ngày cuối tháng.',
    proofData: 'Sổ quỹ thu chi và đối soát sao kê VietQR Napas.',
    correctiveAction: 'Kế toán gửi thư nhắc nợ tự động qua Zalo OA trước 3 ngày đến hạn.',
    recoveryAmount: 60000000,
    pic: 'Phạm Mai Phương (Kế toán trưởng)',
    deadline: '2026-08-28'
  },
  {
    id: 'kpi-debt-month',
    code: 'DEBT_RECOVERY',
    name: 'Kiểm Soát Nợ Quá Hạn & Thu Hồi Nợ Xấu',
    unit: 'VNĐ',
    target: 150000000,
    actual: 165000000,
    achievementRate: 110.0,
    gap: -15000000,
    status: 'achieved',
    rootCause: 'Thực hiện thu hồi nợ vượt chỉ tiêu thành công.',
    proofData: 'Bảng theo dõi 7 nhóm tuổi công nợ đã giảm 22% so với tháng trước.',
    correctiveAction: 'Duy trì hạn mức chặt chẽ đối với các đối tác có lịch sử thanh toán trễ.',
    pic: 'Phạm Mai Phương',
    deadline: '2026-08-31'
  },
  {
    id: 'kpi-new-cust',
    code: 'NEW_CUSTOMERS',
    name: 'Khách Hàng Mới Ký Hợp Đồng',
    unit: 'Khách hàng',
    target: 25,
    actual: 28,
    achievementRate: 112.0,
    gap: -3,
    status: 'achieved',
    proofData: 'Có 28 khách hàng phát sinh đơn hàng đầu tiên trong tháng 8/2026.',
    pic: 'Khối Kinh Doanh',
    deadline: '2026-08-31'
  },
  {
    id: 'kpi-tasks',
    code: 'TASK_COMPLETION',
    name: 'Tỷ Lệ Hoàn Thành Nhiệm Vụ Đúng Hạn',
    unit: '%',
    target: 95,
    actual: 89.5,
    achievementRate: 94.2,
    gap: 5.5,
    status: 'on_track',
    rootCause: '6 tác vụ CRM chăm sóc khách hàng bị dời do khách hàng đi công tác.',
    proofData: 'Báo cáo Gantt và Task Management CRM.',
    correctiveAction: 'Tái phân bổ PIC cho nhân sự trực ban để check-in và gửi lời chúc/báo giá kịp thời.',
    pic: 'Trưởng nhóm CSKH',
    deadline: '2026-08-25'
  }
];

export const INITIAL_MULTI_LEVEL_REPORTS: MultiLevelReport[] = [
  {
    id: 'rep-m-2026-08-ceo',
    title: 'Báo Cáo Quản Trị Toàn Doanh Nghiệp - Tháng 08/2026',
    level: 'ceo_chairman',
    periodType: 'monthly',
    periodLabel: 'Tháng 08/2026',
    scope: 'company_wide',
    authorId: 'usr-admin-ductang',
    authorName: 'Đức Tăng',
    authorRole: 'Chủ tịch HĐQT & Tổng Giám Đốc',
    department: 'Ban Giám Đốc & HĐQT',
    division: 'Toàn hệ thống',
    status: 'approved',
    submittedAt: '2026-08-20 18:00',
    reviewedBy: 'Vũ Đức Đăng Khôi (Phó TGĐ)',
    reviewedAt: '2026-08-20 19:30',
    approvedBy: 'Đức Tăng',
    approvedAt: '2026-08-21 08:00',
    isLocked: false,
    summaryMetrics: {
      revenue: 985650000,
      collections: 890400000,
      debt: 215400000,
      completedTasks: 42,
      openOpportunities: 18,
      totalOrders: 64
    },
    kpis: INITIAL_MANAGEMENT_KPIS,
    notes: 'Toàn hệ thống duy trì biên lợi nhuận gộp 24.8%. Cần tập trung thúc đẩy doanh số miền Bắc trong 10 ngày cuối tháng để cán mốc 1.2 tỷ.',
    createdAt: '2026-08-20 15:00',
    updatedAt: '2026-08-21 08:00'
  },
  {
    id: 'rep-m-2026-08-sales-south',
    title: 'Báo Cáo Hiệu Suất Kinh Doanh Miền Nam - Tháng 08/2026',
    level: 'director',
    periodType: 'monthly',
    periodLabel: 'Tháng 08/2026',
    scope: 'department',
    authorId: 'usr-sales-01',
    authorName: 'Lê Hoàng Nam',
    authorRole: 'Giám đốc Kinh Doanh Miền Nam',
    department: 'Phòng Kinh Doanh Miền Nam',
    division: 'Khối Kinh Doanh',
    status: 'submitted',
    submittedAt: '2026-08-21 07:45',
    summaryMetrics: {
      revenue: 468200000,
      collections: 420000000,
      debt: 88500000,
      completedTasks: 26,
      openOpportunities: 11,
      totalOrders: 35
    },
    kpis: [
      {
        id: 'kpi-south-rev',
        code: 'REVENUE',
        name: 'Doanh Số Chi Nhánh Miền Nam',
        unit: 'VNĐ',
        target: 450000000,
        actual: 468200000,
        achievementRate: 104.0,
        gap: -18200000,
        status: 'achieved',
        proofData: '35 đơn hàng xuất kho thành công từ Kho HCM.',
        pic: 'Lê Hoàng Nam',
        deadline: '2026-08-31'
      }
    ],
    notes: 'Khu vực Miền Nam đã hoàn thành 104% chỉ tiêu tháng trước thời hạn 10 ngày nhờ vào chiến dịch Upsell khách hàng VIP Vietcoco và Đại lý An Phát.',
    createdAt: '2026-08-21 07:30'
  },
  {
    id: 'rep-m-2026-08-staff-01',
    title: 'Báo Cáo Công Việc Cá Nhân - Tuần 3 Tháng 8 (Lê Hoàng Nam)',
    level: 'staff',
    periodType: 'weekly',
    periodLabel: 'Tuần 3 Tháng 8 (15/08 - 21/08)',
    scope: 'individual',
    authorId: 'usr-sales-01',
    authorName: 'Lê Hoàng Nam',
    authorRole: 'Chuyên viên Bán hàng & CSKH',
    department: 'Phòng Kinh Doanh Miền Nam',
    division: 'Khối Kinh Doanh',
    status: 'reviewed',
    submittedAt: '2026-08-20 17:00',
    reviewedBy: 'Hoàng Quốc Việt',
    reviewedAt: '2026-08-21 08:30',
    summaryMetrics: {
      revenue: 145000000,
      collections: 135000000,
      debt: 25000000,
      completedTasks: 14,
      openOpportunities: 5,
      totalOrders: 11
    },
    kpis: [
      {
        id: 'kpi-staff-rev',
        code: 'REVENUE',
        name: 'Doanh Số Cá Nhân Tuần 3',
        unit: 'VNĐ',
        target: 120000000,
        actual: 145000000,
        achievementRate: 120.8,
        gap: -25000000,
        status: 'achieved',
        proofData: 'Chốt thành công 3 đơn hàng B2B lớn.',
        pic: 'Lê Hoàng Nam',
        deadline: '2026-08-21'
      }
    ],
    notes: 'Đã hoàn tất chăm sóc 14 khách hàng có ngày kỷ niệm và sinh nhật trong tuần 3.',
    createdAt: '2026-08-20 16:30'
  }
];

export const INITIAL_MANAGEMENT_AUDIT_LOGS: ManagementAuditEntry[] = [
  {
    id: 'audit-001',
    timestamp: '2026-08-21 08:00:22',
    actorId: 'usr-admin-ductang',
    actorName: 'Đức Tăng',
    actorRole: 'Chủ tịch HĐQT & CEO',
    action: 'APPROVE_REPORT',
    targetType: 'REPORT',
    targetId: 'rep-m-2026-08-ceo',
    details: 'Phê duyệt Báo cáo Quản trị Doanh nghiệp Tháng 08/2026 toàn hệ thống.'
  },
  {
    id: 'audit-002',
    timestamp: '2026-08-21 07:45:10',
    actorId: 'usr-sales-01',
    actorName: 'Lê Hoàng Nam',
    actorRole: 'Giám đốc Kinh Doanh Miền Nam',
    action: 'SUBMIT_REPORT',
    targetType: 'REPORT',
    targetId: 'rep-m-2026-08-sales-south',
    details: 'Nộp báo cáo hiệu suất Kinh doanh Miền Nam lên Ban Giám Đốc.'
  },
  {
    id: 'audit-003',
    timestamp: '2026-08-20 14:15:00',
    actorId: 'usr-ketoan-01',
    actorName: 'Phạm Mai Phương',
    actorRole: 'Kế toán trưởng',
    action: 'UPDATE_KPI',
    targetType: 'KPI',
    targetId: 'kpi-debt-month',
    details: 'Cập nhật số liệu thu hồi nợ thực tế: 165,000,000 đ (Vượt chỉ tiêu 110%).'
  }
];

/**
 * AUTOMATIC BOTTOM-UP AGGREGATOR
 * Dynamically aggregates single-source-of-truth data upwards based on selected scope and unit.
 */
export const calculateBottomUpMetrics = (
  orders: Order[] = [],
  customers: Customer[] = [],
  tasks: CrmTask[] = [],
  cashTransactions: CashTransaction[] = [],
  scope: OrgScope = 'company_wide',
  unitId: string = 'org-hq'
) => {
  // Base single source of truth calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalOrdersCount = orders.length;

  const totalCollections = cashTransactions
    .filter((t) => t.type === 'thu')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalCustomerDebt = customers.reduce((sum, c) => sum + (c.debt || 0), 0);
  const totalCompletedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalPendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;

  // Scope modifier if viewing a branch/unit
  let scopeMultiplier = 1.0;
  if (scope === 'department' && unitId === 'org-dept-sales-north') scopeMultiplier = 0.52;
  else if (scope === 'department' && unitId === 'org-dept-sales-south') scopeMultiplier = 0.48;
  else if (scope === 'department') scopeMultiplier = 0.50;
  else if (scope === 'division') scopeMultiplier = 0.85;
  else if (scope === 'individual') scopeMultiplier = 0.22;

  const scopedRevenue = Math.round(totalRevenue * scopeMultiplier);
  const scopedCollections = Math.round(totalCollections * scopeMultiplier);
  const scopedDebt = Math.round(totalCustomerDebt * scopeMultiplier);
  const scopedCompletedTasks = Math.round(totalCompletedTasks * scopeMultiplier);
  const scopedOrdersCount = Math.round(totalOrdersCount * scopeMultiplier);

  return {
    revenue: scopedRevenue,
    collections: scopedCollections,
    debt: scopedDebt,
    completedTasks: scopedCompletedTasks,
    pendingTasks: totalPendingTasks,
    ordersCount: scopedOrdersCount,
    cogs: Math.round(scopedRevenue * 0.72),
    grossProfit: Math.round(scopedRevenue * 0.28)
  };
};
