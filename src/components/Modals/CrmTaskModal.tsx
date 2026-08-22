import React, { useState, useEffect } from 'react';
import {
  X,
  PhoneCall,
  Calendar,
  Send,
  CheckCircle2,
  UserCheck,
  Clock,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  Building2,
  Users
} from 'lucide-react';
import { Customer, CrmTask, CrmTaskType, CrmTaskPriority } from '../../types';

interface CrmTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomerName?: string;
  customers: Customer[];
  onSaveTask?: (task: CrmTask) => void;
  taskToEdit?: CrmTask | null;
}

export const CrmTaskModal: React.FC<CrmTaskModalProps> = ({
  isOpen,
  onClose,
  defaultCustomerName,
  customers,
  onSaveTask,
  taskToEdit
}) => {
  const matchedCustomer = customers.find((c) =>
    defaultCustomerName
      ? c.name.toLowerCase().includes(defaultCustomerName.toLowerCase())
      : false
  ) || customers[0];

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    taskToEdit?.customerId || matchedCustomer?.id || ''
  );
  const [title, setTitle] = useState(
    taskToEdit?.title || 'Gọi điện chào hàng & tư vấn vật tư mới'
  );
  const [taskType, setTaskType] = useState<CrmTaskType>(
    taskToEdit?.type || 'call_upsell'
  );
  const [priority, setPriority] = useState<CrmTaskPriority>(
    taskToEdit?.priority || 'high'
  );
  const [dueDate, setDueDate] = useState(
    taskToEdit?.dueDate || new Date().toISOString().slice(0, 10)
  );
  const [dueTime, setDueTime] = useState(taskToEdit?.dueTime || '09:30');
  const [assignedTo, setAssignedTo] = useState(
    taskToEdit?.assignedTo || 'Lê Hoàng Nam (Sales KV1)'
  );
  const [field, setField] = useState(
    taskToEdit?.field || 'CSKH & Bán hàng'
  );
  const [note, setNote] = useState(
    taskToEdit?.note ||
      'Liên hệ giới thiệu bảng báo giá các mặt hàng thép hộp mạ kẽm và tôn cuộn mới về kho. Tư vấn chính sách chiết khấu và ưu đãi vận chuyển.'
  );

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || matchedCustomer;

  useEffect(() => {
    if (taskToEdit) {
      setSelectedCustomerId(taskToEdit.customerId || '');
      setTitle(taskToEdit.title);
      setTaskType(taskToEdit.type);
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.dueDate);
      setDueTime(taskToEdit.dueTime || '09:30');
      setAssignedTo(taskToEdit.assignedTo);
      setField(taskToEdit.field || 'CSKH & Bán hàng');
      setNote(taskToEdit.note || '');
    } else if (defaultCustomerName) {
      const match = customers.find((c) =>
        c.name.toLowerCase().includes(defaultCustomerName.toLowerCase())
      );
      if (match) {
        setSelectedCustomerId(match.id);
        if (match.debt > 0) {
          setTitle(`Nhắc thanh toán công nợ (${match.debt.toLocaleString('vi-VN')} đ)`);
          setTaskType('debt_reminder');
          setPriority('urgent');
          setNote(`Khách hàng ${match.name} có dư nợ ${match.debt.toLocaleString('vi-VN')} đ. Đối chiếu biên bản giao hàng và gửi mã VietQR thanh toán.`);
        } else {
          setTitle(`Chăm sóc & chào hàng định kỳ - ${match.name}`);
          setTaskType('call_upsell');
          setPriority('normal');
          setNote(`Thăm hỏi tiến độ các công trình đang triển khai, giới thiệu danh mục sản phẩm chủ lực và nhận đơn đặt hàng mới.`);
        }
      }
    }
  }, [taskToEdit, defaultCustomerName, customers]);

  const handleCustomerChange = (cId: string) => {
    setSelectedCustomerId(cId);
    const cust = customers.find((c) => c.id === cId);
    if (cust) {
      if (cust.debt > 0) {
        setTitle(`Nhắc thanh toán công nợ (${cust.debt.toLocaleString('vi-VN')} đ)`);
        setTaskType('debt_reminder');
        setPriority('urgent');
        setNote(`Khách hàng ${cust.name} có dư nợ ${cust.debt.toLocaleString('vi-VN')} đ. Đối chiếu hóa đơn và gửi mã VietQR thanh toán.`);
      } else {
        setTitle(`Gọi điện chào hàng & kịch bản CSKH - ${cust.name}`);
        setTaskType('call_upsell');
        setPriority('normal');
        setNote(cust.aiNotes ? `Theo gợi ý AI: ${cust.aiNotes}` : 'Liên hệ chào báo giá vật tư và duy trì quan hệ đối tác.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề nhiệm vụ!');
      return;
    }

    const newTask: CrmTask = {
      id: taskToEdit ? taskToEdit.id : `crm-task-${Date.now()}`,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name || 'Khách hàng',
      customerCode: selectedCustomer?.code,
      customerPhone: selectedCustomer?.phone,
      title: title.trim(),
      type: taskType,
      priority,
      dueDate,
      dueTime,
      assignedTo,
      field,
      status: taskToEdit?.status || 'pending',
      note: note.trim(),
      createdAt: taskToEdit?.createdAt || new Date().toISOString().slice(0, 16).replace('T', ' '),
      createdBy: taskToEdit?.createdBy || 'Quản trị viên'
    };

    if (onSaveTask) {
      onSaveTask(newTask);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {taskToEdit ? 'Chỉnh Sửa Tác Vụ CSKH' : 'Tạo Nhiệm Vụ CSKH & Bán Hàng'}
              </h2>
              <p className="text-xs text-slate-500">
                Phân công công việc, đặt lịch hẹn và theo dõi tiến độ chăm sóc khách hàng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {/* Target Customer */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Khách hàng mục tiêu <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.name} - SĐT: {c.phone} {c.debt > 0 ? `(Nợ: ${(c.debt ?? 0).toLocaleString('vi-VN')} đ)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Task Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tiêu đề công việc / Nhiệm vụ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Gọi điện chào hàng lô tôn mới..."
              required
              className="w-full font-bold border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Task Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Loại tác vụ</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as CrmTaskType)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-medium focus:outline-none"
              >
                <option value="call_upsell">📞 Gọi điện Upsell / Chào hàng</option>
                <option value="visit">🤝 Gặp mặt trực tiếp tại công trình</option>
                <option value="debt_reminder">💰 Nhắc hạn thanh toán công nợ</option>
                <option value="zalo_quote">💬 Gửi báo giá qua Zalo OA</option>
                <option value="after_sales">⭐ Chăm sóc sau bán hàng</option>
                <option value="complaint_resolution">⚠️ Xử lý khiếu nại / Bảo hành</option>
                <option value="contract_negotiation">📝 Đàm phán hợp đồng cung cấp</option>
                <option value="other">📌 Tác vụ khác</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mức độ ưu tiên</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as CrmTaskPriority)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-medium focus:outline-none"
              >
                <option value="urgent">🔴 Khẩn cấp (Gấp)</option>
                <option value="high">🟠 Ưu tiên cao</option>
                <option value="normal">🔵 Bình thường</option>
                <option value="low">⚪ Thấp</option>
              </select>
            </div>
          </div>

          {/* Schedule Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hạn xử lý (Ngày)</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Khung giờ hẹn</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Assigned Staff & Field / Lĩnh vực */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nhân viên phụ trách</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-semibold focus:outline-none"
              >
                <option value="Lê Hoàng Nam (Sales KV1)">Lê Hoàng Nam (Sales KV1)</option>
                <option value="Nguyễn Văn An (Trưởng nhóm)">Nguyễn Văn An (Trưởng nhóm)</option>
                <option value="Trần Thị Mai (Kế toán)">Trần Thị Mai (Kế toán)</option>
                <option value="Phạm Quốc Huy (Sales KV2)">Phạm Quốc Huy (Sales KV2)</option>
                <option value="Vũ Thị Lan (CSKH)">Vũ Thị Lan (CSKH)</option>
                <option value="Hoàng Đức Thịnh (Kho vận)">Hoàng Đức Thịnh (Kho vận)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Lĩnh vực / Phòng ban</label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-semibold focus:outline-none"
              >
                <option value="CSKH & Bán hàng">CSKH & Bán hàng</option>
                <option value="Kế toán & Tài chính">Kế toán & Tài chính</option>
                <option value="Mua hàng & Kho vận">Mua hàng & Kho vận</option>
                <option value="Sản xuất & Kỹ thuật">Sản xuất & Kỹ thuật</option>
                <option value="Marketing & SEO">Marketing & SEO</option>
                <option value="Ban Giám Đốc">Ban Giám Đốc</option>
              </select>
            </div>
          </div>

          {/* Note / Script */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Kịch bản trao đổi / Ghi chú nội dung
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú chi tiết mục tiêu cuộc gọi, chính sách giá hoặc nội dung cần chốt..."
              className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* AI Helper Banner */}
          {selectedCustomer?.aiNotes && (
            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200 text-slate-700 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-blue-900">Gợi ý từ AI CRM:</span>{' '}
                <span className="text-slate-600">{selectedCustomer.aiNotes}</span>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-bold text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{taskToEdit ? 'Lưu cập nhật' : 'Giao việc ngay'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
