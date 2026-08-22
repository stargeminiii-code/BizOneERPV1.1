import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Network,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Sparkles,
  Layers,
  FileText,
  ArrowRight,
  TrendingUp,
  Target,
  ExternalLink,
  Edit,
  Plus,
  CheckCircle2,
  X,
  Sliders,
  DollarSign,
  BarChart3,
  Upload,
  Clock,
  AlertCircle,
  Eye,
  Check,
  Send,
  HelpCircle,
  Play,
  Share2,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Move,
  Activity,
  Orbit,
  Globe,
  Sun,
  Compass,
  Radio
} from 'lucide-react';
import {
  KeywordNode,
  KeywordEdge,
  KeywordNodeType,
  GenSeoArticle,
  ContentProductionStatus
} from '../../types';
import { ExcelImportModal } from './ExcelImportModal';
import { resolveAggregateStatus } from '../../data/genSeoData';

interface KeywordGraphViewProps {
  nodes: KeywordNode[];
  edges: KeywordEdge[];
  articles: GenSeoArticle[];
  onSaveKeyword?: (node: KeywordNode) => void;
  onDeleteKeyword?: (id: string) => void;
  onOpenCreateArticle?: (node: KeywordNode) => void;
  onBatchUpdateNodes?: (newNodes: KeywordNode[], newEdges?: KeywordEdge[]) => void;
}

