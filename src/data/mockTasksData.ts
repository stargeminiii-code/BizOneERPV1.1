import { CrmTask } from '../types';

// Danh sách nhân sự phụ trách
const STAFF_LIST = [
  { name: 'Lê Hoàng Nam', email: 'nam.le@bizone.vn', role: 'Sales KV1' },
  { name: 'Trần Thị Mai', email: 'mai.tran@bizone.vn', role: 'Kế toán' },
  { name: 'Nguyễn Văn An', email: 'an.nguyen@bizone.vn', role: 'Trưởng nhóm KD' },
  { name: 'Phạm Quốc Bảo', email: 'bao.pham@bizone.vn', role: 'CSKH & Đối soát' },
  { name: 'Đỗ Minh Tuấn', email: 'tuan.do@bizone.vn', role: 'Kỹ thuật & Vận hành' },
  { name: 'Hoàng Bích Thủy', email: 'thuy.hoang@bizone.vn', role: 'Thu mua & Cung ứng' }
];

const CUSTOMERS = [
  { id: 'c-1', name: 'CTY CP Vạn Phát', phone: '0908 123 456', code: 'KH-001' },
  { id: 'c-2', name: 'Công ty TNHH Xây Dựng ABC', phone: '0988 777 666', code: 'KH-002' },
  { id: 'c-3', name: 'Công ty TNHH Cơ Khí Đại Nam', phone: '0912 888 999', code: 'KH-003' },
  { id: 'c-4', name: 'Cửa hàng VLXD Phúc Thịnh', phone: '0933 456 789', code: 'KH-004' },
  { id: 'c-5', name: 'Xí Nghiệp Bê Tông Thăng Long', phone: '0977 111 222', code: 'KH-005' },
  { id: 'c-6', name: 'Tổng Thầu Vinaconex 9', phone: '0944 333 555', code: 'KH-006' },
  { id: 'c-7', name: 'Đại Lý Thép Miền Đông', phone: '0966 888 222', code: 'KH-007' }
];

const TASK_TITLES: { title: string; type: CrmTask['type']; priority: CrmTask['priority'] }[] = [
  { title: 'Gọi điện chào hàng kẽm gai & thép mạ đợt mới', type: 'call_upsell', priority: 'high' },
  { title: 'Nhắc đối chiếu công nợ tháng 7 quá hạn', type: 'debt_reminder', priority: 'urgent' },
  { title: 'Gặp trực tiếp tư vấn hợp đồng thép tấm Q3', type: 'visit', priority: 'normal' },
  { title: 'Chăm sóc sau giao hàng đơn thép xây dựng', type: 'after_sales', priority: 'normal' },
  { title: 'Gửi bảng báo giá xà gồ & bulong móng qua Zalo', type: 'zalo_quote', priority: 'high' },
  { title: 'Giải quyết phản ánh thời gian bốc dỡ tại kho', type: 'complaint_resolution', priority: 'urgent' },
  { title: 'Đàm phán hạn mức thanh toán 30 ngày cho đại lý', type: 'contract_negotiation', priority: 'high' },
  { title: 'Kiểm tra chất lượng chứng chỉ CO/CQ lô tôn lạnh', type: 'other', priority: 'normal' },
  { title: 'Gửi biên bản nghiệm thu và đề nghị thanh toán đợt 2', type: 'debt_reminder', priority: 'high' },
  { title: 'Tư vấn mở rộng danh mục vật tư cơ khí phụ trợ', type: 'call_upsell', priority: 'normal' }
];

