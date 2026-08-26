import React from 'react';

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  helperText?: string;
  error?: string;
  value?: number | string;
  onChange?: (value: number) => void;
  prefix?: string;
  suffix?: string;
  isFullWidth?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      value,
      onChange,
      prefix,
      suffix,
      isFullWidth = true,
      className = '',
      disabled,
      required,
      min,
      max,
      step = 1,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `number-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(raw);
      if (onChange) {
        onChange(isNaN(parsed) ? 0 : parsed);
      }
    };

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
          {prefix && (
            <span className="absolute left-3 text-sm font-medium text-slate-500 pointer-events-none select-none">
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            type="number"
            id={inputId}
            value={value ?? ''}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            min={min}
            max={max}
            step={step}
            className={`
              w-full text-sm bg-white text-slate-900 border rounded-lg transition-colors text-right tabular-nums
              disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900
              ${prefix ? 'pl-8' : 'pl-3.5'}
              ${suffix ? 'pr-12' : 'pr-3.5'}
              py-2 min-h-[40px]
              ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200'}
              ${className}
            `}
            {...props}
          />

          {suffix && (
            <span className="absolute right-3 text-xs font-medium text-slate-400 pointer-events-none select-none">
              {suffix}
            </span>
          )}
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

NumberInput.displayName = 'NumberInput';
