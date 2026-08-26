import React from 'react';
import { Product } from '../../types';
import { ProductMasterRepository } from '../../repositories/productMasterRepository';
import { useLanguage } from '../../i18n';

interface CombosViewProps {
  products: Product[];
  tenantId?: string;
  onCreateCombo?: () => void;
}

export const CombosView: React.FC<CombosViewProps> = ({
  products,
  tenantId = 'tenant-001',
  onCreateCombo
}) => {
  const { t, formatCurrency } = useLanguage();
  ProductMasterRepository.initialize();

  const comboProducts = products.filter(
    (p) =>
      p.productType === 'COMBO' ||
      (p.variantName && p.variantName.toLowerCase().includes('combo')) ||
      (p.variant && p.variant.toLowerCase().includes('combo'))
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t('productMaster.combos.title')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('productMaster.combos.subtitle')}
          </p>
        </div>
      </div>

      {/* Combo Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3 w-10 text-center">{t('productMaster.table.stt')}</th>
                <th className="py-3 px-3">{t('productMaster.combos.comboSku')}</th>
                <th className="py-3 px-3.5">{t('productMaster.combos.comboName')}</th>
                <th className="py-3 px-3">{t('productMaster.table.brand')}</th>
                <th className="py-3 px-3.5">{t('productMaster.combos.components')}</th>
                <th className="py-3 px-3 text-right">{t('productMaster.table.costPrice')}</th>
                <th className="py-3 px-3 text-right">{t('productMaster.table.sellingPrice')}</th>
                <th className="py-3 px-3 text-center">{t('productMaster.table.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comboProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {t('productMaster.combos.empty')}
                  </td>
                </tr>
              ) : (
                comboProducts.map((c, idx) => {
                  const comboSku = c.variantSku || c.sku || c.code;
                  const pack = Number(c.packSize) || 2;
                  const baseSku = comboSku.replace(/-C\d+$/, '');

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{comboSku}</td>
                      <td className="py-3 px-3.5 font-semibold text-slate-900">{c.productName || c.name}</td>
                      <td className="py-3 px-3 text-slate-600">{c.brand || '—'}</td>
                      <td className="py-3 px-3.5 text-slate-700">
                        <span className="font-mono text-slate-900 font-medium">{baseSku}</span>{' '}
                        <span className="text-slate-500 font-semibold">x {pack} {c.unit || 'Hộp'}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatCurrency(c.costPrice || 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(c.sellingPrice || 0)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium px-2 py-0.5 rounded">
                          {t('productMaster.productStatuses.ACTIVE')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
