import {
  EnterprisePlan,
  KpiDefinition,
  WorkCategoryHierarchy,
  KpiActionPlan,
  StageTaskAutomationConfig,
  PerformanceScorecard,
  EnterpriseForecastItem,
  EnterpriseSystemAlert
} from '../types';

// =========================================================================
// 1. WORK CATEGORY HIERARCHY (Hạng mục -> Nhóm -> Công việc -> Task -> Subtask)
// =========================================================================

export const INITIAL_WORK_CATEGORIES: WorkCategoryHierarchy[] = [
  {
    id: 'cat-sales-prospect',
    code: 'CAT_SALES_PROSPECT',
    name: 'TÌM KIẾM & PHÁT TRIỂN KHÁCH HÀNG',
    division: 'sales',
    description: 'Quy trình thu thập, tiếp cận và lọc danh sách khách hàng tiềm năng mới',
    groups: [
      {
        id: 'grp-telesales',
        code: 'GRP_TELESALES',
        name: 'Telesales & Gọi điện',
        description: 'Tương tác qua kênh điện thoại / thoại thoại IP',
        taskTemplates: [
          {
            id: 'tpl-ts-1',
            title: 'Gọi khách hàng mới theo data chiến dịch',
            defaultType: 'call_upsell',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_NEW_CUSTOMERS',
            defaultDurationHours: 4,
            standardSubtasks: ['Chuẩn bị kịch bản', 'Thực hiện cuộc gọi', 'Ghi chú nhu cầu', 'Lên lịch follow-up']
          },
          {
            id: 'tpl-ts-2',
            title: 'Gọi khách hàng cũ tái kích hoạt',
            defaultType: 'call_upsell',
            defaultPriority: 'normal',
            suggestedKpiCode: 'KPI_REPEAT_SALES',
            defaultDurationHours: 2,
            standardSubtasks: ['Xem lịch sử đơn cũ', 'Giới thiệu chính sách mới', 'Gửi báo giá cập nhật']
          },
          {
            id: 'tpl-ts-3',
            title: 'Follow-up khách hàng chưa chốt đơn',
            defaultType: 'call_upsell',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_PIPELINE_CONVERSION',
            defaultDurationHours: 2,
            standardSubtasks: ['Làm rõ khúc mắc giá/giao hàng', 'Đề xuất giải pháp thay thế']
          },
          {
            id: 'tpl-ts-4',
            title: 'Gọi lại khách chưa nghe máy / hẹn gọi lại',
            defaultType: 'call_upsell',
            defaultPriority: 'normal',
            suggestedKpiCode: 'KPI_CALL_CONNECT_RATE',
            defaultDurationHours: 1
          }
        ]
      },
      {
        id: 'grp-field-visit',
        code: 'GRP_FIELD_VISIT',
        name: 'Đi thị trường & Điểm bán',
        description: 'Khảo sát thực địa, gặp gỡ đại lý và công trình',
        taskTemplates: [
          {
            id: 'tpl-fv-1',
            title: 'Đi thị trường tuyến đại lý / cửa hàng VLXD',
            defaultType: 'visit',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_OUTLET_COVERAGE',
            defaultDurationHours: 6,
            standardSubtasks: ['Kiểm tra trưng bày', 'Khảo sát lượng tồn đại lý', 'Ghi đơn hàng trực tiếp']
          },
          {
            id: 'tpl-fv-2',
            title: 'Khảo sát công trình xây dựng / dự án mới',
            defaultType: 'visit',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_PIPELINE_VALUE',
            defaultDurationHours: 4,
            standardSubtasks: ['Gặp chỉ huy trưởng/thu mua', 'Đo đạc nhu cầu thép/tôn/vật tư', 'Lấy thông tin tiến độ']
          },
          {
            id: 'tpl-fv-3',
            title: 'Khảo sát đối thủ cạnh tranh theo khu vực',
            defaultType: 'visit',
            defaultPriority: 'normal',
            suggestedKpiCode: 'KPI_MARKET_INTELLIGENCE',
            defaultDurationHours: 3
          }
        ]
      },
      {
        id: 'grp-expo',
        code: 'GRP_EXPO',
        name: 'Hội chợ & Sự kiện ngành',
        description: 'Thu thập lead qua hội thảo, triển lãm Vietbuild, OCOP',
        taskTemplates: [
          {
            id: 'tpl-ex-1',
            title: 'Trực gian hàng hội chợ / triển lãm Vietbuild',
            defaultType: 'visit',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_EVENT_LEADS',
            defaultDurationHours: 8,
            standardSubtasks: ['Phát catalogue & mẫu hàng', 'Scan danh thiếp đối tác', 'Nhập CRM trong 24h']
          },
          {
            id: 'tpl-ex-2',
            title: 'Follow-up lead thu thập sau sự kiện',
            defaultType: 'zalo_quote',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_PIPELINE_VALUE',
            defaultDurationHours: 4
          }
        ]
      },
      {
        id: 'grp-referral',
        code: 'GRP_REFERRAL',
        name: 'Referral & Giới thiệu',
        description: 'Mạng lưới giới thiệu từ khách hàng cũ, đối tác liên minh',
        taskTemplates: [
          {
            id: 'tpl-rf-1',
            title: 'Chăm sóc và xin lời giới thiệu từ khách hàng VIP',
            defaultType: 'after_sales',
            defaultPriority: 'normal',
            suggestedKpiCode: 'KPI_REFERRAL_CUSTOMERS',
            defaultDurationHours: 2
          },
          {
            id: 'tpl-rf-2',
            title: 'Kết nối mạng lưới thầu phụ và kiến trúc sư',
            defaultType: 'contract_negotiation',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_NEW_CUSTOMERS',
            defaultDurationHours: 3
          }
        ]
      },
      {
        id: 'grp-digital',
        code: 'GRP_DIGITAL',
        name: 'Digital & Kênh trực tuyến',
        description: 'Xử lý lead từ Website, Zalo OA, Fanpage, TikTok Shop',
        taskTemplates: [
          {
            id: 'tpl-dg-1',
            title: 'Tiếp nhận và phản hồi lead Website trong 15 phút',
            defaultType: 'zalo_quote',
            defaultPriority: 'urgent',
            suggestedKpiCode: 'KPI_LEAD_RESPONSE_TIME',
            defaultDurationHours: 1,
            standardSubtasks: ['Xác nhận yêu cầu SKU/khối lượng', 'Gửi báo giá nhanh', 'Lên lịch gọi tư vấn']
          },
          {
            id: 'tpl-dg-2',
            title: 'Tư vấn khách hàng qua Zalo OA & Fanpage',
            defaultType: 'zalo_quote',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_LEAD_CONVERSION',
            defaultDurationHours: 2
          }
        ]
      }
    ]
  },
  {
    id: 'cat-sales-deal',
    code: 'CAT_SALES_DEAL',
    name: 'TƯ VẤN, BÁO GIÁ & ĐÀM PHÁN HỢP ĐỒNG',
    division: 'sales',
    description: 'Quy trình chuyển đổi cơ hội thành đơn hàng và hợp đồng kinh tế',
    groups: [
      {
        id: 'grp-quote-proposal',
        code: 'GRP_QUOTE_PROPOSAL',
        name: 'Lập báo giá & Phương án kỹ thuật',
        taskTemplates: [
          {
            id: 'tpl-qp-1',
            title: 'Lập bảng báo giá chi tiết theo quy cách & lô FIFO',
            defaultType: 'zalo_quote',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_QUOTE_COUNT',
            defaultDurationHours: 2
          },
          {
            id: 'tpl-qp-2',
            title: 'Gửi mẫu sản phẩm & chứng chỉ CO/CQ cho khách',
            defaultType: 'other',
            defaultPriority: 'normal',
            suggestedKpiCode: 'KPI_DEMO_COMPLETION',
            defaultDurationHours: 3
          }
        ]
      },
      {
        id: 'grp-negotiation-contract',
        code: 'GRP_NEGOTIATION_CONTRACT',
        name: 'Đàm phán & Ký kết hợp đồng',
        taskTemplates: [
          {
            id: 'tpl-nc-1',
            title: 'Đàm phán điều khoản thanh toán & hạn mức nợ',
            defaultType: 'contract_negotiation',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_CONTRACT_VALUE',
            defaultDurationHours: 3
          },
          {
            id: 'tpl-nc-2',
            title: 'Hoàn thiện hồ sơ hợp đồng và trình ký Ban Giám Đốc',
            defaultType: 'contract_negotiation',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_CONTRACT_SIGNED',
            defaultDurationHours: 2
          }
        ]
      }
    ]
  },
  {
    id: 'cat-procurement-supply',
    code: 'CAT_PROCUREMENT_SUPPLY',
    name: 'THU MUA & QUẢN TRỊ CHUỖI CUNG ỨNG',
    division: 'procurement',
    description: 'Tìm kiếm nguồn cung, đàm phán giá vốn và kiểm soát tiến độ nhập hàng',
    groups: [
      {
        id: 'grp-supplier-mgmt',
        code: 'GRP_SUPPLIER_MGMT',
        name: 'Quản lý Nhà cung cấp & Đàm phán giá',
        taskTemplates: [
          {
            id: 'tpl-sm-1',
            title: 'Đàm phán chiết khấu quý với nhà máy Hòa Phát / Hoa Sen',
            defaultType: 'other',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_PURCHASE_SAVINGS',
            defaultDurationHours: 4
          },
          {
            id: 'tpl-sm-2',
            title: 'Khảo sát và đánh giá nhà cung cấp phụ trợ mới',
            defaultType: 'other',
            defaultPriority: 'normal',
            suggestedKpiCode: 'KPI_SUPPLIER_DIVERSIFICATION',
            defaultDurationHours: 5
          }
        ]
      },
      {
        id: 'grp-po-restock',
        code: 'GRP_PO_RESTOCK',
        name: 'Lập PO & Điều phối nhập kho',
        taskTemplates: [
          {
            id: 'tpl-pr-1',
            title: 'Tạo PO bổ sung các SKU chạm mức tồn tối thiểu',
            defaultType: 'other',
            defaultPriority: 'urgent',
            suggestedKpiCode: 'KPI_STOCKOUT_RATE',
            defaultDurationHours: 2
          },
          {
            id: 'tpl-pr-2',
            title: 'Theo dõi tiến độ giao hàng & chứng chỉ hóa đơn điện tử',
            defaultType: 'other',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_ON_TIME_DELIVERY_SUPPLIER',
            defaultDurationHours: 2
          }
        ]
      }
    ]
  },
  {
    id: 'cat-warehouse-logistics',
    code: 'CAT_WAREHOUSE_LOGISTICS',
    name: 'KHO VẬN & QUẢN LÝ LÔ HÀNG FIFO',
    division: 'warehouse',
    description: 'Nhập xuất kho, bố trí ô kệ, kiểm kê định kỳ và kiểm soát hạn sử dụng',
    groups: [
      {
        id: 'grp-fifo-inout',
        code: 'GRP_FIFO_INOUT',
        name: 'Nhập xuất & Phân bổ lô FIFO',
        taskTemplates: [
          {
            id: 'tpl-fi-1',
            title: 'Kiểm định chất lượng & nhập kho theo lô HĐĐT',
            defaultType: 'other',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_FIFO_ACCURACY',
            defaultDurationHours: 3
          },
          {
            id: 'tpl-fi-2',
            title: 'Soát hạn sử dụng & luân chuyển hàng tồn trên 90 ngày',
            defaultType: 'other',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_INVENTORY_AGING_REDUCTION',
            defaultDurationHours: 4
          }
        ]
      }
    ]
  },
  {
    id: 'cat-accounting-finance',
    code: 'CAT_ACCOUNTING_FINANCE',
    name: 'TÀI CHÍNH, DÒNG TIỀN & THU HỒI CÔNG NỢ',
    division: 'finance',
    description: 'Kiểm soát dòng tiền thực thu, đối chiếu VietQR và thu nợ đúng hạn',
    groups: [
      {
        id: 'grp-debt-recovery',
        code: 'GRP_DEBT_RECOVERY',
        name: 'Đôn đốc & Thu hồi công nợ',
        taskTemplates: [
          {
            id: 'tpl-dr-1',
            title: 'Gửi thông báo đối chiếu & nhắc nợ trước hạn 3 ngày',
            defaultType: 'debt_reminder',
            defaultPriority: 'high',
            suggestedKpiCode: 'KPI_DSO_DAYS',
            defaultDurationHours: 2
          },
          {
            id: 'tpl-dr-2',
            title: 'Xử lý công nợ quá hạn trên 30 ngày',
            defaultType: 'debt_reminder',
            defaultPriority: 'urgent',
            suggestedKpiCode: 'KPI_OVERDUE_DEBT_RECOVERY',
            defaultDurationHours: 3
          }
        ]
      }
    ]
  }
];

