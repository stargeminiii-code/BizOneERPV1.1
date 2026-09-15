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
  error?: string;
};

type StoredMigration = FadMigrationRecord & {
  tenantId: string;
  migrationId: string;
  importedAt: string;
};

const DATA_DIR = path.join(process.cwd(), '.data_store');
const HISTORY_FILE = path.join(DATA_DIR, 'fad_migration_history.json');
const RECORDS_FILE = path.join(DATA_DIR, 'fad_migration_records.json');

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
  const canonical = JSON.stringify(manifest.records.map((r) => ({
    fingerprint: r.fingerprint,
    targetDomain: r.targetDomain,
    status: r.status
  })));
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

export class FadMigrationService {
  static validateManifest(manifest: FadMigrationManifestInput): {
    valid: boolean;
    manifestFingerprint: string;
    errors: Array<{ index: number; errors: string[] }>;
    ready: number;
    review: number;
    rejected: number;
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

    return {
      valid: errors.length === 0,
      manifestFingerprint: fingerprintManifest(manifest),
      errors,
      ready: records.filter((r) => r.status === 'ready').length,
      review: records.filter((r) => r.status === 'review').length,
      rejected: records.filter((r) => r.status === 'rejected').length
    };
  }

  static importManifest(tenantId: string, userId: string, manifest: FadMigrationManifestInput): {
    success: boolean;
    migration: FadMigrationHistory;
  } {
    const validation = this.validateManifest(manifest);
    const now = new Date().toISOString();
    const migrationId = `fad-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const history = readJson<FadMigrationHistory[]>(HISTORY_FILE, []);
    const stored = readJson<StoredMigration[]>(RECORDS_FILE, []);

    if (!validation.valid) {
      const failed: FadMigrationHistory = {
        migrationId, tenantId, userId, createdAt: now, completedAt: now, status: 'failed', sourceSystem: 'FAD',
        fileCount: Array.isArray(manifest?.files) ? manifest.files.length : 0,
        recordCount: Array.isArray(manifest?.records) ? manifest.records.length : 0,
        importedCount: 0, skippedCount: 0, rejectedCount: validation.rejected, reviewCount: validation.review,
        manifestFingerprint: validation.manifestFingerprint, error: 'Manifest không hợp lệ'
      };
      history.unshift(failed);
      writeJson(HISTORY_FILE, history.slice(0, 500));
      return { success: false, migration: failed };
    }

    const tenantFingerprints = new Set(
      stored.filter((r) => r.tenantId === tenantId).map((r) => r.fingerprint)
    );

    const importable = manifest.records.filter((r) => r.status === 'ready');
    const rejectedCount = manifest.records.filter((r) => r.status === 'rejected').length;
    const reviewCount = manifest.records.filter((r) => r.status === 'review').length;
    let importedCount = 0;
    let skippedCount = 0;

    for (const record of importable) {
      if (tenantFingerprints.has(record.fingerprint)) {
        skippedCount++;
        continue;
      }
      stored.push({ ...record, tenantId, migrationId, importedAt: now });
      tenantFingerprints.add(record.fingerprint);
      importedCount++;
    }

    const completed: FadMigrationHistory = {
      migrationId, tenantId, userId, createdAt: now, completedAt: new Date().toISOString(), status: 'imported',
      sourceSystem: 'FAD', fileCount: manifest.files.length, recordCount: manifest.records.length,
      importedCount, skippedCount, rejectedCount, reviewCount, manifestFingerprint: validation.manifestFingerprint
    };

    writeJson(RECORDS_FILE, stored);
    history.unshift(completed);
    writeJson(HISTORY_FILE, history.slice(0, 500));
    return { success: true, migration: completed };
  }

  static getHistory(tenantId: string, limit = 50): FadMigrationHistory[] {
    return readJson<FadMigrationHistory[]>(HISTORY_FILE, [])
      .filter((m) => m.tenantId === tenantId)
      .slice(0, Math.min(Math.max(limit, 1), 200));
  }

  static getImportedRecords(tenantId: string, migrationId?: string, limit = 500): StoredMigration[] {
    return readJson<StoredMigration[]>(RECORDS_FILE, [])
      .filter((r) => r.tenantId === tenantId && (!migrationId || r.migrationId === migrationId))
      .slice(0, Math.min(Math.max(limit, 1), 2000));
  }
}
