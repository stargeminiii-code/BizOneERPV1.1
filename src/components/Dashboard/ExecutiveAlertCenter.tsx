import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { ExecutiveAlertItem } from '../../types';
import { useLanguage } from '../../i18n';

interface ExecutiveAlertCenterProps {
  alerts: ExecutiveAlertItem[];
  onNavigateToModule: (module: string, filter?: string) => void;
}

export const ExecutiveAlertCenter: React.FC<ExecutiveAlertCenterProps> = ({
  alerts,
  onNavigateToModule
}) => {
  const { t } = useLanguage();
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning'>('all');

  const filteredAlerts =
    severityFilter === 'all'
      ? alerts
      : alerts.filter((a) => a.severity === severityFilter);

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div id="executive-alert-center-card" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {t('dashboard.alerts.title')}
            </h2>
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                {criticalCount} {t('dashboard.alerts.criticalBadge')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {t('dashboard.alerts.subtitle')}
          </p>
        </div>

        {/* Severity Filter */}
        <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer min-h-[28px] ${
              severityFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('dashboard.alerts.allFilter')} ({alerts.length})
          </button>
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer min-h-[28px] ${
              severityFilter === 'critical' ? 'bg-white text-rose-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('dashboard.alerts.criticalFilter')} ({criticalCount})
          </button>
          <button
            onClick={() => setSeverityFilter('warning')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer min-h-[28px] ${
              severityFilter === 'warning' ? 'bg-white text-amber-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('dashboard.alerts.warningFilter')} ({warningCount})
          </button>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-2 mt-3">
        {filteredAlerts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <span>{t('dashboard.alerts.empty')}</span>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            return (
              <div
                key={alert.id}
                id={`alert-item-${alert.id}`}
                className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition ${
                  isCritical
                    ? 'bg-rose-50/30 border-rose-200/70 hover:bg-rose-50/50'
                    : 'bg-amber-50/30 border-amber-200/70 hover:bg-amber-50/50'
                }`}
              >
                {/* Left: Icon & Text */}
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      isCritical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isCritical ? <AlertCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900">{alert.title}</h3>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {alert.countOrValue}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{alert.description}</p>
                  </div>
                </div>

                {/* Right: Action button */}
                <div className="shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => onNavigateToModule(alert.targetModule, alert.targetFilter)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer min-h-[30px] ${
                      isCritical
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{t('dashboard.alerts.actionBtn')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
