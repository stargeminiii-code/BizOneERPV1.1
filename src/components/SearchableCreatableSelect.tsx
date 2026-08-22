import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, Check, ChevronDown, X, Sparkles } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
  subText?: string;
  badge?: string;
}

interface SearchableCreatableSelectProps {
  options: (string | SelectOption)[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  quickAddLabel?: string; // e.g. "Thêm thương hiệu mới"
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  onQuickCreated?: (newVal: string) => void;
  icon?: React.ReactNode;
}

export const SearchableCreatableSelect: React.FC<SearchableCreatableSelectProps> = ({
  options = [],
  value,
  onChange,
  placeholder = 'Tìm hoặc tạo mới...',
  quickAddLabel = 'Tạo mới',
  className = '',
  inputClassName = '',
  disabled = false,
  allowCreate = true,
  onQuickCreated,
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize options to SelectOption
  const normalizedOptions = useMemo<SelectOption[]>(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  // Current display label
  const selectedOption = normalizedOptions.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : value;

  // Filtered list
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q) || (o.subText && o.subText.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  // Check if query exists exactly
  const exactMatchExists = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return normalizedOptions.some((o) => o.label.toLowerCase() === q || o.value.toLowerCase() === q);
  }, [normalizedOptions, searchQuery]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreateNew = (customText: string) => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    onChange(trimmed);
    if (onQuickCreated) onQuickCreated(trimmed);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
      return;
    }

    const totalItems = filteredOptions.length + (!exactMatchExists && allowCreate && searchQuery.trim() ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % (totalItems || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + totalItems) % (totalItems || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex < filteredOptions.length) {
        const target = filteredOptions[highlightIndex];
        if (target) handleSelect(target.value);
      } else if (!exactMatchExists && allowCreate && searchQuery.trim()) {
        handleCreateNew(searchQuery);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Control Button / Input trigger */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }
        }}
        className={`flex items-center justify-between gap-1.5 px-3 py-2 bg-white border rounded-xl text-xs cursor-pointer transition-all duration-150 select-none ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
            : 'border-slate-300 hover:border-slate-400 text-slate-800'
        } ${inputClassName}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          <span className={`truncate font-semibold ${displayLabel ? 'text-slate-900' : 'text-slate-400 font-normal'}`}>
            {displayLabel || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {displayLabel && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearchQuery('');
              }}
              className="p-0.5 hover:text-rose-500 rounded transition"
              title="Xóa lựa chọn"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[200px]">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Nhập từ khóa tìm hoặc tạo mới..."
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div ref={listRef} className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 text-xs">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightIndex;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : isHighlighted
                        ? 'bg-slate-100 text-slate-900 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{opt.label}</span>
                      {opt.subText && <span className="text-[10px] text-slate-400">({opt.subText})</span>}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-bold">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-2.5 px-3 text-center text-slate-400 text-[11px]">
                Không tìm thấy kết quả phù hợp
              </div>
            )}

            {/* Quick Create Button when query doesn't match */}
            {!exactMatchExists && allowCreate && searchQuery.trim() && (
              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleCreateNew(searchQuery)}
                  onMouseEnter={() => setHighlightIndex(filteredOptions.length)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left font-bold text-xs transition cursor-pointer ${
                    highlightIndex === filteredOptions.length
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span>{quickAddLabel}: </span>
                    <strong className="underline decoration-emerald-500 font-black">"{searchQuery.trim()}"</strong>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
