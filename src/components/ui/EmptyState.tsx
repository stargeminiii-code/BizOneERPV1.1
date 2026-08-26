import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button, ButtonProps } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: ButtonProps['variant'];
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
        {icon || <PackageOpen className="w-6 h-6 stroke-[1.5]" />}
      </div>

      <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>

      {description && (
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-4 leading-normal">
          {description}
        </p>
      )}

      {action && (
        <Button
          variant={action.variant || 'primary'}
          size="sm"
          onClick={action.onClick}
          leftIcon={action.icon}
          className="mt-2"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
