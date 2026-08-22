import { Customer, CustomerSpecialOccasion, LoyaltyTier, LoyaltyTransaction, SpecialOccasionType } from '../types';

export interface OccasionTypeMeta {
  type: SpecialOccasionType;
  label: string;
  shortLabel: string;
  icon: string;
  colorBg: string;
  colorText: string;
  borderColor: string;
  badgeBg: string;
  defaultReminderDays: number;
  defaultBonusPoints: number;
  defaultDiscount: number;
  defaultGift: string;
  description: string;
}

export const OCCASION_TYPE_CONFIG: Record<SpecialOccasionType, OccasionTypeMeta> = {
  birthday: {
    type: 'birthday',
    label: 'Sinh nhật cá nhân / Người đại diện',
    shortLabel: 'Sinh nhật',
    icon: '🎂',
    colorBg: 'bg-rose-50',
    colorText: 'text-rose-700',
    borderColor: 'border-rose-200',
    badgeBg: 'bg-rose-100 text-rose-800',
    defaultReminderDays: 3,
    defaultBonusPoints: 500,
    defaultDiscount: 10,
    defaultGift: 'Bánh kem & Lẵng hoa tươi cao cấp',
    description: 'Ngày sinh nhật của khách hàng cá nhân hoặc Tổng giám đốc / Người đại diện đối tác.'
  },
  company_anniversary: {
    type: 'company_anniversary',
    label: 'Kỷ niệm thành lập công ty / Khai trương',
    shortLabel: 'Kỷ niệm thành lập',
    icon: '🏢',
    colorBg: 'bg-amber-50',
    colorText: 'text-amber-700',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-100 text-amber-800',
    defaultReminderDays: 7,
    defaultBonusPoints: 1000,
    defaultDiscount: 12,
    defaultGift: 'Lẵng hoa chúc mừng & Kỷ niệm chương mạ vàng',
    description: 'Kỷ niệm ngày thành lập doanh nghiệp hoặc khai trương chi nhánh mới của đối tác.'
  },
  mid_autumn: {
    type: 'mid_autumn',
    label: 'Tết Trung Thu (15/8 Âm Lịch)',
    shortLabel: 'Tết Trung Thu',
    icon: '🥮',
    colorBg: 'bg-orange-50',
    colorText: 'text-orange-700',
    borderColor: 'border-orange-200',
    badgeBg: 'bg-orange-100 text-orange-800',
    defaultReminderDays: 10,
    defaultBonusPoints: 300,
    defaultDiscount: 8,
    defaultGift: 'Hộp bánh Trung Thu thượng hạng (Kinh Đô / Như Lan)',
    description: 'Dịp Tết Trung Thu tri ân đối tác và gia đình khách hàng.'
  },
  tet_holiday: {
    type: 'tet_holiday',
    label: 'Tết Nguyên Đán (Tết Cổ Truyền)',
    shortLabel: 'Tết Nguyên Đán',
    icon: '🧧',
    colorBg: 'bg-red-50',
    colorText: 'text-red-700',
    borderColor: 'border-red-200',
    badgeBg: 'bg-red-100 text-red-800',
    defaultReminderDays: 15,
    defaultBonusPoints: 1000,
    defaultDiscount: 15,
    defaultGift: 'Giỏ quà Tết VIP, Rượu vang nhập khẩu & Bộ lịch xuân',
    description: 'Dịp Tết Nguyên Đán gửi lời chúc thịnh vượng & tri ân cả năm hợp tác.'
  },
  women_day_vn: {
    type: 'women_day_vn',
    label: 'Ngày Phụ Nữ Việt Nam (20/10)',
    shortLabel: 'Phụ Nữ VN 20/10',
    icon: '💐',
    colorBg: 'bg-pink-50',
    colorText: 'text-pink-700',
    borderColor: 'border-pink-200',
    badgeBg: 'bg-pink-100 text-pink-800',
    defaultReminderDays: 3,
    defaultBonusPoints: 300,
    defaultDiscount: 10,
    defaultGift: 'Bó hoa tươi nghệ thuật & Thiệp viết tay',
    description: 'Dành riêng cho đối tác, giám đốc, kế toán hoặc khách hàng nữ.'
  },
  women_day_intl: {
    type: 'women_day_intl',
    label: 'Quốc Tế Phụ Nữ (08/03)',
    shortLabel: 'Quốc Tế Phụ Nữ 8/3',
    icon: '🌸',
    colorBg: 'bg-purple-50',
    colorText: 'text-purple-700',
    borderColor: 'border-purple-200',
    badgeBg: 'bg-purple-100 text-purple-800',
    defaultReminderDays: 3,
    defaultBonusPoints: 300,
    defaultDiscount: 10,
    defaultGift: 'Set mỹ phẩm / Nước hoa cao cấp & Hoa tươi',
    description: 'Ngày Quốc tế Phụ nữ tri ân đối tác và khách hàng nữ.'
  },
  business_day_vn: {
    type: 'business_day_vn',
    label: 'Ngày Doanh Nhân Việt Nam (13/10)',
    shortLabel: 'Doanh Nhân VN 13/10',
    icon: '👔',
    colorBg: 'bg-blue-50',
    colorText: 'text-blue-700',
    borderColor: 'border-blue-200',
    badgeBg: 'bg-blue-100 text-blue-800',
    defaultReminderDays: 5,
    defaultBonusPoints: 500,
    defaultDiscount: 10,
    defaultGift: 'Bút ký cao cấp & Hộp trà Shan Tuyết cổ thụ',
    description: 'Tôn vinh các vị Giám đốc, Chủ doanh nghiệp đối tác.'
  },
  new_year: {
    type: 'new_year',
    label: 'Tết Dương Lịch (01/01)',
    shortLabel: 'Tết Dương Lịch',
    icon: '🎉',
    colorBg: 'bg-indigo-50',
    colorText: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    defaultReminderDays: 5,
    defaultBonusPoints: 500,
    defaultDiscount: 10,
    defaultGift: 'Bộ quà tặng văn phòng & Lịch để bàn doanh nghiệp',
    description: 'Chào đón năm mới dương lịch.'
  },
  christmas: {
    type: 'christmas',
    label: 'Giáng Sinh / Noel (25/12)',
    shortLabel: 'Giáng Sinh Noel',
    icon: '🎄',
    colorBg: 'bg-emerald-50',
    colorText: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    defaultReminderDays: 5,
    defaultBonusPoints: 300,
    defaultDiscount: 8,
    defaultGift: 'Hộp bánh cookie gừng & Thiệp chúc Noel ấm áp',
    description: 'Mùa Giáng Sinh an lành.'
  },
  first_order_anniversary: {
    type: 'first_order_anniversary',
    label: 'Kỷ niệm ngày đầu hợp tác',
    shortLabel: 'Kỷ niệm hợp tác',
    icon: '🤝',
    colorBg: 'bg-teal-50',
    colorText: 'text-teal-700',
    borderColor: 'border-teal-200',
    badgeBg: 'bg-teal-100 text-teal-800',
    defaultReminderDays: 5,
    defaultBonusPoints: 800,
    defaultDiscount: 12,
    defaultGift: 'Voucher mua hàng ưu đãi đặc biệt & Kỷ niệm chương',
    description: 'Tròn năm kể từ ngày ký hợp đồng hoặc phát sinh đơn hàng đầu tiên.'
  },
  custom: {
    type: 'custom',
    label: 'Dịp đặc biệt tùy chỉnh',
    shortLabel: 'Dịp khác',
    icon: '⭐',
    colorBg: 'bg-slate-50',
    colorText: 'text-slate-700',
    borderColor: 'border-slate-200',
    badgeBg: 'bg-slate-100 text-slate-800',
    defaultReminderDays: 3,
    defaultBonusPoints: 200,
    defaultDiscount: 5,
    defaultGift: 'Quà tặng doanh nghiệp theo yêu cầu',
    description: 'Dịp đặc biệt riêng biệt do doanh nghiệp tự đặt.'
  }
};

