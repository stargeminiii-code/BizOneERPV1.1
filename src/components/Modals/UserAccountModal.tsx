import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Check,
  Lock,
  KeyRound,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { UserAccount, UserRole, PermissionAction } from '../../types';
import { ROLE_DEFINITIONS, ALL_PERMISSION_ACTIONS, MODULE_LIST } from '../../data/userData';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: UserAccount | null;
  onSaveUser: (user: UserAccount) => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSaveUser
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('warehouse_staff');
  const [roleTitle, setRoleTitle] = useState('');
  const [branchName, setBranchName] = useState('Tổng kho Hà Nội');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [notes, setNotes] = useState('');
  const [permissions, setPermissions] = useState<UserAccount['permissions']>(
    ROLE_DEFINITIONS.warehouse_staff.defaultPermissions
  );
  const [isCustomizingPermissions, setIsCustomizingPermissions] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setEmail(userToEdit.email);
      setName(userToEdit.name);
      setPhone(userToEdit.phone || '');
      setRole(userToEdit.role);
      setRoleTitle(userToEdit.roleTitle || ROLE_DEFINITIONS[userToEdit.role]?.name || '');
      setBranchName(userToEdit.branchName || 'Tổng kho Hà Nội');
      setStatus(userToEdit.status);
      setNotes(userToEdit.notes || '');
      setPermissions(userToEdit.permissions || ROLE_DEFINITIONS[userToEdit.role]?.defaultPermissions);
      setIsCustomizingPermissions(userToEdit.role === 'custom');
    } else {
      setEmail('');
      setName('');
      setPhone('');
      setRole('warehouse_staff');
      setRoleTitle(ROLE_DEFINITIONS.warehouse_staff.name);
      setBranchName('Tổng kho Hà Nội');
      setStatus('active');
      setNotes('');
      setPermissions(ROLE_DEFINITIONS.warehouse_staff.defaultPermissions);
      setIsCustomizingPermissions(false);
    }
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setRoleTitle(ROLE_DEFINITIONS[newRole]?.name || '');
    if (newRole !== 'custom') {
      setPermissions(ROLE_DEFINITIONS[newRole]?.defaultPermissions || {});
      setIsCustomizingPermissions(false);
    } else {
      setIsCustomizingPermissions(true);
    }
  };

  const handleTogglePermission = (
    moduleKey: keyof UserAccount['permissions'],
    action: PermissionAction
  ) => {
    setPermissions((prev) => {
      const currentActions = prev[moduleKey] || [];
      const hasAction = currentActions.includes(action);
      const nextActions = hasAction
        ? currentActions.filter((a) => a !== action)
        : [...currentActions, action];

      return {
        ...prev,
        [moduleKey]: nextActions
      };
    });
    setRole('custom');
    setIsCustomizingPermissions(true);
  };

  const handleToggleModuleAll = (moduleKey: keyof UserAccount['permissions']) => {
    setPermissions((prev) => {
      const currentActions = prev[moduleKey] || [];
      const hasAll = currentActions.length === ALL_PERMISSION_ACTIONS.length;
      return {
        ...prev,
        [moduleKey]: hasAll ? [] : [...ALL_PERMISSION_ACTIONS]
      };
    });
    setRole('custom');
    setIsCustomizingPermissions(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      alert('Vui lòng nhập đầy đủ Email và Họ tên người dùng!');
      return;
    }

    const savedUser: UserAccount = {
      id: userToEdit ? userToEdit.id : `usr-${Date.now()}`,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      phone: phone.trim(),
      avatar:
        userToEdit?.avatar ||
        `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=120&auto=format&fit=crop&q=80`,
      role,
      roleTitle: roleTitle || ROLE_DEFINITIONS[role]?.name,
      status,
      branchName,
      permissions,
      createdAt: userToEdit?.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
      lastActive: userToEdit?.lastActive || 'Chưa đăng nhập',
      notes: notes.trim()
    };

    onSaveUser(savedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {userToEdit ? 'Chỉnh Sửa Tài Khoản & Phân Quyền' : 'Thêm Thành Viên & Phân Quyền Mới'}
              </h2>
              <p className="text-slate-500 text-[11px]">
                Cấp quyền truy cập hệ thống ERP theo địa chỉ Email và vai trò nghiệp vụ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Email & Basic Info */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 pb-2 border-b border-slate-200 text-xs">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Thông tin tài khoản đăng nhập</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email tài khoản <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="ví dụ: nhanvien@congty.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và tên nhân sự <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: Đức Tăng / Nguyễn Văn An"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="09xx xxx xxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chi nhánh trực thuộc</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tổng kho Hà Nội / Chi nhánh TP.HCM"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>Vai trò & Nhóm quyền hạn:</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomizingPermissions(!isCustomizingPermissions)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isCustomizingPermissions ? 'Thu gọn ma trận quyền' : 'Tùy chỉnh quyền chi tiết'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(ROLE_DEFINITIONS) as UserRole[]).map((rKey) => {
                const rDef = ROLE_DEFINITIONS[rKey];
                const isSelected = role === rKey;
                return (
                  <div
                    key={rKey}
                    onClick={() => handleRoleChange(rKey)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{rDef.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        {rDef.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Granular Permissions Matrix */}
          {isCustomizingPermissions && (
            <div className="bg-white rounded-2xl border border-indigo-200 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                <span className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  Ma trận phân quyền chi tiết từng phân hệ
                </span>
                <span className="text-[10px] text-slate-400">Xem • Thêm • Sửa • Xóa</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100">
                {MODULE_LIST.map((mod) => {
                  const modActions = permissions[mod.key] || [];
                  const isAll = modActions.length === ALL_PERMISSION_ACTIONS.length;

                  return (
                    <div key={mod.key} className="pt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <button
                          type="button"
                          onClick={() => handleToggleModuleAll(mod.key)}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition ${
                            isAll ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isAll ? 'Đầy đủ' : 'Chọn hết'}
                        </button>
                        <span className="font-bold text-slate-800 text-xs">{mod.name}</span>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2">
                        {ALL_PERMISSION_ACTIONS.map((act) => {
                          const isChecked = modActions.includes(act);
                          const actLabel =
                            act === 'view' ? 'Xem' : act === 'create' ? 'Thêm' : act === 'edit' ? 'Sửa' : 'Xóa';
                          const color =
                            act === 'view'
                              ? 'text-blue-700 bg-blue-50 border-blue-200'
                              : act === 'create'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : act === 'edit'
                              ? 'text-amber-700 bg-amber-50 border-amber-200'
                              : 'text-rose-700 bg-rose-50 border-rose-200';

                          return (
                            <button
                              key={act}
                              type="button"
                              onClick={() => handleTogglePermission(mod.key, act)}
                              className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                isChecked
                                  ? `${color} ring-1 ring-inset`
                                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {isChecked ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <Lock className="w-3 h-3 shrink-0 opacity-40" />}
                              <span>{actLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Account Status */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block">Trạng thái tài khoản</span>
              <span className="text-[10px] text-slate-500">
                Cho phép hoặc tạm dừng quyền đăng nhập vào ERP
              </span>
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className={`font-bold text-xs px-3 py-1.5 rounded-xl border ${
                status === 'active'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã khóa / Tạm dừng</option>
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{userToEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
