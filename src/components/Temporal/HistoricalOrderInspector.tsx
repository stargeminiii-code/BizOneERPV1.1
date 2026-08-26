import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Lock,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Receipt,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { TransactionSnapshotService } from '../../services/transaction/transactionSnapshotService';
import { OrderTransactionSnapshot, Order } from '../../types';
import { formatNumberWithDots } from '../../data/administrativeData';

interface HistoricalOrderInspectorProps {
  orders?: Order[];
  tenantId?: string;
}

export const HistoricalOrderInspector: React.FC<HistoricalOrderInspectorProps> = ({
  orders = [],
  tenantId = 'TENANT-DEFAULT'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const allSnapshots = useMemo(() => {
    return TransactionSnapshotService.getAllSnapshots();
  }, []);

  const selectedSnapshot = useMemo(() => {
    if (!selectedOrderId) {
      return allSnapshots[0] || null;
    }
    return allSnapshots.find((s) => s.orderId === selectedOrderId) || null;
  }, [allSnapshots, selectedOrderId]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Thanh Tra & Kiểm Tra Tính Bất Biến Đơn Hàng (Order Snapshot Immutability)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Mỗi giao dịch chốt thành công được lưu giữ nguyên trạng (Snapshot): phiên bản giá, phiên bản công thức, giá vốn FIFO và lợi nhuận gộp tại thời điểm phát sinh.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-semibold">
          <Lock className="w-4 h-4 text-blue-600" />
          <span>Bảo mật Bất biến 100%</span>
        </div>
      </div>

      {/* Main Grid: Orders List & Snapshot Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Order Snapshot List */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Danh sách Bản Ghi Bất Biến ({allSnapshots.length})
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã đơn hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-1 max-h-[550px] overflow-y-auto">
            {allSnapshots
              .filter(
                (s) =>
                  !searchTerm ||
                  s.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  s.orderId.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((s) => {
                const isSelected = selectedSnapshot?.orderId === s.orderId;
                return (
                  <button
                    key={s.snapshotId}
                    onClick={() => setSelectedOrderId(s.orderId)}
                    className={`w-full text-left p-3 rounded-lg text-xs transition cursor-pointer flex flex-col gap-1 border ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{s.orderCode}</span>
                      <span className="font-mono font-bold text-blue-700">
                        {formatNumberWithDots(s.totalRevenue)} đ
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{s.transactionTimestamp.substring(0, 16).replace('T', ' ')}</span>
                      <span className="text-emerald-700 font-semibold">
                        Lãi gộp: {formatNumberWithDots(s.grossProfit)} đ
                      </span>
                    </div>
                  </button>
                );
              })}
            {allSnapshots.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-xs">
                Chưa có đơn hàng nào được tạo snapshot. Hãy thực hiện bán hàng trong menu F&B hoặc POS.
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Snapshot Deep Inspector */}
        <div className="lg:col-span-2 space-y-4">
          {selectedSnapshot ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-slate-900">
                      {selectedSnapshot.orderCode}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Lock className="w-3 h-3" />
                      <span>SNAPSHOT BẤT BIẾN</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Khởi tạo lúc: <strong className="font-mono text-slate-700">{selectedSnapshot.createdAt}</strong> • Snapshot ID: <strong className="font-mono text-slate-700">{selectedSnapshot.snapshotId}</strong>
                  </p>
                </div>
              </div>

              {/* Financial Metrics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono">
                <div>
                  <span className="text-slate-500 font-sans text-[11px]">Doanh thu ghi nhận:</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatNumberWithDots(selectedSnapshot.totalRevenue)} đ
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-sans text-[11px]">Giá vốn FIFO (COGS):</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatNumberWithDots(selectedSnapshot.totalActualCogs)} đ
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-sans text-[11px]">Lợi nhuận gộp:</span>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5">
                    {formatNumberWithDots(selectedSnapshot.grossProfit)} đ
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-sans text-[11px]">Tỷ suất LN gộp:</span>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5">
                    {selectedSnapshot.grossMarginPercent.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chi Tiết Mặt Hàng & Phiên Bản Đã Chốt
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                      <tr>
                        <th className="py-2 px-3">Sản phẩm / SKU</th>
                        <th className="py-2 px-3 text-right">SL</th>
                        <th className="py-2 px-3 text-right">Đơn giá đã chốt</th>
                        <th className="py-2 px-3">Phiên bản Giá</th>
                        <th className="py-2 px-3">Phiên bản Định mức</th>
                        <th className="py-2 px-3 text-right">Giá vốn Tiêu chuẩn</th>
                        <th className="py-2 px-3 text-right">Lãi Gộp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {selectedSnapshot.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-sans text-slate-800">
                            <div className="font-semibold">{item.productName}</div>
                            <div className="text-[11px] font-mono text-slate-500">{item.sku}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {formatNumberWithDots(item.unitPrice)} đ
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-600">
                            {item.resolvedPriceVersionId ? (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px] font-mono text-slate-700">
                                {item.resolvedPriceVersionId}
                              </span>
                            ) : (
                              'Giá quầy'
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-600">
                            {item.resolvedRecipeVersionId ? (
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px] font-mono font-semibold">
                                {item.resolvedRecipeVersionId}
                              </span>
                            ) : (
                              'Mặc định'
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700">
                            {formatNumberWithDots(item.expectedStandardCost)} đ
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                            {formatNumberWithDots(item.grossProfit)} đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p>Vui lòng chọn một bản ghi đơn hàng bên trái để kiểm tra Snapshot bất biến.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
