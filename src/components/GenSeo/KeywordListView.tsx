import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Calendar,
  Sparkles,
  Edit,
  Trash2,
  Archive,
  ExternalLink,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Download,
  Info
} from 'lucide-react';
import { KeywordNode, KeywordNodeType, GenSeoArticle } from '../../types';

interface KeywordListViewProps {
  keywords: KeywordNode[];
  articles: GenSeoArticle[];
  onSaveKeyword: (kw: KeywordNode) => void;
  onDeleteKeyword: (id: string) => void;
  onOpenCreateArticle: (kw: KeywordNode) => void;
}

export const KeywordListView: React.FC<KeywordListViewProps> = ({
  keywords,
  articles,
  onSaveKeyword,
  onDeleteKeyword,
  onOpenCreateArticle
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [hoveredTooltipId, setHoveredTooltipId] = useState<string | null>(null);

  // Modal create/edit keyword
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Partial<KeywordNode>>({});

  const filteredKeywords = keywords.filter((kw) => {
    const matchSearch =
      kw.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (kw.suggestedArticleTitle && kw.suggestedArticleTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = selectedTypeFilter === 'ALL' || kw.type === selectedTypeFilter;
    const matchStatus = selectedStatusFilter === 'ALL' || kw.status === selectedStatusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const handleOpenAdd = () => {
    setEditingKeyword({
      id: `kw-${Date.now()}`,
      label: '',
      type: 'cluster',
      searchVolume: 5000,
      difficulty: 35,
      cpc: 4500,
      intent: 'transactional',
      dateCreated: new Date().toISOString().slice(0, 10),
      daysAgo: 0,
      lastUpdated: new Date().toISOString().slice(0, 10),
      status: 'planned'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (kw: KeywordNode) => {
    setEditingKeyword({ ...kw });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKeyword.label) return;

    const saved: KeywordNode = {
      id: editingKeyword.id || `kw-${Date.now()}`,
      label: editingKeyword.label,
      type: editingKeyword.type || 'article',
      parentId: editingKeyword.parentId,
      pillarId: editingKeyword.pillarId,
      searchVolume: Number(editingKeyword.searchVolume) || 0,
      difficulty: Number(editingKeyword.difficulty) || 0,
      cpc: Number(editingKeyword.cpc) || 0,
      intent: editingKeyword.intent || 'commercial',
      dateCreated: editingKeyword.dateCreated || new Date().toISOString().slice(0, 10),
      daysAgo: editingKeyword.daysAgo ?? 0,
      lastUpdated: new Date().toISOString().slice(0, 10),
      status: editingKeyword.status || 'planned',
      suggestedArticleTitle: editingKeyword.suggestedArticleTitle,
      ranking: editingKeyword.ranking
    };

    onSaveKeyword(saved);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm từ khóa, bài viết, search intent..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-1.5 font-bold text-slate-700"
          >
            <option value="ALL">Mọi cấp độ (Pillar/Cluster/Article)</option>
            <option value="pillar">Pillars (Chủ đề trụ cột)</option>
            <option value="cluster">Clusters (Cụm từ khóa)</option>
            <option value="article">Articles (Bài viết con)</option>
            <option value="variant">Variants (Từ khóa mở rộng)</option>
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-1.5 font-bold text-slate-700"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="planned">Đã lập kế hoạch</option>
            <option value="in_progress">Đang viết bài</option>
            <option value="published">Đã xuất bản</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Từ Khóa Mới</span>
        </button>
      </div>

      {/* Keywords Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Từ khóa mục tiêu & Cấp độ</th>
                <th className="py-3 px-3 text-center">Thời gian</th>
                <th className="py-3 px-3 text-right">Volume</th>
                <th className="py-3 px-3 text-center">Độ khó (KD)</th>
                <th className="py-3 px-3 text-right">CPC</th>
                <th className="py-3 px-3 text-center">Search Intent</th>
                <th className="py-3 px-3 text-center">Thứ hạng</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredKeywords.map((kw) => {
                const linkedArt = articles.find((a) => a.keywordId === kw.id || a.id === kw.articleId);

                return (
                  <tr key={kw.id} className="hover:bg-slate-50/70 transition">
                    {/* Keyword Label & Type Badge */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                            kw.type === 'pillar'
                              ? 'bg-indigo-100 text-indigo-800'
                              : kw.type === 'cluster'
                              ? 'bg-blue-100 text-blue-800'
                              : kw.type === 'article'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {kw.type}
                        </span>
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>{kw.label}</span>
                            {linkedArt && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200">
                                Đã có bài ({linkedArt.seoScore}đ)
                              </span>
                            )}
                          </div>
                          {kw.suggestedArticleTitle && (
                            <div className="text-[10px] text-slate-500 font-medium truncate max-w-md mt-0.5">
                              💡 Gợi ý: {kw.suggestedArticleTitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Date Badge with Rich Tooltip (Feature Requirement) */}
                    <td className="py-3 px-3 text-center relative">
                      <div
                        onMouseEnter={() => setHoveredTooltipId(kw.id)}
                        onMouseLeave={() => setHoveredTooltipId(null)}
                        className="inline-block cursor-help"
                      >
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                          {kw.daysAgo}d
                        </span>

                        {/* Rich Hover Tooltip */}
                        {hoveredTooltipId === kw.id && (
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-52 bg-slate-900 text-white text-[10px] p-2.5 rounded-xl shadow-xl border border-slate-700 animate-in fade-in zoom-in-95">
                            <div className="font-bold text-emerald-400 border-b border-slate-800 pb-1 mb-1">
                              Chi tiết chu kỳ từ khóa
                            </div>
                            <div className="space-y-0.5 text-left">
                              <div>Ngày tạo: <strong className="text-slate-200">{kw.dateCreated}</strong></div>
                              <div>Cập nhật gần nhất: <strong className="text-slate-200">{kw.lastUpdated}</strong></div>
                              <div>Khoảng cách: <strong className="text-amber-400">{kw.daysAgo} ngày trước</strong></div>
                              <div>Chu kỳ rà soát: <strong className="text-slate-200">30 ngày/lần</strong></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Search Volume */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {kw.searchVolume.toLocaleString('vi-VN')}
                    </td>

                    {/* Difficulty */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-mono font-bold ${
                          kw.difficulty > 60
                            ? 'text-rose-600'
                            : kw.difficulty > 40
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {kw.difficulty}/100
                      </span>
                    </td>

                    {/* CPC */}
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {kw.cpc.toLocaleString('vi-VN')} đ
                    </td>

                    {/* Intent */}
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] capitalize">
                        {kw.intent}
                      </span>
                    </td>

                    {/* Rank */}
                    <td className="py-3 px-3 text-center font-bold">
                      {kw.ranking ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono">
                          #{kw.ranking}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          kw.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : kw.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {kw.status === 'published' ? 'Đã xuất bản' : kw.status === 'in_progress' ? 'Đang viết' : 'Đã lên kế hoạch'}
                      </span>
                    </td>

                    {/* Action Menu with Tooltip & Dropdown (Feature Requirement) */}
                    <td className="py-3 px-4 text-right relative">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenCreateArticle(kw)}
                          className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition flex items-center gap-1"
                          title="Tạo bài viết SEO AI cho từ khóa này"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Viết bài</span>
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === kw.id ? null : kw.id)}
                            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                            title="Tùy chọn thao tác khác"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {activeMenuId === kw.id && (
                            <div className="absolute right-0 mt-1 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-50 text-left animate-in fade-in zoom-in-95">
                              <button
                                type="button"
                                onClick={() => {
                                  handleOpenEdit(kw);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 flex items-center gap-2 text-xs font-bold"
                              >
                                <Edit className="w-3.5 h-3.5 text-blue-600" />
                                <span>Chỉnh sửa thông số</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  onOpenCreateArticle(kw);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 flex items-center gap-2 text-xs font-bold"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Tạo dàn ý tự động</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  onSaveKeyword({ ...kw, status: 'archived' });
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 flex items-center gap-2 text-xs font-bold"
                              >
                                <Archive className="w-3.5 h-3.5 text-amber-600" />
                                <span>Lưu trữ từ khóa</span>
                              </button>

                              <div className="border-t border-slate-100 my-1"></div>

                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteKeyword(kw.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 flex items-center gap-2 text-xs font-bold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa từ khóa</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Keyword Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900 mb-4">
              {editingKeyword.id ? 'Chỉnh Sửa Từ Khóa SEO' : 'Thêm Từ Khóa Mới'}
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Từ khóa mục tiêu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingKeyword.label || ''}
                  onChange={(e) => setEditingKeyword({ ...editingKeyword, label: e.target.value })}
                  placeholder="Ví dụ: Báo giá tôn hoa sen 2026..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cấp độ (Hierarchy):</label>
                  <select
                    value={editingKeyword.type || 'article'}
                    onChange={(e) => setEditingKeyword({ ...editingKeyword, type: e.target.value as KeywordNodeType })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="pillar">Pillar (Trụ cột chủ đề)</option>
                    <option value="cluster">Cluster (Cụm từ khóa)</option>
                    <option value="article">Article (Bài viết chính)</option>
                    <option value="variant">Variant (Từ khóa biến thể)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Search Intent:</label>
                  <select
                    value={editingKeyword.intent || 'commercial'}
                    onChange={(e) => setEditingKeyword({ ...editingKeyword, intent: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="transactional">Transactional (Mua hàng)</option>
                    <option value="commercial">Commercial (Tìm hiểu giá)</option>
                    <option value="informational">Informational (Thông tin)</option>
                    <option value="navigational">Navigational (Điều hướng)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Search Volume:</label>
                  <input
                    type="number"
                    value={editingKeyword.searchVolume || 0}
                    onChange={(e) => setEditingKeyword({ ...editingKeyword, searchVolume: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Độ khó KD (0-100):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingKeyword.difficulty || 0}
                    onChange={(e) => setEditingKeyword({ ...editingKeyword, difficulty: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CPC (VNĐ):</label>
                  <input
                    type="number"
                    value={editingKeyword.cpc || 0}
                    onChange={(e) => setEditingKeyword({ ...editingKeyword, cpc: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gợi ý tiêu đề bài viết AI:</label>
                <input
                  type="text"
                  value={editingKeyword.suggestedArticleTitle || ''}
                  onChange={(e) => setEditingKeyword({ ...editingKeyword, suggestedArticleTitle: e.target.value })}
                  placeholder="Tiêu đề chuẩn SEO thu hút click..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20"
                >
                  Lưu Từ Khóa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
