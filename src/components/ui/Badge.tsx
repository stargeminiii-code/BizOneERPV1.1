import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  leftIcon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  success: {
    container: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500'
  },
  warning: {
    container: 'bg-amber-50 text-amber-800 border-amber-200/80',
    dot: 'bg-amber-500'
  },
  danger: {
    container: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500'
  },
  info: {
    container: 'bg-sky-50 text-sky-700 border-sky-200/80',
    dot: 'bg-sky-500'
  },
  neutral: {
    container: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400'
  },
  primary: {
    container: 'bg-slate-900 text-white border-slate-900',
    dot: 'bg-white'
  }
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium tracking-wide gap-1.5',
  md: 'text-xs px-2.5 py-1 rounded-md font-medium tracking-wide gap-1.5'
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  leftIcon,
  className = '',
  children,
  ...props
}) => {
  const styles = variantStyles[variant];

  return (
    <span
      className={`
        inline-flex items-center justify-center border font-medium whitespace-nowrap select-none
        ${styles.container}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />}
      {leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
      <span>{children}</span>
    </span>
  );
};
