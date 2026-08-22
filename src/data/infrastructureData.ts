import {
  BankAccount,
  IntegrationConnector,
  ApiClient,
  ApiLog,
  WebhookEndpoint,
  SystemAuditEntry
} from '../types';

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-mb-01',
    bankName: 'MBBank (Ngân hàng TMCP Quân Đội)',
    bankCode: 'MB',
    accountHolder: 'HỘ KINH DOANH VŨ ĐỨC ĐĂNG KHÔI',
    accountNumber: '999988886666',
    branch: 'Chi nhánh Long Biên - Hà Nội',
    accountType: 'business',
    status: 'active',
    isDefault: true,
    qrTemplate: 'compact2',
    defaultTransferMemo: 'THANHTOAN [CODE]',
    colorTheme: 'from-blue-700 to-indigo-800',
    totalTransactions: 284,
    totalReceived: 1845000000,
    createdAt: '2026-01-01 08:00',
    notes: 'Tài khoản chính nhận thanh toán chuyển khoản đơn hàng & công nợ B2B/B2C qua VietQR.'
  },
  {
    id: 'bank-vcb-02',
    bankName: 'Vietcombank (Ngân hàng TMCP Ngoại Thương)',
    bankCode: 'VCB',
    accountHolder: 'HỘ KINH DOANH VŨ ĐỨC ĐĂNG KHÔI',
    accountNumber: '10283948572',
    branch: 'Chi nhánh Hoàn Kiếm - Hà Nội',
    accountType: 'business',
    status: 'active',
    isDefault: false,
    qrTemplate: 'compact',
    defaultTransferMemo: 'BIZONE [CODE]',
    colorTheme: 'from-emerald-700 to-teal-800',
    totalTransactions: 142,
    totalReceived: 920000000,
    createdAt: '2026-01-15 09:30',
    notes: 'Tài khoản thanh toán nhà cung cấp và nhận tiền bán buôn chi nhánh lớn.'
  },
  {
    id: 'bank-tcb-03',
    bankName: 'Techcombank (Ngân hàng TMCP Kỹ Thương)',
    bankCode: 'TCB',
    accountHolder: 'HỘ KINH DOANH VŨ ĐỨC ĐĂNG KHÔI',
    accountNumber: '1903829472910',
    branch: 'Chi nhánh Tân Bình - TP.HCM',
    accountType: 'business',
    status: 'active',
    isDefault: false,
    qrTemplate: 'compact2',
    defaultTransferMemo: 'FRESH [CODE]',
    colorTheme: 'from-rose-700 to-red-800',
    totalTransactions: 98,
    totalReceived: 540000000,
    createdAt: '2026-02-01 11:00',
    notes: 'Tài khoản thu tiền chi nhánh Miền Nam và giao dịch POS trực tiếp.'
  },
  {
    id: 'bank-bidv-04',
    bankName: 'BIDV (Ngân hàng TMCP Đầu tư & Phát triển)',
    bankCode: 'BIDV',
    accountHolder: 'VŨ ĐỨC ĐĂNG KHÔI',
    accountNumber: '21510001928374',
    branch: 'Chi nhánh Cầu Giấy - Hà Nội',
    accountType: 'personal',
    status: 'inactive', // Quy tắc: Không xóa vật lý khi đã phát sinh lịch sử, chuyển sang inactive / ngừng sử dụng
    isDefault: false,
    qrTemplate: 'compact',
    defaultTransferMemo: 'CK [CODE]',
    colorTheme: 'from-cyan-800 to-blue-900',
    totalTransactions: 36,
    totalReceived: 180000000,
    createdAt: '2025-10-10 14:00',
    notes: 'Tài khoản cũ đã ngừng sử dụng cho hoạt động thu tiền từ tháng 04/2026 (lưu trữ lịch sử đối soát).'
  }
];

