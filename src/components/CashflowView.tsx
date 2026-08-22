import React, { useState } from 'react';
import {
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  QrCode,
  DollarSign,
  Wallet,
  Calendar,
  Filter
} from 'lucide-react';
import { CashTransaction, PaymentMethod } from '../types';

interface CashflowViewProps {
  transactions: CashTransaction[];
  onAddTransaction: (tx: CashTransaction) => void;
}

export const CashflowView: React.FC<CashflowViewProps> = ({
  transactions = [],
  onAddTransaction
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'thu' | 'chi'>('all');

  const [formType, setFormType] = useState<'thu' | 'chi'>('thu');
  const [formCategory, setFormCategory] = useState('Thu tiền bán hàng');
  const [formAmount, setFormAmount] = useState(5000000);
  const [formDescription, setFormDescription] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('vietqr');
  const [formPayerOrPayee, setFormPayerOrPayee] = useState('');

  const filtered = transactions.filter((t) => typeFilter === 'all' || t.type === typeFilter);

  const totalInflow = transactions
    .filter((t) => t.type === 'thu')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOutflow = transactions
    .filter((t) => t.type === 'chi')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalInflow - totalOutflow;

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: CashTransaction = {
      id: `tx-${Date.now()}`,
      code: `${formType === 'thu' ? 'PT' : 'PC'}-2023-0${Math.floor(100 + Math.random() * 900)}`,
      type: formType,
      category: formCategory,
      amount: formAmount,
      description: formDescription,
      paymentMethod: formPaymentMethod,
      payerOrPayee: formPayerOrPayee || 'Khách hàng vãng lai',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    onAddTransaction(newTx);
    setShowAddModal(false);
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Quỹ & Dòng tiền
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Lập phiếu Thu / Chi</span>
        </button>
      </div>

      {/* Cashflow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider">
              TỔNG TIỀN THU (INFLOW)
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {formatVND(totalInflow)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Từ bán hàng & thu nợ</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold text-rose-500 uppercase tracking-wider">
              TỔNG TIỀN CHI (OUTFLOW)
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {formatVND(totalOutflow)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Thanh toán NCC, vận tải, lương</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
              TỒN QUỸ RÒNG (NET CASH)
            </span>
            <div className="text-2xl font-extrabold text-blue-700 mt-2">
              {formatVND(netBalance)}
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Dòng tiền dương an toàn</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            typeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          Tất cả giao dịch
        </button>
        <button
          onClick={() => setTypeFilter('thu')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            typeFilter === 'thu' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          Phiếu Thu (+)
        </button>
        <button
          onClick={() => setTypeFilter('chi')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            typeFilter === 'chi' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          Phiếu Chi (-)
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">MÃ CHỨNG TỪ</th>
                <th className="py-3.5 px-5">THỜI GIAN</th>
                <th className="py-3.5 px-5">HẠNG MỤC</th>
                <th className="py-3.5 px-5">ĐỐI TÁC / NGƯỜI NỘP</th>
                <th className="py-3.5 px-5">PHƯƠNG THỨC</th>
                <th className="py-3.5 px-5 text-right">SỐ TIỀN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-mono font-bold text-slate-900">
                    {tx.code}
                  </td>
                  <td className="py-4 px-5 text-slate-500 font-medium">{tx.createdAt}</td>
                  <td className="py-4 px-5 font-bold text-slate-800">
                    <div>{tx.category}</div>
                    <div className="text-[11px] font-normal text-slate-400">{tx.description}</div>
                  </td>
                  <td className="py-4 px-5 text-slate-700 font-medium">{tx.payerOrPayee}</td>
                  <td className="py-4 px-5">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">
                      {tx.paymentMethod === 'vietqr' ? 'VietQR' : tx.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : 'Tiền mặt'}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right font-extrabold text-sm">
                    <span className={tx.type === 'thu' ? 'text-emerald-600' : 'text-rose-600'}>
                      {tx.type === 'thu' ? '+' : '-'} {formatVND(tx.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Transaction */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Lập Phiếu Thu / Chi Tiền</h3>
            <form onSubmit={handleCreateTx} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Loại chứng từ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('thu')}
                    className={`py-2 rounded-xl font-bold ${
                      formType === 'thu' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Phiếu Thu (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('chi')}
                    className={`py-2 rounded-xl font-bold ${
                      formType === 'chi' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Phiếu Chi (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số tiền (VNĐ)</label>
                <input
                  type="number"
                  step="50000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-bold p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Đối tác / Người nộp hoặc nhận</label>
                <input
                  type="text"
                  value={formPayerOrPayee}
                  onChange={(e) => setFormPayerOrPayee(e.target.value)}
                  placeholder="Tên công ty hoặc cá nhân"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hạng mục</label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả chi tiết</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ghi rõ lý do thu/chi..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  Lưu phiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