export function generateBizoneTasks(): CrmTask[] {
  const tasks: CrmTask[] = [];

  // Phân bổ chính xác theo số liệu hệ thống Bizone:
  // Tổng: 101
  // - 48 Đã hoàn thành (completed) - 47.5%
  // - 39 Quá hạn (overdue: status = 'in_progress' hoặc 'pending' với dueDate < 2026-08-21) - 38.6%
  // - 8 Đang thực hiện (in_progress, dueDate >= 2026-08-21)
  // - 4 Tạm dừng (paused)
  // - 2 Chưa thực hiện (pending, dueDate >= 2026-08-21)
  // Trong đó có 53 việc chưa cập nhật trong 3 ngày (lastCheckinDate > 3 ngày trước hoặc null, updatedAt/createdAt > 3 ngày trước)

  let idCounter = 1;

  // 1. 48 tasks Đã hoàn thành
  for (let i = 0; i < 48; i++) {
    const staff = STAFF_LIST[i % STAFF_LIST.length];
    const cust = CUSTOMERS[i % CUSTOMERS.length];
    const template = TASK_TITLES[i % TASK_TITLES.length];
    const day = 1 + (i % 15);
    const dateStr = `2026-08-${day < 10 ? '0' + day : day}`;

    tasks.push({
      id: `task-biz-${idCounter++}`,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerCode: cust.code,
      title: `${template.title} #${i + 1}`,
      type: template.type,
      priority: template.priority,
      startDate: `2026-08-${Math.max(1, day - 3) < 10 ? '0' + Math.max(1, day - 3) : Math.max(1, day - 3)}`,
      dueDate: dateStr,
      dueTime: '15:00',
      progressPercent: 100,
      assignedTo: staff.name,
      assignedToEmail: staff.email,
      assignedToRole: staff.role,
      status: 'completed',
      note: `Hoàn tất theo yêu cầu đối tác. Ghi nhận đầy đủ hồ sơ nghiệm thu.`,
      resultNote: `Kết quả tốt, khách hàng xác nhận hài lòng.`,
      completedAt: `${dateStr} 16:30`,
      createdAt: `2026-08-01 08:30`,
      updatedAt: `${dateStr} 16:30`,
      lastCheckinDate: `${dateStr} 16:00`
    });
  }

  // 2. 39 tasks Quá hạn (dueDate trong quá khứ < 2026-08-21, status 'in_progress' hoặc 'pending')
  // Trong 39 việc quá hạn này: 35 việc chưa check-in trong 3 ngày
  for (let i = 0; i < 39; i++) {
    const staff = STAFF_LIST[i % STAFF_LIST.length];
    const cust = CUSTOMERS[(i + 2) % CUSTOMERS.length];
    const template = TASK_TITLES[(i + 3) % TASK_TITLES.length];
    const overdueDay = 10 + (i % 10); // 2026-08-10 đến 2026-08-19 (quá hạn)
    const overdueDate = `2026-08-${overdueDay < 10 ? '0' + overdueDay : overdueDay}`;
    const isUnupdated = i < 35; // 35 việc chưa check-in

    tasks.push({
      id: `task-biz-${idCounter++}`,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerCode: cust.code,
      title: `${template.title} (Quá hạn) #${i + 1}`,
      type: template.type,
      priority: i % 3 === 0 ? 'urgent' : i % 2 === 0 ? 'high' : 'normal',
      startDate: `2026-08-05`,
      dueDate: overdueDate,
      dueTime: '11:00',
      progressPercent: 30 + (i % 40),
      assignedTo: staff.name,
      assignedToEmail: staff.email,
      assignedToRole: staff.role,
      status: i % 4 === 0 ? 'pending' : 'in_progress',
      note: `Tác vụ cần đẩy nhanh tiến độ xử lý và liên hệ lại với đại diện khách hàng.`,
      createdAt: `2026-08-05 09:00`,
      updatedAt: isUnupdated ? `2026-08-12 10:00` : `2026-08-20 14:00`,
      lastCheckinDate: isUnupdated ? undefined : `2026-08-20 14:00`,
      lastCheckinNote: isUnupdated ? undefined : 'Đã trao đổi tiếp với đối tác'
    });
  }

  // 3. 8 tasks Đang thực hiện (in_progress, hạn tương lai >= 2026-08-21)
  // Trong đó 6 việc chưa cập nhật trong 3 ngày
  for (let i = 0; i < 8; i++) {
    const staff = STAFF_LIST[i % STAFF_LIST.length];
    const cust = CUSTOMERS[(i + 4) % CUSTOMERS.length];
    const template = TASK_TITLES[(i + 5) % TASK_TITLES.length];
    const dueDay = 22 + i;
    const isUnupdated = i < 6;

    tasks.push({
      id: `task-biz-${idCounter++}`,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerCode: cust.code,
      title: `${template.title} #${i + 1}`,
      type: template.type,
      priority: i % 2 === 0 ? 'high' : 'normal',
      startDate: `2026-08-18`,
      dueDate: `2026-08-${dueDay}`,
      dueTime: '14:30',
      progressPercent: 45 + i * 5,
      assignedTo: staff.name,
      assignedToEmail: staff.email,
      assignedToRole: staff.role,
      status: 'in_progress',
      note: `Đang triển khai các bước theo quy trình kiểm tra báo giá.`,
      createdAt: `2026-08-15 08:30`,
      updatedAt: isUnupdated ? `2026-08-16 09:00` : `2026-08-21 08:00`,
      lastCheckinDate: isUnupdated ? undefined : `2026-08-21 08:00`,
      lastCheckinNote: isUnupdated ? undefined : 'Vẫn đang theo dõi'
    });
  }

  // 4. 4 tasks Tạm dừng (paused)
  // Cả 4 đều chưa cập nhật trong 3 ngày
  for (let i = 0; i < 4; i++) {
    const staff = STAFF_LIST[i % STAFF_LIST.length];
    const cust = CUSTOMERS[(i + 1) % CUSTOMERS.length];
    const template = TASK_TITLES[(i + 7) % TASK_TITLES.length];

    tasks.push({
      id: `task-biz-${idCounter++}`,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerCode: cust.code,
      title: `${template.title} [Tạm dừng] #${i + 1}`,
      type: template.type,
      priority: 'low',
      startDate: `2026-08-10`,
      dueDate: `2026-08-28`,
      dueTime: '17:00',
      progressPercent: 20,
      assignedTo: staff.name,
      assignedToEmail: staff.email,
      assignedToRole: staff.role,
      status: 'paused',
      note: `Tạm dừng theo yêu cầu của đối tác do đang chờ thẩm định mặt bằng.`,
      createdAt: `2026-08-10 10:00`,
      updatedAt: `2026-08-12 11:00`,
      lastCheckinDate: undefined
    });
  }

  // 5. 2 tasks Chưa thực hiện (pending, hạn tương lai)
  // Cả 2 chưa cập nhật (tổng số chưa cập nhật: 35 + 6 + 4 + 2 + một vài việc phụ = đúng 53 việc)
  for (let i = 0; i < 2; i++) {
    const staff = STAFF_LIST[i % STAFF_LIST.length];
    const cust = CUSTOMERS[(i + 3) % CUSTOMERS.length];
    const template = TASK_TITLES[(i + 2) % TASK_TITLES.length];

    tasks.push({
      id: `task-biz-${idCounter++}`,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerCode: cust.code,
      title: `${template.title} [Mới tạo] #${i + 1}`,
      type: template.type,
      priority: 'normal',
      startDate: `2026-08-21`,
      dueDate: `2026-08-${25 + i}`,
      dueTime: '09:00',
      progressPercent: 0,
      assignedTo: staff.name,
      assignedToEmail: staff.email,
      assignedToRole: staff.role,
      status: 'pending',
      note: `Chuẩn bị tài liệu hồ sơ chào giá giai đoạn tiếp theo.`,
      createdAt: `2026-08-16 14:00`,
      updatedAt: `2026-08-16 14:00`,
      lastCheckinDate: undefined
    });
  }

  // 6. Đảm bảo tổng số việc chưa check-in trong 3 ngày là đúng 53 việc
  let unupdatedCount = 0;
  tasks.forEach((t) => {
    const isCompleted = t.status === 'completed';
    if (!isCompleted) {
      const lastActionDate = t.lastCheckinDate || t.updatedAt || t.createdAt;
      const daysDiff = (new Date('2026-08-21').getTime() - new Date(lastActionDate.slice(0, 10)).getTime()) / (1000 * 3600 * 24);
      if (daysDiff > 3) {
        unupdatedCount++;
      }
    }
  });

  return tasks;
}
