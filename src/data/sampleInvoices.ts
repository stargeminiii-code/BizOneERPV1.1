import { ExtractedInvoiceSchema } from '../types';

export interface SampleInvoicePreset {
  id: string;
  name: string;
  provider: string;
  direction: 'inbound' | 'outbound';
  description: string;
  fileName: string;
  data: ExtractedInvoiceSchema;
}

export const SAMPLE_INVOICE_PRESETS: SampleInvoicePreset[] = [
  {
    id: 'sample-misa-inbound-1',
    name: 'HĐ Mua Thép & Tôn Nhập Kho (MISA meInvoice - Đầu vào)',
    provider: 'MISA meInvoice',
    direction: 'inbound',
    description: 'Hóa đơn GTGT đầu vào nhập mua Thép hộp, Thép tấm và Kẽm gai từ Công ty Cổ phần Thép Miền Bắc (Thuế suất 8% và 10%)',
    fileName: 'HDGTGT_ThepMienBac_0012398.pdf',
    data: {
      invoice_meta: {
        series: '1C26TMB',
        invoice_no: '0012398',
        issue_date: '2026-08-20',
        tax_auth_code: 'T26-0012398-MB',
        lookup_code: 'MISA882398',
        lookup_url: 'https://meinvoice.vn/tra-cuu'
      },
      seller: {
        name: 'CÔNG TY CỔ PHẦN THÉP MIỀN BẮC',
        tax_code: '0102345678',
        address: 'Lô CN5, KCN Quang Minh, Huyện Mê Linh, TP. Hà Nội'
      },
      buyer: {
        company_name: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI & PHÂN PHỐI VIỆT PHÁT',
        tax_code: '0108998822',
        address: 'Số 188 Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội'
      },
      line_items: [
        {
          stt: 1,
          description: 'Thép tấm 5 ly cán nóng SS400',
          unit: 'kg',
          quantity: 500,
          unit_price: 18500,
          amount_before_tax: 9250000,
          vat_rate: 8,
          vat_amount: 740000,
          amount_after_tax: 9990000
        },
        {
          stt: 2,
          description: 'Thép hộp mạ kẽm Hòa Phát 40x80x1.8mm',
          unit: 'Cây',
          quantity: 60,
          unit_price: 245000,
          amount_before_tax: 14700000,
          vat_rate: 8,
          vat_amount: 1176000,
          amount_after_tax: 15876000
        },
        {
          stt: 3,
          description: 'Kẽm gai bọc nhựa bảo vệ Ø2.5mm',
          unit: 'Cuộn',
          quantity: 40,
          unit_price: 180000,
          amount_before_tax: 7200000,
          vat_rate: 10,
          vat_amount: 720000,
          amount_after_tax: 7920000
        }
      ],
      totals: {
        amount_before_tax: 31150000,
        vat_amount: 2636000,
        amount_after_tax: 33786000,
        breakdown_by_rate: {
          rate_0: { before_tax: 0, vat_amount: 0 },
          rate_5: { before_tax: 0, vat_amount: 0 },
          rate_8: { before_tax: 23950000, vat_amount: 1916000 },
          rate_10: { before_tax: 7200000, vat_amount: 720000 }
        }
      }
    }
  },
  {
    id: 'sample-viettel-outbound-2',
    name: 'HĐ Bán Hàng Xuất Kho cho Khách Xây Dựng (Viettel Sinvoice - Đầu ra)',
    provider: 'Viettel S-Invoice',
    direction: 'outbound',
    description: 'Hóa đơn GTGT đầu ra xuất kho bán Tôn lạnh và Que hàn cho Công ty TNHH Xây Dựng & Phát Triển Hạ Tầng Đô Thị',
    fileName: 'HDGTGT_BanHang_0004521.pdf',
    data: {
      invoice_meta: {
        series: '2C26TVP',
        invoice_no: '0004521',
        issue_date: '2026-08-21',
        tax_auth_code: 'VTL-2026-0004521',
        lookup_code: 'SINV-99381',
        lookup_url: 'https://sinvoice.viettel.vn/tracuu'
      },
      seller: {
        name: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI & PHÂN PHỐI VIỆT PHÁT',
        tax_code: '0108998822',
        address: 'Số 188 Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội'
      },
      buyer: {
        company_name: 'CÔNG TY TNHH XÂY DỰNG & PHÁT TRIỂN HẠ TẦNG ĐÔ THỊ',
        tax_code: '0109988776',
        address: 'Tầng 5, Tòa Nhà HUD Tower, Lê Văn Lương, Cầu Giấy, Hà Nội'
      },
      line_items: [
        {
          stt: 1,
          description: 'Tôn lạnh màu xanh ngọc Hoa Sen 0.45mm',
          unit: 'm2',
          quantity: 120,
          unit_price: 115000,
          amount_before_tax: 13800000,
          vat_rate: 8,
          vat_amount: 1104000,
          amount_after_tax: 14904000
        },
        {
          stt: 2,
          description: 'Que hàn điện Kim Tín KT-421 3.2mm',
          unit: 'Hộp',
          quantity: 50,
          unit_price: 145000,
          amount_before_tax: 7250000,
          vat_rate: 8,
          vat_amount: 580000,
          amount_after_tax: 7830000
        }
      ],
      totals: {
        amount_before_tax: 21050000,
        vat_amount: 1684000,
        amount_after_tax: 22734000,
        breakdown_by_rate: {
          rate_0: { before_tax: 0, vat_amount: 0 },
          rate_5: { before_tax: 0, vat_amount: 0 },
          rate_8: { before_tax: 21050000, vat_amount: 1684000 },
          rate_10: { before_tax: 0, vat_amount: 0 }
        }
      }
    }
  },
  {
    id: 'sample-discrepancy-warning-3',
    name: 'HĐ Cảnh báo Sai Lệch Số Liệu (Test Case Validation)',
    provider: 'VNPT-Invoice',
    direction: 'inbound',
    description: 'Hóa đơn mẫu cố tình có sai lệch số học (Đơn giá × Số lượng ≠ Thành tiền & Lệch Thuế) để kiểm thử bộ chặn rủi ro tự động',
    fileName: 'HDGTGT_LoiSaiSo_009912.pdf',
    data: {
      invoice_meta: {
        series: '1C26TTH',
        invoice_no: '009912',
        issue_date: '2026-08-19',
        tax_auth_code: 'VNPT-9912-ERR',
        lookup_code: 'VNPT9912',
        lookup_url: 'https://vnpt-invoice.com.vn'
      },
      seller: {
        name: 'CÔNG TY TNHH VẬT TƯ THIẾT BỊ HÀ NỘI',
        tax_code: '0105556667',
        address: 'Số 45 Giải Phóng, Hai Bà Trưng, Hà Nội'
      },
      buyer: {
        company_name: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI & PHÂN PHỐI VIỆT PHÁT',
        tax_code: '0108998822',
        address: 'Số 188 Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội'
      },
      line_items: [
        {
          stt: 1,
          description: 'Sơn chống rỉ Đại Bàng mạ kẽm (Thùng 20L)',
          unit: 'Thùng',
          quantity: 10,
          unit_price: 850000,
          amount_before_tax: 9500000, // Cố tình sai (10 * 850,000 = 8,500,000 nhưng ghi 9,500,000)
          vat_rate: 8,
          vat_amount: 760000,
          amount_after_tax: 10260000
        },
        {
          stt: 2,
          description: 'Sản phẩm vật tư phụ chưa có trong danh mục kho',
          unit: 'Bộ',
          quantity: 5,
          unit_price: 320000,
          amount_before_tax: 1600000,
          vat_rate: 10,
          vat_amount: 250000, // Cố tình sai (1,600,000 * 10% = 160,000 nhưng ghi 250,000)
          amount_after_tax: 1850000
        }
      ],
      totals: {
        amount_before_tax: 11100000,
        vat_amount: 1010000,
        amount_after_tax: 12110000,
        breakdown_by_rate: {
          rate_0: { before_tax: 0, vat_amount: 0 },
          rate_5: { before_tax: 0, vat_amount: 0 },
          rate_8: { before_tax: 9500000, vat_amount: 760000 },
          rate_10: { before_tax: 1600000, vat_amount: 250000 }
        }
      }
    }
  }
];