export interface LoyaltyTierConfig {
  tier: LoyaltyTier;
  label: string;
  minPoints: number;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  icon: string;
  perks: string[];
  pointsMultiplier: number; // Ví dụ 1.5x điểm
  birthdayDiscount: number; // % giảm sinh nhật
}

export const LOYALTY_TIER_CONFIG: Record<LoyaltyTier, LoyaltyTierConfig> = {
  standard: {
    tier: 'standard',
    label: 'Hạng Chuẩn (Standard)',
    minPoints: 0,
    badgeBg: 'bg-slate-100',
    badgeBorder: 'border-slate-300',
    badgeText: 'text-slate-700',
    icon: '🥉',
    perks: ['Tích 1% điểm trên giá trị đơn', 'Nhận lời chúc tự động các dịp lễ', 'Ưu đãi 5% tuần sinh nhật'],
    pointsMultiplier: 1.0,
    birthdayDiscount: 5
  },
  silver: {
    tier: 'silver',
    label: 'Hạng Bạc (Silver)',
    minPoints: 1000,
    badgeBg: 'bg-slate-200',
    badgeBorder: 'border-slate-400',
    badgeText: 'text-slate-800',
    icon: '🥈',
    perks: ['Tích 1.2% điểm đơn hàng', 'Tặng 300 điểm ngày sinh nhật', 'Ưu đãi 8% tuần sinh nhật', 'Ưu tiên giao hàng trong 24h'],
    pointsMultiplier: 1.2,
    birthdayDiscount: 8
  },
  gold: {
    tier: 'gold',
    label: 'Hạng Vàng (Gold)',
    minPoints: 3000,
    badgeBg: 'bg-amber-100',
    badgeBorder: 'border-amber-400',
    badgeText: 'text-amber-900',
    icon: '🥇',
    perks: ['Tích 1.5% điểm đơn hàng', 'Tặng 500 điểm + Quà Tết Trung Thu', 'Ưu đãi 10% tuần sinh nhật', 'Hỗ trợ công nợ ưu tiên 45 ngày'],
    pointsMultiplier: 1.5,
    birthdayDiscount: 10
  },
  diamond: {
    tier: 'diamond',
    label: 'Hạng Kim Cương (Diamond)',
    minPoints: 8000,
    badgeBg: 'bg-cyan-100',
    badgeBorder: 'border-cyan-400',
    badgeText: 'text-cyan-900',
    icon: '💎',
    perks: ['Tích 2.0% điểm đơn hàng (x2)', 'Tặng 1000 điểm + Giỏ quà VIP Tết & Trung Thu', 'Ưu đãi 15% tuần sinh nhật', 'Hạn mức công nợ tối đa & Sales VIP phục vụ riêng'],
    pointsMultiplier: 2.0,
    birthdayDiscount: 15
  }
};