export const INITIAL_INTEGRATION_CONNECTORS: IntegrationConnector[] = [
  {
    id: 'conn-email-smtp',
    key: 'email_smtp',
    name: 'Dịch vụ Email Thông Báo & Đối Soát',
    category: 'email',
    provider: 'Google SMTP Relay (TLS/SSL)',
    description: 'Tự động gửi email biên nhận, nhắc hạn công nợ B2B, hóa đơn điện tử và báo cáo định kỳ.',
    icon: 'Mail',
    status: 'connected',
    environment: 'production',
    accountIdentifier: 'contact@freshdangkhoi.com',
    scopes: ['mail.send', 'mail.templates', 'mail.delivery_status'],
    allowedModules: ['debt_receivables', 'debt_payables', 'purchasing', 'reports'],
    lastSyncAt: 'Vừa xong',
    callCount24h: 342,
    successRate: 99.7,
    latencyMs: 180,
    isSecretMasked: true,
    configFields: [
      { key: 'smtp_host', label: 'SMTP Server Host', type: 'text', value: 'smtp.gmail.com', required: true },
      { key: 'smtp_port', label: 'Cổng Port (TLS/SSL)', type: 'number', value: '587', required: true },
      { key: 'sender_email', label: 'Email Gửi Đi', type: 'text', value: 'contact@freshdangkhoi.com', required: true },
      { key: 'sender_name', label: 'Tên Người Gửi', type: 'text', value: 'Fresh Đăng Khôi ERP System', required: true },
      { key: 'smtp_password', label: 'Mật Khẩu Ứng Dụng (App Password)', type: 'password', value: '••••••••••••••••', masked: true, required: true }
    ]
  },
  {
    id: 'conn-telegram-bot',
    key: 'telegram_bot',
    name: 'Telegram Bot Cảnh Báo Realtime',
    category: 'telegram',
    provider: 'Telegram Bot API v7.4',
    description: 'Bắn tin tức thì về đơn hàng mới, hàng chạm ngưỡng tồn kho tối thiểu, nợ quá hạn và đăng nhập bất thường.',
    icon: 'Send',
    status: 'connected',
    environment: 'production',
    accountIdentifier: '@FreshDangKhoi_ErpBot',
    scopes: ['bot.sendMessage', 'bot.sendDocument', 'bot.webhook'],
    allowedModules: ['dashboard', 'warehouse_ops', 'fifo_lots', 'debt_receivables', 'user_management'],
    lastSyncAt: '1 phút trước',
    callCount24h: 528,
    successRate: 100.0,
    latencyMs: 95,
    isSecretMasked: true,
    configFields: [
      { key: 'bot_username', label: 'Tên Bot Telegram', type: 'text', value: '@BizOne_ErpBot', required: true },
      { key: 'bot_token', label: 'Bot Token (HTTP API)', type: 'password', value: '••••••••••••••••••••••••', masked: true, required: true },
      { key: 'admin_chat_id', label: 'Nhóm Chat Ban Quản Trị (Chat ID)', type: 'text', value: '-1001234567890', required: true },
      { key: 'warehouse_chat_id', label: 'Nhóm Chat Thủ Kho & Hậu Cần', type: 'text', value: '-1001234567891', required: true },
      { key: 'accounting_chat_id', label: 'Nhóm Chat Kế Toán & Thu Nợ', type: 'text', value: '-1001234567892', required: true }
    ]
  },
  {
    id: 'conn-zalo-oa',
    key: 'zalo_oa',
    name: 'Zalo Official Account (OA)',
    category: 'zalo_oa',
    provider: 'Zalo Open Platform v3.0',
    description: 'Gửi tin ZNS xác nhận đơn hàng, gửi mã VietQR thanh toán và chăm sóc khách hàng tự động.',
    icon: 'MessageSquare',
    status: 'connected',
    environment: 'production',
    accountIdentifier: 'OA ID: 39482910482918',
    scopes: ['oa.message', 'oa.customer_profile', 'oa.transaction_zns'],
    allowedModules: ['customers', 'debt_receivables', 'orders'],
    lastSyncAt: '3 phút trước',
    callCount24h: 186,
    successRate: 99.2,
    latencyMs: 140,
    isSecretMasked: true,
    configFields: [
      { key: 'oa_name', label: 'Tên Zalo OA Doanh Nghiệp', type: 'text', value: 'Fresh Đăng Khôi Official', required: true },
      { key: 'oa_id', label: 'OA ID', type: 'text', value: '39482910482918', required: true },
      { key: 'app_id', label: 'Zalo App ID', type: 'text', value: '8839201948', required: true },
      { key: 'secret_key', label: 'App Secret Key', type: 'password', value: '••••••••••••••••••••••••', masked: true, required: true },
      { key: 'access_token_expiry', label: 'Thời hạn Access Token', type: 'text', value: 'Còn hiệu lực 28 ngày (Tự động refresh token)', required: false }
    ]
  },
  {
    id: 'conn-vietqr-napas',
    key: 'vietqr_napas',
    name: 'Cổng VietQR Napas 247 Dynamic',
    category: 'vietqr',
    provider: 'VietQR.io & Napas National Switch',
    description: 'Tạo mã QR chuẩn quốc gia tự động điền số tiền, số tài khoản và cú pháp thanh toán theo từng đơn/hóa đơn.',
    icon: 'QrCode',
    status: 'connected',
    environment: 'production',
    accountIdentifier: 'MBBank - 999988886666',
    scopes: ['vietqr.generate', 'vietqr.verify_bin', 'vietqr.banks_list'],
    allowedModules: ['orders', 'debt_receivables', 'pos', 'banking_vietqr'],
    lastSyncAt: 'Vừa xong',
    callCount24h: 890,
    successRate: 100.0,
    latencyMs: 45,
    isSecretMasked: true,
    configFields: [
      { key: 'gateway_endpoint', label: 'API Endpoint VietQR', type: 'text', value: 'https://img.vietqr.io/image', required: true },
      { key: 'client_id', label: 'VietQR Client ID', type: 'text', value: 'vq_fresh_dangkhoi_prod', required: true },
      { key: 'api_key', label: 'API Key VietQR', type: 'password', value: '••••••••••••••••••••••••', masked: true, required: true },
      { key: 'auto_memo_prefix', label: 'Tiền tố nội dung mặc định', type: 'text', value: 'THANHTOAN', required: true }
    ]
  },
  {
    id: 'conn-mb-banking',
    key: 'mb_banking',
    name: 'MBBank Open Banking & Webhook Đối Soát',
    category: 'banking',
    provider: 'MB Corporate Open API (OAuth 2.0 Mutual TLS)',
    description: 'Tự động nhận biến động số dư realtime, tự khớp thanh toán đơn hàng & gạch nợ công nợ tự động.',
    icon: 'Building2',
    status: 'connected',
    environment: 'production',
    accountIdentifier: 'HĐKD VŨ ĐỨC ĐĂNG KHÔI (STK: 999988886666)',
    scopes: ['banking.account_balance', 'banking.transaction_history', 'banking.webhook_credit'],
    allowedModules: ['banking_vietqr', 'cashflow', 'debt_receivables', 'orders'],
    lastSyncAt: '2 phút trước',
    callCount24h: 620,
    successRate: 99.8,
    latencyMs: 210,
    isSecretMasked: true,
    configFields: [
      { key: 'mb_client_id', label: 'MB Corporate Client ID', type: 'text', value: 'MB_BIZ_FRESH_DANGKHOI', required: true },
      { key: 'mb_account_no', label: 'Số tài khoản liên kết', type: 'text', value: '999988886666', required: true },
      { key: 'webhook_url', label: 'Webhook Endpoint nhận biến động', type: 'text', value: 'https://api.freshdangkhoi.com/api/v1/webhooks/banking/mb-callback', required: true },
      { key: 'webhook_secret', label: 'Webhook HMAC Signature Key', type: 'password', value: '••••••••••••••••••••••••••••••••', masked: true, required: true }
    ]
  },
  {
    id: 'conn-gemini-ai',
    key: 'gemini_ai',
    name: 'Google Gemini 2.5 Pro Server-Side AI',
    category: 'ai',
    provider: 'Google Cloud Vertex AI / AI Studio Gateway',
    description: 'Chẩn đoán dữ liệu chuỗi cung ứng, cảnh báo nợ xấu, đề xuất đơn mua PO tối ưu và phân tích tồn kho.',
    icon: 'Bot',
    status: 'connected',
    environment: 'production',
    accountIdentifier: 'GCP Project: bizone-erp-freshdangkhoi',
    scopes: ['vertexai.models.generateContent', 'vertexai.embeddings'],
    allowedModules: ['dashboard', 'warehouse_ops', 'crm', 'reports', 'settings'],
    lastSyncAt: 'Vừa xong',
    callCount24h: 115,
    successRate: 100.0,
    latencyMs: 380,
    isSecretMasked: true,
    configFields: [
      { key: 'model_name', label: 'Tên Mô Hình AI', type: 'text', value: 'gemini-2.5-flash / gemini-2.5-pro', required: true },
      { key: 'api_key_status', label: 'Backend Secret Key', type: 'password', value: '••••••••••••••••••••••••••••••••••••', masked: true, required: true },
      { key: 'temperature', label: 'Nhiệt độ sáng tạo (Temperature)', type: 'text', value: '0.2 (Độ chính xác cao)', required: false }
    ]
  },
  {
    id: 'conn-gcp-storage',
    key: 'gcp_storage',
    name: 'Cloud Object Storage (Lưu trữ chứng từ)',
    category: 'storage',
    provider: 'Google Cloud Storage (Region: asia-southeast1)',
    description: 'Lưu trữ hóa đơn điện tử XML/PDF, hình ảnh sản phẩm chất lượng cao, biên bản kiểm kê và sao kê tài khoản.',
    icon: 'Database',
    status: 'connected',
    environment: 'production',
    accountIdentifier: 'gs://freshdangkhoi-erp-attachments',
    scopes: ['storage.objects.create', 'storage.objects.get', 'storage.objects.delete'],
    allowedModules: ['products', 'purchasing', 'warehouse_ops', 'e_invoices'],
    lastSyncAt: '5 phút trước',
    callCount24h: 470,
    successRate: 100.0,
    latencyMs: 75,
    isSecretMasked: true,
    configFields: [
      { key: 'bucket_name', label: 'Tên GCS Bucket', type: 'text', value: 'freshdangkhoi-erp-attachments', required: true },
      { key: 'storage_class', label: 'Loại lưu trữ (Storage Class)', type: 'text', value: 'Standard (Multi-zone)', required: true },
      { key: 'cdn_domain', label: 'CDN Custom Domain', type: 'text', value: 'https://cdn.freshdangkhoi.com', required: false }
    ]
  }
];

