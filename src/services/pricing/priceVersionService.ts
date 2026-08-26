import {
  SellingPriceVersion,
  PurchaseCostRecord,
  TemporalResolutionResult,
  SalesChannel
} from '../../types';
import { EffectiveDateResolver } from '../temporal/effectiveDateResolver';

export class PriceVersionService {
  private static priceVersions: Map<string, SellingPriceVersion[]> = new Map(); // key = `${tenantId}:${sku}:${channel || 'ALL'}:${priceListId || 'DEFAULT'}`
  private static purchaseCostHistory: Map<string, PurchaseCostRecord[]> = new Map(); // key = `${tenantId}:${sku}`

  /**
   * Reset / clear all state (useful for tests and initialization)
   */
  static clear(): void {
    this.priceVersions.clear();
    this.purchaseCostHistory.clear();
  }

  /**
   * Seed initial price versions
   */
  static initialize(
    prices: SellingPriceVersion[] = [],
    costs: PurchaseCostRecord[] = []
  ): void {
    this.clear();
    for (const p of prices) {
      const key = this.buildPriceKey(p.tenantId, p.sku, p.channel, p.priceListId);
      const list = this.priceVersions.get(key) || [];
      list.push({ ...p });
      this.priceVersions.set(key, list);
    }

    for (const c of costs) {
      const key = `${c.tenantId}:${c.sku}`;
      const list = this.purchaseCostHistory.get(key) || [];
      list.push({ ...c });
      this.purchaseCostHistory.set(key, list);
    }
  }

  private static buildPriceKey(
    tenantId: string,
    sku: string,
    channel?: SalesChannel | 'ALL',
    priceListId?: string
  ): string {
    return `${tenantId || 'DEFAULT'}:${sku}:${channel || 'ALL'}:${priceListId || 'DEFAULT'}`;
  }

  /**
   * Resolves the exact selling price applicable at a specific historical or current timestamp.
   * NEVER queries mutable Product Master price directly for historical calculations.
   */
  static resolveSellingPrice(
    tenantId: string,
    sku: string,
    effectiveAt: string | Date | number,
    channel: SalesChannel | 'ALL' = 'ALL',
    priceListId = 'DEFAULT'
  ): TemporalResolutionResult<SellingPriceVersion> {
    // First attempt specific channel & price list
    let key = this.buildPriceKey(tenantId, sku, channel, priceListId);
    let versions = this.priceVersions.get(key) || [];

    // Fallback to ALL channel if specific channel has no versions
    if (versions.length === 0 && channel !== 'ALL') {
      key = this.buildPriceKey(tenantId, sku, 'ALL', priceListId);
      versions = this.priceVersions.get(key) || [];
    }

    // Fallback to DEFAULT priceList if specific priceList has no versions
    if (versions.length === 0 && priceListId !== 'DEFAULT') {
      key = this.buildPriceKey(tenantId, sku, channel, 'DEFAULT');
      versions = this.priceVersions.get(key) || [];
    }

    // Fallback to DEFAULT + ALL
    if (versions.length === 0) {
      key = this.buildPriceKey(tenantId, sku, 'ALL', 'DEFAULT');
      versions = this.priceVersions.get(key) || [];
    }

    return EffectiveDateResolver.resolveVersion(versions, effectiveAt);
  }

  /**
   * Creates a new selling price version. Closes prior active version seamlessly.
   */
  static createPriceVersion(
    draft: {
      tenantId: string;
      productId: string;
      sku: string;
      productName?: string;
      price: number;
      currency?: string;
      effectiveFrom: string;
      effectiveTo?: string | null;
      channel?: SalesChannel | 'ALL';
      priceListId?: string;
      minQuantity?: number;
      note?: string;
    },
    actor: string
  ): {
    success: boolean;
    newVersion?: SellingPriceVersion;
    errorMessage?: string;
  } {
    const key = this.buildPriceKey(draft.tenantId, draft.sku, draft.channel, draft.priceListId);
    const existing = this.priceVersions.get(key) || [];

    const result = EffectiveDateResolver.createNextVersion<SellingPriceVersion>(
      existing,
      {
        tenantId: draft.tenantId,
        productId: draft.productId,
        sku: draft.sku,
        productName: draft.productName,
        price: draft.price,
        currency: draft.currency || 'VND',
        effectiveFrom: draft.effectiveFrom,
        effectiveTo: draft.effectiveTo,
        channel: draft.channel || 'ALL',
        priceListId: draft.priceListId || 'DEFAULT',
        minQuantity: draft.minQuantity,
        note: draft.note,
        createdBy: actor
      },
      'PRCV'
    );

    if (!result.success || !result.newVersion) {
      return {
        success: false,
        errorMessage: result.errorMessage
      };
    }

    this.priceVersions.set(key, result.updatedVersions || []);
    return {
      success: true,
      newVersion: result.newVersion
    };
  }

  /**
   * Retrieves full chronological price history for an SKU.
   */
  static getPriceHistory(
    tenantId: string,
    sku: string,
    channel: SalesChannel | 'ALL' = 'ALL',
    priceListId = 'DEFAULT'
  ): SellingPriceVersion[] {
    const key = this.buildPriceKey(tenantId, sku, channel, priceListId);
    const list = this.priceVersions.get(key) || [];
    return [...list].sort(
      (a, b) =>
        EffectiveDateResolver.normalizeTimestamp(a.effectiveFrom) -
        EffectiveDateResolver.normalizeTimestamp(b.effectiveFrom)
    );
  }

  /**
   * Retrieves all price versions for a tenant.
   */
  static getAllPriceVersions(tenantId: string): SellingPriceVersion[] {
    const all: SellingPriceVersion[] = [];
    for (const [key, versions] of this.priceVersions.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        all.push(...versions);
      }
    }
    return all.sort(
      (a, b) =>
        EffectiveDateResolver.normalizeTimestamp(b.effectiveFrom) -
        EffectiveDateResolver.normalizeTimestamp(a.effectiveFrom)
    );
  }

  // --- PURCHASE COST HISTORY ---

  /**
   * Records an immutable purchase cost record from a PO goods receipt.
   */
  static recordPurchaseCost(record: Omit<PurchaseCostRecord, 'recordId' | 'createdAt'>): PurchaseCostRecord {
    const key = `${record.tenantId}:${record.sku}`;
    const list = this.purchaseCostHistory.get(key) || [];

    const saved: PurchaseCostRecord = {
      ...record,
      recordId: `COST-REC-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };

    list.push(saved);
    this.purchaseCostHistory.set(key, list);
    return saved;
  }

  /**
   * Retrieves purchase cost history for an SKU.
   */
  static getPurchaseCostHistory(tenantId: string, sku: string): PurchaseCostRecord[] {
    const key = `${tenantId}:${sku}`;
    const list = this.purchaseCostHistory.get(key) || [];
    return [...list].sort(
      (a, b) =>
        EffectiveDateResolver.normalizeTimestamp(b.receivedDate || b.purchaseDate) -
        EffectiveDateResolver.normalizeTimestamp(a.receivedDate || a.purchaseDate)
    );
  }
}
