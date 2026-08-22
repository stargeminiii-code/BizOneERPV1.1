import React, { useState } from 'react';
import {
  X,
  Target,
  AlertTriangle,
  UserCheck,
  Calendar,
  Sparkles,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';
import { KpiActionPlan, RootCauseCategory, UserAccount, EnterprisePlan } from '../../types';
import { ROOT_CAUSE_DEFINITIONS } from '../../services/planningKpiEngine';
import { formatNumberWithDots } from '../../data/administrativeData';

interface KpiActionAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAction: (action: KpiActionPlan) => void;
  selectedPlan?: EnterprisePlan | null;
  users?: UserAccount[];
  currentUser?: UserAccount;
}

export const KpiActionAssignModal: React.FC<KpiActionAssignModalProps> = ({
  isOpen,
  onClose,
  onSaveAction,
  selectedPlan,
  users = [],
  currentUser
}) => {
  const [title, setTitle] = useState(
    selectedPlan
      ? `Giao phương án bù: Đẩy mạnh xúc tiến bù đắp ${formatNumberWithDots(selectedPlan.gap)} ${selectedPlan.unit}`
      : ''
  );
  const [rootCauseCategory, setRootCauseCategory] = useState<RootCauseCategory>(
    selectedPlan?.rootCauseCategory || 'market'
  );
  const [rootCause, setRootCause] = useState(selectedPlan?.rootCause || '');
  const [evidence, setEvidence] = useState(selectedPlan?.evidence || '');
  const [expectedResult, setExpectedResult] = useState(
    selectedPlan
      ? `Bù đắp đủ ${formatNumberWithDots(selectedPlan.gap)} ${selectedPlan.unit} thiếu hụt trước hạn chót.`
      : ''
  );
  const [recoveryTargetAmount, setRecoveryTargetAmount] = useState<number>(selectedPlan?.gap || 0);
  const [picId, setPicId] = useState(users[0]?.id || 'user-nam');
  const [supportingPerson, setSupportingPerson] = useState('Nguyễn Văn An (Hỗ trợ đàm phán & duyệt chiết khấu)');
  const [deadline, setDeadline] = useState('2026-08-25');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'normal'>('urgent');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedUser = users.find((u) => u.id === picId) || users[0];

    const newAction: KpiActionPlan = {
      id: `act-${Date.now()}`,
      actionCode: `ACT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      planId: selectedPlan?.id,
      kpiCode: selectedPlan?.kpiCode || 'KPI_REVENUE',
      kpiName: selectedPlan?.kpiName || 'Chỉ tiêu Doanh Thu',
      title,
      rootCauseCategory,
      rootCause: rootCause || 'Phân tích nguyên nhân theo số liệu thực tế',
      evidence: evidence || 'Ghi nhận đối chiếu hệ thống ERP',
      expectedResult,
      recoveryTargetAmount,
      picId: selectedUser?.id || 'pic-1',
      picName: selectedUser?.name || 'Lê Hoàng Nam',
      picRole: selectedUser?.position || selectedUser?.roleTitle || 'Chuyên viên phụ trách',
      supportingPerson,
      deadline,
      priority,
      progressPercent: 0,
      status: 'assigned',
      assignedBy: currentUser?.name || 'Ban Giám Đốc (CEO)',
      assignedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    onSaveAction(newAction);
    onClose();
  };

  return (
    <div
      id="kpi-action-assign-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        id="kpi-action-assign-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 font-bold border border-white/20">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">GIAO VIỆC & PHƯƠNG ÁN BÙ ĐẮP KPI (ACTION PLAN)</h2>
              <p className="text-xs text-blue-100">
                Lãnh đạo phân bổ nhiệm vụ xử lý khoảng thiếu hụt (GAP) & phân tích nguyên nhân gốc rễ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Plan Summary Banner */}
        {selectedPlan && (
          <div className="bg-amber-50 border-b border-amber-200/80 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-amber-900">{selectedPlan.planName}</span>
              <div className="text-amber-700 mt-0.5">
                Kỳ: <span className="font-bold">{selectedPlan.periodLabel}</span> | Phụ trách: {selectedPlan.picName}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white px-2.5 py-1.5 rounded-lg border border-amber-300 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Mục Tiêu</div>
                <div className="font-bold text-slate-800">
                  {formatNumberWithDots(selectedPlan.target)} {selectedPlan.unit}
                </div>
              </div>
              <div className="bg-white px-2.5 py-1.5 rounded-lg border border-amber-300 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Thực Hiện</div>
                <div className="font-bold text-blue-600">
                  {formatNumberWithDots(selectedPlan.actual)} {selectedPlan.unit}
                </div>
              </div>
              <div className="bg-rose-500 px-3 py-1.5 rounded-lg text-white text-center shadow-xs">
                <div className="text-[10px] uppercase font-bold text-rose-100">Khoảng Thiếu (GAP)</div>
                <div className="font-extrabold text-sm">
                  {formatNumberWithDots(selectedPlan.gap)} {selectedPlan.unit}
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Tên nhiệm vụ bù đắp */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nội dung nhiệm vụ / Phương án bù <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Gọi bổ sung 100 khách mới, chốt bù 25 triệu doanh thu trước ngày 25/08"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* 14 Phân loại Nguyên nhân gốc rễ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
              <span>Phân loại Nguyên nhân gốc rễ (Root Cause Category)</span>
              <span className="text-[11px] font-normal text-slate-500">14 Tiêu chuẩn điều hành</span>
            </label>
            <select
              value={rootCauseCategory}
              onChange={(e) => setRootCauseCategory(e.target.value as RootCauseCategory)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              {ROOT_CAUSE_DEFINITIONS.map((def) => (
                <option key={def.category} value={def.category}>
                  {def.label} - {def.description}
                </option>
              ))}
            </select>
          </div>

          {/* Diễn giải nguyên nhân cụ thể & Bằng chứng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Chi tiết nguyên nhân thực tế
              </label>
              <textarea
                rows={2}
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="VD: Thị trường đầu tháng giá thép biến động, 3 đại lý hoãn ký hợp đồng..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Dữ liệu chứng minh (Evidence / Số liệu)
              </label>
              <textarea
                rows={2}
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="VD: Nhật ký cuộc gọi CRM ghi nhận 120 cuộc, biên bản làm việc đại lý..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Phân công PIC, Người hỗ trợ & Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Người chịu trách nhiệm (PIC)</span>
              </label>
              <select
                value={picId}
                onChange={(e) => setPicId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.position || u.roleTitle || u.department || 'Nhân sự'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Hạn chót hoàn thành</span>
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Mức độ ưu tiên</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="urgent">Khẩn cấp (Ưu tiên số 1)</option>
                <option value="high">Cao</option>
                <option value="normal">Bình thường</option>
              </select>
            </div>
          </div>

          {/* Người phối hợp hỗ trợ & Kết quả kỳ vọng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nhân sự hỗ trợ / Cố vấn chuyên môn
              </label>
              <input
                type="text"
                value={supportingPerson}
                onChange={(e) => setSupportingPerson(e.target.value)}
                placeholder="VD: Trưởng nhóm KD hỗ trợ đàm phán hợp đồng lớn"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Kết quả đo lường cụ thể (Outcome)
              </label>
              <input
                type="text"
                value={expectedResult}
                onChange={(e) => setExpectedResult(e.target.value)}
                placeholder="VD: Chốt dứt điểm 3 đơn hàng bù đủ 25.5 triệu"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Giao Việc & Kích Hoạt Action Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
