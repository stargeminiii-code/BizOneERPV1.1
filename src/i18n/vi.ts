export const vi = {
  // Brand
  brand: {
    name: 'BizOne ERP',
    shortName: 'BizOne',
    tagline: 'Enterprise ERP',
    enterprise: 'DOANH NGHIỆP',
    demo: 'DEMO',
    aiAssistant: 'Trợ lý AI'
  },

  // Common UI Actions & Labels
  common: {
    search: 'Tìm kiếm...',
    searchShortcut: 'Tìm nhanh (⌘K)',
    filter: 'Bộ lọc',
    addFilter: '+ Thêm bộ lọc',
    all: 'Tất cả',
    save: 'Lưu thay đổi',
    saved: 'Đã lưu',
    cancel: 'Hủy bỏ',
    confirm: 'Xác nhận',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    create: 'Tạo mới',
    add: 'Thêm mới',
    export: 'Xuất file',
    exportExcel: 'Xuất Excel',
    import: 'Nhập file',
    importExcel: 'Nhập Excel',
    refresh: 'Làm mới',
    actions: 'Thao tác',
    status: 'Trạng thái',
    date: 'Ngày',
    time: 'Thời gian',
    branch: 'Chi nhánh',
    warehouse: 'Kho hàng',
    salesChannel: 'Kênh bán',
    businessModel: 'Mô hình',
    note: 'Ghi chú',
    total: 'Tổng cộng',
    quantity: 'Số lượng',
    price: 'Đơn giá',
    amount: 'Thành tiền',
    revenue: 'Doanh thu',
    profit: 'LN',
    grossProfit: 'LN gộp',
    cost: 'Giá vốn',
    expense: 'Chi phí',
    cashflow: 'Dòng tiền',
    customer: 'Khách hàng',
    supplier: 'NCC',
    user: 'Người dùng',
    role: 'Vai trò',
    details: 'Chi tiết',
    close: 'Đóng',
    back: 'Quay lại',
    loading: 'Đang tải...',
    processing: 'Đang xử lý...',
    noData: 'Chưa có dữ liệu',
    success: 'Thành công',
    error: 'Đã xảy ra lỗi',
    warning: 'Cảnh báo',
    system: 'Hệ thống',
    yes: 'Có',
    no: 'Không',
    active: 'Hoạt động',
    inactive: 'Ngừng sử dụng',
    locked: 'Đã khóa',
    pending: 'Chờ xử lý',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy',
    language: 'Ngôn ngữ'
  },

  // Navigation Modules & Sub-groups
  nav: {
    dashboard: 'Dashboard',
    business: 'Kinh doanh',
    orders: 'Đơn hàng',
    pos: 'POS',
    marketing: 'Marketing',
    marketingSub: 'Marketing',
    crm: 'CRM',
    crmSub: 'CRM',
    purchasing: 'Mua hàng',
    purchasingSub: 'Mua hàng & NCC',
    suppliers: 'NCC',
    inventory: 'Kho & FIFO',
    warehouseDashboard: 'Tổng quan Kho',
    warehouseIssues: 'Xuất kho',
    warehouseTransfers: 'Chuyển kho',
    warehouseStocktakes: 'Kiểm kê',
    warehouseFifoLots: 'Lô & FIFO',
    stockcards: 'Thẻ kho',
    warehouseReports: 'Báo cáo kho',
    products: 'Sản phẩm',
    productsSub: 'Danh mục SP & Tồn kho',
    variantDefinitions: 'Variant SKU',
    beverages: 'F&B',
    beveragesSub: 'F&B & Recipe',
    finance: 'TC-KT',
    cashflow: 'Quỹ & Dòng tiền',
    pnl: 'Báo cáo P&L',
    banking: 'Ngân hàng & VietQR',
    ecommerce: 'TMĐT & API',
    planning: 'KH & KPI',
    usersRoles: 'Tài khoản & Quyền',
    settings: 'Cài đặt',
    aiAssistant: 'BizOne AI'
  },

  // Dashboard Perspectives & KPIs
  dashboard: {
    title: 'DASHBOARD',
    subtitle: 'Trung tâm điều hành số liệu và chỉ số hiệu suất',
    perspectives: {
      overview: 'Tổng quan',
      inventoryFifo: 'Kho & FIFO',
      retail: 'Bán lẻ',
      wholesale: 'Bán buôn',
      online: 'Online',
      fnb: 'F&B'
    },
    kpi: {
      performance: 'Hiệu suất',
      revenue: 'Doanh thu',
      profit: 'Lợi nhuận',
      orders: 'Đơn hàng',
      receivables: 'Công nợ phải thu',
      payables: 'Công nợ phải trả',
      inventory: 'Giá trị tồn kho',
      cost: 'Giá vốn FIFO',
      customers: 'Khách hàng',
      expenses: 'Chi phí hoạt động',
      cashflow: 'Dòng tiền ròng',
      kpiProgress: 'Tiến độ KPI',
      alerts: 'Cảnh báo',
      progress: 'Tiến độ'
    },
    filters: {
      timeRange: 'Thời gian',
      today: 'Hôm nay',
      yesterday: 'Hôm qua',
      thisWeek: 'Tuần này',
      thisMonth: 'Tháng này',
      thisQuarter: 'Quý này',
      thisYear: 'Năm nay',
      customRange: 'Tùy chọn ngày',
      branch: 'Chi nhánh',
      warehouse: 'Kho hàng',
      channel: 'Kênh bán',
      businessModel: 'Mô hình',
      addFilter: '+ Thêm bộ lọc',
      clearFilters: 'Xóa bộ lọc',
      apply: 'Áp dụng'
    }
  },

  // Business / Orders module
  business: {
    title: 'Kinh doanh',
    ordersSubtitle: 'Đơn hàng & Lợi nhuận',
    cogsTitle: 'Giá vốn FIFO',
    orderList: 'Danh sách đơn hàng',
    createOrder: 'Tạo đơn bán hàng',
    orderCode: 'Mã đơn hàng',
    customerName: 'Tên khách hàng',
    channel: 'Kênh bán',
    totalAmount: 'Tổng tiền',
    cogsAmount: 'Giá vốn FIFO',
    grossProfit: 'Lợi nhuận gộp',
    margin: 'Tỷ suất LN (%)',
    paymentStatus: 'Thanh toán',
    deliveryStatus: 'Giao hàng',
    channels: {
      pos: 'Bán lẻ (POS)',
      wholesale: 'Bán buôn / Đại lý',
      shopee: 'Shopee',
      tiktok: 'TikTok Shop',
      lazada: 'Lazada',
      website: 'Website'
    }
  },

  // F&B & Beverages module
  beverages: {
    title: 'F&B & Đồ uống',
    menuRecipe: 'Menu & Recipe',
    recipeBom: 'Recipe / BOM',
    quantitySpecs: 'Định lượng',
    ingredients: 'Nguyên liệu',
    fifoRecipe: 'FIFO Recipe',
    addDrink: 'Thêm đồ uống',
    beverageName: 'Tên đồ uống',
    category: 'Nhóm đồ uống',
    size: 'Kích cỡ (Size)',
    recipeCost: 'Giá vốn Recipe',
    salePrice: 'Giá bán niêm yết',
    profitMargin: 'Biên LN gộp',
    ingredientDeduction: 'Tự động trừ nguyên liệu FIFO',
    stockAlert: 'Cảnh báo tồn kho nguyên liệu'
  },

  // Planning & KPI module
  planning: {
    title: 'Kế hoạch & KPI',
    plans: 'Kế hoạch',
    kpi: 'KPI',
    gap: 'GAP',
    rootCause: 'Nguyên nhân',
    pic: 'Người phụ trách (PIC)',
    actionPlan: 'Kế hoạch hành động',
    deadline: 'Thời hạn',
    result: 'Kết quả',
    addKpi: 'Thêm chỉ tiêu KPI',
    target: 'Mục tiêu',
    actual: 'Thực tế',
    variance: 'Chênh lệch',
    status: 'Trạng thái tiến độ'
  },

  // CRM module
  crm: {
    title: 'Khách hàng & CRM',
    customers: 'Khách hàng',
    partners: 'Đối tác',
    history: 'Lịch sử giao dịch',
    tasks: 'Công việc',
    debtReminder: 'Nhắc nợ',
    addCustomer: 'Thêm khách hàng',
    customerGroup: 'Nhóm khách hàng',
    phone: 'Số điện thoại',
    debtBalance: 'Dư nợ hiện tại',
    loyaltyTier: 'Hạng thành viên'
  },

  // Marketing module
  marketing: {
    title: 'Marketing & Combo',
    campaigns: 'Chiến dịch',
    vouchers: 'Voucher & Giảm giá',
    adChannels: 'Kênh quảng cáo',
    crossSell: 'Cross-sell',
    aov: 'AOV (Giá trị ĐH TB)',
    roas: 'ROAS (Hiệu quả QC)',
    createCampaign: 'Tạo chiến dịch',
    budget: 'Ngân sách',
    cost: 'Chi phí đã chi',
    conversions: 'Chuyển đổi'
  },

  // Purchasing & Suppliers module
  purchasing: {
    title: 'Mua hàng & Nhà cung cấp',
    suppliers: 'Nhà cung cấp',
    purchaseOrders: 'Đơn mua (PO)',
    goodsReceipt: 'Nhập hàng',
    payables: 'Công nợ NCC',
    taxCodeLookup: 'Tra cứu MST',
    createPo: 'Tạo đơn mua hàng (PO)',
    supplierName: 'Tên nhà cung cấp',
    taxCode: 'Mã số thuế'
  },

  // Inventory & FIFO module
  inventory: {
    title: 'Kho & FIFO',
    overview: 'Tổng quan Kho',
    goodsReceipt: 'Nhập kho',
    goodsIssue: 'Xuất kho',
    stockTransfer: 'Chuyển kho',
    stocktake: 'Kiểm kê',
    fifoLots: 'Lô & FIFO',
    stockCard: 'Thẻ kho',
    inventoryReport: 'Báo cáo kho',
    inwardLots: 'Nhập lô FIFO',
    lotCode: 'Mã lô',
    receivedDate: 'Ngày nhập kho',
    expiryDate: 'Hạn sử dụng',
    remainingQty: 'Tồn khả dụng',
    unitCost: 'Đơn giá vốn'
  },

  // Products Master Data module
  products: {
    title: 'Sản phẩm',
    categories: 'Danh mục',
    productList: 'Sản phẩm',
    variants: 'Biến thể',
    sku: 'SKU',
    packSizes: 'Quy cách',
    combos: 'Combo',
    fifoLots: 'Lô FIFO',
    standardData: 'Dữ liệu chuẩn',
    masterData: 'Dữ liệu Master',
    variantSku: 'Variant SKU',
    syncData: 'Đồng bộ dữ liệu',
    fields: {
      category: 'Nhóm hàng',
      brand: 'Thương hiệu',
      productName: 'Tên sản phẩm',
      variantName: 'Biến thể',
      variantSku: 'SKU Biến thể',
      packSize: 'Quy cách',
      productId: 'Mã sản phẩm (ID)',
      productCode: 'Mã hàng',
      unit: 'Đơn vị tính',
      notes: 'Ghi chú'
    }
  },

  // Finance & Cashflow module
  finance: {
    title: 'Quỹ & Dòng tiền',
    inflow: 'Thu',
    outflow: 'Chi',
    fund: 'Quỹ tiền mặt',
    bankingVietQr: 'Ngân hàng & VietQR',
    reconciliation: 'Đối soát',
    debtManagement: 'Công nợ',
    pnl: 'Kết quả kinh doanh (P&L)',
    createReceipt: 'Lập phiếu thu',
    createPayment: 'Lập phiếu chi',
    bankAccounts: 'Tài khoản ngân hàng',
    accountNumber: 'Số tài khoản',
    bankName: 'Ngân hàng',
    balance: 'Số dư hiện tại'
  },

  // E-commerce & API module
  ecommerce: {
    title: 'TMĐT & API',
    shopee: 'Shopee',
    tiktok: 'TikTok Shop',
    lazada: 'Lazada',
    website: 'Website',
    facebook: 'Facebook',
    skuMapping: 'SKU Mapping',
    webhook: 'Webhook',
    syncOrders: 'Đồng bộ đơn',
    syncStock: 'Đồng bộ tồn',
    syncErrors: 'Lỗi đồng bộ',
    reSync: 'Đồng bộ lại'
  },

  // Accounts & RBAC module
  accounts: {
    title: 'Tài khoản & Phân quyền',
    userAccounts: 'Tài khoản',
    roles: 'Vai trò',
    permissions: 'Phân quyền',
    dataScope: 'Phạm vi dữ liệu',
    auditLogs: 'Nhật ký hoạt động',
    tenantEnterprise: 'Enterprise',
    tenantDemo: 'Demo Sandbox',
    addUser: 'Thêm tài khoản',
    lockUser: 'Khóa tài khoản',
    unlockUser: 'Mở khóa',
    resetPassword: 'Đặt lại mật khẩu'
  },

  // Settings module
  settings: {
    title: 'Cài đặt',
    company: 'Doanh nghiệp',
    users: 'Người dùng',
    permissions: 'Phân quyền',
    banking: 'Ngân hàng',
    vietqr: 'VietQR',
    integrations: 'Tích hợp',
    googleSheets: 'Google Sheets',
    systemConfig: 'Cấu hình hệ thống'
  },

  // Messages & Notifications
  messages: {
    loginSuccess: 'Đăng nhập thành công',
    invalidCredentials: 'Tên đăng nhập hoặc mật khẩu không chính xác',
    sessionExpired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    insufficientStock: 'Số lượng tồn kho FIFO không đủ để xuất',
    orderCreated: 'Đã tạo đơn hàng thành công',
    paymentSuccess: 'Giao dịch thanh toán thành công',
    dataSaved: 'Đã lưu dữ liệu thành công',
    networkError: 'Không thể kết nối máy chủ. Vui lòng kiểm tra lại mạng.'
  }
};
