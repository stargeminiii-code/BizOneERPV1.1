import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Search,
  Building2,
  Warehouse as WarehouseIcon,
  DollarSign,
  TrendingUp,
  Layers,
  BarChart3,
  Boxes
} from 'lucide-react';
import {
  Product,
  InventoryLayer,
  StockTransaction,
  StockIssue,
  Branch,
  Warehouse
} from '../types';

interface WarehouseReportsViewProps {
  products: Product[];
  inventoryLots: InventoryLayer[];
  stockTransactions: StockTransaction[];
  stockIssues?: StockIssue[];
  branches: Branch[];
  warehouses: Warehouse[];
}

export const WarehouseReportsView: React.FC<WarehouseReportsViewProps> = ({
  products = [],
  inventoryLots = [],
  stockTransactions = [],
  stockIssues = [],
  branches = [],
  warehouses = []
}) => {
  const [activeTab, setActiveTab] = useState<'nxt' | 'fifo' | 'profit'>('nxt');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. NXT Calculations per product
  const nxtData = products.map((prod) => {
    // Filter transactions for this SKU
    const txList = stockTransactions.filter((tx) => {
      if (tx.sku !== prod.sku) return false;
      if (selectedWarehouse !== 'all' && tx.warehouseId && tx.warehouseId !== selectedWarehouse) return false;
      return true;
    });

    const qtyIn = txList.filter((t) => (Number(t.qtyIn) || 0) > 0).reduce((sum, t) => sum + (Number(t.qtyIn) || 0), 0);
    const qtyOut = txList.filter((t) => (Number(t.qtyOut) || 0) > 0).reduce((sum, t) => sum + (Number(t.qtyOut) || 0), 0);

    // Current remaining layers
    const currentLayers = inventoryLots.filter((l) => {
      if (l.sku !== prod.sku) return false;
      if (selectedWarehouse !== 'all' && l.warehouseId && l.warehouseId !== selectedWarehouse) return false;
      return true;
    });

    const closingQty = currentLayers.reduce((sum, l) => {
      const rem = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0);
      return sum + (isNaN(rem) ? 0 : rem);
    }, 0);

    const closingValue = currentLayers.reduce((sum, l) => {
      const rem = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0);
      const price = Number(l.purchasePrice ?? l.costPrice ?? 0);
      const validRem = isNaN(rem) ? 0 : rem;
      const validPrice = isNaN(price) ? 0 : price;
      return sum + validRem * validPrice;
    }, 0);

    const unitCost = Number(prod.costPrice) || 0;
    const openingQty = Math.max(0, closingQty + qtyOut - qtyIn);
    const openingValue = openingQty * unitCost;

    const inValue = qtyIn * unitCost;
    const outValue = qtyOut * unitCost;

    return {
      sku: prod.sku,
      name: prod.name,
      unit: prod.unit,
      category: prod.category,
      openingQty,
      openingValue,
      qtyIn,
      inValue,
      qtyOut,
      outValue,
      closingQty,
      closingValue
    };
  });

  // Filter NXT
  const filteredNxt = nxtData.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.sku.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
    }
    return true;
  });

  // 2. FIFO Layers Report
  const filteredFifo = inventoryLots.filter((l) => {
    if (selectedWarehouse !== 'all' && l.warehouseId !== selectedWarehouse) return false;
    if (selectedBranch !== 'all' && l.branchId && l.branchId !== selectedBranch) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.sku.toLowerCase().includes(q) ||
        l.productName.toLowerCase().includes(q) ||
        (l.layerId || l.lotId || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // 3. Profitability Report by SKU
  const profitData = products.map((prod) => {
    // Total sold quantity & COGS from stock issues
    let soldQty = 0;
    let totalRevenue = 0;
    let totalCogs = 0;

    for (const issue of stockIssues) {
      if (selectedWarehouse !== 'all' && issue.warehouseId !== selectedWarehouse) continue;
      for (const item of issue.items) {
        if (item.sku === prod.sku) {
          const q = Number(item.quantity) || 0;
          const sp = Number(item.salePrice) || 0;
          const cp = Number(prod.costPrice) || 0;
          const fc = Number(item.fifoCost) || (q * cp);
          soldQty += q;
          totalRevenue += q * sp;
          totalCogs += fc;
        }
      }
    }

    const grossProfit = totalRevenue - totalCogs;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      sku: prod.sku,
      name: prod.name,
      unit: prod.unit,
      soldQty,
      totalRevenue,
      totalCogs,
      grossProfit,
      profitMargin
    };
  });

  const filteredProfit = profitData.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.sku.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
    }
    return true;
  });

  const handleExport = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = '';

    if (activeTab === 'nxt') {
      filename = `Bao_cao_NXT_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['SKU', 'Tên sản phẩm', 'ĐVT', 'Tồn đầu kỳ', 'Giá trị đầu kỳ', 'Nhập trong kỳ', 'Giá trị nhập', 'Xuất trong kỳ', 'Giá trị xuất', 'Tồn cuối kỳ', 'Giá trị cuối kỳ'];
      rows = filteredNxt.map((i) => [
        i.sku,
        `"${i.name.replace(/"/g, '""')}"`,
        i.unit,
        i.openingQty,
        i.openingValue,
        i.qtyIn,
        i.inValue,
        i.qtyOut,
        i.outValue,
        i.closingQty,
        i.closingValue
      ]);
    } else if (activeTab === 'fifo') {
      filename = `Bao_cao_So_FIFO_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Mã Lớp', 'SKU', 'Tên sản phẩm', 'Ngày nhập', 'Phiếu nhập', 'Kho', 'SL Nhập', 'Đã xuất', 'Tồn còn', 'Giá nhập', 'Giá trị còn lại'];
      rows = filteredFifo.map((l) => [
        l.layerId || l.lotId,
        l.sku,
        `"${l.productName.replace(/"/g, '""')}"`,
        l.receivedAt || l.intakeDate,
        l.receiptCode || l.poCode || '',
        `"${l.warehouseName || l.warehouse || ''}"`,
        l.quantityReceived || l.initialQuantity,
        l.quantityIssued,
        l.quantityRemaining,
        l.purchasePrice || l.costPrice,
        l.quantityRemaining * (l.purchasePrice || l.costPrice || 0)
      ]);
    } else {
      filename = `Bao_cao_Loi_nhuan_SKU_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['SKU', 'Tên sản phẩm', 'ĐVT', 'SL Bán', 'Doanh thu thuần', 'Giá vốn FIFO (COGS)', 'Lợi nhuận gộp', 'Tỷ suất LN (%)'];
      rows = filteredProfit.map((p) => [
        p.sku,
        `"${p.name.replace(/"/g, '""')}"`,
        p.unit,
        p.soldQty,
        p.totalRevenue,
        p.totalCogs,
        p.grossProfit,
        p.profitMargin.toFixed(2)
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Báo cáo kho
          </h1>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
        >
          <Download className="w-4 h-4" />
          Xuất Báo Cáo Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('nxt')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'nxt'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Báo cáo Nhập - Xuất - Tồn (NXT)
        </button>

        <button
          onClick={() => setActiveTab('fifo')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'fifo'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Sổ Chi Tiết Lớp FIFO (FIFO Ledger)
        </button>

        <button
          onClick={() => setActiveTab('profit')}
          className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'profit'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Báo Cáo Giá Vốn & Lợi Nhuận Gộp
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Mã SKU, Tên sản phẩm, Lớp FIFO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
            >
              <option value="all">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
            >
              <option value="all">Tất cả kho hàng</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: BÁO CÁO NHẬP - XUẤT - TỒN (NXT) */}
      {activeTab === 'nxt' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                  <th rowSpan={2} className="py-3 px-3 border-r border-slate-200">
                    Mã SKU & Sản phẩm
                  </th>
                  <th rowSpan={2} className="py-3 px-3 text-center border-r border-slate-200">
                    ĐVT
                  </th>
                  <th colSpan={2} className="py-2 px-3 text-center border-r border-slate-200 bg-slate-50">
                    Tồn Đầu Kỳ
                  </th>
                  <th colSpan={2} className="py-2 px-3 text-center border-r border-slate-200 bg-emerald-50/50">
                    Nhập Trong Kỳ
                  </th>
                  <th colSpan={2} className="py-2 px-3 text-center border-r border-slate-200 bg-blue-50/50">
                    Xuất Trong Kỳ
                  </th>
                  <th colSpan={2} className="py-2 px-3 text-center bg-indigo-50/50">
                    Tồn Cuối Kỳ
                  </th>
                </tr>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase">
                  <th className="py-1.5 px-3 text-right">SL</th>
                  <th className="py-1.5 px-3 text-right border-r border-slate-200">Giá trị</th>
                  <th className="py-1.5 px-3 text-right text-emerald-700">SL</th>
                  <th className="py-1.5 px-3 text-right border-r border-slate-200 text-emerald-700">
                    Giá trị
                  </th>
                  <th className="py-1.5 px-3 text-right text-blue-700">SL</th>
                  <th className="py-1.5 px-3 text-right border-r border-slate-200 text-blue-700">
                    Giá trị
                  </th>
                  <th className="py-1.5 px-3 text-right text-indigo-900 font-bold">SL</th>
                  <th className="py-1.5 px-3 text-right text-indigo-900 font-bold">Giá trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNxt.map((item) => (
                  <tr key={item.sku} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 border-r border-slate-100">
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.sku}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500 border-r border-slate-100">
                      {item.unit}
                    </td>

                    {/* Đầu kỳ */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {item.openingQty.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500 border-r border-slate-100">
                      {item.openingValue.toLocaleString('vi-VN')} đ
                    </td>

                    {/* Nhập */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      {item.qtyIn > 0 ? `+${item.qtyIn.toLocaleString('vi-VN')}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 border-r border-slate-100">
                      {item.inValue > 0 ? `${item.inValue.toLocaleString('vi-VN')} đ` : '-'}
                    </td>

                    {/* Xuất */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                      {item.qtyOut > 0 ? `-${item.qtyOut.toLocaleString('vi-VN')}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-700 border-r border-slate-100">
                      {item.outValue > 0 ? `${item.outValue.toLocaleString('vi-VN')} đ` : '-'}
                    </td>

                    {/* Cuối kỳ */}
                    <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-950 bg-indigo-50/20">
                      {item.closingQty.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-950 bg-indigo-50/20">
                      {item.closingValue.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SỔ CHI TIẾT LỚP FIFO */}
      {activeTab === 'fifo' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3.5">Mã Lớp (Layer ID)</th>
                  <th className="py-3 px-3.5">SKU & Sản phẩm</th>
                  <th className="py-3 px-3.5">Ngày nhập</th>
                  <th className="py-3 px-3.5">Chứng từ Nhập</th>
                  <th className="py-3 px-3.5">Kho lưu trữ</th>
                  <th className="py-3 px-3.5 text-right">SL Nhập</th>
                  <th className="py-3 px-3.5 text-right">Đã xuất</th>
                  <th className="py-3 px-3.5 text-right font-bold text-slate-900">Tồn còn</th>
                  <th className="py-3 px-3.5 text-right">Đơn giá vốn</th>
                  <th className="py-3 px-3.5 text-right">Giá trị còn lại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFifo.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3.5 font-mono font-bold text-indigo-700">
                      {l.layerId || l.lotId}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="font-bold text-slate-800">{l.productName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{l.sku}</div>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700">{l.receivedAt || l.intakeDate}</td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-500">
                      {l.receiptCode || l.poCode || 'Tồn đầu kỳ'}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600">{l.warehouseName || l.warehouse}</td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-slate-600">
                      {(l.quantityReceived || l.initialQuantity || 0).toLocaleString('vi-VN')} {l.unit}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-slate-500">
                      {(l.quantityIssued || 0).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-black font-mono text-emerald-700">
                      {(l.quantityRemaining ?? l.remainingQuantity ?? 0).toLocaleString('vi-VN')} {l.unit}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-slate-700">
                      {(l.purchasePrice || l.costPrice || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-indigo-900">
                      {((l.quantityRemaining ?? l.remainingQuantity ?? 0) * (l.purchasePrice || l.costPrice || 0)).toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BÁO CÁO GIÁ VỐN & LỢI NHUẬN GỘP THEO SKU */}
      {activeTab === 'profit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3.5">Mã SKU & Tên sản phẩm</th>
                  <th className="py-3 px-3.5 text-center">ĐVT</th>
                  <th className="py-3 px-3.5 text-right">SL Đã Bán</th>
                  <th className="py-3 px-3.5 text-right">Doanh Thu Thuần</th>
                  <th className="py-3 px-3.5 text-right">Giá Vốn FIFO (COGS)</th>
                  <th className="py-3 px-3.5 text-right">Lợi Nhuận Gộp</th>
                  <th className="py-3 px-3.5 text-right">Tỷ Suất LN Gộp (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProfit.map((p) => (
                  <tr key={p.sku} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3.5">
                      <div className="font-bold text-slate-800">{p.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.sku}</div>
                    </td>
                    <td className="py-2.5 px-3.5 text-center text-slate-500">{p.unit}</td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-800">
                      {p.soldQty.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-slate-900">
                      {p.totalRevenue.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-indigo-900">
                      {p.totalCogs.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-black text-emerald-700">
                      {p.grossProfit.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          p.profitMargin >= 30
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.profitMargin > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.profitMargin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
