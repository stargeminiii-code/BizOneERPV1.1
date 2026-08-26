import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, label, description, error, className = '', disabled, checked, ...props }, ref) => {
    const checkboxId = id || (typeof label === 'string' ? `chk-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="space-y-1">
        <label
          htmlFor={checkboxId}
          className={`inline-flex items-start gap-2.5 cursor-pointer select-none ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${className}`}
        >
          <div className="relative flex items-center justify-center mt-0.5 shrink-0">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              disabled={disabled}
              checked={checked}
              className="sr-only peer"
              {...props}
            />
            <div
              className={`
                w-4 h-4 rounded border transition-colors flex items-center justify-center
                peer-focus-visible:ring-2 peer-focus-visible:ring-slate-900/20
                ${
                  checked
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-300 peer-hover:border-slate-400'
                }
                ${error ? 'border-rose-400' : ''}
              `}
            >
              {checked && <Check className="w-3 h-3 text-white stroke-[3]" />}
            </div>
          </div>

          {(label || description) && (
            <div className="space-y-0.5">
              {label && <p className="text-sm font-medium text-slate-800 leading-none">{label}</p>}
              {description && <p className="text-xs text-slate-500">{description}</p>}
            </div>
          )}
        </label>

        {error && <p className="text-xs text-rose-600 font-medium pl-6.5">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
