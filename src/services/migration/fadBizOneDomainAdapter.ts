import { ProductMasterRepository } from '../../repositories/productMasterRepository';
import { InventoryRepository } from '../../repositories/inventoryRepository';
import type { InventoryLayer } from '../../types';

type FadRecord = {
  sourceTable: string;
  sourceId?: string;
  fingerprint: string;
  fields: Record<string, unknown>;
  targetDomain: string;
  status: 'ready' | 'review' | 'rejected';
};

const norm = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const text = (f: Record<string, unknown>, aliases: string[]) => {
  const map = new Map(Object.entries(f).map(([k, v]) => [norm(k), v]));
  for (const a of aliases) { const v = map.get(norm(a)); if (v !== undefined && v !== null && String(v).trim()) return String(v).trim(); }
  return undefined;
};
const num = (f: Record<string, unknown>, aliases: string[]) => {
  const v = text(f, aliases); if (v === undefined) return undefined;
  const n = Number(v.replace(/,/g, '')); return Number.isFinite(n) ? n : undefined;
};

function tenantMap<T>(store: Map<string, Map<string, T>>, tenantId: string) {
  let map = store.get(tenantId);
  if (!map) { map = new Map<string, T>(); store.set(tenantId, map); }
  return map;
}

export type FadAdapterResult = {
  imported: number;
  skipped: number;
  products: number;
  variants: number;
  inventoryLayers: number;
  warnings: string[];
};

