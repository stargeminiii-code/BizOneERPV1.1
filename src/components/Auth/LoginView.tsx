import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Globe,
  Sparkles,
  Smartphone,
  KeyRound,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  ChevronLeft
} from 'lucide-react';
import { UserAccount } from '../../types';
import { AuthService } from '../../services/authService';
import { CustomerRegisterModal } from '../SaaS/CustomerRegisterModal';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
  availableUsers?: UserAccount[];
  portalMode?: 'super-admin' | 'erp';
  onSwitchPortal?: (mode: 'super-admin' | 'erp') => void;
}

type Language = 'vi' | 'en';
type AuthStep = 'credentials' | '2fa_challenge' | '2fa_setup' | 'recovery_code';

const TRANSLATIONS = {
  vi: {
    brand: 'BizOne ERP',
    superAdminBrand: 'BizOne Super Admin',
    subtitle: 'Đăng nhập',
    superAdminSubtitle: 'Cổng Quản Trị Nhà Cung Cấp',
    desc: 'Nhập thông tin tài khoản để truy cập hệ thống quản trị',
    accountLabel: 'ID Đăng nhập / Email / Số điện thoại',
    accountPlaceholder: 'Nhập ID đăng nhập, email hoặc số điện thoại',
    passwordLabel: 'Mật khẩu',
    passwordPlaceholder: 'Nhập mật khẩu',
    showPass: 'Hiện mật khẩu',
    hidePass: 'Ẩn mật khẩu',
    rememberMe: 'Ghi nhớ đăng nhập',
    forgotPass: 'Quên mật khẩu?',
    loginBtn: 'Đăng nhập',
    loginSuperAdminBtn: 'Đăng nhập Super Admin',
    loggingIn: 'Đang xác thực...',
    errRequired: 'Vui lòng nhập tài khoản và mật khẩu.',
    errInvalid: 'Thông tin đăng nhập không chính xác.',
    errServer: 'Không thể kết nối máy chủ. Vui lòng thử lại.',
    errLocked: 'Tài khoản đã bị khóa do vi phạm chính sách bảo mật.',
    errSuperAdminOnly: 'Tài khoản này không có quyền truy cập Cổng Super Admin của nhà cung cấp. Vui lòng đăng nhập vào Cổng Khách hàng BizOne ERP.',
    forgotTitle: 'Quên mật khẩu?',
    forgotDesc: 'Vui lòng liên hệ Quản trị viên để được hỗ trợ cấp lại mật khẩu truy cập.',
    contactAdmin: 'Liên hệ Quản trị viên (Admin):',
    close: 'Đóng',
    twoFactorTitle: 'Xác Thực Hai Lớp (2FA)',
    twoFactorDesc: 'Nhập mã 6 số từ ứng dụng Google Authenticator hoặc Authy trên điện thoại của bạn.',
    twoFactorPlaceholder: '000000',
    verify2FABtn: 'Xác nhận mã 2FA',
    useRecoveryCode: 'Sử dụng Mã khôi phục dự phòng',
    useTotpCode: 'Sử dụng Mã ứng dụng (TOTP 6 số)',
    recoveryCodeTitle: 'Đăng Nhập Bằng Mã Khôi Phục',
    recoveryCodeDesc: 'Nhập một trong các mã khôi phục 8 ký tự được cấp khi kích hoạt 2FA.',
    recoveryCodePlaceholder: 'VD: A1B2-C3D4',
    verifyRecoveryBtn: 'Xác nhận Mã khôi phục',
    setup2FATitle: 'Kích Hoạt Bảo Mật 2FA (Bắt buộc Super Admin)',
    setup2FADesc: 'Tài khoản Super Admin yêu cầu kích hoạt 2FA. Quét mã QR bên dưới vào ứng dụng xác thực.',
    copySecret: 'Sao chép khóa bí mật',
    copiedSecret: 'Đã sao chép!',
    backToLogin: 'Quay lại đăng nhập'
  },
  en: {
    brand: 'BizOne ERP',
    superAdminBrand: 'BizOne Super Admin',
    subtitle: 'Sign In',
    superAdminSubtitle: 'Platform Provider Portal',
    desc: 'Enter your credentials to access the enterprise system',
    accountLabel: 'Account / Email / Phone',
    accountPlaceholder: 'Enter email or phone number',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    showPass: 'Show password',
    hidePass: 'Hide password',
    rememberMe: 'Remember me',
    forgotPass: 'Forgot password?',
    loginBtn: 'Sign In',
    loginSuperAdminBtn: 'Sign In Super Admin',
    loggingIn: 'Authenticating...',
    errRequired: 'Please enter both username and password.',
    errInvalid: 'Invalid username or password.',
    errServer: 'Unable to connect to server. Please try again.',
    errLocked: 'Account has been locked.',
    errSuperAdminOnly: 'This account does not have Super Admin access. Please sign in via the Customer ERP Portal.',
    forgotTitle: 'Forgot Password?',
    forgotDesc: 'Please contact the system administrator to reset your credentials.',
    contactAdmin: 'System Administrator Contact:',
    close: 'Close',
    twoFactorTitle: 'Two-Factor Authentication (2FA)',
    twoFactorDesc: 'Enter the 6-digit verification code from your authenticator app (Google Authenticator or Authy).',
    twoFactorPlaceholder: '000000',
    verify2FABtn: 'Verify 2FA Code',
    useRecoveryCode: 'Use Backup Recovery Code',
    useTotpCode: 'Use 6-digit Authenticator Code',
    recoveryCodeTitle: 'Login with Recovery Code',
    recoveryCodeDesc: 'Enter one of your 8-character emergency backup recovery codes.',
    recoveryCodePlaceholder: 'e.g. A1B2-C3D4',
    verifyRecoveryBtn: 'Verify Recovery Code',
    setup2FATitle: 'Enable 2FA Protection (Super Admin Mandatory)',
    setup2FADesc: 'Super Admin accounts require 2FA. Scan the QR code below using your authenticator app.',
    copySecret: 'Copy Secret Key',
    copiedSecret: 'Copied!',
    backToLogin: 'Back to Sign In'
  }
};

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  portalMode = 'erp',
  onSwitchPortal
}) => {
  const [lang, setLang] = useState<Language>('vi');
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');

  // Credentials - No hardcoded or prefilled passwords on UI
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // 2FA State
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  // 2FA Setup State (for Super Admin initial setup)
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [setupQrCode, setSetupQrCode] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const t = TRANSLATIONS[lang];

  // Primary Login submission
  const handleLogin = async (e?: React.FormEvent, customId?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetId = (customId !== undefined ? customId : identifier).trim();
    const targetPass = customPass !== undefined ? customPass : password;

    if (!targetId || !targetPass) {
      setErrorMessage(t.errRequired);
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.login(targetId, targetPass, rememberMe);
      setIsLoading(false);

      if (result.require2FA && result.tempToken) {
        setTempToken(result.tempToken);
        setMaskedEmail(result.maskedEmail || null);
        setMaskedPhone(result.maskedPhone || null);
        setTotpCode('');

        if (result.require2FASetup) {
          // Initiate 2FA Setup flow
          setAuthStep('2fa_setup');
          load2FASetupInfo(result.tempToken);
        } else {
          setAuthStep('2fa_challenge');
        }
        return;
      }

      if (result.success && result.user) {
        // Enforce Super Admin portal security check
        if (portalMode === 'super-admin' && result.user.role !== 'super_admin') {
          AuthService.clearSession();
          setErrorMessage(t.errSuperAdminOnly);
          return;
        }

        setSuccessMessage(`${portalMode === 'super-admin' ? t.superAdminBrand : t.brand}: ${result.user.name}`);
        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 300);
      } else {
        if (result.errorType === 'ACCOUNT_LOCKED') {
          setErrorMessage(t.errLocked);
        } else if (result.errorType === 'INVALID_PASSWORD' || result.errorType === 'USER_NOT_FOUND') {
          setErrorMessage(t.errInvalid);
        } else {
          setErrorMessage(result.error || t.errInvalid);
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(t.errServer);
    }
  };

  // Load Setup QR and secret for mandatory 2FA enrollment
  const load2FASetupInfo = async (token: string) => {
    setIsLoading(true);
    try {
      const setupRes = await AuthService.setup2FA(token);
      setIsLoading(false);
      if (setupRes.success) {
        setSetupSecret(setupRes.secret || null);
        setSetupQrCode(setupRes.qrCodeDataUrl || null);
      } else {
        setErrorMessage(setupRes.error || 'Không thể tạo mã kích hoạt 2FA');
      }
    } catch (e) {
      setIsLoading(false);
      setErrorMessage('Lỗi khi tải mã kích hoạt 2FA');
    }
  };

  // Verify TOTP 2FA code
  const handleVerify2FA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tempToken) return;
    if (!totpCode || totpCode.trim().length < 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã xác thực 2FA.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (authStep === '2fa_setup' && setupSecret) {
        // Complete initial enrollment
        const enableRes = await AuthService.enable2FA(setupSecret, totpCode, tempToken);
        setIsLoading(false);
        if (enableRes.success && enableRes.user) {
          setSuccessMessage(`Kích hoạt 2FA thành công! Đang vào hệ thống...`);
          setTimeout(() => {
            onLoginSuccess(enableRes.user!);
          }, 400);
        } else {
          setErrorMessage(enableRes.error || 'Mã xác thực 2FA không chính xác');
        }
      } else {
        // Standard TOTP Verification
        const verifyRes = await AuthService.verify2FALogin(tempToken, totpCode, rememberMe);
        setIsLoading(false);
        if (verifyRes.success && verifyRes.user) {
          setSuccessMessage(`${t.brand}: ${verifyRes.user.name}`);
          setTimeout(() => {
            onLoginSuccess(verifyRes.user!);
          }, 300);
        } else {
          setErrorMessage(verifyRes.error || 'Mã xác thực 2FA không chính xác hoặc đã hết hạn.');
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(t.errServer);
    }
  };

  // Verify Backup Recovery Code
  const handleVerifyRecoveryCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tempToken) return;
    if (!recoveryCode || recoveryCode.trim().length < 6) {
      setErrorMessage('Vui lòng nhập mã khôi phục dự phòng hợp lệ (8 ký tự).');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await AuthService.verifyRecoveryCodeLogin(tempToken, recoveryCode, rememberMe);
      setIsLoading(false);
      if (res.success && res.user) {
        setSuccessMessage(`Xác thực mã khôi phục thành công!`);
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 300);
      } else {
        setErrorMessage(res.error || 'Mã khôi phục không hợp lệ hoặc đã qua sử dụng.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(t.errServer);
    }
  };

  const handleCopySecret = () => {
    if (!setupSecret) return;
    navigator.clipboard.writeText(setupSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2500);
  };

  const handleResetToCredentials = () => {
    setAuthStep('credentials');
    setTempToken(null);
    setTotpCode('');
    setRecoveryCode('');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher Bar */}
      <div className="w-full max-w-md flex justify-end mb-3 z-10">
        <div className="inline-flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-lg p-1 text-xs text-slate-300">
          <Globe className="w-3.5 h-3.5 text-slate-400 ml-1" />
          <button
            type="button"
            onClick={() => setLang('vi')}
            className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
              lang === 'vi' ? 'bg-blue-600 text-white shadow-xs' : 'hover:text-white'
            }`}
          >
            VI
          </button>
          <span className="text-slate-700">|</span>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
              lang === 'en' ? 'bg-blue-600 text-white shadow-xs' : 'hover:text-white'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 z-10 animate-in fade-in duration-300">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl shadow-md text-white mb-3 ${
            portalMode === 'super-admin'
              ? 'bg-gradient-to-tr from-amber-600 via-rose-600 to-red-600 shadow-rose-500/20'
              : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/20'
          }`}>
            {authStep === 'credentials' ? (
              portalMode === 'super-admin' ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />
            ) : authStep === '2fa_setup' ? (
              <QrCode className="w-6 h-6" />
            ) : (
              <Smartphone className="w-6 h-6" />
            )}
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {portalMode === 'super-admin' ? t.superAdminBrand : t.brand}
            </h1>
            {portalMode === 'super-admin' && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700 border border-rose-200 rounded-md tracking-wider">
                Root
              </span>
            )}
          </div>
          <h2 className="text-sm font-semibold text-slate-500 mt-1">
            {authStep === 'credentials'
              ? portalMode === 'super-admin'
                ? t.superAdminSubtitle
                : t.subtitle
              : authStep === '2fa_challenge'
              ? t.twoFactorTitle
              : authStep === '2fa_setup'
              ? t.setup2FATitle
              : t.recoveryCodeTitle}
          </h2>
          {portalMode === 'super-admin' && (
            <p className="text-[11px] text-amber-700 font-medium bg-amber-50 border border-amber-200/80 rounded-lg py-1 px-2.5 mt-2.5 inline-block">
              Hệ thống giám sát 2FA và kiểm soát truy cập cấp nhà cung cấp BizOne
            </p>
          )}
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700 font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        {/* =========================================================================
            STAGE 1: CREDENTIALS LOGIN FORM
            ========================================================================= */}
        {authStep === 'credentials' && (
          <>
            <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
              {/* Account Identifier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {t.accountLabel}
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={t.accountPlaceholder}
                    className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-sm font-semibold rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t.passwordLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                  >
                    {t.forgotPass}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-sm font-semibold rounded-xl pl-10 pr-10 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? t.hidePass : t.showPass}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>{t.rememberMe}</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-1 ${
                  portalMode === 'super-admin'
                    ? 'bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 hover:from-slate-800 hover:to-slate-800 shadow-rose-900/10'
                    : 'bg-slate-900 hover:bg-slate-800 active:scale-[0.99]'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t.loggingIn}</span>
                  </>
                ) : (
                  <>
                    <span>{portalMode === 'super-admin' ? t.loginSuperAdminBtn : t.loginBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Customer Registration Trigger (Only for ERP portal) */}
            {portalMode !== 'super-admin' && (
              <div className="mt-5 pt-4 border-t border-slate-100/80 text-center">
                <p className="text-xs text-slate-500 mb-2">Chưa có tài khoản doanh nghiệp?</p>
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Đăng ký sử dụng BizOne ERP (SaaS)</span>
                </button>
              </div>
            )}

            {/* Portal Switcher Footer Link - Only show return link on Super Admin login page */}
            {onSwitchPortal && portalMode === 'super-admin' && (
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => onSwitchPortal('erp')}
                  className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  ← Quay lại Cổng Đăng nhập Khách hàng BizOne ERP
                </button>
              </div>
            )}
          </>
        )}

        {/* =========================================================================
            STAGE 2: TOTP 2FA CHALLENGE
            ========================================================================= */}
        {authStep === '2fa_challenge' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-blue-900 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                Tài khoản bảo vệ: {maskedPhone || maskedEmail || 'Super Admin'}
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">{t.twoFactorDesc}</p>
            </div>

            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-center">
                  Mã Xác Thực 6 Số (TOTP)
                </label>
                <input
                  type="text"
                  autoFocus
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder={t.twoFactorPlaceholder}
                  className="w-full text-center text-2xl font-mono font-black tracking-widest py-3 px-4 rounded-xl border-2 border-blue-500 bg-blue-50/30 text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || totpCode.length < 6}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t.verify2FABtn}</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthStep('recovery_code');
                  setErrorMessage(null);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                {t.useRecoveryCode}
              </button>

              <button
                type="button"
                onClick={handleResetToCredentials}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer pt-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{t.backToLogin}</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 3: SUPER ADMIN MANDATORY 2FA ENROLLMENT / SETUP
            ========================================================================= */}
        {authStep === '2fa_setup' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Thiết lập 2FA bắt buộc cho Super Admin
              </p>
              <p className="text-amber-800 text-[11px] leading-relaxed">{t.setup2FADesc}</p>
            </div>

            {/* QR Code display */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
              {setupQrCode ? (
                <img
                  src={setupQrCode}
                  alt="2FA QR Code"
                  className="w-44 h-44 rounded-xl border border-slate-300 shadow-xs bg-white p-2"
                />
              ) : (
                <div className="w-44 h-44 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                  Đang tạo mã QR...
                </div>
              )}

              {setupSecret && (
                <div className="w-full text-center space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Khóa bí mật thủ công (Secret Key)
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-200 select-all">
                      {setupSecret}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                      title={t.copySecret}
                    >
                      {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Verification code input */}
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-center">
                  Nhập mã 6 số hiển thị trên ứng dụng để hoàn tất
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-2xl font-mono font-black tracking-widest py-3 px-4 rounded-xl border-2 border-blue-500 bg-blue-50/30 text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || totpCode.length < 6}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang kích hoạt 2FA...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kích Hoạt 2FA & Đăng Nhập</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleResetToCredentials}
                className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{t.backToLogin}</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 4: BACKUP RECOVERY CODE LOGIN
            ========================================================================= */}
        {authStep === 'recovery_code' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                Đăng nhập khẩn cấp bằng Mã khôi phục dự phòng
              </p>
              <p className="text-amber-800 text-[11px] leading-relaxed">{t.recoveryCodeDesc}</p>
            </div>

            <form onSubmit={handleVerifyRecoveryCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Mã khôi phục dự phòng (Recovery Code)
                </label>
                <input
                  type="text"
                  autoFocus
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder={t.recoveryCodePlaceholder}
                  className="w-full text-center text-lg font-mono font-bold tracking-wider py-2.5 px-4 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !recoveryCode.trim()}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang kiểm tra mã...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.verifyRecoveryBtn}</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthStep('2fa_challenge');
                  setErrorMessage(null);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                {t.useTotpCode}
              </button>

              <button
                type="button"
                onClick={handleResetToCredentials}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer pt-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{t.backToLogin}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Registration Modal */}
      <CustomerRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />

      {/* Password Reset Modal (Multi-step Self-Service Security Flow) */}
      {isForgotModalOpen && (
        <PasswordResetModal
          lang={lang}
          isOpen={isForgotModalOpen}
          onClose={() => setIsForgotModalOpen(false)}
        />
      )}
    </div>
  );
};

