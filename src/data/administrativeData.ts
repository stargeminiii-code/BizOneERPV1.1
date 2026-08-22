// Danh mục Tỉnh / Thành phố Việt Nam (63 Tỉnh Thành theo hệ thống hành chính mới)
export interface RegionGroup {
  region: string;
  provinces: string[];
}

export const VIETNAM_PROVINCES_BY_REGION: RegionGroup[] = [
  {
    region: 'Miền Bắc (Đồng bằng & Trung du, Miền núi)',
    provinces: [
      'Hà Nội',
      'Hải Phòng',
      'Bắc Ninh',
      'Hải Dương',
      'Hưng Yên',
      'Quảng Ninh',
      'Vĩnh Phúc',
      'Hà Nam',
      'Nam Định',
      'Ninh Bình',
      'Thái Bình',
      'Thái Nguyên',
      'Phú Thọ',
      'Bắc Giang',
      'Lạng Sơn',
      'Tuyên Quang',
      'Hà Giang',
      'Cao Bằng',
      'Bắc Kạn',
      'Lào Cai',
      'Yên Bái',
      'Hòa Bình',
      'Sơn La',
      'Điện Biên',
      'Lai Châu'
    ]
  },
  {
    region: 'Miền Trung & Tây Nguyên',
    provinces: [
      'Đà Nẵng',
      'Thanh Hóa',
      'Nghệ An',
      'Hà Tĩnh',
      'Quảng Bình',
      'Quảng Trị',
      'Thừa Thiên Huế',
      'Quảng Nam',
      'Quảng Ngãi',
      'Bình Định',
      'Phú Yên',
      'Khánh Hòa',
      'Ninh Thuận',
      'Bình Thuận',
      'Kon Tum',
      'Gia Lai',
      'Đắk Lắk',
      'Đắk Nông',
      'Lâm Đồng'
    ]
  },
  {
    region: 'Miền Nam (Đông Nam Bộ & Đồng bằng Sông Cửu Long)',
    provinces: [
      'TP. Hồ Chí Minh',
      'Bình Dương',
      'Đồng Nai',
      'Bà Rịa - Vũng Tàu',
      'Long An',
      'Tây Ninh',
      'Bình Phước',
      'Tiền Giang',
      'Bến Tre',
      'Trà Vinh',
      'Vĩnh Long',
      'Đồng Tháp',
      'An Giang',
      'Kiên Giang',
      'Cần Thơ',
      'Hậu Giang',
      'Sóc Trăng',
      'Bạc Liêu',
      'Cà Mau'
    ]
  }
];

export const ALL_VIETNAM_PROVINCES: string[] = VIETNAM_PROVINCES_BY_REGION.flatMap((r) => r.provinces);

// Danh mục Quốc gia cho Khách hàng / Đối tác Quốc tế & Xuất khẩu
export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  currency: string;
}

