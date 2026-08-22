export interface EcommerceChannel {
  id: string;
  platform: 'shopee' | 'tiktok' | 'website' | 'meta' | 'lazada';
  name: string;
  accountName: string;
  shopId: string;
  apiKey: string;
  apiSecretMasked: string;
  webhookUrl: string;
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  lastSyncTime: string;
  totalOrdersSynced: number;
  totalRevenueSynced: number;
  autoDeductFifo: boolean;
  assignedWarehouseId: string;
  assignedWarehouseName: string;
}

export interface SkuMapping {
  id: string;
  platform: 'shopee' | 'tiktok' | 'website';
  channelShopName: string;
  channelSku: string;
  channelProductName: string;
  systemSku: string;
  systemProductName: string;
  conversionRatio: number; // e.g. 1 (1 sàn = 1 hệ thống) or 6 (1 lốc = 6 lon)
  isAutoSynced: boolean;
  lastStockPushed: number;
  lastStockPushedAt: string;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  platform: string;
  eventType: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'STOCK_PUSH' | 'PRICE_SYNC' | 'WEBHOOK_INCOMING';
  orderCode?: string;
  httpStatus: number;
  latencyMs: number;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING';
  message: string;
  payloadSummary: string;
}

export interface SyncErrorQueueItem {
  id: string;
  platform: string;
  externalOrderCode: string;
  errorReason: string;
  retryAttempts: number;
  maxAttempts: number;
  receivedAt: string;
  status: 'pending' | 'resolved' | 'failed_permanently';
}

export const INITIAL_ECOMMERCE_CHANNELS: EcommerceChannel[] = [
  {
    id: 'ch-shopee-01',
    platform: 'shopee',
    name: 'Shopee Mall - Nông Sản & Trà Thảo Mộc BizOne',
    accountName: 'bizone_official_store',
    shopId: 'SP-88392194',
    apiKey: 'shp_live_key_992384a8bc92',
    apiSecretMasked: '•••••••••••••••••••••••••••8f3a',
    webhookUrl: 'https://api.bizone.vn/v1/webhooks/shopee/orders',
    status: 'connected',
    lastSyncTime: 'Vừa xong (10 giây trước)',
    totalOrdersSynced: 1284,
    totalRevenueSynced: 489200000,
    autoDeductFifo: true,
    assignedWarehouseId: 'WH01',
    assignedWarehouseName: 'Kho Tổng Hà Nội'
  },
  {
    id: 'ch-tiktok-01',
    platform: 'tiktok',
    name: 'TikTok Shop - BizOne Living & Tea Bar',
    accountName: 'tiktok_bizone_vn',
    shopId: 'TTS-VN-4481023',
    apiKey: 'tts_auth_token_882931a7c',
    apiSecretMasked: '•••••••••••••••••••••••••••c19e',
    webhookUrl: 'https://api.bizone.vn/v1/webhooks/tiktok/realtime-orders',
    status: 'connected',
    lastSyncTime: '2 phút trước',
    totalOrdersSynced: 896,
    totalRevenueSynced: 342150000,
    autoDeductFifo: true,
    assignedWarehouseId: 'WH01',
    assignedWarehouseName: 'Kho Tổng Hà Nội'
  },
  {
    id: 'ch-web-01',
    platform: 'website',
    name: 'Website Thương Mại Điện Tử (WooCommerce & REST API)',
    accountName: 'https://bizone.vn',
    shopId: 'WEB-CORE-V2',
    apiKey: 'ck_bizone_production_2026',
    apiSecretMasked: '•••••••••••••••••••••••••••99aa',
    webhookUrl: 'https://api.bizone.vn/v1/webhooks/woocommerce/orders',
    status: 'connected',
    lastSyncTime: '5 phút trước',
    totalOrdersSynced: 420,
    totalRevenueSynced: 388900000,
    autoDeductFifo: true,
    assignedWarehouseId: 'WH02',
    assignedWarehouseName: 'Kho Tổng TP.HCM'
  }
];

