import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Tag,
  History,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { PriceVersionService } from '../../services/pricing/priceVersionService';
import { TemporalBusinessEngine } from '../../services/temporal/temporalService';
import { SellingPriceVersion, SalesChannel } from '../../types';
import { formatNumberWithDots } from '../../data/administrativeData';

interface TemporalPriceManagerProps {
  tenantId?: string;
  actorName?: string;
  onPriceUpdated?: () => void;
}

export const TemporalPriceManager: React.FC<TemporalPriceManagerProps> = ({
  tenantId = 'TENANT-DEFAULT',
  actorName = 'Quản trị viên'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<SalesChannel | 'ALL'>('ALL');
  const [simulatedDate, setSimulatedDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [selectedSkuForTimeline, setSelectedSkuForTimeline] = useState<string>('DU-CF-SUA');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Version Form State
  const [newSku, setNewSku] = useState('DU-CF-SUA');
  const [newProductName, setNewProductName] = useState('Cà phê sữa Sài Gòn');
  const [newPrice, setNewPrice] = useState<number>(45000);
  const [newEffectiveFrom, setNewEffectiveFrom] = useState(
    new Date().toISOString().substring(0, 10) + 'T00:00:00Z'
  );
  const [newChannel, setNewChannel] = useState<SalesChannel | 'ALL'>('ALL');
  const [newPriceListId, setNewPriceListId] = useState('DEFAULT');
  const [newNote, setNewNote] = useState('');

  // Force re-render key
  const [refreshKey, setRefreshKey] = useState(0);

  // Get all price versions
  const allPriceVersions = useMemo(() => {
    return PriceVersionService.getAllPriceVersions(tenantId);
  }, [tenantId, refreshKey]);

  // Distinct SKUs
  const uniqueSkus = useMemo(() => {
    const map = new Map<string, { sku: string; name: string }>();
    allPriceVersions.forEach((v) => {
      if (!map.has(v.sku)) {
        map.set(v.sku, { sku: v.sku, name: v.productName || v.sku });
      }
    });
    return Array.from(map.values());
  }, [allPriceVersions]);

  // Filtered versions
  const filteredVersions = useMemo(() => {
    return allPriceVersions.filter((v) => {
      const matchSearch =
        !searchTerm ||
        v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.productName && v.productName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchChannel = selectedChannel === 'ALL' || v.channel === selectedChannel;
      return matchSearch && matchChannel;
    });
  }, [allPriceVersions, searchTerm, selectedChannel]);

  // Timeline for selected SKU
  const skuTimeline = useMemo(() => {
    if (!selectedSkuForTimeline) return [];
    return PriceVersionService.getPriceHistory(tenantId, selectedSkuForTimeline);
  }, [tenantId, selectedSkuForTimeline, refreshKey]);

  // Resolve Price at Simulated Date
  const resolvedPriceResult = useMemo(() => {
    if (!selectedSkuForTimeline || !simulatedDate) return null;
    return TemporalBusinessEngine.resolveSellingPrice(
      tenantId,
      selectedSkuForTimeline,
      simulatedDate,
      selectedChannel
    );
  }, [tenantId, selectedSkuForTimeline, simulatedDate, selectedChannel, refreshKey]);

  const handleCreateVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku || newPrice <= 0) {
      alert('Vui lòng nhập SKU và giá bán hợp lệ (> 0)');
      return;
    }

    const res = PriceVersionService.createPriceVersion(
      {
        tenantId,
        productId: `PROD-${newSku}`,
        sku: newSku,
        productName: newProductName,
        price: newPrice,
        currency: 'VND',
        effectiveFrom: newEffectiveFrom,
        effectiveTo: null,
        channel: newChannel,
        priceListId: newPriceListId,
        note: newNote
      },
      actorName
    );

    if (!res.success) {
      alert(`Lỗi thiết lập phiên bản giá: ${res.errorMessage}`);
      return;
    }

    setIsCreateModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <span>Quản lý Phiên bản Giá Bán theo Thời Gian (Effective Dating)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Nguyên lý bất biến: Khi thay đổi giá bán hôm nay, lịch sử giao dịch và doanh thu quá khứ vẫn giữ nguyên 100%.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Phiên Bản Giá Mới</span>
            </button>
          </div>
        </div>

        {/* Temporal Simulator Tool */}
        <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Giả lập Truy vấn Giá theo Ngày (Point-in-Time Simulator):
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-slate-600 font-medium">Chọn SKU:</label>
                <select
                  value={selectedSkuForTimeline}
                  onChange={(e) => setSelectedSkuForTimeline(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                >
                  {uniqueSkus.map((u) => (
                    <option key={u.sku} value={u.sku}>
                      {u.sku} - {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-xs text-slate-600 font-medium">Thời điểm:</label>
                <input
                  type="date"
                  value={simulatedDate}
                  onChange={(e) => setSimulatedDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {resolvedPriceResult?.version ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Giá hiệu lực: <strong>{formatNumberWithDots(resolvedPriceResult.version.price)} đ</strong> (Ver {resolvedPriceResult.version.version})
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Không tìm thấy giá hiệu lực cho ngày này</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Price Versions Table & Selected SKU History Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Master Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Danh sách Tất cả Phiên bản Giá ({filteredVersions.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm SKU, tên sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              >
                <option value="ALL">Kênh: Tất cả</option>
                <option value="POS">POS Trực tiếp</option>
                <option value="Shopee">ShopeeFood</option>
                <option value="Grab">GrabFood</option>
                <option value="B2B">B2B Sỉ</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Mã SKU</th>
                  <th className="py-2.5 px-3">Sản phẩm</th>
                  <th className="py-2.5 px-3">Phiên bản</th>
                  <th className="py-2.5 px-3 text-right">Giá Bán</th>
                  <th className="py-2.5 px-3">Kênh / Bảng giá</th>
                  <th className="py-2.5 px-3">Hiệu lực Từ</th>
                  <th className="py-2.5 px-3">Hiệu lực Đến</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredVersions.map((v) => {
                  const isSelected = selectedSkuForTimeline === v.sku;
                  return (
                    <tr
                      key={v.versionId}
                      onClick={() => setSelectedSkuForTimeline(v.sku)}
                      className={`hover:bg-slate-50 cursor-pointer transition ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{v.sku}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-800">{v.productName || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-sans">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-700">
                          v{v.version}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatNumberWithDots(v.price)} đ
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">
                        {v.channel || 'ALL'} / {v.priceListId || 'DEFAULT'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {v.effectiveFrom.substring(0, 10)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {v.effectiveTo ? v.effectiveTo.substring(0, 10) : 'Hiện tại (Vô hạn)'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                            v.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Selected SKU Temporal Timeline */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                Lịch sử Biến động Giá
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                {selectedSkuForTimeline}
              </h4>
            </div>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold text-slate-700">
              {skuTimeline.length} Phiên bản
            </span>
          </div>

          <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {skuTimeline.map((ver, idx) => {
              const isCurrent = ver.status === 'ACTIVE';
              return (
                <div key={ver.versionId} className="relative pl-8 text-xs">
                  <div
                    className={`absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                      isCurrent ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'
                    }`}
                  />
                  <div
                    className={`p-3 rounded-lg border ${
                      isCurrent
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Phiên bản {ver.version} ({ver.channel || 'ALL'})
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatNumberWithDots(ver.price)} đ
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                      <span>{ver.effectiveFrom.substring(0, 10)}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span>{ver.effectiveTo ? ver.effectiveTo.substring(0, 10) : 'Hiện tại'}</span>
                    </div>
                    {ver.note && (
                      <p className="mt-1 text-[11px] text-slate-600 font-sans italic">
                        "{ver.note}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Create Price Version */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tạo Phiên Bản Giá Bán Mới</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVersion} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã SKU Sản phẩm</label>
                <input
                  type="text"
                  required
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Sản phẩm</label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giá Bán Mới (VND)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kênh Áp dụng</label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="ALL">Tất cả kênh (ALL)</option>
                    <option value="POS">POS Tại quầy</option>
                    <option value="Shopee">ShopeeFood</option>
                    <option value="Grab">GrabFood</option>
                    <option value="B2B">B2B Phân phối</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ngày Hiệu lực Từ (Effective From)</label>
                <input
                  type="datetime-local"
                  required
                  value={newEffectiveFrom.substring(0, 16)}
                  onChange={(e) => setNewEffectiveFrom(e.target.value + ':00Z')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  * Phiên bản giá hiện tại sẽ tự động được kết thúc (effectiveTo = ngày này) mà không gây chồng lấn.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú / Lý do điều chỉnh</label>
                <input
                  type="text"
                  placeholder="VD: Tăng giá theo mùa vụ hoặc bảng giá khuyến mãi"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  Xác nhận Tạo Phiên bản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
