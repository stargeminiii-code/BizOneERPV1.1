import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Package,
  Calendar,
  DollarSign,
  User,
  Layers,
  Receipt,
  Eye,
  X
} from 'lucide-react';
import {
  Order,
  SalesReturn,
  SalesRefundItem,
  InventoryLayer,
  StockTransaction,
  CashTransaction,
  PaymentMethod
} from '../../types';
import { SalesTransactionEngine } from '../../services/sales/salesTransactionEngine';
import { useLanguage } from '../../i18n';

interface SalesReturnsViewProps {
  orders: Order[];
  returns: SalesReturn[];
  inventoryLots: InventoryLayer[];
  onProcessReturn: (
    salesReturn: SalesReturn,
    updatedOrder: Order,
    updatedLayers: InventoryLayer[],
    transactions: StockTransaction[],
    cashTx?: CashTransaction
  ) => void;
  actorName?: string;
}

export const SalesReturnsView: React.FC<SalesReturnsViewProps> = ({
  orders = [],
  returns = [],
  inventoryLots = [],
  onProcessReturn,
  actorName = 'Quản trị viên'
}) => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReturnDetail, setSelectedReturnDetail] = useState<SalesReturn | null>(null);

  // Return Creation Modal State
  const [selectedOrderCode, setSelectedOrderCode] = useState('');
  const [returnReason, setReturnReason] = useState('Khách đổi ý / Không ưng ý');
  const [refundPaymentMethod, setRefundPaymentMethod] = useState<PaymentMethod>('cash');
  const [returnItemsState, setReturnItemsState] = useState<
    Array<{
      sku: string;
      productName: string;
      unit: string;
      maxQuantity: number;
      quantity: number;
      unitPrice: number;
      restockToInventory: boolean;
      selected: boolean;
    }>
  >([]);

  // Find order when selected
  const activeOrder = useMemo(() => {
    return orders.find((o) => o.code === selectedOrderCode || o.id === selectedOrderCode);
  }, [orders, selectedOrderCode]);

  // When order is selected in modal, load its items
  const handleSelectOrder = (orderCode: string) => {
    setSelectedOrderCode(orderCode);
    const ord = orders.find((o) => o.code === orderCode || o.id === orderCode);
    if (ord) {
      setReturnItemsState(
        ord.items.map((item) => ({
          sku: item.sku,
          productName: item.productName,
          unit: item.unit || 'Cái',
          maxQuantity: item.quantity,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          restockToInventory: true,
          selected: true
        }))
      );
    } else {
      setReturnItemsState([]);
    }
  };

  // Filtered Returns List
  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      const matchSearch =
        r.returnCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'all' || r.refundStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [returns, searchTerm, statusFilter]);

  // Metrics
  const totalRefundAmount = useMemo(() => {
    return returns.reduce((sum, r) => sum + r.refundAmount, 0);
  }, [returns]);

  const totalCompletedReturns = useMemo(() => {
    return returns.filter((r) => r.refundStatus === 'completed').length;
  }, [returns]);

  // Modal Total Calculation
  const modalCalculatedRefundTotal = useMemo(() => {
    return returnItemsState
      .filter((i) => i.selected)
      .reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  }, [returnItemsState]);

  // Submit return
  const handleSubmitReturn = () => {
    if (!activeOrder) {
      alert(language === 'vi' ? 'Vui lòng chọn đơn hàng cần trả' : 'Please select an order');
      return;
    }

    const itemsToRefund = returnItemsState
      .filter((i) => i.selected && i.quantity > 0)
      .map((i) => ({
        sku: i.sku,
        productName: i.productName,
        unit: i.unit,
        quantity: i.quantity,
        refundUnitPrice: i.unitPrice,
        restockToInventory: i.restockToInventory,
        reason: returnReason
      }));

    if (itemsToRefund.length === 0) {
      alert(language === 'vi' ? 'Vui lòng chọn ít nhất 1 sản phẩm để trả hàng' : 'Please select at least 1 item');
      return;
    }

    const res = SalesTransactionEngine.processSalesReturn({
      order: activeOrder,
      itemsToRefund,
      paymentMethod: refundPaymentMethod,
      reason: returnReason,
      actor: actorName,
      existingLayers: inventoryLots
    });

    if (!res.success || !res.salesReturn) {
      alert(res.errorMessage || 'Lỗi xử lý phiếu trả hàng');
      return;
    }

    onProcessReturn(
      res.salesReturn,
      res.updatedOrder,
      res.updatedLayers,
      res.generatedStockTransactions,
      res.cashTransaction
    );

    setIsCreateModalOpen(false);
    setSelectedOrderCode('');
    setReturnItemsState([]);
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div id="sales-returns-container" className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {language === 'vi' ? 'Trả hàng & Hoàn tiền' : 'Sales Returns & Refunds'}
          </h1>
        </div>

        <button
          id="btn-create-sales-return"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'vi' ? 'Tạo phiếu trả hàng' : 'Create Return'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">
            {language === 'vi' ? 'Tổng tiền hoàn trả' : 'Total Refunded'}
          </p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">
            {formatVND(totalRefundAmount)}
          </h3>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">
            {language === 'vi' ? 'Tổng số phiếu trả' : 'Total Return Slips'}
          </p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">
            {returns.length}
          </h3>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">
            {language === 'vi' ? 'Đã hoàn tất nhập kho & chi tiền' : 'Fully Processed'}
          </p>
          <h3 className="text-xl font-extrabold text-blue-600 mt-1">
            {totalCompletedReturns}
          </h3>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              language === 'vi'
                ? 'Tìm mã phiếu, mã đơn, khách hàng...'
                : 'Search slip, order, customer...'
            }
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">{language === 'vi' ? 'Tất cả trạng thái' : 'All Status'}</option>
            <option value="completed">{language === 'vi' ? 'Đã hoàn thành' : 'Completed'}</option>
            <option value="processing">{language === 'vi' ? 'Đang xử lý' : 'Processing'}</option>
          </select>
        </div>
      </div>

      {/* Table of Returns */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">{language === 'vi' ? 'Mã phiếu trả' : 'Return Slip'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Đơn hàng gốc' : 'Original Order'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Khách hàng' : 'Customer'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Lý do' : 'Reason'}</th>
                <th className="py-3 px-4 text-right">{language === 'vi' ? 'Tiền hoàn' : 'Refund Total'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th className="py-3 px-4">{language === 'vi' ? 'Thời gian' : 'Date'}</th>
                <th className="py-3 px-4 text-right">{language === 'vi' ? 'Chi tiết' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold">
                      {language === 'vi' ? 'Chưa có phiếu trả hàng nào' : 'No sales returns found'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {ret.returnCode}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 font-semibold">
                      {ret.orderCode}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold">{ret.customerName}</span>
                      {ret.customerPhone && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {ret.customerPhone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {ret.reason}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      {formatVND(ret.refundAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {language === 'vi' ? 'Hoàn tất' : 'Completed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(ret.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReturnDetail(ret)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title={language === 'vi' ? 'Xem chi tiết' : 'View details'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Sales Return Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {language === 'vi' ? 'Tạo Phiếu Trả Hàng & Hoàn Tiền' : 'Create Sales Return & Refund'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'vi'
                    ? 'Chọn đơn hàng gốc, sản phẩm trả và tùy chọn nhập lại kho FIFO'
                    : 'Select original order, items to return, and FIFO restock options'}
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Select Order */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'vi' ? 'Chọn đơn hàng gốc *' : 'Select Original Order *'}
                </label>
                <select
                  value={selectedOrderCode}
                  onChange={(e) => handleSelectOrder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">
                    {language === 'vi' ? '-- Chọn đơn hàng --' : '-- Select an Order --'}
                  </option>
                  {orders
                    .filter((o) => o.status !== 'cancelled')
                    .map((o) => (
                      <option key={o.id} value={o.code}>
                        {o.code} - {o.customerName} ({formatVND(o.totalAmount)}) - {new Date(o.createdAt || '').toLocaleDateString('vi-VN')}
                      </option>
                    ))}
                </select>
              </div>

              {/* Return Items Selection */}
              {activeOrder && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {language === 'vi' ? 'Danh sách sản phẩm hoàn trả' : 'Items to Refund'}
                  </h4>

                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {returnItemsState.map((item, idx) => (
                      <div key={item.sku} className="p-3 bg-slate-50/50 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => {
                              const updated = [...returnItemsState];
                              updated[idx].selected = e.target.checked;
                              setReturnItemsState(updated);
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{item.productName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              SKU: {item.sku} • Đơn giá: {formatVND(item.unitPrice)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Quantity */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500">
                              {language === 'vi' ? 'SL trả:' : 'Qty:'}
                            </span>
                            <input
                              type="number"
                              min="1"
                              max={item.maxQuantity}
                              value={item.quantity}
                              disabled={!item.selected}
                              onChange={(e) => {
                                const val = Math.min(
                                  item.maxQuantity,
                                  Math.max(1, parseInt(e.target.value) || 1)
                                );
                                const updated = [...returnItemsState];
                                updated[idx].quantity = val;
                                setReturnItemsState(updated);
                              }}
                              className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                            />
                            <span className="text-[10px] text-slate-400">/{item.maxQuantity} {item.unit}</span>
                          </div>

                          {/* Restock Toggle */}
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.restockToInventory}
                              disabled={!item.selected}
                              onChange={(e) => {
                                const updated = [...returnItemsState];
                                updated[idx].restockToInventory = e.target.checked;
                                setReturnItemsState(updated);
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span>{language === 'vi' ? 'Nhập lại kho' : 'Restock'}</span>
                          </label>

                          {/* Subtotal */}
                          <span className="font-extrabold text-slate-900 min-w-[70px] text-right">
                            {formatVND(item.quantity * item.unitPrice)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'vi' ? 'Lý do trả hàng' : 'Reason'}
                  </label>
                  <input
                    type="text"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder={language === 'vi' ? 'Nhập lý do...' : 'Enter reason...'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'vi' ? 'Phương thức hoàn tiền' : 'Refund Method'}
                  </label>
                  <select
                    value={refundPaymentMethod}
                    onChange={(e) => setRefundPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="cash">{language === 'vi' ? 'Tiền mặt' : 'Cash'}</option>
                    <option value="bank_transfer">{language === 'vi' ? 'Chuyển khoản' : 'Bank Transfer'}</option>
                    <option value="vietqr">VietQR</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">
                  {language === 'vi' ? 'Tổng tiền hoàn trả:' : 'Total Refund:'}
                </span>
                <span className="text-base font-black text-blue-600 ml-2">
                  {formatVND(modalCalculatedRefundTotal)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  onClick={handleSubmitReturn}
                  disabled={!activeOrder || modalCalculatedRefundTotal === 0}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
                    activeOrder && modalCalculatedRefundTotal > 0
                      ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {language === 'vi' ? 'Xác nhận hoàn tiền' : 'Confirm Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Detail Modal */}
      {selectedReturnDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {language === 'vi' ? 'Chi Tiết Phiếu Trả Hàng' : 'Sales Return Details'}
                </h3>
                <p className="text-xs font-mono text-blue-600 font-bold">
                  {selectedReturnDetail.returnCode}
                </p>
              </div>
              <button
                onClick={() => setSelectedReturnDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block">{language === 'vi' ? 'Đơn hàng gốc' : 'Order'}:</span>
                  <span className="font-bold text-slate-800">{selectedReturnDetail.orderCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{language === 'vi' ? 'Khách hàng' : 'Customer'}:</span>
                  <span className="font-bold text-slate-800">{selectedReturnDetail.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{language === 'vi' ? 'Người lập' : 'Created By'}:</span>
                  <span className="font-bold text-slate-800">{selectedReturnDetail.creator}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{language === 'vi' ? 'Hình thức hoàn' : 'Payment'}:</span>
                  <span className="font-bold text-slate-800 uppercase">{selectedReturnDetail.paymentMethod}</span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 mb-2">
                  {language === 'vi' ? 'Sản phẩm hoàn trả' : 'Items'}
                </h5>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {selectedReturnDetail.items.map((i) => (
                    <div key={i.sku} className="p-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{i.productName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {i.quantity} {i.unit} × {formatVND(i.refundUnitPrice)}
                          {i.restockToInventory && ' • Đã nhập lại kho'}
                        </p>
                      </div>
                      <span className="font-extrabold text-slate-900">
                        {formatVND(i.totalRefund)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-700">
                  {language === 'vi' ? 'Tổng tiền hoàn:' : 'Total Refund:'}
                </span>
                <span className="text-base font-black text-blue-600">
                  {formatVND(selectedReturnDetail.refundAmount)}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedReturnDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
