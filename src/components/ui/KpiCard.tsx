import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card } from './Card';
import { Badge } from './Badge';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  change?: {
    value: number | string;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subValue,
  change,
  icon,
  onClick,
  className = ''
}) => {
  return (
    <Card
      compact
      onClick={onClick}
      className={`
        relative overflow-hidden transition-all
        ${onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm' : ''}
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </p>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {value}
            </span>
            {subValue && (
              <span className="text-xs text-slate-400 font-medium tabular-nums truncate">
                {subValue}
              </span>
            )}
          </div>
        </div>

        {icon && (
          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 shrink-0">
            {icon}
          </div>
        )}
      </div>

      {change && (
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
          <Badge
            size="sm"
            variant={
              change.trend === 'up'
                ? 'success'
                : change.trend === 'down'
                ? 'danger'
                : 'neutral'
            }
            leftIcon={
              change.trend === 'up' ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : change.trend === 'down' ? (
                <ArrowDownRight className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )
            }
          >
            {typeof change.value === 'number' ? `${change.value > 0 ? '+' : ''}${change.value}%` : change.value}
          </Badge>

          {change.label && (
            <span className="text-xs text-slate-400 font-normal truncate">{change.label}</span>
          )}
        </div>
      )}
    </Card>
  );
};
