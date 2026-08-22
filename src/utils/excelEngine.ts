import * as XLSX from 'xlsx';
import { Customer, CrmTask, Order, Product, LoyaltyTier } from '../types';

/**
 * Excel Processing Engine for BizOne ERP
 * Supports high-fidelity .xlsx import/export with UTF-8 Vietnamese encoding,
 * proper text formatting for phone numbers (preserves leading zeros),
 * precise currency and date handling, and round-trip support.
 */

// Format phone numbers safely to retain leading zero
export const sanitizePhoneNumber = (phone: any): string => {
  if (phone === null || phone === undefined) return '';
  let str = String(phone).trim();
  // Remove quotes or stray characters
  str = str.replace(/^["']|["']$/g, '');
  if (str && !str.startsWith('0') && !str.startsWith('+') && str.length >= 9 && str.length <= 11) {
    str = '0' + str;
  }
  return str;
};

/**
 * EXPORT: Export Customers to Excel (.xlsx)
 */
export const exportCustomersToExcel = (customers: Customer[], filename = 'Danh_Sach_Khach_Hang_BizOne.xlsx') => {
  const data = customers.map((c, idx) => ({
    'STT': idx + 1,
    'Mã Khách Hàng': c.code || '',
    'Tên Khách Hàng': c.name || '',
    'Số Điện Thoại': sanitizePhoneNumber(c.phone),
    'Mã Số Thuế': c.taxCode || '',
    'Email': c.email || '',
    'Địa Chỉ': c.address || '',
    'Nhóm Khách Hàng': c.group || 'Doanh nghiệp',
    'Hạng Thành Viên VIP': c.loyaltyTier || 'standard',
    'Điểm Tích Lũy': c.loyaltyPoints || 0,
    'Công Nợ Hiện Tại (VND)': c.debt || 0,
    'Hạn Mức Công Nợ (VND)': c.creditLimit || 0,
    'Tổng Chi Tiêu (VND)': c.totalSpent || 0,
    'Nhân Viên Phụ Trách': c.assignedStaff || '',
    'Trạng Thái': c.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng',
    'Ghi Chú CSKH': c.aiNotes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set explicit column widths
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 16 }, // Mã KH
    { wch: 32 }, // Tên KH
    { wch: 16 }, // SĐT
    { wch: 16 }, // MST
    { wch: 25 }, // Email
    { wch: 35 }, // Địa chỉ
    { wch: 18 }, // Nhóm
    { wch: 18 }, // Hạng VIP
    { wch: 14 }, // Điểm
    { wch: 22 }, // Công nợ
    { wch: 22 }, // Hạn mức
    { wch: 22 }, // Tổng chi tiêu
    { wch: 25 }, // NV Phụ trách
    { wch: 16 }, // Trạng thái
    { wch: 35 }  // Ghi chú
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Khách Hàng');
  XLSX.writeFile(workbook, filename);
};

/**
 * EXPORT: Export CRM Tasks to Excel (.xlsx)
 */
export const exportTasksToExcel = (tasks: CrmTask[], filename = 'Danh_Sach_Cong_Viec_CRM_BizOne.xlsx') => {
  const data = tasks.map((t, idx) => ({
    'STT': idx + 1,
    'Mã Task': t.id,
    'Tiêu Đề Công Việc': t.title,
    'Khách Hàng': t.customerName || '',
    'Người Phụ Trách': t.assignedTo || '',
    'Phòng Ban': t.department || 'Kinh Doanh',
    'Ngày Bắt Đầu': t.startDate || '',
    'Hạn Chót (Deadline)': t.dueDate || '',
    'Trạng Thái': t.status,
    'Mức Độ Ưu Tiên': t.priority,
    'Tiến Độ (%)': t.progress ?? (t.status === 'completed' ? 100 : 0),
    'Giai Đoạn Chu Trình': t.pipelineStage || 'lead_approach',
    'Ghi Chú / Kết Quả': t.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 35 },
    { wch: 28 },
    { wch: 22 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 14 },
    { wch: 22 },
    { wch: 40 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Nhiệm Vụ CRM');
  XLSX.writeFile(workbook, filename);
};

/**
 * TEMPLATES: Generate official blank .xlsx Templates
 */
export const downloadExcelTemplate = (type: 'customers' | 'tasks' | 'products') => {
  const workbook = XLSX.utils.book_new();

  if (type === 'customers') {
    const sampleData = [
      {
        'Mã Khách Hàng': 'KH-1001',
        'Tên Khách Hàng': 'Công ty TNHH Kỹ Thuật Hoàng Long',
        'Số Điện Thoại': '0912345678',
        'Mã Số Thuế': '0102345678',
        'Email': 'hoanglong@tech.vn',
        'Địa Chỉ': 'Số 18 Phạm Hùng, Q. Nam Từ Liêm, Hà Nội',
        'Nhóm Khách Hàng': 'Doanh nghiệp',
        'Hạng Thành Viên VIP': 'gold',
        'Công Nợ Ban Đầu (VND)': 0,
        'Hạn Mức Công Nợ (VND)': 100000000,
        'Nhân Viên Phụ Trách': 'Lê Hoàng Nam (Sales KV1)',
        'Ghi Chú': 'Đối tác dự án lắp đặt cơ điện'
      },
      {
        'Mã Khách Hàng': 'KH-1002',
        'Tên Khách Hàng': 'Cửa Hàng Điện Máy An Phát',
        'Số Điện Thoại': '0987654321',
        'Mã Số Thuế': '0312987654',
        'Email': 'anphat.electric@gmail.com',
        'Địa Chỉ': '45 Nguyễn Trãi, Q.5, TP.HCM',
        'Nhóm Khách Hàng': 'Đại lý',
        'Hạng Thành Viên VIP': 'silver',
        'Công Nợ Ban Đầu (VND)': 15000000,
        'Hạn Mức Công Nợ (VND)': 50000000,
        'Nhân Viên Phụ Trách': 'Lê Hoàng Nam (Sales KV1)',
        'Ghi Chú': 'Đại lý cấp 2 phân phối độc quyền'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 16 }, { wch: 35 }, { wch: 16 }, { wch: 16 }, { wch: 25 },
      { wch: 40 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 22 },
      { wch: 25 }, { wch: 35 }
    ];
    XLSX.utils.book_append_sheet(workbook, ws, 'KhachHang_Template');
    XLSX.writeFile(workbook, 'Mau_Nhap_Khach_Hang_BizOne.xlsx');
  } else if (type === 'tasks') {
    const sampleData = [
      {
        'Mã Task': 'TASK-001',
        'Tiêu Đề Công Việc': 'Gặp gỡ chốt hợp đồng dự án Q3',
        'Tên Khách Hàng': 'Công ty TNHH Kỹ Thuật Hoàng Long',
        'Người Phụ Trách': 'Lê Hoàng Nam (Sales KV1)',
        'Phòng Ban': 'Kinh Doanh Miền Nam',
        'Ngày Bắt Đầu': '2026-08-20',
        'Hạn Chót (Deadline)': '2026-08-28',
        'Trạng Thái': 'in_progress',
        'Mức Độ Ưu Tiên': 'high',
        'Tiến Độ (%)': 60,
        'Giai Đoạn Chu Trình': 'negotiation',
        'Ghi Chú': 'Đã gửi báo giá lần 2, chờ duyệt điều khoản bảo hành'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 14 }, { wch: 35 }, { wch: 30 }, { wch: 25 }, { wch: 20 },
      { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 14 },
      { wch: 20 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(workbook, ws, 'Task_Template');
    XLSX.writeFile(workbook, 'Mau_Nhap_Cong_Viec_CRM_BizOne.xlsx');
  }
};

/**
 * PARSER: Generic Excel / CSV file parser to JSON rows
 */
export const parseExcelFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('File Excel không có sheet dữ liệu nào.');
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(rawJson);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * VALIDATOR: Validate Customer Rows for Import
 */
export interface ValidationError {
  row: number;
  column: string;
  value: any;
  reason: string;
}

export interface CustomerImportValidationResult {
  totalRows: number;
  validCustomers: Customer[];
  duplicateCount: number;
  updatedCount: number;
  errors: ValidationError[];
}

export const validateCustomerImportData = (
  rawRows: any[],
  existingCustomers: Customer[] = [],
  duplicateMode: 'create_new' | 'update_existing' | 'skip_existing' = 'update_existing'
): CustomerImportValidationResult => {
  const validCustomers: Customer[] = [];
  const errors: ValidationError[] = [];
  let duplicateCount = 0;
  let updatedCount = 0;

  const existingCodeMap = new Map<string, Customer>();
  const existingPhoneMap = new Map<string, Customer>();

  existingCustomers.forEach((c) => {
    if (c.code) existingCodeMap.set(c.code.trim().toUpperCase(), c);
    if (c.phone) existingPhoneMap.set(sanitizePhoneNumber(c.phone), c);
  });

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1
    
    // Find fields regardless of slight header naming variations
    const rawCode = String(row['Mã Khách Hàng'] || row['Mã KH'] || row['Customer Code'] || row['code'] || '').trim();
    const rawName = String(row['Tên Khách Hàng'] || row['Tên KH'] || row['Customer Name'] || row['name'] || '').trim();
    const rawPhone = sanitizePhoneNumber(row['Số Điện Thoại'] || row['SĐT'] || row['Phone'] || row['phone'] || '');
    const rawTaxCode = String(row['Mã Số Thuế'] || row['MST'] || row['Tax Code'] || row['taxCode'] || '').trim();
    const rawEmail = String(row['Email'] || row['email'] || '').trim();
    const rawAddress = String(row['Địa Chỉ'] || row['Address'] || row['address'] || '').trim() || 'Chưa cập nhật';
    const rawGroup = String(row['Nhóm Khách Hàng'] || row['Nhóm'] || row['Group'] || row['group'] || 'Doanh nghiệp').trim();
    const rawTier = String(row['Hạng Thành Viên VIP'] || row['Hạng VIP'] || row['loyaltyTier'] || 'standard').trim().toLowerCase();
    const rawDebt = parseFloat(row['Công Nợ Hiện Tại (VND)'] || row['Công Nợ Ban Đầu (VND)'] || row['Công nợ ban đầu'] || row['debt'] || '0') || 0;
    const rawCreditLimit = parseFloat(row['Hạn Mức Công Nợ (VND)'] || row['Hạn mức nợ'] || row['creditLimit'] || '50000000') || 50000000;
    const rawStaff = String(row['Nhân Viên Phụ Trách'] || row['assignedStaff'] || 'Lê Hoàng Nam (Sales KV1)').trim();
    const rawNotes = String(row['Ghi Chú CSKH'] || row['Ghi Chú'] || row['aiNotes'] || 'Nhập từ file Excel').trim();

    // 1. Mandatory validations
    if (!rawName) {
      errors.push({
        row: rowNum,
        column: 'Tên Khách Hàng',
        value: '',
        reason: 'Tên khách hàng là trường bắt buộc không được để trống.'
      });
      return;
    }

    if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      errors.push({
        row: rowNum,
        column: 'Email',
        value: rawEmail,
        reason: 'Định dạng email không hợp lệ.'
      });
      return;
    }

    // 2. Determine Code
    const code = rawCode || `KH-${Date.now().toString().slice(-4)}${index}`;

    // 3. Match Group
    let group: 'VIP' | 'Doanh nghiệp' | 'Đại lý' | 'Cá nhân' = 'Doanh nghiệp';
    if (rawGroup.toUpperCase().includes('VIP')) group = 'VIP';
    else if (rawGroup.toUpperCase().includes('ĐẠI LÝ') || rawGroup.toUpperCase().includes('DAI LY')) group = 'Đại lý';
    else if (rawGroup.toUpperCase().includes('CÁ NHÂN') || rawGroup.toUpperCase().includes('CA NHAN')) group = 'Cá nhân';

    // 4. Match Tier
    let loyaltyTier: LoyaltyTier = 'standard';
    if (rawTier === 'diamond' || rawTier === 'platinum') loyaltyTier = 'diamond';
    else if (rawTier === 'gold') loyaltyTier = 'gold';
    else if (rawTier === 'silver') loyaltyTier = 'silver';
    else loyaltyTier = 'standard';

    // 5. Duplicate Check
    const matchedByCode = existingCodeMap.get(code.toUpperCase());
    const matchedByPhone = rawPhone ? existingPhoneMap.get(rawPhone) : undefined;
    const existing = matchedByCode || matchedByPhone;

    if (existing) {
      duplicateCount++;
      if (duplicateMode === 'skip_existing') {
        return; // skip this row
      }
      if (duplicateMode === 'update_existing') {
        updatedCount++;
        validCustomers.push({
          ...existing,
          code,
          name: rawName,
          phone: rawPhone || existing.phone,
          taxCode: rawTaxCode || existing.taxCode,
          email: rawEmail || existing.email,
          address: rawAddress || existing.address,
          group,
          loyaltyTier: loyaltyTier !== 'standard' ? loyaltyTier : existing.loyaltyTier || 'standard',
          debt: rawDebt !== 0 ? rawDebt : existing.debt,
          creditLimit: rawCreditLimit,
          assignedStaff: rawStaff || existing.assignedStaff,
          aiNotes: `${existing.aiNotes || ''} | Đã cập nhật từ Excel ${new Date().toLocaleDateString('vi-VN')}`
        });
        return;
      }
    }

    // Create New Record
    validCustomers.push({
      id: `cust-imp-${Date.now()}-${index}`,
      code,
      name: rawName,
      phone: rawPhone,
      taxCode: rawTaxCode,
      email: rawEmail,
      address: rawAddress,
      group,
      loyaltyTier,
      loyaltyPoints: 0,
      debt: rawDebt,
      creditLimit: rawCreditLimit,
      totalSpent: 0,
      lastPurchaseDate: 'Chưa có',
      assignedStaff: rawStaff,
      status: 'active',
      aiNotes: rawNotes,
      createdAt: new Date().toISOString().slice(0, 10)
    });
  });

  return {
    totalRows: rawRows.length,
    validCustomers,
    duplicateCount,
    updatedCount,
    errors
  };
};
