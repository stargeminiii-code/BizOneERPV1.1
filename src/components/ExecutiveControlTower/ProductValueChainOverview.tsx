import React from 'react';
import {
  FlaskConical,
  Truck,
  Boxes,
  Factory,
  CheckCircle2,
  Package,
  Megaphone,
  ShoppingCart,
  MapPin,
  HeartHandshake,
  DollarSign,
  PieChart,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { BusinessFunctionMetric } from '../../data/controlTowerData';

interface ValueChainStage {
  id: string;
  category: string;
  name: string;
  shortLabel: string;
  icon: React.ElementType;
  plan: string;
  actual: string;
  rate: number;
  qualityScore: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  keyMetric: string;
  responsible: string;
}

interface ProductValueChainOverviewProps {
  onSelectStage: (category: string) => void;
}

export const ProductValueChainOverview: React.FC<ProductValueChainOverviewProps> = ({
  onSelectStage
}) => {
  const chainStages: ValueChainStage[] = [
    {
      id: 'stg-rd',
      category: 'rd',
      name: 'R&D & Phát Triển Sản Phẩm',
      shortLabel: 'R&D',
      icon: FlaskConical,
      plan: '10 Dự án',
      actual: '9 Dự án',
      rate: 90.0,
      qualityScore: 94,
      status: 'good',
      keyMetric: 'Tiến độ 90.0% • 3 SKU mới',
      responsible: 'TS. Hoàng Hải'
    },
    {
      id: 'stg-procurement',
      category: 'procurement',
      name: 'Mua Hàng & Nhà Cung Cấp',
      shortLabel: 'Mua Hàng',
      icon: Truck,
      plan: '25.0 Tỷ',
      actual: '23.8 Tỷ',
      rate: 95.2,
      qualityScore: 96,
      status: 'good',
      keyMetric: 'Tiết kiệm 4.8% • Lead Time 4.2d',
      responsible: 'Nguyễn Văn Hùng'
    },
    {
      id: 'stg-raw-materials',
      category: 'warehouse',
      name: 'Kho Nguyên Vật Liệu & FIFO',
      shortLabel: 'Kho NVL',
      icon: Boxes,
      plan: '12.0 Tỷ',
      actual: '11.8 Tỷ',
      rate: 98.3,
      qualityScore: 99,
      status: 'excellent',
      keyMetric: 'Đúng chuẩn FIFO • Tồn tối ưu',
      responsible: 'Trần Văn Cường'
    },
    {
      id: 'stg-production',
      category: 'production',
      name: 'Sản Xuất & OEE Nhà Máy',
      shortLabel: 'Sản Xuất',
      icon: Factory,
      plan: '5,000 Tấn',
      actual: '4,650 Tấn',
      rate: 93.0,
      qualityScore: 92,
      status: 'warning',
      keyMetric: 'OEE 84.5% • Downtime 4.2h',
      responsible: 'KS. Vũ Đình Trọng'
    },
    {
      id: 'stg-qa-qc',
      category: 'qa_qc',
      name: 'Kiểm Soát Chất Lượng QA/QC',
      shortLabel: 'QA/QC',
      icon: ShieldCheck,
      plan: '100% Đạt',
      actual: '98.8%',
      rate: 98.8,
      qualityScore: 98,
      status: 'excellent',
      keyMetric: 'First Pass Yield 98.8%',
      responsible: 'ThS. Nguyễn Quỳnh'
    },
    {
      id: 'stg-finished-goods',
      category: 'warehouse',
      name: 'Kho Thành Phẩm & Sẵn Sàng',
      shortLabel: 'Kho TP',
      icon: Package,
      plan: '18.0 Tỷ',
      actual: '17.5 Tỷ',
      rate: 97.2,
      qualityScore: 97,
      status: 'good',
      keyMetric: 'Tồn kho lưu thông 8.5 vòng',
      responsible: 'Trần Văn Cường'
    },
    {
      id: 'stg-marketing',
      category: 'marketing',
      name: 'Marketing Đa Kênh & GenSeo',
      shortLabel: 'Marketing',
      icon: Megaphone,
      plan: '5,000 Leads',
      actual: '4,750 Leads',
      rate: 95.0,
      qualityScore: 89,
      status: 'good',
      keyMetric: 'ROI 5.04x • CPL 42,000 đ',
      responsible: 'Đỗ Thùy Linh'
    },
    {
      id: 'stg-sales',
      category: 'sales',
      name: 'Bán Hàng & Chốt Hợp Đồng',
      shortLabel: 'Bán Hàng',
      icon: ShoppingCart,
      plan: '40.0 Tỷ',
      actual: '35.6 Tỷ',
      rate: 89.0,
      qualityScore: 88,
      status: 'warning',
      keyMetric: '4,180 Đơn • 85 Deal B2B',
      responsible: 'Lê Hoàng Nam'
    },
    {
      id: 'stg-logistics',
      category: 'logistics',
      name: 'Vận Chuyển & Giao Hàng OTIF',
      shortLabel: 'Logistics',
      icon: MapPin,
      plan: '100% Kịp',
      actual: '97.8%',
      rate: 97.8,
      qualityScore: 98,
      status: 'good',
      keyMetric: 'OTIF 97.8% • Chi phí xe 2.2%',
      responsible: 'Phạm Quốc Bảo'
    },
    {
      id: 'stg-cskh',
      category: 'cskh',
      name: 'CSKH, Loyalty & Hậu Mãi',
      shortLabel: 'CSKH',
      icon: HeartHandshake,
      plan: '95 Điểm',
      actual: '96.5 Điểm',
      rate: 101.5,
      qualityScore: 97,
      status: 'excellent',
      keyMetric: 'CSAT 96.5% • NPS +72',
      responsible: 'Trần Phương Thảo'
    },
    {
      id: 'stg-finance-collection',
      category: 'finance',
      name: 'Thu Tiền, Công Nợ & Dòng Tiền',
      shortLabel: 'Dòng Tiền',
      icon: DollarSign,
      plan: '38.0 Tỷ',
      actual: '40.96 Tỷ',
      rate: 107.8,
      qualityScore: 99,
      status: 'excellent',
      keyMetric: 'Thu đạt 107.8% • DSO 28 ngày',
      responsible: 'Phạm Minh Đức'
    },
    {
      id: 'stg-pl-outcome',
      category: 'finance',
      name: 'Tài Chính & Lợi Nhuận P&L',
      shortLabel: 'P&L',
      icon: PieChart,
      plan: '8.80 Tỷ Lãi',
      actual: '7.83 Tỷ Lãi',
      rate: 89.0,
      qualityScore: 94,
      status: 'warning',
      keyMetric: 'Biên lãi gộp 24.2% • ROI 18.5%',
      responsible: 'Phạm Minh Đức'
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200">
              End-to-End Value Chain
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span>CHUỖI GIÁ TRỊ DOANH NGHIỆP LIÊN THÔNG</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Nghiên cứu & Mua hàng → Sản xuất → Kho → Bán hàng → Giao vận → CSKH → Tài chính
          </p>
        </div>

        <span className="text-[11px] text-slate-500 font-semibold italic">
          Click vào bất kỳ mắt xích nào để mở phân rã chi tiết
        </span>
      </div>

      {/* Horizontal Scrollable Chain Flow */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex items-stretch gap-2.5 min-w-[1250px]">
          {chainStages.map((stage, idx) => {
            const Icon = stage.icon;
            const isCritical = stage.status === 'critical';
            const isWarning = stage.status === 'warning';
            const isExcellent = stage.status === 'excellent';

            return (
              <React.Fragment key={stage.id}>
                <button
                  type="button"
                  onClick={() => onSelectStage(stage.category)}
                  className={`flex-1 min-w-[135px] max-w-[170px] rounded-2xl p-3 border text-left transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between space-y-2 group ${
                    isCritical
                      ? 'border-rose-300 bg-rose-50/20 hover:bg-rose-50/40'
                      : isWarning
                      ? 'border-amber-300 bg-amber-50/20 hover:bg-amber-50/40'
                      : isExcellent
                      ? 'border-emerald-300 bg-emerald-50/20 hover:bg-emerald-50/40'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : isExcellent
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {stage.rate}%
                      </span>
                    </div>

                    <span className="font-extrabold text-xs text-slate-900 block truncate group-hover:text-blue-600 transition-colors">
                      {stage.shortLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">
                      {stage.responsible}
                    </span>
                  </div>

                  <div className="space-y-1 pt-1.5 border-t border-slate-200/70">
                    <div className="text-[10px] text-slate-700 font-bold leading-tight">
                      {stage.keyMetric}
                    </div>

                    <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isCritical
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-500'
                            : isExcellent
                            ? 'bg-emerald-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(stage.rate, 100)}%` }}
                      />
                    </div>
                  </div>
                </button>

                {idx < chainStages.length - 1 && (
                  <div className="flex items-center justify-center text-slate-300">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
