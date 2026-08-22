import React, { useState } from 'react';
import {
  QrCode,
  Building2,
  CreditCard,
  Plus,
  Edit,
  Power,
  PowerOff,
  CheckCircle2,
  Copy,
  Check,
  Download,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Sliders,
  ExternalLink,
  Smartphone,
  Eye,
  Info
} from 'lucide-react';
import { BankAccount } from '../types';

interface BankingViewProps {
  bankAccounts: BankAccount[];
  onSaveBankAccount: (account: BankAccount) => void;
  onSetDefaultAccount: (accountId: string) => void;
  onToggleStatus: (accountId: string) => void;
}

export const BankingView: React.FC<BankingViewProps> = ({
  bankAccounts,
  onSaveBankAccount,
  onSetDefaultAccount,
  onToggleStatus
}) => {
  const [selectedAccount, setSelectedAccount] = useState<BankAccount>(
    bankAccounts.find((b) => b.isDefault) || bankAccounts[0]
  );
  const [testAmount, setTestAmount] = useState<number>(1500000);
  const [testMemo, setTestMemo] = useState<string>('THANHTOAN DH-2026-088');
  const [selectedTemplate, setSelectedTemplate] = useState<'compact2' | 'compact' | 'qr_only' | 'print'>('compact2');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modal create/edit bank account
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    bankName: 'MBBank (Ngân hàng TMCP Quân Đội)',
    bankCode: 'MB',
    accountHolder: 'HỘ KINH DOANH VŨ ĐỨC ĐĂNG KHÔI',
    accountNumber: '',
    branch: 'Chi nhánh Long Biên - Hà Nội',
    accountType: 'business' as BankAccount['accountType'],
    defaultTransferMemo: 'THANHTOAN [CODE]',
    qrTemplate: 'compact2' as BankAccount['qrTemplate'],
    notes: ''
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  };

  // Generate dynamic VietQR standard image link
  const currentQrUrl = `https://img.vietqr.io/image/${selectedAccount.bankCode}-${selectedAccount.accountNumber}-${selectedTemplate}.png?amount=${testAmount}&addInfo=${encodeURIComponent(
    testMemo
  )}&accountName=${encodeURIComponent(selectedAccount.accountHolder)}`;

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormData({
      bankName: 'MBBank (Ngân hàng TMCP Quân Đội)',
      bankCode: 'MB',
      accountHolder: 'HỘ KINH DOANH VŨ ĐỨC ĐĂNG KHÔI',
      accountNumber: '',
      branch: 'Chi nhánh Long Biên - Hà Nội',
      accountType: 'business',
      defaultTransferMemo: 'THANHTOAN [CODE]',
      qrTemplate: 'compact2',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: BankAccount) => {
    setEditingAccount(acc);
    setFormData({
      bankName: acc.bankName,
      bankCode: acc.bankCode,
      accountHolder: acc.accountHolder,
      accountNumber: acc.accountNumber,
      branch: acc.branch,
      accountType: acc.accountType,
      defaultTransferMemo: acc.defaultTransferMemo,
      qrTemplate: acc.qrTemplate,
      notes: acc.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountNumber.trim()) return;

    if (editingAccount) {
      const updated: BankAccount = {
        ...editingAccount,
        bankName: formData.bankName,
        bankCode: formData.bankCode,
        accountHolder: formData.accountHolder,
        accountNumber: formData.accountNumber,
        branch: formData.branch,
        accountType: formData.accountType,
        defaultTransferMemo: formData.defaultTransferMemo,
        qrTemplate: formData.qrTemplate,
        notes: formData.notes,
        updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };
      onSaveBankAccount(updated);
      if (selectedAccount.id === updated.id) {
        setSelectedAccount(updated);
      }
    } else {
      const newAcc: BankAccount = {
        id: `bank-${Date.now()}`,
        bankName: formData.bankName,
        bankCode: formData.bankCode,
        accountHolder: formData.accountHolder,
        accountNumber: formData.accountNumber,
        branch: formData.branch,
        accountType: formData.accountType,
        status: 'active',
        isDefault: bankAccounts.length === 0,
        qrTemplate: formData.qrTemplate,
        defaultTransferMemo: formData.defaultTransferMemo,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        totalTransactions: 0,
        totalReceived: 0,
        notes: formData.notes
      };
      onSaveBankAccount(newAcc);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Ngân hàng & VietQR
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tài Khoản Ngân Hàng</span>
          </button>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-amber-900">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-xs">Nguyên tắc Quản trị Tài chính & Dữ liệu Ngân hàng:</div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Hệ thống hỗ trợ <strong>không giới hạn số lượng tài khoản ngân hàng</strong>. 
            Để bảo toàn tính toàn vẹn của sổ quỹ và chứng từ đối soát tài chính, 
            <strong> tài khoản đã phát sinh giao dịch không bị xóa vật lý</strong> mà chỉ được chuyển sang trạng thái 
            <span className="font-bold"> "Ngừng sử dụng" (Inactive)</span> để bảo toàn lịch sử thu chi.
          </p>
        </div>
      </div>

      {/* Main Grid: Bank List + Interactive VietQR Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Bank Accounts Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Danh sách Tài khoản Thụ hưởng ({bankAccounts.length})</span>
            </h2>
            <span className="text-[11px] text-slate-500">
              {bankAccounts.filter((b) => b.status === 'active').length} đang hoạt động
            </span>
          </div>

          <div className="space-y-3">
            {bankAccounts.map((account) => {
              const isSelected = selectedAccount.id === account.id;
              const isActive = account.status === 'active';

              return (
                <div
                  key={account.id}
                  onClick={() => setSelectedAccount(account)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-blue-50/40 border-blue-400 shadow-sm ring-1 ring-blue-400/50'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                  } ${!isActive ? 'opacity-65 bg-slate-50/60' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-100/80 text-blue-800 font-extrabold text-[11px]">
                          {account.bankCode}
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-sm">{account.bankName}</h3>
                        {account.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Mặc định VietQR
                          </span>
                        )}
                        {!isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] border border-rose-200">
                            Ngừng sử dụng
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex items-center gap-1.5 bg-slate-100/90 px-2.5 py-1 rounded-xl font-mono text-sm font-bold text-slate-800">
                          <span>{account.accountNumber}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(account.accountNumber, `acc-${account.id}`);
                            }}
                            className="text-slate-500 hover:text-blue-600 p-0.5"
                            title="Sao chép STK"
                          >
                            {copiedField === `acc-${account.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[11px] font-bold text-slate-700">
                          {account.accountHolder}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                        <span>Chi nhánh: {account.branch}</span>
                        <span>•</span>
                        <span>Định dạng mã: <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">{account.defaultTransferMemo}</code></span>
                      </div>

                      {account.notes && (
                        <p className="text-[11px] text-slate-500 italic pt-1">
                          {account.notes}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 sm:self-start shrink-0 pt-2 sm:pt-0" onClick={(e) => e.stopPropagation()}>
                      {!account.isDefault && isActive && (
                        <button
                          type="button"
                          onClick={() => onSetDefaultAccount(account.id)}
                          className="px-2.5 py-1.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-[11px] transition"
                        >
                          Đặt mặc định
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(account)}
                        className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(account.id)}
                        className={`p-1.5 rounded-xl border transition ${
                          isActive
                            ? 'border-slate-200 text-amber-600 hover:bg-amber-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={isActive ? 'Ngừng sử dụng tài khoản' : 'Kích hoạt lại tài khoản'}
                      >
                        {isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Financial Stats Bar */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      Đã phát sinh <strong>{account.totalTransactions || 0}</strong> giao dịch
                    </span>
                    <span>
                      Tổng tiền đã nhận: <strong className="text-emerald-700 font-extrabold">{formatVND(account.totalReceived || 0)}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live VietQR Interactive Simulator */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-extrabold text-slate-900">
                Mô Phỏng VietQR Động Realtime
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] border border-blue-200">
              Napas 24/7 Dynamic
            </span>
          </div>

          {/* QR Card Display */}
          <div className="flex flex-col items-center p-4 bg-gradient-to-b from-slate-50 to-blue-50/30 rounded-2xl border border-blue-100/80 shadow-inner">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
              <img
                src={currentQrUrl}
                alt="VietQR Code"
                className="w-56 h-56 object-contain rounded-lg"
              />
              <div className="mt-2 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Số tiền thanh toán
                </span>
                <div className="text-lg font-extrabold text-blue-700">
                  {formatVND(testAmount)}
                </div>
              </div>
            </div>

            <div className="mt-3 text-center space-y-0.5">
              <div className="font-extrabold text-slate-800 text-xs">
                {selectedAccount.bankName}
              </div>
              <div className="font-mono text-xs text-slate-600 font-bold">
                STK: {selectedAccount.accountNumber} • {selectedAccount.accountHolder}
              </div>
              <div className="text-[11px] text-blue-700 font-mono font-bold bg-blue-100/60 px-2.5 py-0.5 rounded-full inline-block mt-1">
                Nội dung: {testMemo}
              </div>
            </div>
          </div>

          {/* Simulator Inputs */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Mẫu hiển thị VietQR (Template)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'compact2', label: 'Khung viền 2' },
                  { id: 'compact', label: 'Khung chuẩn' },
                  { id: 'qr_only', label: 'Chỉ mã QR' },
                  { id: 'print', label: 'Bản in' }
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.id as any)}
                    className={`py-1.5 px-2 rounded-xl font-bold text-[10px] transition cursor-pointer ${
                      selectedTemplate === tpl.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Số tiền thử nghiệm (VND)
              </label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800"
                step="10000"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nội dung chuyển khoản (Memo)
              </label>
              <input
                type="text"
                value={testMemo}
                onChange={(e) => setTestMemo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-800"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <a
                href={currentQrUrl}
                download="vietqr-freshdangkhoi.png"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải ảnh QR</span>
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(currentQrUrl, 'qr-url')}
                className="flex-1 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 font-bold text-blue-700 border border-blue-200 flex items-center justify-center gap-1.5 transition"
              >
                {copiedField === 'qr-url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'qr-url' ? 'Đã chép link' : 'Sao chép link QR'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Account Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5" />
                <div>
                  <h3 className="font-extrabold text-base">
                    {editingAccount ? 'Chỉnh Sửa Tài Khoản Ngân Hàng' : 'Thêm Mới Tài Khoản Ngân Hàng'}
                  </h3>
                  <p className="text-[11px] text-blue-100">Khai báo thông tin tài khoản nhận thanh toán VietQR</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã ngân hàng (BIN code) *</label>
                  <select
                    value={formData.bankCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      const bankNames: Record<string, string> = {
                        MB: 'MBBank (Ngân hàng TMCP Quân Đội)',
                        VCB: 'Vietcombank (Ngân hàng TMCP Ngoại Thương)',
                        TCB: 'Techcombank (Ngân hàng TMCP Kỹ Thương)',
                        BIDV: 'BIDV (Ngân hàng TMCP Đầu tư & Phát triển)',
                        ACB: 'ACB (Ngân hàng TMCP Á Châu)',
                        CTG: 'VietinBank (Ngân hàng TMCP Công Thương)',
                        VPB: 'VPBank (Ngân hàng TMCP Việt Nam Thịnh Vượng)',
                        TPB: 'TPBank (Ngân hàng TMCP Tiên Phong)',
                        STB: 'Sacombank (Ngân hàng TMCP Sài Gòn Thương Tín)'
                      };
                      setFormData({
                        ...formData,
                        bankCode: code,
                        bankName: bankNames[code] || `${code} Bank`
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="MB">MB (MBBank)</option>
                    <option value="VCB">VCB (Vietcombank)</option>
                    <option value="TCB">TCB (Techcombank)</option>
                    <option value="BIDV">BIDV (Đầu tư & Phát triển)</option>
                    <option value="ACB">ACB (Á Châu)</option>
                    <option value="CTG">CTG (VietinBank)</option>
                    <option value="VPB">VPB (VPBank)</option>
                    <option value="TPB">TPB (TPBank)</option>
                    <option value="STB">STB (Sacombank)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loại tài khoản *</label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="business">Doanh nghiệp / Hộ KD</option>
                    <option value="personal">Cá nhân</option>
                    <option value="collection">Tài khoản thu hộ</option>
                    <option value="escrow">Ký quỹ / Đảm bảo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên ngân hàng đầy đủ *</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số tài khoản *</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.trim() })}
                    placeholder="e.g. 999988886666"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên chủ tài khoản *</label>
                  <input
                    type="text"
                    value={formData.accountHolder}
                    onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value.toUpperCase() })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chi nhánh ngân hàng mở tài khoản</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="e.g. Chi nhánh Long Biên - Hà Nội"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cú pháp nội dung chuyển khoản mặc định</label>
                <input
                  type="text"
                  value={formData.defaultTransferMemo}
                  onChange={(e) => setFormData({ ...formData, defaultTransferMemo: e.target.value })}
                  placeholder="e.g. THANHTOAN [CODE]"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Hệ thống sẽ tự động thay thế <code className="text-blue-600">[CODE]</code> bằng Mã Đơn hàng hoặc Mã Hóa đơn.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú nội bộ</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Mục đích sử dụng..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-slate-700 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-sm transition"
                >
                  {editingAccount ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