export class FadBizOneDomainAdapter {
  static importRecords(tenantId: string, records: FadRecord[]): FadAdapterResult {
    ProductMasterRepository.initialize();
    const productStore = tenantMap<Product>((ProductMasterRepository as any).products, tenantId);
    const variantStore = tenantMap<any>((ProductMasterRepository as any).variants, tenantId);
    const skuStore = tenantMap<any>((ProductMasterRepository as any).skus, tenantId);
    const existing = new Set<string>();
    const result: FadAdapterResult = { imported: 0, skipped: 0, products: 0, variants: 0, inventoryLayers: 0, warnings: [] };

    for (const record of records) {
      if (record.status !== 'ready' || !record.sourceId) continue;
      if (existing.has(record.fingerprint)) { result.skipped++; continue; }
      existing.add(record.fingerprint);
      const f = record.fields;
      const sourceId = String(record.sourceId);
      const productCode = text(f, ['productCode','product_code','maSanPham','maHang','code']) || sourceId;
      const productName = text(f, ['productName','product_name','tenSanPham','tenHang','name']) || `FAD ${sourceId}`;
      const sku = text(f, ['sku','maSku','variantSku','maHang']) || productCode;
      const unit = text(f, ['unit','donViTinh','dvt','donVi']) || 'Cái';
      const cost = num(f, ['costPrice','purchasePrice','giaNhap','donGiaNhap','giaVon']) ?? 0;
      const sale = num(f, ['sellingPrice','salePrice','giaBan','donGiaBan']) ?? 0;
      const now = new Date().toISOString();
      const productId = `FAD-${productCode}`;

      if (record.targetDomain === 'products') {
        if (!productStore.has(productId)) {
          const product: any = {
            id: productId, productId, tenantId, code: productCode, productCode,
            sku, variantSku: sku, name: productName, productName, shortName: productName,
            description: `Imported from FAD/${record.sourceTable}`, productType: 'TRADING_GOOD',
            categoryId: 'cat-fad-import', category: 'FAD Import', brandId: undefined, brand: undefined,
            unit, status: 'ACTIVE', tags: ['FAD'], trackLot: true, trackExpiry: true,
            costPrice: cost, sellingPrice: sale, minStock: 0, location: '', supplierName: '', supplierId: undefined,
            attributes: [{ key: 'fad_source', value: `${record.sourceTable}:${sourceId}`, label: 'FAD Source' }],
            createdAt: now, updatedAt: now
          };
          productStore.set(productId, product);
          result.products++;
        }
        if (!variantStore.has(`${productId}:${sku}`)) {
          const variant: any = {
            id: `${productId}:${sku}`, variantId: `${productId}:${sku}`, tenantId, productId,
            variantName: text(f, ['variantName','tenBienThe','tenQuyCach','quyCach']) || 'Mặc định',
            name: text(f, ['variantName','tenBienThe','tenQuyCach','quyCach']) || 'Mặc định',
            variantSku: sku, sku, packSize: num(f, ['packSize','quyCachSoLuong','soLuongDongGoi']) ?? 1,
            unit, sellingPrice: sale, costPrice: cost, stock: 0, minStock: 0,
            barcode: text(f, ['barcode','barCode','maVach']), status: 'ACTIVE', createdAt: now, updatedAt: now,
            attributes: { fadSourceTable: record.sourceTable, fadSourceId: sourceId, fadFingerprint: record.fingerprint }
          };
          variantStore.set(`${productId}:${sku}`, variant);
          skuStore.set(sku, { id: sku, sku, tenantId, productId, variantId: variant.variantId, status: 'ACTIVE', sourceSystem: 'FAD', sourceId, fingerprint: record.fingerprint });
          result.variants++;
        }
      }

      if (record.targetDomain === 'inventory') {
        const quantity = num(f, ['quantity','soLuong','tonKho','soLuongTon','stock','stockQuantity']) ?? 0;
        if (quantity <= 0) continue;
        const warehouseId = text(f, ['warehouseId','maKho','warehouse']) || 'WH-FAD';
        const branchId = text(f, ['branchId','maChiNhanh','branch']) || 'BR01';
        const layerId = `FAD-${record.sourceTable}-${sourceId}`;
        const exists = InventoryRepository.getAllLayers({ tenantId, warehouseId, sku }).some(l => l.layerId === layerId);
        if (!exists) {
          const layer: InventoryLayer = {
            id: layerId, tenantId, layerId, lotNumber: text(f, ['lotNumber','soLo','loHang']) || layerId,
            layerType: 'OPENING_BALANCE', sku, productId, productCode, productName,
            variantName: text(f, ['variantName','tenBienThe','quyCach']), variantSku: sku,
            packSize: text(f, ['packSize','quyCachSoLuong']), unit, branchId, branchName: text(f, ['branchName','tenChiNhanh']),
            warehouseId, warehouseName: text(f, ['warehouseName','tenKho']), supplierId: text(f, ['supplierId','maNhaCungCap']),
            supplierName: text(f, ['supplierName','tenNhaCungCap']) || 'FAD', receiptCode: text(f, ['receiptCode','soPhieuNhap']),
            receivedAt: text(f, ['receivedAt','ngayNhap','date']) || now, createdAt: now,
            expiryDate: text(f, ['expiryDate','hanSuDung']), manufacturingDate: text(f, ['manufacturingDate','ngaySanXuat']),
            quantityReceived: quantity, quantityIssued: 0, quantityRemaining: quantity,
            purchasePrice: cost, unitCost: cost, salePrice: sale, status: 'active', notes: `FAD import ${record.fingerprint}`,
            createdBy: 'FAD-MIGRATION'
          };
          InventoryRepository.saveLayer(layer);
          InventoryRepository.recordTransaction({
            id: `TX-${layerId}`, tenantId, date: now, type: 'Điều chỉnh tăng', canonicalType: 'OPENING_BALANCE',
            docCode: `FAD-${record.sourceTable}-${sourceId}`, referenceType: 'FAD_MIGRATION', referenceId: record.fingerprint,
            sku, productId, productName, lotId: layerId, branchId, warehouseId, qtyIn: quantity, qtyOut: 0,
            balance: quantity, unitCost: cost, totalValue: quantity * cost, actor: 'FAD-MIGRATION', createdBy: 'FAD-MIGRATION', status: 'POSTED'
          }, `FAD:${tenantId}:${record.fingerprint}`);
          result.inventoryLayers++;
        }
      }
      result.imported++;
    }
    return result;
  }
}

type Product = Record<string, unknown>;