export const INITIAL_API_CLIENTS: ApiClient[] = [
  {
    id: 'client-app-mobile',
    name: 'BizOne Mobile App (iOS / Android Flutter)',
    clientId: 'client_mobile_app_prod_01',
    clientSecretMasked: 'sec_live_9a8b••••••••••••••••f1e2',
    scopes: ['read:inventory', 'write:issues', 'read:debt', 'write:payments', 'read:products', 'write:stocktakes'],
    status: 'active',
    rateLimitPerMinute: 300,
    totalCalls: 18450,
    createdAt: '2026-01-10',
    lastUsedAt: 'Vừa xong',
    expiresAt: '2027-01-10'
  },
  {
    id: 'client-storefront-web',
    name: 'Fresh Đăng Khôi E-Commerce Web B2B/B2C',
    clientId: 'client_web_storefront_prod_02',
    clientSecretMasked: 'sec_live_4d5e••••••••••••••••7a8b',
    scopes: ['read:products', 'read:inventory_public', 'write:orders', 'read:customer_debt'],
    status: 'active',
    rateLimitPerMinute: 600,
    totalCalls: 45200,
    createdAt: '2026-02-01',
    lastUsedAt: '2 phút trước',
    expiresAt: '2027-02-01'
  },
  {
    id: 'client-pos-longbien',
    name: 'Máy POS Bán Hàng Chi Nhánh Long Biên (BR01)',
    clientId: 'client_pos_longbien_br01',
    clientSecretMasked: 'sec_live_1122••••••••••••••••3344',
    scopes: ['read:products', 'read:inventory', 'write:orders', 'write:vietqr'],
    status: 'active',
    rateLimitPerMinute: 200,
    totalCalls: 9840,
    createdAt: '2026-01-15',
    lastUsedAt: '8 phút trước',
    expiresAt: '2027-01-15'
  }
];

