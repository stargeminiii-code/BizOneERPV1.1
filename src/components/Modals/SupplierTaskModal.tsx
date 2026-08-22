import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileText,
  DollarSign,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import { Supplier, SupplierTask, SupplierTaskType } from '../../types';

interface SupplierTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSupplierName?: string;
  suppliers: Supplier[];
  onSaveTask: (task: SupplierTask) => void;
  taskToEdit?: SupplierTask | null;
}

export const SupplierTaskModal: React.FC<SupplierTaskModalProps> = ({
  isOpen,
  onClose,
  defaultSupplierName,
  suppliers,
  onSaveTask,
  taskToEdit
}) => {
  const matchedSupplier = suppliers.find((s) =>
    defaultSupplierName
      ? s.name.toLowerCase().includes(defaultSupplierName.toLowerCase())
      : false
  ) || suppliers[0];

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    taskToEdit?.supplierId || matchedSupplier?.id || ''
  );
  const [title, setTitle] = useState(
    taskToEdit?.title || 'Đàm phán giá và lịch giao hàng vật tư'
  );
  const [taskType, setTaskType] = useState<SupplierTaskType>(
    taskToEdit?.type || 'price_negotiation'
  );
  const [priority, setPriority] = useState<'urgent' | 'high' | 'normal' | 'low'>(
    taskToEdit?.priority || 'high'
  );
  const [dueDate, setDueDate] = useState(
    taskToEdit?.dueDate || new Date().toISOString().slice(0, 10)
  );
  const [dueTime, setDueTime] = useState(taskToEdit?.dueTime || '10:00');
  const [assignedTo, setAssignedTo] = useState(
    taskToEdit?.assignedTo || 'Trần Văn Hùng (Phòng Thu Mua)'
  );
  const [note, setNote] = useState(
    taskToEdit?.note ||
      'Liên hệ phòng kinh doanh của nhà cung cấp để thống nhất mức chiết khấu cho lô hàng mới và xác nhận thời gian xe hàng có mặt tại kho.'
  );

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) || matchedSupplier;

  useEffect(() => {
    if (taskToEdit) {
      setSelectedSupplierId(taskToEdit.supplierId || '');
      setTitle(taskToEdit.title);
      setTaskType(taskToEdit.type);
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.dueDate);
      setDueTime(taskToEdit.dueTime || '10:00');
      setAssignedTo(taskToEdit.assignedTo);
      setNote(taskToEdit.note || '');
    } else if (defaultSupplierName) {
      const match = suppliers.find((s) =>
        s.name.toLowerCase().includes(defaultSupplierName.toLowerCase())
      );
      if (match) {
        setSelectedSupplierId(match.id);
        if (match.debt > 0) {
          setTitle(`Đối chiếu công nợ & kế hoạch thanh toán - ${match.name}`);
          setTaskType('debt_reconciliation');
          setPriority('urgent');
          setNote(`Kiểm tra hóa đơn VAT và đối chiếu số dư nợ ${match.debt.toLocaleString('vi-VN')} đ với kế toán nhà cung cấp ${match.name}.`);
        } else {
          setTitle(`Liên hệ đàm phán giá & nhập hàng - ${match.name}`);
          setTaskType('price_negotiation');
          setPriority('normal');
          setNote(`Yêu cầu gửi bảng chào giá các sản phẩm mới và kiểm tra tiến độ giao hàng.`);
        }
      }
    }
  }, [taskToEdit, defaultSupplierName, suppliers]);

  const handleSupplierChange = (sId: string) => {
    setSelectedSupplierId(sId);
    const sup = suppliers.find((s) => s.id === sId);
    if (sup) {
      if (sup.debt > 0) {
        setTitle(`Đối chiếu công nợ & thanh toán - ${sup.name}`);
        setTaskType('debt_reconciliation');
        setPriority('urgent');
        setNote(`Đối chiếu công nợ hiện tại: ${(sup.debt ?? 0).toLocaleString('vi-VN')} đ theo hợp đồng.`);
      } else {
        setTitle(`Yêu cầu báo giá vật tư & đàm phán - ${sup.name}`);
        setTaskType('price_negotiation');
        setPriority('normal');
        setNote(`Liên hệ phòng kinh doanh ${sup.name} để cập nhật chính sách giá và chiết khấu mới nhất.`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề nhiệm vụ!');
      return;
    }

    const newTask: SupplierTask = {
      id: taskToEdit ? taskToEdit.id : `sup-task-${Date.now()}`,
      supplierId: selectedSupplier?.id || '',
      supplierName: selectedSupplier?.name || 'Nhà cung cấp',
      supplierCode: selectedSupplier?.code,
      supplierPhone: selectedSupplier?.phone,
      title: title.trim(),
      type: taskType,
      priority,
      dueDate,
      dueTime,
      assignedTo,
      status: taskToEdit?.status || 'pending',
      note: note.trim(),
      createdAt: taskToEdit?.createdAt || new Date().toISOString().slice(0, 16).replace('T', ' '),
      createdBy: taskToEdit?.createdBy || 'Quản trị viên'
    };

    onSaveTask(newTask);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center font-bold shadow-md">
              <Truck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {taskToEdit ? 'Chỉnh Sửa Tác Vụ Nhà Cung Cấp' : 'Tạo Tác Vụ / Công Việc Với NCC'}
              </h2>
              <p className="text-xs text-slate-500">
                Theo dõi đàm phán giá, đối chiếu công nợ và tiến độ giao nhận vật tư
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
          {/* Supplier Select */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nhà cung cấp đối tác <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.code}] {s.name} - MST: {s.taxCode || '—'} {s.debt > 0 ? `(Nợ: ${(s.debt ?? 0).toLocaleString('vi-VN')} đ)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tiêu đề công việc <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đàm phán giá tôn cuộn tháng 8..."
              required
              className="w-full font-bold border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Task Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Loại công việc</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as SupplierTaskType)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-medium focus:outline-none"
              >
                <option value="price_negotiation">🤝 Đàm phán giá & Chiết khấu</option>
                <option value="rfq_quote">📋 Yêu cầu báo giá vật tư (RFQ)</option>
                <option value="debt_reconciliation">💰 Đối chiếu công nợ NCC</option>
                <option value="delivery_tracking">🚚 Theo dõi lịch giao / Nhập hàng</option>
                <option value="quality_inspection">🔍 Kiểm tra chất lượng & Đổi trả</option>
                <option value="contract_renewal">📝 Ký mới / Gia hạn hợp đồng</option>
                <option value="other">📌 Công việc khác</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mức độ ưu tiên</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
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

          {/* Assigned Staff */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Người phụ trách thực hiện</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-semibold focus:outline-none"
            >
              <option value="Trần Văn Hùng (Phòng Thu Mua)">Trần Văn Hùng (Phòng Thu Mua)</option>
              <option value="Nguyễn Văn An (Thủ kho)">Nguyễn Văn An (Thủ kho)</option>
              <option value="Trần Thị Mai (Kế toán)">Trần Thị Mai (Kế toán)</option>
              <option value="Lê Hoàng Nam (Trưởng nhóm)">Lê Hoàng Nam (Trưởng nhóm)</option>
            </select>
          </div>

          {/* Note / Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Ghi chú nội dung & Yêu cầu cụ thể
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú chi tiết điều khoản cần đàm phán, số lượng cần giao hoặc chứng từ cần đối chiếu..."
              className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Supplier Info Snippet */}
          {selectedSupplier && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 flex items-center justify-between text-[11px]">
              <div>
                <span>Liên hệ: <strong className="text-slate-800">{selectedSupplier.contactPerson || selectedSupplier.phone}</strong></span>
                {selectedSupplier.bankAccount && (
                  <span className="block text-slate-500 font-mono">TK: {selectedSupplier.bankAccount} ({selectedSupplier.bankName})</span>
                )}
              </div>
              <div className="text-right">
                <span>Nợ hiện tại:</span>
                <div className={`font-mono font-bold ${(selectedSupplier.debt ?? 0) > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {(selectedSupplier.debt ?? 0).toLocaleString('vi-VN')} đ
                </div>
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
              className="px-6 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{taskToEdit ? 'Lưu cập nhật' : 'Giao việc ngay'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