export interface GreetingTemplate {
  id: string;
  occasionType: SpecialOccasionType;
  title: string;
  channel: 'zalo' | 'sms' | 'email';
  content: string;
}

export const DEFAULT_GREETING_TEMPLATES: GreetingTemplate[] = [
  {
    id: 'tmpl-bday-zalo',
    occasionType: 'birthday',
    title: 'Chúc mừng sinh nhật (Zalo/SMS thân mật)',
    channel: 'zalo',
    content: '🎉 Chúc mừng sinh nhật {{REPRESENTATIVE_NAME}} / Quý khách {{CUSTOMER_NAME}}! 🎂\n\nToàn thể đội ngũ Bizone kính chúc Quý khách một tuổi mới tràn đầy sức khỏe, hạnh phúc và thành công rực rỡ trong sự nghiệp!\n\n🎁 Nhân dịp đặc biệt này, Bizone xin gửi tặng Quý khách: \n- Tặng +{{POINTS}} điểm thưởng tích lũy vào tài khoản\n- Ưu đãi giảm {{DISCOUNT}}% cho đơn hàng tiếp theo.\n\nTrân trọng cảm ơn Quý khách luôn đồng hành cùng chúng tôi!\nHotline/Zalo hỗ trợ: {{STAFF_PHONE}} ({{STAFF_NAME}}).'
  },
  {
    id: 'tmpl-anniv-zalo',
    occasionType: 'company_anniversary',
    title: 'Chúc mừng thành lập công ty (Zalo/Email trang trọng)',
    channel: 'email',
    content: '🏢 Kính gửi Ban Lãnh Đạo cùng toàn thể CBNV Quý Công Ty {{CUSTOMER_NAME}},\n\nNhân dịp kỷ niệm ngày thành lập doanh nghiệp, Bizone xin trân trọng gửi tới Quý Công Ty lời chúc mừng nồng nhiệt và tốt đẹp nhất!\n\nKính chúc Quý Công Ty ngày càng phát triển vững mạnh, gặt hái thêm nhiều thành công vang dội và luôn là đối tác chiến lược tin cậy của chúng tôi.\n\n🎁 Bizone hân hạnh gửi tặng Quý Công Ty lẵng hoa tươi và voucher ưu đãi {{DISCOUNT}}% cùng +{{POINTS}} điểm thưởng tri ân.\n\nTrân trọng,\nĐội ngũ Bizone - Phụ trách: {{STAFF_NAME}} ({{STAFF_PHONE}}).'
  },
  {
    id: 'tmpl-midautumn-zalo',
    occasionType: 'mid_autumn',
    title: 'Tri ân Tết Trung Thu (Zalo/SMS ấm áp)',
    channel: 'zalo',
    content: '🥮 Nhân dịp Tết Trung Thu (Rằm tháng 8), Bizone kính chúc {{REPRESENTATIVE_NAME}} và gia đình một mùa Đoàn viên an lành, ấm áp và ngập tràn niềm vui! 🌕\n\nCảm ơn Quý đối tác {{CUSTOMER_NAME}} đã luôn tin tưởng và đồng hành cùng Bizone trong suốt thời gian qua.\n\n🎁 Hộp bánh Trung Thu tri ân cùng món quà tinh thần đặc biệt đang được chuyên viên {{STAFF_NAME}} gửi trao tận tay Quý khách!\n\nThân ái & Trân trọng!'
  },
  {
    id: 'tmpl-tet-email',
    occasionType: 'tet_holiday',
    title: 'Chúc Tết Nguyên Đán (Email/Thư tri ân)',
    channel: 'email',
    content: '🧧 Kính gửi Quý Khách hàng & Quý Đối tác {{CUSTOMER_NAME}},\n\nTrong không khí rộn ràng đón chào năm mới Xuân Bính Ngọ, Bizone xin gửi lời tri ân chân thành nhất tới Quý khách vì sự đồng hành quý báu trong suốt năm vừa qua.\n\nKính chúc Quý Doanh nghiệp và Gia đình một năm mới AN KHANG THỊNH VƯỢNG - VẠN SỰ NHƯ Ý - TẤN TÀI TẤN LỘC!\n\n🎁 Món quà Tết cùng +{{POINTS}} điểm thưởng tri ân đã được kích hoạt trong tài khoản thành viên của Quý khách.\n\nKính chúc Quý khách một kỳ nghỉ Tết trọn vẹn!'
  },
  {
    id: 'tmpl-women-zalo',
    occasionType: 'women_day_vn',
    title: 'Chúc mừng ngày 20/10 (Zalo tươi tắn)',
    channel: 'zalo',
    content: '💐 Nhân ngày Phụ nữ Việt Nam 20/10, Bizone xin gửi tới {{REPRESENTATIVE_NAME}} cùng toàn thể các chị em phụ nữ tại Quý Công Ty {{CUSTOMER_NAME}} lời chúc mừng nồng nhiệt nhất! 🌸\n\nChúc Chị luôn luôn tươi trẻ, rạng ngời, hạnh phúc và thành công vượt bậc trong công việc cũng như cuộc sống!\n\n🎁 Bizone gửi tặng Chị ưu đãi {{DISCOUNT}}% và +{{POINTS}} điểm thưởng may mắn hôm nay!'
  },
  {
    id: 'tmpl-business-zalo',
    occasionType: 'business_day_vn',
    title: 'Chúc mừng Ngày Doanh Nhân Việt Nam 13/10',
    channel: 'zalo',
    content: '👔 Chúc mừng Ngày Doanh Nhân Việt Nam 13/10! 🏆\n\nBizone xin trân trọng chúc mừng {{REPRESENTATIVE_NAME}} - Vị thuyền trưởng tài ba của {{CUSTOMER_NAME}}!\n\nKính chúc Quý Doanh nhân luôn tràn đầy nhiệt huyết, bản lĩnh vững vàng chèo lái con thuyền doanh nghiệp vươn xa và chinh phục mọi đỉnh cao mới!\n\nTrân trọng cảm ơn sự hợp tác bền chặt của Quý vị!'
  }
];

