import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Layers
} from 'lucide-react';
import { KeywordNode, KeywordEdge, ContentProductionStatus } from '../../types';
import { resolveAggregateStatus } from '../../data/genSeoData';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingNodes: KeywordNode[];
  onImportSuccess: (newNodes: KeywordNode[], newEdges: KeywordEdge[], summary: { added: number; updated: number; total: number }) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  existingNodes,
  onImportSuccess
}) => {
  const [pasteData, setPasteData] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  if (!isOpen) return null;

  // Generate Sample CSV Template for download
  const handleDownloadTemplate = () => {
    const headers = ['Pillar', 'Cluster', 'Keyword', 'SearchVolume', 'Intent', 'Channel', 'Status', 'PublishedURL'];
    const sampleRows = [
      ['Tôn Thép Xây Dựng', 'Báo Giá Tôn Mạ Kẽm & Tôn Màu', 'Bảng Báo Giá Tôn Hoa Sen 2026 Mới Nhất', '18500', 'transactional', 'Website / Blog', 'Đã hoàn thành', 'https://bizone-steel.vn/bai-viet/bao-gia-ton-hoa-sen-2026'],
      ['Tôn Thép Xây Dựng', 'Báo Giá Tôn Mạ Kẽm & Tôn Màu', 'So Sánh Độ Dày Tôn Đông Á Với Phương Nam', '9200', 'commercial', 'Website / Blog', 'Chờ duyệt', ''],
      ['Tôn Thép Xây Dựng', 'Tôn Cách Nhiệt PU & Tôn Lạnh', 'Báo Giá Tôn Xốp Cách Nhiệt 3 Lớp PU', '14200', 'transactional', 'Website / Blog', 'Đang xử lý', ''],
      ['Xà Gồ & Thép Hình Kết Cấu', 'Quy Cách Xà Gồ C & Xà Gồ Z', 'Bảng Tra Trọng Lượng Xà Gồ C Mạ Kẽm', '11500', 'informational', 'Website / Blog', 'Chưa viết', ''],
      ['Vật Tư Lưới & Kẽm Gai', 'Lưới B40 Mạ Kẽm & Bọc Nhựa', 'Giá lưới B40 khổ 1m5 bọc nhựa hôm nay', '6800', 'transactional', 'Shopee', '', 'https://shopee.vn/luoi-b40-ma-kem-bizone'],
      ['Phần Mềm ERP Phân Phối', 'Quản Lý Kho Thép', 'Phần mềm ERP quản lý tồn kho sắt thép FIFO', '5400', 'commercial', 'Website / Blog', 'Chưa viết', '']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...sampleRows.map(e => e.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'BizOne_Content_Keyword_Map_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1-Click Load 1,250 Demo Stress-test Dataset
  const handleLoadStressTestData = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const generatedNodes: KeywordNode[] = [];
      const generatedEdges: KeywordEdge[] = [];

      const pillarsConfig = [
        { id: 'kw-pillar-steel', name: 'Tôn Thép Xây Dựng', clustersCount: 8, kwPerCluster: 30, completedRatio: 0.45 },
        { id: 'kw-pillar-purling', name: 'Xà Gồ & Thép Hình Kết Cấu', clustersCount: 6, kwPerCluster: 25, completedRatio: 0.35 },
        { id: 'kw-pillar-mesh', name: 'Vật Tư Lưới & Kẽm Gai', clustersCount: 5, kwPerCluster: 20, completedRatio: 0.25 },
        { id: 'kw-pillar-door', name: 'Cửa Nhôm Kính & Phụ Kiện', clustersCount: 6, kwPerCluster: 25, completedRatio: 0.20 },
        { id: 'kw-pillar-erp', name: 'Phần Mềm ERP Quản Trị Phân Phối', clustersCount: 6, kwPerCluster: 20, completedRatio: 0.30 }
      ];

      let totalAdded = 0;

      pillarsConfig.forEach((p, pIdx) => {
        // Create Pillar
        const pillarNode: KeywordNode = {
          id: p.id,
          label: p.name,
          type: 'pillar',
          searchVolume: 120000 + pIdx * 15000,
          difficulty: 55 + pIdx * 4,
          cpc: 7500 + pIdx * 1200,
          intent: 'commercial',
          channel: 'Website / Blog',
          dateCreated: '2026-06-01',
          daysAgo: 82,
          lastUpdated: '2026-08-22',
          status: 'completed',
          aggregate_status: 'completed',
          publishedUrl: `https://bizone-steel.vn/danh-muc/${p.id.replace('kw-pillar-', '')}`,
          publishedAt: '2026-06-15',
          ranking: 1 + pIdx,
          tags: ['Pillar', 'Core']
        };
        generatedNodes.push(pillarNode);

        for (let c = 1; c <= p.clustersCount; c++) {
          const clusterId = `${p.id}-c${c}`;
          const clusterName = `Cụm ${c}: ${p.name} - Chuyên đề ${c}`;
          const clusterNode: KeywordNode = {
            id: clusterId,
            label: clusterName,
            type: 'cluster',
            parentId: p.id,
            pillarId: p.id,
            pillarName: p.name,
            searchVolume: Math.floor(18000 + Math.random() * 25000),
            difficulty: Math.floor(35 + Math.random() * 30),
            cpc: Math.floor(4500 + Math.random() * 4000),
            intent: c % 2 === 0 ? 'transactional' : 'commercial',
            channel: 'Website / Blog',
            dateCreated: '2026-07-01',
            daysAgo: 52,
            lastUpdated: '2026-08-20',
            status: 'completed',
            aggregate_status: 'completed',
            publishedUrl: `https://bizone-steel.vn/cum-chu-de/${clusterId}`,
            publishedAt: '2026-07-10'
          };
          generatedNodes.push(clusterNode);
          generatedEdges.push({
            id: `edge-${p.id}-${clusterId}`,
            source: p.id,
            target: clusterId,
            relationType: 'pillar_to_cluster'
          });

          for (let k = 1; k <= p.kwPerCluster; k++) {
            totalAdded++;
            const kwId = `${clusterId}-kw${k}`;
            const rand = Math.random();
            let status: ContentProductionStatus = 'not_started';
            let publishedUrl = '';
            let currentStep = '';
            let progressPercent = 0;

            if (rand < p.completedRatio) {
              status = 'completed';
              publishedUrl = `https://bizone-steel.vn/bai-viet/bai-${kwId}`;
            } else if (rand < p.completedRatio + 0.15) {
              status = 'pending_review';
              progressPercent = 90;
            } else if (rand < p.completedRatio + 0.35) {
              status = 'processing';
              currentStep = 'Đang phân tích đối thủ SERP & Soạn bài SEO';
              progressPercent = Math.floor(30 + Math.random() * 45);
            } else {
              status = 'not_started';
            }

            const kwNode: KeywordNode = {
              id: kwId,
              label: `${p.name} - Từ khóa chi tiết #${k} (Nhóm ${c})`,
              type: k <= 8 ? 'article' : 'variant',
              parentId: clusterId,
              pillarId: p.id,
              pillarName: p.name,
              clusterName: clusterName,
              searchVolume: Math.floor(1200 + Math.random() * 15000),
              difficulty: Math.floor(20 + Math.random() * 50),
              cpc: Math.floor(3000 + Math.random() * 5000),
              intent: k % 3 === 0 ? 'transactional' : k % 3 === 1 ? 'commercial' : 'informational',
              channel: k % 4 === 0 ? 'Shopee' : 'Website / Blog',
              dateCreated: '2026-07-15',
              daysAgo: 38,
              lastUpdated: '2026-08-22',
              status: status,
              aggregate_status: status,
              publishedUrl: publishedUrl || undefined,
              publishedAt: status === 'completed' ? '2026-08-15' : undefined,
              currentStep: currentStep || undefined,
              progressPercent: progressPercent || undefined,
              contentTitle: `Báo Giá & Hướng Dẫn Kỹ Thuật ${p.name} #${k} Tiêu Chuẩn 2026`
            };

            generatedNodes.push(kwNode);
            generatedEdges.push({
              id: `edge-${clusterId}-${kwId}`,
              source: clusterId,
              target: kwId,
              relationType: k <= 8 ? 'cluster_to_article' : 'article_to_variant'
            });
          }
        }
      });

      onImportSuccess(generatedNodes, generatedEdges, {
        added: generatedNodes.length,
        updated: 0,
        total: generatedNodes.length
      });
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  // Parse raw text or uploaded CSV/TSV
  const handleParseAndImport = () => {
    if (!pasteData.trim()) {
      setErrorMsg('Vui lòng dán dữ liệu hoặc chọn file để tải lên.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const lines = pasteData.trim().split(/\r?\n/);
      if (lines.length < 2) {
        throw new Error('Dữ liệu phải có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu.');
      }

      // Detect delimiter (comma or tab or semicolon)
      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

      const headers = firstLine.split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

      const pillarIdx = headers.findIndex((h) => h.includes('pillar') || h.includes('trụ') || h.includes('chủ đề'));
      const clusterIdx = headers.findIndex((h) => h.includes('cluster') || h.includes('cụm'));
      const kwIdx = headers.findIndex((h) => h.includes('keyword') || h.includes('từ khóa') || h.includes('tu khoa'));
      const volIdx = headers.findIndex((h) => h.includes('volume') || h.includes('tìm kiếm') || h.includes('lượng'));
      const intentIdx = headers.findIndex((h) => h.includes('intent') || h.includes('ý định'));
      const channelIdx = headers.findIndex((h) => h.includes('channel') || h.includes('kênh'));
      const statusIdx = headers.findIndex((h) => h.includes('status') || h.includes('trạng thái'));
      const urlIdx = headers.findIndex((h) => h.includes('url') || h.includes('link') || h.includes('bài'));

      if (kwIdx === -1) {
        throw new Error('Không tìm thấy cột "Keyword" (Từ khóa) trong dữ liệu.');
      }

      const newNodes: KeywordNode[] = [...existingNodes];
      const newEdges: KeywordEdge[] = [];
      let addedCount = 0;
      let updatedCount = 0;

      // Track created pillars and clusters
      const pillarMap = new Map<string, string>();
      const clusterMap = new Map<string, string>();

      // Index existing pillars and clusters
      existingNodes.forEach((n) => {
        if (n.type === 'pillar') pillarMap.set(n.label.toLowerCase(), n.id);
        if (n.type === 'cluster') clusterMap.set(n.label.toLowerCase(), n.id);
      });

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV splitter respecting quotes
        const cols: string[] = [];
        let curr = '';
        let inQuotes = false;
        for (let c = 0; c < line.length; c++) {
          const char = line[c];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            cols.push(curr.trim());
            curr = '';
          } else {
            curr += char;
          }
        }
        cols.push(curr.trim());

        const rawPillar = pillarIdx >= 0 && cols[pillarIdx] ? cols[pillarIdx].replace(/^["']|["']$/g, '').trim() : 'Chủ đề chung';
        const rawCluster = clusterIdx >= 0 && cols[clusterIdx] ? cols[clusterIdx].replace(/^["']|["']$/g, '').trim() : 'Cụm từ khóa';
        const rawKeyword = cols[kwIdx] ? cols[kwIdx].replace(/^["']|["']$/g, '').trim() : '';
        const rawVolume = volIdx >= 0 && cols[volIdx] ? Number(cols[volIdx].replace(/[^0-9]/g, '')) || 1000 : 2500;
        const rawIntent = intentIdx >= 0 && cols[intentIdx] ? cols[intentIdx].replace(/^["']|["']$/g, '').trim().toLowerCase() : 'commercial';
        const rawChannel = channelIdx >= 0 && cols[channelIdx] ? cols[channelIdx].replace(/^["']|["']$/g, '').trim() : 'Website / Blog';
        const rawStatus = statusIdx >= 0 && cols[statusIdx] ? cols[statusIdx].replace(/^["']|["']$/g, '').trim() : '';
        const rawUrl = urlIdx >= 0 && cols[urlIdx] ? cols[urlIdx].replace(/^["']|["']$/g, '').trim() : '';

        if (!rawKeyword) continue;

        // Ensure Pillar exists
        let pillarId = pillarMap.get(rawPillar.toLowerCase());
        if (!pillarId) {
          pillarId = `kw-pillar-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          pillarMap.set(rawPillar.toLowerCase(), pillarId);
          newNodes.push({
            id: pillarId,
            label: rawPillar,
            type: 'pillar',
            searchVolume: 85000,
            difficulty: 60,
            cpc: 7500,
            intent: 'commercial',
            channel: 'Website / Blog',
            dateCreated: new Date().toISOString().slice(0, 10),
            daysAgo: 0,
            lastUpdated: new Date().toISOString().slice(0, 10),
            status: 'completed',
            aggregate_status: 'completed'
          });
        }

        // Ensure Cluster exists
        let clusterId = clusterMap.get(rawCluster.toLowerCase());
        if (!clusterId) {
          clusterId = `kw-cluster-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          clusterMap.set(rawCluster.toLowerCase(), clusterId);
          newNodes.push({
            id: clusterId,
            label: rawCluster,
            type: 'cluster',
            parentId: pillarId,
            pillarId: pillarId,
            pillarName: rawPillar,
            searchVolume: 25000,
            difficulty: 45,
            cpc: 6000,
            intent: 'commercial',
            channel: 'Website / Blog',
            dateCreated: new Date().toISOString().slice(0, 10),
            daysAgo: 0,
            lastUpdated: new Date().toISOString().slice(0, 10),
            status: 'completed',
            aggregate_status: 'completed'
          });
          newEdges.push({
            id: `edge-${pillarId}-${clusterId}`,
            source: pillarId,
            target: clusterId,
            relationType: 'pillar_to_cluster'
          });
        }

        // Standardize status according to the strict priority rules
        const computedStatus = resolveAggregateStatus(rawStatus, rawUrl);

        // Check if Keyword Node exists (Upsert logic to avoid duplicates)
        const existingIdx = newNodes.findIndex((n) => n.label.toLowerCase() === rawKeyword.toLowerCase());

        if (existingIdx >= 0) {
          // Update existing
          newNodes[existingIdx] = {
            ...newNodes[existingIdx],
            searchVolume: rawVolume || newNodes[existingIdx].searchVolume,
            intent: (['informational', 'transactional', 'commercial', 'navigational'].includes(rawIntent) ? rawIntent : 'commercial') as any,
            channel: rawChannel,
            publishedUrl: rawUrl || newNodes[existingIdx].publishedUrl,
            status: computedStatus,
            aggregate_status: computedStatus,
            lastUpdated: new Date().toISOString().slice(0, 10),
            publishedAt: computedStatus === 'completed' ? (newNodes[existingIdx].publishedAt || new Date().toISOString().slice(0, 10)) : undefined
          };
          updatedCount++;
        } else {
          // Create new keyword node
          const kwNodeId = `kw-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          const newNode: KeywordNode = {
            id: kwNodeId,
            label: rawKeyword,
            type: 'article',
            parentId: clusterId,
            pillarId: pillarId,
            pillarName: rawPillar,
            clusterName: rawCluster,
            searchVolume: rawVolume,
            difficulty: 35,
            cpc: 4500,
            intent: (['informational', 'transactional', 'commercial', 'navigational'].includes(rawIntent) ? rawIntent : 'commercial') as any,
            channel: rawChannel,
            dateCreated: new Date().toISOString().slice(0, 10),
            daysAgo: 0,
            lastUpdated: new Date().toISOString().slice(0, 10),
            status: computedStatus,
            aggregate_status: computedStatus,
            publishedUrl: rawUrl || undefined,
            publishedAt: computedStatus === 'completed' ? new Date().toISOString().slice(0, 10) : undefined,
            suggestedArticleTitle: `Báo Giá & Hướng Dẫn Về ${rawKeyword} 2026`
          };
          newNodes.push(newNode);
          newEdges.push({
            id: `edge-${clusterId}-${kwNodeId}`,
            source: clusterId,
            target: kwNodeId,
            relationType: 'cluster_to_article'
          });
          addedCount++;
        }
      }

      onImportSuccess(newNodes, newEdges, {
        added: addedCount,
        updated: updatedCount,
        total: newNodes.length
      });

      setIsProcessing(false);
      onClose();
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err.message || 'Lỗi xử lý file Excel/CSV. Vui lòng kiểm tra định dạng.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setPasteData(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Import Excel Vào Node Graph Content
              </h3>
              <p className="text-xs text-slate-500">
                Nạp trực tiếp từ khóa, trụ cột, kênh và trạng thái sản xuất vào biểu đồ mạng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Rules & Priority Banner */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl text-xs space-y-2 border border-slate-800">
            <div className="font-extrabold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Quy tắc chuẩn hóa trạng thái tự động (Priority Rules):</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 pl-4 list-disc text-[11px]">
              <li>
                <strong className="text-emerald-300">Ưu tiên 1:</strong> Có link bài đã đăng (URL hợp lệ) → <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Đã hoàn thành (Xanh lá)</span> ngay lập tức.
              </li>
              <li>
                <strong className="text-amber-300">Ưu tiên 2:</strong> Có trạng thái trong Excel → Map tự động sang <span className="text-slate-300 font-medium">Chưa viết (Xám)</span>, <span className="text-blue-300 font-medium">Đang xử lý (Xanh dương)</span>, <span className="text-amber-300 font-medium">Chờ duyệt (Cam)</span>.
              </li>
              <li>
                <strong className="text-slate-400">Ưu tiên 3:</strong> Không có URL và trạng thái → Mặc định <span className="bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded font-bold">Chưa viết (Xám)</span>.
              </li>
              <li>
                <strong className="text-sky-300">Cơ chế Upsert:</strong> Nếu từ khóa đã có sẵn → Cập nhật thông tin, không tạo trùng lặp.
              </li>
            </ul>
          </div>

          {/* Quick Actions / Download Template / Demo 1,250 Load */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Tải file Excel mẫu (.CSV)</span>
            </button>

            <button
              type="button"
              onClick={handleLoadStressTestData}
              className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-900 text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>⚡ Nạp nhanh 1,250+ Keywords mẫu</span>
            </button>
          </div>

          {/* File Upload Drop Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Chọn File Excel / CSV (.xlsx, .xls, .csv)
            </label>
            <div className="relative border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center transition bg-slate-50/60 hover:bg-emerald-50/30 cursor-pointer">
              <input
                type="file"
                accept=".csv,.txt,.tsv,.tab"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700">
                {fileName ? fileName : 'Kéo thả file vào đây hoặc nhấp để chọn'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hỗ trợ CSV, Tab-separated, TSV dung lượng lên đến 50MB (10,000+ dòng)
              </p>
            </div>
          </div>

          {/* Paste Tabular Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Hoặc dán trực tiếp dữ liệu từ Excel / Google Sheets vào đây:
              </label>
              {pasteData && (
                <button
                  type="button"
                  onClick={() => setPasteData('')}
                  className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                >
                  Xóa nội dung
                </button>
              )}
            </div>
            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder="Pillar, Cluster, Keyword, SearchVolume, Intent, Channel, Status, PublishedURL&#10;Tôn Thép Xây Dựng, Báo Giá Tôn, Bảng Báo Giá Tôn Hoa Sen 2026, 18500, transactional, Website / Blog, Đã hoàn thành, https://bizone-steel.vn/bai-viet/bao-gia-ton-hoa-sen-2026"
              rows={5}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleParseAndImport}
            disabled={isProcessing || !pasteData.trim()}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black text-white shadow-lg transition flex items-center gap-2 cursor-pointer ${
              isProcessing || !pasteData.trim()
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang xử lý & Nạp Graph...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Nạp trực tiếp vào Node Graph</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
