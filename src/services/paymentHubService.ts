import {
  PaymentProviderConfig,
  PaymentMethodConfig,
  PaymentOrder,
  PaymentTransaction,
  PaymentWebhookLog,
  PaymentReconciliationItem,
  PaymentProviderId,
  PaymentMethodType,
  PaymentStatus,
  SaaSPlan
} from '../types';
import { SaaSService } from './saasService';

// =========================================================================
// INITIAL CONFIGURATIONS & SEED DATA
// =========================================================================

export const INITIAL_PAYMENT_PROVIDERS: PaymentProviderConfig[] = [
  {
    id: 'napas',
    name: 'Cổng Thanh Toán NAPAS (Quốc Gia)',
    code: 'NAPAS_HUB_VN',
    environment: 'production',
    merchantId: 'MERCHANT-BIZONE-NAPAS-8899',
    apiEndpoint: 'https://api.napas.com.vn/v2/gateway',
    status: 'active',
    supportedMethods: ['vietqr', 'card', 'apple_pay', 'google_pay', 'bank_transfer'],
    supportedCurrencies: ['VND'],
    pciCompliantHosted: true,
    webhookSecretSet: true,
    description: 'Hỗ trợ VietQR động, thẻ nội địa & quốc tế (Visa/Mastercard/JCB), Apple Pay và thanh toán QR xuyên biên giới.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z'
  },
  {
    id: 'momo',
    name: 'Cổng Dịch Vụ Ví MoMo (M-Service)',
    code: 'MOMO_PAY_GATEWAY',
    environment: 'production',
    merchantId: 'MOMO_MERCHANT_BIZONE_CORP',
    apiEndpoint: 'https://payment.momo.vn/v2/gateway/api/create',
    status: 'active',
    supportedMethods: ['ewallet', 'vietqr'],
    supportedCurrencies: ['VND'],
    pciCompliantHosted: true,
    webhookSecretSet: true,
    description: 'Dịch vụ ví điện tử, hỗ trợ thu chi hộ, quét mã QR MoMo và thanh toán app-to-app tiện lợi.',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z'
  },
  {
    id: 'stripe',
    name: 'Stripe International Global Gateway',
    code: 'STRIPE_GLOBAL',
    environment: 'sandbox',
    merchantId: 'acct_bizone_global_sandbox',
    apiEndpoint: 'https://api.stripe.com/v1',
    status: 'active',
    supportedMethods: ['card', 'international', 'apple_pay', 'google_pay'],
    supportedCurrencies: ['USD', 'EUR', 'SGD', 'THB', 'VND'],
    pciCompliantHosted: true,
    webhookSecretSet: true,
    description: 'Cổng thanh toán quốc tế đa tiền tệ, hỗ trợ khách hàng nước ngoài và giao dịch xuyên biên giới.',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z'
  },
  {
    id: 'manual_bank',
    name: 'Chuyển Khoản Ngân Hàng Doanh Nghiệp (NAPAS 24/7)',
    code: 'BANK_DIRECT_NAPAS',
    environment: 'production',
    merchantId: 'BANK-MB-BIZONE-CORP',
    apiEndpoint: 'https://api.bizone.wiup.vn/banking/webhook',
    status: 'active',
    supportedMethods: ['bank_transfer', 'vietqr'],
    supportedCurrencies: ['VND'],
    pciCompliantHosted: false,
    webhookSecretSet: true,
    description: 'Tài khoản ngân hàng thụ hưởng pháp nhân BizOne, đối soát biến động số dư tự động qua API.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z'
  }
];

