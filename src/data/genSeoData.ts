import { KeywordNode, KeywordEdge, GenSeoArticle, InternalLinkSuggestion, MascotConfig, ContentProductionStatus } from '../types';

/**
 * Standard status resolver following the exact required business rules:
 * Priority 1: Has valid URL -> 'completed'
 * Priority 2: Has recognized status string -> map to 4 standardized states
 * Priority 3: Default -> 'not_started'
 */
export const resolveAggregateStatus = (
  rawStatus?: string,
  publishedUrl?: string
): ContentProductionStatus => {
  if (publishedUrl && publishedUrl.trim().length > 0 && /^https?:\/\//i.test(publishedUrl.trim())) {
    return 'completed';
  }

  if (!rawStatus) return 'not_started';

  const s = rawStatus.toLowerCase().trim();
  if (s === 'completed' || s === 'published' || s === 'đã hoàn thành' || s === 'đã xuất bản' || s === 'hoàn thành') {
    return 'completed';
  }
  if (s === 'pending_review' || s === 'review' || s === 'chờ duyệt' || s === 'đang duyệt' || s === 'chờ duyệt bài') {
    return 'pending_review';
  }
  if (s === 'processing' || s === 'in_progress' || s === 'đang xử lý' || s === 'đang viết' || s === 'drafting' || s === 'outline' || s === 'research') {
    return 'processing';
  }
  if (s === 'not_started' || s === 'planned' || s === 'chưa viết' || s === 'chưa bắt đầu' || s === 'lên kế hoạch') {
    return 'not_started';
  }

  return 'not_started';
};

