import React, { useState } from 'react';
import {
  ArrowRight,
  X
} from 'lucide-react';
import { InventorySnapshotData, InventoryAgingBucketData } from '../../types';
import { formatVND, formatCompactVND } from '../../services/dashboardViewModel';
import { useLanguage } from '../../i18n';

interface ExecutiveInventorySnapshotProps {
  inventory: InventorySnapshotData;
  onNavigateToInventory?: () => void;
  onNavigateToFifoLots?: () => void;
}

export const ExecutiveInventorySnapshot: React.FC<ExecutiveInventorySnapshotProps> = ({
  inventory,
  onNavigateToFifoLots
}) => {
  const { t, language } = useLanguage();
  const [selectedBucket, setSelectedBucket] = useState<InventoryAgingBucketData | null>(null);

  const getBucketBarColor = (key: string) => {
    switch (key) {
      case 'under_7d':
        return 'bg-emerald-600';
      case '7_30d':
        return 'bg-teal-600';
      case '30_90d':
        return 'bg-slate-700';
      case '90_180d':
        return 'bg-amber-600';
      case '180_360d':
        return 'bg-orange-600';
      case '1_2y':
        return 'bg-rose-600';
      case 'over_2y':
        return 'bg-rose-800';
      default:
        return 'bg-slate-500';
    }
  };

  const getBucketLabel = (key: string, fallback: string) => {
    switch (key) {
      case 'under_7d':
        return t('dashboard.inventory.under7d');
      case '7_30d':
        return t('dashboard.inventory.sevenTo30d');
      case '30_90d':
        return t('dashboard.inventory.thirtyTo90d');
      case '90_180d':
        return t('dashboard.inventory.ninetyTo180d');
      case '180_360d':
        return t('dashboard.inventory.oneEightyTo360d');
      case '1_2y':
        return t('dashboard.inventory.oneTo2y');
      case 'over_2y':
        return t('dashboard.inventory.over2y');
      default:
        return fallback;
    }
  };

  const numberFormatter = new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US');

  return (
    <div id="executive-inventory-snapshot-card" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {t('dashboard.inventory.title')}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {t('dashboard.inventory.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToFifoLots && (
            <button
              id="btn-nav-fifo-lots"
              onClick={onNavigateToFifoLots}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer min-h-[30px]"
            >
              <span>{t('dashboard.inventory.fifoLotsBtn')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 5 Key Top Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 my-3">
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block">{t('dashboard.inventory.totalQty')}</span>
          <span className="text-sm sm:text-base font-bold text-slate-900">
            {numberFormatter.format(inventory.totalQuantity)}
          </span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block">{t('dashboard.inventory.inventoryValue')}</span>
          <span className="text-sm sm:text-base font-bold text-slate-900">
            {formatCompactVND(inventory.totalValue)}
          </span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block">{t('dashboard.inventory.fifoValuation')}</span>
          <span className="text-sm sm:text-base font-bold text-emerald-700">
            {formatCompactVND(inventory.fifoValue)}
          </span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block">{t('dashboard.inventory.lowStock')}</span>
          <span className={`text-sm sm:text-base font-bold ${inventory.lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {inventory.lowStockCount} {t('dashboard.inventory.skuUnit')}
          </span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-slate-500 block">{t('dashboard.inventory.agedStock')}</span>
          <span className={`text-sm sm:text-base font-bold ${inventory.agedStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {inventory.agedStockCount} {t('dashboard.inventory.lotsUnit')}
          </span>
        </div>
      </div>

      {/* 7-Bucket Visual Distribution Bar */}
      <div className="space-y-1.5 my-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>{t('dashboard.inventory.fifoDistribution')}</span>
          <span className="text-slate-400 text-[11px] font-normal">{t('dashboard.inventory.clickBucketPrompt')}</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5">
          {inventory.agingBuckets.map((bucket) => {
            if (bucket.percentage <= 0) return null;
            return (
              <div
                key={bucket.bucketKey}
                onClick={() => setSelectedBucket(bucket)}
                title={`${getBucketLabel(bucket.bucketKey, bucket.label)}: ${formatVND(bucket.fifoValue)} (${bucket.percentage}%)`}
                className={`h-full ${getBucketBarColor(bucket.bucketKey)} rounded-xs transition-all hover:opacity-80 cursor-pointer`}
                style={{ width: `${Math.max(2, bucket.percentage)}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* 7 Aging Buckets Table/Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {inventory.agingBuckets.map((bucket) => (
          <div
            key={bucket.bucketKey}
            id={`bucket-${bucket.bucketKey}`}
            onClick={() => setSelectedBucket(bucket)}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition cursor-pointer flex flex-col justify-between shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-semibold text-slate-800 truncate">{getBucketLabel(bucket.bucketKey, bucket.label)}</span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${getBucketBarColor(bucket.bucketKey)}`} />
            </div>
            <div className="text-xs font-bold text-slate-900">
              {formatCompactVND(bucket.fifoValue)}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
              <span>{bucket.lotCount} {t('dashboard.inventory.lotsUnit')}</span>
              <span className="font-semibold text-slate-700">{bucket.percentage}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bucket Drilldown Modal */}
      {selectedBucket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {t('dashboard.inventory.drilldownModal.title')}: {getBucketLabel(selectedBucket.bucketKey, selectedBucket.label)} ({selectedBucket.daysRange})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedBucket.lotCount} {t('dashboard.inventory.lotsUnit')} • {t('dashboard.inventory.drilldownModal.fifoValue')}: <strong className="text-slate-800">{formatVND(selectedBucket.fifoValue)}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedBucket(null)}
                aria-label={t('common.close')}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
              {selectedBucket.lots.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  {t('dashboard.inventory.drilldownModal.empty')}
                </div>
              ) : (
                selectedBucket.lots.map((lot) => {
                  const qty = Number(lot.quantityRemaining ?? lot.remainingQuantity ?? 0) || 0;
                  const price = Number(lot.purchasePrice ?? lot.costPrice ?? 0) || 0;
                  return (
                    <div key={lot.id || lot.lotCode} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {lot.lotCode || lot.id}
                          </span>
                          <span className="font-semibold text-slate-900">{lot.productName || lot.sku}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                          <span>SKU: {lot.sku}</span>
                          <span>•</span>
                          <span>{t('dashboard.inventory.drilldownModal.receivedDate')}: {lot.receivedAt || lot.intakeDate || '2026-08-01'}</span>
                          {lot.supplierName && (
                            <>
                              <span>•</span>
                              <span>{t('dashboard.inventory.drilldownModal.supplier')}: {lot.supplierName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-slate-900">
                          {qty} {lot.unit || 'cái'} × {formatVND(price)}
                        </div>
                        <div className="text-emerald-700 font-bold mt-0.5">
                          = {formatVND(qty * price)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedBucket(null);
                  onNavigateToFifoLots?.();
                }}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <span>{t('dashboard.inventory.drilldownModal.openFullFifo')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedBucket(null)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer min-h-[32px]"
              >
                {t('dashboard.inventory.drilldownModal.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
