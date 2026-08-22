import React, { useState } from 'react';
import {
  Sparkles,
  Network,
  ListTree,
  FileText,
  Link2,
  Bot,
  TrendingUp,
  Search,
  Plus,
  Target,
  BarChart3,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  KeywordNode,
  KeywordEdge,
  GenSeoArticle,
  InternalLinkSuggestion,
  MascotConfig
} from '../../types';
import { KeywordGraphView } from './KeywordGraphView';
import { KeywordListView } from './KeywordListView';
import { ArticlePipelineView } from './ArticlePipelineView';
import { InternalLinksView } from './InternalLinksView';
import { MascotController } from './MascotController';
import {
  INITIAL_KEYWORD_NODES,
  INITIAL_KEYWORD_EDGES,
  INITIAL_GEN_SEO_ARTICLES,
  INITIAL_INTERNAL_LINK_SUGGESTIONS,
  INITIAL_MASCOT_CONFIG
} from '../../data/genSeoData';

interface GenSeoViewProps {
  onNavigateToTask?: (title: string) => void;
}

export const GenSeoView: React.FC<GenSeoViewProps> = ({ onNavigateToTask }) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'keywords' | 'pipeline' | 'internal_links'>('graph');
  const [keywords, setKeywords] = useState<KeywordNode[]>(INITIAL_KEYWORD_NODES);
  const [edges, setEdges] = useState<KeywordEdge[]>(INITIAL_KEYWORD_EDGES);
  const [articles, setArticles] = useState<GenSeoArticle[]>(INITIAL_GEN_SEO_ARTICLES);
  const [suggestions] = useState<InternalLinkSuggestion[]>(INITIAL_INTERNAL_LINK_SUGGESTIONS);
  const [mascotConfig, setMascotConfig] = useState<MascotConfig>(INITIAL_MASCOT_CONFIG);

  // Summary Metrics
  const totalVolume = keywords.reduce((sum, k) => sum + k.searchVolume, 0);
  const publishedArticlesCount = articles.filter((a) => a.stage === 'published').length;
  const inPipelineArticlesCount = articles.filter((a) => a.stage !== 'published').length;
  const topRankCount = keywords.filter((k) => k.ranking && k.ranking <= 3).length;

  const handleSaveKeyword = (savedKw: KeywordNode) => {
    setKeywords((prev) => {
      const idx = prev.findIndex((k) => k.id === savedKw.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedKw;
        return next;
      }
      return [savedKw, ...prev];
    });
  };

  const handleDeleteKeyword = (id: string) => {
    setKeywords((prev) => prev.filter((k) => k.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
  };

  const handleSaveArticle = (savedArt: GenSeoArticle) => {
    setArticles((prev) => {
      const idx = prev.findIndex((a) => a.id === savedArt.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedArt;
        return next;
      }
      return [savedArt, ...prev];
    });
  };

  const handleDeleteArticle = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCreateArticleFromKeyword = (kw: KeywordNode) => {
    const newArt: GenSeoArticle = {
      id: `art-${Date.now()}`,
      title: kw.suggestedArticleTitle || `Cẩm Nang Hướng Dẫn Về ${kw.label} 2026`,
      slug: kw.label.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      keywordId: kw.id,
      keywordLabel: kw.label,
      pillarName: kw.pillarId ? (keywords.find((k) => k.id === kw.pillarId)?.label || 'Chủ đề chính') : kw.label,
      clusterName: kw.label,
      author: 'Nguyễn Văn Minh (SEO Lead)',
      stage: 'outline',
      progressPercent: 30,
      wordCount: 350,
      targetWordCount: 2200,
      seoScore: 75,
      readabilityScore: 85,
      focusKeywords: [kw.label],
      secondaryKeywords: ['bảng giá 2026', 'hướng dẫn chi tiết', 'đại lý chính hãng'],
      internalLinksCount: 1,
      externalLinksCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    setArticles((prev) => [newArt, ...prev]);
    setActiveTab('pipeline');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                GenSeo
              </h1>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('graph')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <Network className="w-4 h-4 text-emerald-400" />
            <span>Đồ thị liên kết</span>
          </button>
        </div>
      </div>

      {/* SEO KPI Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
            <ListTree className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tổng từ khóa quy hoạch</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {keywords.length} <span className="text-xs font-normal text-slate-400">nodes</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-bold">
            {keywords.filter((k) => k.type === 'pillar').length} Pillars • {keywords.filter((k) => k.type === 'cluster').length} Clusters
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span>Tổng Search Volume/tháng</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {(totalVolume / 1000).toFixed(0)}k <span className="text-xs font-normal text-slate-400">lượt tìm</span>
          </div>
          <div className="text-[10px] text-blue-600 font-bold">
            +18.4% tăng trưởng so với quý trước
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-amber-600" />
            <span>Từ khóa Top 1 - 3 Google</span>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {topRankCount} <span className="text-xs font-normal text-slate-400">từ khóa</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Tỷ lệ chiếm top: <strong className="text-slate-800">{Math.round((topRankCount / keywords.length) * 100)}%</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bài viết SEO hoàn thành</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {publishedArticlesCount} <span className="text-xs font-normal text-slate-400">/ {articles.length} bài</span>
          </div>
          <div className="text-[10px] text-indigo-600 font-bold">
            {inPipelineArticlesCount} bài đang trong quy trình
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('graph')}
          className={`pb-3 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'graph'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>1. Biểu Đồ Từ Khóa (Keyword Graph)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('keywords')}
          className={`pb-3 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'keywords'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ListTree className="w-4 h-4" />
          <span>2. Kế Hoạch Từ Khóa (Keyword Plan)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'pipeline'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Quy Trình Bài Viết (Article Pipeline)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('internal_links')}
          className={`pb-3 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'internal_links'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>4. Liên Kết Nội Bộ (Internal Links)</span>
        </button>
      </div>

      {/* Tab Content Views */}
      {activeTab === 'graph' && (
        <KeywordGraphView
          nodes={keywords}
          edges={edges}
          articles={articles}
          onOpenCreateArticle={handleCreateArticleFromKeyword}
          onSaveKeyword={handleSaveKeyword}
          onDeleteKeyword={handleDeleteKeyword}
          onBatchUpdateNodes={(newNodes, newEdges) => {
            setKeywords(newNodes);
            if (newEdges && newEdges.length > 0) {
              setEdges((prev) => [...prev, ...newEdges]);
            }
          }}
        />
      )}

      {activeTab === 'keywords' && (
        <KeywordListView
          keywords={keywords}
          articles={articles}
          onSaveKeyword={handleSaveKeyword}
          onDeleteKeyword={handleDeleteKeyword}
          onOpenCreateArticle={handleCreateArticleFromKeyword}
        />
      )}

      {activeTab === 'pipeline' && (
        <ArticlePipelineView
          articles={articles}
          onSaveArticle={handleSaveArticle}
          onDeleteArticle={handleDeleteArticle}
        />
      )}

      {activeTab === 'internal_links' && (
        <InternalLinksView
          suggestions={suggestions}
          articles={articles}
        />
      )}

      {/* Floating Mascot with Auto-Avoid Feature */}
      <MascotController
        config={mascotConfig}
        onChangeConfig={setMascotConfig}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
      />
    </div>
  );
};