// =========================================================================
// 2. INITIAL KPI DEFINITIONS (18 KHỐI DOANH NGHIỆP TOÀN DIỆN)
// =========================================================================

export const INITIAL_KPI_DEFINITIONS: KpiDefinition[] = [
  // --- KINH DOANH & BÁN HÀNG ---
  {
    id: 'kpi-rev',
    kpiCode: 'KPI_REVENUE',
    kpiName: 'Doanh Số Bán Hàng Thuần',
    description: 'Tổng giá trị các đơn hàng hợp lệ đã hoàn thành và giao thành công',
    category: 'sales',
    categoryLabel: 'Khối Kinh Doanh',
    dataSource: 'sales_orders',
    formula: 'SUM(orders.where(status == "completed").totalAmount)',
    unit: 'VNĐ',
    weight: 30,
    frequency: 'monthly',
    direction: 'higher_is_better',
    defaultTarget: 150000000,
    warningThreshold: 85,
    criticalThreshold: 70,
    quantityCriteria: 'Đạt từ 150 triệu VNĐ/tháng',
    achievementCriteria: '% thực tế / kế hoạch phân bổ',
    qualityCriteria: 'Tỷ lệ đơn hàng không bị đổi trả > 98%',
    efficiencyCriteria: 'Biên lợi nhuận gộp đạt tối thiểu 30%',
    timelinessCriteria: 'Giao hàng đúng hẹn > 95%',
    costCriteria: 'Chi phí bán hàng < 8% doanh thu',
    outcomeCriteria: 'Đóng góp lợi nhuận gộp ròng',
    ownerRole: 'Giám Đốc Kinh Doanh / Trưởng Nhóm KD',
    isSystem: true,
    status: 'active'
  },
  {
    id: 'kpi-new-cust',
    kpiCode: 'KPI_NEW_CUSTOMERS',
    kpiName: 'Phát Triển Khách Hàng Mới (MSKH)',
    description: 'Số lượng tài khoản khách hàng mới phát sinh đơn hàng đầu tiên',
    category: 'sales',
    categoryLabel: 'Khối Kinh Doanh',
    dataSource: 'crm_customers',
    formula: 'COUNT(customers.where(createdAt >= periodStart && totalSpent > 0))',
    unit: 'Khách hàng',
    weight: 20,
    frequency: 'monthly',
    direction: 'higher_is_better',
    defaultTarget: 20,
    warningThreshold: 80,
    criticalThreshold: 60,
    quantityCriteria: 'Tối thiểu 20 khách mới/tháng',
    achievementCriteria: 'Tỷ lệ đạt kế hoạch phân bổ cho từng Sale',
    qualityCriteria: 'Khách hàng có quy mô mua hàng lặp lại > 40%',
    efficiencyCriteria: 'Chi phí tiếp cận khách hàng (CAC) < 500.000 đ/khách',
    ownerRole: 'Trưởng Nhóm Kinh Doanh',
    isSystem: true,
    status: 'active'
  },
  {
    id: 'kpi-pipe-val',
    kpiCode: 'KPI_PIPELINE_VALUE',
    kpiName: 'Tổng Giá Trị Phễu Cơ Hội (Pipeline)',
    description: 'Tổng giá trị các cơ hội đang đàm phán trong các giai đoạn phễu bán hàng',
    category: 'crm',
    categoryLabel: 'CRM & Quản Lý Cơ Hội',
    dataSource: 'crm_pipeline',
    formula: 'SUM(crmTasks.where(status != "completed").estimatedRevenue)',
    unit: 'VNĐ',
    weight: 15,
    frequency: 'weekly',
    direction: 'higher_is_better',
    defaultTarget: 200000000,
    warningThreshold: 75,
    criticalThreshold: 50,
    quantityCriteria: 'Phễu luôn duy trì gấp 2.5 lần mục tiêu doanh thu',
    achievementCriteria: 'Tỷ lệ cơ hội chuyển đổi thành đơn hàng (Win Rate) > 25%',
    qualityCriteria: 'Thông tin khảo sát và nhu cầu đạt chuẩn 100%',
    efficiencyCriteria: 'Thời gian chu kỳ bán hàng (Sales Cycle) < 14 ngày',
    ownerRole: 'Sales Executive / CRM Lead',
    isSystem: true,
    status: 'active'
  },

  // --- TÀI CHÍNH & CÔNG NỢ ---
  {
    id: 'kpi-cash-coll',
    kpiCode: 'KPI_COLLECTIONS',
    kpiName: 'Dòng Tiền Thực Thu (Cash Inflow)',
    description: 'Tổng tiền mặt và chuyển khoản VietQR thực tế đã vào tài khoản',
    category: 'finance',
    categoryLabel: 'Tài Chính & Kế Toán',
    dataSource: 'cash_transactions',
    formula: 'SUM(cashTransactions.where(type == "thu").amount)',
    unit: 'VNĐ',
    weight: 20,
    frequency: 'monthly',
    direction: 'higher_is_better',
    defaultTarget: 140000000,
    warningThreshold: 85,
    criticalThreshold: 70,
    quantityCriteria: 'Thực thu đạt tối thiểu 90% doanh số bán hàng',
    achievementCriteria: 'So khớp chuẩn 100% với biến động số dư VietQR/Napas',
    qualityCriteria: 'Không phát sinh sai lệch sổ quỹ kế toán',
    efficiencyCriteria: 'Tỷ lệ thanh toán tự động qua VietQR > 70%',
    ownerRole: 'Kế Toán Trưởng / Giám Đốc Tài Chính',
    isSystem: true,
    status: 'active'
  },
  {
    id: 'kpi-overdue-debt',
    kpiCode: 'KPI_OVERDUE_DEBT',
    kpiName: 'Kiểm Soát Nợ Quá Hạn Phải Thu',
    description: 'Tỷ lệ công nợ vượt quá hạn thanh toán cam kết',
    category: 'accounting',
    categoryLabel: 'Tài Chính & Kế Toán',
    dataSource: 'crm_customers',
    formula: 'SUM(customers.where(debt > 0 && daysOverdue > 0).debt)',
    unit: 'VNĐ',
    weight: 15,
    frequency: 'monthly',
    direction: 'lower_is_better',
    defaultTarget: 5000000, // Tối đa 5 triệu nợ quá hạn
    warningThreshold: 120,
    criticalThreshold: 150,
    quantityCriteria: 'Nợ quá hạn < 5% tổng công nợ',
    achievementCriteria: 'Thu hồi 100% nợ quá hạn trong 15 ngày',
    qualityCriteria: 'Biên bản đối chiếu công nợ đầy đủ chữ ký 2 bên',
    efficiencyCriteria: 'Số ngày thu tiền bình quân (DSO) < 25 ngày',
    ownerRole: 'Kế Toán Công Nợ / Sales Phụ Trách',
    isSystem: true,
    status: 'active'
  },

  // --- KHO BÃI & CHUỖI CUNG ỨNG ---
  {
    id: 'kpi-inv-turnover',
    kpiCode: 'KPI_INVENTORY_TURNOVER',
    kpiName: 'Vòng Quay Tồn Kho & Quản Trị FIFO',
    description: 'Số vòng quay hàng tồn kho và mức độ tuân thủ xuất hàng theo lô nhập trước',
    category: 'warehouse',
    categoryLabel: 'Kho Vận & Logistics',
    dataSource: 'inventory_layers',
    formula: 'SUM(orderFifoDeductions.costAmount) / AVERAGE(inventoryValue)',
    unit: 'Vòng/Năm',
    weight: 15,
    frequency: 'monthly',
    direction: 'higher_is_better',
    defaultTarget: 8,
    warningThreshold: 80,
    criticalThreshold: 60,
    quantityCriteria: 'Vòng quay đạt từ 8 đến 12 vòng/năm',
    achievementCriteria: 'Xuất kho tuân thủ 100% quy tắc FIFO',
    qualityCriteria: 'Tỷ lệ hàng hư hỏng/quá hạn < 0.1%',
    efficiencyCriteria: 'Tối ưu diện tích ô kệ kho đạt > 85%',
    ownerRole: 'Trưởng Kho Tổng / Quản Lý Logistics',
    isSystem: true,
    status: 'active'
  },
  {
    id: 'kpi-task-comp',
    kpiCode: 'KPI_TASK_COMPLETION',
    kpiName: 'Tỷ Lệ Hoàn Thành Tác Vụ Đúng Hạn',
    description: 'Mức độ hoàn thành các công việc được giao đúng deadline cam kết',
    category: 'support',
    categoryLabel: 'Vận Hành & Hiệu Suất',
    dataSource: 'tasks',
    formula: '(COUNT(crmTasks.where(status == "completed" && completedAt <= dueDate)) / COUNT(crmTasks)) * 100',
    unit: '%',
    weight: 15,
    frequency: 'weekly',
    direction: 'higher_is_better',
    defaultTarget: 95,
    warningThreshold: 85,
    criticalThreshold: 75,
    quantityCriteria: 'Tỷ lệ hoàn thành đạt > 95%',
    achievementCriteria: 'Điểm đánh giá chất lượng task bình quân > 85/100',
    qualityCriteria: 'Có đầy đủ bằng chứng nghiệm thu/kết quả thực tế',
    efficiencyCriteria: 'Thời gian xử lý bình quân không vượt quá định mức',
    ownerRole: 'Toàn bộ nhân sự & Trưởng nhóm',
    isSystem: true,
    status: 'active'
  }
];

