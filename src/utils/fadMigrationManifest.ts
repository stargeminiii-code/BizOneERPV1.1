import { sourceFingerprint, type BizOneTargetDomain, type FadExtractedRecord, type FadSourceFile } from './fadMigrationEngine';

export type FadManifestRecord = FadExtractedRecord & {
  fingerprint: string;
  targetDomain: BizOneTargetDomain;
  status: 'ready' | 'review' | 'rejected';
  warnings: string[];
};

export type FadMigrationManifest = {
  version: '1.0';
  generatedAt: string;
  sourceSystem: 'FAD';
  mode: 'dry-run';
  files: FadSourceFile[];
  records: FadManifestRecord[];
  summary: { files: number; records: number; ready: number; review: number; rejected: number };
};

const DOMAIN_FIELDS: Record<BizOneTargetDomain, string[]> = {
  iam: ['id', 'user_id', 'account_id', 'username', 'role_id'], configuration: ['id', 'key', 'name', 'value'],
  products: ['id', 'product_id', 'item_id', 'sku', 'name', 'code'], inventory: ['id', 'item_id', 'warehouse_id', 'quantity', 'stock', 'qty'],
  sales: ['id', 'order_id', 'customer_id', 'total', 'amount'], purchasing: ['id', 'supplier_id', 'purchase_id', 'quantity', 'amount'],
  crm: ['id', 'customer_id', 'customer_code', 'customer_name', 'phone', 'email'], pricing: ['id', 'price', 'price_id', 'policy_id', 'product_id'],
  marketing: ['id', 'promotion_id', 'promotion_code', 'discount', 'value'], finance: ['id', 'amount', 'account_id', 'transaction_id'],
  omnichannel: ['id', 'channel', 'order_id', 'external_id'], unknown: ['id']
};

function flatten(value: unknown, prefix = '', out: Record<string, unknown> = {}): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, path, out); else out[path] = child;
  }
  return out;
}
function recordsFromJson(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(recordsFromJson);
  return value && typeof value === 'object' ? [flatten(value)] : [];
}
function recordsFromStrings(strings: string[]): Record<string, unknown>[] {
  return strings.flatMap(line => { const match = line.match(/^\s*([A-Za-z_][\w.-]{1,80})\s*[:=]\s*(.*?)\s*$/); return match ? [{ [match[1]]: match[2] }] : []; });
}
function chooseDomain(domains: BizOneTargetDomain[], fields: Record<string, unknown>): BizOneTargetDomain {
  let best = domains[0] ?? 'unknown', score = -1;
  for (const domain of domains) { const aliases = DOMAIN_FIELDS[domain]; const current = Object.keys(fields).reduce((n, key) => n + (aliases.includes(key.split('.').pop()!.toLowerCase()) ? 1 : 0), 0); if (current > score) { score = current; best = domain; } }
  return best;
}

export async function buildDryRunManifest(files: Array<{ source: FadSourceFile; domains: BizOneTargetDomain[]; strings: string[]; jsonFragments: unknown[] }>): Promise<FadMigrationManifest> {
  const records: FadManifestRecord[] = [];
  for (const file of files) {
    const candidates = file.jsonFragments.flatMap(recordsFromJson);
    if (!candidates.length) candidates.push(...recordsFromStrings(file.strings));
    for (const fields of candidates.slice(0, 5000)) {
      const rawId = Object.entries(fields).find(([key]) => /(^|\.)(id|code|key)$/i.test(key))?.[1];
      const sourceId = rawId == null ? `row-${records.length + 1}` : String(rawId);
      const targetDomain = chooseDomain(file.domains, fields), warnings: string[] = [];
      if (!rawId) warnings.push('Không tìm thấy ID/code nguồn; cần kiểm tra trước import.');
      if (targetDomain === 'unknown') warnings.push('Chưa xác định domain BizOne.');
      const fingerprint = await sourceFingerprint({ sourceSystem: 'FAD', sourceTable: file.source.sourceTable, sourceId });
      records.push({ sourceSystem: 'FAD', sourceTable: file.source.sourceTable, sourceFile: file.source.fileName, sourceId, fields, confidence: warnings.length ? 'low' : 'medium', fingerprint, targetDomain, status: targetDomain === 'unknown' ? 'rejected' : warnings.length ? 'review' : 'ready', warnings });
    }
  }
  const summary = { files: files.length, records: records.length, ready: records.filter(r => r.status === 'ready').length, review: records.filter(r => r.status === 'review').length, rejected: records.filter(r => r.status === 'rejected').length };
  return { version: '1.0', generatedAt: new Date().toISOString(), sourceSystem: 'FAD', mode: 'dry-run', files: files.map(f => f.source), records, summary };
}

export function downloadManifest(manifest: FadMigrationManifest): void {
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url;
  anchor.download = `bizone-fad-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.json`; anchor.click(); URL.revokeObjectURL(url);
}