export const INITIAL_API_LOGS: ApiLog[] = [
  {
    id: 'log-101',
    timestamp: '2026-08-16 08:42:15',
    method: 'POST',
    endpoint: '/api/v1/orders/create',
    clientName: 'BizOne Mobile App (iOS / Android)',
    statusCode: 201,
    responseTimeMs: 42,
    ipAddress: '14.232.199.88',
    status: 'success',
    idempotencyKey: 'idemp-ord-20260816-001'
  },
  {
    id: 'log-102',
    timestamp: '2026-08-16 08:41:50',
    method: 'GET',
    endpoint: '/api/v1/inventory/realtime-balance?warehouseId=WH01',
    clientName: 'Fresh Đăng Khôi E-Commerce Web',
    statusCode: 200,
    responseTimeMs: 18,
    ipAddress: '113.190.234.12',
    status: 'success'
  },
  {
    id: 'log-103',
    timestamp: '2026-08-16 08:40:12',
    method: 'POST',
    endpoint: '/api/v1/payments/vietqr/generate',
    clientName: 'Máy POS Bán Hàng Chi Nhánh Long Biên',
    statusCode: 200,
    responseTimeMs: 35,
    ipAddress: '118.70.180.45',
    status: 'success'
  },
  {
    id: 'log-104',
    timestamp: '2026-08-16 08:38:00',
    method: 'POST',
    endpoint: '/api/v1/webhooks/banking/mb-callback',
    clientName: 'MBBank Open Banking Gateway',
    statusCode: 200,
    responseTimeMs: 65,
    ipAddress: '203.162.0.15',
    status: 'success'
  },
  {
    id: 'log-105',
    timestamp: '2026-08-16 08:30:19',
    method: 'POST',
    endpoint: '/api/v1/auth/login',
    clientName: 'BizOne Mobile App (iOS / Android)',
    statusCode: 200,
    responseTimeMs: 88,
    ipAddress: '14.232.199.88',
    status: 'success'
  }
];

