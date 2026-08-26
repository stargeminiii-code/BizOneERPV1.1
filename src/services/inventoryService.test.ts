import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryService } from './inventoryService';
import { InventoryRepository } from '../repositories/inventoryRepository';
import { fifoEngine } from './fifoEngine';
import { InventoryLayer, PurchaseOrder, Order, StockTransfer, Stocktake, UserAccount } from '../types';

describe('Inventory Core + FIFO Engine Tests', () => {
  const tenantA = 'tenant-household-01';

  const mockUserA: UserAccount = {
    id: 'u1',
    tenantId: tenantA,
    username: 'staff_hn',
    fullName: 'Nhân viên Kho HN',
    email: 'hn@bizone.vn',
    role: 'warehouse_staff',
    status: 'active',
    phone: '0901234567',
    assignedBranchIds: ['BR01'],
    assignedWarehouseIds: ['WH01'],
    dataScope: 'individual',
    permissions: {},
    createdAt: '2026-01-01'
  };

  const sampleLayers: InventoryLayer[] = [
    {
      id: 'L1',
      tenantId: tenantA,
      layerId: 'LOT-A',
      layerType: 'RECEIPT',
      sku: 'SKU-001',
      productId: 'P-001',
      productCode: 'CF-ROB',
      productName: 'Cà phê Robusta',
      supplierName: 'NCC Cà phê',
      unit: 'Gói',
      branchId: 'BR01',
      branchName: 'Chi nhánh Hà Nội',
      warehouseId: 'WH01',
      warehouseName: 'Kho Tổng Hà Nội',
      receiptCode: 'PO-001',
      receivedAt: '2026-08-01',
      createdAt: '2026-08-01T08:00:00Z',
      quantityReceived: 100,
      quantityIssued: 0,
      quantityRemaining: 100,
      purchasePrice: 120000,
      salePrice: 180000,
      status: 'active'
    },
    {
      id: 'L2',
      tenantId: tenantA,
      layerId: 'LOT-B',
      layerType: 'RECEIPT',
      sku: 'SKU-001',
      productId: 'P-001',
      productCode: 'CF-ROB',
      productName: 'Cà phê Robusta',
      supplierName: 'NCC Cà phê',
      unit: 'Gói',
      branchId: 'BR01',
      branchName: 'Chi nhánh Hà Nội',
      warehouseId: 'WH01',
      warehouseName: 'Kho Tổng Hà Nội',
      receiptCode: 'PO-002',
      receivedAt: '2026-08-05',
      createdAt: '2026-08-05T08:00:00Z',
      quantityReceived: 200,
      quantityIssued: 0,
      quantityRemaining: 200,
      purchasePrice: 125000,
      salePrice: 180000,
      status: 'active'
    }
  ];

  beforeEach(() => {
    InventoryRepository.clear();
    InventoryRepository.initialize(sampleLayers);
  });

  it('1. FIFO allocation across single and multiple lots calculates precise COGS', () => {
    const result = InventoryService.allocateFIFO({
      tenantId: tenantA,
      branchId: 'BR01',
      warehouseId: 'WH01',
      sku: 'SKU-001',
      quantity: 150,
      referenceType: 'SALE_ORDER',
      referenceId: 'ORD-101'
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('SUCCESS');
    expect(result.allocatedLayers).toHaveLength(2);

    expect(result.allocatedLayers[0].layerId).toBe('LOT-A');
    expect(result.allocatedLayers[0].quantity).toBe(100);
    expect(result.allocatedLayers[0].purchasePrice).toBe(120000);

    expect(result.allocatedLayers[1].layerId).toBe('LOT-B');
    expect(result.allocatedLayers[1].quantity).toBe(50);
    expect(result.allocatedLayers[1].purchasePrice).toBe(125000);

    expect(result.totalCOGS).toBe(18250000);
  });

  it('2. Insufficient stock triggers INSUFFICIENT_STOCK status without fabricating negative cost', () => {
    const result = InventoryService.allocateFIFO({
      tenantId: tenantA,
      branchId: 'BR01',
      warehouseId: 'WH01',
      sku: 'SKU-001',
      quantity: 500,
      referenceType: 'SALE_ORDER',
      referenceId: 'ORD-102',
      allowNegativeStock: false
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('INSUFFICIENT_STOCK');
    expect(result.remainingQuantity).toBe(200);
  });

  it('3. Goods receipt increments stock and establishes new FIFO layer with actual PO unit cost', () => {
    const po: PurchaseOrder = {
      id: 'PO-NEW-01',
      code: 'PO-NEW-01',
      supplierId: 'SUP01',
      supplierName: 'Nhà cung cấp Cà phê Việt',
      branchId: 'BR01',
      branchName: 'Chi nhánh Hà Nội',
      warehouseId: 'WH01',
      warehouseName: 'Kho Tổng Hà Nội',
      orderDate: '2026-08-10',
      expectedDate: '2026-08-12',
      status: 'received',
      totalAmount: 13000000,
      paidAmount: 13000000,
      debtAmount: 0,
      paymentStatus: 'paid',
      items: [
        {
          productId: 'P-001',
          sku: 'SKU-001',
          lotId: 'LOT-NEW-01',
          productName: 'Cà phê Robusta',
          unit: 'Gói',
          quantity: 100,
          price: 130000,
          discount: 0,
          vat: 0,
          totalAmount: 13000000
        }
      ],
      createdBy: 'Admin',
      createdAt: '2026-08-10 09:00:00'
    };

    const receiptResult = InventoryService.processGoodsReceipt(po, 'Admin');
    expect(receiptResult.success).toBe(true);
    expect(receiptResult.newLayers).toHaveLength(1);
    expect(receiptResult.newLayers[0].purchasePrice).toBe(130000);
    expect(receiptResult.newLayers[0].quantityRemaining).toBe(100);

    const totalStock = InventoryRepository.getStockBalance(tenantA, 'WH01', 'SKU-001');
    expect(totalStock).toBe(400);
  });

  it('4. Order Issue records StockTransaction and allocates FIFO layers with idempotency protection', () => {
    const order: Order = {
      id: 'ORD-999',
      code: 'ORD-999',
      customerName: 'Khách lẻ',
      customerPhone: '0912345678',
      channel: 'POS',
      branchId: 'BR01',
      branchName: 'Chi nhánh Hà Nội',
      orderDate: '2026-08-15 10:00:00',
      status: 'completed',
      totalAmount: 1800000,
      discount: 0,
      tax: 0,
      finalAmount: 1800000,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      items: [
        {
          productId: 'P-001',
          sku: 'SKU-001',
          productName: 'Cà phê Robusta',
          unit: 'Gói',
          quantity: 10,
          unitPrice: 180000,
          totalPrice: 1800000,
          fifoCost: 120000
        }
      ]
    };

    const idempotencyKey = 'IDEMPOTENCY-ORD-999';
    const issueResult = InventoryService.processOrderIssue(
      order,
      [{ sku: 'SKU-001', quantity: 10, productName: 'Cà phê Robusta', salePrice: 180000 }],
      'Staff',
      idempotencyKey
    );

    expect(issueResult.success).toBe(true);
    expect(issueResult.cogs).toBe(10 * 120000);
    expect(issueResult.transactions).toHaveLength(1);

    // Test Idempotency: Repeating the transaction does not duplicate stock transaction
    InventoryService.processOrderIssue(
      order,
      [{ sku: 'SKU-001', quantity: 10, productName: 'Cà phê Robusta', salePrice: 180000 }],
      'Staff',
      idempotencyKey
    );

    const allTxs = InventoryRepository.getTransactions({ sku: 'SKU-001' });
    expect(allTxs.filter((t) => t.docCode === 'ORD-999')).toHaveLength(1);
  });

  it('5. FIFO reversal creates reverse transaction and restores layer remaining stock', () => {
    const order: Order = {
      id: 'ORD-REV-1',
      code: 'ORD-REV-1',
      customerName: 'Khách đổi trả',
      customerPhone: '0912345678',
      channel: 'POS',
      branchId: 'BR01',
      branchName: 'Chi nhánh Hà Nội',
      orderDate: '2026-08-16 10:00:00',
      status: 'completed',
      totalAmount: 1800000,
      discount: 0,
      tax: 0,
      finalAmount: 1800000,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      items: [
        {
          productId: 'P-001',
          sku: 'SKU-001',
          productName: 'Cà phê Robusta',
          unit: 'Gói',
          quantity: 20,
          unitPrice: 180000,
          totalPrice: 3600000,
          fifoCost: 120000
        }
      ]
    };

    InventoryService.processOrderIssue(
      order,
      [{ sku: 'SKU-001', quantity: 20, productName: 'Cà phê Robusta' }],
      'Staff'
    );

    expect(InventoryRepository.getStockBalance(tenantA, 'WH01', 'SKU-001')).toBe(280);

    const revResult = InventoryService.reverseOrderIssue(order, 'Khách trả hàng nguyên tem', 'Admin');
    expect(revResult.success).toBe(true);
    expect(revResult.transactions).toHaveLength(1);
    expect(revResult.transactions[0].canonicalType).toBe('REVERSAL');

    expect(InventoryRepository.getStockBalance(tenantA, 'WH01', 'SKU-001')).toBe(300);
  });

  it('6. Stock Transfer correctly decrements source and increments destination preserving FIFO layers', () => {
    const transfer: StockTransfer = {
      id: 'TF-001',
      code: 'CK-2026-001',
      transferDate: '2026-08-18',
      fromBranchId: 'BR01',
      fromBranchName: 'Chi nhánh Hà Nội',
      fromWarehouseId: 'WH01',
      fromWarehouseName: 'Kho Tổng Hà Nội',
      toBranchId: 'BR02',
      toBranchName: 'Chi nhánh TP.HCM',
      toWarehouseId: 'WH03',
      toWarehouseName: 'Kho Tổng TP.HCM',
      status: 'completed',
      totalQuantity: 50,
      items: [
        {
          productId: 'P-001',
          sku: 'SKU-001',
          productName: 'Cà phê Robusta',
          unit: 'Gói',
          quantity: 50,
          fifoCost: 120000
        }
      ],
      createdBy: 'WarehouseManager'
    };

    const tfResult = InventoryService.processStockTransfer(transfer, 'WarehouseManager');
    expect(tfResult.success).toBe(true);

    expect(InventoryRepository.getStockBalance(tenantA, 'WH01', 'SKU-001')).toBe(250);
    expect(InventoryRepository.getStockBalance(tenantA, 'WH03', 'SKU-001')).toBe(50);
  });

  it('7. Stocktake adjusts discrepancy by generating appropriate adjustment transactions', () => {
    const stocktake: Stocktake = {
      id: 'ST-001',
      code: 'KK-2026-001',
      branchId: 'BR01',
      branchName: 'Chi nhánh Hà Nội',
      warehouseId: 'WH01',
      warehouseName: 'Kho Tổng Hà Nội',
      stocktakeDate: '2026-08-20',
      status: 'completed',
      createdBy: 'Auditor',
      items: [
        {
          productId: 'P-001',
          sku: 'SKU-001',
          productName: 'Cà phê Robusta',
          unit: 'Gói',
          systemQty: 300,
          actualQty: 295,
          diffQty: -5,
          unitCost: 120000,
          diffValue: -600000,
          reason: 'Thất thoát bao bì hỏng'
        }
      ]
    };

    const stResult = InventoryService.processStocktake(stocktake, 'Auditor');
    expect(stResult.success).toBe(true);
    expect(stResult.generatedTransactions).toHaveLength(1);
    expect(stResult.generatedTransactions![0].type).toBe('Điều chỉnh giảm');

    expect(InventoryRepository.getStockBalance(tenantA, 'WH01', 'SKU-001')).toBe(295);
  });

  it('8. RBAC and DataScope prevents unauthorized warehouse access', () => {
    const result = InventoryService.allocateFIFO(
      {
        tenantId: tenantA,
        branchId: 'BR02',
        warehouseId: 'WH03',
        sku: 'SKU-001',
        quantity: 10,
        referenceType: 'SALE_ORDER',
        referenceId: 'ORD-ILLEGAL'
      },
      mockUserA
    );

    expect(result.success).toBe(false);
    expect(result.status).toBe('UNAUTHORIZED');
  });

  it('9. Stock Aging 7 Buckets and Expiry calculation operate without synthetic or random data', () => {
    const allLayers = InventoryRepository.getAllLayers();
    const referenceDate = new Date('2026-08-25');

    const agingBuckets = fifoEngine.calculateAgingBuckets(allLayers, referenceDate);
    expect(agingBuckets).toBeDefined();
    expect(agingBuckets['under7d']).toBeDefined();
    expect(agingBuckets['sevenTo30d']).toBeDefined();
    expect(agingBuckets['thirtyTo90d']).toBeDefined();
    expect(agingBuckets['ninetyTo180d']).toBeDefined();
    expect(agingBuckets['oneEightyTo360d']).toBeDefined();
    expect(agingBuckets['oneTo2y']).toBeDefined();
    expect(agingBuckets['over2y']).toBeDefined();

    const totalAgingValue = Object.values(agingBuckets).reduce((acc, b) => acc + b.totalValue, 0);
    const totalInventoryValue = fifoEngine.calculateTotalInventoryValue(allLayers);
    expect(totalAgingValue).toBe(totalInventoryValue);
  });
});