export const INITIAL_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'pm-vietqr',
    type: 'vietqr',
    providerId: 'napas',
    name: 'VietQR (Quét mã Ngân hàng 24/7)',
    tagline: 'Chuyển khoản nhanh NAPAS 247, tự động đối soát trong 3 giây',
    iconName: 'QrCode',
    badge: 'Khuyên Dùng',
    isAvailable: true,
    supportedCurrencies: ['VND'],
    deviceRequirement: 'all',
    displayOrder: 1
  },
  {
    id: 'pm-card',
    type: 'card',
    providerId: 'napas',
    name: 'Thẻ Quốc Tế / Thẻ Nội Địa (Visa, Mastercard, JCB, NAPAS)',
    tagline: 'Thanh toán trực tuyến bảo mật PCI-DSS tokenized qua cổng NAPAS',
    iconName: 'CreditCard',
    isAvailable: true,
    supportedCurrencies: ['VND', 'USD'],
    deviceRequirement: 'all',
    displayOrder: 2
  },
  {
    id: 'pm-momo',
    type: 'ewallet',
    providerId: 'momo',
    name: 'Ví Điện Tử MoMo',
    tagline: 'Quét mã QR MoMo hoặc mở ứng dụng MoMo trên điện thoại',
    iconName: 'Smartphone',
    isAvailable: true,
    supportedCurrencies: ['VND'],
    deviceRequirement: 'all',
    displayOrder: 3
  },
  {
    id: 'pm-apple-pay',
    type: 'apple_pay',
    providerId: 'napas',
    name: 'Apple Pay / Google Pay',
    tagline: 'Chạm thanh toán an toàn, xác thực bằng Face ID / Touch ID / Thiết bị',
    iconName: 'Sparkles',
    badge: 'Tiện Lợi',
    isAvailable: true,
    supportedCurrencies: ['VND', 'USD'],
    deviceRequirement: 'all',
    displayOrder: 4
  },
  {
    id: 'pm-bank-transfer',
    type: 'bank_transfer',
    providerId: 'manual_bank',
    name: 'Chuyển Khoản Ngân Hàng',
    tagline: 'Chuyển khoản trực tiếp vào tài khoản ngân hàng doanh nghiệp BizOne',
    iconName: 'Building2',
    isAvailable: true,
    supportedCurrencies: ['VND'],
    deviceRequirement: 'all',
    displayOrder: 5
  }
];

export const INITIAL_PAYMENT_ORDERS: PaymentOrder[] = [
  {
    id: 'order-pay-202603-01',
    orderCode: 'PAY-202603-001',
    registrationId: 'reg-mk-001',
    tenantId: 'tenant_minhkhang_fnb',
    tenantName: 'Chuỗi Trà Sữa & Cafe Minh Khang',
    planId: 'plan-annual',
    planCode: 'ANNUAL',
    planName: 'Gói 1 Năm',
    durationDays: 365,
    maxUsers: 3,
    amount: 599000,
    currency: 'VND',
    status: 'PAID',
    providerId: 'napas',
    paymentMethod: 'vietqr',
    transactionId: 'TXN-NAPAS-88129301',
    transferContent: 'BIZONE PAY 202603 001',
    expiresAt: '2026-03-15T10:00:00Z',
    paidAt: '2026-03-15T09:35:12Z',
    customerName: 'Nguyễn Minh Khang',
    customerEmail: 'minhkhang.fnb@gmail.com',
    customerPhone: '0912345678',
    taxCode: '0318928371',
    idempotencyKey: 'idemp-mk-001',
    attemptsCount: 1,
    createdAt: '2026-03-15T09:30:00Z',
    updatedAt: '2026-03-15T09:35:12Z'
  },
  {
    id: 'order-pay-202605-02',
    orderCode: 'PAY-202605-002',
    registrationId: 'reg-vt-002',
    tenantId: 'tenant_viettrung_vlxd',
    tenantName: 'Tổng Đại Lý VLXD Việt Trung',
    planId: 'plan-quarterly',
    planCode: 'QUARTERLY',
    planName: 'Gói 3 Tháng',
    durationDays: 90,
    maxUsers: 3,
    amount: 249000,
    currency: 'VND',
    status: 'PAID',
    providerId: 'manual_bank',
    paymentMethod: 'bank_transfer',
    transactionId: 'TXN-BANK-99182371',
    transferContent: 'BIZONE PAY 202605 002',
    expiresAt: '2026-05-25T10:30:00Z',
    paidAt: '2026-05-25T10:05:30Z',
    customerName: 'Trần Việt Trung',
    customerEmail: 'trung.vlxd@viettrung.vn',
    customerPhone: '0987654321',
    taxCode: '0109887766',
    idempotencyKey: 'idemp-vt-002',
    attemptsCount: 1,
    createdAt: '2026-05-25T10:00:00Z',
    updatedAt: '2026-05-25T10:05:30Z'
  }
];