export const INTERNATIONAL_COUNTRIES: CountryOption[] = [
  { code: 'LA', name: 'Lào (Laos)', flag: '🇱🇦', currency: 'LAK / USD' },
  { code: 'KH', name: 'Campuchia (Cambodia)', flag: '🇰🇭', currency: 'KHR / USD' },
  { code: 'TH', name: 'Thái Lan (Thailand)', flag: '🇹🇭', currency: 'THB / USD' },
  { code: 'CN', name: 'Trung Quốc (China)', flag: '🇨🇳', currency: 'CNY / USD' },
  { code: 'JP', name: 'Nhật Bản (Japan)', flag: '🇯🇵', currency: 'JPY / USD' },
  { code: 'KR', name: 'Hàn Quốc (South Korea)', flag: '🇰🇷', currency: 'KRW / USD' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD / USD' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currency: 'MYR / USD' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', currency: 'IDR / USD' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', currency: 'PHP / USD' },
  { code: 'AU', name: 'Úc (Australia)', flag: '🇦🇺', currency: 'AUD / USD' },
  { code: 'US', name: 'Hoa Kỳ (United States)', flag: '🇺🇸', currency: 'USD' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD / USD' },
  { code: 'DE', name: 'Đức (Germany)', flag: '🇩🇪', currency: 'EUR' },
  { code: 'FR', name: 'Pháp (France)', flag: '🇫🇷', currency: 'EUR' },
  { code: 'GB', name: 'Vương Quốc Anh (United Kingdom)', flag: '🇬🇧', currency: 'GBP' },
  { code: 'OTHER', name: 'Quốc gia khác...', flag: '🌐', currency: 'USD / Ngoại tệ' }
];

// Danh mục Sales / Nhân sự phụ trách
export interface SalesStaffOption {
  id: string;
  name: string;
  code: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  avatarColor: string;
}

export const SALES_STAFF_LIST: SalesStaffOption[] = [
  {
    id: 'staff-01',
    name: 'Lê Hoàng Nam',
    code: 'NV-SL01',
    role: 'Chuyên viên Sales Thép & Kim Khí KV1',
    department: 'Phòng Kinh doanh Miền Bắc',
    phone: '0912 345 678',
    email: 'nam.le@thepviet.vn',
    avatarColor: 'bg-blue-600'
  },
  {
    id: 'staff-02',
    name: 'Nguyễn Văn An',
    code: 'NV-SL02',
    role: 'Trưởng nhóm Sales Dự án & Công trình',
    department: 'Phòng Dự án & Thầu',
    phone: '0988 765 432',
    email: 'an.nguyen@thepviet.vn',
    avatarColor: 'bg-indigo-600'
  },
  {
    id: 'staff-03',
    name: 'Phạm Quốc Huy',
    code: 'NV-SL03',
    role: 'Chuyên viên Sales Đại lý & Phân phối KV2',
    department: 'Phòng Kinh doanh Miền Nam',
    phone: '0903 112 233',
    email: 'huy.pham@thepviet.vn',
    avatarColor: 'bg-emerald-600'
  },
  {
    id: 'staff-04',
    name: 'Đặng Minh Đức',
    code: 'NV-SL04',
    role: 'Phụ trách Sales Xuất khẩu & Khách hàng Quốc tế',
    department: 'Phòng Hợp tác Quốc tế',
    phone: '0977 889 900',
    email: 'duc.dang@thepviet.vn',
    avatarColor: 'bg-purple-600'
  },
  {
    id: 'staff-05',
    name: 'Trần Thị Mai',
    code: 'NV-KT01',
    role: 'Kế toán Công nợ & Quản lý Hạn mức',
    department: 'Phòng Kế toán Tài chính',
    phone: '0934 556 677',
    email: 'mai.tran@thepviet.vn',
    avatarColor: 'bg-amber-600'
  },
  {
    id: 'staff-06',
    name: 'Vũ Thu Hà',
    code: 'NV-SA01',
    role: 'Sales Admin & Chăm sóc Khách hàng VIP',
    department: 'Phòng Dịch vụ Khách hàng',
    phone: '0945 667 788',
    email: 'ha.vu@thepviet.vn',
    avatarColor: 'bg-rose-600'
  }
];

// Danh mục Các Tỷ lệ Điều khoản Công nợ (Payment & Credit Terms)
export interface PaymentTermPreset {
  id: '100_prepaid' | '70_30' | '50_50' | '30_70' | '100_postpaid' | 'custom';
  name: string;
  prepaymentPercent: number;
  creditPercent: number;
  defaultDays: number;
  badgeColor: string;
  description: string;
}

export const PAYMENT_TERM_PRESETS: PaymentTermPreset[] = [
  {
    id: '100_prepaid',
    name: 'Trả trước 100% (Không công nợ)',
    prepaymentPercent: 100,
    creditPercent: 0,
    defaultDays: 0,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Thanh toán 100% tiền mặt hoặc chuyển khoản trước khi giao hàng / xuất kho.'
  },
  {
    id: '70_30',
    name: 'Trả trước 70% — Công nợ 30%',
    prepaymentPercent: 70,
    creditPercent: 30,
    defaultDays: 15,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Đặt cọc / thanh toán trước 70%, 30% còn lại thanh toán trong vòng 15 - 30 ngày sau giao hàng.'
  },
  {
    id: '50_50',
    name: 'Trả trước 50% — Công nợ 50%',
    prepaymentPercent: 50,
    creditPercent: 50,
    defaultDays: 30,
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    description: 'Thanh toán trước 50%, 50% còn lại thanh toán trong vòng 30 ngày kể từ ngày nhận hàng.'
  },
  {
    id: '30_70',
    name: 'Trả trước 30% — Công nợ 70%',
    prepaymentPercent: 30,
    creditPercent: 70,
    defaultDays: 30,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Đặt cọc 30%, cho phép công nợ 70% theo biên bản nghiệm thu / hóa đơn tài chính.'
  },
  {
    id: '100_postpaid',
    name: 'Công nợ 100% (Thanh toán sau)',
    prepaymentPercent: 0,
    creditPercent: 100,
    defaultDays: 30,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Cho phép nợ 100% giá trị đơn hàng trong hạn mức tín dụng được duyệt, thanh toán định kỳ.'
  },
  {
    id: 'custom',
    name: 'Tùy chỉnh Tỷ lệ & Điều khoản riêng',
    prepaymentPercent: 40,
    creditPercent: 60,
    defaultDays: 30,
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Thiết lập tỷ lệ thanh toán trước, phần trăm công nợ và số ngày hạn nợ linh hoạt.'
  }
];

// Helper format tiền tệ với dấu chấm phân cách hàng nghìn
export const formatNumberWithDots = (val: number | string): string => {
  if (val === undefined || val === null || val === '') return '0';
  const num = typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(/,/g, '')) || 0 : val;
  return new Intl.NumberFormat('vi-VN').format(num);
};

// Parser chuyển đổi chuỗi nhập liệu (có dấu chấm hoặc phẩy) về số
export const parseFormattedNumber = (val: string): number => {
  if (!val) return 0;
  // Bỏ tất cả dấu chấm, phẩy, khoảng trắng, ký tự 'đ'
  const cleanStr = val.replace(/[^0-9]/g, '');
  return cleanStr ? parseInt(cleanStr, 10) : 0;
};
