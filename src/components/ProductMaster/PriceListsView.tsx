import React, { useState, useEffect } from 'react';
import { PriceList, Product } from '../../types';
import { ProductMasterRepository } from '../../repositories/productMasterRepository';
import { useLanguage } from '../../i18n';

interface PriceListsViewProps {
  products: Product[];
  tenantId?: string;
}

export const PriceListsView: React.FC<PriceListsViewProps> = ({
  products,
  tenantId = 'tenant-001'
}) => {
  const { t, formatCurrency } = useLanguage();
  ProductMasterRepository.initialize();

  const [priceLists, setPriceLists] = useState<PriceList[]>(() =>
    ProductMasterRepository.findPriceLists(tenantId)
  );

  useEffect(() => {
    setPriceLists(ProductMasterRepository.findPriceLists(tenantId));
  }, [tenantId]);

  const [selectedPriceListId, setSelectedPriceListId] = useState<string>(
    priceLists[0]?.priceListId || 'pl-retail'
  );

  const activePriceList = priceLists.find((p) => p.priceListId === selectedPriceListId) || priceLists[0];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t('productMaster.priceLists.title')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('productMaster.priceLists.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Left Side: Price Lists selection */}
        <div className="space-y-2">
          {priceLists.map((pl) => (
            <button
              key={pl.priceListId}
              onClick={() => setSelectedPriceListId(pl.priceListId)}
              className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                selectedPriceListId === pl.priceListId
                  ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs">{pl.name}</span>
                {pl.isDefault && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      selectedPriceListId === pl.priceListId
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t('productMaster.priceLists.default')}
                  </span>
                )}
              </div>
              <div
                className={`text-[11px] mt-1 font-mono ${
                  selectedPriceListId === pl.priceListId ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {t('productMaster.priceLists.code')}: {pl.code} • {t('productMaster.priceLists.type')}: {pl.type}
              </div>
            </button>
          ))}
        </div>

        {/* Right Side: Matrix Table of Products in this Price List */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-800">
              {t('productMaster.priceLists.details')}{' '}
              <span className="font-bold text-slate-900">{activePriceList?.name}</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {t('productMaster.priceLists.currency')}: {activePriceList?.currency || 'VND'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">{t('productMaster.table.stt')}</th>
                  <th className="py-2.5 px-3">{t('productMaster.table.sku')}</th>
                  <th className="py-2.5 px-3">{t('productMaster.table.productName')}</th>
                  <th className="py-2.5 px-3 text-right">{t('productMaster.priceLists.basePrice')}</th>
                  <th className="py-2.5 px-3 text-right">{t('productMaster.priceLists.appliedPrice')}</th>
                  <th className="py-2.5 px-3 text-center">{t('productMaster.priceLists.difference')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {t('productMaster.table.empty')}
                    </td>
                  </tr>
                ) : (
                  products.map((p, idx) => {
                    const basePrice = p.sellingPrice || 0;
                    const factor =
                      activePriceList?.type === 'WHOLESALE'
                        ? 0.85
                        : activePriceList?.type === 'B2B'
                        ? 0.8
                        : activePriceList?.type === 'POS'
                        ? 1.0
                        : activePriceList?.type === 'MARKETPLACE'
                        ? 1.05
                        : 1.0;
                    const priceInList = Math.round(basePrice * factor);
                    const diffPercent = Math.round((factor - 1) * 100);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                          {p.variantSku || p.sku || p.code || 'SKU-001'}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {p.productName || p.name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {formatCurrency(basePrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(priceInList)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                              diffPercent < 0
                                ? 'bg-rose-50 text-rose-700'
                                : diffPercent > 0
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {diffPercent > 0 ? `+${diffPercent}%` : diffPercent < 0 ? `${diffPercent}%` : t('productMaster.priceLists.standard')}
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
    </div>
  );
};
