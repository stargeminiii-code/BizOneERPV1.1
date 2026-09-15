import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type FadMigrationRecord = {
  sourceSystem: 'FAD';
  sourceTable: string;
  sourceFile: string;
  sourceId?: string;
  fields: Record<string, unknown>;
  confidence: 'high' | 'medium' | 'low';
  fingerprint: string;
  targetDomain: string;
  status: 'ready' | 'review' | 'rejected';
  warnings: string[];
};

export type FadMigrationManifestInput = {
  version: '1.0';
  generatedAt: string;
  sourceSystem: 'FAD';
  mode: 'dry-run';
  files: unknown[];
  records: FadMigrationRecord[];
  summary?: Record<string, number>;
};

export type FadMigrationHistory = {
  migrationId: string;
  tenantId: string;
  userId: string;
  createdAt: string;
  completedAt?: string;
  status: 'validated' | 'imported' | 'failed';
  sourceSystem: 'FAD';
  fileCount: number;
  recordCount: number;
  importedCount: number;
  skippedCount: number;
  rejectedCount: number;
  reviewCount: number;
  manifestFingerprint: string;
  domainCounts?: Record<string, number>;
  error?: string;
};

type StoredMigration = FadMigrationRecord & {
  tenantId: string;
  migrationId: string;
  importedAt: string;
};

type DomainRecord = {
  id: string;
  tenantId: string;
  sourceSystem: 'FAD';
  sourceTable: string;
  sourceId: string;
  fingerprint: string;
  migratedAt: string;
  data: Record<string, unknown>;
};

const DATA_DIR = path.join(process.cwd(), '.data_store');
const HISTORY_FILE = path.join(DATA_DIR, 'fad_migration_history.json');
const RECORDS_FILE = path.join(DATA_DIR, 'fad_migration_records.json');

const DOMAIN_FILES: Record<string, string> = {
  products: 'fad_products.json',
  inventory: 'fad_inventory.json',
  crm: 'fad_crm.json',
  pricing: 'fad_pricing.json',
  marketing: 'fad_marketing.json',
  purchasing: 'fad_purchasing.json',
  iam: 'fad_iam.json',
  configuration: 'fad_configuration.json',
  sales: 'fad_sales.json',
  finance: 'fad_finance.json',
  omnichannel: 'fad_omnichannel.json'
};