export const INITIAL_KEYWORD_NODES: KeywordNode[] = [
  // PILLARS
  {
    id: 'kw-pillar-1',
    label: 'Tôn Thép Xây Dựng',
    type: 'pillar',
    searchVolume: 125000,
    difficulty: 68,
    cpc: 8500,
    intent: 'commercial',
    channel: 'Website / Blog',
    dateCreated: '2026-06-15',
    daysAgo: 67,
    lastUpdated: '2026-08-18',
    status: 'completed',
    aggregate_status: 'completed',
    publishedUrl: 'https://bizone-steel.vn/danh-muc/ton-thep-xay-dung',
    publishedAt: '2026-07-01',
    ranking: 3,
    tags: ['Core', 'High Volume', 'Pillar']
  },
  {
    id: 'kw-pillar-2',
    label: 'Xà Gồ & Thép Hình Kết Cấu',
    type: 'pillar',
    searchVolume: 88000,
    difficulty: 59,
    cpc: 7200,
    intent: 'commercial',
    channel: 'Website / Blog',
    dateCreated: '2026-07-02',
    daysAgo: 50,
    lastUpdated: '2026-08-15',
    status: 'completed',
    aggregate_status: 'completed',
    publishedUrl: 'https://bizone-steel.vn/danh-muc/xa-go-thep-hinh',
    publishedAt: '2026-07-15',
    ranking: 4,
    tags: ['B2B', 'Structural', 'Pillar']
  },
  {
    id: 'kw-pillar-3',
    label: 'Vật Tư Lưới & Kẽm Gai',
    type: 'pillar',
    searchVolume: 45000,
    difficulty: 42,
    cpc: 4800,
    intent: 'transactional',
    channel: 'Shopee & Website',
    dateCreated: '2026-07-10',
    daysAgo: 42,
    lastUpdated: '2026-08-19',
    status: 'processing',
    aggregate_status: 'processing',
    currentStep: 'Soạn thảo nội dung SEO & Kỹ thuật đan lưới B40',
    progressPercent: 45,
    startedAt: '2026-08-19',
    ranking: 6,
    tags: ['Fence', 'High Margin', 'Pillar']
  },
  {
    id: 'kw-pillar-4',
    label: 'Phần Mềm ERP Quản Trị Phân Phối',
    type: 'pillar',
    searchVolume: 32000,
    difficulty: 74,
    cpc: 24000,
    intent: 'commercial',
    channel: 'Website / Blog',
    dateCreated: '2026-08-01',
    daysAgo: 20,
    lastUpdated: '2026-08-20',
    status: 'pending_review',
    aggregate_status: 'pending_review',
    contentTitle: 'Giải Pháp Phần Mềm Quản Trị Phân Phối Sắt Thép BizOne ERP 2026',
    progressPercent: 90,
    ranking: 8,
    tags: ['SaaS', 'BizOne', 'Pillar']
  },

  // CLUSTERS (under Pillar 1: Tôn Thép Xây Dựng)
  {
    id: 'kw-cluster-1-1',
    label: 'Báo Giá Tôn Mạ Kẽm & Tôn Màu',
    type: 'cluster',
    parentId: 'kw-pillar-1',
    pillarId: 'kw-pillar-1',
    pillarName: 'Tôn Thép Xây Dựng',
    searchVolume: 42000,
    difficulty: 55,
    cpc: 6500,
    intent: 'transactional',
    channel: 'Website / Blog',
    dateCreated: '2026-07-10',
    daysAgo: 42,
    lastUpdated: '2026-08-19',
    status: 'completed',
    aggregate_status: 'completed',
    publishedUrl: 'https://bizone-steel.vn/bai-viet/bao-gia-ton-ma-kem-mau-2026',
    publishedAt: '2026-07-20',
    ranking: 2,
    tags: ['Price', 'Hot']
  },
  {
    id: 'kw-cluster-1-2',
    label: 'Tôn Cách Nhiệt PU & Tôn Lạnh',
    type: 'cluster',
    parentId: 'kw-pillar-1',
    pillarId: 'kw-pillar-1',
    pillarName: 'Tôn Thép Xây Dựng',
    searchVolume: 31000,
    difficulty: 48,
    cpc: 5900,
    intent: 'commercial',
    channel: 'Website / Blog',
    dateCreated: '2026-07-18',
    daysAgo: 34,
    lastUpdated: '2026-08-16',
    status: 'processing',
    aggregate_status: 'processing',
    currentStep: 'Lập dàn ý & Thu thập thông số cách âm PU 3 lớp',
    progressPercent: 55,
    startedAt: '2026-08-14',
    ranking: 5,
    tags: ['Insulation', 'Trending']
  },

  // CLUSTERS (under Pillar 2: Xà Gồ & Thép Hình)
  {
    id: 'kw-cluster-2-1',
    label: 'Quy Cách Xà Gồ C & Xà Gồ Z Mạ Kẽm',
    type: 'cluster',
    parentId: 'kw-pillar-2',
    pillarId: 'kw-pillar-2',
    pillarName: 'Xà Gồ & Thép Hình Kết Cấu',
    searchVolume: 26000,
    difficulty: 38,
    cpc: 4500,
    intent: 'informational',
    channel: 'Website / Blog',
    dateCreated: '2026-07-28',
    daysAgo: 24,
    lastUpdated: '2026-08-14',
    status: 'not_started',
    aggregate_status: 'not_started',
    suggestedArticleTitle: 'Bảng Tra Quy Cách & Trọng Lượng Xà Gồ C / Z Đục Lỗ',
    ranking: 7,
    tags: ['Specs', 'Guide']
  },
  {
    id: 'kw-cluster-2-2',
    label: 'Thép Hộp Mạ Kẽm Hòa Phát / Hoa Sen',
    type: 'cluster',
    parentId: 'kw-pillar-2',
    pillarId: 'kw-pillar-2',
    pillarName: 'Xà Gồ & Thép Hình Kết Cấu',
    searchVolume: 38000,
    difficulty: 62,
    cpc: 8900,
    intent: 'transactional',
    channel: 'Website / Blog',
    dateCreated: '2026-08-05',
    daysAgo: 16,
    lastUpdated: '2026-08-17',
    status: 'completed',
    aggregate_status: 'completed',
    publishedUrl: 'https://bizone-steel.vn/bai-viet/thep-hop-ma-kem-hoa-phat',
    publishedAt: '2026-08-10',
    ranking: 3,
    tags: ['Brand', 'Conversion']
  },

  // ARTICLES (Under Cluster 1-1: Báo Giá Tôn Mạ Kẽm)
  {
    id: 'kw-art-1',
    label: 'Bảng Báo Giá Tôn Hoa Sen 2026 Mới Nhất Hôm Nay',
    type: 'article',
    parentId: 'kw-cluster-1-1',
    pillarId: 'kw-pillar-1',
    clusterName: 'Báo Giá Tôn Mạ Kẽm & Tôn Màu',
    pillarName: 'Tôn Thép Xây Dựng',
    searchVolume: 18500,
    difficulty: 46,
    cpc: 7800,
    intent: 'transactional',
    channel: 'Website / Blog',
    dateCreated: '2026-07-10',
    daysAgo: 42,
    lastUpdated: '2026-08-20',
    status: 'completed',
    aggregate_status: 'completed',
    contentTitle: 'Bảng Báo Giá Tôn Hoa Sen Mạ Kẽm & Tôn Màu 2026 (Chiết Khấu Cao)',
    articleId: 'art-001',
    publishedUrl: 'https://bizone-steel.vn/bai-viet/bao-gia-ton-hoa-sen-2026',
    publishedAt: '2026-08-20',
    ranking: 1,
    tags: ['Money Keyword', 'Top 1']
  },
  {
    id: 'kw-art-2',
    label: 'So Sánh Độ Dày & Độ Bền Tôn Đông Á Với Tôn Phương Nam',
    type: 'article',
    parentId: 'kw-cluster-1-1',
    pillarId: 'kw-pillar-1',
    clusterName: 'Báo Giá Tôn Mạ Kẽm & Tôn Màu',
    pillarName: 'Tôn Thép Xây Dựng',
    searchVolume: 9200,
    difficulty: 35,
    cpc: 4200,
    intent: 'commercial',
    channel: 'Website / Blog',
    dateCreated: '2026-08-07',
    daysAgo: 14,
    lastUpdated: '2026-08-19',
    status: 'pending_review',
    aggregate_status: 'pending_review',
    contentTitle: 'Đánh Giá So Sánh Tôn Đông Á và Tôn Phương Nam: Loại Nào Tốt Hơn?',
    articleId: 'art-002',
    progressPercent: 85,
    ranking: 4,
    tags: ['Comparison']
  },

  // ARTICLES (Under Cluster 1-2: Tôn Cách Nhiệt)
  {
    id: 'kw-art-3',
    label: 'Báo Giá Tôn Xốp Cách Nhiệt 3 Lớp Chống Nóng Nhà Xưởng',
    type: 'article',
    parentId: 'kw-cluster-1-2',
    pillarId: 'kw-pillar-1',
    clusterName: 'Tôn Cách Nhiệt PU & Tôn Lạnh',
    pillarName: 'Tôn Thép Xây Dựng',
    searchVolume: 14200,
    difficulty: 41,
    cpc: 6200,
    intent: 'transactional',
    channel: 'Website / Blog',
    dateCreated: '2026-08-14',
    daysAgo: 7,
    lastUpdated: '2026-08-20',
    status: 'processing',
    aggregate_status: 'processing',
    contentTitle: 'Báo Giá Tôn Xốp Cách Nhiệt 3 Lớp PU Chống Nóng Nhà Xưởng 2026',
    currentStep: 'Tối ưu độ dài bài viết & Chèn schema FAQ',
    progressPercent: 55,
    startedAt: '2026-08-14',
    articleId: 'art-003',
    ranking: 6,
    tags: ['Factory']
  },

  // ARTICLES (Under Cluster 2-1: Quy Cách Xà Gồ)
  {
    id: 'kw-art-4',
    label: 'Bảng Tra Trọng Lượng Và Kích Thước Xà Gồ C Mạ Kẽm',
    type: 'article',
    parentId: 'kw-cluster-2-1',
    pillarId: 'kw-pillar-2',
    clusterName: 'Quy Cách Xà Gồ C & Xà Gồ Z Mạ Kẽm',
    pillarName: 'Xà Gồ & Thép Hình Kết Cấu',
    searchVolume: 11500,
    difficulty: 32,
    cpc: 3100,
    intent: 'informational',
    channel: 'Website / Blog',
    dateCreated: '2026-08-19',
    daysAgo: 2,
    lastUpdated: '2026-08-21',
    status: 'not_started',
    aggregate_status: 'not_started',
    suggestedArticleTitle: 'Bảng Tra Trọng Lượng & Kích Thước Xà Gồ C Tiêu Chuẩn Xây Dựng 2026',
    articleId: 'art-004',
    tags: ['Reference']
  },

  // VARIANTS / LSI (Under Article 1: Báo giá tôn hoa sen)
  {
    id: 'kw-var-1-1',
    label: 'giá tôn hoa sen 4 dem 5',
    type: 'variant',
    parentId: 'kw-art-1',
    pillarId: 'kw-pillar-1',
    clusterName: 'Báo Giá Tôn Mạ Kẽm & Tôn Màu',
    pillarName: 'Tôn Thép Xây Dựng',
    searchVolume: 4800,
    difficulty: 28,
    cpc: 5200,
    intent: 'transactional',
    channel: 'Website / Blog',
    dateCreated: '2026-08-14',
    daysAgo: 7,
    lastUpdated: '2026-08-18',
    status: 'completed',
    aggregate_status: 'completed',
    publishedUrl: 'https://bizone-steel.vn/bai-viet/bao-gia-ton-hoa-sen-2026#do-day-4-dem-5',
    publishedAt: '2026-08-18',
    ranking: 2
  },
  {
    id: 'kw-var-1-2',
    label: 'đại lý tôn hoa sen chiết khấu 10%',
    type: 'variant',
    parentId: 'kw-art-1',
    pillarId: 'kw-pillar-1',
    clusterName: 'Báo Giá Tôn Mạ Kẽm & Tôn Màu',
    pillarName: 'Tôn Thép Xây Dựng',
    searchVolume: 3200,
    difficulty: 24,
    cpc: 6800,
    intent: 'transactional',
    channel: 'Website / Blog',
    dateCreated: '2026-08-14',
    daysAgo: 7,
    lastUpdated: '2026-08-18',
    status: 'completed',
    aggregate_status: 'completed',
    publishedUrl: 'https://bizone-steel.vn/bai-viet/bao-gia-ton-hoa-sen-2026#chiet-khau-dai-ly',
    publishedAt: '2026-08-18',
    ranking: 1
  },
  {
    id: 'kw-var-3-1',
    label: 'tôn xốp chống nóng giá bao nhiêu 1m2',
    type: 'variant',
    parentId: 'kw-art-3',
    pillarId: 'kw-pillar-1',
    clusterName: 'Tôn Cách Nhiệt PU & Tôn Lạnh',
    pillarName: 'Tôn Thép Xây Dựng',
    searchVolume: 5600,
    difficulty: 30,
    cpc: 4900,
    intent: 'commercial',
    channel: 'Website / Blog',
    dateCreated: '2026-08-19',
    daysAgo: 2,
    lastUpdated: '2026-08-21',
    status: 'not_started',
    aggregate_status: 'not_started'
  },
  {
    id: 'kw-var-4-1',
    label: 'cửa nhựa lõi thép giá rẻ',
    type: 'article',
    parentId: 'kw-pillar-3',
    pillarId: 'kw-pillar-3',
    clusterName: 'Vật Tư Lưới & Kẽm Gai',
    pillarName: 'Vật Tư Lưới & Kẽm Gai',
    searchVolume: 8400,
    difficulty: 34,
    cpc: 5100,
    intent: 'transactional',
    channel: 'Shopee',
    dateCreated: '2026-08-20',
    daysAgo: 1,
    lastUpdated: '2026-08-21',
    status: 'not_started',
    aggregate_status: 'not_started'
  },
  {
    id: 'kw-var-4-2',
    label: 'bảng giá cửa nhựa composite',
    type: 'article',
    parentId: 'kw-pillar-3',
    pillarId: 'kw-pillar-3',
    clusterName: 'Vật Tư Lưới & Kẽm Gai',
    pillarName: 'Vật Tư Lưới & Kẽm Gai',
    searchVolume: 12200,
    difficulty: 40,
    cpc: 6300,
    intent: 'commercial',
    channel: 'Website / Blog',
    dateCreated: '2026-08-20',
    daysAgo: 1,
    lastUpdated: '2026-08-21',
    status: 'processing',
    aggregate_status: 'processing',
    currentStep: 'Nghiên cứu từ khóa & Phân tích 10 đối thủ hàng đầu',
    progressPercent: 30,
    startedAt: '2026-08-21'
  }
];

