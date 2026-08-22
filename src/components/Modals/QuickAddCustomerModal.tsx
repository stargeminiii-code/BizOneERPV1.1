import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Building2,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Search,
  CreditCard
} from 'lucide-react';
import { Customer, Supplier } from '../../types';
import { lookupTaxCode, normalizeTaxCode } from '../../services/taxCodeService';
import {
  VIETNAM_PROVINCES_BY_REGION,
  PAYMENT_TERM_PRESETS,
  formatNumberWithDots,
  parseFormattedNumber
} from '../../data/administrativeData';

interface QuickAddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomer: (customer: Customer) => void;
  onSaveSupplier?: (supplier: Supplier) => void;
  existingCustomers?: Customer[];
  existingSuppliers?: Supplier[];
}

export const QuickAddCustomerModal: React.FC<QuickAddCustomerModalProps> = ({
  isOpen,
  onClose,
  onSaveCustomer,
  onSaveSupplier,
  existingCustomers = [],
  existingSuppliers = []
}) => {
  const [partnerType, setPartnerType] = useState<'customer' | 'supplier'>('customer');
  const [taxCode, setTaxCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState<'VIP' | 'Doanh nghiệp' | 'Đại lý' | 'Cá nhân'>('Doanh nghiệp');
  const [city, setCity] = useState('Hà Nội');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimitInput, setCreditLimitInput] = useState('50.000.000');
  const [paymentTermRatio, setPaymentTermRatio] = useState<
    '100_prepaid' | '70_30' | '50_50' | '30_70' | '100_postpaid' | 'custom'
  >('70_30');

  // Tax lookup states
  const [isLookingUpTax, setIsLookingUpTax] = useState(false);
  const [taxLookupSuccess, setTaxLookupSuccess] = useState(false);
  const [taxLookupError, setTaxLookupError] = useState('');

  if (!isOpen) return null;

  const handleLookupTax = async () => {
    const cleanTax = normalizeTaxCode(taxCode);
    if (!cleanTax || cleanTax.length < 8) {
      setTaxLookupError('Vui lòng nhập MST hợp lệ (8 - 14 số)');
      return;
    }

    setIsLookingUpTax(true);
    setTaxLookupError('');
    setTaxLookupSuccess(false);

    try {
      const result = await lookupTaxCode(cleanTax);
      setTaxCode(result.taxCode || cleanTax);
      setName(result.name || result.legalName || name);
      if (result.address) setAddress(result.address);
      if (result.city) setCity(result.city);
      if (result.district) setDistrict(result.district);
      if (result.phone && !phone) setPhone(result.phone);
      if (result.email && !email) setEmail(result.email);
      setTaxLookupSuccess(true);
      setGroup('Doanh nghiệp');
    } catch (err: any) {
      setTaxLookupError(err.message || 'Không tìm thấy thông tin cho Mã số thuế này');
    } finally {
      setIsLookingUpTax(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên khách hàng / doanh nghiệp!');
      return;
    }
    if (!phone.trim()) {
      alert('Vui lòng nhập số điện thoại liên hệ!');
      return;
    }

    const nextCustNum = existingCustomers.length + 1;
    const nextSupNum = existingSuppliers.length + 1;
    const creditLimit = parseFormattedNumber(creditLimitInput);

    if (partnerType === 'customer') {
      const newCustomer: Customer = {
        id: `c-${Date.now()}`,
        code: `KH-${String(nextCustNum).padStart(3, '0')}`,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || city,
        city: city.trim(),
        district: district.trim() || undefined,
        country: 'Việt Nam',
        isInternational: false,
        taxCode: taxCode.trim() || undefined,
        debt: 0,
        creditLimit: creditLimit || 50000000,
        paymentTermRatio,
        prepaymentPercent: paymentTermRatio === '100_prepaid' ? 100 : paymentTermRatio === '70_30' ? 70 : 50,
        creditPercent: paymentTermRatio === '100_prepaid' ? 0 : paymentTermRatio === '70_30' ? 30 : 50,
        creditTermDays: 30,
        creditTermsSummary: paymentTermRatio === '100_prepaid' ? 'Trả trước 100%' : 'Trả trước 70% - Nợ 30% (30 ngày)',
        totalSpent: 0,
        lastPurchaseDate: 'Chưa có',
        group,
        assignedStaff: 'Lê Hoàng Nam',
        assignedStaffRole: 'Chuyên viên Kinh Doanh',
        assignedStaffPhone: '0912 345 678',
        status: 'active',
        aiNotes: 'Khách hàng tạo nhanh trực tiếp từ Đơn hàng bán',
        notes: '',
        createdAt: new Date().toISOString().slice(0, 10)
      };
      onSaveCustomer(newCustomer);
    } else if (onSaveSupplier) {
      const newSupplier: Supplier = {
        id: `sup-${Date.now()}`,
        code: `NCC-${String(nextSupNum).padStart(3, '0')}`,
        name: name.trim(),
        legalName: name.trim(),
        taxCode: taxCode.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || '',
        address: address.trim() || city,
        city: city.trim(),
        district: district.trim() || undefined,
        debt: 0,
        creditLimit: creditLimit || 100000000,
        paymentTermDays: 30,
        suppliedProducts: [],
        status: 'active',
        createdAt: new Date().toISOString().slice(0, 10)
      };
      onSaveSupplier(newSupplier);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-60 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">Tạo Nhanh Khách Hàng / Đối Tác</h3>
              <p className="text-[11px] text-blue-100">Thêm hồ sơ tức thì và tự động chọn cho Đơn Bán Hàng</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
          {/* Partner Type Toggle */}
          <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setPartnerType('customer')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                partnerType === 'customer'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👤 Khách Hàng (Người Mua)
            </button>
            <button
              type="button"
              onClick={() => setPartnerType('supplier')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                partnerType === 'supplier'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏢 Nhà Cung Cấp / Đối Tác
            </button>
          </div>

          {/* Quick Tax Lookup */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Tra cứu MST Doanh nghiệp</span>
              </label>
              {taxLookupSuccess && (
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Đã tìm thấy
                </span>
              )}
            </div>

            <div className="flex gap-1.5">
              <input
                type="text"
                value={taxCode}
                onChange={(e) => {
                  setTaxCode(e.target.value);
                  if (taxLookupError) setTaxLookupError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookupTax();
                  }
                }}
                placeholder="Nhập MST (Ví dụ: 0900189284, 3700381324...)"
                className="flex-1 font-mono font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleLookupTax}
                disabled={isLookingUpTax || !taxCode.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
              >
                {isLookingUpTax ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Tra cứu</span>
              </button>
            </div>

            {taxLookupError && (
              <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> {taxLookupError}
              </p>
            )}
          </div>

          {/* Name & Phone */}
          <div className="space-y-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tên Khách hàng / Doanh nghiệp <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Đại lý Thép & Nông Sản Minh Phát"
                required
                className="w-full font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xx xxx xxx"
                    required
                    className="w-full pl-8 pr-2.5 py-1.5 font-mono font-bold border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phân nhóm</label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-800 font-bold focus:outline-none"
                >
                  <option value="Doanh nghiệp">Doanh nghiệp</option>
                  <option value="Đại lý">Đại lý cấp 1/2</option>
                  <option value="VIP">Khách VIP</option>
                  <option value="Cá nhân">Cá nhân</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location / Province */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tỉnh / Thành phố</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-800 font-bold focus:outline-none"
              >
                {VIETNAM_PROVINCES_BY_REGION.map((group) => (
                  <optgroup key={group.region} label={group.region}>
                    {group.provinces.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Quận / Huyện</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Quận/Huyện..."
                className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Địa chỉ giao nhận chi tiết</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số nhà, đường, khu công nghiệp, kho nhận..."
              className="w-full border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-slate-800 focus:outline-none"
            />
          </div>

          {/* Credit Limit & Terms */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Hạn mức công nợ & Điều khoản</span>
              </label>
              <span className="text-[10px] text-slate-500">Tùy chọn</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Hạn mức nợ tối đa (VND)</label>
                <input
                  type="text"
                  value={creditLimitInput}
                  onChange={(e) => {
                    const num = parseFormattedNumber(e.target.value);
                    setCreditLimitInput(formatNumberWithDots(num));
                  }}
                  className="w-full font-mono font-bold border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Tỷ lệ thanh toán</label>
                <select
                  value={paymentTermRatio}
                  onChange={(e) => setPaymentTermRatio(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-800 font-semibold focus:outline-none"
                >
                  <option value="70_30">Trả trước 70% - Nợ 30%</option>
                  <option value="50_50">Trả trước 50% - Nợ 50%</option>
                  <option value="100_prepaid">Trả trước 100% (Tiền mặt/QR)</option>
                  <option value="100_postpaid">Công nợ 100% (Gối đầu)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu & Chọn Khách Hàng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
