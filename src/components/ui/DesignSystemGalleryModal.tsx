import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Plus,
  Trash2,
  Search,
  Filter,
  Download,
  Calendar,
  Eye,
  Sliders,
  Maximize2,
  Smartphone,
  Tablet,
  Laptop,
  Monitor
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Input,
  Select,
  Combobox,
  DatePicker,
  NumberInput,
  Textarea,
  Checkbox,
  RadioGroup,
  Switch,
  Modal,
  Drawer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  EmptyState,
  KpiCard
} from './index';

interface DesignSystemGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesignSystemGalleryModal: React.FC<DesignSystemGalleryModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'buttons' | 'forms' | 'cards_tables' | 'overlays'>('tokens');
  
  // Interactive form state demo
  const [inputValue, setInputValue] = useState('Doanh Nghiệp An Phát');
  const [numberValue, setNumberValue] = useState(15450000);
  const [selectedBranch, setSelectedBranch] = useState('BR01');
  const [selectedWarehouse, setSelectedWarehouse] = useState('WH01');
  const [dateValue, setDateValue] = useState('2026-08-24');
  const [textareaValue, setTextareaValue] = useState('Ghi chú vận chuyển hàng hóa tiêu chuẩn.');
  const [chkAgree, setChkAgree] = useState(true);
  const [radioRole, setRadioRole] = useState('MANAGER');
  const [switchActive, setSwitchActive] = useState(true);
  
  // Overlay state demos
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState(false);
  const [drawerSize, setDrawerSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [tablePage, setTablePage] = useState(1);

  const sampleTableData = [
    { id: 'ORD-2026-001', customer: 'Công ty TNHH Minh Long', branch: 'Chi nhánh Hà Nội', total: 18500000, date: '2026-08-24', status: 'SUCCESS' as const },
    { id: 'ORD-2026-002', customer: 'Hộ KD Vàng Bạc Hải Yến', branch: 'Chi nhánh TP.HCM', total: 6420000, date: '2026-08-23', status: 'WARNING' as const },
    { id: 'ORD-2026-003', customer: 'Nhà phân phối Tân Thuận', branch: 'Chi nhánh Đà Nẵng', total: 42000000, date: '2026-08-22', status: 'INFO' as const },
    { id: 'ORD-2026-004', customer: 'Cửa hàng Bách Hóa 247', branch: 'Chi nhánh Hà Nội', total: 1200000, date: '2026-08-21', status: 'DANGER' as const },
    { id: 'ORD-2026-005', customer: 'Đại lý Thực phẩm Sạch', branch: 'Chi nhánh Cần Thơ', total: 9800000, date: '2026-08-20', status: 'NEUTRAL' as const }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">BizOne Design System & UI Foundation</h2>
            <p className="text-xs text-slate-500 font-normal">Minimal • Elegant • Premium • Business-First Guidelines</p>
          </div>
        </div>
      }
    >
      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tokens')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'tokens' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          1. Color & Typography
        </button>
        <button
          onClick={() => setActiveTab('buttons')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'buttons' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          2. Buttons & Badges
        </button>
        <button
          onClick={() => setActiveTab('forms')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'forms' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          3. Forms & Inputs
        </button>
        <button
          onClick={() => setActiveTab('cards_tables')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'cards_tables' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          4. Cards, KPIs & Tables
        </button>
        <button
          onClick={() => setActiveTab('overlays')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'overlays' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          5. Modals & Drawers
        </button>
      </div>

      {/* Tab 1: Color Tokens & Typography */}
      {activeTab === 'tokens' && (
        <div className="space-y-6 pt-2">
          {/* Color Tokens */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Semantic Color System</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <div className="h-6 w-full rounded bg-slate-900" />
                <p className="text-xs font-semibold text-slate-900">Primary</p>
                <p className="text-[11px] text-slate-500 font-mono">#0f172a / Slate 900</p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <div className="h-6 w-full rounded bg-emerald-600" />
                <p className="text-xs font-semibold text-slate-900">Success</p>
                <p className="text-[11px] text-slate-500 font-mono">#059669 / Emerald 600</p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <div className="h-6 w-full rounded bg-amber-600" />
                <p className="text-xs font-semibold text-slate-900">Warning</p>
                <p className="text-[11px] text-slate-500 font-mono">#d97706 / Amber 600</p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <div className="h-6 w-full rounded bg-rose-600" />
                <p className="text-xs font-semibold text-slate-900">Danger</p>
                <p className="text-[11px] text-slate-500 font-mono">#dc2626 / Rose 600</p>
              </div>
            </div>
          </div>

          {/* Typography Hierarchy */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Typography Scale</h4>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div>
                <span className="text-xs text-slate-400 font-mono block">Page Title</span>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tổng Quan Báo Cáo Tài Chính</h1>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-mono block">Section Title</span>
                <h2 className="text-base font-semibold text-slate-900">Doanh Thu & Đơn Hàng Theo Chi Nhánh</h2>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-mono block">Body Text</span>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Hệ thống BizOne ERP chuẩn hóa luồng giao dịch đa chi nhánh và kiểm soát tồn kho tự động.
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-mono block">KPI & Financial Numbers (Tabular)</span>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">450.280.000 ₫</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Buttons & Badges */}
      {activeTab === 'buttons' && (
        <div className="space-y-6 pt-2">
          {/* Button Variants */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Standardized Buttons</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                Primary Button
              </Button>
              <Button variant="secondary" leftIcon={<Filter className="w-4 h-4" />}>
                Secondary Button
              </Button>
              <Button variant="outline">
                Outline Button
              </Button>
              <Button variant="ghost">
                Ghost Action
              </Button>
              <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>
                Danger Action
              </Button>
              <Button variant="primary" isLoading>
                Loading State
              </Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
            </div>
          </div>

          {/* Button Sizes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Button Sizes</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="xs" variant="secondary">Size XS</Button>
              <Button size="sm" variant="secondary">Size SM</Button>
              <Button size="md" variant="secondary">Size MD (Default)</Button>
              <Button size="lg" variant="primary">Size LG</Button>
            </div>
          </div>

          {/* Semantic Status Badges */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Semantic Status Badges</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="success" dot leftIcon={<CheckCircle2 className="w-3 h-3" />}>
                HOÀN THÀNH
              </Badge>
              <Badge variant="warning" dot leftIcon={<AlertTriangle className="w-3 h-3" />}>
                CẦN XỬ LÝ
              </Badge>
              <Badge variant="danger" dot leftIcon={<XCircle className="w-3 h-3" />}>
                ĐÃ HỦY
              </Badge>
              <Badge variant="info" dot leftIcon={<Info className="w-3 h-3" />}>
                ĐANG GIAO HÀNG
              </Badge>
              <Badge variant="neutral" dot>
                BẢN NHÁP
              </Badge>
              <Badge variant="primary">
                DOANH NGHIỆP
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Forms & Inputs */}
      {activeTab === 'forms' && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tên Doanh Nghiệp / Hộ KD"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="Nhập tên pháp lý theo giấy phép ĐKKD"
              required
            />

            <NumberInput
              label="Hạn Mức Tín Dụng"
              value={numberValue}
              onChange={(val) => setNumberValue(val)}
              suffix="VNĐ"
              helperText="Số tiền giới hạn công nợ cho phép"
            />

            <Select
              label="Chi Nhánh Trực Thuộc"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              options={[
                { value: 'BR01', label: 'Chi nhánh Trung Tâm Hà Nội' },
                { value: 'BR02', label: 'Chi nhánh Sài Gòn Quận 1' },
                { value: 'BR03', label: 'Chi nhánh Đà Nẵng Hải Châu' }
              ]}
            />

            <Combobox
              label="Kho Hàng Mặc Định"
              value={selectedWarehouse}
              onChange={(val) => setSelectedWarehouse(val)}
              options={[
                { value: 'WH01', label: 'Kho Tổng Miền Bắc', sublabel: 'Chi nhánh Hà Nội • Sức chứa 95%' },
                { value: 'WH02', label: 'Kho Trưng Bày', sublabel: 'Chi nhánh Hà Nội' },
                { value: 'WH03', label: 'Kho Tổng Miền Nam', sublabel: 'Chi nhánh TP.HCM' },
                { value: 'WH04', label: 'Kho Trung Chuyển Miền Trung', sublabel: 'Chi nhánh Đà Nẵng' }
              ]}
            />

            <DatePicker
              label="Ngày Ký Hợp Đồng"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
            />

            <div className="sm:col-span-2">
              <Textarea
                label="Ghi Chú Đơn Hàng"
                value={textareaValue}
                onChange={(e) => setTextareaValue(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Checkbox
              label="Tự Động Xuất Hóa Đơn Điện Tử"
              description="Tích hợp cơ quan thuế chuẩn TT78"
              checked={chkAgree}
              onChange={(e) => setChkAgree(e.target.checked)}
            />

            <Switch
              label="Kích Hoạt Tài Khoản"
              description="Cho phép đăng nhập POS & ERP"
              checked={switchActive}
              onChange={(val) => setSwitchActive(val)}
            />

            <RadioGroup
              name="demo-roles"
              label="Vai Trò Quyền Hạn"
              value={radioRole}
              onChange={(val) => setRadioRole(val)}
              options={[
                { value: 'MANAGER', label: 'Quản Lý Chi Nhánh' },
                { value: 'STAFF', label: 'Nhân Viên Bán Hàng' }
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 4: Cards, KPIs & Tables */}
      {activeTab === 'cards_tables' && (
        <div className="space-y-6 pt-2">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard
              title="Tổng Doanh Thu Ngày"
              value="84.250.000 ₫"
              subValue="Mục tiêu: 100M"
              change={{ value: 14.8, trend: 'up', label: 'so với hôm qua' }}
            />
            <KpiCard
              title="Số Lượng Đơn Hàng"
              value="128"
              subValue="98.5% giao đúng hạn"
              change={{ value: 5.2, trend: 'up' }}
            />
            <KpiCard
              title="Giá Trị Tồn Kho"
              value="1.240.000.000 ₫"
              subValue="4 Kho hàng"
              change={{ value: -2.1, trend: 'down', label: 'tối ưu vòng quay' }}
            />
          </div>

          {/* Standardized Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Standardized Table System</h4>
              <Badge variant="neutral" size="sm">5 Giao Dịch Mới Nhất</Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã Đơn</TableHead>
                  <TableHead>Khách Hàng</TableHead>
                  <TableHead>Chi Nhánh</TableHead>
                  <TableHead align="right">Tổng Tiền</TableHead>
                  <TableHead align="center">Ngày Lập</TableHead>
                  <TableHead align="center">Trạng Thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleTableData.map((row) => (
                  <TableRow key={row.id} isClickable>
                    <TableCell className="font-mono font-medium text-slate-900">{row.id}</TableCell>
                    <TableCell className="font-medium">{row.customer}</TableCell>
                    <TableCell className="text-slate-600">{row.branch}</TableCell>
                    <TableCell align="right" isNumeric className="font-semibold text-slate-900">
                      {row.total.toLocaleString('vi-VN')} ₫
                    </TableCell>
                    <TableCell align="center" className="text-slate-500 tabular-nums">
                      {row.date}
                    </TableCell>
                    <TableCell align="center">
                      <Badge variant={row.status} size="sm" dot>
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              currentPage={tablePage}
              totalPages={5}
              totalItems={25}
              pageSize={5}
              onPageChange={(p) => setTablePage(p)}
            />
          </div>
        </div>
      )}

      {/* Tab 5: Modals & Drawers */}
      {activeTab === 'overlays' && (
        <div className="space-y-6 pt-2">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">Overlay Dialog & Sheet Controls</h4>
            <p className="text-xs text-slate-600 leading-normal">
              Modal được tối ưu hóa cho thao tác ngắn, xác nhận, và nhập liệu nhanh. Drawer được tối ưu cho chi tiết phiếu, bộ lọc nâng cao, và xem ngữ cảnh trên cả Desktop và Mobile Bottom Sheet.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={() => setIsDemoModalOpen(true)}
              >
                Mở Demo Modal (Thao tác ngắn)
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  setDrawerSize('md');
                  setIsDemoDrawerOpen(true);
                }}
              >
                Mở Demo Drawer (Chi tiết / Bộ lọc)
              </Button>
            </div>
          </div>

          {/* Sub-Demo Modal */}
          <Modal
            isOpen={isDemoModalOpen}
            onClose={() => setIsDemoModalOpen(false)}
            size="md"
            title="Xác Nhận Xuất Kho Hàng Hóa"
            description="Vui lòng kiểm tra mã phiếu và thủ kho phụ trách trước khi hoàn tất."
            footer={
              <>
                <Button variant="secondary" onClick={() => setIsDemoModalOpen(false)}>
                  Hủy Bỏ
                </Button>
                <Button variant="primary" onClick={() => setIsDemoModalOpen(false)}>
                  Xác Nhận Xuất Kho
                </Button>
              </>
            }
          >
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                Phiếu xuất kho <span className="font-semibold text-slate-900 font-mono">PXK-2026-088</span> sẽ được trừ trực tiếp khỏi tồn kho tức thì.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>Hành động này được ghi vào Audit Log bảo mật hệ thống.</span>
              </div>
            </div>
          </Modal>

          {/* Sub-Demo Drawer */}
          <Drawer
            isOpen={isDemoDrawerOpen}
            onClose={() => setIsDemoDrawerOpen(false)}
            size={drawerSize}
            title="Chi Tiết Đơn Hàng & Vận Đơn"
            description="Mã giao dịch: ORD-2026-001 • Khởi tạo bởi Admin"
            footer={
              <>
                <Button variant="secondary" onClick={() => setIsDemoDrawerOpen(false)}>
                  Đóng
                </Button>
                <Button variant="primary" onClick={() => setIsDemoDrawerOpen(false)}>
                  Lưu Thay Đổi
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Khách hàng:</span>
                  <span className="font-semibold text-slate-900">Công ty TNHH Minh Long</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Tổng thanh toán:</span>
                  <span className="font-bold text-slate-900 tabular-nums">18.500.000 ₫</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Trạng thái:</span>
                  <Badge variant="success" size="sm" dot>HOÀN THÀNH</Badge>
                </div>
              </div>

              <Input label="Mã Vận Đơn ViettelPost" defaultValue="VTP-884920194" />
              <DatePicker label="Thời Gian Giao Dự Kiến" defaultValue="2026-08-26" />
              <Textarea label="Ghi Chú Giao Hàng" defaultValue="Giao giờ hành chính, gọi trước 15 phút." />
            </div>
          </Drawer>
        </div>
      )}
    </Modal>
  );
};