export const INITIAL_KEYWORD_EDGES: KeywordEdge[] = [
  // Pillar to Cluster
  { id: 'e1', source: 'kw-pillar-1', target: 'kw-cluster-1-1', relationType: 'pillar_to_cluster' },
  { id: 'e2', source: 'kw-pillar-1', target: 'kw-cluster-1-2', relationType: 'pillar_to_cluster' },
  { id: 'e3', source: 'kw-pillar-2', target: 'kw-cluster-2-1', relationType: 'pillar_to_cluster' },
  { id: 'e4', source: 'kw-pillar-2', target: 'kw-cluster-2-2', relationType: 'pillar_to_cluster' },

  // Cluster to Article
  { id: 'e5', source: 'kw-cluster-1-1', target: 'kw-art-1', relationType: 'cluster_to_article' },
  { id: 'e6', source: 'kw-cluster-1-1', target: 'kw-art-2', relationType: 'cluster_to_article' },
  { id: 'e7', source: 'kw-cluster-1-2', target: 'kw-art-3', relationType: 'cluster_to_article' },
  { id: 'e8', source: 'kw-cluster-2-1', target: 'kw-art-4', relationType: 'cluster_to_article' },

  // Article to Variant
  { id: 'e9', source: 'kw-art-1', target: 'kw-var-1-1', relationType: 'article_to_variant' },
  { id: 'e10', source: 'kw-art-1', target: 'kw-var-1-2', relationType: 'article_to_variant' },
  { id: 'e11', source: 'kw-art-3', target: 'kw-var-3-1', relationType: 'article_to_variant' },

  // Internal Links between Articles
  { id: 'e12', source: 'kw-art-1', target: 'kw-art-3', relationType: 'internal_link' },
  { id: 'e13', source: 'kw-art-2', target: 'kw-art-1', relationType: 'internal_link' }
];

