import { UserAccount, UserRole, PermissionAction, ViewMode } from '../types';

export interface ViewPermissionRequirement {
  view: ViewMode;
  module: keyof UserAccount['permissions'] | 'all';
  action: PermissionAction;
  label: string;
  category: string;
  minRole?: UserRole;
  description: string;
}

/**
 * Mapping of all ERP Views to their required permission module, action and minimum access criteria
 */
export const VIEW_PERMISSION_MAP: Record<ViewMode, ViewPermissionRequirement> = {
  'dashboard': {
    view: 'dashboard',
    module: 'dashboard',
    action: 'view',
    label: 'Bảng Điều Khiển Trung Tâm (Executive Dashboard)',
    category: 'Điều Hành',
    description: 'Xem tổng quan doanh thu, lợi nhuận, biểu đồ và chỉ số hiệu suất doanh nghiệp.'
  },
  'enterprise-planning': {
    view: 'enterprise-planning',
    module: 'dashboard',
    action: 'view',
    label: 'Kế Hoạch & Mục Tiêu Doanh Nghiệp (OKRs / KPIs)',
    category: 'Chiến Lược',
    description: 'Xem và quản lý kế hoạch chiến lược, chỉ tiêu KPI và phân rã công việc.'
  },
  'pos': {
    view: 'pos',
    module: 'beverages',
    action: 'view',
    label: 'POS Bán Hàng & Thu Ngân Nhanh',
    category: 'Bán Hàng',
    description: 'Thực hiện bán lẻ, tạo đơn hàng tại quầy và thu tiền qua VietQR.'
  },
  'orders': {
    view: 'orders',
    module: 'issues',
    action: 'view',
    label: 'Quản Lý Đơn Hàng & Bán Hàng',
    category: 'Kinh Doanh',
    description: 'Theo dõi tiến độ đơn bán, trạng thái thanh toán và xuất hóa đơn.'
  },
  'inventory': {
    view: 'inventory',
    module: 'products',
    action: 'view',
    label: 'Danh Mục Sản Phẩm & Tồn Kho Tổng Hợp',
    category: 'Kho Vận',
    description: 'Xem bảng giá, danh mục SKU, số lượng khả dụng và cảnh báo tồn kho.'
  },
  'variant-definitions': {
    view: 'variant-definitions',
    module: 'products',
    action: 'view',
    label: 'Quản Lý Thuộc Tính & Biến Thể SKU Master',
    category: 'Kho Vận',
    description: 'Cấu hình quy cách, biến thể màu sắc/kích thước và mã định danh sản phẩm.'
  },
  'warehouse-dashboard': {
    view: 'warehouse-dashboard',
    module: 'transfers',
    action: 'view',
    label: 'Tháp Kiểm Soát Kho & Trung Tâm Điều Vận',
    category: 'Kho Vận',
    description: 'Tổng quan luân chuyển hàng hóa, điều phối xuất nhập giữa các kho.'
  },
  'warehouse-issues': {
    view: 'warehouse-issues',
    module: 'issues',
    action: 'view',
    label: 'Phiếu Xuất Kho & Điều Động Hàng',
    category: 'Kho Vận',
    description: 'Quản lý phiếu xuất bán, xuất hủy, xuất nội bộ và đối soát tồn.'
  },
  'warehouse-transfers': {
    view: 'warehouse-transfers',
    module: 'transfers',
    action: 'view',
    label: 'Phiếu Chuyển Kho & Luân Chuyển Hàng Hóa',
    category: 'Kho Vận',
    description: 'Lập và phê duyệt phiếu điều chuyển hàng giữa các chi nhánh, kho bãi.'
  },
  'warehouse-stocktakes': {
    view: 'warehouse-stocktakes',
    module: 'stocktakes',
    action: 'view',
    label: 'Kiểm Kê Kho & Cân Bằng Tồn Thực Tế',
    category: 'Kho Vận',
    description: 'Thực hiện đếm hàng thực tế, xử lý lệch kho và lập phiếu cân đối.'
  },
  'automation-notifications': {
    view: 'automation-notifications',
    module: 'automation_engine',
    action: 'view',
    label: 'Tự Động Hóa & Thông Báo Đa Kênh',
    category: 'Hệ Thống',
    description: 'Cấu hình luồng tự động gửi thông báo Telegram, Zalo OA và Email.'
  },
  'genseo': {
    view: 'genseo',
    module: 'marketing',
    action: 'view',
    label: 'Tạo Nội Dung AI & Tối Ưu SEO Sản Phẩm',
    category: 'Marketing',
    description: 'Tạo bài viết SEO, mô tả sản phẩm và nội dung tiếp thị tự động.'
  },
  'warehouse-fifo-lots': {
    view: 'warehouse-fifo-lots',
    module: 'fifo_lots',
    action: 'view',
    label: 'Đối Soát Lô FIFO & Giá Vốn Hóa Đơn (HĐĐT)',
    category: 'Kho Vận',
    description: 'Theo dõi từng tầng giá vốn nhập, hạn dùng và khấu trừ giá vốn tự động.'
  },
  'warehouse-reports': {
    view: 'warehouse-reports',
    module: 'reports',
    action: 'view',
    label: 'Báo Cáo Nhập - Xuất - Tồn Kho (NXT)',
    category: 'Báo Cáo',
    description: 'Báo cáo chi tiết luân chuyển vật tư, tốc độ quay vòng hàng tồn kho.'
  },
  'stockcards': {
    view: 'stockcards',
    module: 'products',
    action: 'view',
    label: 'Thẻ Kho Chi Tiết Từng Sản Phẩm',
    category: 'Kho Vận',
    description: 'Truy vết toàn bộ lịch sử biến động nhập/xuất/kiểm kê của từng mã hàng.'
  },
  'crm': {
    view: 'crm',
    module: 'customers',
    action: 'view',
    label: 'Quản Trị Khách Hàng & CRM Hành Trình (CSKH)',
    category: 'Kinh Doanh',
    description: 'Quản lý thông tin khách hàng, phân hạng VIP, lịch sử chăm sóc và công nợ phải thu.'
  },
  'suppliers': {
    view: 'suppliers',
    module: 'suppliers',
    action: 'view',
    label: 'Nhà Cung Cấp & Công Nợ Phải Trả',
    category: 'Thu Mua',
    description: 'Quản lý đối tác cung ứng, hợp đồng, lịch sử giao hàng và thanh toán.'
  },
  'purchasing': {
    view: 'purchasing',
    module: 'purchasing',
    action: 'view',
    label: 'Đơn Đặt Hàng Nhập (PO) & Nhập Hóa Đơn',
    category: 'Thu Mua',
    description: 'Tạo đơn đặt mua hàng, đối chiếu hóa đơn điện tử và nhập kho hàng hóa.'
  },
  'cashflow': {
    view: 'cashflow',
    module: 'cashflow',
    action: 'view',
    label: 'Sổ Quỹ Thu Chi & Dòng Tiền Doanh Nghiệp',
    category: 'Tài Chính',
    description: 'Theo dõi tiền mặt, tiền gửi ngân hàng, dòng tiền thu - chi hàng ngày.'
  },
  'banking': {
    view: 'banking',
    module: 'banking_vietqr',
    action: 'view',
    label: 'Tài Khoản Ngân Hàng & Cổng VietQR Tự Động',
    category: 'Tài Chính',
    description: 'Cấu hình tài khoản Napas 24/7, sinh mã VietQR động theo đơn hàng.'
  },
  'pnl': {
    view: 'pnl',
    module: 'reports',
    action: 'view',
    label: 'Báo Cáo Kết Quả Kinh Doanh (P&L)',
    category: 'Tài Chính',
    description: 'Báo cáo doanh thu thuần, giá vốn FIFO, chi phí vận hành và lợi nhuận ròng.'
  },
  'users-roles': {
    view: 'users-roles',
    module: 'user_management',
    action: 'view',
    minRole: 'admin',
    label: 'Quản Trị Người Dùng & Phân Quyền Đa Tầng (RBAC)',
    category: 'Hệ Thống',
    description: 'Tạo tài khoản, gán vai trò, phân quyền theo phân hệ và cấu hình phạm vi dữ liệu.'
  },
  'ai-assistant': {
    view: 'ai-assistant',
    module: 'dashboard',
    action: 'view',
    label: 'Trợ Lý Doanh Nghiệp AI Copilot',
    category: 'Tiện Ích',
    description: 'Tư vấn kinh doanh thông minh, chẩn đoán rủi ro và gợi ý hành động tức thì.'
  },
  'beverages': {
    view: 'beverages',
    module: 'beverages',
    action: 'view',
    label: 'Ngành Hàng Đồ Uống & Thực Phẩm (F&B)',
    category: 'Bán Hàng',
    description: 'Quản lý menu đồ uống, định lượng nguyên liệu và đơn hàng pha chế.'
  },
  'marketing': {
    view: 'marketing',
    module: 'marketing',
    action: 'view',
    label: 'Chiến Dịch Marketing & SEO Thông Minh',
    category: 'Marketing',
    description: 'Tạo chiến dịch quảng bá, mã giảm giá voucher và quản lý nội dung bài viết.'
  },
  'api-integrations': {
    view: 'api-integrations',
    module: 'api_integrations',
    action: 'view',
    minRole: 'admin',
    label: 'Hạ Tầng API & Cổng Kết Nối Đa Dịch Vụ',
    category: 'Hệ Thống',
    description: 'Cấu hình Webhook, tích hợp Telegram Bot, Zalo OA, Gemini AI và Dịch vụ ngoài.'
  },
  'saas-platform-admin': {
    view: 'saas-platform-admin',
    module: 'user_management',
    action: 'view',
    minRole: 'super_admin',
    label: 'Quản Trị Nền Tảng Thương Mại SaaS (Platform Admin)',
    category: 'Hệ Thống',
    description: 'Quản lý Customer 360, xét duyệt hồ sơ đăng ký doanh nghiệp, cấp License và hợp đồng.'
  },
  'settings': {
    view: 'settings',
    module: 'settings',
    action: 'view',
    label: 'Cài Đặt Hệ Thống & Cấu Hình Doanh Nghiệp',
    category: 'Hệ Thống',
    description: 'Thiết lập thông tin công ty, chi nhánh, kho mặc định và tùy chỉnh hiển thị.'
  }
};