export const INITIAL_SPECIAL_OCCASIONS: CustomerSpecialOccasion[] = [
  {
    id: 'occ-1',
    customerId: 'c-1',
    customerName: 'CTY CP Vạn Phát',
    customerPhone: '0908 123 456',
    customerGroup: 'Doanh nghiệp',
    type: 'birthday',
    title: 'Sinh nhật TGĐ Nguyễn Văn Vạn (Người đại diện)',
    date: '2026-08-21', // TODAY!
    reminderDaysBefore: 3,
    giftBudget: 1200000,
    giftName: 'Bánh kem tươi Paris Baguette & Giỏ hoa lan hồ điệp',
    giftStatus: 'prepared',
    bonusPoints: 500,
    discountPercent: 10,
    assignedStaff: 'Lê Hoàng Nam',
    status: 'today',
    actionTaken: false,
    notes: 'Tổng giám đốc Vạn Phát thích hoa lan vàng, đã đặt trước tại tiệm hoa'
  },
  {
    id: 'occ-2',
    customerId: 'c-3',
    customerName: 'Công ty TNHH Cơ Khí Đại Nam',
    customerPhone: '0912 888 999',
    customerGroup: 'VIP',
    type: 'company_anniversary',
    title: 'Kỷ niệm 8 năm thành lập Công ty Cơ Khí Đại Nam',
    date: '2026-08-25', // Next 4 days
    reminderDaysBefore: 7,
    giftBudget: 2500000,
    giftName: 'Kỷ niệm chương mạ vàng 24K & Rượu vang Chivas 18',
    giftStatus: 'prepared',
    bonusPoints: 1000,
    discountPercent: 15,
    assignedStaff: 'Lê Hoàng Nam',
    status: 'upcoming',
    actionTaken: false,
    notes: 'Khách hàng VIP mua hàng chục tấn thép mỗi tháng. Cần chuẩn bị quà sang trọng trao tận tay tại buổi lễ kỷ niệm.'
  },
  {
    id: 'occ-3',
    customerId: 'c-2',
    customerName: 'Công ty TNHH Xây Dựng ABC',
    customerPhone: '0988 777 666',
    customerGroup: 'Doanh nghiệp',
    type: 'mid_autumn',
    title: 'Tết Trung Thu (15/8 Âm lịch) - Tri ân Giám đốc & Phòng Mua hàng',
    date: '2026-09-08',
    isLunar: true,
    lunarDateStr: '15/08 Âm lịch',
    reminderDaysBefore: 10,
    giftBudget: 1500000,
    giftName: 'Hộp bánh Trung Thu Trăng Vàng Hoàng Kim (Kinh Đô)',
    giftStatus: 'not_sent',
    bonusPoints: 300,
    discountPercent: 8,
    assignedStaff: 'Trần Thị Thu Thảo',
    status: 'upcoming',
    actionTaken: false,
    notes: 'Đang chọn mẫu hộp bánh trung thu cao cấp để giao đầu tháng 9'
  },
  {
    id: 'occ-4',
    customerId: 'c-4',
    customerName: 'Cửa hàng VLXD Phúc Thịnh',
    customerPhone: '0933 456 789',
    customerGroup: 'Đại lý',
    type: 'birthday',
    title: 'Sinh nhật Chủ đại lý Phạm Phúc Thịnh',
    date: '2026-08-24', // Next 3 days
    reminderDaysBefore: 3,
    giftBudget: 800000,
    giftName: 'Giỏ trái cây nhập khẩu & Bộ ấm chén gốm sứ Bát Tràng',
    giftStatus: 'not_sent',
    bonusPoints: 500,
    discountPercent: 10,
    assignedStaff: 'Nguyễn Văn Minh',
    status: 'upcoming',
    actionTaken: false,
    notes: 'Đại lý phân phối tôn thân thiết, Sales Minh ghé thăm trực tiếp chúc mừng'
  },
  {
    id: 'occ-5',
    customerId: 'c-5',
    customerName: 'Xưởng Sản Xuất Minh Trí',
    customerPhone: '0903 555 111',
    customerGroup: 'Doanh nghiệp',
    type: 'first_order_anniversary',
    title: 'Kỷ niệm tròn 2 năm hợp tác cung cấp thép hộp',
    date: '2026-08-28', // Next 7 days
    reminderDaysBefore: 5,
    giftBudget: 1000000,
    giftName: 'Thẻ quà tặng voucher 10% + Set bút ký doanh nhân',
    giftStatus: 'not_sent',
    bonusPoints: 800,
    discountPercent: 12,
    assignedStaff: 'Lê Hoàng Nam',
    status: 'upcoming',
    actionTaken: false,
    notes: 'Đơn hàng đầu tiên ký ngày 28/08/2024. Đã đạt doanh số tích lũy hơn 128 triệu.'
  },
  {
    id: 'occ-6',
    customerId: 'c-1',
    customerName: 'CTY CP Vạn Phát',
    customerPhone: '0908 123 456',
    customerGroup: 'Doanh nghiệp',
    type: 'business_day_vn',
    title: 'Ngày Doanh Nhân Việt Nam (13/10)',
    date: '2026-10-13',
    reminderDaysBefore: 5,
    giftBudget: 1500000,
    giftName: 'Hộp trà Shan Tuyết cổ thụ cao cấp',
    giftStatus: 'not_sent',
    bonusPoints: 500,
    discountPercent: 10,
    assignedStaff: 'Lê Hoàng Nam',
    status: 'upcoming',
    actionTaken: false,
    notes: 'Chúc mừng Ban lãnh đạo công ty Vạn Phát'
  },
  {
    id: 'occ-7',
    customerId: 'c-3',
    customerName: 'Công ty TNHH Cơ Khí Đại Nam',
    customerPhone: '0912 888 999',
    customerGroup: 'VIP',
    type: 'women_day_vn',
    title: 'Ngày Phụ Nữ Việt Nam 20/10 - Chúc mừng Giám đốc Tài Chính & Kế toán trưởng',
    date: '2026-10-20',
    reminderDaysBefore: 3,
    giftBudget: 2000000,
    giftName: '2 Lẵng hoa tươi & Set mỹ phẩm cao cấp',
    giftStatus: 'not_sent',
    bonusPoints: 300,
    discountPercent: 10,
    assignedStaff: 'Lê Hoàng Nam',
    status: 'upcoming',
    actionTaken: false,
    notes: 'Tri ân đối tác nữ phụ trách duyệt thanh toán và hợp đồng'
  }
];