export const INITIAL_GEN_SEO_ARTICLES: GenSeoArticle[] = [
  {
    id: 'art-001',
    title: 'Bảng Báo Giá Tôn Hoa Sen Mạ Kẽm & Tôn Màu 2026 (Chiết Khấu Cao)',
    slug: 'bao-gia-ton-hoa-sen-2026',
    keywordId: 'kw-art-1',
    keywordLabel: 'Bảng Báo Giá Tôn Hoa Sen 2026 Mới Nhất Hôm Nay',
    pillarName: 'Tôn Thép Xây Dựng',
    clusterName: 'Báo Giá Tôn Mạ Kẽm & Tôn Màu',
    author: 'Nguyễn Văn Minh (SEO Lead)',
    stage: 'published',
    progressPercent: 100,
    wordCount: 2680,
    targetWordCount: 2500,
    seoScore: 94,
    readabilityScore: 88,
    focusKeywords: ['báo giá tôn hoa sen 2026', 'giá tôn hoa sen mạ kẽm', 'tôn màu hoa sen'],
    secondaryKeywords: ['đại lý tôn hoa sen', 'bảng giá tôn lợp mái', 'tôn hoa sen 4 dem'],
    internalLinksCount: 5,
    externalLinksCount: 2,
    createdAt: '2026-07-10',
    updatedAt: '2026-08-20',
    publishedUrl: 'https://bizone-steel.vn/bai-viet/bao-gia-ton-hoa-sen-2026',
    notes: 'Đang xếp hạng #1 Google cho từ khóa chính. Tỷ lệ chuyển đổi khách gọi hotline đạt 6.2%.'
  },
  {
    id: 'art-002',
    title: 'Đánh Giá So Sánh Tôn Đông Á và Tôn Phương Nam: Loại Nào Tốt Hơn?',
    slug: 'so-sanh-ton-dong-a-va-phuong-nam',
    keywordId: 'kw-art-2',
    keywordLabel: 'So Sánh Độ Dày & Độ Bền Tôn Đông Á Với Tôn Phương Nam',
    pillarName: 'Tôn Thép Xây Dựng',
    clusterName: 'Báo Giá Tôn Mạ Kẽm & Tôn Màu',
    author: 'Trần Thị Thu Hà (Content Specialist)',
    stage: 'review',
    progressPercent: 85,
    wordCount: 1950,
    targetWordCount: 2200,
    seoScore: 82,
    readabilityScore: 91,
    focusKeywords: ['so sánh tôn đông á và tôn phương nam', 'độ bền tôn đông á'],
    secondaryKeywords: ['bảng giá tôn đông á 2026', 'chọn tôn lợp mái nhà'],
    internalLinksCount: 3,
    externalLinksCount: 1,
    createdAt: '2026-08-07',
    updatedAt: '2026-08-19',
    reviewedBy: 'Nguyễn Văn Minh (SEO Lead)',
    notes: 'Bài viết đã hoàn thành phần thân, cần bổ sung bảng so sánh thông số kỹ thuật AZ100 vs AZ150.'
  },
  {
    id: 'art-003',
    title: 'Báo Giá Tôn Xốp Cách Nhiệt 3 Lớp PU Chống Nóng Nhà Xưởng 2026',
    slug: 'bao-gia-ton-xop-cach-nhiet-pu-nha-xuong',
    keywordId: 'kw-art-3',
    keywordLabel: 'Báo Giá Tôn Xốp Cách Nhiệt 3 Lớp Chống Nóng Nhà Xưởng',
    pillarName: 'Tôn Thép Xây Dựng',
    clusterName: 'Tôn Cách Nhiệt PU & Tôn Lạnh',
    author: 'Lê Hoàng Long (Technical Writer)',
    stage: 'drafting',
    progressPercent: 55,
    wordCount: 1240,
    targetWordCount: 2400,
    seoScore: 68,
    readabilityScore: 79,
    focusKeywords: ['báo giá tôn xốp cách nhiệt', 'tôn pu chống nóng nhà xưởng'],
    secondaryKeywords: ['tôn 3 lớp cách âm', 'đơn giá lợp mái tôn pu'],
    internalLinksCount: 2,
    externalLinksCount: 1,
    createdAt: '2026-08-14',
    updatedAt: '2026-08-20',
    notes: 'Đang viết mục 4: Các tiêu chuẩn chống cháy lan B2/B1 và hiệu quả giảm nhiệt độ thực tế 8-12 độ C.'
  },
  {
    id: 'art-004',
    title: 'Bảng Tra Trọng Lượng & Kích Thước Xà Gồ C Tiêu Chuẩn Xây Dựng 2026',
    slug: 'bang-tra-trong-luong-xa-go-c',
    keywordId: 'kw-art-4',
    keywordLabel: 'Bảng Tra Trọng Lượng Và Kích Thước Xà Gồ C Mạ Kẽm',
    pillarName: 'Xà Gồ & Thép Hình Kết Cấu',
    clusterName: 'Quy Cách Xà Gồ C & Xà Gồ Z Mạ Kẽm',
    author: 'Trần Thị Thu Hà (Content Specialist)',
    stage: 'outline',
    progressPercent: 25,
    wordCount: 420,
    targetWordCount: 1800,
    seoScore: 45,
    readabilityScore: 85,
    focusKeywords: ['bảng tra trọng lượng xà gồ c', 'quy cách xà gồ c mạ kẽm'],
    secondaryKeywords: ['khoảng cách xà gồ c lợp mái', 'giá xà gồ c đục lỗ'],
    internalLinksCount: 1,
    externalLinksCount: 0,
    createdAt: '2026-08-19',
    updatedAt: '2026-08-21',
    notes: 'Đã lập dàn ý 5 đề mục chính và công thức tính tải trọng võng L/200.'
  },
  {
    id: 'art-005',
    title: 'Quy Trình Quản Lý Kho Thép Theo Phương Pháp FIFO Giảm Tồn Đọng 40%',
    slug: 'quan-ly-kho-thep-fifo-bizone',
    keywordId: 'kw-pillar-4',
    keywordLabel: 'Phần Mềm ERP Quản Trị Phân Phối',
    pillarName: 'Phần Mềm ERP Quản Trị Phân Phối',
    clusterName: 'Quản Trị Kho Bãi Vật Tư',
    author: 'Nguyễn Văn Minh (SEO Lead)',
    stage: 'research',
    progressPercent: 10,
    wordCount: 150,
    targetWordCount: 3000,
    seoScore: 30,
    readabilityScore: 90,
    focusKeywords: ['quản lý kho thép fifo', 'phần mềm erp phân phối sắt thép'],
    secondaryKeywords: ['sổ kho theo lô date', 'cắt thép giảm hao hụt'],
    internalLinksCount: 0,
    externalLinksCount: 0,
    createdAt: '2026-08-20',
    updatedAt: '2026-08-21',
    notes: 'Thu thập case study thực tế từ BizOne ERP và số liệu tối ưu biên lợi nhuận.'
  }
];