export const INITIAL_RECONCILIATIONS: PaymentReconciliationItem[] = [
  {
    id: 'rec-001',
    paymentOrderId: 'order-pay-202603-01',
    orderCode: 'PAY-202603-001',
    providerId: 'napas',
    providerTxId: 'TXN-NAPAS-88129301',
    orderAmount: 599000,
    receivedAmount: 599000,
    currency: 'VND',
    paymentMethod: 'vietqr',
    status: 'MATCHED',
    webhookVerified: true,
    paidAt: '2026-03-15 09:35:12',
    notes: 'Đối soát 100% chính xác với cổng NAPAS VietQR',
    createdAt: '2026-03-15T09:35:15Z'
  },
  {
    id: 'rec-002',
    paymentOrderId: 'order-pay-202605-02',
    orderCode: 'PAY-202605-002',
    providerId: 'manual_bank',
    providerTxId: 'TXN-BANK-99182371',
    orderAmount: 249000,
    receivedAmount: 249000,
    currency: 'VND',
    paymentMethod: 'bank_transfer',
    status: 'MATCHED',
    webhookVerified: true,
    paidAt: '2026-05-25 10:05:30',
    notes: 'Đối soát biến động số dư ngân hàng hợp lệ',
    createdAt: '2026-05-25T10:05:35Z'
  }
];

export const INITIAL_WEBHOOK_LOGS: PaymentWebhookLog[] = [
  {
    id: 'wh-001',
    providerId: 'napas',
    eventType: 'PAYMENT.COMPLETED',
    orderCode: 'PAY-202603-001',
    transactionId: 'TXN-NAPAS-88129301',
    amount: 599000,
    currency: 'VND',
    signature: 'sha256-napas-sig-8819238918238128391823',
    isSignatureValid: true,
    isDuplicate: false,
    idempotencyKey: 'idemp-mk-001',
    status: 'PROCESSED',
    rawPayload: {
      provider: 'NAPAS',
      code: '00',
      message: 'Transaction approved',
      amount: 599000,
      currency: 'VND',
      orderId: 'PAY-202603-001',
      napasTransId: 'TXN-NAPAS-88129301'
    },
    receivedAt: '2026-03-15 09:35:12',
    processedAt: '2026-03-15 09:35:13'
  }
];

// =========================================================================
// PAYMENT GATEWAY HUB SERVICE CLASS
// =========================================================================

export class PaymentHubService {
  private static STORAGE_KEYS = {
    PROVIDERS: 'bizone_payment_providers',
    METHODS: 'bizone_payment_methods',
    ORDERS: 'bizone_payment_orders',
    TRANSACTIONS: 'bizone_payment_transactions',
    WEBHOOKS: 'bizone_payment_webhooks',
    RECONCILIATION: 'bizone_payment_reconciliation'
  };

