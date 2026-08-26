import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Package,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { PreparationBatchService } from '../../services/fnb/preparationBatchService';
import { RecipeVersionService } from '../../services/recipe/recipeVersionService';
import { PreparationBatch } from '../../types';
import { formatNumberWithDots } from '../../data/administrativeData';

interface PreparationBatchManagerProps {
  tenantId?: string;
  warehouseId?: string;
  actorName?: string;
}

export const PreparationBatchManager: React.FC<PreparationBatchManagerProps> = ({
  tenantId = 'TENANT-DEFAULT',
  warehouseId = 'WH01',
  actorName = 'Lê Hoàng Nam (Bếp trưởng)'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // New Batch Form State
  const [outputSku, setOutputSku] = useState('BTP-CF-COT');
  const [outputProductName, setOutputProductName] = useState('Cốt cà phê phin đậm đặc');
  const [plannedQty, setPlannedQty] = useState(800);
  const [actualQty, setActualQty] = useState(800);
  const [outputUnit, setOutputUnit] = useState('ml');
  const [operator, setOperator] = useState(actorName);
  const [notes, setNotes] = useState('Sơ chế phục vụ ca sáng');

  const batches = useMemo(() => {
    return PreparationBatchService.getAllBatches(tenantId);
  }, [tenantId, refreshKey]);

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchSearch =
        !searchTerm ||
        b.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.outputProductName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.outputSku.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [batches, searchTerm]);

  const handleExecuteBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outputSku || actualQty <= 0) {
      alert('Vui lòng điền đầy đủ thông tin mẻ sơ chế');
      return;
    }

    const res = PreparationBatchService.executePreparationBatch(
      {
        tenantId,
        branchId: 'BR01',
        branchName: 'Chi nhánh Chính - Hà Nội',
        warehouseId,
        warehouseName: 'Kho Tổng Hà Nội',
        outputSku,
        outputProductName,
        plannedOutputQty: plannedQty,
        actualOutputQty: actualQty,
        outputUnit,
        operator,
        notes
      },
      actorName
    );

    if (!res.success) {
      alert(`Lỗi thực hiện mẻ sơ chế: ${res.errorMessage}`);
      return;
    }

    alert(`Đã hoàn thành mẻ sơ chế ${res.batch?.code}! Đã xuất nguyên liệu và tạo lô kho bán thành phẩm.`);
    setIsCreateModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-purple-600" />
            <span>Quản lý Mẻ Sơ Chế Bán Thành Phẩm (Preparation / Semi-Finished Batches)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tự động xuất nguyên liệu thô theo FIFO, tính toán chính xác tổng chi phí mẻ và tạo Lô kho Bán thành phẩm với đơn giá thực tế.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thực Hiện Mẻ Sơ Chế Mới</span>
        </button>
      </div>

      {/* Batches Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Lịch sử Các Mẻ Sơ Chế ({filteredBatches.length})
            </span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã mẻ, bán thành phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
              <tr>
                <th className="py-2.5 px-3">Mã Mẻ</th>
                <th className="py-2.5 px-3">Bán Thành Phẩm Hoàn Thành</th>
                <th className="py-2.5 px-3 text-right">Kế hoạch</th>
                <th className="py-2.5 px-3 text-right">Thực tế</th>
                <th className="py-2.5 px-3 text-right">Tổng Chi Phí Mẻ</th>
                <th className="py-2.5 px-3 text-right">Giá vốn Đơn vị (FIFO)</th>
                <th className="py-2.5 px-3">Người Thực Hiện</th>
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredBatches.map((b) => (
                <tr key={b.batchId} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{b.batchCode}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-800">
                    <div className="font-semibold">{b.outputProductName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{b.outputSku}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600">
                    {b.plannedOutputQty} {b.outputUnit}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {b.actualOutputQty} {b.outputUnit}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {formatNumberWithDots(b.totalBatchCost)} đ
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-purple-700">
                    {formatNumberWithDots(b.unitBatchCost)} đ / {b.outputUnit}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-700">{b.operator}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                    {b.producedAt.substring(0, 16).replace('T', ' ')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Execute Preparation Batch */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Thực Hiện Mẻ Sơ Chế Bán Thành Phẩm</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteBatch} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã SKU Bán thành phẩm</label>
                  <input
                    type="text"
                    required
                    value={outputSku}
                    onChange={(e) => setOutputSku(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên Bán thành phẩm</label>
                  <input
                    type="text"
                    required
                    value={outputProductName}
                    onChange={(e) => setOutputProductName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SL Kế hoạch</label>
                  <input
                    type="number"
                    min="1"
                    value={plannedQty}
                    onChange={(e) => setPlannedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SL Thực tế Hoàn thành</label>
                  <input
                    type="number"
                    min="1"
                    value={actualQty}
                    onChange={(e) => setActualQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    value={outputUnit}
                    onChange={(e) => setOutputUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Người phụ trách sơ chế</label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú mẻ</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-[11px] text-purple-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Quy trình tự động FIFO & Kho:</span>
                </div>
                <p>
                  1. Hệ thống tự động tra cứu công thức sơ chế của SKU <strong>{outputSku}</strong>.
                </p>
                <p>
                  2. Xuất trừ các lớp nguyên liệu thô theo FIFO và tính tổng giá trị xuất kho.
                </p>
                <p>
                  3. Tạo Lô kho mới cho <strong>{actualQty} {outputUnit}</strong> {outputProductName} với đơn giá = Tổng chi phí / {actualQty}.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Xác nhận Sản Xuất Mẻ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
