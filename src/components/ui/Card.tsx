import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  compact?: boolean;
  variant?: 'default' | 'muted' | 'outline';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', noPadding = false, compact = false, variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-white border-slate-200 shadow-xs',
      muted: 'bg-slate-50/70 border-slate-200 shadow-none',
      outline: 'bg-transparent border-slate-200 shadow-none'
    };

    const paddingClass = noPadding ? '' : compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-6';

    return (
      <div
        ref={ref}
        className={`rounded-xl border ${variantStyles[variant]} ${paddingClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ className = '', action, children, ...props }) => {
  return (
    <div
      className={`flex items-start justify-between gap-4 pb-3 sm:pb-4 border-b border-slate-100 last:border-0 ${className}`}
      {...props}
    >
      <div className="space-y-1 min-w-0 flex-1">{children}</div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <h3
      className={`text-base font-semibold text-slate-900 tracking-tight leading-none ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <p className={`text-xs sm:text-sm text-slate-500 leading-normal ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return <div className={`pt-3 sm:pt-4 ${className}`} {...props}>{children}</div>;
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`flex items-center justify-between gap-3 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
