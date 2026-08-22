import React from 'react';
import {
  Link2,
  Sparkles,
  ArrowRight,
  FileText,
  Copy,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { InternalLinkSuggestion, GenSeoArticle } from '../../types';

interface InternalLinksViewProps {
  suggestions: InternalLinkSuggestion[];
  articles: GenSeoArticle[];
}

export const InternalLinksView: React.FC<InternalLinksViewProps> = ({
  suggestions,
  articles
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopyAnchor = (anchor: string, id: string) => {
    navigator.clipboard.writeText(anchor);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-md flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>Mạng Lưới Liên Kết Nội Bộ Tự Động (Smart Internal Linking Engine)</span>
          </div>
          <h2 className="text-base font-extrabold text-white">
            Tối Ưu Dòng Chảy PageRank & Điều Hướng Khách Hàng Chuyển Đổi
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Hệ thống tự động phát hiện các cụm chủ đề liên quan trong kho bài viết và đề xuất vị trí chèn anchor text tối ưu nhất, giúp tăng thời gian on-site và ranking đồng bộ.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
          <div>
            <div className="text-lg font-mono font-black text-emerald-400">{suggestions.length}</div>
            <div className="text-[10px] text-slate-300 font-medium">Gợi ý liên kết</div>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div>
            <div className="text-lg font-mono font-black text-blue-400">92%</div>
            <div className="text-[10px] text-slate-300 font-medium">Độ phù hợp AI</div>
          </div>
        </div>
      </div>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map((sug, idx) => {
          const isCopied = copiedId === `sug-${idx}`;

          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col justify-between space-y-3 hover:shadow-md transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Độ phù hợp {sug.relevanceScore}%
                  </span>
                  <span className="text-slate-400 font-mono">#Gợi ý {idx + 1}</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Bài viết nguồn:</span>
                    <div className="font-bold text-slate-900 line-clamp-1">{sug.sourceTitle}</div>
                  </div>

                  <div className="flex items-center justify-center py-1">
                    <ArrowRight className="w-4 h-4 text-emerald-600 animate-pulse" />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Bài viết đích:</span>
                    <div className="font-bold text-indigo-700 line-clamp-1">{sug.targetTitle}</div>
                  </div>
                </div>

                {/* Context Snippet with highlighted Anchor text */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic leading-relaxed">
                  "{sug.contextSnippet}"
                </div>
              </div>

              {/* Anchor Text & Copy Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold">Anchor text:</span>
                  <div className="font-bold text-emerald-800 text-xs">[{sug.anchorText}]</div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyAnchor(sug.anchorText, `sug-${idx}`)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition"
                >
                  {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Đã sao chép' : 'Copy Anchor'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