// =========================================================================
// 3. INITIAL ENTERPRISE PLANS (MẪU KẾ HOẠCH DOANH NGHIỆP BM01.QC11-EWH)
// =========================================================================

export const INITIAL_ENTERPRISE_PLANS: EnterprisePlan[] = [
  // 1. Kế hoạch chiến lược toàn công ty
  {
    id: 'pln-corp-2026-q3',
    planCode: 'PLN-2026-CORP-Q3',
    planName: 'Kế hoạch Doanh Thu & Phát Triển Thị Trường Toàn Công Ty - Q3/2026',
    planType: 'strategic',
    granularity: 'quarter',
    periodYear: 2026,
    periodQuarter: 3,
    periodLabel: 'Quý 3/2026 (01/07 - 30/09/2026)',
    division: 'Ban Điều Hành',
    unitName: 'Toàn Doanh Nghiệp BizOne',
    department: 'Ban Giám Đốc',
    ownerName: 'Võ Minh Đăng (CEO / Chủ tịch)',
    ownerRole: 'CEO / Chairman',
    picName: 'Nguyễn Văn An (PTGĐ Kinh Doanh)',
    objective: 'Đạt doanh số 450 triệu VNĐ, mở rộng 60 khách hàng đại lý và tối ưu vòng quay tồn kho FIFO đạt 9 vòng',
    workCategoryName: 'PHÁT TRIỂN DOANH NGHIỆP TOÀN DIỆN',
    kpiCode: 'KPI_REVENUE',
    kpiName: 'Doanh Số Bán Hàng Thuần Toàn Công Ty',
    target: 450000000,
    unit: 'VNĐ',
    weight: 40,
    budget: 35000000,
    actualCost: 28400000,
    expectedResult: 'Doanh thu thuần 450 triệu, lợi nhuận gộp 140 triệu, nợ quá hạn < 2%',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    actual: 382400000,
    achievementRate: 85.0,
    qualityScore: 92,
    efficiencyRate: 88,
    timelinessRate: 90,
    gap: 67600000,
    forecast: 442000000,
    forecastStatus: 'on_track',
    status: 'in_execution',
    approvedBy: 'Võ Minh Đăng (CEO)',
    approvedAt: '2026-06-28 14:00',
    createdAt: '2026-06-25 09:00'
  },

  // 2. Kế hoạch Khối Kinh Doanh Tháng 8/2026 (BM01.QC11-EWH Phân rã)
  {
    id: 'pln-sales-2026-08',
    planCode: 'PLN-2026-KD-08',
    planName: 'Kế hoạch Bán Hàng & Mở Rộng Điểm Bán Tháng 08/2026 - Khối Kinh Doanh',
    planType: 'sales',
    granularity: 'month',
    periodYear: 2026,
    periodMonth: 8,
    periodLabel: 'Tháng 08/2026 (01/08 - 31/08/2026)',
    division: 'Khối Kinh Doanh',
    unitName: 'Chi nhánh Chính - Hà Nội & Miền Bắc',
    department: 'Phòng Bán Hàng & Dự Án',
    teamName: 'Team Kinh Doanh KV1',
    ownerName: 'Nguyễn Văn An',
    ownerRole: 'Trưởng nhóm KD',
    picName: 'Lê Hoàng Nam (Sale Phụ Trách)',
    picEmail: 'nam.le@bizone.vn',
    parentPlanId: 'pln-corp-2026-q3',
    objective: 'Chinh phục 150 triệu doanh số tháng 8, phát triển 20 khách hàng mới qua kênh Telesales và Đi thị trường',
    workCategoryId: 'cat-sales-prospect',
    workCategoryName: 'TÌM KIẾM & PHÁT TRIỂN KHÁCH HÀNG',
    workGroup: 'Telesales & Đi thị trường',
    kpiCode: 'KPI_REVENUE',
    kpiName: 'Doanh Số Bán Hàng Tháng 8',
    target: 150000000,
    unit: 'VNĐ',
    weight: 35,
    budget: 12000000,
    actualCost: 9800000,
    expectedResult: '150 triệu doanh thu, 20 khách mới, 50 hợp đồng cung ứng thép & tôn',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    actual: 124500000,
    achievementRate: 83.0,
    qualityScore: 88,
    efficiencyRate: 84,
    timelinessRate: 82,
    gap: 25500000,
    forecast: 146000000,
    forecastStatus: 'warning',
    rootCauseCategory: 'market',
    rootCause: 'Giá thép cuộn thị trường biến động tuần đầu tháng 8 khiến một số đại lý trì hoãn chốt đơn',
    evidence: 'Biên bản làm việc với 3 đại lý VLXD Phúc Thịnh, Vinaconex và Vạn Phát',
    correctiveAction: 'Tăng cường gọi 100 khách hàng tiềm năng qua phễu Telesales và áp dụng chính sách chiết khấu 1.5% cho đơn thanh toán VietQR ngay',
    actionPic: 'Lê Hoàng Nam',
    actionDeadline: '2026-08-25',
    status: 'in_execution',
    approvedBy: 'Võ Minh Đăng (CEO)',
    approvedAt: '2026-07-31 16:30',
    createdAt: '2026-07-28 10:00'
  },

  // 3. Kế hoạch Telesales & Tìm khách mới cá nhân (Nhân sự Lê Hoàng Nam)
  {
    id: 'pln-staff-nam-08',
    planCode: 'PLN-2026-NAM-TS-08',
    planName: 'Kế hoạch Telesales & Phát Triển 15 Khách Mới - Lê Hoàng Nam',
    planType: 'employee_work',
    granularity: 'month',
    periodYear: 2026,
    periodMonth: 8,
    periodLabel: 'Tháng 08/2026',
    division: 'Khối Kinh Doanh',
    unitName: 'Chi nhánh Chính - Hà Nội',
    department: 'Phòng Bán Hàng',
    teamName: 'Team Telesales',
    ownerName: 'Lê Hoàng Nam',
    ownerRole: 'Sales Executive',
    picName: 'Lê Hoàng Nam',
    parentPlanId: 'pln-sales-2026-08',
    objective: 'Thực hiện 1.000 cuộc gọi, kết nối 600 khách, chốt 15 đơn hàng mới đạt 80 triệu doanh thu cá nhân',
    workCategoryId: 'cat-sales-prospect',
    workCategoryName: 'TÌM KIẾM & PHÁT TRIỂN KHÁCH HÀNG',
    workGroup: 'Telesales & Gọi điện',
    kpiCode: 'KPI_NEW_CUSTOMERS',
    kpiName: 'Số Lượng Khách Hàng Mới Ký Hợp Đồng',
    target: 15,
    unit: 'Khách hàng',
    weight: 30,
    budget: 3000000,
    actualCost: 2400000,
    expectedResult: '15 khách mới chốt đơn, tỷ lệ Qualified > 30%',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    actual: 12,
    achievementRate: 80.0,
    qualityScore: 86,
    efficiencyRate: 85,
    timelinessRate: 88,
    gap: 3,
    forecast: 15,
    forecastStatus: 'on_track',
    rootCauseCategory: 'customer',
    rootCause: 'Data khách hàng chiến dịch tuần 2 có tỷ lệ sai số điện thoại khoảng 12%',
    evidence: 'Nhật ký cuộc gọi CRM ghi nhận 120 số không liên lạc được',
    correctiveAction: 'Lọc lại tệp dữ liệu khách hàng từ hiệp hội xây dựng và gọi bù 150 số mới trong 5 ngày tới',
    actionPic: 'Lê Hoàng Nam',
    actionDeadline: '2026-08-26',
    status: 'in_execution',
    approvedBy: 'Nguyễn Văn An (Trưởng nhóm KD)',
    approvedAt: '2026-08-01 08:30',
    createdAt: '2026-07-30 15:00'
  },

  // 4. Kế hoạch Quản Trị Công Nợ & Thu Hồi Tiền Tháng 8 (Kế toán Trần Thị Mai)
  {
    id: 'pln-fin-mai-08',
    planCode: 'PLN-2026-KT-08',
    planName: 'Kế hoạch Thu Hồi Công Nợ & Đối Soát Sổ Quỹ VietQR Tháng 08/2026',
    planType: 'finance',
    granularity: 'month',
    periodYear: 2026,
    periodMonth: 8,
    periodLabel: 'Tháng 08/2026',
    division: 'Khối Tài Chính',
    unitName: 'Văn Phòng Tổng',
    department: 'Phòng Kế Toán - Tài Chính',
    ownerName: 'Trần Thị Mai',
    ownerRole: 'Kế toán trưởng',
    picName: 'Trần Thị Mai',
    parentPlanId: 'pln-corp-2026-q3',
    objective: 'Thu hồi 100% nợ đến hạn (18.4 triệu), đối chiếu 100% giao dịch VietQR trong ngày và hoàn thiện chứng chỉ HĐĐT',
    workCategoryId: 'cat-accounting-finance',
    workCategoryName: 'TÀI CHÍNH, DÒNG TIỀN & THU HỒI CÔNG NỢ',
    workGroup: 'Đôn đốc & Thu hồi công nợ',
    kpiCode: 'KPI_COLLECTIONS',
    kpiName: 'Tổng Tiền Thực Thu Sổ Quỹ',
    target: 140000000,
    unit: 'VNĐ',
    weight: 35,
    budget: 2000000,
    actualCost: 1200000,
    expectedResult: 'Thu đủ 140 triệu dòng tiền, giảm nợ quá hạn về 0 VNĐ',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    actual: 118500000,
    achievementRate: 84.6,
    qualityScore: 96,
    efficiencyRate: 92,
    timelinessRate: 94,
    gap: 21500000,
    forecast: 138000000,
    forecastStatus: 'on_track',
    status: 'in_execution',
    approvedBy: 'Võ Minh Đăng (CEO)',
    approvedAt: '2026-07-31 17:00',
    createdAt: '2026-07-29 11:00'
  }
];

