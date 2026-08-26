import React from 'react';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  value,
  onChange,
  error,
  direction = 'vertical',
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-xs font-semibold text-slate-700 tracking-wide">{label}</label>}

      <div
        className={`flex ${
          direction === 'horizontal' ? 'flex-row flex-wrap gap-4' : 'flex-col space-y-2'
        }`}
      >
        {options.map((opt) => {
          const isSelected = opt.value === value;
          const optId = `radio-${name}-${opt.value}`;

          return (
            <label
              key={opt.value}
              htmlFor={optId}
              className={`inline-flex items-start gap-2.5 cursor-pointer select-none ${
                opt.disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                <input
                  type="radio"
                  id={optId}
                  name={name}
                  value={opt.value}
                  checked={isSelected}
                  disabled={opt.disabled}
                  onChange={() => onChange(opt.value)}
                  className="sr-only peer"
                />
                <div
                  className={`
                    w-4 h-4 rounded-full border transition-colors flex items-center justify-center
                    peer-focus-visible:ring-2 peer-focus-visible:ring-slate-900/20
                    ${
                      isSelected
                        ? 'border-slate-900 bg-white'
                        : 'border-slate-300 bg-white peer-hover:border-slate-400'
                    }
                  `}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                </div>
              </div>

              <div className="space-y-0.5">
                <p className="text-sm font-medium text-slate-800 leading-none">{opt.label}</p>
                {opt.description && <p className="text-xs text-slate-500">{opt.description}</p>}
              </div>
            </label>
          );
        })}
      </div>

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};
