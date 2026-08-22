export interface MarketingCampaign {
  id: string;
  name: string;
  channel: 'facebook' | 'tiktok' | 'shopee_ads' | 'google' | 'kol_koc' | 'offline_event';
  channelLabel: string;
  startDate: string;
  endDate: string;
  budget: number;
  actualSpend: number;
  leadsGenerated: number;
  ordersGenerated: number;
  revenueGenerated: number;
  roas: number; // Return on Ad Spend (e.g. 4.5x)
  cac: number;  // Customer Acquisition Cost
  status: 'active' | 'scheduled' | 'paused' | 'completed';
  targetAudience: string;
}

export interface PromoVoucher {
  id: string;
  code: string;
  name: string;
  type: 'percent' | 'fixed_amount';
  value: number; // e.g. 15 (%) or 50000 (VND)
  minOrderValue: number;
  maxDiscount?: number;
  usedCount: number;
  totalLimit: number;
  startDate: string;
  endDate: string;
  applicableChannels: string[];
  status: 'active' | 'expired' | 'disabled';
}

export interface CrossSellComboAnalytics {
  id: string;
  primarySku: string;
  primaryName: string;
  frequentlyBoughtWithSku: string;
  frequentlyBoughtWithName: string;
  coOccurrenceCount: number;
  attachRatePercent: number; // % khách mua kèm
  comboRevenue: number;
  suggestedAction: string;
}

export interface ChannelAcquisitionReport {
  channel: string;
  newCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  cacEstimated: number;
  conversionRate: number;
}

export const INITIAL_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: 'camp-01',
    name: 'Chiến dịch Mùa Thu Hái Lộc - Trà Thảo Mộc & Hạt Dinh Dưỡng',
    channel: 'tiktok',
    channelLabel: 'TikTok Livestream & Ads',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    budget: 35000000,
    actualSpend: 28400000,
    leadsGenerated: 1420,
    ordersGenerated: 680,
    revenueGenerated: 218500000,
    roas: 7.69,
    cac: 41764,
    status: 'active',
    targetAudience: 'Phụ nữ 24-45 tuổi yêu thích lối sống lành mạnh, F&B sạch'
  },
  {
    id: 'camp-02',
    name: 'KOC Review Trải nghiệm Quán Trà & Bột Matcha Uji',
    channel: 'kol_koc',
    channelLabel: 'KOC & TikTok Creator',
    startDate: '2026-08-10',
    endDate: '2026-08-25',
    budget: 20000000,
    actualSpend: 18000000,
    leadsGenerated: 890,
    ordersGenerated: 340,
    revenueGenerated: 125800000,
    roas: 6.98,
    cac: 52941,
    status: 'active',
    targetAudience: 'Giới trẻ Gen Z, Văn phòng thích check-in thưởng trà'
  },
  {
    id: 'camp-03',
    name: 'Quảng cáo Meta Ads Chuyển đổi Khách Sỉ & Đại Lý',
    channel: 'facebook',
    channelLabel: 'Facebook Meta Lead Ads',
    startDate: '2026-08-05',
    endDate: '2026-08-30',
    budget: 45000000,
    actualSpend: 38200000,
    leadsGenerated: 280,
    ordersGenerated: 42,
    revenueGenerated: 460000000,
    roas: 12.04,
    cac: 909523,
    status: 'active',
    targetAudience: 'Chủ chuỗi Cafe, Nhà hàng, Cửa hàng Nông sản sạch'
  }
];

export const INITIAL_VOUCHERS: PromoVoucher[] = [
  {
    id: 'vouc-01',
    code: 'BIZONE2026',
    name: 'Ưu đãi Doanh nghiệp Mới - Giảm 10% đơn hàng đầu',
    type: 'percent',
    value: 10,
    minOrderValue: 500000,
    maxDiscount: 200000,
    usedCount: 145,
    totalLimit: 500,
    startDate: '2026-08-01',
    endDate: '2026-09-30',
    applicableChannels: ['POS', 'Website', 'Tiktok Shop'],
    status: 'active'
  },
  {
    id: 'vouc-02',
    code: 'FREESHIP50K',
    name: 'Trợ giá Vận chuyển Toàn quốc',
    type: 'fixed_amount',
    value: 50000,
    minOrderValue: 800000,
    usedCount: 312,
    totalLimit: 1000,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    applicableChannels: ['Website', 'Shopee'],
    status: 'active'
  },
  {
    id: 'vouc-03',
    code: 'COMBOFNB',
    name: 'Giảm 25.000đ khi mua Bánh kèm Đồ Uống pha chế',
    type: 'fixed_amount',
    value: 25000,
    minOrderValue: 80000,
    usedCount: 228,
    totalLimit: 500,
    startDate: '2026-08-10',
    endDate: '2026-08-31',
    applicableChannels: ['POS'],
    status: 'active'
  }
];

export const INITIAL_CROSS_SELL: CrossSellComboAnalytics[] = [
  {
    id: 'cross-01',
    primarySku: 'SKU-MATCHA-100G',
    primaryName: 'Bột Matcha Uji Nhật Bản Hũ 100g',
    frequentlyBoughtWithSku: 'SKU-CHOI-CHASEN',
    frequentlyBoughtWithName: 'Chổi Pha Trà Chasen Tre Tự Nhiên',
    coOccurrenceCount: 148,
    attachRatePercent: 42.5,
    comboRevenue: 78440000,
    suggestedAction: 'Tạo combo giảm 10% khi mua kèm tại POS và Shopee'
  },
  {
    id: 'cross-02',
    primarySku: 'DU-CF-MUOI',
    primaryName: 'Cà Phê Muối Kem Béo Thượng Hạng',
    frequentlyBoughtWithSku: 'SKU-BANH-CROISSANT',
    frequentlyBoughtWithName: 'Bánh Croissant Bơ Pháp Nướng Giòn',
    coOccurrenceCount: 215,
    attachRatePercent: 51.8,
    comboRevenue: 14190000,
    suggestedAction: 'Gợi ý nhân viên thu ngân Upsell trực tiếp khi khách gọi Cà phê'
  },
  {
    id: 'cross-03',
    primarySku: 'SKU-TRA-HOAVANG-50G',
    primaryName: 'Trà Hoa Vàng Ba Chẽ Hộp 50g',
    frequentlyBoughtWithSku: 'SKU-MATONG-RUNG-500ML',
    frequentlyBoughtWithName: 'Mật Ong Rừng Tây Bắc Chai 500ml',
    coOccurrenceCount: 96,
    attachRatePercent: 36.2,
    comboRevenue: 54720000,
    suggestedAction: 'Thiết kế Set Quà Tặng Sức Khỏe Doanh Nghiệp (BM01)'
  }
];