// =========================================================================
// 4. ACTION MANAGEMENT PLANS (GIAO VIỆC BÙ ĐẮP KHI KPI CÓ GAP)
// =========================================================================

export const INITIAL_ACTION_PLANS: KpiActionPlan[] = [
  {
    id: 'act-2026-01',
    actionCode: 'ACT-2026-001',
    planId: 'pln-sales-2026-08',
    kpiCode: 'KPI_REVENUE',
    kpiName: 'Doanh Số Bán Hàng Tháng 8',
    title: 'Giao phương án bù: Gọi bổ sung 100 khách hàng tiềm năng & xúc tiến báo giá chốt 25 triệu',
    rootCauseCategory: 'market',
    rootCause: 'Thị trường đầu tháng 8 biến động nhẹ khiến một số đơn hàng tôn lạnh Hoa Sen bị hoãn lại 1 tuần',
    evidence: 'Báo cáo trễ hạn chốt deal của 3 khách hàng lớn (Đại Lý Thép Miền Đông, Phúc Thịnh, Vinaconex)',
    expectedResult: 'Bù đắp đủ 25.5 triệu doanh số thiếu hụt, chốt tối thiểu 3 đơn hàng trước ngày 26/08',
    recoveryTargetAmount: 25500000,
    picId: 'user-nam',
    picName: 'Lê Hoàng Nam',
    picRole: 'Sales Phụ Trách KV1',
    supportingPerson: 'Nguyễn Văn An (Trưởng nhóm KD hỗ trợ đàm phán chiết khấu)',
    deadline: '2026-08-25',
    priority: 'urgent',
    progressPercent: 65,
    status: 'in_progress',
    resultNote: 'Đã liên hệ lại 68/100 khách, 2 đại lý đã chốt đặt cọc 15 triệu',
    assignedBy: 'Võ Minh Đăng (CEO)',
    assignedAt: '2026-08-15 09:30'
  },
  {
    id: 'act-2026-02',
    actionCode: 'ACT-2026-002',
    planId: 'pln-fin-mai-08',
    kpiCode: 'KPI_OVERDUE_DEBT',
    kpiName: 'Kiểm Soát Nợ Quá Hạn Phải Thu',
    title: 'Giao phương án bù: Đối chiếu và thu dứt điểm công nợ quá hạn của CTY CP Vạn Phát (8.4 triệu)',
    rootCauseCategory: 'customer',
    rootCause: 'Khách hàng dời lịch thanh toán do đang chờ chủ đầu tư nghiệm thu giai đoạn 2',
    evidence: 'Biên bản nghiệm thu đợt 1 ngày 20/07/2026',
    expectedResult: 'Thu hồi 100% số tiền 8.400.000 VNĐ qua chuyển khoản VietQR',
    recoveryTargetAmount: 8400000,
    picId: 'user-mai',
    picName: 'Trần Thị Mai',
    picRole: 'Kế toán công nợ',
    supportingPerson: 'Lê Hoàng Nam (Sales phụ trách tài khoản)',
    deadline: '2026-08-23',
    priority: 'high',
    progressPercent: 80,
    status: 'in_progress',
    resultNote: 'Đối tác đã ký ủy nhiệm chi, dự kiến tiền về tài khoản ngày 22/08',
    assignedBy: 'Nguyễn Văn An (PTGĐ)',
    assignedAt: '2026-08-16 14:00'
  }
];

