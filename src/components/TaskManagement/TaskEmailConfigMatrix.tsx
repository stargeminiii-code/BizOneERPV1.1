import React, { useState } from 'react';
import {
  Mail,
  Users,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Save,
  RotateCcw,
  Bell,
  Check
} from 'lucide-react';
import { UserAccount, UserEmailNotificationConfig } from '../../types';

interface TaskEmailConfigMatrixProps {
  users: UserAccount[];
  onSaveUser: (updatedUser: UserAccount) => void;
}

export const TaskEmailConfigMatrix: React.FC<TaskEmailConfigMatrixProps> = ({
  users,
  onSaveUser
}) => {
  // Global Fallback Default Config (Tính Năng 2: Giữ cấu hình email toàn cục làm mặc định)
  const [globalDefaults, setGlobalDefaults] = useState<UserEmailNotificationConfig>({
    enabled: true,
    overdueTasks: true,
    upcomingDueTasks: true,
    unupdatedTasks: true,
    dailyDigest: true,
    restockAlerts: true,
    debtAlerts: true
  });

  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  const handleToggleUserEmailField = (
    user: UserAccount,
    field: keyof UserEmailNotificationConfig
  ) => {
    const currentConfig = user.emailNotificationSettings || { ...globalDefaults };
    const updatedConfig: UserEmailNotificationConfig = {
      ...currentConfig,
      [field]: !currentConfig[field]
    };

    const updatedUser: UserAccount = {
      ...user,
      emailNotificationSettings: updatedConfig
    };

    onSaveUser(updatedUser);
    setSavedSuccess(`Đã lưu cấu hình email cho ${user.name}`);
    setTimeout(() => setSavedSuccess(null), 2500);
  };

  const handleResetToGlobal = (user: UserAccount) => {
    const updatedUser: UserAccount = {
      ...user,
      emailNotificationSettings: undefined // Revert to global fallback
    };
    onSaveUser(updatedUser);
    setSavedSuccess(`Đã khôi phục cài đặt mặc định toàn cục cho ${user.name}`);
    setTimeout(() => setSavedSuccess(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <span>Cấu Hình Thông Báo Email Theo Từng Nhân Sự & Vai Trò</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Thiết lập ma trận nhận email nhắc việc (Quá hạn, Sắp đến hạn, Chưa cập nhật & Báo cáo 7h sáng). Cấu hình riêng sẽ ghi đè cấu hình toàn cục.
          </p>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{savedSuccess}</span>
          </div>
        )}
      </div>

      {/* 2. Global Default Fallback Settings Card */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Cấu Hình Email Mặc Định Toàn Cục (Global Defaults)</span>
          </span>
          <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
            Áp dụng khi nhân viên chưa cấu hình riêng
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <label className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={globalDefaults.overdueTasks}
              onChange={(e) => setGlobalDefaults({ ...globalDefaults, overdueTasks: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span>Nhắc việc quá hạn</span>
          </label>

          <label className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={globalDefaults.upcomingDueTasks}
              onChange={(e) => setGlobalDefaults({ ...globalDefaults, upcomingDueTasks: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span>Sắp đến hạn (3 ngày)</span>
          </label>

          <label className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={globalDefaults.unupdatedTasks}
              onChange={(e) => setGlobalDefaults({ ...globalDefaults, unupdatedTasks: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span>Chưa cập nhật (&gt;3 ngày)</span>
          </label>

          <label className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={globalDefaults.dailyDigest}
              onChange={(e) => setGlobalDefaults({ ...globalDefaults, dailyDigest: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span>Báo cáo 7h sáng</span>
          </label>
        </div>
      </div>

      {/* 3. Per-User Notification Matrix Table (Tính Năng 2) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="p-3.5">Nhân viên / Email</th>
                <th className="p-3.5">Vai trò / Phòng ban</th>
                <th className="p-3.5 text-center">Bật Email</th>
                <th className="p-3.5 text-center">Quá hạn</th>
                <th className="p-3.5 text-center">Sắp đến hạn</th>
                <th className="p-3.5 text-center">Chưa cập nhật</th>
                <th className="p-3.5 text-center">Báo cáo 7h</th>
                <th className="p-3.5 text-center">Trạng thái cấu hình</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const config = user.emailNotificationSettings || globalDefaults;
                const isCustom = Boolean(user.emailNotificationSettings);

                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User info */}
                    <td className="p-3.5 font-semibold text-slate-900">
                      <div>{user.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{user.email}</div>
                    </td>

                    {/* Department / Role */}
                    <td className="p-3.5 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[10px]">
                        {user.roleTitle || user.role}
                      </span>
                      {user.department && <div className="text-[10px] text-slate-400 mt-0.5">{user.department}</div>}
                    </td>

                    {/* Enabled Switch */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={() => handleToggleUserEmailField(user, 'enabled')}
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                      />
                    </td>

                    {/* Overdue */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={config.overdueTasks}
                        disabled={!config.enabled}
                        onChange={() => handleToggleUserEmailField(user, 'overdueTasks')}
                        className="w-4 h-4 rounded text-rose-600 disabled:opacity-30 cursor-pointer"
                      />
                    </td>

                    {/* Upcoming */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={config.upcomingDueTasks}
                        disabled={!config.enabled}
                        onChange={() => handleToggleUserEmailField(user, 'upcomingDueTasks')}
                        className="w-4 h-4 rounded text-blue-600 disabled:opacity-30 cursor-pointer"
                      />
                    </td>

                    {/* Unupdated in 3 days */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={config.unupdatedTasks}
                        disabled={!config.enabled}
                        onChange={() => handleToggleUserEmailField(user, 'unupdatedTasks')}
                        className="w-4 h-4 rounded text-amber-600 disabled:opacity-30 cursor-pointer"
                      />
                    </td>

                    {/* Daily Digest */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={config.dailyDigest}
                        disabled={!config.enabled}
                        onChange={() => handleToggleUserEmailField(user, 'dailyDigest')}
                        className="w-4 h-4 rounded text-indigo-600 disabled:opacity-30 cursor-pointer"
                      />
                    </td>

                    {/* Status & Revert Button */}
                    <td className="p-3.5 text-center">
                      {isCustom ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-bold text-[10px]">
                            Tùy chỉnh riêng
                          </span>
                          <button
                            onClick={() => handleResetToGlobal(user)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            title="Khôi phục về mặc định toàn cục"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium text-[10px]">
                          Theo mặc định toàn cục
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
