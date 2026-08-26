import React, { useState } from 'react';
import { Product } from '../../types';
import { ProductMasterRepository } from '../../repositories/productMasterRepository';
import { useLanguage } from '../../i18n';

interface SalesChannelsViewProps {
  products: Product[];
  tenantId?: string;
}

export const SalesChannelsView: React.FC<SalesChannelsViewProps> = ({
  products,
  tenantId = 'tenant-001'
}) => {
  const { t } = useLanguage();
  ProductMasterRepository.initialize();
  const [selectedChannel, setSelectedChannel] = useState<string>('shopee');

  const channelsList = [
    { id: 'pos', name: t('productMaster.channels.pos'), type: 'OFFLINE' },
    { id: 'website', name: t('productMaster.channels.website'), type: 'ONLINE' },
    { id: 'shopee', name: t('productMaster.channels.shopee'), type: 'MARKETPLACE' },
    { id: 'tiktok', name: t('productMaster.channels.tiktok'), type: 'MARKETPLACE' },
    { id: 'lazada', name: t('productMaster.channels.lazada'), type: 'MARKETPLACE' },
    { id: 'tiki', name: t('productMaster.channels.tiki'), type: 'MARKETPLACE' },
    { id: 'facebook', name: t('productMaster.channels.facebook'), type: 'SOCIAL' },
    { id: 'zalo', name: t('productMaster.channels.zalo'), type: 'SOCIAL' },
    { id: 'grabfood', name: t('productMaster.channels.grabfood'), type: 'FOOD' },
    { id: 'shopeefood', name: t('productMaster.channels.shopeefood'), type: 'FOOD' },
    { id: 'befood', name: t('productMaster.channels.befood'), type: 'FOOD' },
    { id: 'agency', name: t('productMaster.channels.agency'), type: 'B2B' },
    { id: 'b2b', name: t('productMaster.channels.b2b'), type: 'B2B' }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t('productMaster.channels.title')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('productMaster.channels.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Left: Channel Selector */}
        <div className="space-y-1.5">
          {channelsList.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedChannel(c.id)}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                selectedChannel === c.id
                  ? 'border-slate-900 bg-slate-900 text-white font-semibold shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
              }`}
            >
              <span>{c.name}</span>
              <span
                className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                  selectedChannel === c.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {c.type}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Channel Mapping Table */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-800">
              {t('productMaster.channels.mappingTo')}{' '}
              <span className="font-bold text-slate-900">{channelsList.find((c) => c.id === selectedChannel)?.name}</span>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
              {t('productMaster.channels.autoSyncBadge')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">{t('productMaster.table.stt')}</th>
                  <th className="py-2.5 px-3">{t('productMaster.channels.masterSku')}</th>
                  <th className="py-2.5 px-3">{t('productMaster.table.productName')}</th>
                  <th className="py-2.5 px-3 font-mono">{t('productMaster.channels.extProdId')}</th>
                  <th className="py-2.5 px-3 font-mono">{t('productMaster.channels.extSkuId')}</th>
                  <th className="py-2.5 px-3 text-center">{t('productMaster.channels.syncStatus')}</th>
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
                    const masterSku = p.variantSku || p.sku || p.code || 'SKU-001';
                    const extProdId = `${selectedChannel.toUpperCase()}-PRD-${100000 + idx}`;
                    const extSku = `${masterSku}-${selectedChannel.substring(0, 3).toUpperCase()}`;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{masterSku}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{p.productName || p.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{extProdId}</td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-800">{extSku}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium px-2 py-0.5 rounded">
                            {t('productMaster.channels.synced')}
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