interface PasswordResetModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ lang, isOpen, onClose }) => {
  const [step, setStep] = useState<'request' | 'otp' | 'new_password' | 'success'>('request');
  const [identifier, setIdentifier] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Password policy validation indicators
  const hasMinLength = newPassword.length >= 12;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && isMatch;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Vui lòng nhập số điện thoại hoặc email đã đăng ký.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await AuthService.requestPasswordReset(identifier);
      setIsLoading(false);
      if (res.success && res.challengeId) {
        setChallengeId(res.challengeId);
        setMaskedEmail(res.maskedEmail || null);
        setMaskedPhone(res.maskedPhone || null);
        setSuccessMessage(res.message || 'Mã OTP đã được gửi.');
        setStep('otp');
      } else {
        setErrorMessage(res.error || 'Không thể gửi mã xác thực.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Lỗi kết nối máy chủ.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId || otp.trim().length !== 6) {
      setErrorMessage('Vui lòng nhập đúng 6 chữ số OTP.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await AuthService.verifyPasswordResetOtp(challengeId, otp);
      setIsLoading(false);
      if (res.success && res.resetToken) {
        setResetToken(res.resetToken);
        setStep('new_password');
        setSuccessMessage('Xác thực OTP thành công. Vui lòng đặt mật khẩu mới.');
      } else {
        setErrorMessage(res.error || 'Mã OTP không hợp lệ.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Lỗi kết nối máy chủ.');
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;

    if (!isPasswordValid) {
      setErrorMessage('Mật khẩu mới chưa đáp ứng đầy đủ tiêu chuẩn bảo mật (ít nhất 12 ký tự, đủ chữ hoa, chữ thường, số và ký tự đặc biệt).');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await AuthService.completePasswordReset(resetToken, newPassword);
      setIsLoading(false);
      if (res.success) {
        setStep('success');
        setSuccessMessage(res.message || 'Đặt lại mật khẩu thành công!');
      } else {
        setErrorMessage(res.error || 'Không thể cập nhật mật khẩu mới.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Lỗi kết nối máy chủ.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Khôi Phục / Đặt Lại Mật Khẩu</h3>
              <p className="text-[11px] text-slate-500">BizOne ERP Enterprise Security</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Error / Success banners */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && step !== 'success' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: Request OTP */}
        {step === 'request' && (
          <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Nhập số điện thoại hoặc email tài khoản cần khôi phục. Hệ thống sẽ xác thực và gửi mã OTP 6 chữ số an toàn.
            </p>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                Số điện thoại hoặc Email đăng ký
              </label>
              <input
                type="text"
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="VD: 0901234567 hoặc admin@bizone.vn"
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="pt-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading || !identifier.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang gửi mã...</span>
                  </>
                ) : (
                  <span>Gửi mã OTP Xác Thực</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Verify OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1">
              <p className="font-bold text-blue-900">Mã xác thực đã được gửi</p>
              <p className="text-blue-800 text-[11px]">
                Nếu thông tin tồn tại, mã OTP 6 chữ số đã được gửi đến phương thức liên hệ đã đăng ký. Mã có hiệu lực trong 5 phút.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                Nhập mã OTP 6 chữ số
              </label>
              <input
                type="text"
                autoFocus
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-xl font-mono font-bold tracking-widest py-2.5 px-3.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setStep('request');
                  setErrorMessage(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ← Gửi lại mã khác
              </button>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang kiểm tra...</span>
                  </>
                ) : (
                  <span>Xác Nhận OTP</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Enter New Password */}
        {step === 'new_password' && (
          <form onSubmit={handleCompleteReset} className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Thiết lập mật khẩu mới đáp ứng tiêu chuẩn bảo mật doanh nghiệp (ít nhất 12 ký tự).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới an toàn"
                    className="w-full py-2 px-3 pr-9 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
              </div>

              {/* Password complexity checklist */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
                <div className="font-bold text-slate-700 mb-1">Tiêu chuẩn mật khẩu an toàn:</div>
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                  {hasMinLength ? '✓' : '○'} Tối thiểu 12 ký tự ({newPassword.length}/12)
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                  {hasUpper ? '✓' : '○'} Có chữ hoa (A-Z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                  {hasLower ? '✓' : '○'} Có chữ thường (a-z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                  {hasNumber ? '✓' : '○'} Có chữ số (0-9)
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                  {hasSpecial ? '✓' : '○'} Có ký tự đặc biệt (!@#$%^&*...)
                </div>
                <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                  {isMatch ? '✓' : '○'} Khớp xác nhận mật khẩu
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang cập nhật mật khẩu...</span>
                  </>
                ) : (
                  <span>Lưu Mật Khẩu Mới & Hoàn Tất</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Success Screen */}
        {step === 'success' && (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-base">Đặt Lại Mật Khẩu Thành Công!</h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Mật khẩu mới đã được cập nhật an toàn bằng thuật toán Bcrypt. Toàn bộ các phiên đăng nhập cũ đã được thu hồi.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Đăng Nhập Ngay Với Mật Khẩu Mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
