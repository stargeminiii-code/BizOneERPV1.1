export type FadSourceFile = {
  fileName: string;
  sourceSystem: 'FAD';
  sourceTable: string;
  byteLength: number;
};

export type FadExtractedRecord = {
  sourceSystem: 'FAD';
  sourceTable: string;
  sourceFile: string;
  sourceId?: string;
  fields: Record<string, unknown>;
  confidence: 'high' | 'medium' | 'low';
};

export type BizOneTargetDomain =
  | 'iam'
  | 'configuration'
  | 'products'
  | 'inventory'
  | 'sales'
  | 'purchasing'
  | 'crm'
  | 'pricing'
  | 'marketing'
  | 'finance'
  | 'omnichannel'
  | 'unknown';

const DATASET_DOMAIN_MAP: Record<string, BizOneTargetDomain[]> = {
  account_object: ['omnichannel', 'configuration'],
  box_user_role: ['iam'],
  box_table_config: ['configuration'],
  inventory_item: ['products', 'inventory'],
  inventory_item_detail: ['products', 'inventory'],
  promotion: ['marketing', 'sales'],
  promotion_detail: ['marketing', 'sales'],
  price_policy: ['pricing'],
  customer_category: ['crm'],
  seller_other: ['purchasing', 'crm'],
};

/**
 * Resolve a FAD filename to the independent BizOne domain model.
 * This is deliberately a mapping layer, not a copy of source-application logic.
 */
export function resolveFadDomains(fileName: string): BizOneTargetDomain[] {
  const dataset = fileName.replace(/\\.hive$/i, '').toLowerCase();
  return DATASET_DOMAIN_MAP[dataset] ?? ['unknown'];
}

/**
 * Extract printable UTF-8/ASCII runs from a binary FAD payload.
 * This is an analysis primitive only; it does not pretend to fully decode Hive.
 */
export function extractReadableStrings(buffer: ArrayBuffer, minLength = 4): string[] {
  const bytes = new Uint8Array(buffer);
  const output: string[] = [];
  let current: number[] = [];

  const flush = () => {
    if (current.length < minLength) {
      current = [];
      return;
    }
    const text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(current));
    const normalized = text.replace(/\\u0000/g, '').trim();
    if (normalized.length >= minLength) output.push(normalized);
    current = [];
  };

  for (const byte of bytes) {
    const printable = byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126) || byte >= 128;
    if (printable) current.push(byte);
    else flush();
  }
  flush();

  return [...new Set(output)];
}

/** Discover embedded JSON objects/arrays present in readable binary data. */
export function discoverJsonFragments(strings: string[]): unknown[] {
  const found: unknown[] = [];

  for (const value of strings) {
    const candidates = [value];
    const firstObject = value.indexOf('{');
    const firstArray = value.indexOf('[');
    if (firstObject > 0) candidates.push(value.slice(firstObject));
    if (firstArray > 0) candidates.push(value.slice(firstArray));

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate);
        found.push(parsed);
      } catch {
        // Binary text often contains JSON followed by non-JSON bytes.
        // Ignore malformed candidates; keep the raw readable string instead.
      }
    }
  }

  return found;
}

export function buildSourceFile(file: File): FadSourceFile {
  const sourceTable = file.name.replace(/\\.hive$/i, '');
  return {
    fileName: file.name,
    sourceSystem: 'FAD',
    sourceTable,
    byteLength: file.size,
  };
}

export async function inspectFadFile(file: File): Promise<{
  source: FadSourceFile;
  domains: BizOneTargetDomain[];
  strings: string[];
  jsonFragments: unknown[];
}> {
  const source = buildSourceFile(file);
  const domains = resolveFadDomains(file.name);
  const buffer = await file.arrayBuffer();
  const strings = extractReadableStrings(buffer);
  const jsonFragments = discoverJsonFragments(strings);

  return { source, domains, strings, jsonFragments };
}

/**
 * Stable record fingerprint for idempotent future server-side imports.
 * Do not use this as a security primitive.
 */
export async function sourceFingerprint(input: {
  sourceSystem: string;
  sourceTable: string;
  sourceId: string;
}): Promise<string> {
  const data = new TextEncoder().encode(
    `${input.sourceSystem}|${input.sourceTable}|${input.sourceId}`
  );
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