function ensureStore(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  ensureStore();
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(file: string, value: T): void {
  ensureStore();
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf-8');
  fs.renameSync(tmp, file);
}

function fingerprintManifest(manifest: FadMigrationManifestInput): string {
  const canonical = JSON.stringify(manifest.records.map((r) => ({ fingerprint: r.fingerprint, targetDomain: r.targetDomain, status: r.status })));
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

function validateRecord(record: FadMigrationRecord): string[] {
  const errors: string[] = [];
  if (record.sourceSystem !== 'FAD') errors.push('sourceSystem phải là FAD');
  if (!record.sourceTable?.trim()) errors.push('Thiếu sourceTable');
  if (!record.sourceFile?.trim()) errors.push('Thiếu sourceFile');
  if (!record.sourceId?.trim()) errors.push('Thiếu sourceId');
  if (!record.fingerprint || !/^[a-f0-9]{64}$/i.test(record.fingerprint)) errors.push('Fingerprint không hợp lệ');
  if (!record.fields || typeof record.fields !== 'object' || Array.isArray(record.fields)) errors.push('fields không hợp lệ');
  if (!['ready', 'review', 'rejected'].includes(record.status)) errors.push('status không hợp lệ');
  if (!record.targetDomain || record.targetDomain === 'unknown') errors.push('Chưa xác định domain BizOne');
  return errors;
}

function normalizeKey(value: string): string {
  return value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizedFields(fields: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    result[normalizeKey(key)] = value;
  }
  return result;
}

function firstValue(fields: Record<string, unknown>, aliases: string[]): unknown {
  const normalized = normalizedFields(fields);
  for (const alias of aliases) {
    const value = normalized[normalizeKey(alias)];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return undefined;
}

function textValue(fields: Record<string, unknown>, aliases: string[]): string | undefined {
  const value = firstValue(fields, aliases);
  return value === undefined ? undefined : String(value).trim();
}

function numberValue(fields: Record<string, unknown>, aliases: string[]): number | undefined {
  const value = firstValue(fields, aliases);
  if (value === undefined) return undefined;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function adaptRecord(record: FadMigrationRecord, tenantId: string, migrationId: string, now: string): DomainRecord | null {
  const domain = record.targetDomain;
  if (!DOMAIN_FILES[domain] || record.status !== 'ready') return null;
  const f = record.fields;
  const sourceId = String(record.sourceId);
  const common = {
    tenantId,
    sourceSystem: 'FAD' as const,
    sourceTable: record.sourceTable,
    sourceId,
    fingerprint: record.fingerprint,
    migratedAt: now
  };

  let data: Record<string, unknown> = { ...f };

  switch (domain) {
    case 'products':
      data = {
        productCode: textValue(f, ['productCode', 'product_code', 'maSanPham', 'maHang', 'code']) || sourceId,
        productName: textValue(f, ['productName', 'product_name', 'tenSanPham', 'tenHang', 'name']) || `FAD ${sourceId}`,
        sku: textValue(f, ['sku', 'maSku', 'variantSku']) || sourceId,
        unit: textValue(f, ['unit', 'donViTinh', 'dvt']) || 'Cái',
        barcode: textValue(f, ['barcode', 'barCode', 'maVach']),
        costPrice: numberValue(f, ['costPrice', 'purchasePrice', 'giaNhap', 'donGiaNhap']),
        sellingPrice: numberValue(f, ['sellingPrice', 'salePrice', 'giaBan', 'donGiaBan']),
        ...f
      };
      break;
    case 'inventory':
      data = {
        sku: textValue(f, ['sku', 'maSku', 'productCode', 'maHang']) || sourceId,
        productId: textValue(f, ['productId', 'maSanPham']) || sourceId,
        warehouseId: textValue(f, ['warehouseId', 'maKho']) || 'FAD-DEFAULT',
        warehouseName: textValue(f, ['warehouseName', 'tenKho']),
        quantity: numberValue(f, ['quantity', 'soLuong', 'tonKho', 'soLuongTon']) ?? 0,
        unitCost: numberValue(f, ['unitCost', 'costPrice', 'giaVon', 'giaNhap']),
        lotNumber: textValue(f, ['lotNumber', 'soLo', 'loHang']),
        expiryDate: textValue(f, ['expiryDate', 'hanSuDung']),
        ...f
      };
      break;
    case 'crm':
      data = {
        customerCode: textValue(f, ['customerCode', 'maKhachHang', 'maKH', 'code']) || sourceId,
        customerName: textValue(f, ['customerName', 'tenKhachHang', 'tenKH', 'name']) || `FAD ${sourceId}`,
        phone: textValue(f, ['phone', 'dienThoai', 'soDienThoai']),
        email: textValue(f, ['email']),
        address: textValue(f, ['address', 'diaChi']),
        category: textValue(f, ['category', 'customerCategory', 'nhomKhachHang']),
        ...f
      };
      break;
    case 'pricing':
      data = {
        policyCode: textValue(f, ['policyCode', 'maChinhSach', 'code']) || sourceId,
        policyName: textValue(f, ['policyName', 'tenChinhSach', 'name']) || `FAD ${sourceId}`,
        productCode: textValue(f, ['productCode', 'maSanPham', 'maHang']),
        price: numberValue(f, ['price', 'sellingPrice', 'giaBan', 'donGia']),
        fromDate: textValue(f, ['fromDate', 'startDate', 'tuNgay']),
        toDate: textValue(f, ['toDate', 'endDate', 'denNgay']),
        ...f
      };
      break;
    case 'marketing':
      data = {
        promotionCode: textValue(f, ['promotionCode', 'maKhuyenMai', 'code']) || sourceId,
        promotionName: textValue(f, ['promotionName', 'tenKhuyenMai', 'name']) || `FAD ${sourceId}`,
        discount: numberValue(f, ['discount', 'discountPercent', 'giamGia', 'phanTramGiam']),
        startDate: textValue(f, ['startDate', 'fromDate', 'tuNgay']),
        endDate: textValue(f, ['endDate', 'toDate', 'denNgay']),
        ...f
      };
      break;
    default:
      data = { ...f };
  }

  return { id: `FAD-${domain}-${sourceId}`, ...common, data: { migrationId, ...data } };
}

export class FadMigrationService {
  static validateManifest(manifest: FadMigrationManifestInput): {
    valid: boolean; manifestFingerprint: string; errors: Array<{ index: number; errors: string[] }>; ready: number; review: number; rejected: number;
  } {
    const errors: Array<{ index: number; errors: string[] }> = [];
    const records = Array.isArray(manifest?.records) ? manifest.records : [];
    if (manifest?.version !== '1.0') errors.push({ index: -1, errors: ['Manifest version không được hỗ trợ'] });
    if (manifest?.sourceSystem !== 'FAD') errors.push({ index: -1, errors: ['sourceSystem phải là FAD'] });
    if (manifest?.mode !== 'dry-run') errors.push({ index: -1, errors: ['Manifest phải được tạo từ chế độ dry-run'] });
    if (records.length > 50000) errors.push({ index: -1, errors: ['Vượt giới hạn 50.000 records cho một migration'] });
    const seen = new Set<string>();
    records.forEach((record, index) => {
      const recordErrors = validateRecord(record);
      if (seen.has(record.fingerprint)) recordErrors.push('Fingerprint trùng trong manifest');
      seen.add(record.fingerprint);
      if (recordErrors.length) errors.push({ index, errors: recordErrors });
    });
    return { valid: errors.length === 0, manifestFingerprint: fingerprintManifest(manifest), errors, ready: records.filter((r) => r.status === 'ready').length, review: records.filter((r) => r.status === 'review').length, rejected: records.filter((r) => r.status === 'rejected').length };
  }

  static importManifest(tenantId: string, userId: string, manifest: FadMigrationManifestInput): { success: boolean; migration: FadMigrationHistory } {
    const validation = this.validateManifest(manifest);
    const now = new Date().toISOString();
    const migrationId = `fad-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const history = readJson<FadMigrationHistory[]>(HISTORY_FILE, []);
    const stored = readJson<StoredMigration[]>(RECORDS_FILE, []);

    if (!validation.valid) {
      const failed: FadMigrationHistory = { migrationId, tenantId, userId, createdAt: now, completedAt: now, status: 'failed', sourceSystem: 'FAD', fileCount: Array.isArray(manifest?.files) ? manifest.files.length : 0, recordCount: Array.isArray(manifest?.records) ? manifest.records.length : 0, importedCount: 0, skippedCount: 0, rejectedCount: validation.rejected, reviewCount: validation.review, manifestFingerprint: validation.manifestFingerprint, error: 'Manifest không hợp lệ' };
      history.unshift(failed); writeJson(HISTORY_FILE, history.slice(0, 500));
      return { success: false, migration: failed };
    }

    const tenantFingerprints = new Set(stored.filter((r) => r.tenantId === tenantId).map((r) => r.fingerprint));
    const importable = manifest.records.filter((r) => r.status === 'ready');
    const rejectedCount = manifest.records.filter((r) => r.status === 'rejected').length;
    const reviewCount = manifest.records.filter((r) => r.status === 'review').length;
    let importedCount = 0;
    let skippedCount = 0;
    const domainCounts: Record<string, number> = {};

    for (const record of importable) {
      if (tenantFingerprints.has(record.fingerprint)) { skippedCount++; continue; }
      stored.push({ ...record, tenantId, migrationId, importedAt: now });
      tenantFingerprints.add(record.fingerprint);
      importedCount++;

      const adapted = adaptRecord(record, tenantId, migrationId, now);
      if (adapted) {
        const file = path.join(DATA_DIR, DOMAIN_FILES[record.targetDomain]);
        const domainRecords = readJson<DomainRecord[]>(file, []);
        if (!domainRecords.some((item) => item.tenantId === tenantId && item.fingerprint === adapted.fingerprint)) {
          domainRecords.push(adapted);
          writeJson(file, domainRecords);
          domainCounts[record.targetDomain] = (domainCounts[record.targetDomain] || 0) + 1;
        }
      }
    }

    const completed: FadMigrationHistory = { migrationId, tenantId, userId, createdAt: now, completedAt: new Date().toISOString(), status: 'imported', sourceSystem: 'FAD', fileCount: manifest.files.length, recordCount: manifest.records.length, importedCount, skippedCount, rejectedCount, reviewCount, manifestFingerprint: validation.manifestFingerprint, domainCounts };
    writeJson(RECORDS_FILE, stored);
    history.unshift(completed); writeJson(HISTORY_FILE, history.slice(0, 500));
    return { success: true, migration: completed };
  }

  static getHistory(tenantId: string, limit = 50): FadMigrationHistory[] {
    return readJson<FadMigrationHistory[]>(HISTORY_FILE, []).filter((m) => m.tenantId === tenantId).slice(0, Math.min(Math.max(limit, 1), 200));
  }

  static getImportedRecords(tenantId: string, migrationId?: string, limit = 500): StoredMigration[] {
    return readJson<StoredMigration[]>(RECORDS_FILE, []).filter((r) => r.tenantId === tenantId && (!migrationId || r.migrationId === migrationId)).slice(0, Math.min(Math.max(limit, 1), 2000));
  }

  static getDomainRecords(tenantId: string, domain: string, limit = 500): DomainRecord[] {
    const fileName = DOMAIN_FILES[domain];
    if (!fileName) return [];
    return readJson<DomainRecord[]>(path.join(DATA_DIR, fileName), []).filter((r) => r.tenantId === tenantId).slice(0, Math.min(Math.max(limit, 1), 2000));
  }
}
