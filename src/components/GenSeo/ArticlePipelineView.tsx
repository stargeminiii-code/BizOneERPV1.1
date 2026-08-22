import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  Send,
  UserCheck,
  CheckSquare,
  Square,
  Search,
  Filter,
  Plus,
  ArrowRight,
  TrendingUp,
  Link2,
  BookOpen,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { GenSeoArticle, ArticleStage } from '../../types';

interface ArticlePipelineViewProps {
  articles: GenSeoArticle[];
  onSaveArticle: (art: GenSeoArticle) => void;
  onDeleteArticle: (id: string) => void;
  onBulkApprove?: (ids: string[]) => void;
  onBulkReject?: (ids: string[]) => void;
}

export const ArticlePipelineView: React.FC<ArticlePipelineViewProps> = ({
  articles,
  onSaveArticle,
  onDeleteArticle,
  onBulkApprove,
  onBulkReject
}) => {
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const [activeArticleModal, setActiveArticleModal] = useState<GenSeoArticle | null>(null);

  const stages: { key: ArticleStage; label: string; color: string }[] = [
    { key: 'research', label: '1. Nghiên cứu & Dữ liệu', color: 'bg-indigo-100 text-indigo-800' },
    { key: 'outline', label: '2. Lập dàn ý H2/H3', color: 'bg-blue-100 text-blue-800' },
    { key: 'drafting', label: '3. Đang viết bản nháp', color: 'bg-amber-100 text-amber-800' },
    { key: 'review', label: '4. Chờ duyệt nội dung', color: 'bg-purple-100 text-purple-800' },
    { key: 'published', label: '5. Đã xuất bản', color: 'bg-emerald-100 text-emerald-800' }
  ];

  const filteredArticles = articles.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.keywordLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStage = selectedStage === 'ALL' || a.stage === selectedStage;
    return matchSearch && matchStage;
  });

  // Select all / toggle select
  const handleToggleSelectAll = () => {
    if (selectedArticleIds.length === filteredArticles.length) {
      setSelectedArticleIds([]);
    } else {
      setSelectedArticleIds(filteredArticles.map((a) => a.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedArticleIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk actions (Requirement: Bulk-approve / bulk-reject)
  const handleExecuteBulkApprove = () => {
    if (selectedArticleIds.length === 0) return;
    if (onBulkApprove) {
      onBulkApprove(selectedArticleIds);
    } else {
      selectedArticleIds.forEach((id) => {
        const art = articles.find((a) => a.id === id);
        if (art) {
          onSaveArticle({
            ...art,
            stage: 'published',
            progressPercent: 100,
            updatedAt: new Date().toISOString().slice(0, 10),
            publishedUrl: art.publishedUrl || `https://bizone-steel.vn/bai-viet/${art.slug}`
          });
        }
      });
    }
    setSelectedArticleIds([]);
  };

  const handleExecuteBulkReject = () => {
    if (selectedArticleIds.length === 0) return;
    if (onBulkReject) {
      onBulkReject(selectedArticleIds);
    } else {
      selectedArticleIds.forEach((id) => {
        const art = articles.find((a) => a.id === id);
        if (art) {
          onSaveArticle({
            ...art,
            stage: 'drafting',
            progressPercent: 50,
            updatedAt: new Date().toISOString().slice(0, 10),
            notes: (art.notes ? art.notes + ' | ' : '') + 'Yêu cầu viết lại: Chưa đạt tiêu chuẩn SEO.'
          });
        }
      });
    }
    setSelectedArticleIds([]);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm bài viết theo tiêu đề, tác giả, từ khóa..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 font-medium"
            />
          </div>

          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-1.5 font-bold text-slate-700"
          >
            <option value="ALL">Tất cả giai đoạn pipeline ({articles.length})</option>
            <option value="research">1. Nghiên cứu dữ liệu</option>
            <option value="outline">2. Dàn ý H2/H3</option>
            <option value="drafting">3. Bản nháp</option>
            <option value="review">4. Chờ duyệt nội dung</option>
            <option value="published">5. Đã xuất bản</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Đã chọn: <strong className="text-slate-900">{selectedArticleIds.length}</strong> bài viết
          </span>
        </div>
      </div>

      {/* Sticky Floating Bulk Action Bar (Feature Requirement) */}
      {selectedArticleIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Đang chọn {selectedArticleIds.length} bài viết trong quy trình</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExecuteBulkApprove}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Phê duyệt xuất bản ({selectedArticleIds.length})</span>
            </button>

            <button
              type="button"
              onClick={handleExecuteBulkReject}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Yêu cầu sửa lại ({selectedArticleIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedArticleIds([])}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Bỏ chọn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Articles Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedArticleIds.length > 0 && selectedArticleIds.length === filteredArticles.length}
                    onChange={handleToggleSelectAll}
                    className="rounded accent-emerald-600"
                  />
                </th>
                <th className="py-3 px-3">Tiêu đề bài viết & Từ khóa mục tiêu</th>
                <th className="py-3 px-3">Tác giả</th>
                <th className="py-3 px-3 text-center">Giai đoạn Pipeline</th>
                <th className="py-3 px-3 text-center">Tiến độ bài</th>
                <th className="py-3 px-3 text-center">Độ dài từ</th>
                <th className="py-3 px-3 text-center">SEO Score</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredArticles.map((art) => {
                const isSelected = selectedArticleIds.includes(art.id);
                const stageInfo = stages.find((s) => s.key === art.stage) || stages[0];

                return (
                  <tr key={art.id} className={`hover:bg-slate-50/70 transition ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(art.id)}
                        className="rounded accent-emerald-600 cursor-pointer"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <div>
                        <div
                          onClick={() => setActiveArticleModal(art)}
                          className="font-extrabold text-slate-900 hover:text-emerald-600 cursor-pointer transition line-clamp-1"
                        >
                          {art.title}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                          <span>Focus: <strong className="text-slate-700">{art.keywordLabel}</strong></span>
                          <span>•</span>
                          <span>{art.pillarName}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-700">
                      {art.author}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold ${stageInfo.color}`}>
                        {stageInfo.label}
                      </span>
                    </td>

                    {/* Progress Bar inside Table Row */}
                    <td className="py-3 px-3 text-center">
                      <div className="w-24 mx-auto space-y-1">
                        <div className="flex justify-between text-[10px] font-mono font-bold text-slate-600">
                          <span>{art.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              art.progressPercent >= 100
                                ? 'bg-emerald-500'
                                : art.progressPercent >= 60
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${art.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      <span className="font-bold text-slate-900">{art.wordCount.toLocaleString('vi-VN')}</span>
                      <span className="text-[10px] text-slate-400">/{art.targetWordCount.toLocaleString('vi-VN')}</span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono font-extrabold text-[11px] ${
                          art.seoScore >= 85
                            ? 'bg-emerald-100 text-emerald-800'
                            : art.seoScore >= 60
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {art.seoScore}/100
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveArticleModal(art)}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem chi tiết</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ARTICLE DETAIL MODAL WITH PROGRESS BAR & SEO BREAKDOWN (Feature Requirement) */}
      {activeArticleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    {activeArticleModal.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tác giả: <strong>{activeArticleModal.author}</strong> • Từ khóa: <strong>{activeArticleModal.keywordLabel}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveArticleModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* PROGRESS BAR (Feature Requirement) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Tiến độ hoàn thành bài viết:
                  </span>
                  <span className="font-mono text-emerald-700 font-extrabold text-sm">
                    {activeArticleModal.progressPercent}%
                  </span>
                </div>

                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    style={{ width: `${activeArticleModal.progressPercent}%` }}
                  />
                </div>

                {/* Pipeline Stage Indicators */}
                <div className="grid grid-cols-5 gap-1 text-center pt-2">
                  {stages.map((stg, sIdx) => {
                    const isCompleted = activeArticleModal.progressPercent >= (sIdx + 1) * 20;
                    const isCurrent = activeArticleModal.stage === stg.key;

                    return (
                      <div key={stg.key} className="space-y-1">
                        <div
                          className={`w-4 h-4 rounded-full mx-auto flex items-center justify-center text-[8px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {sIdx + 1}
                        </div>
                        <div className={`text-[9px] font-bold ${isCurrent ? 'text-blue-700' : 'text-slate-500'}`}>
                          {stg.label.split('.')[1]?.trim()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEO Score & Metrics Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                  <div className="text-[10px] text-emerald-700 font-bold">SEO Score</div>
                  <div className="text-xl font-mono font-black text-emerald-900 mt-0.5">
                    {activeArticleModal.seoScore}/100
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-center">
                  <div className="text-[10px] text-blue-700 font-bold">Readability</div>
                  <div className="text-xl font-mono font-black text-blue-900 mt-0.5">
                    {activeArticleModal.readabilityScore}/100
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
                  <div className="text-[10px] text-purple-700 font-bold">Liên kết nội bộ</div>
                  <div className="text-xl font-mono font-black text-purple-900 mt-0.5">
                    {activeArticleModal.internalLinksCount} links
                  </div>
                </div>
              </div>

              {/* Keywords Matrix */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="font-bold text-slate-800">Từ khóa trọng tâm & phụ:</div>
                <div className="flex flex-wrap gap-1.5">
                  {activeArticleModal.focusKeywords.map((fk) => (
                    <span key={fk} className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      ★ {fk}
                    </span>
                  ))}
                  {activeArticleModal.secondaryKeywords.map((sk) => (
                    <span key={sk} className="px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700 font-medium text-[10px]">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {activeArticleModal.notes && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <strong>Ghi chú biên tập:</strong> {activeArticleModal.notes}
                </div>
              )}

              {/* Stage Quick Switch */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Chuyển giai đoạn:</span>
                  <select
                    value={activeArticleModal.stage}
                    onChange={(e) => {
                      const newStg = e.target.value as ArticleStage;
                      const progressMap: Record<ArticleStage, number> = {
                        research: 15,
                        outline: 35,
                        drafting: 60,
                        review: 85,
                        published: 100
                      };
                      const updated: GenSeoArticle = {
                        ...activeArticleModal,
                        stage: newStg,
                        progressPercent: progressMap[newStg] || 50,
                        updatedAt: new Date().toISOString().slice(0, 10)
                      };
                      setActiveArticleModal(updated);
                      onSaveArticle(updated);
                    }}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                  >
                    <option value="research">1. Nghiên cứu</option>
                    <option value="outline">2. Lập dàn ý</option>
                    <option value="drafting">3. Viết bản nháp</option>
                    <option value="review">4. Chờ duyệt</option>
                    <option value="published">5. Đã xuất bản</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {activeArticleModal.stage !== 'published' && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated: GenSeoArticle = {
                          ...activeArticleModal,
                          stage: 'published',
                          progressPercent: 100,
                          publishedUrl: `https://bizone-steel.vn/bai-viet/${activeArticleModal.slug}`,
                          updatedAt: new Date().toISOString().slice(0, 10)
                        };
                        setActiveArticleModal(updated);
                        onSaveArticle(updated);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Duyệt xuất bản</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
