import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Briefcase,
  Globe,
  MessageSquare,
  ShieldCheck,
  Building,
  RotateCw,
  Eye,
  Info
} from 'lucide-react';
import { Supplier, SupplierType, Branch } from '../../types';
import {
  lookupTaxCode,
  normalizeTaxCode,
  generateSupplierCode,
  checkDuplicateSupplierTaxCode,
  checkDuplicateSupplierCode
} from '../../services/taxCodeService';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit?: Supplier | null;
  existingSuppliers: Supplier[];
  branches?: Branch[];
  onSave: (supplier: Supplier, isQuickCreate?: boolean) => void;
  onViewExisting?: (existingSupplier: Supplier) => void;
  isQuickCreate?: boolean;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  supplierToEdit,
  existingSuppliers = [],
  branches = [],
  onSave,
  onViewExisting,
  isQuickCreate = false
}) => {
  const isEditing = Boolean(supplierToEdit);

  // Active section tab for navigation
  const [activeTab, setActiveTab] = useState<'all' | 'enterprise' | 'tax' | 'contact' | 'bank' | 'terms'>('all');

  // Form states
  const [code, setCode] = useState(() => supplierToEdit?.code || generateSupplierCode(existingSuppliers));
  const [taxCode, setTaxCode] = useState(() => supplierToEdit?.taxCode || '');
  const [name, setName] = useState(() => supplierToEdit?.name || '');
  const [legalName, setLegalName] = useState(() => supplierToEdit?.legalName || '');
  const [shortName, setShortName] = useState(() => supplierToEdit?.shortName || '');
  const [type, setType] = useState<SupplierType>(() => supplierToEdit?.type || 'company');
  const [parentTaxCode, setParentTaxCode] = useState(() => supplierToEdit?.parentTaxCode || '');
  const [parentSupplierId, setParentSupplierId] = useState(() => supplierToEdit?.parentSupplierId || '');

  const [representative, setRepresentative] = useState(() => supplierToEdit?.representative || '');
  const [taxStatus, setTaxStatus] = useState(() => supplierToEdit?.taxStatus || 'NNT đang hoạt động');
  const [taxAuthority, setTaxAuthority] = useState(() => supplierToEdit?.taxAuthority || '');

  const [address, setAddress] = useState(() => supplierToEdit?.address || '');
  const [city, setCity] = useState(() => supplierToEdit?.city || 'Hà Nội');
  const [district, setDistrict] = useState(() => supplierToEdit?.district || '');

  const [contactPerson, setContactPerson] = useState(() => supplierToEdit?.contactPerson || '');
  const [contactTitle, setContactTitle] = useState(() => supplierToEdit?.contactTitle || '');
  const [phone, setPhone] = useState(() => supplierToEdit?.phone || '');
  const [contactPhone, setContactPhone] = useState(() => supplierToEdit?.contactPhone || '');
  const [email, setEmail] = useState(() => supplierToEdit?.email || '');
  const [website, setWebsite] = useState(() => supplierToEdit?.website || '');
  const [zalo, setZalo] = useState(() => supplierToEdit?.zalo || '');

  const [bankName, setBankName] = useState(() => supplierToEdit?.bankName || '');
  const [bankAccount, setBankAccount] = useState(() => supplierToEdit?.bankAccount || '');
  const [bankAccountName, setBankAccountName] = useState(() => supplierToEdit?.bankAccountName || '');
  const [bankBranch, setBankBranch] = useState(() => supplierToEdit?.bankBranch || '');

  const [branchId, setBranchId] = useState(() => supplierToEdit?.branchId || branches[0]?.id || 'BR01');
  const [creditLimit, setCreditLimit] = useState<number>(() => supplierToEdit?.creditLimit || 100000000);
  const [paymentTermDays, setPaymentTermDays] = useState<number>(() => supplierToEdit?.paymentTermDays || 30);
  const [paymentTerms, setPaymentTerms] = useState(() => supplierToEdit?.paymentTerms || 'Chuyển khoản trong 30 ngày');
  const [defaultPriceList, setDefaultPriceList] = useState(() => supplierToEdit?.defaultPriceList || 'Bảng giá đại lý cấp 1');
  const [status, setStatus] = useState<'active' | 'inactive'>(() => supplierToEdit?.status || 'active');
  const [notes, setNotes] = useState(() => supplierToEdit?.notes || '');
  const [suppliedProductsText, setSuppliedProductsText] = useState(() =>
    supplierToEdit?.suppliedProducts?.join(', ') || ''
  );

  // Tax lookup states
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupSuccessMsg, setLookupSuccessMsg] = useState<string | null>(null);
  const [lookupErrorMsg, setLookupErrorMsg] = useState<string | null>(null);
  const [duplicateSupplier, setDuplicateSupplier] = useState<Supplier | null>(null);

  // Re-check duplicate MST on change
  useEffect(() => {
    if (taxCode.trim().length >= 10) {
      const dup = checkDuplicateSupplierTaxCode(taxCode, existingSuppliers, supplierToEdit?.id);
      setDuplicateSupplier(dup);
    } else {
      setDuplicateSupplier(null);
    }
  }, [taxCode, existingSuppliers, supplierToEdit?.id]);

  // Handle Tax Code Lookup
  const handleLookupTaxCode = async (mstToLookup?: string) => {
    const codeToSearch = mstToLookup || taxCode;
    const cleanTax = normalizeTaxCode(codeToSearch);

    if (!cleanTax || cleanTax.length < 9) {
      setLookupErrorMsg('Vui lòng nhập Mã số thuế hợp lệ (10 số hoặc 13 số).');
      setLookupSuccessMsg(null);
      return;
    }

    setIsLookingUp(true);
    setLookupErrorMsg(null);
    setLookupSuccessMsg(null);

    try {
      const result = await lookupTaxCode(cleanTax);

      // Check if duplicate in state
      const dup = checkDuplicateSupplierTaxCode(cleanTax, existingSuppliers, supplierToEdit?.id);
      if (dup) {
        setDuplicateSupplier(dup);
      }

      // Auto-fill retrieved data
      setTaxCode(result.taxCode);
      if (result.name && !name) setName(result.name);
      if (result.legalName) setLegalName(result.legalName);
      if (result.shortName && !shortName) setShortName(result.shortName);
      if (result.type) setType(result.type);
      if (result.address) setAddress(result.address);
      if (result.city) setCity(result.city);
      if (result.district) setDistrict(result.district);
      if (result.representative) setRepresentative(result.representative);
      if (result.status) setTaxStatus(result.status);
      if (result.taxAuthority) setTaxAuthority(result.taxAuthority);
      if (result.phone && !phone) setPhone(result.phone);
      if (result.email && !email) setEmail(result.email);
      if (result.parentTaxCode) {
        setParentTaxCode(result.parentTaxCode);
        // Link parent supplier if exists
        const parentSup = existingSuppliers.find((s) => s.taxCode === result.parentTaxCode);
        if (parentSup) setParentSupplierId(parentSup.id);
      }

      setLookupSuccessMsg(
        `Đã tìm thấy thông tin: ${result.legalName || result.name} (${result.source === 'online_api' ? 'Xác thực Online' : 'Dữ liệu chuẩn hóa'})`
      );
    } catch (err: any) {
      setLookupErrorMsg(
        err.message || 'Không tìm thấy dữ liệu hoặc dịch vụ tra cứu đang tạm thời không khả dụng. Bạn có thể nhập thông tin thủ công.'
      );
      setLookupSuccessMsg(null);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Vui lòng nhập Tên nhà cung cấp / Tên doanh nghiệp.');
      return;
    }

    if (!taxCode.trim()) {
      alert('Vui lòng nhập Mã số thuế.');
      return;
    }

    // Check duplicate code
    const dupCode = checkDuplicateSupplierCode(code, existingSuppliers, supplierToEdit?.id);
    if (dupCode) {
      alert(`Mã nhà cung cấp "${code}" đã tồn tại cho NCC: ${dupCode.name}. Vui lòng đổi mã khác.`);
      return;
    }

    // Check duplicate tax code if not editing same
    const dupTax = checkDuplicateSupplierTaxCode(taxCode, existingSuppliers, supplierToEdit?.id);
    if (dupTax && !supplierToEdit) {
      const confirmSave = window.confirm(
        `Mã số thuế ${taxCode} đã tồn tại trong hệ thống (NCC: ${dupTax.code} - ${dupTax.name}). Bạn có chắc chắn vẫn muốn lưu không?`
      );
      if (!confirmSave) return;
    }

    const suppliedProductsArray = suppliedProductsText
      ? suppliedProductsText.split(',').map((s) => s.trim()).filter(Boolean)
      : supplierToEdit?.suppliedProducts || [];

    const newSupplier: Supplier = {
      id: supplierToEdit?.id || `sup-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      legalName: legalName.trim() || name.trim(),
      shortName: shortName.trim(),
      taxCode: normalizeTaxCode(taxCode),
      type,
      parentTaxCode: parentTaxCode ? normalizeTaxCode(parentTaxCode) : undefined,
      parentSupplierId: parentSupplierId || undefined,
      representative: representative.trim(),
      taxStatus: taxStatus.trim(),
      taxAuthority: taxAuthority.trim(),
      address: address.trim(),
      city: city.trim(),
      district: district.trim(),
      phone: phone.trim(),
      contactPerson: contactPerson.trim(),
      contactTitle: contactTitle.trim(),
      contactPhone: contactPhone.trim() || phone.trim(),
      email: email.trim(),
      website: website.trim(),
      zalo: zalo.trim(),
      bankName: bankName.trim(),
      bankAccount: bankAccount.trim(),
      bankAccountName: bankAccountName.trim() || legalName.trim(),
      bankBranch: bankBranch.trim(),
      branchId,
      creditLimit: Number(creditLimit) || 0,
      paymentTermDays: Number(paymentTermDays) || 30,
      paymentTerms: paymentTerms.trim(),
      defaultPriceList: defaultPriceList.trim(),
      debt: supplierToEdit?.debt || 0,
      totalPurchased: supplierToEdit?.totalPurchased || 0,
      purchaseOrderCount: supplierToEdit?.purchaseOrderCount || 0,
      lastPurchaseDate: supplierToEdit?.lastPurchaseDate || '',
      suppliedProducts: suppliedProductsArray,
      status,
      notes: notes.trim(),
      createdAt: supplierToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newSupplier, isQuickCreate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="supplier-modal-backdrop"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="supplier-modal-content"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {isEditing ? 'Chỉnh Sửa Nhà Cung Cấp' : 'Thêm Mới Nhà Cung Cấp'}
                </h2>
                {isQuickCreate && (
                  <span className="text-[11px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300/60">
                    Tạo nhanh từ Phiếu Nhập
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Tự động tra cứu MST, quản lý pháp lý, thông tin ngân hàng & chính sách công nợ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate MST Alert Banner if detected */}
        {duplicateSupplier && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">
                  Nhà cung cấp này đã tồn tại trong hệ thống!
                </p>
                <p className="text-amber-800 mt-0.5">
                  Mã: <span className="font-bold font-mono">{duplicateSupplier.code}</span> | Tên:{' '}
                  <span className="font-bold">{duplicateSupplier.name}</span> | MST:{' '}
                  <span className="font-mono font-bold">{duplicateSupplier.taxCode}</span> (
                  {duplicateSupplier.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'})
                </p>
              </div>
            </div>
            {onViewExisting && (
              <button
                type="button"
                onClick={() => onViewExisting(duplicateSupplier)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem NCC</span>
              </button>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'all' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả thông tin
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('enterprise')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'enterprise' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A. Doanh nghiệp
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tax')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'tax' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              B. Thuế & Pháp lý
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contact')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'contact' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              C. Liên hệ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bank')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'bank' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              D. Ngân hàng
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'terms' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              E. Giao dịch & Công nợ
            </button>
          </div>

          {/* ===================================================
              A. THÔNG TIN DOANH NGHIỆP & TRA CỨU MST
             =================================================== */}
          {(activeTab === 'all' || activeTab === 'enterprise' || activeTab === 'tax') && (
            <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span>A. THÔNG TIN DOANH NGHIỆP & MÃ SỐ THUẾ</span>
                </h3>
                <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Tự động tra cứu MST
                </span>
              </div>

              {/* MST Lookup Bar */}
              <div className="bg-white p-3.5 rounded-xl border border-blue-200/80 shadow-xs space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">
                  Mã số thuế (MST) <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Nhập 10 số (hoặc 13 số chi nhánh) VD: 0101452909, 3700381324..."
                      value={taxCode}
                      onChange={(e) => {
                        setTaxCode(e.target.value);
                        setLookupErrorMsg(null);
                        setLookupSuccessMsg(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLookupTaxCode();
                        }
                      }}
                      className="w-full pl-3 pr-8 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 uppercase"
                    />
                    {taxCode && (
                      <button
                        type="button"
                        onClick={() => setTaxCode('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLookupTaxCode()}
                    disabled={isLookingUp || !taxCode.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                  >
                    {isLookingUp ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Đang tra cứu...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Tra cứu MST</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Lookup status messages */}
                {lookupSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{lookupSuccessMsg}</span>
                  </div>
                )}

                {lookupErrorMsg && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{lookupErrorMsg}</span>
                  </div>
                )}
              </div>

              {/* Grid 1: Mã NCC, Tên hiển thị, Tên pháp lý, Tên viết tắt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã Nhà Cung Cấp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl focus:border-blue-500 uppercase"
                    placeholder="NCC000001"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Tự sinh mã không trùng lặp</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên hiển thị / Thương mại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                    placeholder="VD: Tập đoàn Hòa Phát, Tôn Hoa Sen..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên doanh nghiệp pháp lý (Theo ĐKKD)
                  </label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500 uppercase font-semibold"
                    placeholder="CÔNG TY CỔ PHẦN..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên viết tắt / Giao dịch
                  </label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500 uppercase"
                    placeholder="VD: HOA PHAT GROUP"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Loại đối tượng
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as SupplierType)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500 font-semibold"
                  >
                    <option value="company">Công ty / Doanh nghiệp</option>
                    <option value="branch">Chi nhánh hạch toán phụ thuộc/độc lập</option>
                    <option value="office">Văn phòng đại diện (VPĐD)</option>
                    <option value="household">Hộ kinh doanh cá thể</option>
                    <option value="individual">Cá nhân / Chuyên gia</option>
                    <option value="other">Nhà cung cấp khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trạng thái hoạt động
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className={`w-full px-3 py-2 text-xs border rounded-xl font-bold ${
                      status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Ngừng hoạt động</option>
                  </select>
                </div>

                {type === 'branch' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      MST Công ty mẹ
                    </label>
                    <input
                      type="text"
                      value={parentTaxCode}
                      onChange={(e) => setParentTaxCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                      placeholder="VD: 0101452909"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================
              B. THÔNG TIN THUẾ / PHÁP LÝ & ĐỊA CHỈ
             =================================================== */}
          {(activeTab === 'all' || activeTab === 'tax') && (
            <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>B. THÔNG TIN THUẾ & ĐỊA CHỈ ĐĂNG KÝ KINH DOANH</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Địa chỉ đăng ký kinh doanh
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                      placeholder="Số nhà, đường, phường/xã..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tỉnh / Thành phố
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                    placeholder="Hà Nội, TP.HCM, Bình Dương..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quận / Huyện
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                    placeholder="Quận/Huyện/Thị xã"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Người đại diện pháp luật
                  </label>
                  <input
                    type="text"
                    value={representative}
                    onChange={(e) => setRepresentative(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500 font-semibold"
                    placeholder="Họ và tên người đại diện"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cơ quan quản lý thuế
                  </label>
                  <input
                    type="text"
                    value={taxAuthority}
                    onChange={(e) => setTaxAuthority(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                    placeholder="Cục Thuế / Chi cục Thuế..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===================================================
              C. THÔNG TIN LIÊN HỆ & SALE PHỤ TRÁCH
             =================================================== */}
          {(activeTab === 'all' || activeTab === 'contact') && (
            <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>C. THÔNG TIN LIÊN HỆ & SALE PHỤ TRÁCH</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Người liên hệ / Sale phụ trách
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500 font-semibold"
                    placeholder="VD: Nguyễn Văn Minh"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chức vụ người liên hệ
                  </label>
                  <input
                    type="text"
                    value={contactTitle}
                    onChange={(e) => setContactTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                    placeholder="Trưởng phòng KD / Sale dự án"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại doanh nghiệp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                      placeholder="024 3978 7777"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại Sale / Zalo
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                      placeholder="0912 345 678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email giao dịch
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                      placeholder="sales@hoaphat.com.vn"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                      placeholder="https://hoaphat.com.vn"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================
              D. THÔNG TIN TÀI KHOẢN NGÂN HÀNG
             =================================================== */}
          {(activeTab === 'all' || activeTab === 'bank') && (
            <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-600" />
                <span>D. THÔNG TIN TÀI KHOẢN NGÂN HÀNG & THANH TOÁN</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên ngân hàng
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                    placeholder="VD: Vietcombank, BIDV, Techcombank..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số tài khoản
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                    placeholder="0011002233445"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chủ tài khoản
                  </label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold uppercase bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                    placeholder="CONG TY CP..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chi nhánh ngân hàng
                  </label>
                  <input
                    type="text"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                    placeholder="Chi nhánh Thăng Long / Nam Kỳ Khởi Nghĩa..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===================================================
              E. CHÍNH SÁCH GIAO DỊCH, CÔNG NỢ & SẢN PHẨM
             =================================================== */}
          {(activeTab === 'all' || activeTab === 'terms') && (
            <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>E. CHÍNH SÁCH GIAO DỊCH, CÔNG NỢ & SẢN PHẨM</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chi nhánh phụ trách
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500 font-semibold"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                    {!branches.length && (
                      <>
                        <option value="BR01">Chi nhánh Chính - Hà Nội (BR01)</option>
                        <option value="BR02">Chi nhánh Miền Nam - TP.HCM (BR02)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hạn mức công nợ (VND)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                    placeholder="100000000"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Intl.NumberFormat('vi-VN').format(creditLimit)} đ
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thời hạn thanh toán (Số ngày)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={paymentTermDays}
                    onChange={(e) => setPaymentTermDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                    placeholder="30"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Điều khoản thanh toán mặc định
                  </label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                    placeholder="VD: Chuyển khoản trong 30 ngày kể từ ngày nhận đủ hóa đơn GTGT"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bảng giá áp dụng
                  </label>
                  <input
                    type="text"
                    value={defaultPriceList}
                    onChange={(e) => setDefaultPriceList(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                    placeholder="Bảng giá đại lý cấp 1"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mặt hàng chính cung cấp (Ngăn cách bởi dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={suppliedProductsText}
                    onChange={(e) => setSuppliedProductsText(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                    placeholder="Thép cuộn mạ kẽm Ø6, Kẽm gai bọc nhựa, Tôn lạnh màu 0.45mm..."
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ghi chú nội bộ
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500"
                    placeholder="Thông tin thêm về năng lực cung ứng, thỏa thuận chiết khấu..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Cập Nhật Nhà Cung Cấp' : 'Lưu Nhà Cung Cấp'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
