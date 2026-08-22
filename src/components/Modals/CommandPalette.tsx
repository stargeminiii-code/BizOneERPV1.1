import React, { useState, useEffect } from 'react';
import { Search, FileText, Package, Users, ArrowRight, X, Sparkles, Calculator, BookOpen, BarChart3 } from 'lucide-react';
import { Customer, Order, Product, ViewMode } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  products: Product[];
  customers: Customer[];
  onSelectView: (view: ViewMode) => void;
  onSelectOrder: (order: Order) => void;
  onOpenCreateOrder: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  orders,
  products,
  customers,
  onSelectView,
  onSelectOrder,
  onOpenCreateOrder
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // handled in parent or toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredOrders = orders.filter(
    (o) =>
      o.code.toLowerCase().includes(query.toLowerCase()) ||
      o.customerName.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.code.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm đơn hàng (ORD...), sản phẩm (Thép, Tôn...), khách hàng hoặc chuyển màn hình..."
            className="flex-1 text-sm bg-transparent border-none focus:outline-none text-slate-900 placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-xs text-slate-400 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 text-xs">
          {/* Quick Actions */}
          {!query && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Chuyển nhanh màn hình
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                <button
                  onClick={() => { onSelectView('pos'); onClose(); }}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-left"
                >
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span>POS Thu Ngân Bán Hàng</span>
                </button>
                <button
                  onClick={() => { onSelectView('inventory'); onClose(); }}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-left"
                >
                  <Package className="w-4 h-4 text-purple-600" />
                  <span>Danh mục Sản phẩm & SKU</span>
                </button>
                <button
                  onClick={() => { onSelectView('pnl'); onClose(); }}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-left"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Báo Cáo Tài Chính P&L</span>
                </button>
                <button
                  onClick={() => { onSelectView('ai-assistant'); onClose(); }}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-emerald-50 text-emerald-800 font-semibold text-left"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>AI Assistant Copilot</span>
                </button>
              </div>
            </div>
          )}

          {/* Orders Match */}
          {filteredOrders.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Đơn hàng ({filteredOrders.length})</span>
              </div>
              <div className="space-y-1 mt-1">
                {filteredOrders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    onClick={() => {
                      onSelectOrder(order);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="font-bold text-slate-900">{order.code}</span>
                        <span className="text-slate-500 ml-2">({order.customerName})</span>
                      </div>
                    </div>
                    <div className="font-extrabold text-slate-900">
                      {order.totalAmount.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products Match */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Sản phẩm ({filteredProducts.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredProducts.slice(0, 4).map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      onSelectView('inventory');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-100 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-purple-600" />
                      <div>
                        <span className="font-bold text-slate-900">{product.name}</span>
                        <span className="text-slate-500 ml-2 font-mono text-[10px]">[{product.code}]</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{product.sellingPrice.toLocaleString('vi-VN')} đ</span>
                      <span className="text-slate-400 ml-1">/ {product.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Match */}
          {filteredCustomers.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Khách hàng ({filteredCustomers.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredCustomers.slice(0, 3).map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => {
                      onSelectView('crm');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-slate-600" />
                      <div>
                        <span className="font-bold text-slate-900">{cust.name}</span>
                        <span className="text-slate-500 ml-2">{cust.phone}</span>
                      </div>
                    </div>
                    <div className="text-slate-500">
                      Công nợ: <span className="font-bold text-amber-700">{cust.debt.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Dùng phím mũi tên để di chuyển, Enter để chọn</span>
          <button
            onClick={() => { onOpenCreateOrder(); onClose(); }}
            className="text-blue-600 font-bold hover:underline"
          >
            + Tạo đơn bán hàng ngay
          </button>
        </div>
      </div>
    </div>
  );
};
