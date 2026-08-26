import React from 'react';
import { Calendar } from 'lucide-react';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  error?: string;
  isFullWidth?: boolean;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      isFullWidth = true,
      className = '',
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `date-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`space-y-1.5 ${isFullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 tracking-wide"
          >
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          <input
            ref={ref}
            type="date"
            id={inputId}
            disabled={disabled}
            required={required}
            className={`
              w-full text-sm bg-white text-slate-900 border rounded-lg transition-colors
              disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900
              pl-3.5 pr-10 py-2 min-h-[40px] tabular-nums
              ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200'}
              ${className}
            `}
            {...props}
          />

          <Calendar className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
        </div>

        {error ? (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
