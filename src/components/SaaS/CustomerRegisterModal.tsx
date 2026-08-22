import React, { useState, useEffect } from 'react';
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
  X,
  CreditCard,
  Layers,
  Users,
  QrCode,
  Smartphone,
  Copy,
  Check,
  Clock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
  Lock,
  KeyRound,
  AtSign,
  Eye,
  EyeOff
} from 'lucide-react';
import { SaaSPlan, SaaSPlanCode, PaymentMethodType, PaymentOrder } from '../../types';
import { SaaSService } from '../../services/saasService';
import { PaymentHubService } from '../../services/paymentHubService';

interface CustomerRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type StepKey = 'company' | 'admin' | 'plan' | 'payment';

export const CustomerRegisterModal: React.FC<CustomerRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const plans = SaaSService.getPlans();
  const paymentMethods = PaymentHubService.getActiveMethods();

  const [currentStep, setCurrentStep] = useState<StepKey>('company');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    plans.find((p) => p.code === 'ANNUAL')?.id || plans[0]?.id || 'plan-annual'
  );

  const [formData, setFormData] = useState({
    companyName: '',
    taxCode: '',
    representative: '',
    email: '',
    phone: '',
    address: '',
    adminName: '',
    adminUsername: '',
    adminEmail: '',
    adminPhone: '',
    adminPassword: '',
    confirmPassword: '',
    notes: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Tax lookup simulation
  const [isLookingUpTax, setIsLookingUpTax] = useState(false);
  const [taxLookupSuccess, setTaxLookupSuccess] = useState(false);

  // Payment Hub State
  const [selectedMethodType, setSelectedMethodType] = useState<PaymentMethodType>('vietqr');
  const [activePaymentOrder, setActivePaymentOrder] = useState<PaymentOrder | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(900); // 15 mins

  // Final submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const isTrialPlan = selectedPlan?.code === 'TRIAL' || selectedPlan?.price === 0;

  // Countdown timer for Payment Order
  useEffect(() => {
    if (currentStep !== 'payment' || isTrialPlan || paymentVerified) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep, isTrialPlan, paymentVerified]);

  if (!isOpen) return null;

  const handleLookupTax = () => {
    if (!formData.taxCode.trim()) {
      setErrorMsg('Vui lòng nhập Mã số thuế để tra cứu.');
      return;
    }
    setErrorMsg(null);
    setIsLookingUpTax(true);

    setTimeout(() => {
      setIsLookingUpTax(false);
      setTaxLookupSuccess(true);
      if (!formData.companyName) {
        setFormData((prev) => ({
          ...prev,
          companyName: `Công ty TNHH Doanh Nghiệp Việt Nam (MST: ${prev.taxCode})`,
          representative: prev.representative || 'Nguyễn Văn Doanh',
          address: prev.address || 'Tầng 6, Tòa nhà Landmark, Ba Đình, Hà Nội'
        }));
      }
    }, 500);
  };

  const handleNextToAdmin = () => {
    setErrorMsg(null);
    if (!formData.companyName.trim()) {
      setErrorMsg('Vui lòng nhập Tên doanh nghiệp / Hộ kinh doanh.');
      return;
    }
    // Auto-suggest admin username if empty
    if (!formData.adminUsername.trim() && formData.taxCode.trim()) {
      setFormData((prev) => ({
        ...prev,
        adminUsername: prev.adminUsername || `admin_${prev.taxCode.trim().slice(-6)}`
      }));
    }
    setCurrentStep('admin');
  };

  const handleNextToPlan = () => {
    setErrorMsg(null);
    if (!formData.adminName.trim()) {
      setErrorMsg('Vui lòng nhập Họ & tên người quản trị viên.');
      return;
    }
    if (!formData.adminEmail.trim() || !formData.adminEmail.includes('@')) {
      setErrorMsg('Vui lòng nhập Email người quản trị hợp lệ (VD: admin@domain.com).');
      return;
    }
    if (!formData.adminPhone.trim() || formData.adminPhone.trim().length < 9) {
      setErrorMsg('Vui lòng nhập Số điện thoại người quản trị hợp lệ (từ 9-11 số).');
      return;
    }
    if (!formData.adminPassword || formData.adminPassword.length < 6) {
      setErrorMsg('Mật khẩu quản trị phải có tối thiểu 6 ký tự.');
      return;
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }
    setCurrentStep('plan');
  };

  const handleNextToPaymentOrSubmit = () => {
    setErrorMsg(null);
    if (isTrialPlan) {
      // Direct submission for TRIAL (0đ) without payment gateway
      handleFinalSubmit(undefined);
    } else {
      // Paid plan -> Generate Payment Order via Payment Hub
      const order = PaymentHubService.createPaymentOrder({
        planId: selectedPlan.id,
        customerName: formData.companyName,
        customerEmail: formData.adminEmail,
        customerPhone: formData.adminPhone || formData.phone,
        taxCode: formData.taxCode,
        methodType: selectedMethodType
      });
      setActivePaymentOrder(order);
      setTimeRemainingSeconds(900); // 15 mins
      setCurrentStep('payment');
    }
  };

  const handleSwitchMethod = (type: PaymentMethodType) => {
    setSelectedMethodType(type);
    if (activePaymentOrder) {
      const updated = PaymentHubService.switchPaymentMethod(activePaymentOrder.id, type);
      if (updated) setActivePaymentOrder(updated);
    }
  };

  const handleVerifyPayment = async () => {
    if (!activePaymentOrder) return;
    setErrorMsg(null);
    setIsVerifyingPayment(true);

    try {
      const res = await PaymentHubService.verifyPayment(activePaymentOrder.id);
      setIsVerifyingPayment(false);

      if (res.success && res.order) {
        setPaymentVerified(true);
        setActivePaymentOrder(res.order);
        // Continue to final registration submission with paid paymentOrderId
        await handleFinalSubmit(res.order.id);
      } else {
        setErrorMsg(res.message || 'Xác nhận thanh toán chưa thành công. Vui lòng kiểm tra lại.');
      }
    } catch (err: any) {
      setIsVerifyingPayment(false);
      setErrorMsg(err.message || 'Lỗi kết nối cổng thanh toán.');
    }
  };

  const handleFinalSubmit = async (paymentOrderId?: string) => {
    setIsSubmitting(true);
    try {
      const effectiveUsername = formData.adminUsername.trim() || formData.adminPhone.trim() || (formData.adminEmail ? formData.adminEmail.split('@')[0] : '').trim();
      const res = await SaaSService.submitRegistration({
        companyName: formData.companyName,
        taxCode: formData.taxCode,
        representative: formData.representative || formData.adminName,
        email: formData.email || formData.adminEmail,
        phone: formData.phone || formData.adminPhone,
        address: formData.address,
        adminName: formData.adminName,
        adminUsername: effectiveUsername,
        adminEmail: formData.adminEmail,
        adminPhone: formData.adminPhone || formData.phone,
        adminPassword: formData.adminPassword || undefined,
        planId: selectedPlanId,
        notes: formData.notes
      });

      if (res.success && res.registration) {
        // Link payment order if paid
        if (paymentOrderId) {
          const registrations = SaaSService.getRegistrations();
          const currentReg = registrations.find((r) => r.id === res.registration?.id);
          if (currentReg) {
            currentReg.paymentStatus = 'PAID';
            currentReg.paymentOrderId = paymentOrderId;
            currentReg.paymentMethod = selectedMethodType;
            currentReg.paidAmount = selectedPlan.price;
            SaaSService.saveRegistrations(registrations);
          }
        }

        setSubmittedCode(res.registration.registrationCode);
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.message || 'Đăng ký không thành công. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'acc' | 'content') => {
    navigator.clipboard.writeText(text);
    if (type === 'acc') {
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    } else {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Đăng Ký Sử Dụng BizOne ERP</h2>
              <p className="text-xs text-blue-100/90 mt-0.5">
                Nền tảng SaaS Quản trị Doanh nghiệp & Chuỗi Cung ứng Toàn diện
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        {!submittedCode && (
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                currentStep === 'company' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                1
              </span>
              <span className={currentStep === 'company' ? 'text-blue-700 font-bold' : 'text-slate-500'}>
                Doanh Nghiệp
              </span>

              <span className="text-slate-300">→</span>

              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                currentStep === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                2
              </span>
              <span className={currentStep === 'admin' ? 'text-blue-700 font-bold' : 'text-slate-500'}>
                Tài Khoản Admin
              </span>

              <span className="text-slate-300">→</span>

              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                currentStep === 'plan' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                3
              </span>
              <span className={currentStep === 'plan' ? 'text-blue-700 font-bold' : 'text-slate-500'}>
                Chọn Gói
              </span>

              <span className="text-slate-300">→</span>

              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                currentStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                4
              </span>
              <span className={currentStep === 'payment' ? 'text-blue-700 font-bold' : 'text-slate-500'}>
                Thanh Toán
              </span>
            </div>

            <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              {isTrialPlan ? 'Trial 0đ' : `${selectedPlan.price.toLocaleString('vi-VN')} đ`}
            </span>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {submittedCode ? (
          /* =========================================================================
             FINAL SUCCESS SCREEN
             ========================================================================= */
          <div className="p-8 text-center space-y-6 animate-in fade-in">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center border border-emerald-200 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">
                Gửi Hồ Sơ Đăng Ký Thành Công!
              </h3>
              <p className="text-sm text-slate-600">
                Mã hồ sơ: <span className="font-mono font-bold text-blue-600">{submittedCode}</span>
              </p>

              {paymentVerified && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Xác nhận thanh toán thành công ({selectedPlan.price.toLocaleString('vi-VN')} đ)</span>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 text-slate-600 mt-4">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> Quy trình thẩm định & Phê duyệt BizOne:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed">
                  <li>Hồ sơ đăng ký đang ở trạng thái <span className="font-mono font-bold text-amber-600">PENDING_APPROVAL</span>.</li>
                  <li>Ban Quản Trị Super Admin BizOne sẽ thẩm định và phê duyệt kích hoạt Tenant + License.</li>
                  <li>Thông tin đăng nhập sẽ được gửi tới Email quản trị: <strong className="text-blue-600">{formData.adminEmail}</strong>.</li>
                  <li>Gói đăng ký: <strong>{selectedPlan?.name}</strong> (Tối đa 3 User, 100% tính năng ERP).</li>
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Đã hiểu & Đóng cửa sổ
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             WIZARD FORM STEPS
             ========================================================================= */
          <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            
            {/* STEP 1: ENTERPRISE INFO & TAX LOOKUP */}
            {currentStep === 'company' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      1. Thông Tin Doanh Nghiệp / Hộ Kinh Doanh
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Nhập mã số thuế để tự động điền thông tin pháp lý từ cơ sở dữ liệu quốc gia</p>
                  </div>
                </div>

                {/* Tax Code with Lookup Button */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mã số thuế (MST) / Số ĐKKD
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="VD: 0109887766"
                      value={formData.taxCode}
                      onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                      className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                    <button
                      type="button"
                      onClick={handleLookupTax}
                      disabled={isLookingUpTax || !formData.taxCode.trim()}
                      className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isLookingUpTax ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Tra cứu</span>
                    </button>
                  </div>
                  {taxLookupSuccess && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Đã tìm thấy dữ liệu doanh nghiệp từ cổng đăng ký quốc gia.
                    </p>
                  )}
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tên Doanh Nghiệp / Hộ Kinh Doanh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Công ty TNHH Thương Mại & Dịch Vụ An Phát"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>

                {/* Representative & Official Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Người Đại Diện Pháp Luật
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Nguyễn Văn Doanh"
                      value={formData.representative}
                      onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Số Điện Thoại Doanh Nghiệp (Hotline)
                    </label>
                    <input
                      type="tel"
                      placeholder="VD: 024 3888 9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>
                </div>

                {/* Enterprise Email & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Doanh Nghiệp (Hòm thư chính thức)
                    </label>
                    <input
                      type="email"
                      placeholder="VD: contact@anphat.vn"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Địa Chỉ Trụ Sở Doanh Nghiệp
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 128 Nguyễn Trãi, Thanh Xuân, Hà Nội"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextToAdmin}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Tiếp tục: Thiết lập tài khoản Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: ADMIN USER ACCOUNT */}
            {currentStep === 'admin' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      2. Thiết Lập Tài Khoản Quản Trị Hệ Thống (Tenant Admin)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Khởi tạo thông tin định danh đăng nhập (ID đăng nhập / Email / Số điện thoại) và mật khẩu quản trị cao nhất
                    </p>
                  </div>
                </div>

                {/* Admin Full Name & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      Họ Tên Quản Trị Viên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Vũ Đức Đăng Khôi"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <AtSign className="w-3.5 h-3.5 text-blue-600" />
                      ID / Tên Đăng Nhập (Login ID)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: anphat_admin hoặc admin_kd"
                      value={formData.adminUsername}
                      onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '') })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Tùy chọn. Dùng để đăng nhập trực tiếp (viết liền, không dấu).
                    </p>
                  </div>
                </div>

                {/* Admin Email & Admin Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      Email Quản Trị / Email Đăng Nhập <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="VD: admin@anphat.vn"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Dùng để đăng nhập, nhận thông báo duyệt và khôi phục mật khẩu.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      Số Điện Thoại Quản Trị / Đăng Nhập <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="VD: 0901234567"
                      value={formData.adminPhone}
                      onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Dùng để đăng nhập nhanh và nhận mã OTP SMS/Zalo.
                    </p>
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      Mật Khẩu Quản Trị Khởi Tạo <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Tối thiểu 6 ký tự"
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                        className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      Xác Nhận Mật Khẩu <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Nhập lại mật khẩu"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3-in-1 Flexible Login Callout Banner */}
                <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/80 text-blue-950 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Đặc quyền đăng nhập 3 trong 1 sau khi duyệt hồ sơ:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Bạn có thể dùng <strong>bất kỳ 1 trong 3 thông tin</strong> dưới đây kết hợp với mật khẩu vừa tạo để đăng nhập vào BizOne ERP:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">1. ID Đăng Nhập</div>
                      <div className="font-mono font-bold text-blue-700 truncate mt-0.5">
                        {formData.adminUsername || formData.adminPhone || (formData.adminEmail ? formData.adminEmail.split('@')[0] : 'admin_doanhnghiep')}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">2. Email Quản Trị</div>
                      <div className="font-mono font-bold text-blue-700 truncate mt-0.5">
                        {formData.adminEmail || 'admin@doanhnghiep.vn'}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">3. Số Điện Thoại</div>
                      <div className="font-mono font-bold text-blue-700 truncate mt-0.5">
                        {formData.adminPhone || '090xxxxxxx'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('company')}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextToPlan}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Tiếp tục: Chọn gói dịch vụ</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SELECT PLAN */}
            {currentStep === 'plan' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      Chọn Gói Dịch Vụ BizOne ERP
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Tất cả gói bản quyền đều bao gồm 3 User và 100% tính năng</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {plans.map((p) => {
                    const isSelected = selectedPlanId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`relative p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {p.badge && (
                          <span className="absolute -top-2.5 right-3 px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full shadow-xs">
                            {p.badge}
                          </span>
                        )}
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-800">{p.name}</p>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {p.durationDays} ngày
                            </span>
                          </div>

                          <p className="text-lg font-black text-blue-600 mt-2">
                            {p.price === 0 ? '0 đ (Miễn Phí)' : `${p.price.toLocaleString('vi-VN')} đ`}
                          </p>

                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {p.description || 'Full 100% tính năng quản trị kho, bán hàng, sổ quỹ, báo cáo'}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Users className="w-3.5 h-3.5 text-blue-500" /> 3 User
                          </span>
                          <span className="font-bold text-emerald-600">Full tính năng</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('admin')}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextToPaymentOrSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isTrialPlan ? (
                      <span>Gửi hồ sơ đăng ký Trial 7 ngày (0đ) →</span>
                    ) : (
                      <span>Tiếp tục: Thanh toán ({selectedPlan.price.toLocaleString('vi-VN')} đ) →</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PAYMENT GATEWAY HUB CHECKOUT */}
            {currentStep === 'payment' && activePaymentOrder && (
              <div className="space-y-5 animate-in fade-in">
                {/* Order Summary Header */}
                <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded-md uppercase tracking-wider">
                      Đơn Thanh Toán: {activePaymentOrder.orderCode}
                    </span>
                    <h3 className="text-base font-extrabold mt-1">{selectedPlan.name} (3 User - Full Tính Năng)</h3>
                    <p className="text-xs text-slate-300 mt-0.5">Khách hàng: {formData.companyName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Số tiền thanh toán:</div>
                    <div className="text-xl font-black text-amber-400">
                      {selectedPlan.price.toLocaleString('vi-VN')} VNĐ
                    </div>
                    <div className="text-[11px] text-slate-300 flex items-center justify-end gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Hết hạn sau: <strong className="font-mono text-amber-300">{formatCountdown(timeRemainingSeconds)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Payment Methods Hub Tabs (Configurable / Dynamic) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Chọn Phương Thức Thanh Toán (Payment Gateway Hub)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {paymentMethods.map((m) => {
                      const isSelected = selectedMethodType === m.type;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSwitchMethod(m.type)}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            {m.type === 'vietqr' ? (
                              <QrCode className="w-4 h-4 text-blue-600" />
                            ) : m.type === 'card' ? (
                              <CreditCard className="w-4 h-4 text-indigo-600" />
                            ) : m.type === 'ewallet' ? (
                              <Smartphone className="w-4 h-4 text-rose-600" />
                            ) : (
                              <Building2 className="w-4 h-4 text-slate-600" />
                            )}
                            {m.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-500 text-white rounded">
                                {m.badge}
                              </span>
                            )}
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-bold truncate">{m.name.split('(')[0]}</p>
                            <p className="text-[10px] text-slate-500 truncate">{m.tagline}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specific Method Details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  {/* VIETQR & BANK TRANSFER FLOW */}
                  {(selectedMethodType === 'vietqr' || selectedMethodType === 'bank_transfer') && (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Dynamic QR Display */}
                      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shrink-0 text-center space-y-1">
                        <img
                          src={activePaymentOrder.qrCodeData}
                          alt="VietQR Dynamic Code"
                          referrerPolicy="no-referrer"
                          className="w-44 h-44 object-contain rounded-lg mx-auto"
                        />
                        <div className="text-[10px] font-mono font-bold text-slate-500">
                          NAPAS 24/7 • VietQR Tự Động
                        </div>
                      </div>

                      {/* Transfer Details */}
                      <div className="flex-1 space-y-2.5 text-xs text-slate-700 w-full">
                        <div className="flex justify-between items-center p-2 bg-white rounded-xl border border-slate-200/80">
                          <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                          <strong className="text-slate-900">{activePaymentOrder.bankAccountInfo?.bankName}</strong>
                        </div>

                        <div className="flex justify-between items-center p-2 bg-white rounded-xl border border-slate-200/80">
                          <span className="text-slate-500">Số tài khoản:</span>
                          <div className="flex items-center gap-2">
                            <strong className="font-mono text-sm text-blue-700">{activePaymentOrder.bankAccountInfo?.accountNumber}</strong>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(activePaymentOrder.bankAccountInfo?.accountNumber || '', 'acc')}
                              className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                              title="Sao chép số tài khoản"
                            >
                              {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center p-2 bg-white rounded-xl border border-slate-200/80">
                          <span className="text-slate-500">Chủ tài khoản:</span>
                          <strong className="text-slate-900 uppercase">{activePaymentOrder.bankAccountInfo?.accountName}</strong>
                        </div>

                        <div className="flex justify-between items-center p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                          <span>Nội dung chuyển khoản (Bắt buộc):</span>
                          <div className="flex items-center gap-2">
                            <strong className="font-mono text-xs font-bold text-amber-950">{activePaymentOrder.transferContent}</strong>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(activePaymentOrder.transferContent || '', 'content')}
                              className="p-1 text-amber-700 hover:text-amber-950 cursor-pointer"
                              title="Sao chép nội dung"
                            >
                              {copiedContent ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CARD PAYMENT (PCI-DSS TOKENIZED HOSTED) */}
                  {selectedMethodType === 'card' && (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          Cổng Thanh Toán Thẻ Trực Tuyến NAPAS / PCI-DSS Tokenized
                        </p>
                        <p className="text-[11px] text-indigo-800">
                          BizOne không lưu trữ số thẻ hoặc mã bảo mật CVV. Giao dịch được mã hóa và xử lý trực tiếp qua hạ tầng bảo mật của ngân hàng và tổ chức thẻ quốc tế.
                        </p>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>Thẻ được chấp nhận: Visa, Mastercard, JCB, UnionPay, NAPAS Domestic</span>
                          <span className="font-mono font-bold text-emerald-600">3D Secure 2.0</span>
                        </div>
                        <p className="text-slate-600 text-xs">
                          Nhấn nút <strong>[ Xác Nhận Đã Thanh Toán ]</strong> bên dưới để hoàn tất giao dịch mô phỏng qua cổng NAPAS Tokenized.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* MOMO EWALLET */}
                  {selectedMethodType === 'ewallet' && (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-rose-600" />
                          Cổng Dịch Vụ Ví Điện Tử MoMo (M-Service)
                        </p>
                        <p className="text-[11px] text-rose-800">
                          Hỗ trợ mở ứng dụng MoMo trên điện thoại hoặc quét mã QR MoMo tiện lợi.
                        </p>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">Mã đơn hàng MoMo: {activePaymentOrder.orderCode}</div>
                          <div className="text-[11px] text-slate-500">Số tiền: {selectedPlan.price.toLocaleString('vi-VN')} đ</div>
                        </div>
                        <span className="px-3 py-1 bg-rose-100 text-rose-700 font-bold rounded-lg text-xs">MoMo Pay 24/7</span>
                      </div>
                    </div>
                  )}

                  {/* APPLE PAY / GOOGLE PAY */}
                  {selectedMethodType === 'apple_pay' && (
                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Thanh toán 1 chạm với Apple Pay / Google Pay
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        Thiết bị của bạn hỗ trợ thanh toán sinh trắc học Face ID / Touch ID qua ví thiết bị bảo mật.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('plan')}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Đổi gói khác</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleVerifyPayment}
                    disabled={isVerifyingPayment || isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isVerifyingPayment || isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang xác thực giao dịch với Backend...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tôi Đã Hoàn Tất Thanh Toán → Gửi Hồ Sơ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