export const INITIAL_LOYALTY_TRANSACTIONS: LoyaltyTransaction[] = [
  {
    id: 'lt-1',
    customerId: 'c-3',
    customerName: 'Công ty TNHH Cơ Khí Đại Nam',
    points: 1000,
    type: 'tier_upgrade',
    description: 'Thăng hạng thành viên Kim Cương (Diamond Tier) - Tặng 1000 điểm chào mừng',
    date: '2026-08-01',
    createdBy: 'Hệ thống tự động'
  },
  {
    id: 'lt-2',
    customerId: 'c-1',
    customerName: 'CTY CP Vạn Phát',
    points: 500,
    type: 'purchase',
    description: 'Tích điểm đơn hàng thép tấm HD-082026 (1% giá trị đơn hàng 50.000.000đ)',
    date: '2026-08-14',
    orderId: 'ORD-2026-0814',
    createdBy: 'Kế toán bán hàng'
  },
  {
    id: 'lt-3',
    customerId: 'c-4',
    customerName: 'Cửa hàng VLXD Phúc Thịnh',
    points: 300,
    type: 'purchase',
    description: 'Tích điểm mua Tôn lạnh Hoa Sen 0.45mm',
    date: '2026-08-14',
    orderId: 'ORD-2026-0812',
    createdBy: 'Kế toán bán hàng'
  },
  {
    id: 'lt-4',
    customerId: 'c-3',
    customerName: 'Công ty TNHH Cơ Khí Đại Nam',
    points: 800,
    type: 'purchase',
    description: 'Tích điểm gấp đôi x2 thành viên Kim Cương cho đơn hàng 40.000.000đ',
    date: '2026-08-10',
    orderId: 'ORD-2026-0809',
    createdBy: 'Hệ thống POS'
  }
];

// Helper to calculate days remaining relative to mock today (2026-08-21)
export function getDaysRemaining(dateStr: string, currentAnchorDate = '2026-08-21'): number {
  if (!dateStr) return 999;
  
  // Extract MM-DD if full date provided
  const parts = dateStr.split('-');
  let month = 0;
  let day = 0;
  if (parts.length === 3) {
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else if (parts.length === 2) {
    month = parseInt(parts[0], 10);
    day = parseInt(parts[1], 10);
  } else {
    return 999;
  }

  const anchor = new Date(currentAnchorDate);
  const targetThisYear = new Date(anchor.getFullYear(), month - 1, day);
  
  // Calculate diff in days
  const diffTime = targetThisYear.getTime() - anchor.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function formatVnd(amount?: number): string {
  if (!amount && amount !== 0) return '0 đ';
  return amount.toLocaleString('vi-VN') + ' đ';
}