// =========================================================================
// 5. STAGE TASK AUTOMATION RULES (TỰ ĐỘNG SINH TASK KHI KHÁCH ĐỔI STAGE)
// =========================================================================

export const STAGE_TASK_AUTOMATION_RULES: StageTaskAutomationConfig[] = [
  // PRE-SALES
  {
    stage: 'lead_search',
    phase: 'pre_sales',
    autoTaskTitle: 'Thu thập thông tin & khảo sát quy mô khách hàng',
    taskType: 'call_upsell',
    priority: 'normal',
    dueDaysFromTransition: 1,
    standardChecklist: ['Xác thực số điện thoại/Zalo', 'Tìm hiểu mã số thuế & địa chỉ', 'Phân loại nhóm khách hàng']
  },
  {
    stage: 'lead_qualification',
    phase: 'pre_sales',
    autoTaskTitle: 'Gọi điện Qualification: Xác định nhu cầu SKU & ngân sách',
    taskType: 'call_upsell',
    priority: 'high',
    dueDaysFromTransition: 1,
    standardChecklist: ['Hỏi rõ chủng loại thép/tôn cần mua', 'Xác định thời điểm giao hàng', 'Kiểm tra khả năng thanh toán']
  },
  {
    stage: 'initial_consult',
    phase: 'pre_sales',
    autoTaskTitle: 'Hẹn gặp trực tiếp / Khảo sát thực địa công trình',
    taskType: 'visit',
    priority: 'high',
    dueDaysFromTransition: 2,
    standardChecklist: ['Mang mẫu sản phẩm & Catalogue', 'Gặp người ra quyết định thu mua', 'Ghi nhận yêu cầu kỹ thuật']
  },

  // DURING SALES
  {
    stage: 'demo_proposal',
    phase: 'during_sales',
    autoTaskTitle: 'Lập bảng báo giá chi tiết theo quy cách lô FIFO & gửi qua Zalo',
    taskType: 'zalo_quote',
    priority: 'urgent',
    dueDaysFromTransition: 1,
    standardChecklist: ['Áp dụng bảng giá chuẩn hoặc chiết khấu duyệt', 'Kiểm tra tồn khả dụng trong kho', 'Gửi báo giá có hiệu lực 5 ngày']
  },
  {
    stage: 'negotiation_terms',
    phase: 'during_sales',
    autoTaskTitle: 'Đàm phán thương lượng điều khoản & hạn mức thanh toán',
    taskType: 'contract_negotiation',
    priority: 'urgent',
    dueDaysFromTransition: 2,
    standardChecklist: ['Thống nhất tỷ lệ thanh toán trước (70/30 hoặc 100%)', 'Chốt lịch giao hàng', 'Duyệt phương án chiết khấu']
  },
  {
    stage: 'contract_closing',
    phase: 'during_sales',
    autoTaskTitle: 'Soạn thảo hợp đồng kinh tế & xác nhận đặt cọc',
    taskType: 'contract_negotiation',
    priority: 'urgent',
    dueDaysFromTransition: 1,
    standardChecklist: ['Trình ký Ban Giám Đốc', 'Gửi khách hàng ký đóng dấu', 'Xác nhận nhận tiền cọc/đơn hàng']
  },

  // AFTER SALES
  {
    stage: 'delivery_fulfillment',
    phase: 'after_sales',
    autoTaskTitle: 'Điều phối xuất kho FIFO & theo dõi lái xe giao hàng',
    taskType: 'other',
    priority: 'high',
    dueDaysFromTransition: 1,
    standardChecklist: ['In phiếu xuất kho & HĐĐT', 'Kiểm đếm bốc hàng lên xe tải', 'Xác nhận ký biên bản giao nhận']
  },
  {
    stage: 'cskh_care',
    phase: 'after_sales',
    autoTaskTitle: 'Gọi chăm sóc sau giao hàng: Đánh giá chất lượng & nghiệm thu',
    taskType: 'after_sales',
    priority: 'normal',
    dueDaysFromTransition: 3,
    standardChecklist: ['Hỏi thăm sự hài lòng về hàng hóa & thời gian giao', 'Ghi nhận ý kiến phản hồi', 'Cập nhật điểm chất lượng']
  },
  {
    stage: 'retention_upsell',
    phase: 'after_sales',
    autoTaskTitle: 'Tái kích hoạt mua lại / Giới thiệu sản phẩm phụ trợ & Up-sell',
    taskType: 'call_upsell',
    priority: 'normal',
    dueDaysFromTransition: 14,
    standardChecklist: ['Xem chu kỳ mua định kỳ', 'Gửi báo giá danh mục sản phẩm mới', 'Mời tham gia chương trình khách hàng thân thiết']
  }
];