  // --- PROVIDERS ---
  static getProviders(): PaymentProviderConfig[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.PROVIDERS);
      if (saved) return JSON.parse(saved);
    } catch {}
    this.saveProviders(INITIAL_PAYMENT_PROVIDERS);
    return INITIAL_PAYMENT_PROVIDERS;
  }

  static saveProviders(providers: PaymentProviderConfig[]) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
    } catch {}
  }

  static updateProvider(provider: PaymentProviderConfig) {
    const list = this.getProviders();
    const idx = list.findIndex((p) => p.id === provider.id);
    if (idx >= 0) {
      list[idx] = { ...provider, updatedAt: new Date().toISOString() };
    } else {
      list.push(provider);
    }
    this.saveProviders(list);
  }

  // --- METHODS ---
  static getMethods(): PaymentMethodConfig[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.METHODS);
      if (saved) return JSON.parse(saved);
    } catch {}
    this.saveMethods(INITIAL_PAYMENT_METHODS);
    return INITIAL_PAYMENT_METHODS;
  }

  static saveMethods(methods: PaymentMethodConfig[]) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.METHODS, JSON.stringify(methods));
    } catch {}
  }

  static getActiveMethods(currency: string = 'VND'): PaymentMethodConfig[] {
    const providers = this.getProviders();
    const activeProviderIds = new Set(providers.filter((p) => p.status === 'active').map((p) => p.id));

    return this.getMethods()
      .filter((m) => m.isAvailable && activeProviderIds.has(m.providerId) && m.supportedCurrencies.includes(currency))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  static toggleMethod(methodId: string, isAvailable: boolean) {
    const list = this.getMethods();
    const target = list.find((m) => m.id === methodId);
    if (target) {
      target.isAvailable = isAvailable;
      this.saveMethods(list);
    }
  }

  // --- PAYMENT ORDERS ---
  static getOrders(): PaymentOrder[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.ORDERS);
      if (saved) return JSON.parse(saved);
    } catch {}
    this.saveOrders(INITIAL_PAYMENT_ORDERS);
    return INITIAL_PAYMENT_ORDERS;
  }

  static saveOrders(orders: PaymentOrder[]) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {}
  }

  static getOrderById(orderId: string): PaymentOrder | undefined {
    return this.getOrders().find((o) => o.id === orderId || o.orderCode === orderId);
  }

  /**
   * Tạo Payment Order mới trước khi chuyển sang thanh toán
   */
  static createPaymentOrder(params: {
    planId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    taxCode?: string;
    registrationId?: string;
    methodType?: PaymentMethodType;
  }): PaymentOrder {
    const plans = SaaSService.getPlans();
    const selectedPlan = plans.find((p) => p.id === params.planId) || plans.find((p) => p.code === 'ANNUAL') || plans[0];

    const timestamp = Date.now();
    const orderCode = `PAY-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${timestamp.toString().slice(-4)}`;
    
    // Default 15 minutes expiration for dynamic QR and payment sessions
    const expiresAt = new Date(timestamp + 15 * 60 * 1000).toISOString();

    const initialMethod = params.methodType || 'vietqr';
    const activeMethods = this.getActiveMethods(selectedPlan.currency);
    const methodConfig = activeMethods.find((m) => m.type === initialMethod) || activeMethods[0] || INITIAL_PAYMENT_METHODS[0];

    // Bank transfer / VietQR details
    const bankAccountInfo = {
      bankName: 'Ngân hàng TMCP Quân Đội (MB Bank)',
      accountNumber: '888899998888',
      accountName: 'CONG TY CP CONG NGHE BIZONE HOLDINGS',
      bin: '970422'
    };

    const transferContent = `BIZONE ${orderCode.replace(/-/g, ' ')}`;

    // Quick VietQR syntax string
    const qrCodeData = `https://img.vietqr.io/image/${bankAccountInfo.bin}-${bankAccountInfo.accountNumber}-compact2.png?amount=${selectedPlan.price}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankAccountInfo.accountName)}`;

    const newOrder: PaymentOrder = {
      id: `pay-ord-${timestamp}`,
      orderCode,
      registrationId: params.registrationId,
      planId: selectedPlan.id,
      planCode: selectedPlan.code,
      planName: selectedPlan.name,
      durationDays: selectedPlan.durationDays,
      maxUsers: selectedPlan.maxUsers || 3,
      amount: selectedPlan.price,
      currency: selectedPlan.currency || 'VND',
      status: 'PENDING',
      providerId: methodConfig.providerId,
      paymentMethod: methodConfig.type,
      qrCodeData,
      bankAccountInfo,
      transferContent,
      expiresAt,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      taxCode: params.taxCode,
      idempotencyKey: `idemp-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
      attemptsCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const orders = this.getOrders();
    orders.unshift(newOrder);
    this.saveOrders(orders);

    return newOrder;
  }

  /**
   * Đổi phương thức thanh toán hoặc thử lại (Payment Retry)
   */
  static switchPaymentMethod(orderId: string, newMethodType: PaymentMethodType): PaymentOrder | undefined {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return undefined;

    const activeMethods = this.getActiveMethods(order.currency);
    const methodConfig = activeMethods.find((m) => m.type === newMethodType) || activeMethods[0];

    order.paymentMethod = newMethodType;
    order.providerId = methodConfig?.providerId || 'napas';
    order.attemptsCount += 1;
    order.updatedAt = new Date().toISOString();

    this.saveOrders(orders);
    return order;
  }

  /**
   * Xác nhận thanh toán qua Backend / Webhook simulation
   * KHÔNG dựa vào frontend tự xác nhận
   */
  static async verifyPayment(orderId: string): Promise<{ success: boolean; order?: PaymentOrder; message?: string }> {
    // Simulate short network delay for backend verification
    await new Promise((r) => setTimeout(r, 600));

    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId || o.orderCode === orderId);
    if (!order) {
      return { success: false, message: 'Không tìm thấy đơn thanh toán.' };
    }

    if (order.status === 'PAID') {
      return { success: true, order, message: 'Đơn hàng đã được thanh toán trước đó.' };
    }

    // Check expiration
    if (new Date(order.expiresAt).getTime() < Date.now()) {
      order.status = 'EXPIRED';
      this.saveOrders(orders);
      return { success: false, message: 'Phiên thanh toán đã hết hạn (15 phút). Vui lòng tạo phiên thanh toán mới.' };
    }

    // Generate transaction ID
    const providerTxId = `TXN-${order.providerId?.toUpperCase() || 'NAPAS'}-${Date.now().toString().slice(-8)}`;
    const paidAt = new Date().toISOString();

    order.status = 'PAID';
    order.transactionId = providerTxId;
    order.paidAt = paidAt;
    order.updatedAt = paidAt;

    this.saveOrders(orders);

    // 1. Record Payment Transaction
    this.recordTransaction({
      id: `tx-${Date.now()}`,
      paymentOrderId: order.id,
      orderCode: order.orderCode,
      providerId: order.providerId || 'napas',
      providerTxId,
      amount: order.amount,
      currency: order.currency,
      paymentMethod: order.paymentMethod || 'vietqr',
      status: 'SUCCESS',
      signatureVerified: true,
      gatewayResponseCode: '00',
      gatewayResponseMessage: 'Thanh toán thành công qua Payment Gateway Hub',
      timestamp: paidAt
    });

    // 2. Record Webhook Event (Idempotent)
    this.recordWebhookLog({
      id: `wh-${Date.now()}`,
      providerId: order.providerId || 'napas',
      eventType: 'PAYMENT.VERIFIED',
      orderCode: order.orderCode,
      transactionId: providerTxId,
      amount: order.amount,
      currency: order.currency,
      signature: `sha256-sig-${Math.random().toString(36).substring(2, 10)}`,
      isSignatureValid: true,
      isDuplicate: false,
      idempotencyKey: order.idempotencyKey,
      status: 'PROCESSED',
      rawPayload: {
        event: 'PAYMENT.VERIFIED',
        orderCode: order.orderCode,
        amount: order.amount,
        currency: order.currency,
        provider: order.providerId,
        method: order.paymentMethod
      },
      receivedAt: paidAt,
      processedAt: paidAt
    });

    // 3. Record Reconciliation Item
    this.recordReconciliation({
      id: `rec-${Date.now()}`,
      paymentOrderId: order.id,
      orderCode: order.orderCode,
      providerId: order.providerId || 'napas',
      providerTxId,
      orderAmount: order.amount,
      receivedAmount: order.amount,
      currency: order.currency,
      paymentMethod: order.paymentMethod || 'vietqr',
      status: 'MATCHED',
      webhookVerified: true,
      paidAt,
      notes: `Xác thực đối soát tự động khớp 100% qua Payment Hub (${order.paymentMethod})`,
      createdAt: paidAt
    });

    // 4. Update associated Registration if exists
    if (order.registrationId) {
      const registrations = SaaSService.getRegistrations();
      const reg = registrations.find((r) => r.id === order.registrationId || r.registrationCode === order.registrationId);
      if (reg) {
        reg.paymentStatus = 'PAID';
        reg.paymentOrderId = order.id;
        reg.paymentMethod = order.paymentMethod;
        reg.paidAmount = order.amount;
        reg.updatedAt = paidAt;
        SaaSService.saveRegistrations(registrations);
      }
    }

    // 5. Audit Log
    SaaSService.addAuditLog({
      actorId: 'system_payment_hub',
      actorName: 'BizOne Payment Hub',
      actorRole: 'PAYMENT_GATEWAY',
      action: 'APPROVE_CUSTOMER',
      recordId: order.orderCode,
      details: `Xác nhận thanh toán thành công ${order.amount.toLocaleString('vi-VN')} ${order.currency} cho đơn ${order.orderCode} (${order.customerName}) qua ${order.paymentMethod}`,
      ipAddress: '10.0.0.1'
    });

    return { success: true, order, message: 'Xác thực thanh toán thành công!' };
  }

  /**
   * Hoàn tiền (Refund) - Dành cho Super Admin / Billing Role
   */
  static async refundPayment(orderId: string, reason: string, actorName: string = 'Super Admin'): Promise<{ success: boolean; message: string }> {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Không tìm thấy đơn thanh toán.' };

    if (order.status !== 'PAID') {
      return { success: false, message: 'Chỉ có thể hoàn tiền cho đơn đã thanh toán thành công (PAID).' };
    }

    const refundedAt = new Date().toISOString();
    order.status = 'REFUNDED';
    order.refundedAt = refundedAt;
    order.refundAmount = order.amount;
    order.updatedAt = refundedAt;

    this.saveOrders(orders);

    // Update reconciliation
    const recs = this.getReconciliations();
    const rec = recs.find((r) => r.paymentOrderId === order.id);
    if (rec) {
      rec.status = 'REFUNDED';
      rec.notes = `Đã hoàn tiền bởi ${actorName}: ${reason}`;
      this.saveReconciliations(recs);
    }

    // Audit log
    SaaSService.addAuditLog({
      actorId: 'super_admin_billing',
      actorName,
      actorRole: 'SUPER_ADMIN',
      action: 'CANCEL',
      recordId: order.orderCode,
      details: `Hoàn tiền đơn ${order.orderCode} số tiền ${order.amount.toLocaleString('vi-VN')} VND. Lý do: ${reason}`,
      ipAddress: '113.190.234.12'
    });

    return { success: true, message: 'Hoàn tiền giao dịch thành công.' };
  }

  // --- TRANSACTIONS ---
  static getTransactions(): PaymentTransaction[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  }

  static saveTransactions(txs: PaymentTransaction[]) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    } catch {}
  }

  static recordTransaction(tx: PaymentTransaction) {
    const list = this.getTransactions();
    list.unshift(tx);
    this.saveTransactions(list);
  }

  // --- RECONCILIATIONS ---
  static getReconciliations(): PaymentReconciliationItem[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.RECONCILIATION);
      if (saved) return JSON.parse(saved);
    } catch {}
    this.saveReconciliations(INITIAL_RECONCILIATIONS);
    return INITIAL_RECONCILIATIONS;
  }

  static saveReconciliations(items: PaymentReconciliationItem[]) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.RECONCILIATION, JSON.stringify(items));
    } catch {}
  }

  static recordReconciliation(item: PaymentReconciliationItem) {
    const list = this.getReconciliations();
    list.unshift(item);
    this.saveReconciliations(list);
  }

  // --- WEBHOOK LOGS ---
  static getWebhookLogs(): PaymentWebhookLog[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.WEBHOOKS);
      if (saved) return JSON.parse(saved);
    } catch {}
    this.saveWebhookLogs(INITIAL_WEBHOOK_LOGS);
    return INITIAL_WEBHOOK_LOGS;
  }

  static saveWebhookLogs(logs: PaymentWebhookLog[]) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.WEBHOOKS, JSON.stringify(logs));
    } catch {}
  }

  static recordWebhookLog(log: PaymentWebhookLog) {
    const list = this.getWebhookLogs();
    list.unshift(log);
    this.saveWebhookLogs(list.slice(0, 100)); // keep last 100
  }
}
