import React, { useState } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Laptop,
  Smartphone,
  Tablet,
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Sliders,
  History,
  Building,
  Warehouse as WarehouseIcon,
  LogOut,
  Send,
  MessageSquare,
  Copy,
  Check,
  FileSpreadsheet,
  Download,
  AlertCircle,
  HelpCircle,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  UserAccount,
  UserRole,
  PermissionAction,
  UserSession,
  SystemAuditEntry,
  Warehouse,
  OrgScope
} from '../types';
import { ROLE_DEFINITIONS, MODULE_LIST, ALL_PERMISSION_ACTIONS } from '../data/userData';
import { AuthService, CustomRoleDefinition } from '../services/authService';
import { SaaSService } from '../services/saasService';

interface UsersRolesViewProps {
  users: UserAccount[];
  warehouses: Warehouse[];
  onSaveUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  currentUser?: UserAccount;
}

export const UsersRolesView: React.FC<UsersRolesViewProps> = ({
  users,
  warehouses,
  onSaveUser,
  onDeleteUser,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles_matrix' | 'sessions' | 'audit_logs'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Custom roles
  const [customRoles, setCustomRoles] = useState<CustomRoleDefinition[]>(() => AuthService.getCustomRoles());
  const [selectedMatrixRole, setSelectedMatrixRole] = useState<string>('super_admin');
  const [matrixPermissions, setMatrixPermissions] = useState<UserAccount['permissions']>(
    ROLE_DEFINITIONS.super_admin.defaultPermissions
  );

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<SystemAuditEntry[]>(() => AuthService.getAuditLogs());
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('ALL');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');

  // Modals & Sub-states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalUserData, setModalUserData] = useState<Partial<UserAccount>>({});
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<UserAccount | null>(null);
  const [newGeneratedPass, setNewGeneratedPass] = useState('wiup@2026');
  const [requirePassChange, setRequirePassChange] = useState(true);
  const [copiedPass, setCopiedPass] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Custom Role Modal
  const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleBadgeColor, setNewRoleBadgeColor] = useState('bg-purple-50 text-purple-700 border-purple-200');

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.employeeCode && u.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.phone && u.phone.includes(searchTerm));
    const matchRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    const matchDept = selectedDepartmentFilter === 'ALL' || u.department === selectedDepartmentFilter;
    const matchStatus =
      selectedStatusFilter === 'ALL' ||
      (selectedStatusFilter === 'active' && u.status === 'active' && !u.isLocked) ||
      (selectedStatusFilter === 'locked' && (u.status === 'locked' || u.isLocked)) ||
      (selectedStatusFilter === 'inactive' && u.status === 'inactive');

    return matchSearch && matchRole && matchDept && matchStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Top Stats
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.status === 'active' && !u.isLocked).length;
  const lockedUsersCount = users.filter((u) => u.status === 'locked' || u.isLocked).length;
  const onlineCount = users.filter((u) => u.lastActive?.includes('trực tuyến') || u.lastActive?.includes('Vừa xong') || u.lastActive?.includes('phút')).length;

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const handleOpenAddUser = () => {
    setModalUserData({
      name: '',
      username: '',
      email: '',
      employeeCode: `NV-000${users.length + 1}`,
      phone: '',
      department: 'Khối Kinh Doanh & Phân Phối',
      position: 'Chuyên viên Kinh Doanh',
      role: 'sales',
      managementLevel: 'staff',
      dataScope: 'individual',
      status: 'active',
      branchId: 'BR01',
      assignedWarehouseIds: ['WH01'],
      twoFactorEnabled: false,
      forcePasswordChange: true,
      permissions: { ...ROLE_DEFINITIONS.sales.defaultPermissions }
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditUser = (user: UserAccount) => {
    setModalUserData({
      ...user,
      assignedWarehouseIds: user.assignedWarehouseIds || ['ALL'],
      permissions: { ...user.permissions }
    });
    setIsEditModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalUserData.name || !modalUserData.email) {
      showToast('Vui lòng điền đầy đủ Họ tên và Email.', 'error');
      return;
    }

    // Check plan user limit when creating a new user
    if (!modalUserData.id && currentUser?.tenantId) {
      const check = SaaSService.canAddUserToTenant(currentUser.tenantId);
      if (!check.allowed) {
        showToast(check.message, 'error');
        return;
      }
    }

    const roleDef = ROLE_DEFINITIONS[modalUserData.role as UserRole] || ROLE_DEFINITIONS.warehouse_staff;

    const saved: UserAccount = {
      id: modalUserData.id || `usr-${Date.now()}`,
      username: modalUserData.username || modalUserData.email.split('@')[0],
      email: modalUserData.email,
      name: modalUserData.name,
      employeeCode: modalUserData.employeeCode || `NV-${Date.now().toString().slice(-4)}`,
      phone: modalUserData.phone,
      department: modalUserData.department,
      position: modalUserData.position,
      role: modalUserData.role as UserRole,
      roleTitle: roleDef.name,
      managementLevel: modalUserData.managementLevel || 'staff',
      dataScope: (modalUserData.dataScope as OrgScope) || 'individual',
      status: (modalUserData.status as any) || 'active',
      branchId: modalUserData.branchId || 'BR01',
      branchName: modalUserData.branchId === 'BR02' ? 'Chi nhánh Miền Nam' : 'Chi nhánh Hà Nội',
      assignedWarehouseIds: modalUserData.assignedWarehouseIds || ['ALL'],
      twoFactorEnabled: modalUserData.twoFactorEnabled ?? false,
      forcePasswordChange: modalUserData.forcePasswordChange ?? false,
      failedLoginAttempts: modalUserData.failedLoginAttempts ?? 0,
      telegramUsername: modalUserData.telegramUsername,
      telegramChatId: modalUserData.telegramChatId,
      zaloPhone: modalUserData.zaloPhone,
      permissions: modalUserData.permissions || roleDef.defaultPermissions,
      sessions: modalUserData.sessions || [],
      createdAt: modalUserData.createdAt || new Date().toISOString().replace('T', ' ').slice(0, 16),
      lastActive: modalUserData.lastActive || 'Chưa đăng nhập',
      notes: modalUserData.notes
    };

    onSaveUser(saved);

    AuthService.addAuditLog({
      userId: currentUser?.id || 'usr-admin-ductang',
      userName: currentUser?.name || 'Super Admin',
      userRole: currentUser?.roleTitle || currentUser?.role || 'Super Admin',
      ipAddress: '113.190.234.12',
      device: 'Desktop Browser',
      action: modalUserData.id ? 'UPDATE' : 'CREATE',
      module: 'users',
      recordId: saved.id,
      recordCode: saved.employeeCode,
      description: modalUserData.id
        ? `Cập nhật thông tin & phân quyền cho tài khoản ${saved.name} (${saved.roleTitle || saved.role})`
        : `Tạo mới tài khoản phụ ${saved.name} (${saved.roleTitle || saved.role}, Data Scope: ${saved.dataScope})`,
      isCritical: true
    });

    setAuditLogs(AuthService.getAuditLogs());
    setIsEditModalOpen(false);
    showToast(modalUserData.id ? `Đã cập nhật ${saved.name} thành công!` : `Đã thêm mới tài khoản ${saved.name}!`);
  };

  const handleToggleLockUser = async (user: UserAccount) => {
    if (!currentUser) return;
    const res = await AuthService.toggleLockUser(user.id, currentUser);
    if (res.success && res.updatedUser) {
      onSaveUser(res.updatedUser);
      setAuditLogs(AuthService.getAuditLogs());
      showToast(res.message);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleOpenResetPassword = (user: UserAccount) => {
    setUserToReset(user);
    setNewGeneratedPass(`BizOne@${Math.floor(1000 + Math.random() * 9000)}`);
    setRequirePassChange(true);
    setCopiedPass(false);
    setIsResetPassModalOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!userToReset || !currentUser) return;
    const res = await AuthService.resetPassword(
      userToReset.id,
      newGeneratedPass,
      requirePassChange,
      currentUser
    );
    if (res.success) {
      const updatedUser = {
        ...userToReset,
        forcePasswordChange: requirePassChange
      };
      onSaveUser(updatedUser);
      setAuditLogs(AuthService.getAuditLogs());
      setIsResetPassModalOpen(false);
      showToast(`Đã reset mật khẩu cho ${userToReset.name}. Mật khẩu mới: ${newGeneratedPass}`);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleRoleMatrixSelect = (roleKey: string) => {
    setSelectedMatrixRole(roleKey);
    const predefined = ROLE_DEFINITIONS[roleKey as UserRole];
    if (predefined) {
      setMatrixPermissions(JSON.parse(JSON.stringify(predefined.defaultPermissions)));
    } else {
      const custom = customRoles.find((c) => c.key === roleKey);
      if (custom) {
        setMatrixPermissions(JSON.parse(JSON.stringify(custom.permissions)));
      }
    }
  };

  const toggleMatrixAction = (moduleKey: string, action: PermissionAction) => {
    setMatrixPermissions((prev) => {
      const current = prev?.[moduleKey] || [];
      const hasAction = current.includes(action);
      const updated = hasAction ? current.filter((a) => a !== action) : [...current, action];
      return {
        ...prev,
        [moduleKey]: updated
      };
    });
  };

  const handleSaveRoleMatrix = () => {
    if (ROLE_DEFINITIONS[selectedMatrixRole as UserRole]) {
      ROLE_DEFINITIONS[selectedMatrixRole as UserRole].defaultPermissions = matrixPermissions;
    } else {
      const updated = customRoles.map((r) =>
        r.key === selectedMatrixRole ? { ...r, permissions: matrixPermissions } : r
      );
      setCustomRoles(updated);
      AuthService.saveCustomRoles(updated);
    }

    AuthService.addAuditLog({
      userId: currentUser?.id || 'usr-admin-ductang',
      userName: currentUser?.name || 'Super Admin',
      userRole: currentUser?.roleTitle || currentUser?.role || 'Super Admin',
      ipAddress: '113.190.234.12',
      device: 'Desktop Browser',
      action: 'PERMISSION_CHANGE',
      module: 'rbac_matrix',
      recordId: selectedMatrixRole,
      description: `Đã cập nhật ma trận phân quyền chi tiết cho vai trò "${selectedMatrixRole}"`,
      isCritical: true
    });

    setAuditLogs(AuthService.getAuditLogs());
    showToast(`Đã lưu cấu hình ma trận phân quyền cho vai trò "${selectedMatrixRole}" thành công!`);
  };

  const handleCreateCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const roleKey = `custom_${newRoleName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    const newRole: CustomRoleDefinition = {
      id: `role-${Date.now()}`,
      key: roleKey,
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || 'Vai trò tùy chỉnh doanh nghiệp',
      badgeColor: newRoleBadgeColor,
      isSystemDefault: false,
      permissions: {
        dashboard: ['view'],
        customers: ['view', 'create', 'edit'],
        issues: ['view'],
        reports: ['view']
      },
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      createdBy: currentUser?.name || 'Admin'
    };

    const updated = [...customRoles, newRole];
    setCustomRoles(updated);
    AuthService.saveCustomRoles(updated);

    AuthService.addAuditLog({
      userId: currentUser?.id || 'usr-admin-ductang',
      userName: currentUser?.name || 'Super Admin',
      userRole: currentUser?.roleTitle || currentUser?.role || 'Super Admin',
      ipAddress: '113.190.234.12',
      device: 'Desktop Browser',
      action: 'CREATE',
      module: 'rbac_roles',
      recordId: newRole.id,
      description: `Đã tạo vai trò tùy chỉnh mới: ${newRole.name} (${newRole.key})`,
      isCritical: true
    });

    setAuditLogs(AuthService.getAuditLogs());
    setIsNewRoleModalOpen(false);
    setNewRoleName('');
    setNewRoleDesc('');
    setSelectedMatrixRole(newRole.key);
    setMatrixPermissions(newRole.permissions);
    showToast(`Đã tạo vai trò "${newRole.name}" thành công!`);
  };

  const handleRevokeSession = (user: UserAccount, sessionId: string) => {
    const updatedSessions = (user.sessions || []).filter((s) => s.id !== sessionId);
    const updatedUser: UserAccount = {
      ...user,
      sessions: updatedSessions
    };
    onSaveUser(updatedUser);
    showToast(`Đã thu hồi phiên đăng nhập của ${user.name}`);
  };

  const handleRevokeAllSessions = (user: UserAccount) => {
    const updatedUser: UserAccount = {
      ...user,
      sessions: []
    };
    onSaveUser(updatedUser);
    showToast(`Đã đăng xuất toàn bộ thiết bị của ${user.name}`);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1450px] mx-auto text-xs">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="font-bold text-xs">{statusMessage.text}</span>
        </div>
      )}

      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Tài khoản & Quyền
              </h1>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAddUser}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tài Khoản Phụ</span>
          </button>
        </div>
      </div>

      {/* Mini KPI Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng tài khoản</div>
            <div className="text-xl font-black text-slate-900">{totalUsersCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đang hoạt động</div>
            <div className="text-xl font-black text-emerald-700">{activeUsersCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đang tạm khóa</div>
            <div className="text-xl font-black text-rose-700">{lockedUsersCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Trực tuyến / Hôm nay</div>
            <div className="text-xl font-black text-indigo-700">{onlineCount}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'users', label: 'Danh Sách Tài Khoản & Nhân Viên', icon: Users, count: users.length },
          { id: 'roles_matrix', label: 'Ma Trận Phân Quyền Vai Trò (Roles)', icon: Sliders },
          { id: 'sessions', label: 'Quản Lý Thiết Bị & Phiên Đăng Nhập', icon: Laptop },
          { id: 'audit_logs', label: 'Nhật Ký Hoạt Động (Audit Log)', icon: History, count: auditLogs.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-extrabold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-2xl'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-2xl'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: USER LIST & MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto flex-1">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, username, mã NV, SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-slate-50 font-medium"
                />
              </div>

              {/* Role filter */}
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 bg-slate-50 text-xs"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="super_admin">Super Admin</option>
                <option value="ceo">Ban Giám Đốc (CEO)</option>
                <option value="admin">Admin Hệ thống</option>
                <option value="warehouse_manager">Trưởng Kho</option>
                <option value="warehouse_staff">Thủ Kho</option>
                <option value="accountant">Kế Toán</option>
                <option value="sales">Kinh Doanh</option>
                <option value="purchasing">Thu Mua</option>
              </select>

              {/* Status filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 bg-slate-50 text-xs"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="locked">Đang bị khóa</option>
                <option value="inactive">Vô hiệu hóa</option>
              </select>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Hiển thị <strong>{filteredUsers.length}</strong> / {users.length} tài khoản
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">STT & Tài khoản</th>
                    <th className="py-3 px-3">Phòng ban / Chức vụ</th>
                    <th className="py-3 px-3">Vai trò (Role)</th>
                    <th className="py-3 px-3">Phạm vi Dữ liệu (Scope)</th>
                    <th className="py-3 px-3">Kho & Chi nhánh</th>
                    <th className="py-3 px-3">Trạng thái</th>
                    <th className="py-3 px-3">Lần online cuối</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((user, idx) => {
                    const roleInfo = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.warehouse_staff;
                    const isLocked = user.status === 'locked' || user.isLocked;
                    const stt = (currentPage - 1) * itemsPerPage + idx + 1;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-400 font-bold text-[11px] w-4">
                              {stt}
                            </span>
                            <img
                              src={user.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`}
                              alt={user.name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-black text-slate-900 flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {user.employeeCode && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 font-mono text-[10px] text-slate-600">
                                    {user.employeeCode}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {user.username ? `@${user.username}` : user.email}
                              </div>
                              {user.phone && <div className="text-[10px] text-slate-400">{user.phone}</div>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800">{user.department || 'Vận Hành'}</div>
                          <div className="text-[11px] text-slate-500">{user.position || user.roleTitle}</div>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border inline-flex items-center gap-1 ${roleInfo.badgeColor}`}>
                            <Shield className="w-3 h-3" />
                            {roleInfo.name.split('(')[0].trim()}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase font-mono ${
                            user.dataScope === 'company_wide'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : user.dataScope === 'division'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : user.dataScope === 'department'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {user.dataScope === 'company_wide'
                              ? 'Toàn hệ thống'
                              : user.dataScope === 'division'
                              ? 'Khối / Chi nhánh'
                              : user.dataScope === 'department'
                              ? 'Phòng ban'
                              : 'Chỉ cá nhân'}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {user.assignedWarehouseIds?.includes('ALL') ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200 text-[10px]">
                              Tất cả kho
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {user.assignedWarehouseIds?.map((whId) => (
                                <span key={whId} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[10px]">
                                  {whId}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {isLocked ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px] border border-rose-200 flex items-center gap-1 w-fit">
                              <Lock className="w-3 h-3" />
                              Đang khóa
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Hoạt động
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                          {user.lastActive || 'Chưa đăng nhập'}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reset Password Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenResetPassword(user)}
                              className="p-1.5 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition cursor-pointer"
                              title="Đặt lại mật khẩu (Reset password)"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(user)}
                              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                              title="Chỉnh sửa tài khoản & phân quyền"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Lock Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleLockUser(user)}
                              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                                isLocked
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                              }`}
                              title={isLocked ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản'}
                            >
                              {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Trang <strong>{currentPage}</strong> / {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        p === currentPage
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & PERMISSION MATRIX */}
      {activeTab === 'roles_matrix' && (
        <div className="space-y-4">
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-indigo-900">
            <div className="flex items-start gap-3">
              <Sliders className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-extrabold text-xs">Cấu Hình Ma Trận Phân Quyền Chi Tiết Theo Vai Trò (RBAC)</div>
                <p className="text-[11px] text-indigo-800 leading-relaxed mt-0.5">
                  Tích chọn các quyền được phép thực hiện trên từng module. Các quyền <strong>Xóa (DELETE)</strong> và <strong>Cấu hình (CONFIG)</strong> là quyền nhạy cảm cao và được gắn cảnh báo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsNewRoleModalOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-indigo-300 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo Role Tùy Chỉnh</span>
              </button>

              <button
                type="button"
                onClick={handleSaveRoleMatrix}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Lưu Ma Trận Quyền</span>
              </button>
            </div>
          </div>

          {/* Role Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => {
              const isSelected = selectedMatrixRole === key;
              return (
                <button
                  key={key}
                  onClick={() => handleRoleMatrixSelect(key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {def.name.split('(')[0].trim()}
                </button>
              );
            })}
            {customRoles
              .filter((c) => !ROLE_DEFINITIONS[c.key as UserRole])
              .map((c) => {
                const isSelected = selectedMatrixRole === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => handleRoleMatrixSelect(c.key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                        : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    ★ {c.name}
                  </button>
                );
              })}
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-700 uppercase">
                    <th className="py-3 px-4">Phân Hệ Nghiệp Vụ (Module)</th>
                    <th className="py-3 px-3 text-center">Xem (VIEW)</th>
                    <th className="py-3 px-3 text-center">Tạo (CREATE)</th>
                    <th className="py-3 px-3 text-center">Sửa (EDIT)</th>
                    <th className="py-3 px-3 text-center text-rose-600">Xóa (DELETE) ⚠</th>
                    <th className="py-3 px-3 text-center">Xuất (EXPORT)</th>
                    <th className="py-3 px-3 text-center text-purple-700">Duyệt (APPROVE)</th>
                    <th className="py-3 px-3 text-center text-amber-700">Điều chỉnh / Cấu hình</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MODULE_LIST.map((mod) => {
                    const currentActions = matrixPermissions?.[mod.key] || [];

                    const renderCheckbox = (action: PermissionAction, isDangerous = false) => {
                      const checked = currentActions.includes(action);
                      return (
                        <td key={action} className="py-3 px-3 text-center">
                          <label className="inline-flex items-center justify-center p-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleMatrixAction(mod.key, action)}
                              className={`w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer ${
                                isDangerous ? 'accent-rose-600' : 'accent-indigo-600'
                              }`}
                            />
                          </label>
                        </td>
                      );
                    };

                    return (
                      <tr key={mod.key} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900">{mod.name}</div>
                          <div className="text-[10px] text-slate-400">{mod.description}</div>
                        </td>
                        {renderCheckbox('view')}
                        {renderCheckbox('create')}
                        {renderCheckbox('edit')}
                        {renderCheckbox('delete', true)}
                        {renderCheckbox('export')}
                        {renderCheckbox('approve')}
                        {renderCheckbox('adjust_cost')}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-indigo-600" />
              <span>Phiên Đăng Nhập & Thiết Bị Hoạt Động Trên Hệ Thống</span>
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">Giám sát & thu hồi phiên đăng nhập từ xa</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.flatMap((u) =>
              (u.sessions || []).map((session) => {
                const isMobile = session.deviceType === 'mobile';
                const isTablet = session.deviceType === 'tablet';
                const Icon = isMobile ? Smartphone : isTablet ? Tablet : Laptop;

                return (
                  <div
                    key={session.id}
                    className={`p-4 rounded-2xl border transition relative ${
                      session.isCurrent
                        ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300'
                        : 'bg-white border-slate-200 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>{session.deviceName}</span>
                            {session.isCurrent && (
                              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                                Đang dùng
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {u.name} ({u.roleTitle || u.role})
                          </div>
                        </div>
                      </div>

                      {!session.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(u, session.id)}
                          className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Đăng xuất thiết bị này"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                      <div className="flex justify-between">
                        <span>Hệ điều hành / Trình duyệt:</span>
                        <span className="font-bold text-slate-700">{session.os} • {session.browser}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Địa chỉ IP:</span>
                        <span className="font-mono font-bold text-slate-700">{session.ipAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lần cuối hoạt động:</span>
                        <span className="text-indigo-700 font-bold">{session.lastActive}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-4">
          {/* Audit Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo người thực hiện, nội dung hoặc module..."
                value={auditSearchTerm}
                onChange={(e) => setAuditSearchTerm(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700"
              >
                <option value="ALL">Tất cả hành động</option>
                <option value="LOGIN">LOGIN (Đăng nhập)</option>
                <option value="LOGOUT">LOGOUT (Đăng xuất)</option>
                <option value="CREATE">CREATE (Tạo mới)</option>
                <option value="UPDATE">UPDATE (Cập nhật)</option>
                <option value="DELETE">DELETE (Xóa)</option>
                <option value="RESET_PWD">RESET_PWD (Đổi mật khẩu)</option>
                <option value="PERMISSION_CHANGE">PERMISSION_CHANGE (Đổi quyền)</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase">
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-3">Người thực hiện</th>
                    <th className="py-3 px-3">Hành động</th>
                    <th className="py-3 px-3">Phân hệ</th>
                    <th className="py-3 px-4">Nội dung chi tiết</th>
                    <th className="py-3 px-3">Thiết bị & IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs
                    .filter((log) => {
                      const matchSearch =
                        log.userName.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
                        log.description.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
                        log.module.toLowerCase().includes(auditSearchTerm.toLowerCase());
                      const matchAction = auditActionFilter === 'ALL' || log.action === auditActionFilter;
                      return matchSearch && matchAction;
                    })
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900">{log.userName}</div>
                          <div className="text-[10px] text-indigo-700 font-bold">{log.userRole}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              log.action === 'CREATE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : log.action === 'UPDATE' || log.action === 'PERMISSION_CHANGE'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : log.action === 'LOGIN' || log.action === 'LOGOUT'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : log.action === 'RESET_PWD'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-700 uppercase text-[10px]">
                          {log.module}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-medium">{log.description}</div>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                          <div>{log.device}</div>
                          <div className="font-mono text-[10px] text-slate-400">{log.ipAddress}</div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create/Edit User */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-indigo-700 to-blue-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5" />
                <div>
                  <h3 className="font-extrabold text-base">
                    {modalUserData.id ? 'Cập Nhật Tài Khoản & Phân Quyền' : 'Tạo Mới Tài Khoản Phụ'}
                  </h3>
                  <p className="text-[11px] text-indigo-100">Cấu hình vai trò, gán chi nhánh/kho và thiết lập bảo mật</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ và tên nhân sự *</label>
                  <input
                    type="text"
                    value={modalUserData.name || ''}
                    onChange={(e) => setModalUserData({ ...modalUserData, name: e.target.value })}
                    required
                    placeholder="e.g. Nguyễn Văn An"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email đăng nhập *</label>
                  <input
                    type="email"
                    value={modalUserData.email || ''}
                    onChange={(e) => setModalUserData({ ...modalUserData, email: e.target.value })}
                    required
                    placeholder="e.g. an.nguyen@wiup.vn"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username / Mã NV</label>
                  <input
                    type="text"
                    value={modalUserData.username || ''}
                    onChange={(e) => setModalUserData({ ...modalUserData, username: e.target.value })}
                    placeholder="e.g. an.kho"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={modalUserData.phone || ''}
                    onChange={(e) => setModalUserData({ ...modalUserData, phone: e.target.value })}
                    placeholder="e.g. 0912 345 678"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vai trò (Role) *</label>
                  <select
                    value={modalUserData.role || 'warehouse_staff'}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      const roleDef = ROLE_DEFINITIONS[newRole];
                      setModalUserData({
                        ...modalUserData,
                        role: newRole,
                        permissions: { ...roleDef.defaultPermissions }
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="super_admin">Super Admin (Tối cao)</option>
                    <option value="ceo">CEO / Ban Giám Đốc</option>
                    <option value="admin">Admin Hệ thống</option>
                    <option value="warehouse_manager">Trưởng Kho</option>
                    <option value="warehouse_staff">Thủ Kho</option>
                    <option value="accountant">Kế Toán & Công Nợ</option>
                    <option value="sales">Kinh Doanh (Sales)</option>
                    <option value="purchasing">Thu Mua & NCC</option>
                  </select>
                </div>
              </div>

              {/* Data Scope & Org Level */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Phạm vi Dữ liệu (Data Scope) *
                  </label>
                  <select
                    value={modalUserData.dataScope || 'individual'}
                    onChange={(e) => setModalUserData({ ...modalUserData, dataScope: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900 bg-white"
                  >
                    <option value="company_wide">Toàn hệ thống (Admin, CEO)</option>
                    <option value="division">Theo Khối / Chi nhánh</option>
                    <option value="department">Theo Phòng ban</option>
                    <option value="team">Theo Nhóm</option>
                    <option value="individual">Chỉ dữ liệu cá nhân tạo / được giao</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Cấp bậc Quản lý</label>
                  <select
                    value={modalUserData.managementLevel || 'staff'}
                    onChange={(e) => setModalUserData({ ...modalUserData, managementLevel: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 bg-white"
                  >
                    <option value="staff">Nhân viên (Staff)</option>
                    <option value="team_lead">Trưởng nhóm (Team Lead)</option>
                    <option value="director">Trưởng phòng / Giám đốc (Director)</option>
                    <option value="deputy_ceo">Phó Tổng Giám Đốc (COO)</option>
                    <option value="ceo_chairman">Chủ tịch / CEO</option>
                  </select>
                </div>
              </div>

              {/* Security & Password Settings */}
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={modalUserData.forcePasswordChange ?? true}
                    onChange={(e) => setModalUserData({ ...modalUserData, forcePasswordChange: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Yêu cầu đổi mật khẩu lần đầu đăng nhập</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={modalUserData.twoFactorEnabled || false}
                    onChange={(e) => setModalUserData({ ...modalUserData, twoFactorEnabled: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Bật bảo mật 2 lớp (2FA)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-slate-700 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-extrabold text-white shadow-md cursor-pointer"
                >
                  {modalUserData.id ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {isResetPassModalOpen && userToReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Đặt Lại Mật Khẩu</h3>
                <p className="text-xs text-slate-500">Cấp mã truy cập mới cho {userToReset.name}</p>
              </div>
            </div>

            <div className="py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới được tạo:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newGeneratedPass}
                    onChange={(e) => setNewGeneratedPass(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 font-mono font-bold text-indigo-700 border border-slate-200 rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newGeneratedPass);
                      setCopiedPass(true);
                      setTimeout(() => setCopiedPass(false), 2000);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                    title="Sao chép mật khẩu"
                  >
                    {copiedPass ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                <input
                  type="checkbox"
                  checked={requirePassChange}
                  onChange={(e) => setRequirePassChange(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Bắt buộc nhân viên đổi mật khẩu khi đăng nhập</span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResetPassModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-sm cursor-pointer"
              >
                Xác nhận Reset Mật Khẩu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Custom Role */}
      {isNewRoleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Tạo Role Tùy Chỉnh Mới</h3>
                <p className="text-xs text-slate-500">Định nghĩa vai trò riêng cho quy trình doanh nghiệp</p>
              </div>
            </div>

            <form onSubmit={handleCreateCustomRole} className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Vai trò *</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Nhân Viên Marketing & Khuyến Mãi"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả nhiệm vụ</label>
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  rows={2}
                  placeholder="Mô tả phạm vi quyền hạn..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewRoleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-sm cursor-pointer"
                >
                  Tạo Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