/**
 * Check if a user has access to a specific view
 */
export function canAccessView(user: UserAccount | null | undefined, view: ViewMode): boolean {
  if (!user) return false;

  // Super Admin has unrestricted access to everything
  if (user.role === 'super_admin') {
    return true;
  }

  // Account must be active
  if (user.status === 'locked' || user.status === 'inactive' || user.isLocked) {
    return false;
  }

  const req = VIEW_PERMISSION_MAP[view];
  if (!req) {
    // If not explicitly mapped, allow default access for safety
    return true;
  }

  // Check minRole requirement if present
  if (req.minRole === 'admin' && user.role !== 'admin' && user.role !== 'ceo') {
    return false;
  }

  // Check specific module permission
  if (req.module === 'all') return true;

  const perms = (user.permissions as Record<string, PermissionAction[] | undefined>)?.[req.module];
  if (!perms || !Array.isArray(perms)) {
    // Allow CEO to view general analytics/dashboard/reports
    if (user.role === 'ceo' && (req.module === 'dashboard' || req.module === 'reports')) {
      return true;
    }
    return false;
  }

  return perms.includes(req.action);
}

/**
 * Check if a user has a specific granular action on a module
 */
export function hasPermission(
  user: UserAccount | null | undefined,
  moduleName: keyof UserAccount['permissions'] | string,
  action: PermissionAction = 'view'
): boolean {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (user.status === 'locked' || user.status === 'inactive' || user.isLocked) return false;

  if (user.role === 'admin' && action !== 'delete' && moduleName !== 'api_integrations') return true;

  const userPerms = (user.permissions as Record<string, PermissionAction[] | undefined>)?.[moduleName];
  if (!userPerms || !Array.isArray(userPerms)) return false;

  return userPerms.includes(action);
}

/**
 * Get human-readable permission requirements for a given view
 */
export function getRequiredPermissionForView(view: ViewMode): ViewPermissionRequirement {
  return VIEW_PERMISSION_MAP[view] || {
    view,
    module: 'dashboard',
    action: 'view',
    label: view,
    category: 'Chung',
    description: 'Quyền truy cập phân hệ hệ thống.'
  };
}