// =========================================================================
// 6. INITIAL ENTERPRISE FORECASTS (DỰ BÁO KẾT THÚC KỲ)
// =========================================================================

export const INITIAL_ENTERPRISE_FORECASTS: EnterpriseForecastItem[] = [
  {
    dimension: 'Doanh Số Bán Hàng Tháng 8',
    unit: 'VNĐ',
    target: 150000000,
    actualYtd: 124500000,
    pipelineWeight: 32000000,
    runRateEstimate: 142000000,
    forecastTotal: 146500000,
    achievementForecastRate: 97.7,
    gap: 3500000,
    status: 'on_track',
    mitigationAction: 'Chốt nốt 2 hợp đồng xây dựng đang trong giai đoạn đàm phán thương lượng'
  },
  {
    dimension: 'Lợi Nhuận Gộp Tháng 8',
    unit: 'VNĐ',
    target: 50000000,
    actualYtd: 45200000,
    pipelineWeight: 11000000,
    runRateEstimate: 49500000,
    forecastTotal: 52400000,
    achievementForecastRate: 104.8,
    gap: 0,
    status: 'exceeded',
    mitigationAction: 'Duy trì cơ cấu sản phẩm biên lợi nhuận cao (Tôn màu, Kẽm gai)'
  },
  {
    dimension: 'Số Lượng Khách Hàng Mới (MSKH)',
    unit: 'Khách',
    target: 20,
    actualYtd: 14,
    pipelineWeight: 8,
    runRateEstimate: 18,
    forecastTotal: 19,
    achievementForecastRate: 95.0,
    gap: 1,
    status: 'on_track',
    mitigationAction: 'Giao thêm 50 data lead cho Team Telesales gọi kích hoạt trong 3 ngày tới'
  },
  {
    dimension: 'Dòng Tiền Thực Thu Sổ Quỹ',
    unit: 'VNĐ',
    target: 140000000,
    actualYtd: 118500000,
    pipelineWeight: 25000000,
    runRateEstimate: 135000000,
    forecastTotal: 138500000,
    achievementForecastRate: 98.9,
    gap: 1500000,
    status: 'on_track',
    mitigationAction: 'Đôn đốc 3 khách hàng thanh toán nợ trước ngày 25'
  }
];

