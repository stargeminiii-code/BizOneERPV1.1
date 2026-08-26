import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: DrawerSize;
  hideCloseButton?: boolean;
  className?: string;
}

const desktopSizeClasses: Record<DrawerSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
  '2xl': 'sm:max-w-3xl',
  full: 'sm:max-w-[90vw]'
};

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideCloseButton = false,
  className = ''
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container: Slide from bottom on mobile, slide from right on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        className={`
          relative z-10 w-full bg-white shadow-2xl flex flex-col
          max-h-[90vh] rounded-t-2xl sm:max-h-full sm:h-full sm:rounded-none sm:border-l border-slate-200
          animate-in slide-in-from-bottom sm:slide-in-from-right duration-200 ease-out
          self-end sm:self-auto
          ${desktopSizeClasses[size]}
          ${className}
        `}
      >
        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="space-y-1 min-w-0 flex-1">
            {typeof title === 'string' ? (
              <h3 className="text-base font-semibold text-slate-900 tracking-tight leading-none truncate">
                {title}
              </h3>
            ) : (
              title
            )}
            {description && (
              <p className="text-xs sm:text-sm text-slate-500 leading-normal">{description}</p>
            )}
          </div>

          {!hideCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