export const KeywordGraphView: React.FC<KeywordGraphViewProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  articles,
  onSaveKeyword,
  onDeleteKeyword,
  onOpenCreateArticle,
  onBatchUpdateNodes
}) => {
  // Local state for interactive realtime Graph updates
  const [nodes, setNodes] = useState<KeywordNode[]>(initialNodes);
  const [edges, setEdges] = useState<KeywordEdge[]>(initialEdges);

  // Synchronize when prop changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges]);

  // Toolbar & Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContentProductionStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | KeywordNodeType>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialNodes[0]?.id || null);
  const [showLabels, setShowLabels] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Mobile Bottom Sheet state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Pipeline simulation running jobs
  const [activeJobs, setActiveJobs] = useState<Record<string, { step: string; progress: number; timerId?: any }>>({});

  // Canvas Viewport Pan / Zoom & Cosmic Galaxy State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const touchDistRef = useRef<number | null>(null);

  // Interactive Node Drag-and-Drop & Cosmic Motion Mode State
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [motionMode, setMotionMode] = useState<'galaxy' | 'drift' | 'static'>('galaxy');
  const [orbitSpeed, setOrbitSpeed] = useState<number>(1);
  const [animationTick, setAnimationTick] = useState(0);

  const draggedNodeStateRef = useRef<{
    id: string;
    startSvgX: number;
    startSvgY: number;
    nodeStartX: number;
    nodeStartY: number;
    hasMoved: boolean;
  } | null>(null);

  // Cosmic Galaxy & Organic Physics animation loop
  useEffect(() => {
    if (motionMode === 'static') return;
    let rafId: number;
    const start = performance.now();
    const loop = (now: number) => {
      setAnimationTick((now - start) * 0.0016);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [motionMode]);

  // Deterministic Cosmic Starfield coordinates
  const cosmicStars = useMemo(
    () => [
      { x: 75, y: 80, r: 1.3, opacity: 0.85, color: '#ffffff', delay: 0 },
      { x: 190, y: 120, r: 0.9, opacity: 0.6, color: '#93c5fd', delay: 1.2 },
      { x: 320, y: 65, r: 1.8, opacity: 0.95, color: '#fef08a', delay: 0.5 },
      { x: 480, y: 90, r: 0.8, opacity: 0.5, color: '#c084fc', delay: 2.1 },
      { x: 620, y: 45, r: 1.5, opacity: 0.75, color: '#ffffff', delay: 1.8 },
      { x: 780, y: 110, r: 1.1, opacity: 0.8, color: '#67e8f9', delay: 0.9 },
      { x: 920, y: 70, r: 1.6, opacity: 0.65, color: '#f472b6', delay: 2.7 },
      { x: 1040, y: 130, r: 1.0, opacity: 0.7, color: '#ffffff', delay: 1.4 },
      { x: 60, y: 240, r: 1.3, opacity: 0.6, color: '#38bdf8', delay: 0.3 },
      { x: 140, y: 380, r: 0.9, opacity: 0.7, color: '#ffffff', delay: 2.4 },
      { x: 230, y: 510, r: 1.5, opacity: 0.8, color: '#fef08a', delay: 1.1 },
      { x: 110, y: 620, r: 1.2, opacity: 0.6, color: '#c084fc', delay: 0.7 },
      { x: 280, y: 640, r: 0.8, opacity: 0.5, color: '#ffffff', delay: 2.9 },
      { x: 420, y: 590, r: 1.7, opacity: 0.9, color: '#34d399', delay: 0.4 },
      { x: 560, y: 630, r: 1.1, opacity: 0.7, color: '#93c5fd', delay: 1.7 },
      { x: 710, y: 580, r: 1.4, opacity: 0.8, color: '#ffffff', delay: 2.2 },
      { x: 860, y: 620, r: 1.0, opacity: 0.6, color: '#f472b6', delay: 0.8 },
      { x: 990, y: 550, r: 1.6, opacity: 0.9, color: '#67e8f9', delay: 1.9 },
      { x: 1030, y: 390, r: 1.2, opacity: 0.7, color: '#ffffff', delay: 0.2 },
      { x: 960, y: 260, r: 0.9, opacity: 0.5, color: '#fef08a', delay: 2.5 },
      { x: 870, y: 180, r: 1.5, opacity: 0.8, color: '#c084fc', delay: 1.3 },
      { x: 170, y: 210, r: 1.1, opacity: 0.6, color: '#ffffff', delay: 0.6 },
      { x: 380, y: 180, r: 0.8, opacity: 0.5, color: '#38bdf8', delay: 2.8 },
      { x: 740, y: 210, r: 1.3, opacity: 0.7, color: '#ffffff', delay: 1.5 },
      { x: 260, y: 320, r: 0.7, opacity: 0.4, color: '#93c5fd', delay: 0.1 },
      { x: 840, y: 340, r: 1.2, opacity: 0.7, color: '#34d399', delay: 2.0 },
      { x: 670, y: 490, r: 0.9, opacity: 0.6, color: '#fef08a', delay: 1.6 },
      { x: 390, y: 480, r: 1.4, opacity: 0.8, color: '#ffffff', delay: 0.5 },
      { x: 520, y: 160, r: 1.0, opacity: 0.6, color: '#67e8f9', delay: 2.3 },
      { x: 580, y: 530, r: 1.3, opacity: 0.7, color: '#c084fc', delay: 1.0 }
    ],
    []
  );

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Cluster statistics calculation for Pillar Progress Rings
  const pillarStats = useMemo(() => {
    const map = new Map<string, { total: number; completed: number; processing: number; pending_review: number; not_started: number; percent: number }>();
    const pillars = nodes.filter((n) => n.type === 'pillar');

    pillars.forEach((p) => {
      // Find all child keywords belonging to this pillar
      const clusterDescendants = nodes.filter((n) => n.pillarId === p.id || n.parentId === p.id || n.id === p.id);
      const total = clusterDescendants.length;
      let completed = 0;
      let processing = 0;
      let pending_review = 0;
      let not_started = 0;

      clusterDescendants.forEach((n) => {
        const s = n.aggregate_status || resolveAggregateStatus(n.status, n.publishedUrl);
        if (s === 'completed') completed++;
        else if (s === 'processing') processing++;
        else if (s === 'pending_review') pending_review++;
        else not_started++;
      });

      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      map.set(p.id, { total, completed, processing, pending_review, not_started, percent });
    });

    return map;
  }, [nodes]);

  // Global Content Production KPI
  const globalStats = useMemo(() => {
    const total = nodes.length;
    let completed = 0;
    let processing = 0;
    let pending_review = 0;
    let not_started = 0;

    nodes.forEach((n) => {
      const s = n.aggregate_status || resolveAggregateStatus(n.status, n.publishedUrl);
      if (s === 'completed') completed++;
      else if (s === 'processing') processing++;
      else if (s === 'pending_review') pending_review++;
      else not_started++;
    });

    const completionPercent = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';
    return { total, completed, processing, pending_review, not_started, completionPercent };
  }, [nodes]);

  // Selected Node lookup
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Linked Article lookup
  const linkedArticle = useMemo(() => {
    if (!selectedNode) return null;
    return articles.find((a) => a.keywordId === selectedNode.id || a.id === selectedNode.articleId);
  }, [selectedNode, articles]);

  // Calculate layout coordinates centered around Pillars
  const positionedNodes = useMemo(() => {
    const pillars = nodes.filter((n) => n.type === 'pillar');
    const width = 1100;
    const height = 700;
    const centerX = width / 2;
    const centerY = height / 2;

    const result: (KeywordNode & {
      px: number;
      py: number;
      radius: number;
      color: string;
      strokeColor: string;
      aggregateStatus: ContentProductionStatus;
      clusterPercent: number;
      labelOffset: { x: number; y: number };
    })[] = [];

    // Helper to get color code
    const getStatusColors = (status: ContentProductionStatus) => {
      switch (status) {
        case 'completed':
          return { bg: '#10b981', stroke: '#059669' }; // Emerald Green
        case 'pending_review':
          return { bg: '#f59e0b', stroke: '#d97706' }; // Amber / Orange
        case 'processing':
          return { bg: '#3b82f6', stroke: '#2563eb' }; // Blue
        case 'not_started':
        default:
          return { bg: '#64748b', stroke: '#475569' }; // Slate Gray
      }
    };

    // Helper to calculate final dynamic node coordinate
    let globalNodeIndex = 0;
    const computeFinalCoords = (
      id: string,
      type: KeywordNodeType,
      calcX: number,
      calcY: number
    ) => {
      globalNodeIndex++;
      const userPos = nodePositions[id];
      const baseX = userPos?.x ?? calcX;
      const baseY = userPos?.y ?? calcY;

      // When in nebula drift mode and not actively dragged, apply gentle organic oscillation
      if (motionMode === 'drift' && draggedNodeId !== id) {
        const amp = type === 'pillar' ? 2.0 : type === 'cluster' ? 3.2 : 4.5;
        const fx = Math.sin(animationTick + globalNodeIndex * 1.4) * amp;
        const fy = Math.cos(animationTick + globalNodeIndex * 1.7) * amp;
        return { px: baseX + fx, py: baseY + fy };
      }

      // In galaxy mode with user-pinned node, add minor cosmic micro-wobble
      if (motionMode === 'galaxy' && userPos && draggedNodeId !== id) {
        const fx = Math.sin(animationTick * 0.5 + globalNodeIndex) * 1.2;
        const fy = Math.cos(animationTick * 0.5 + globalNodeIndex) * 1.2;
        return { px: baseX + fx, py: baseY + fy };
      }

      return { px: baseX, py: baseY };
    };

    // 1. Position Pillars in a celestial ring around Galactic Center (550, 350)
    pillars.forEach((pillar, pIdx) => {
      const basePAngle = (pIdx / Math.max(pillars.length, 1)) * 2 * Math.PI - Math.PI / 2;
      const pAngleActive =
        motionMode === 'galaxy' && pillars.length > 1
          ? basePAngle + animationTick * 0.05 * orbitSpeed
          : basePAngle;
      const pDist = pillars.length === 1 ? 0 : 165;
      const calcX = centerX + Math.cos(pAngleActive) * pDist;
      const calcY = centerY + Math.sin(pAngleActive) * pDist;
      const { px, py } = computeFinalCoords(pillar.id, 'pillar', calcX, calcY);

      const pStatus = pillar.aggregate_status || resolveAggregateStatus(pillar.status, pillar.publishedUrl);
      const colors = getStatusColors(pStatus);
      const stats = pillarStats.get(pillar.id) || { percent: 0 };

      result.push({
        ...pillar,
        px,
        py,
        radius: 36,
        color: colors.bg,
        strokeColor: colors.stroke,
        aggregateStatus: pStatus,
        clusterPercent: stats.percent,
        labelOffset: { x: 0, y: py > centerY ? 48 : -48 }
      });

      // 2. Position Clusters in planetary orbit around their respective Pillar Star
      const clusters = nodes.filter((n) => (n.parentId === pillar.id || n.pillarId === pillar.id) && n.type === 'cluster');
      clusters.forEach((cluster, cIdx) => {
        const spread = Math.PI * 0.75;
        const baseCAngle = basePAngle - spread / 2 + ((cIdx + 0.5) / Math.max(clusters.length, 1)) * spread;
        const cAngleActive =
          motionMode === 'galaxy'
            ? baseCAngle + animationTick * 0.18 * orbitSpeed
            : baseCAngle;
        const cDist = 145;
        const calcClusterX = px + Math.cos(cAngleActive) * cDist;
        const calcClusterY = py + Math.sin(cAngleActive) * cDist;
        const { px: cx, py: cy } = computeFinalCoords(cluster.id, 'cluster', calcClusterX, calcClusterY);

        const cStatus = cluster.aggregate_status || resolveAggregateStatus(cluster.status, cluster.publishedUrl);
        const cColors = getStatusColors(cStatus);

        result.push({
          ...cluster,
          px: cx,
          py: cy,
          radius: 23,
          color: cColors.bg,
          strokeColor: cColors.stroke,
          aggregateStatus: cStatus,
          clusterPercent: 0,
          labelOffset: { x: cx > centerX ? 28 : -28, y: cy > centerY ? 28 : -28 }
        });

        // 3. Position Articles in lunar orbit around their respective Planet Cluster
        const arts = nodes.filter((n) => n.parentId === cluster.id && n.type === 'article');
        arts.forEach((art, aIdx) => {
          const aSpread = Math.PI * 0.7;
          const baseAAngle = baseCAngle - aSpread / 2 + ((aIdx + 0.5) / Math.max(arts.length, 1)) * aSpread;
          const aAngleActive =
            motionMode === 'galaxy'
              ? baseAAngle + animationTick * 0.42 * orbitSpeed
              : baseAAngle;
          const aDist = 108;
          const calcArtX = cx + Math.cos(aAngleActive) * aDist;
          const calcArtY = cy + Math.sin(aAngleActive) * aDist;
          const { px: ax, py: ay } = computeFinalCoords(art.id, 'article', calcArtX, calcArtY);

          const aStatus = art.aggregate_status || resolveAggregateStatus(art.status, art.publishedUrl);
          const aColors = getStatusColors(aStatus);

          result.push({
            ...art,
            px: ax,
            py: ay,
            radius: 17,
            color: aColors.bg,
            strokeColor: aColors.stroke,
            aggregateStatus: aStatus,
            clusterPercent: 0,
            labelOffset: { x: ax > centerX ? 22 : -22, y: 20 }
          });

          // 4. Position Variants in satellite orbit around their respective Article Moon
          const variants = nodes.filter((n) => n.parentId === art.id && n.type === 'variant');
          variants.forEach((v, vIdx) => {
            const baseVAngle = baseAAngle + (vIdx - (variants.length - 1) / 2) * 0.48;
            const vAngleActive =
              motionMode === 'galaxy'
                ? baseVAngle + animationTick * 0.82 * orbitSpeed
                : baseVAngle;
            const vDist = 68;
            const calcVx = ax + Math.cos(vAngleActive) * vDist;
            const calcVy = ay + Math.sin(vAngleActive) * vDist;
            const { px: vx, py: vy } = computeFinalCoords(v.id, 'variant', calcVx, calcVy);

            const vStatus = v.aggregate_status || resolveAggregateStatus(v.status, v.publishedUrl);
            const vColors = getStatusColors(vStatus);

            result.push({
              ...v,
              px: vx,
              py: vy,
              radius: 11,
              color: vColors.bg,
              strokeColor: vColors.stroke,
              aggregateStatus: vStatus,
              clusterPercent: 0,
              labelOffset: { x: vx > centerX ? 14 : -14, y: 14 }
            });
          });
        });
      });
    });

    // Handle any orphan nodes not connected to a known pillar
    const placedIds = new Set(result.map((r) => r.id));
    const orphans = nodes.filter((n) => !placedIds.has(n.id));
    orphans.forEach((orp, oIdx) => {
      const baseOAngle = (oIdx / Math.max(orphans.length, 1)) * 2 * Math.PI;
      const oAngleActive =
        motionMode === 'galaxy'
          ? baseOAngle + animationTick * 0.08 * orbitSpeed
          : baseOAngle;
      const calcOx = centerX + Math.cos(oAngleActive) * 320;
      const calcOy = centerY + Math.sin(oAngleActive) * 260;
      const { px: ox, py: oy } = computeFinalCoords(orp.id, orp.type, calcOx, calcOy);
      const s = orp.aggregate_status || resolveAggregateStatus(orp.status, orp.publishedUrl);
      const colors = getStatusColors(s);

      result.push({
        ...orp,
        px: ox,
        py: oy,
        radius: orp.type === 'pillar' ? 36 : orp.type === 'cluster' ? 23 : 15,
        color: colors.bg,
        strokeColor: colors.stroke,
        aggregateStatus: s,
        clusterPercent: 0,
        labelOffset: { x: 0, y: 20 }
      });
    });

    return result;
  }, [nodes, pillarStats, nodePositions, draggedNodeId, motionMode, orbitSpeed, animationTick]);

  // Connected nodes map for highlighting
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const set = new Set<string>([selectedNodeId]);
    edges.forEach((e) => {
      if (e.source === selectedNodeId) set.add(e.target);
      if (e.target === selectedNodeId) set.add(e.source);
    });
    return set;
  }, [selectedNodeId, edges]);

  // Filter Match Checker
  const isNodeMatched = useCallback(
    (node: typeof positionedNodes[0]) => {
      const matchSearch =
        searchTerm.trim() === '' ||
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (node.pillarName && node.pillarName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (node.clusterName && node.clusterName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (node.channel && node.channel.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'all' || node.aggregateStatus === statusFilter;
      const matchType = typeFilter === 'all' || node.type === typeFilter;

      return matchSearch && matchStatus && matchType;
    },
    [searchTerm, statusFilter, typeFilter]
  );

  // Click Statistics = Drill-Down Graph directly
  const handleStatClick = (status: 'all' | ContentProductionStatus) => {
    setStatusFilter(status);
    setToastMessage({
      text: `Đã lọc đồ thị: ${
        status === 'all'
          ? 'Tất cả từ khóa'
          : status === 'completed'
          ? 'Đã hoàn thành (Published)'
          : status === 'pending_review'
          ? 'Chờ duyệt (Pending Review)'
          : status === 'processing'
          ? 'Đang xử lý (In Progress)'
          : 'Chưa viết (Not Started)'
      }`,
      type: 'info'
    });

    // Auto-focus on first matched node if available
    const firstMatched = positionedNodes.find((n) => (status === 'all' ? true : n.aggregateStatus === status));
    if (firstMatched) {
      setSelectedNodeId(firstMatched.id);
    }
  };

  // Zoom and Pan Handlers (Smooth step, presets, wheel, pinch)
  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.min(Math.max(prev + delta, 0.3), 3.0);
      return Number(next.toFixed(2));
    });
  };

  const handleSetPresetZoom = (level: number) => {
    setZoomLevel(level);
    setToastMessage({
      text: `🔭 Tỉ lệ góc nhìn: ${(level * 100).toFixed(0)}%`,
      type: 'info'
    });
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setToastMessage({
      text: '🎯 Đã căn giữa toàn cảnh đồ thị thiên hà',
      type: 'info'
    });
  };

  // Mouse wheel zoom with focal zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoomLevel((prev) => {
      const nextZoom = Math.min(Math.max(prev * zoomFactor, 0.3), 3.0);
      return Number(nextZoom.toFixed(2));
    });
  };

  // Reset dragged node positions back to concentric rings
  const handleResetNodePositions = () => {
    setNodePositions({});
    setToastMessage({
      text: '🔄 Đã khôi phục toàn bộ vị trí các node về quỹ đạo thiên hà chuẩn!',
      type: 'info'
    });
  };

  // Double Click Node to Focal Zoom & Select
  const handleNodeDoubleClick = (node: typeof positionedNodes[0]) => {
    setZoomLevel(1.6);
    setPanOffset({
      x: -(node.px - 550) * 1.6,
      y: -(node.py - 350) * 1.6
    });
    setSelectedNodeId(node.id);
    setToastMessage({
      text: `🪐 Đã phóng to tiêu điểm vào node: "${node.label}"`,
      type: 'info'
    });
  };

  // Helper to convert screen mouse/touch point to SVG canvas coordinate space
  const getSvgCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 550, y: 350 };
      const rect = containerRef.current.getBoundingClientRect();
      const baseScaleX = rect.width / 1100;
      const baseScaleY = rect.height / 700;
      const svgX = 550 + (clientX - (rect.left + rect.width / 2) - panOffset.x) / (zoomLevel * baseScaleX);
      const svgY = 350 + (clientY - (rect.top + rect.height / 2) - panOffset.y) / (zoomLevel * baseScaleY);
      return { x: svgX, y: svgY };
    },
    [panOffset, zoomLevel]
  );

  // Canvas Pan Handlers (Single finger / Mouse) & Pinch-to-Zoom (Dual finger)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistRef.current = dist;
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      touchDistRef.current = null;
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y });
    }
  };

  // Node Drag Initiators (Mouse + Touch)
  const handleNodeMouseDown = (
    e: React.MouseEvent,
    node: { id: string; px: number; py: number }
  ) => {
    e.stopPropagation();
    const svgPt = getSvgCoordinates(e.clientX, e.clientY);
    draggedNodeStateRef.current = {
      id: node.id,
      startSvgX: svgPt.x,
      startSvgY: svgPt.y,
      nodeStartX: node.px,
      nodeStartY: node.py,
      hasMoved: false
    };
    setDraggedNodeId(node.id);
  };

  const handleNodeTouchStart = (
    e: React.TouchEvent,
    node: { id: string; px: number; py: number }
  ) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return;
    const svgPt = getSvgCoordinates(e.touches[0].clientX, e.touches[0].clientY);
    draggedNodeStateRef.current = {
      id: node.id,
      startSvgX: svgPt.x,
      startSvgY: svgPt.y,
      nodeStartX: node.px,
      nodeStartY: node.py,
      hasMoved: false
    };
    setDraggedNodeId(node.id);
  };

  // Move Handler (Handles both Node Dragging, Canvas Panning, and Pinch Zoom)
  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. If currently dragging a node
    if (draggedNodeStateRef.current) {
      const targetNodeId = draggedNodeStateRef.current.id;
      const svgPt = getSvgCoordinates(e.clientX, e.clientY);
      const dx = svgPt.x - draggedNodeStateRef.current.startSvgX;
      const dy = svgPt.y - draggedNodeStateRef.current.startSvgY;

      if (Math.hypot(dx, dy) > 3) {
        if (draggedNodeStateRef.current) {
          draggedNodeStateRef.current.hasMoved = true;
        }
      }

      const nodeStartX = draggedNodeStateRef.current?.nodeStartX ?? svgPt.x;
      const nodeStartY = draggedNodeStateRef.current?.nodeStartY ?? svgPt.y;
      const newX = Math.max(30, Math.min(1070, nodeStartX + dx));
      const newY = Math.max(30, Math.min(670, nodeStartY + dy));

      setNodePositions((prev) => ({
        ...prev,
        [targetNodeId]: { x: newX, y: newY }
      }));
      return;
    }

    // 2. If panning canvas
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Two-finger Pinch Zoom
    if (e.touches.length === 2 && touchDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchDistRef.current;
      if (Math.abs(ratio - 1) > 0.015) {
        setZoomLevel((prev) => {
          const next = Math.min(Math.max(prev * (ratio > 1 ? 1.04 : 0.96), 0.3), 3.0);
          return Number(next.toFixed(2));
        });
        touchDistRef.current = dist;
      }
      return;
    }

    // Single-finger Node Drag or Canvas Pan
    if (e.touches.length !== 1) return;
    const clientX = e.touches[0].clientX;
    const clientY = e.touches[0].clientY;

    if (draggedNodeStateRef.current) {
      const targetNodeId = draggedNodeStateRef.current.id;
      const svgPt = getSvgCoordinates(clientX, clientY);
      const dx = svgPt.x - draggedNodeStateRef.current.startSvgX;
      const dy = svgPt.y - draggedNodeStateRef.current.startSvgY;

      if (Math.hypot(dx, dy) > 3) {
        if (draggedNodeStateRef.current) {
          draggedNodeStateRef.current.hasMoved = true;
        }
      }

      const nodeStartX = draggedNodeStateRef.current?.nodeStartX ?? svgPt.x;
      const nodeStartY = draggedNodeStateRef.current?.nodeStartY ?? svgPt.y;
      const newX = Math.max(30, Math.min(1070, nodeStartX + dx));
      const newY = Math.max(30, Math.min(670, nodeStartY + dy));

      setNodePositions((prev) => ({
        ...prev,
        [targetNodeId]: { x: newX, y: newY }
      }));
      return;
    }

    if (isDragging) {
      setPanOffset({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y
      });
    }
  };

  // Drag / Click Finisher
  const handleMouseUp = () => {
    if (draggedNodeStateRef.current) {
      const { id, hasMoved } = draggedNodeStateRef.current;
      draggedNodeStateRef.current = null;
      setDraggedNodeId(null);
      if (!hasMoved) {
        const clickedNode = nodes.find((n) => n.id === id);
        if (clickedNode) handleNodeClick(clickedNode);
      }
      return;
    }
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // Node Click handler
  const handleNodeClick = (node: KeywordNode) => {
    setSelectedNodeId(node.id);
    setIsMobileDrawerOpen(true);
  };

  // ==========================================
  // REALTIME CONTENT PIPELINE ACTIONS
  // ==========================================

  // 1. Start Writing Action (not_started -> processing)
  const handleStartWriting = (node: KeywordNode) => {
    const updatedNode: KeywordNode = {
      ...node,
      status: 'processing',
      aggregate_status: 'processing',
      currentStep: 'Bước 1/4: Phân tích đối thủ SERP & Lập dàn ý cấu trúc bài viết',
      progressPercent: 25,
      startedAt: new Date().toISOString().slice(0, 10),
      lastUpdated: new Date().toISOString().slice(0, 10),
      contentTitle: node.contentTitle || node.suggestedArticleTitle || `Cẩm Nang Hướng Dẫn Về ${node.label} 2026`
    };

    setNodes((prev) => prev.map((n) => (n.id === node.id ? updatedNode : n)));
    onSaveKeyword?.(updatedNode);
    setToastMessage({
      text: `🚀 Đã khởi chạy AI Generator cho "${node.label}"! Node chuyển sang màu Xanh Dương.`,
      type: 'success'
    });

    // Simulate pipeline progression
    const timer = setTimeout(() => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === node.id
            ? {
                ...n,
                currentStep: 'Bước 2/4: Soạn thảo bài viết & Tối ưu chuẩn SEO On-Page',
                progressPercent: 65
              }
            : n
        )
      );
    }, 2500);

    const timer2 = setTimeout(() => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === node.id
            ? {
                ...n,
                status: 'pending_review',
                aggregate_status: 'pending_review',
                currentStep: 'Bước 3/4: Đã tạo xong bài viết, chờ biên tập viên duyệt',
                progressPercent: 90
              }
            : n
        )
      );
      setToastMessage({
        text: `✨ Bài viết "${node.label}" đã soạn thảo xong! Chuyển sang trạng thái Chờ Duyệt (Màu Cam).`,
        type: 'info'
      });
    }, 5500);
  };

  // 2. Approve & Auto Publish Action (pending_review -> completed)
  const handleApproveAndPublish = (node: KeywordNode) => {
    const slug = node.label.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const publishedUrl = `https://bizone-steel.vn/bai-viet/${slug || 'bai-viet-moi'}`;

    const updatedNode: KeywordNode = {
      ...node,
      status: 'completed',
      aggregate_status: 'completed',
      publishedUrl: publishedUrl,
      publishedAt: new Date().toISOString().slice(0, 10),
      lastUpdated: new Date().toISOString().slice(0, 10),
      progressPercent: 100,
      currentStep: 'Đã xuất bản thành công lên Website'
    };

    setNodes((prev) => prev.map((n) => (n.id === node.id ? updatedNode : n)));
    onSaveKeyword?.(updatedNode);
    setToastMessage({
      text: `🎉 Đã xuất bản thành công bài viết "${node.label}"! Node chuyển sang Xanh Lá ✓`,
      type: 'success'
    });
  };

  // 3. Request Edit Action (pending_review -> processing)
  const handleRequestEdit = (node: KeywordNode) => {
    const updatedNode: KeywordNode = {
      ...node,
      status: 'processing',
      aggregate_status: 'processing',
      currentStep: 'Đang hiệu chỉnh nội dung theo yêu cầu biên tập viên',
      progressPercent: 60,
      lastUpdated: new Date().toISOString().slice(0, 10)
    };

    setNodes((prev) => prev.map((n) => (n.id === node.id ? updatedNode : n)));
    onSaveKeyword?.(updatedNode);
    setToastMessage({
      text: `Đã gửi yêu cầu chỉnh sửa cho "${node.label}".`,
      type: 'info'
    });
  };

  // 4. Batch Write All Cluster Keywords (Pillar node action)
  const handleBatchWriteCluster = (pillarNode: KeywordNode) => {
    const clusterKeywords = nodes.filter(
      (n) => (n.pillarId === pillarNode.id || n.parentId === pillarNode.id) && (n.aggregate_status === 'not_started' || !n.aggregate_status)
    );

    if (clusterKeywords.length === 0) {
      setToastMessage({
        text: `Cụm "${pillarNode.label}" không còn từ khóa nào ở trạng thái Chưa viết.`,
        type: 'info'
      });
      return;
    }

    setNodes((prev) =>
      prev.map((n) => {
        if ((n.pillarId === pillarNode.id || n.parentId === pillarNode.id) && (n.aggregate_status === 'not_started' || !n.aggregate_status)) {
          return {
            ...n,
            status: 'processing',
            aggregate_status: 'processing',
            currentStep: 'Đang chạy Batch AI Generator cho toàn bộ cụm',
            progressPercent: 30,
            startedAt: new Date().toISOString().slice(0, 10)
          };
        }
        return n;
      })
    );

    setToastMessage({
      text: `⚡ Đang xử lý tự động đồng loạt ${clusterKeywords.length} từ khóa trong cụm "${pillarNode.label}"!`,
      type: 'success'
    });
  };

  // Excel Import Success Callback
  const handleImportSuccess = (
    newNodes: KeywordNode[],
    newEdges: KeywordEdge[],
    summary: { added: number; updated: number; total: number }
  ) => {
    setNodes(newNodes);
    if (newEdges.length > 0) {
      setEdges((prev) => [...prev, ...newEdges]);
    }
    onBatchUpdateNodes?.(newNodes, newEdges);

    setToastMessage({
      text: `✅ Nhập Excel thành công: +${summary.added} Tạo mới · ${summary.updated} Cập nhật · Tổng ${summary.total} node trên đồ thị!`,
      type: 'success'
    });

    if (newNodes.length > 0) {
      setSelectedNodeId(newNodes[0].id);
    }
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />
          )}
          <span className="text-xs font-bold">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP CONTROL CENTER & LIVE PROGRESS BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        {/* KPI Headline & Mini Progress Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Content Control Center
              </span>
              <span className="text-xs text-slate-400 font-medium">
                • {nodes.filter((n) => n.type === 'pillar').length} Trụ Cột • {nodes.filter((n) => n.type === 'cluster').length} Cụm Chuyên Đề
              </span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Đã hoàn thành <span className="text-emerald-600">{globalStats.completed}</span> / {globalStats.total} Từ Khóa
              </h2>
              <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-xl border border-emerald-200">
                {globalStats.completionPercent}% Tiến Độ
              </span>
            </div>
          </div>

          {/* Mini Realtime Progress Bar */}
          <div className="w-full lg:w-96 space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span>Tiến độ sản xuất nội dung</span>
              <span className="text-emerald-600">{globalStats.completed}/{globalStats.total} Bài Đã Đăng</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(globalStats.completed / Math.max(globalStats.total, 1)) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500 h-full"
                title={`Đã hoàn thành: ${globalStats.completed}`}
              />
              <div
                style={{ width: `${(globalStats.pending_review / Math.max(globalStats.total, 1)) * 100}%` }}
                className="bg-amber-500 transition-all duration-500 h-full"
                title={`Chờ duyệt: ${globalStats.pending_review}`}
              />
              <div
                style={{ width: `${(globalStats.processing / Math.max(globalStats.total, 1)) * 100}%` }}
                className="bg-blue-500 transition-all duration-500 h-full"
                title={`Đang xử lý: ${globalStats.processing}`}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons & Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Drill-Down Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              type="button"
              onClick={() => handleStatClick('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>Tất cả</span>
              <span className="px-1.5 py-0.2 bg-white/20 rounded-md text-[10px] font-black">{globalStats.total}</span>
            </button>

            <button
              type="button"
              onClick={() => handleStatClick('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Đã hoàn thành</span>
              <span className="px-1.5 py-0.2 bg-emerald-700/20 text-emerald-900 rounded-md text-[10px] font-black">
                {globalStats.completed}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStatClick('pending_review')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                statusFilter === 'pending_review'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Chờ duyệt</span>
              <span className="px-1.5 py-0.2 bg-amber-700/20 text-amber-900 rounded-md text-[10px] font-black">
                {globalStats.pending_review}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStatClick('processing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                statusFilter === 'processing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              <span>Đang xử lý</span>
              <span className="px-1.5 py-0.2 bg-blue-700/20 text-blue-900 rounded-md text-[10px] font-black">
                {globalStats.processing}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStatClick('not_started')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                statusFilter === 'not_started'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Chưa viết</span>
              <span className="px-1.5 py-0.2 bg-slate-300 text-slate-800 rounded-md text-[10px] font-black">
                {globalStats.not_started}
              </span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import Excel Vào Graph</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Level Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm từ khóa, chủ đề, kênh đăng, URL..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Level Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tất cả bậc
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('pillar')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                typeFilter === 'pillar' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-indigo-700'
              }`}
            >
              Pillar
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('cluster')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                typeFilter === 'cluster' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-blue-700'
              }`}
            >
              Cluster
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('article')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                typeFilter === 'article' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              Article / Variant
            </button>
          </div>

          {/* Graph Controls Toolbar: Cosmic Motion & Zoom Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Cosmic Motion Mode Segmented Switcher */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setMotionMode('galaxy');
                  setToastMessage({
                    text: '🌌 Kích hoạt chuyển động Quỹ Đạo Thiên Hà (Cosmic Galaxy Orbit)!',
                    type: 'info'
                  });
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  motionMode === 'galaxy'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Chuyển động Thiên Hà: Các cụm từ khóa quay quanh hành tinh chủ theo quỹ đạo vũ trụ"
              >
                <Orbit className={`w-3.5 h-3.5 ${motionMode === 'galaxy' ? 'animate-spin' : ''}`} />
                <span>Thiên Hà</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMotionMode('drift');
                  setToastMessage({
                    text: '🌊 Chuyển sang hiệu ứng trôi dạt sóng hữu cơ (Organic Drift).',
                    type: 'info'
                  });
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  motionMode === 'drift'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Chuyển động Sóng nổi: Các node nhấp nhô hữu cơ nhẹ nhàng"
              >
                <Activity className={`w-3.5 h-3.5 ${motionMode === 'drift' ? 'animate-pulse' : ''}`} />
                <span>Trôi Dạt</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMotionMode('static');
                  setToastMessage({
                    text: '⏸ Đã tạm dừng toàn bộ chuyển động.',
                    type: 'info'
                  });
                }}
                className={`px-2 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  motionMode === 'static'
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Dừng chuyển động (Tĩnh)"
              >
                <span>Tĩnh</span>
              </button>
            </div>

            {/* Orbit Speed Multiplier (Active only in galaxy mode) */}
            {motionMode === 'galaxy' && (
              <div className="flex items-center bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-800 text-xs text-slate-300 gap-1.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tốc độ:</span>
                {[0.5, 1, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => {
                      setOrbitSpeed(spd);
                      setToastMessage({
                        text: `⚡ Tốc độ quay thiên hà: ${spd}x`,
                        type: 'info'
                      });
                    }}
                    className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      orbitSpeed === spd
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            )}

            {/* Toggle Labels */}
            <button
              type="button"
              onClick={() => setShowLabels(!showLabels)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                showLabels
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Nhãn ({showLabels ? 'Bật' : 'Tắt'})</span>
            </button>

            {/* Reset custom dragged positions to concentric rings */}
            <button
              type="button"
              onClick={handleResetNodePositions}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
              title="Khôi phục sắp xếp lại toàn bộ vị trí các node về quỹ đạo chuẩn (Auto Layout)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Zoom Controls & Quick Percentage Badge */}
            <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => handleZoom(-0.15)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                title="Thu nhỏ (Zoom Out / Con lăn chuột)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              {/* Quick Zoom Preset Indicator */}
              <button
                type="button"
                onClick={() => handleSetPresetZoom(zoomLevel === 1 ? 1.5 : zoomLevel === 1.5 ? 0.6 : 1)}
                className="px-2 py-0.5 text-xs font-extrabold text-slate-800 hover:text-indigo-600 transition cursor-pointer"
                title="Bấm để chuyển đổi nhanh các mức zoom: 100% -> 150% -> 60%"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              <button
                type="button"
                onClick={() => handleZoom(0.15)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                title="Phóng to (Zoom In / Con lăn chuột)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleResetView}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition cursor-pointer ml-0.5"
                title="Căn giữa toàn cảnh thiên hà"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT MAP GRID: GRAPH CANVAS (75%) + DETAIL ACTION PANEL (25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Canvas Visualizer */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className={`lg:col-span-8 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative min-h-[620px] h-[680px] select-none ${
            draggedNodeId ? 'cursor-grabbing' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Top Tip Banner with Cosmos Guidance */}
          <div className="absolute top-4 right-4 z-10 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2 shadow-xl pointer-events-none">
            <Orbit className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <span>Lăn chuột zoom • Kéo thả node • Nhấp đúp cận cảnh</span>
          </div>

          {/* Status Color Legend Overlay */}
          <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 text-[11px] text-slate-300 space-y-2 shadow-xl">
            <div className="font-extrabold text-white text-xs flex items-center gap-1.5 pb-1 border-b border-slate-800">
              <Network className="w-3.5 h-3.5 text-emerald-400" />
              <span>Màu Sắc = Trạng Thái Sản Xuất</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30 flex items-center justify-center text-[8px] text-white font-bold">
                ✓
              </span>
              <span>Đã hoàn thành (Có URL thật)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30 flex items-center justify-center text-[8px] text-white font-bold">
                👁
              </span>
              <span>Chờ duyệt (Pending Review)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-2 ring-blue-500/30 flex items-center justify-center text-[8px] text-white font-bold animate-pulse">
                ⚙
              </span>
              <span>Đang xử lý (In Progress)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-500 ring-2 ring-slate-500/30"></span>
              <span>Chưa viết (Not Started)</span>
            </div>
            <div className="pt-1 border-t border-slate-800 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <span>⭕ Vòng tròn Pillar: % Hoàn thành cụm</span>
            </div>
          </div>

          {/* SVG Render Layer */}
          <svg
            className="w-full h-full"
            viewBox="0 0 1100 700"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: '550px 350px',
              transition: isDragging ? 'none' : 'transform 0.12s ease-out'
            }}
          >
            {/* Celestial Universe Gradients & Grid Definition */}
            <defs>
              <pattern id="graph-grid-dark" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.4" strokeOpacity="0.6" />
              </pattern>

              {/* Galactic Core Accretion Glow */}
              <radialGradient id="galactic-core-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
                <stop offset="35%" stopColor="#6366f1" stopOpacity="0.15" />
                <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
              </radialGradient>

              {/* Cosmic Stardust Nebula */}
              <radialGradient id="cosmic-nebula-violet" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.18" />
                <stop offset="50%" stopColor="#6366f1" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#020617" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="cosmic-nebula-emerald" cx="65%" cy="60%" r="55%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="60%" stopColor="#065f46" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#020617" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Grid */}
            <rect width="1100" height="700" fill="url(#graph-grid-dark)" />

            {/* Cosmic Nebula Backdrops */}
            <ellipse cx="550" cy="350" rx="420" ry="290" fill="url(#cosmic-nebula-violet)" />
            <ellipse cx="680" cy="320" rx="340" ry="240" fill="url(#cosmic-nebula-emerald)" />

            {/* Twinkling Cosmic Starfield */}
            <g className="cosmic-starfield">
              {cosmicStars.map((star, sIdx) => {
                const twinkleOpacity =
                  motionMode !== 'static'
                    ? star.opacity * (0.6 + 0.4 * Math.sin(animationTick * 2.5 + star.delay * 3))
                    : star.opacity;
                return (
                  <circle
                    key={sIdx}
                    cx={star.x}
                    cy={star.y}
                    r={star.r}
                    fill={star.color}
                    opacity={twinkleOpacity}
                  />
                );
              })}
            </g>

            {/* Galactic Core Centerpiece Vortex at (550, 350) */}
            <g className="galactic-center" pointerEvents="none">
              <circle cx="550" cy="350" r="180" fill="url(#galactic-core-glow)" />
              {/* Accretion Disk Orbit Lines */}
              <circle
                cx="550"
                cy="350"
                r="165"
                fill="none"
                stroke="rgba(129, 140, 248, 0.15)"
                strokeWidth="1.2"
                strokeDasharray="6 8"
                className={motionMode === 'galaxy' ? 'animate-spin' : ''}
                style={{
                  transformOrigin: '550px 350px',
                  animationDuration: '45s'
                }}
              />
              <circle
                cx="550"
                cy="350"
                r="70"
                fill="none"
                stroke="rgba(56, 189, 248, 0.2)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
              {/* Center galactic singularity pulse */}
              <circle
                cx="550"
                cy="350"
                r={motionMode === 'galaxy' ? 6 + 2 * Math.sin(animationTick * 3) : 6}
                fill="#ffffff"
                opacity="0.85"
              />
              <circle
                cx="550"
                cy="350"
                r={motionMode === 'galaxy' ? 14 + 4 * Math.sin(animationTick * 3) : 14}
                fill="none"
                stroke="#818cf8"
                strokeWidth="1.5"
                opacity="0.4"
              />
            </g>

            {/* Planetary Orbit Trajectory Tracks for Pillars and Clusters */}
            <g className="orbital-tracks" pointerEvents="none">
              {positionedNodes
                .filter((n) => n.type === 'pillar')
                .map((pillar) => {
                  const hasClusters = nodes.some((ch) => ch.parentId === pillar.id || ch.pillarId === pillar.id);
                  if (!hasClusters) return null;
                  return (
                    <circle
                      key={`track-p-${pillar.id}`}
                      cx={pillar.px}
                      cy={pillar.py}
                      r={145}
                      fill="none"
                      stroke="rgba(99, 102, 241, 0.14)"
                      strokeWidth="1"
                      strokeDasharray="4 6"
                    />
                  );
                })}

              {positionedNodes
                .filter((n) => n.type === 'cluster')
                .map((cluster) => {
                  const hasArticles = nodes.some((ch) => ch.parentId === cluster.id && ch.type === 'article');
                  if (!hasArticles) return null;
                  return (
                    <circle
                      key={`track-c-${cluster.id}`}
                      cx={cluster.px}
                      cy={cluster.py}
                      r={108}
                      fill="none"
                      stroke="rgba(56, 189, 248, 0.1)"
                      strokeWidth="0.8"
                      strokeDasharray="3 5"
                    />
                  );
                })}
            </g>

            {/* Edge Lines Layer */}
            <g className="edges">
              {edges.map((edge) => {
                const srcNode = positionedNodes.find((n) => n.id === edge.source);
                const tgtNode = positionedNodes.find((n) => n.id === edge.target);
                if (!srcNode || !tgtNode) return null;

                const isConnected =
                  selectedNodeId &&
                  (connectedNodeIds.has(srcNode.id) && connectedNodeIds.has(tgtNode.id));

                const isDraggedEdge =
                  draggedNodeId &&
                  (srcNode.id === draggedNodeId || tgtNode.id === draggedNodeId);

                const isSrcMatched = isNodeMatched(srcNode);
                const isTgtMatched = isNodeMatched(tgtNode);
                const isDimmed = !isSrcMatched && !isTgtMatched && srcNode.type !== 'pillar' && tgtNode.type !== 'pillar';

                return (
                  <line
                    key={edge.id}
                    x1={srcNode.px}
                    y1={srcNode.py}
                    x2={tgtNode.px}
                    y2={tgtNode.py}
                    stroke={isDraggedEdge ? '#38bdf8' : isConnected ? '#38bdf8' : isTgtMatched ? '#10b981' : '#334155'}
                    strokeWidth={isDraggedEdge ? 3 : isConnected ? 2.5 : 1}
                    strokeOpacity={isDimmed ? 0.08 : isDraggedEdge ? 1 : isConnected ? 0.95 : 0.45}
                    strokeDasharray={isDraggedEdge ? '5 3' : edge.relationType === 'internal_link' ? '4 3' : 'none'}
                  />
                );
              })}
            </g>

            {/* Nodes Render Layer */}
            <g className="nodes">
              {positionedNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isConnected = selectedNodeId && connectedNodeIds.has(node.id);
                const isBeingDragged = draggedNodeId === node.id;
                const isMatched = isNodeMatched(node);
                const isPillar = node.type === 'pillar';

                // Opacity rule: Non-matching nodes dim to 0.15, but Pillar nodes stay visible to maintain cluster context!
                const nodeOpacity = isMatched ? 1.0 : isPillar ? 0.75 : 0.15;

                // Progress Ring for Pillar
                const ringRadius = node.radius + 6;
                const circumference = 2 * Math.PI * ringRadius;
                const strokeDashoffset = circumference - (node.clusterPercent / 100) * circumference;

                return (
                  <g
                    key={node.id}
                    onMouseDown={(e) => handleNodeMouseDown(e, node)}
                    onTouchStart={(e) => handleNodeTouchStart(e, node)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleNodeDoubleClick(node);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    opacity={nodeOpacity}
                    className={`cursor-grab active:cursor-grabbing group transition-opacity duration-200 ${
                      isBeingDragged ? 'scale-110' : ''
                    }`}
                  >
                    {/* Active Drag Ring & Halo */}
                    {isBeingDragged && (
                      <circle
                        cx={node.px}
                        cy={node.py}
                        r={node.radius + (isPillar ? 18 : 12)}
                        fill="rgba(56, 189, 248, 0.25)"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeDasharray="4 3"
                        className="animate-spin"
                        style={{ transformOrigin: `${node.px}px ${node.py}px` }}
                      />
                    )}

                    {/* Pulsing glow ring when selected */}
                    {isSelected && !isBeingDragged && (
                      <circle
                        cx={node.px}
                        cy={node.py}
                        r={node.radius + (isPillar ? 14 : 9)}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                        className="animate-spin"
                        style={{ transformOrigin: `${node.px}px ${node.py}px` }}
                      />
                    )}

                    {/* Progress Ring for Pillar Nodes */}
                    {isPillar && (
                      <g>
                        {/* Background track circle */}
                        <circle
                          cx={node.px}
                          cy={node.py}
                          r={ringRadius}
                          fill="none"
                          stroke="#1e293b"
                          strokeWidth="3.5"
                        />
                        {/* Dynamic Progress Ring in Emerald */}
                        <circle
                          cx={node.px}
                          cy={node.py}
                          r={ringRadius}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3.5"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          style={{
                            transform: 'rotate(-90deg)',
                            transformOrigin: `${node.px}px ${node.py}px`,
                            transition: 'stroke-dashoffset 0.5s ease'
                          }}
                        />
                        {/* Cluster completion % badge floating above Pillar */}
                        <g transform={`translate(${node.px}, ${node.py - node.radius - 12})`}>
                          <rect
                            x={-18}
                            y={-8}
                            width={36}
                            height={16}
                            rx={6}
                            fill="#064e3b"
                            stroke="#10b981"
                            strokeWidth="1"
                          />
                          <text
                            x={0}
                            y={3.5}
                            textAnchor="middle"
                            fill="#34d399"
                            fontSize="8.5px"
                            fontWeight="bold"
                            pointerEvents="none"
                          >
                            {node.clusterPercent}%
                          </text>
                        </g>
                      </g>
                    )}

                    {/* Main Node Circle */}
                    <circle
                      cx={node.px}
                      cy={node.py}
                      r={node.radius}
                      fill={node.color}
                      stroke={isBeingDragged ? '#38bdf8' : isSelected ? '#ffffff' : isConnected ? '#38bdf8' : node.strokeColor}
                      strokeWidth={isBeingDragged ? 4 : isSelected ? 3.5 : isPillar ? 2.5 : 2}
                      className="transition-transform duration-200 group-hover:scale-120 drop-shadow-md"
                      style={{ transformOrigin: `${node.px}px ${node.py}px` }}
                    />

                    {/* Internal Status Icon / Text inside Node */}
                    {node.aggregateStatus === 'completed' ? (
                      <text
                        x={node.px}
                        y={node.py + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={isPillar ? '14px' : '11px'}
                        fontWeight="black"
                        pointerEvents="none"
                      >
                        ✓
                      </text>
                    ) : node.aggregateStatus === 'pending_review' ? (
                      <text
                        x={node.px}
                        y={node.py + 3.5}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={isPillar ? '12px' : '9.5px'}
                        fontWeight="black"
                        pointerEvents="none"
                      >
                        👁
                      </text>
                    ) : node.aggregateStatus === 'processing' ? (
                      <text
                        x={node.px}
                        y={node.py + 3.5}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={isPillar ? '12px' : '9.5px'}
                        fontWeight="black"
                        pointerEvents="none"
                      >
                        ⚙
                      </text>
                    ) : (
                      <text
                        x={node.px}
                        y={node.py + 3.5}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize={isPillar ? '10px' : '8px'}
                        fontWeight="bold"
                        pointerEvents="none"
                      >
                        {isPillar ? 'P' : node.type === 'cluster' ? 'C' : ''}
                      </text>
                    )}

                    {/* Node Label Text */}
                    {showLabels && (
                      <g transform={`translate(${node.px + node.labelOffset.x}, ${node.py + node.labelOffset.y})`}>
                        <rect
                          x={-Math.min(node.label.length * 3.8, 85)}
                          y={-10}
                          width={Math.min(node.label.length * 7.6, 170)}
                          height={20}
                          rx={6}
                          fill="#0f172a"
                          fillOpacity="0.9"
                          stroke={isSelected ? '#38bdf8' : isPillar ? '#10b981' : '#1e293b'}
                          strokeWidth="1"
                        />
                        <text
                          x={0}
                          y={4}
                          textAnchor="middle"
                          fill={isSelected ? '#38bdf8' : isPillar ? '#34d399' : '#e2e8f0'}
                          fontSize="9.5px"
                          fontWeight={isSelected || isPillar ? 'bold' : 'medium'}
                          pointerEvents="none"
                        >
                          {node.label.length > 24 ? `${node.label.slice(0, 22)}...` : node.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* CONTENT ACTION PANEL (Right Side on Desktop / Bottom Sheet on Mobile) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between space-y-4">
          {selectedNode ? (
            <div className="space-y-4">
              {/* Header Title & Status Badge */}
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        selectedNode.type === 'pillar'
                          ? 'bg-indigo-100 text-indigo-900'
                          : selectedNode.type === 'cluster'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      {selectedNode.type.toUpperCase()}
                    </span>

                    {/* Status Pill */}
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 ${
                        (selectedNode.aggregate_status || resolveAggregateStatus(selectedNode.status, selectedNode.publishedUrl)) === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : (selectedNode.aggregate_status || resolveAggregateStatus(selectedNode.status, selectedNode.publishedUrl)) === 'pending_review'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : (selectedNode.aggregate_status || resolveAggregateStatus(selectedNode.status, selectedNode.publishedUrl)) === 'processing'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {(selectedNode.aggregate_status || resolveAggregateStatus(selectedNode.status, selectedNode.publishedUrl)) === 'completed' && '✓ Đã hoàn thành'}
                      {(selectedNode.aggregate_status || resolveAggregateStatus(selectedNode.status, selectedNode.publishedUrl)) === 'pending_review' && '👁 Chờ duyệt bài'}
                      {(selectedNode.aggregate_status || resolveAggregateStatus(selectedNode.status, selectedNode.publishedUrl)) === 'processing' && '⚙ Đang xử lý AI'}
                      {(selectedNode.aggregate_status || resolveAggregateStatus(selectedNode.status, selectedNode.publishedUrl)) === 'not_started' && 'Chưa viết'}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-slate-400">
                    {selectedNode.channel || 'Website / Blog'}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {selectedNode.label}
                </h3>
              </div>

              {/* Special Pillar Cluster Overview */}
              {selectedNode.type === 'pillar' && (
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-black text-indigo-950">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      Tiến Độ Hoàn Thành Trụ Cột (Cluster)
                    </span>
                    <span className="text-emerald-700 font-extrabold text-sm">
                      {pillarStats.get(selectedNode.id)?.percent || 0}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-xl border border-indigo-100">
                      <div className="text-[10px] text-slate-500 font-medium">Tổng số từ khóa</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">
                        {pillarStats.get(selectedNode.id)?.total || 0}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-indigo-100">
                      <div className="text-[10px] text-emerald-600 font-medium">Đã xuất bản</div>
                      <div className="text-sm font-black text-emerald-600 mt-0.5">
                        {pillarStats.get(selectedNode.id)?.completed || 0}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-indigo-100">
                      <div className="text-[10px] text-slate-500 font-medium">Chưa viết</div>
                      <div className="text-sm font-black text-slate-600 mt-0.5">
                        {pillarStats.get(selectedNode.id)?.not_started || 0}
                      </div>
                    </div>
                  </div>

                  {(pillarStats.get(selectedNode.id)?.not_started || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => handleBatchWriteCluster(selectedNode)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Viết toàn bộ cụm chưa viết (Batch AI)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Keyword Metadata Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tìm kiếm / Tháng:</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    {selectedNode.searchVolume.toLocaleString('vi-VN')}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Độ khó (KD):</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    <span className={selectedNode.difficulty > 50 ? 'text-rose-600' : 'text-emerald-600'}>
                      {selectedNode.difficulty}/100
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Kênh xuất bản:</div>
                  <div className="text-xs font-bold text-indigo-700 mt-0.5">
                    {selectedNode.channel || 'Website / Blog'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ý định tìm kiếm:</div>
                  <div className="text-xs font-bold text-slate-800 capitalize mt-0.5">
                    {selectedNode.intent}
                  </div>
                </div>
              </div>

              {/* CONTENT PRODUCTION ACTION SECTION (Context-Aware) */}
              <div className="space-y-3 pt-1">
                {/* 1. NOT_STARTED STATE */}
                {(selectedNode.aggregate_status || resolveAggregateStatus(selectedNode.status, selectedNode.publishedUrl)) === 'not_started' && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>Chưa có bài viết cho từ khóa này</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Kích hoạt trình tạo bài viết AI để tự động nghiên cứu dàn ý, viết nội dung và tối ưu SEO On-page.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleStartWriting(selectedNode)}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Bắt đầu viết ngay (Auto AI Content)</span>
                    </button>
                  </div>
                )}

                {/* 2. PROCESSING STATE */}
                {(selectedNode.aggregate_status || resolveAggregateStatus(selectedNode.status, selectedNode.publishedUrl)) === 'processing' && (
                  <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                        Tiến trình sản xuất AI đang chạy
                      </span>
                      <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-black">
                        {selectedNode.progressPercent || 45}%
                      </span>
                    </div>

                    <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${selectedNode.progressPercent || 45}%` }}
                        className="bg-blue-600 h-full transition-all duration-300"
                      />
                    </div>

                    <div className="text-[11px] text-blue-800 bg-white p-2.5 rounded-xl border border-blue-100 font-medium">
                      {selectedNode.currentStep || 'Đang nghiên cứu SERP & Tạo cấu trúc bài viết...'}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id
                              ? {
                                  ...n,
                                  status: 'pending_review',
                                  aggregate_status: 'pending_review',
                                  currentStep: 'Hoàn thành bài viết, sẵn sàng duyệt',
                                  progressPercent: 90
                                }
                              : n
                          )
                        );
                        setToastMessage({
                          text: `Đã hoàn tất nhanh bài viết "${selectedNode.label}". Chuyển sang Chờ Duyệt!`,
                          type: 'info'
                        });
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition cursor-pointer"
                    >
                      Đẩy nhanh tiến độ (Chuyển sang Chờ Duyệt)
                    </button>
                  </div>
                )}

                {/* 3. PENDING REVIEW STATE */}
                {(selectedNode.aggregate_status || resolveAggregateStatus(selectedNode.status, selectedNode.publishedUrl)) === 'pending_review' && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between text-xs font-black text-amber-900">
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-amber-600" />
                        Bài viết đã sẵn sàng chờ duyệt
                      </span>
                      <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                        SEO Score: 92/100
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-900 bg-white p-2.5 rounded-xl border border-amber-200/60">
                      {selectedNode.contentTitle || `Báo Giá & Hướng Dẫn Kỹ Thuật Về ${selectedNode.label} 2026`}
                    </div>

                    <p className="text-[11px] text-amber-800">
                      Nội dung đã được tạo 2,450 từ chuẩn SEO, chèn đủ Focus Keyword và Internal Link đề xuất.
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleApproveAndPublish(selectedNode)}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Duyệt & Xuất bản</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRequestEdit(selectedNode)}
                        className="py-2.5 px-3 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Yêu cầu sửa</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. COMPLETED STATE */}
                {(selectedNode.aggregate_status || resolveAggregateStatus(selectedNode.status, selectedNode.publishedUrl)) === 'completed' && (
                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between text-xs font-black text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Đã xuất bản thành công
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        Đang online
                      </span>
                    </div>

                    {selectedNode.publishedUrl && (
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">URL Bài Viết:</div>
                        <a
                          href={selectedNode.publishedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-emerald-700 hover:underline break-all flex items-center gap-1 mt-0.5"
                        >
                          <span>{selectedNode.publishedUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Ngày đăng: {selectedNode.publishedAt || '2026-08-20'}</span>
                      <span>Kênh: {selectedNode.channel || 'Website'}</span>
                    </div>

                    <a
                      href={selectedNode.publishedUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 cursor-pointer text-center"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Xem bài viết trên Website</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <Network className="w-12 h-12 text-slate-300" />
              <p className="text-xs font-medium">
                Nhấp vào bất kỳ node nào trong biểu đồ mạng để xem chi tiết và kích hoạt sản xuất nội dung ngay lập tức.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* EXCEL IMPORT MODAL */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingNodes={nodes}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};