export const INITIAL_WEBHOOKS: WebhookEndpoint[] = [
  {
    id: 'wh-01',
    name: 'Webhook Bắn Đơn Hàng Về Kênh Vận Chuyển',
    targetUrl: 'https://shipping.freshdangkhoi.com/api/webhooks/order-created',
    events: ['order.created', 'order.paid', 'issue.dispatched'],
    secretMasked: 'whsec_••••••••••••••••9900',
    status: 'active',
    retryPolicy: 'exponential_backoff',
    maxRetries: 3,
    lastTriggeredAt: '10 phút trước',
    successRate: 100.0
  },
  {
    id: 'wh-02',
    name: 'Webhook Báo Động Nợ Quá Hạn Đến Telegram Bot',
    targetUrl: 'https://api.telegram.org/bot<CONFIGURED_BOT_TOKEN>/webhook',
    events: ['debt.overdue_warning', 'inventory.low_stock_urgent', 'auth.failed_attempt_locked'],
    secretMasked: 'whsec_••••••••••••••••1122',
    status: 'active',
    retryPolicy: 'immediate',
    maxRetries: 3,
    lastTriggeredAt: '15 phút trước',
    successRate: 99.8
  }
];

export const INITIAL_SYSTEM_AUDIT_LOGS: SystemAuditEntry[] = [
  {
    id: 'audit-001',
    timestamp: '2026-08-16 08:35:10',
    userId: 'usr-admin-ductang',
    userName: 'Đức Tăng',
    userRole: 'Super Admin',
    ipAddress: '113.190.234.12',
    device: 'MacBook Pro 16" M3 Max (macOS)',
    action: 'UPDATE',
    module: 'banking',
    recordId: 'bank-mb-01',
    recordCode: 'MB-999988886666',
    description: 'Cập nhật tài khoản thụ hưởng mặc định VietQR sang MBBank Long Biên',
    isCritical: true,
    beforeData: 'isDefault: false',
    afterData: 'isDefault: true, qrTemplate: "compact2"'
  },
  {
    id: 'audit-002',
    timestamp: '2026-08-16 08:15:00',
    userId: 'usr-ketoan-01',
    userName: 'Phạm Mai Phương',
    userRole: 'Kế toán trưởng',
    ipAddress: '113.190.234.20',
    device: 'Dell Latitude 7420 (Windows 11)',
    action: 'APPROVE',
    module: 'debt',
    recordId: 'debt-inv-001',
    recordCode: 'INV-2026-088',
    description: 'Xác nhận gạch nợ 35.000.000 đ cho Khách hàng Công ty XD Hòa Bình qua VietQR MBBank',
    isCritical: false,
    beforeData: 'debt: 35.000.000 đ, status: unpaid',
    afterData: 'debt: 0 đ, status: paid, voucherCode: PT-2026-092'
  },
  {
    id: 'audit-003',
    timestamp: '2026-08-16 07:50:22',
    userId: 'usr-kho-01',
    userName: 'Nguyễn Văn An',
    userRole: 'Trưởng Kho Tổng Hà Nội',
    ipAddress: '118.70.180.45',
    device: 'Zebra TC26 Handheld Terminal (Android)',
    action: 'APPROVE',
    module: 'inventory',
    recordId: 'issue-2026-045',
    recordCode: 'XK-2026-045',
    description: 'Phê duyệt xuất kho 1.200kg Thép cuộn mạ kẽm theo nguyên tắc FIFO lô LOT-HP-20260715',
    isCritical: false
  },
  {
    id: 'audit-004',
    timestamp: '2026-08-15 17:30:15',
    userId: 'usr-admin-ductang',
    userName: 'Đức Tăng',
    userRole: 'Super Admin',
    ipAddress: '14.232.199.88',
    device: 'iPhone 15 Pro Max (iOS 18)',
    action: 'PERMISSION_CHANGE',
    module: 'users',
    recordId: 'usr-sales-01',
    recordCode: 'NV-0006',
    description: 'Bổ sung quyền tạo phiếu xuất kho bán hàng cho Sale Lê Hoàng Nam',
    isCritical: true,
    beforeData: 'issues: ["view"]',
    afterData: 'issues: ["view", "create"]'
  }
];
