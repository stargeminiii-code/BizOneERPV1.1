import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  EyeOff,
  Shield,
  Settings2,
  TrendingUp,
  FileText,
  Network,
  CheckCircle2,
  ChevronRight,
  Move
} from 'lucide-react';
import { MascotConfig } from '../../types';

interface MascotControllerProps {
  config: MascotConfig;
  onChangeConfig: (config: MascotConfig) => void;
  onNavigateTab?: (tab: string) => void;
  onQuickAction?: (action: string) => void;
}

export const MascotController: React.FC<MascotControllerProps> = ({
  config,
  onChangeConfig,
  onNavigateTab,
  onQuickAction
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAutoEvading, setIsAutoEvading] = useState(false);
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [activeSpeech, setActiveSpeech] = useState<string | null>(
    'Xin chào! Tôi là GenSeo Copilot Mascot. Tôi đã tối ưu né tránh các nút bấm trên màn hình.'
  );

  const mascotRef = useRef<HTMLDivElement>(null);

  // Auto-avoid feature: Detect mouse proximity near clickable elements
  useEffect(() => {
    if (!config.autoAvoidHover) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!mascotRef.current) return;
      const rect = mascotRef.current.getBoundingClientRect();
      const distanceX = Math.abs(e.clientX - (rect.left + rect.width / 2));
      const distanceY = Math.abs(e.clientY - (rect.top + rect.height / 2));

      // If cursor is getting too close to mascot area while user is interacting
      if (distanceX < 70 && distanceY < 70 && !isHovered && !isOpenMenu) {
        setIsAutoEvading(true);
      } else if (distanceX > 140 || distanceY > 140) {
        setIsAutoEvading(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [config.autoAvoidHover, isHovered, isOpenMenu]);

  // Speech bubble timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSpeech(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  if (!config.enabled) {
    return (
      <button
        onClick={() => onChangeConfig({ ...config, enabled: true, minimized: false })}
        className="fixed bottom-4 right-4 z-40 p-2.5 bg-slate-900 text-white rounded-full shadow-lg border border-slate-700 hover:scale-105 transition flex items-center gap-2 text-xs font-bold"
        title="Hiện Trợ Lý Mascot GenSeo"
      >
        <Bot className="w-4 h-4 text-emerald-400" />
        <span className="hidden sm:inline">Hiện Mascot</span>
      </button>
    );
  }

  const isBottomRight = config.position === 'bottom-right';
  const isBottomLeft = config.position === 'bottom-left';

  return (
    <div
      ref={mascotRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed z-40 transition-all duration-300 pointer-events-auto select-none ${
        isBottomRight ? 'bottom-5 right-5' : isBottomLeft ? 'bottom-5 left-20' : 'top-20 right-5'
      } ${isAutoEvading && !isHovered ? 'opacity-40 scale-75 translate-y-3 translate-x-3 pointer-events-none' : 'opacity-100 scale-100'}`}
    >
      {/* Speech Bubble / Notification */}
      {activeSpeech && !config.minimized && (
        <div className="absolute bottom-full right-0 mb-3 w-64 bg-slate-900 text-white text-xs p-3 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3 h-3" /> GenSeo Mascot Tip
            </span>
            <button
              onClick={() => setActiveSpeech(null)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">{activeSpeech}</p>
          <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">Tự động né UI: BẬT</span>
            <button
              onClick={() => {
                setActiveSpeech(null);
                onNavigateTab?.('graph');
              }}
              className="text-emerald-400 hover:underline font-bold flex items-center gap-0.5"
            >
              Xem đồ thị từ khóa <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main Mascot Card / Pill */}
      {config.minimized ? (
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md text-white border border-slate-700 p-1.5 pr-3 rounded-full shadow-xl hover:bg-slate-900 transition">
          <button
            onClick={() => onChangeConfig({ ...config, minimized: false })}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow"
            title="Mở rộng Mascot"
          >
            <Bot className="w-4 h-4 animate-bounce" />
          </button>
          <span className="text-[11px] font-bold text-slate-200">GenSeo AI</span>
          <button
            onClick={() => onChangeConfig({ ...config, minimized: false })}
            className="p-1 text-slate-400 hover:text-white"
            title="Mở rộng"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-3.5 shadow-2xl border border-slate-700 w-60 relative transition-all">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-900"></span>
              </div>
              <div>
                <div className="text-xs font-extrabold text-white flex items-center gap-1">
                  <span>GenSeo Copilot</span>
                </div>
                <div className="text-[9px] text-emerald-400 font-medium">Smart AI Mascot</div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setIsOpenMenu(!isOpenMenu)}
                className={`p-1 rounded-lg hover:text-white hover:bg-slate-800 transition ${isOpenMenu ? 'text-emerald-400 bg-slate-800' : ''}`}
                title="Cài đặt Mascot"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onChangeConfig({ ...config, minimized: true })}
                className="p-1 rounded-lg hover:text-white hover:bg-slate-800 transition"
                title="Thu nhỏ Mascot"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onChangeConfig({ ...config, enabled: false })}
                className="p-1 rounded-lg hover:text-rose-400 hover:bg-slate-800 transition"
                title="Ẩn Mascot"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Settings Sub-menu */}
          {isOpenMenu ? (
            <div className="space-y-2 py-1 text-[11px] animate-in fade-in">
              <div className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">Cấu hình hiển thị Mascot:</div>
              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-xl hover:bg-slate-800">
                <span className="text-slate-300">Tự động né nút bấm (Auto-avoid):</span>
                <input
                  type="checkbox"
                  checked={config.autoAvoidHover}
                  onChange={(e) => onChangeConfig({ ...config, autoAvoidHover: e.target.checked })}
                  className="rounded accent-emerald-500"
                />
              </label>

              <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-800">
                <span className="text-slate-300">Vị trí hiển thị:</span>
                <select
                  value={config.position}
                  onChange={(e) => onChangeConfig({ ...config, position: e.target.value as any })}
                  className="bg-slate-800 text-white text-[10px] rounded px-1.5 py-0.5 border border-slate-700 font-bold"
                >
                  <option value="bottom-right">Góc phải dưới</option>
                  <option value="bottom-left">Góc trái dưới</option>
                  <option value="top-right">Góc phải trên</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between">
                <button
                  onClick={() => onChangeConfig({ ...config, minimized: true })}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-[10px] font-bold"
                >
                  Thu nhỏ thanh góc
                </button>
                <button
                  onClick={() => setIsOpenMenu(false)}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-[10px] font-bold"
                >
                  Xong
                </button>
              </div>
            </div>
          ) : (
            /* Main Content / Quick Shortcuts */
            <div className="space-y-2">
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px]">
                <div className="text-slate-400 text-[10px]">Trạng thái SEO tháng này:</div>
                <div className="flex items-center justify-between font-bold text-white mt-0.5">
                  <span className="text-emerald-400 font-mono">14 từ khóa Top 1-3</span>
                  <span className="text-blue-400">Score 92/100</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                <button
                  onClick={() => onNavigateTab?.('graph')}
                  className="p-1.5 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-200 hover:bg-indigo-900 transition flex items-center gap-1 justify-center"
                >
                  <Network className="w-3 h-3 text-indigo-400" />
                  <span>Biểu đồ mạng</span>
                </button>
                <button
                  onClick={() => onNavigateTab?.('pipeline')}
                  className="p-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 hover:bg-emerald-900 transition flex items-center gap-1 justify-center"
                >
                  <FileText className="w-3 h-3 text-emerald-400" />
                  <span>Tiến độ bài viết</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                <span>Di chuột gần để tự động né tránh</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