export const INITIAL_SKU_MAPPINGS: SkuMapping[] = [
  {
    id: 'map-01',
    platform: 'shopee',
    channelShopName: 'Shopee Mall',
    channelSku: 'SHOPEE-MATCHA-100G',
    channelProductName: '[Chính Hãng] Bột Matcha Uji Nhật Bản Hũ Thủy Tinh 100g',
    systemSku: 'SKU-MATCHA-100G',
    systemProductName: 'Bột Matcha Uji Ceremonial Grade 100g',
    conversionRatio: 1,
    isAutoSynced: true,
    lastStockPushed: 142,
    lastStockPushedAt: '2026-08-22 10:15'
  },
  {
    id: 'map-02',
    platform: 'tiktok',
    channelShopName: 'TikTok Shop',
    channelSku: 'TTS-COMBO-TRA-HOAVANG-MATONG',
    channelProductName: 'Combo Trà Hoa Vàng Ba Chẽ + Mật Ong Rừng 500ml',
    systemSku: 'COMBO-SKU-THV-MO',
    systemProductName: 'Combo Quà Sức Khỏe Trà Hoa Vàng & Mật Ong',
    conversionRatio: 1,
    isAutoSynced: true,
    lastStockPushed: 85,
    lastStockPushedAt: '2026-08-22 09:40'
  },
  {
    id: 'map-03',
    platform: 'shopee',
    channelShopName: 'Shopee Mall',
    channelSku: 'SHOPEE-CF-ROBUSTA-500G',
    channelProductName: 'Cà Phê Robusta Mộc Đắk Lắk Túi 500g Van Thở 1 Chiều',
    systemSku: 'SKU-CF-ROB-500G',
    systemProductName: 'Cà phê Hạt Robusta Rang Mộc 500g',
    conversionRatio: 1,
    isAutoSynced: true,
    lastStockPushed: 230,
    lastStockPushedAt: '2026-08-22 10:20'
  }
];

export const INITIAL_SYNC_LOGS: SyncLogEntry[] = [
  {
    id: 'log-01',
    timestamp: '2026-08-22 11:05:12',
    platform: 'Shopee Mall',
    eventType: 'ORDER_CREATED',
    orderCode: 'SP-260822-99120',
    httpStatus: 200,
    latencyMs: 142,
    status: 'SUCCESS',
    message: 'Đã nhận Webhook đơn mới: SP-260822-99120. Tự động xuất kho FIFO Kho Tổng HN.',
    payloadSummary: '{"order_id": "SP-260822-99120", "total": 450000, "items": [{"sku": "SHOPEE-MATCHA-100G", "qty": 1}]}'
  },
  {
    id: 'log-02',
    timestamp: '2026-08-22 10:58:44',
    platform: 'TikTok Shop',
    eventType: 'ORDER_CREATED',
    orderCode: 'TTS-260822-44109',
    httpStatus: 200,
    latencyMs: 98,
    status: 'SUCCESS',
    message: 'Đã nhận đơn Livestream TikTok. Tạo chứng từ bán lẻ và giữ chỗ tồn kho FIFO.',
    payloadSummary: '{"tts_order": "TTS-260822-44109", "buyer": "Nguyen Van B", "total": 720000}'
  },
  {
    id: 'log-03',
    timestamp: '2026-08-22 10:45:00',
    platform: 'Shopee Mall',
    eventType: 'STOCK_PUSH',
    httpStatus: 200,
    latencyMs: 310,
    status: 'SUCCESS',
    message: 'Đẩy cập nhật tồn kho an toàn realtime sang Shopee cho 35 SKU thành công.',
    payloadSummary: '{"action": "batch_stock_update", "skus_count": 35, "status": "all_updated"}'
  }
];

export const INITIAL_SYNC_ERRORS: SyncErrorQueueItem[] = [
  {
    id: 'err-01',
    platform: 'Shopee Mall',
    externalOrderCode: 'SP-260822-11094',
    errorReason: 'SKU "SHOPEE-NEW-SEASONAL-TEA" chưa được Mapping vào Master SKU hệ thống',
    retryAttempts: 2,
    maxAttempts: 5,
    receivedAt: '2026-08-22 08:30:15',
    status: 'pending'
  }
];
