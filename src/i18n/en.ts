export const en = {
  // Brand
  brand: {
    name: 'BizOne ERP',
    shortName: 'BizOne',
    tagline: 'Enterprise ERP',
    enterprise: 'ENTERPRISE',
    demo: 'DEMO',
    aiAssistant: 'AI Assistant'
  },

  // Common UI Actions & Labels
  common: {
    search: 'Search...',
    searchShortcut: 'Quick search (⌘K)',
    filter: 'Filter',
    addFilter: '+ Add Filter',
    all: 'All',
    save: 'Save Changes',
    saved: 'Saved',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create New',
    add: 'Add New',
    export: 'Export',
    exportExcel: 'Export Excel',
    import: 'Import',
    importExcel: 'Import Excel',
    refresh: 'Refresh',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    time: 'Time',
    branch: 'Branch',
    warehouse: 'Warehouse',
    salesChannel: 'Sales Channel',
    businessModel: 'Model',
    note: 'Note',
    total: 'Total',
    quantity: 'Quantity',
    price: 'Unit Price',
    amount: 'Amount',
    revenue: 'Revenue',
    profit: 'Profit',
    grossProfit: 'Gross Margin',
    cost: 'COGS',
    expense: 'Expenses',
    cashflow: 'Cash Flow',
    customer: 'Customer',
    supplier: 'Supplier',
    user: 'User',
    role: 'Role',
    details: 'Details',
    close: 'Close',
    back: 'Back',
    loading: 'Loading...',
    processing: 'Processing...',
    noData: 'No data available',
    success: 'Success',
    error: 'An error occurred',
    warning: 'Warning',
    system: 'System',
    yes: 'Yes',
    no: 'No',
    active: 'Active',
    inactive: 'Inactive',
    locked: 'Locked',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    language: 'Language'
  },

  // Navigation Modules & Sub-groups
  nav: {
    dashboard: 'Dashboard',
    business: 'Sales',
    orders: 'Orders',
    pos: 'POS',
    marketing: 'Marketing',
    marketingSub: 'Marketing',
    crm: 'CRM',
    crmSub: 'CRM',
    purchasing: 'Purchasing',
    purchasingSub: 'Purchasing & Suppliers',
    suppliers: 'Suppliers',
    inventory: 'Inventory & FIFO',
    warehouseDashboard: 'Warehouse Overview',
    warehouseIssues: 'Stock Out',
    warehouseTransfers: 'Stock Transfer',
    warehouseStocktakes: 'Stocktaking',
    warehouseFifoLots: 'FIFO Lots',
    stockcards: 'Stock Card',
    warehouseReports: 'Inventory Reports',
    products: 'Products',
    productsSub: 'Products & Stock',
    variantDefinitions: 'Variant SKU',
    beverages: 'F&B',
    beveragesSub: 'F&B & Recipe',
    finance: 'Finance & Accounting',
    cashflow: 'Cash & Flow',
    pnl: 'Income Statement (P&L)',
    banking: 'Banking & VietQR',
    ecommerce: 'E-Commerce & API',
    planning: 'Planning & KPI',
    usersRoles: 'Accounts & Permissions',
    settings: 'Settings',
    aiAssistant: 'BizOne AI'
  },

  // Dashboard Perspectives & KPIs
  dashboard: {
    title: 'DASHBOARD',
    subtitle: 'Executive operations center for key performance indicators',
    perspectives: {
      overview: 'Overview',
      inventoryFifo: 'Inventory & FIFO',
      retail: 'Retail',
      wholesale: 'Wholesale',
      online: 'Online',
      fnb: 'F&B'
    },
    kpi: {
      performance: 'Performance',
      revenue: 'Revenue',
      profit: 'Profit',
      orders: 'Orders',
      receivables: 'Receivables',
      payables: 'Payables',
      inventory: 'Inventory Value',
      cost: 'FIFO Cost (COGS)',
      customers: 'Customers',
      expenses: 'Operating Expenses',
      cashflow: 'Net Cash Flow',
      kpiProgress: 'KPI Progress',
      alerts: 'Alerts',
      progress: 'Progress'
    },
    filters: {
      timeRange: 'Time Range',
      today: 'Today',
      yesterday: 'Yesterday',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      thisQuarter: 'This Quarter',
      thisYear: 'This Year',
      customRange: 'Custom Date Range',
      branch: 'Branch',
      warehouse: 'Warehouse',
      channel: 'Channel',
      businessModel: 'Model',
      addFilter: '+ Add Filter',
      clearFilters: 'Clear Filters',
      apply: 'Apply'
    }
  },

  // Business / Orders module
  business: {
    title: 'Sales & Orders',
    ordersSubtitle: 'Orders & Profit',
    cogsTitle: 'FIFO Cost',
    orderList: 'Order List',
    createOrder: 'Create Sales Order',
    orderCode: 'Order Code',
    customerName: 'Customer Name',
    channel: 'Sales Channel',
    totalAmount: 'Total Amount',
    cogsAmount: 'FIFO Cost',
    grossProfit: 'Gross Profit',
    margin: 'Margin (%)',
    paymentStatus: 'Payment',
    deliveryStatus: 'Delivery',
    channels: {
      pos: 'Retail (POS)',
      wholesale: 'Wholesale / B2B',
      shopee: 'Shopee',
      tiktok: 'TikTok Shop',
      lazada: 'Lazada',
      website: 'Website'
    }
  },

  // F&B & Beverages module
  beverages: {
    title: 'F&B & Beverages',
    menuRecipe: 'Menu & Recipe',
    recipeBom: 'Recipe / BOM',
    quantitySpecs: 'Quantity Specs',
    ingredients: 'Ingredients',
    fifoRecipe: 'FIFO Recipe',
    addDrink: 'Add Drink',
    beverageName: 'Beverage Name',
    category: 'Beverage Category',
    size: 'Size',
    recipeCost: 'Recipe Cost',
    salePrice: 'Listed Price',
    profitMargin: 'Gross Margin',
    ingredientDeduction: 'Auto FIFO Ingredient Deduction',
    stockAlert: 'Ingredient Stock Alert'
  },

  // Planning & KPI module
  planning: {
    title: 'Planning & KPI',
    plans: 'Plans',
    kpi: 'KPI',
    gap: 'GAP',
    rootCause: 'Root Cause',
    pic: 'Person in Charge (PIC)',
    actionPlan: 'Action Plan',
    deadline: 'Deadline',
    result: 'Result',
    addKpi: 'Add KPI Target',
    target: 'Target',
    actual: 'Actual',
    variance: 'Variance',
    status: 'Progress Status'
  },

  // CRM module
  crm: {
    title: 'Customers & CRM',
    customers: 'Customers',
    partners: 'Partners',
    history: 'Transaction History',
    tasks: 'Tasks',
    debtReminder: 'Debt Reminder',
    addCustomer: 'Add Customer',
    customerGroup: 'Customer Group',
    phone: 'Phone Number',
    debtBalance: 'Current Debt Balance',
    loyaltyTier: 'Membership Tier'
  },

  // Marketing module
  marketing: {
    title: 'Marketing & Combo',
    campaigns: 'Campaigns',
    vouchers: 'Vouchers & Discounts',
    adChannels: 'Ad Channels',
    crossSell: 'Cross-sell',
    aov: 'AOV (Average Order Value)',
    roas: 'ROAS (Ad Return)',
    createCampaign: 'Create Campaign',
    budget: 'Budget',
    cost: 'Spent Cost',
    conversions: 'Conversions'
  },

  // Purchasing & Suppliers module
  purchasing: {
    title: 'Purchasing & Suppliers',
    suppliers: 'Suppliers',
    purchaseOrders: 'Purchase Orders (PO)',
    goodsReceipt: 'Goods Receipt',
    payables: 'Supplier Payables',
    taxCodeLookup: 'Tax Code Lookup',
    createPo: 'Create Purchase Order',
    supplierName: 'Supplier Name',
    taxCode: 'Tax Code'
  },

  // Inventory & FIFO module
  inventory: {
    title: 'Inventory & FIFO',
    overview: 'Warehouse Overview',
    goodsReceipt: 'Stock In',
    goodsIssue: 'Stock Out',
    stockTransfer: 'Stock Transfer',
    stocktake: 'Stocktaking',
    fifoLots: 'FIFO Lots',
    stockCard: 'Stock Card',
    inventoryReport: 'Inventory Reports',
    inwardLots: 'Inward FIFO Lot',
    lotCode: 'Lot Code',
    receivedDate: 'Received Date',
    expiryDate: 'Expiry Date',
    remainingQty: 'Available Qty',
    unitCost: 'Unit Cost'
  },

  // Products Master Data module
  products: {
    title: 'Products',
    categories: 'Categories',
    productList: 'Products',
    variants: 'Variants',
    sku: 'SKU',
    packSizes: 'Packaging',
    combos: 'Combos',
    fifoLots: 'FIFO Lots',
    standardData: 'Standard Data',
    masterData: 'Master Data',
    variantSku: 'Variant SKU',
    syncData: 'Sync Data',
    fields: {
      category: 'Category',
      brand: 'Brand',
      productName: 'Product Name',
      variantName: 'Variant',
      variantSku: 'Variant SKU',
      packSize: 'Packaging Size',
      productId: 'Product ID',
      productCode: 'Product Code',
      unit: 'Unit',
      notes: 'Notes'
    }
  },

  // Finance & Cashflow module
  finance: {
    title: 'Cash & Finance',
    inflow: 'Cash In',
    outflow: 'Cash Out',
    fund: 'Cash Fund',
    bankingVietQr: 'Banking & VietQR',
    reconciliation: 'Reconciliation',
    debtManagement: 'Payables & Receivables',
    pnl: 'Income Statement (P&L)',
    createReceipt: 'Create Receipt',
    createPayment: 'Create Payment Voucher',
    bankAccounts: 'Bank Accounts',
    accountNumber: 'Account Number',
    bankName: 'Bank Name',
    balance: 'Current Balance'
  },

  // E-commerce & API module
  ecommerce: {
    title: 'E-commerce & API',
    shopee: 'Shopee',
    tiktok: 'TikTok Shop',
    lazada: 'Lazada',
    website: 'Website',
    facebook: 'Facebook',
    skuMapping: 'SKU Mapping',
    webhook: 'Webhook',
    syncOrders: 'Sync Orders',
    syncStock: 'Sync Stock',
    syncErrors: 'Sync Errors',
    reSync: 'Re-sync'
  },

  // Accounts & RBAC module
  accounts: {
    title: 'Users & Permissions',
    userAccounts: 'Accounts',
    roles: 'Roles',
    permissions: 'Permissions',
    dataScope: 'Data Scope',
    auditLogs: 'Audit Logs',
    tenantEnterprise: 'Enterprise',
    tenantDemo: 'Demo Sandbox',
    addUser: 'Add User',
    lockUser: 'Lock Account',
    unlockUser: 'Unlock Account',
    resetPassword: 'Reset Password'
  },

  // Settings module
  settings: {
    title: 'Settings',
    company: 'Company Profile',
    users: 'Users',
    permissions: 'Permissions',
    banking: 'Banking',
    vietqr: 'VietQR',
    integrations: 'Integrations',
    googleSheets: 'Google Sheets',
    systemConfig: 'System Configuration'
  },

  // Messages & Notifications
  messages: {
    loginSuccess: 'Login successful',
    invalidCredentials: 'Invalid username or password',
    sessionExpired: 'Session has expired. Please log in again.',
    insufficientStock: 'Insufficient FIFO stock available for issue',
    orderCreated: 'Order created successfully',
    paymentSuccess: 'Payment transaction successful',
    dataSaved: 'Data saved successfully',
    networkError: 'Cannot connect to server. Please check your network connection.'
  }
};