// =========================================================================
// 7. INITIAL PERFORMANCE SCORECARDS
// =========================================================================

export const INITIAL_PERFORMANCE_SCORECARDS: PerformanceScorecard[] = [
  {
    userId: 'user-nam',
    userName: 'Lê Hoàng Nam',
    userRole: 'Sales KV1',
    department: 'Phòng Bán Hàng',
    period: 'Tháng 08/2026',
    periodType: 'monthly',
    kpiScore: 88.5,
    taskCompletionRate: 92.0,
    taskQualityScore: 89.0,
    deadlineComplianceRate: 88.0,
    revenueGenerated: 68500000,
    profitContribution: 24800000,
    customerQualityScore: 94.0,
    efficiencyScore: 87.0,
    totalAssignedTasks: 38,
    completedTasks: 35,
    overdueTasks: 3,
    openTasks: 3,
    totalPlansOwned: 2,
    achievedPlans: 1,
    ranking: 1,
    grade: 'A_EXCELLENT'
  },
  {
    userId: 'user-mai',
    userName: 'Trần Thị Mai',
    userRole: 'Kế toán trưởng',
    department: 'Phòng Kế Toán - Tài Chính',
    period: 'Tháng 08/2026',
    periodType: 'monthly',
    kpiScore: 92.0,
    taskCompletionRate: 96.0,
    taskQualityScore: 95.0,
    deadlineComplianceRate: 94.0,
    revenueGenerated: 0,
    profitContribution: 0,
    customerQualityScore: 96.0,
    efficiencyScore: 93.0,
    totalAssignedTasks: 25,
    completedTasks: 24,
    overdueTasks: 1,
    openTasks: 1,
    totalPlansOwned: 1,
    achievedPlans: 1,
    ranking: 1,
    grade: 'A_EXCELLENT'
  },
  {
    userId: 'user-an',
    userName: 'Nguyễn Văn An',
    userRole: 'Trưởng nhóm KD',
    department: 'Phòng Bán Hàng & Dự Án',
    period: 'Tháng 08/2026',
    periodType: 'monthly',
    kpiScore: 86.0,
    taskCompletionRate: 88.0,
    taskQualityScore: 87.0,
    deadlineComplianceRate: 85.0,
    revenueGenerated: 56000000,
    profitContribution: 20400000,
    customerQualityScore: 91.0,
    efficiencyScore: 86.0,
    totalAssignedTasks: 22,
    completedTasks: 19,
    overdueTasks: 3,
    openTasks: 3,
    totalPlansOwned: 2,
    achievedPlans: 1,
    ranking: 2,
    grade: 'B_GOOD'
  }
];

