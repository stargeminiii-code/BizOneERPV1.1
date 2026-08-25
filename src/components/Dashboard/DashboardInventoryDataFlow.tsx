import React from 'react';
import { ArrowDown, Boxes, Building2, CircleDollarSign, ClipboardList, Layers3, Package, Warehouse } from 'lucide-react';

export type InventoryFlowNodeKey =
  | 'product-master'
  | 'sku'
  | 'warehouse'
  | 'ledger'
  | 'fifo'
  | 'stock'
  | 'cogs'
  | 'profit';

interface Props {
  onSelect?: (key: InventoryFlowNodeKey) => void;
}

const nodes: Array<{ key: InventoryFlowNodeKey; label: string; sub: string; icon: React.ReactNode }> = [
  { key: 'product-master', label: 'Product Master', sub: 'Danh mục gốc', icon: <Package className="w-4 h-4" /> },
  { key: 'sku', label: 'SKU', sub: 'Đơn vị quản trị', icon: <Boxes className="w-4 h-4" /> },
  { key: 'warehouse', label: 'Warehouse', sub: 'Theo kho', icon: <Warehouse className="w-4 h-4" /> },
  { key: 'ledger', label: 'Inventory Ledger', sub: 'Sổ giao dịch', icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'fifo', label: 'FIFO Layers', sub: 'Lớp giá vốn', icon: <Layers3 className="w-4 h-4" /> },
  { key: 'stock', label: 'Stock Balance', sub: 'Tồn hiện tại', icon: <Building2 className="w-4 h-4" /> },
  { key: 'cogs', label: 'COGS', sub: 'Giá vốn', icon: <CircleDollarSign className="w-4 h-4" /> },
  { key: 'profit', label: 'Gross Profit', sub: 'Lãi gộp', icon: <CircleDollarSign className="w-4 h-4" /> }
];

export const DashboardInventoryDataFlow: React.FC<Props> = ({ onSelect }) => (
  <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-4">
    <div className="flex items-center justify-between gap-3 mb-3">
      <div>
        <div className="text-[10px] font-black uppercase tracking-wider text-blue-600">Inventory → Profit</div>
        <h3 className="text-sm sm:text-base font-black text-slate-900">Luồng dữ liệu tồn kho & giá vốn</h3>
      </div>
      <span className="hidden sm:inline-flex text-[10px] font-bold text-slate-400">Click node để xem Summary</span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {nodes.map((node, index) => (
        <React.Fragment key={node.key}>
          <button
            type="button"
            onClick={() => onSelect?.(node.key)}
            className="text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0">{node.icon}</span>
              <span className="min-w-0">
                <span className="block text-xs font-black text-slate-800 truncate">{node.label}</span>
                <span className="block text-[10px] text-slate-500">{node.sub}</span>
              </span>
            </div>
          </button>
          {index < nodes.length - 1 && index % 4 !== 3 && (
            <ArrowDown className="hidden sm:block lg:hidden w-4 h-4 text-slate-300 self-center justify-self-center" />
          )}
        </React.Fragment>
      ))}
    </div>
  </section>
);
