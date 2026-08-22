import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CreditCard,
  Building2,
  ShieldCheck,
  RotateCw,
  Globe,
  Flag,
  Percent,
  Calendar,
  Briefcase,
  Layers,
  ChevronDown,
  Info,
  DollarSign
} from 'lucide-react';
import { Customer } from '../../types';
import { lookupTaxCode, normalizeTaxCode } from '../../services/taxCodeService';
import {
  VIETNAM_PROVINCES_BY_REGION,
  ALL_VIETNAM_PROVINCES,
  INTERNATIONAL_COUNTRIES,
  SALES_STAFF_LIST,
  PAYMENT_TERM_PRESETS,
  PaymentTermPreset,
  formatNumberWithDots,
  parseFormattedNumber
} from '../../data/administrativeData';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomer: (customer: Customer) => void;
  customerToEdit?: Customer | null;
  existingCustomers?: Customer[];
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSaveCustomer,
  customerToEdit,
  existingCustomers = []
}) => {
  // Identification
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState<'VIP' | 'Doanh nghiệp' | 'Đại lý' | 'Cá nhân'>('Doanh nghiệp');
  const [taxCode, setTaxCode] = useState('');
  const [representative, setRepresentative] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  // Location & Geographic state
  const [isInternational, setIsInternational] = useState<boolean>(false);
  const [country, setCountry] = useState('Việt Nam');
  const [city, setCity] = useState('Hà Nội');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');

  // Sales Staff assignment
  const [selectedStaffId, setSelectedStaffId] = useState('staff-01');
  const [customStaffName, setCustomStaffName] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('Lê Hoàng Nam');
  const [assignedStaffRole, setAssignedStaffRole] = useState('Chuyên viên Sales Thép & Kim Khí KV1');
  const [assignedStaffPhone, setAssignedStaffPhone] = useState('0912 345 678');

  // Credit Limit & Debts (Formatted with dots)
  const [debtInput, setDebtInput] = useState<string>('0');
  const [creditLimitInput, setCreditLimitInput] = useState<string>('50.000.000');

  // Credit Terms & Payment Ratios
  const [paymentTermRatio, setPaymentTermRatio] = useState<
    '100_prepaid' | '70_30' | '50_50' | '30_70' | '100_postpaid' | 'custom'
  >('70_30');
  const [prepaymentPercent, setPrepaymentPercent] = useState<number>(70);
  const [creditPercent, setCreditPercent] = useState<number>(30);
  const [creditTermDays, setCreditTermDays] = useState<number>(30);
  const [customTermNotes, setCustomTermNotes] = useState('');

  // Strategy & Notes
  const [aiNotes, setAiNotes] = useState('');
  const [notes, setNotes] = useState('');

  // Tax lookup states
  const [isLookingUpTax, setIsLookingUpTax] = useState(false);
  const [taxLookupSuccess, setTaxLookupSuccess] = useState(false);
  const [taxLookupError, setTaxLookupError] = useState('');

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (customerToEdit) {
      setCode(customerToEdit.code || '');
      setName(customerToEdit.name || '');
      setPhone(customerToEdit.phone || '');
      setEmail(customerToEdit.email || '');
      setGroup(customerToEdit.group || 'Doanh nghiệp');
      setTaxCode(customerToEdit.taxCode || '');
      setRepresentative(customerToEdit.representative || '');
      setContactPerson(customerToEdit.contactPerson || '');

      // Geographic
      const isIntl = customerToEdit.isInternational || (customerToEdit.country && customerToEdit.country !== 'Việt Nam') || false;
      setIsInternational(isIntl);
      setCountry(customerToEdit.country || (isIntl ? 'Lào (Laos)' : 'Việt Nam'));
      setCity(customerToEdit.city || (isIntl ? 'Vientiane' : 'Hà Nội'));
      setDistrict(customerToEdit.district || '');
      setAddress(customerToEdit.address || '');

      // Sales staff
      const staffMatch = SALES_STAFF_LIST.find((s) => s.name === customerToEdit.assignedStaff);
      if (staffMatch) {
        setSelectedStaffId(staffMatch.id);
        setAssignedStaff(staffMatch.name);
        setAssignedStaffRole(staffMatch.role);
        setAssignedStaffPhone(staffMatch.phone);
        setCustomStaffName('');
      } else if (customerToEdit.assignedStaff) {
        setSelectedStaffId('custom');
        setCustomStaffName(customerToEdit.assignedStaff);
        setAssignedStaff(customerToEdit.assignedStaff);
        setAssignedStaffRole(customerToEdit.assignedStaffRole || 'Chuyên viên phụ trách');
        setAssignedStaffPhone(customerToEdit.assignedStaffPhone || '');
      } else {
        setSelectedStaffId('staff-01');
        setAssignedStaff('Lê Hoàng Nam');
        setAssignedStaffRole('Chuyên viên Sales Thép & Kim Khí KV1');
        setAssignedStaffPhone('0912 345 678');
      }

      // Debt & credit
      setDebtInput(formatNumberWithDots(customerToEdit.debt || 0));
      setCreditLimitInput(formatNumberWithDots(customerToEdit.creditLimit ?? 50000000));

      // Payment Terms
      const ratio = customerToEdit.paymentTermRatio || '70_30';
      setPaymentTermRatio(ratio);
      const preset = PAYMENT_TERM_PRESETS.find((p) => p.id === ratio);
      setPrepaymentPercent(customerToEdit.prepaymentPercent ?? (preset ? preset.prepaymentPercent : 70));
      setCreditPercent(customerToEdit.creditPercent ?? (preset ? preset.creditPercent : 30));
      setCreditTermDays(customerToEdit.creditTermDays ?? (preset ? preset.defaultDays : 30));
      setCustomTermNotes(customerToEdit.creditTermsSummary || '');

      setAiNotes(customerToEdit.aiNotes || '');
      setNotes(customerToEdit.notes || '');
    } else {
      // Auto-generate code
      const nextNum = (existingCustomers ? existingCustomers.length : 0) + 1;
      setCode(`KH-${String(nextNum).padStart(3, '0')}`);
      setName('');
      setPhone('');
      setEmail('');
      setGroup('Doanh nghiệp');
      setTaxCode('');
      setRepresentative('');
      setContactPerson('');

      // Geographic default
      setIsInternational(false);
      setCountry('Việt Nam');
      setCity('Hà Nội');
      setDistrict('');
      setAddress('');

      // Sales staff default
      setSelectedStaffId('staff-01');
      setAssignedStaff('Lê Hoàng Nam');
      setAssignedStaffRole('Chuyên viên Sales Thép & Kim Khí KV1');
      setAssignedStaffPhone('0912 345 678');
      setCustomStaffName('');

      // Debt & Credit defaults
      setDebtInput('0');
      setCreditLimitInput('50.000.000');

      // Payment term default: 70/30
      setPaymentTermRatio('70_30');
      setPrepaymentPercent(70);
      setCreditPercent(30);
      setCreditTermDays(30);
      setCustomTermNotes('');

      setAiNotes('');
      setNotes('');
    }
    setTaxLookupSuccess(false);
    setTaxLookupError('');
  }, [isOpen, customerToEdit, existingCustomers?.length]);

  // Handle Sales Staff selection
  const handleStaffChange = (staffId: string) => {
    setSelectedStaffId(staffId);
    if (staffId === 'custom') {
      setAssignedStaff(customStaffName || 'Nhân sự phụ trách khác');
      setAssignedStaffRole('Chuyên viên kinh doanh');
    } else {
      const found = SALES_STAFF_LIST.find((s) => s.id === staffId);
      if (found) {
        setAssignedStaff(found.name);
        setAssignedStaffRole(found.role);
        setAssignedStaffPhone(found.phone);
      }
    }
  };

  // Handle Payment Term preset selection
  const handlePresetSelect = (presetId: '100_prepaid' | '70_30' | '50_50' | '30_70' | '100_postpaid' | 'custom') => {
    setPaymentTermRatio(presetId);
    const preset = PAYMENT_TERM_PRESETS.find((p) => p.id === presetId);
    if (preset && presetId !== 'custom') {
      setPrepaymentPercent(preset.prepaymentPercent);
      setCreditPercent(preset.creditPercent);
      setCreditTermDays(preset.defaultDays);
    }
  };

  // Handle slider or custom percent
  const handlePrepaymentChange = (newPrepay: number) => {
    const validPrepay = Math.max(0, Math.min(100, newPrepay));
    setPrepaymentPercent(validPrepay);
    setCreditPercent(100 - validPrepay);
    setPaymentTermRatio('custom');
  };

  // Tax Lookup Handler
  const handleLookupTax = async (mstToSearch?: string) => {
    const rawTax = mstToSearch || taxCode;
    const cleanTax = normalizeTaxCode(rawTax);

    if (!cleanTax || cleanTax.length < 8) {
      setTaxLookupError('Vui lòng nhập Mã số thuế hợp lệ (ít nhất 8 đến 14 ký tự)');
      setTaxLookupSuccess(false);
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
      if (result.city) {
        setCity(result.city);
        setIsInternational(false);
        setCountry('Việt Nam');
      }
      if (result.district) setDistrict(result.district);
      if (result.representative) {
        setRepresentative(result.representative);
        if (!contactPerson) setContactPerson(result.representative);
      }
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

  const handleDebtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numeric = parseFormattedNumber(raw);
    setDebtInput(formatNumberWithDots(numeric));
  };

  const handleCreditLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numeric = parseFormattedNumber(raw);
    setCreditLimitInput(formatNumberWithDots(numeric));
  };

  const setQuickCreditLimit = (amount: number) => {
    setCreditLimitInput(formatNumberWithDots(amount));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên khách hàng / tên công ty!');
      return;
    }
    if (!phone.trim()) {
      alert('Vui lòng nhập số điện thoại liên hệ!');
      return;
    }

    const finalDebt = parseFormattedNumber(debtInput);
    const finalCreditLimit = parseFormattedNumber(creditLimitInput);

    // Build terms summary description
    let summaryTerms = '';
    if (paymentTermRatio === '100_prepaid') {
      summaryTerms = 'Thanh toán trước 100% (Không công nợ)';
    } else if (paymentTermRatio === '100_postpaid') {
      summaryTerms = `Công nợ 100% (Hạn thanh toán trong ${creditTermDays} ngày)`;
    } else {
      summaryTerms = `Trả trước ${prepaymentPercent}%, Công nợ ${creditPercent}% (Hạn nợ ${creditTermDays} ngày)`;
    }
    if (customTermNotes.trim()) {
      summaryTerms += ` - ${customTermNotes.trim()}`;
    }

    const newCustomer: Customer = {
      id: customerToEdit ? customerToEdit.id : `c-${Date.now()}`,
      code: code.trim() || `KH-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || 'Chưa cập nhật',
      city: city.trim(),
      district: district.trim() || undefined,
      country: isInternational ? country.trim() : 'Việt Nam',
      isInternational,
      taxCode: taxCode.trim() || undefined,
      representative: representative.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
      debt: finalDebt,
      creditLimit: finalCreditLimit,
      paymentTermRatio,
      prepaymentPercent,
      creditPercent,
      creditTermDays,
      creditTermsSummary: summaryTerms,
      totalSpent: customerToEdit ? customerToEdit.totalSpent : 0,
      lastPurchaseDate: customerToEdit ? customerToEdit.lastPurchaseDate : 'Chưa có',
      group,
      assignedStaff: selectedStaffId === 'custom' ? customStaffName.trim() || 'Chuyên viên Sales' : assignedStaff,
      assignedStaffRole,
      assignedStaffPhone,
      status: 'active',
      aiNotes: aiNotes.trim() || `Khách hàng ${isInternational ? 'Quốc tế' : 'Nội địa'}, điều khoản: ${summaryTerms}.`,
      notes: notes.trim(),
      createdAt: customerToEdit?.createdAt || new Date().toISOString().slice(0, 10)
    };

    onSaveCustomer(newCustomer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 my-6">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>{customerToEdit ? 'Chỉnh Sửa Hồ Sơ Khách Hàng' : 'Thêm Khách Hàng / Đối Tác Mới'}</span>
                {isInternational && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900 shadow-xs">
                    🌐 Khách Quốc tế
                  </span>
                )}
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                {customerToEdit
                  ? `Cập nhật địa chỉ, Sales phụ trách, hạn mức & tỷ lệ công nợ cho: ${customerToEdit.code}`
                  : 'Cấu hình 63 Tỉnh/Thành Việt Nam & Nước ngoài, phân công Sales, Hạn mức & Tỷ lệ công nợ linh hoạt'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto text-xs">
          {/* Quick Tax Lookup (For Enterprises) */}
          <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Tra cứu nhanh Doanh Nghiệp qua Mã Số Thuế</span>
              </label>
              {taxLookupSuccess && (
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã lấy thông tin từ Tổng cục Thuế
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
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
                  placeholder="Nhập MST (Ví dụ: 0900189284, 3700381324, 0301402280...)"
                  className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => handleLookupTax()}
                disabled={isLookingUpTax || !taxCode.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
              >
                {isLookingUpTax ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Đang tìm...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Tra cứu MST</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample MST Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 font-medium">Gợi ý thử nhanh:</span>
              {[
                { label: '0900189284 (Thép Hòa Phát)', mst: '0900189284' },
                { label: '3700381324 (Tập đoàn Hoa Sen)', mst: '3700381324' },
                { label: '0301402280 (Thép Nam Kim)', mst: '0301402280' },
                { label: '0300456886 (Nhựa Bình Minh)', mst: '0300456886' }
              ].map((sample) => (
                <button
                  key={sample.mst}
                  type="button"
                  onClick={() => {
                    setTaxCode(sample.mst);
                    handleLookupTax(sample.mst);
                  }}
                  className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            {taxLookupError && (
              <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {taxLookupError}
              </p>
            )}
          </div>

          {/* Section 1: Customer Identity & Group */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              <span>Thông tin Khách Hàng / Doanh Nghiệp</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mã khách hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full font-mono font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white text-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Phân loại nhóm <span className="text-rose-500">*</span>
                </label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Doanh nghiệp">Doanh nghiệp / Nhà thầu</option>
                  <option value="VIP">Khách hàng VIP</option>
                  <option value="Đại lý">Đại lý cấp 1 / Đại lý cấp 2</option>
                  <option value="Cá nhân">Cá nhân / Thầu phụ</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã số thuế (MST)</label>
                <input
                  type="text"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                  placeholder="Mã số thuế doanh nghiệp"
                  className="w-full font-mono font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Tên Khách Hàng / Tên Công Ty <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Công ty CP Đầu Tư Xây Dựng An Phát..."
                  required
                  className="w-full font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xx xxx xxx"
                    required
                    className="w-full pl-8 pr-3 py-2 font-mono font-bold border border-slate-300 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email liên hệ / Hóa đơn điện tử</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ke-toan@anphat-steel.vn"
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Người đại diện / Người liên hệ phụ trách</label>
                <input
                  type="text"
                  value={representative || contactPerson}
                  onChange={(e) => {
                    setRepresentative(e.target.value);
                    setContactPerson(e.target.value);
                  }}
                  placeholder="Ví dụ: Ông Trần Quốc Bảo (GĐ Mua Hàng)"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Administrative Division & Geographic (63 Vietnam Provinces & International) */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Địa Chỉ & Hệ Thống Hành Chính (Việt Nam / Quốc Tế)</span>
              </h3>

              {/* Toggle Domestic vs International */}
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsInternational(false);
                    setCountry('Việt Nam');
                    if (!ALL_VIETNAM_PROVINCES.includes(city)) {
                      setCity('Hà Nội');
                    }
                  }}
                  className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    !isInternational ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🇻🇳 Việt Nam (Nội địa)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsInternational(true);
                    if (country === 'Việt Nam') setCountry('Lào (Laos)');
                  }}
                  className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    isInternational ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>🌐 Nước ngoài / Xuất khẩu</span>
                </button>
              </div>
            </div>

            {/* If DOMESTIC VIETNAM */}
            {!isInternational ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>
                        Tỉnh / Thành Phố (Hệ thống 63 Tỉnh Thành) <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[10px] text-blue-600 font-normal">Hành chính mới</span>
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {VIETNAM_PROVINCES_BY_REGION.map((group) => (
                        <optgroup key={group.region} label={group.region} className="font-bold text-slate-900">
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
                    <label className="block font-bold text-slate-700 mb-1">Quận / Huyện / Thị xã</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Ví dụ: Quận Cầu Giấy, Huyện Gia Lâm..."
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Địa chỉ chi tiết (Số nhà, đường, KCN, kho)</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ví dụ: Lô B2-3, KCN Nam Thăng Long, Phường Thụy Phương"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              /* If INTERNATIONAL / EXPORT */
              <div className="space-y-3 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Quốc Gia (Country / Destination) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full border border-indigo-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {INTERNATIONAL_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tỉnh / Bang / Thành Phố Quốc Tế (State / Province / City) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ví dụ: Vientiane, Phnom Penh, Bangkok, Shanghai, Tokyo..."
                      className="w-full border border-indigo-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Địa chỉ giao nhận quốc tế / Cảng dỡ hàng</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ví dụ: Cửa khẩu Quốc tế Cầu Treo / Cảng Hải Phòng / Địa chỉ kho nước sở tại"
                    className="w-full border border-indigo-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Module Sales / Nhân sự phụ trách */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-purple-600" />
                <span>Sales / Nhân Sự Phụ Trách Khách Hàng</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">Phân quyền theo dõi & CSKH</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn Chuyên Viên / Sales Phụ Trách</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => handleStaffChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {SALES_STAFF_LIST.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.code} - {staff.name} ({staff.department})
                    </option>
                  ))}
                  <option value="custom">-- Thêm nhân sự khác / Tự nhập --</option>
                </select>
              </div>

              {selectedStaffId === 'custom' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên nhân sự phụ trách</label>
                  <input
                    type="text"
                    value={customStaffName}
                    onChange={(e) => {
                      setCustomStaffName(e.target.value);
                      setAssignedStaff(e.target.value);
                    }}
                    placeholder="Nhập họ tên nhân sự..."
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">
                    {assignedStaff.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{assignedStaff}</div>
                    <div className="text-[10px] text-slate-500 truncate">{assignedStaffRole} • ĐT: {assignedStaffPhone}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Hạn Mức Công Nợ (Định dạng dấu chấm/phẩy) & Tỉ Lệ Điều Khoản Công Nợ */}
          <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Hạn Mức Tín Dụng & Tỉ Lệ Điều Khoản Công Nợ</span>
              </h3>
              <span className="text-[10px] text-amber-800 font-bold bg-amber-100/80 px-2 py-0.5 rounded-md">
                Phân cách số bằng dấu chấm (.)
              </span>
            </div>

            {/* Inputs for Debt and Credit Limit with dot format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Công nợ hiện tại / Ban đầu</label>
                <div className="relative">
                  <input
                    type="text"
                    value={debtInput}
                    onChange={handleDebtChange}
                    placeholder="0"
                    className="w-full font-mono font-bold text-sm bg-white border border-slate-300 rounded-xl pl-3 pr-8 py-2 text-rose-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">đ</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Số dư nợ khách hàng cần thanh toán
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hạn mức công nợ tối đa (Credit Limit) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={creditLimitInput}
                    onChange={handleCreditLimitChange}
                    placeholder="50.000.000"
                    className="w-full font-mono font-bold text-sm bg-white border border-slate-300 rounded-xl pl-3 pr-8 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">đ</span>
                </div>
                {/* Quick amount chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[20000000, 50000000, 100000000, 200000000, 500000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickCreditLimit(amt)}
                      className="text-[10px] font-mono px-1.5 py-0.5 bg-white hover:bg-amber-100 text-slate-600 border border-slate-200 rounded-md transition-colors cursor-pointer"
                    >
                      {amt >= 1000000000 ? `${amt / 1000000000} Tỷ` : `${amt / 1000000}Tr`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Term & Credit Ratios Presets */}
            <div className="pt-2 border-t border-amber-200/60 space-y-3">
              <label className="block font-bold text-slate-800 text-xs">
                Tỉ lệ có thể công nợ & Điều khoản thanh toán:
              </label>

              {/* Preset Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PAYMENT_TERM_PRESETS.filter((p) => p.id !== 'custom').map((preset) => {
                  const isSelected = paymentTermRatio === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-[11px]">{preset.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                        <span className="font-semibold text-emerald-700">Trả trước {preset.prepaymentPercent}%</span>
                        <span>•</span>
                        <span className="font-semibold text-amber-700">Nợ {preset.creditPercent}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Visual Proportion Bar */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Thanh toán trước: {prepaymentPercent}%
                  </span>
                  <span className="text-amber-700 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    Cho phép công nợ: {creditPercent}%
                  </span>
                </div>

                {/* Progress bar visual */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${prepaymentPercent}%` }}
                    className="bg-emerald-500 h-full transition-all duration-300"
                    title={`Trả trước: ${prepaymentPercent}%`}
                  />
                  <div
                    style={{ width: `${creditPercent}%` }}
                    className="bg-amber-500 h-full transition-all duration-300"
                    title={`Công nợ: ${creditPercent}%`}
                  />
                </div>

                {/* Slider for interactive fine tuning */}
                <div className="pt-1 flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 font-medium">Tùy chỉnh:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={prepaymentPercent}
                    onChange={(e) => handlePrepaymentChange(Number(e.target.value))}
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-700 w-16 text-right">
                    {prepaymentPercent}% / {creditPercent}%
                  </span>
                </div>

                {/* Payment Days limit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                      Thời hạn thanh toán công nợ
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={creditTermDays}
                        onChange={(e) => setCreditTermDays(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-800 font-semibold focus:outline-none"
                      >
                        <option value={0}>Không áp dụng (0 ngày)</option>
                        <option value={7}>Trong vòng 7 ngày</option>
                        <option value={15}>Trong vòng 15 ngày</option>
                        <option value={30}>Trong vòng 30 ngày (Chuẩn)</option>
                        <option value={45}>Trong vòng 45 ngày</option>
                        <option value={60}>Trong vòng 60 ngày</option>
                        <option value={90}>Trong vòng 90 ngày (Dự án lớn)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                      Ghi chú điều khoản thanh toán riêng
                    </label>
                    <input
                      type="text"
                      value={customTermNotes}
                      onChange={(e) => setCustomTermNotes(e.target.value)}
                      placeholder="VD: Cần bảo lãnh ngân hàng nếu nợ trên 200tr..."
                      className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: AI Notes & Customer Care Strategy */}
          <div>
            <label className="block font-bold text-slate-700 text-xs mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ghi chú AI & Kịch bản chăm sóc khách hàng</span>
            </label>
            <textarea
              rows={2}
              value={aiNotes}
              onChange={(e) => setAiNotes(e.target.value)}
              placeholder="VD: Khách hàng thường đặt hàng vào ngày 15 hàng tháng, chu kỳ công nợ 30 ngày, ưu tiên báo giá sắt hộp mạ kẽm và xà gồ Z..."
              className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 font-bold text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{customerToEdit ? 'Lưu thay đổi' : 'Tạo khách hàng mới'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