// =========================================================================
// 8. INITIAL ENTERPRISE SYSTEM ALERTS
// =========================================================================

export const INITIAL_ENTERPRISE_ALERTS: EnterpriseSystemAlert[] = [
  {
    id: 'alt-01',
    type: 'kpi_below_target',
    title: 'Cảnh báo Gap Doanh Số Tháng 8: Còn thiếu 25.5 triệu VNĐ (Đạt 83%)',
    description: 'Doanh số thực tế 124.5 triệu / Mục tiêu 150 triệu. Cần đẩy nhanh tiến độ chốt các deal trong phễu đàm phán.',
    severity: 'warning',
    module: 'Kinh Doanh',
    metricGap: 'Thiếu 25.500.000 đ',
    relatedEntityName: 'Khối Kinh Doanh - KV1',
    picName: 'Lê Hoàng Nam & Nguyễn Văn An',
    detectedAt: '2026-08-21 08:00',
    suggestedAction: 'Xem phương án giao việc bù đắp ACT-2026-001',
    isResolved: false
  },
  {
    id: 'alt-02',
    type: 'task_overdue',
    title: 'Cảnh báo 39 Tác vụ quá hạn cần xử lý khẩn cấp',
    description: 'Hệ thống phát hiện 39 task quá hạn thời gian cam kết, trong đó có 35 task chưa check-in cập nhật tiến độ trong 3 ngày qua.',
    severity: 'critical',
    module: 'Tác Vụ & CSKH',
    metricGap: '39 việc trễ hạn',
    relatedEntityName: 'Module Task & CRM',
    picName: 'Các nhân sự phụ trách liên quan',
    detectedAt: '2026-08-21 08:30',
    suggestedAction: 'Sử dụng nút 1-Click Check-in "Vẫn đang làm" hoặc bàn giao việc',
    isResolved: false
  },
  {
    id: 'alt-03',
    type: 'collection_overdue',
    title: 'Cảnh báo Công nợ khách hàng CTY CP Vạn Phát quá hạn (8.400.000 đ)',
    description: 'Khoản nợ đơn hàng ORD-2026-1024 đã quá hạn 5 ngày theo điều khoản tín dụng.',
    severity: 'warning',
    module: 'Tài Chính & Kế Toán',
    metricGap: 'Nợ 8.400.000 đ',
    relatedEntityId: 'c-1',
    relatedEntityName: 'CTY CP Vạn Phát',
    picName: 'Trần Thị Mai',
    detectedAt: '2026-08-21 09:00',
    suggestedAction: 'Gửi biên bản đối chiếu công nợ và mã VietQR nhắc nợ tự động',
    isResolved: false
  }
];
