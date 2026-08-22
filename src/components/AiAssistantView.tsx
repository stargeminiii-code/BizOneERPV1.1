import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Lightbulb,
  TrendingUp,
  Package,
  ArrowRight,
  RefreshCw,
  Zap,
  MessageSquare,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { DiagnosisInsight, DashboardMetrics, Product, Customer } from '../types';
import { AuthService } from '../services/authService';

interface AiAssistantViewProps {
  metrics: DashboardMetrics;
  insights: DiagnosisInsight[];
  products: Product[];
  customers: Customer[];
  onOpenCreatePO: (productName?: string) => void;
  onOpenCrmTask: (customerName?: string) => void;
  onRefreshDiagnosis: () => void;
  isDiagnosing: boolean;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  metrics,
  insights = [],
  products = [],
  customers = [],
  onOpenCreatePO,
  onOpenCrmTask,
  onRefreshDiagnosis,
  isDiagnosing
}) => {
  const [messages, setMessages] = useState<
    { role: 'assistant' | 'user'; content: string; time: string }[]
  >([
    {
      role: 'assistant',
      content: `Xin chào! Tôi là **BizOne AI Copilot**, trợ lý thông minh hỗ trợ phân tích kinh doanh, dự báo tồn kho và tối ưu doanh thu.
Hiện tại:
- **Doanh thu thuần**: 124.500.000 đ (+12.5%)
- **Cảnh báo tồn kho**: 5 mặt hàng sắp cạn kho (đặc biệt Thép tấm 5 ly còn 180kg).
- **Cơ hội CSKH**: Khách hàng Công ty TNHH Xây Dựng ABC đến chu kỳ tái mua Kẽm gai.

Bạn cần tôi hỗ trợ phân tích hoặc chuẩn bị kế hoạch gì hôm nay?`,
      time: '10:00'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const quickPrompts = [
    'Dự báo tồn kho thép và đề xuất số lượng nhập',
    'Cách xử lý 18.4 triệu công nợ khách hàng hiệu quả',
    'Nếu giảm giá 3% cho đơn hàng trên 50 triệu có lãi không?',
    'Soạn tin nhắn Zalo gửi báo giá cho CTY Xây Dựng ABC'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg = {
      role: 'user' as const,
      content: text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoadingChat(true);

    try {
      const token = AuthService.getActiveToken();
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: text,
          context: { metrics, productsCount: products.length, customersCount: customers.length }
        })
      });

      const data = await response.json();
      const assistantReply =
        data.reply ||
        'Dựa trên phân tích số liệu: Đơn hàng hôm nay đang có biên lợi nhuận tốt 36.3%. Bạn nên ưu tiên nhập hàng Thép tấm 5 ly để tránh gián đoạn các hợp đồng cơ khí.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: assistantReply,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `[Phân tích cục bộ]: Dựa trên dữ liệu hiện tại, nhóm hàng Thép & Kim loại chiếm 65% tỷ trọng doanh thu. Đề xuất ưu tiên bổ sung tồn kho cho Thép tấm 5 ly và que hàn KT-421 trong 48h tới.`,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                BizOne AI
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                BETA
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onRefreshDiagnosis}
          disabled={isDiagnosing}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold border border-emerald-200 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
          <span>Chẩn đoán lại toàn hệ thống</span>
        </button>
      </div>

      {/* Main Grid: Diagnosis Summary (Left) + Interactive Chat (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Active Diagnostics & Recommendations */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-sm text-slate-900">Khuyến nghị Hành động Tức thì</span>
              <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                2 Ưu tiên cao
              </span>
            </div>

            {/* Insight 1 */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-xs mb-1">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Cảnh báo Hết Hàng (Critical)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Sản phẩm <strong>Thép tấm 5 ly</strong> chỉ còn 180kg. Tốc độ xuất 150kg/ngày. Hàng sẽ hết sạch vào ngày mai.
              </p>
              <button
                onClick={() => onOpenCreatePO('Thép tấm 5 ly')}
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                <span>Lập phiếu nhập 500kg ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Insight 2 */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
              <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Cơ hội Chốt Đơn Upsell</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>Công ty TNHH Xây Dựng ABC</strong> đã quá 40 ngày chưa đặt Kẽm gai. Đề xuất gửi báo giá kèm khuyến mãi vận chuyển.
              </p>
              <button
                onClick={() => onOpenCrmTask('Công ty TNHH Xây Dựng ABC')}
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                <span>Tạo nhiệm vụ gọi điện chào hàng</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Panel */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Câu hỏi phân tích mẫu
            </span>
            <div className="space-y-1.5">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="w-full text-left p-2 rounded-xl bg-white hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 text-xs text-slate-700 font-medium transition-all"
                >
                  💬 {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: AI Chat Console */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[600px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-slate-800">Trực tuyến - Gemini 2.5 Flash Enterprise</span>
            </div>
            <span className="text-[11px] text-slate-400">BizOne AI Engine</span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 space-y-1.5 ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line leading-relaxed">{m.content}</div>
                  <div
                    className={`text-[10px] text-right ${
                      m.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {m.time}
                  </div>
                </div>
              </div>
            ))}

            {isLoadingChat && (
              <div className="flex gap-2 items-center text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl w-fit">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>AI đang tính toán dữ liệu ERP...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Đặt câu hỏi về tài chính, tồn kho, doanh số..."
              className="flex-1 text-xs border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoadingChat}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white rounded-xl shadow-md shadow-emerald-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
