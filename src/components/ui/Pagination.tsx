import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = ''
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems !== undefined ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 text-xs sm:text-sm text-slate-600 ${className}`}
    >
      {/* Left: Item count summary */}
      <div className="flex items-center gap-2">
        {totalItems !== undefined ? (
          <p>
            Hiển thị <span className="font-semibold text-slate-900 tabular-nums">{startItem}</span> -{' '}
            <span className="font-semibold text-slate-900 tabular-nums">{endItem}</span> trong tổng số{' '}
            <span className="font-semibold text-slate-900 tabular-nums">{totalItems}</span> mục
          </p>
        ) : (
          <p>
            Trang <span className="font-semibold text-slate-900 tabular-nums">{currentPage}</span> /{' '}
            <span className="font-semibold text-slate-900 tabular-nums">{totalPages || 1}</span>
          </p>
        )}

        {onPageSizeChange && (
          <div className="hidden sm:flex items-center gap-1.5 ml-4">
            <span className="text-slate-500">Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="xs"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          aria-label="Trang đầu"
          className="p-1.5 min-h-[32px] h-8 w-8"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="secondary"
          size="xs"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Trang trước"
          className="px-2.5 py-1 min-h-[32px] h-8 text-xs font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
          Trước
        </Button>

        <div className="px-2 font-medium text-slate-800 text-xs tabular-nums">
          {currentPage} / {totalPages || 1}
        </div>

        <Button
          variant="secondary"
          size="xs"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Trang sau"
          className="px-2.5 py-1 min-h-[32px] h-8 text-xs font-medium"
        >
          Sau
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Button>

        <Button
          variant="ghost"
          size="xs"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Trang cuối"
          className="p-1.5 min-h-[32px] h-8 w-8"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