export const INITIAL_INTERNAL_LINK_SUGGESTIONS: InternalLinkSuggestion[] = [
  {
    sourceArticleId: 'art-001',
    sourceTitle: 'Bảng Báo Giá Tôn Hoa Sen Mạ Kẽm & Tôn Màu 2026',
    targetArticleId: 'art-003',
    targetTitle: 'Báo Giá Tôn Xốp Cách Nhiệt 3 Lớp PU Chống Nóng Nhà Xưởng',
    anchorText: 'tôn xốp cách nhiệt 3 lớp PU',
    relevanceScore: 96,
    contextSnippet: '...nếu công trình yêu cầu cách âm và chống nóng vượt trội, quý khách nên tham khảo dòng [tôn xốp cách nhiệt 3 lớp PU] để tiết kiệm chi phí điện năng...'
  },
  {
    sourceArticleId: 'art-002',
    sourceTitle: 'Đánh Giá So Sánh Tôn Đông Á và Tôn Phương Nam',
    targetArticleId: 'art-001',
    targetTitle: 'Bảng Báo Giá Tôn Hoa Sen Mạ Kẽm & Tôn Màu 2026',
    anchorText: 'bảng báo giá tôn hoa sen cập nhật',
    relevanceScore: 92,
    contextSnippet: '...để có cái nhìn tổng quan về mặt bằng giá của các thương hiệu hàng đầu, bạn có thể xem thêm [bảng báo giá tôn hoa sen cập nhật] mới nhất...'
  },
  {
    sourceArticleId: 'art-003',
    sourceTitle: 'Báo Giá Tôn Xốp Cách Nhiệt 3 Lớp PU Chống Nóng Nhà Xưởng',
    targetArticleId: 'art-004',
    targetTitle: 'Bảng Tra Trọng Lượng & Kích Thước Xà Gồ C Tiêu Chuẩn',
    anchorText: 'kích thước xà gồ C mạ kẽm',
    relevanceScore: 89,
    contextSnippet: '...khi lắp đặt mái tôn xốp có trọng lượng lớn hơn tôn thường, cần tính toán kỹ [kích thước xà gồ C mạ kẽm] để đảm bảo an toàn kết cấu khung kèo...'
  }
];

export const INITIAL_MASCOT_CONFIG: MascotConfig = {
  enabled: true,
  minimized: false,
  autoAvoidHover: true,
  position: 'bottom-right',
  theme: 'copilot'
};
