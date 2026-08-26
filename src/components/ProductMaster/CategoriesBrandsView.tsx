import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, FolderTree, Tag, X, Check, AlertCircle } from 'lucide-react';
import { Category, Brand } from '../../types';
import { ProductMasterRepository } from '../../repositories/productMasterRepository';
import { useLanguage } from '../../i18n';

interface CategoriesBrandsViewProps {
  tenantId?: string;
}

export const CategoriesBrandsView: React.FC<CategoriesBrandsViewProps> = ({
  tenantId = 'tenant-001'
}) => {
  const { t } = useLanguage();
  ProductMasterRepository.initialize();

  const [categories, setCategories] = useState<Category[]>(() =>
    ProductMasterRepository.findCategories(tenantId)
  );
  const [brands, setBrands] = useState<Brand[]>(() =>
    ProductMasterRepository.findBrands(tenantId)
  );

  const [subTab, setSubTab] = useState<'categories' | 'brands'>('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catCode, setCatCode] = useState('');
  const [catName, setCatName] = useState('');
  const [catParentId, setCatParentId] = useState<string>('');
  const [catDescription, setCatDescription] = useState('');
  const [catStatus, setCatStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandCode, setBrandCode] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandStatus, setBrandStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [validationError, setValidationError] = useState<string | null>(null);

  const refreshData = () => {
    setCategories(ProductMasterRepository.findCategories(tenantId));
    setBrands(ProductMasterRepository.findBrands(tenantId));
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.code && c.code.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [categories, statusFilter, searchTerm]);

  // Filtered brands
  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          (b.code && b.code.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [brands, statusFilter, searchTerm]);

  // Open Add/Edit Category Modal
  const openCategoryModal = (cat?: Category) => {
    setValidationError(null);
    if (cat) {
      setEditingCategory(cat);
      setCatCode(cat.code || '');
      setCatName(cat.name);
      setCatParentId(cat.parentId || '');
      setCatDescription(cat.description || '');
      setCatStatus(cat.status);
    } else {
      setEditingCategory(null);
      setCatCode(`CAT-${Date.now().toString().slice(-4)}`);
      setCatName('');
      setCatParentId('');
      setCatDescription('');
      setCatStatus('ACTIVE');
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setValidationError(t('productMaster.form.validationNameRequired'));
      return;
    }

    if (editingCategory) {
      ProductMasterRepository.updateCategory(tenantId, editingCategory.categoryId, {
        name: catName.trim(),
        code: catCode.trim().toUpperCase(),
        parentId: catParentId ? catParentId : null,
        description: catDescription.trim(),
        status: catStatus
      });
    } else {
      ProductMasterRepository.createCategory(tenantId, {
        name: catName.trim(),
        code: catCode.trim().toUpperCase(),
        parentId: catParentId ? catParentId : null,
        description: catDescription.trim(),
        status: catStatus
      });
    }
    setIsCategoryModalOpen(false);
    refreshData();
  };

  // Open Add/Edit Brand Modal
  const openBrandModal = (brd?: Brand) => {
    setValidationError(null);
    if (brd) {
      setEditingBrand(brd);
      setBrandCode(brd.code || '');
      setBrandName(brd.name);
      setBrandStatus(brd.status);
    } else {
      setEditingBrand(null);
      setBrandCode(`BRD-${Date.now().toString().slice(-4)}`);
      setBrandName('');
      setBrandStatus('ACTIVE');
    }
    setIsBrandModalOpen(true);
  };

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      setValidationError(t('productMaster.form.validationNameRequired'));
      return;
    }

    if (editingBrand) {
      ProductMasterRepository.updateBrand(tenantId, editingBrand.brandId, {
        name: brandName.trim(),
        code: brandCode.trim().toUpperCase(),
        status: brandStatus
      });
    } else {
      ProductMasterRepository.createBrand(tenantId, {
        name: brandName.trim(),
        code: brandCode.trim().toUpperCase(),
        status: brandStatus
      });
    }
    setIsBrandModalOpen(false);
    refreshData();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t('productMaster.categoriesBrands.title')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('productMaster.categoriesBrands.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setSubTab('categories')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                subTab === 'categories'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>{t('productMaster.categoriesBrands.categoryTreeTab')} ({categories.length})</span>
            </button>
            <button
              onClick={() => setSubTab('brands')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                subTab === 'brands'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{t('productMaster.categoriesBrands.brandTab')} ({brands.length})</span>
            </button>
          </div>

          {/* Action Button */}
          {subTab === 'categories' ? (
            <button
              onClick={() => openCategoryModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('productMaster.categoriesBrands.addCategory')}</span>
            </button>
          ) : (
            <button
              onClick={() => openBrandModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('productMaster.categoriesBrands.addBrand')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              subTab === 'categories'
                ? t('productMaster.filters.searchPlaceholder')
                : t('productMaster.filters.searchPlaceholder')
            }
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">{t('productMaster.filters.allStatuses')}</option>
            <option value="ACTIVE">{t('productMaster.productStatuses.ACTIVE')}</option>
            <option value="INACTIVE">{t('productMaster.productStatuses.INACTIVE')}</option>
          </select>
        </div>
      </div>

      {/* Content Table */}
      {subTab === 'categories' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">{t('productMaster.table.stt')}</th>
                  <th className="py-3 px-3">{t('productMaster.categoriesBrands.categoryCode')}</th>
                  <th className="py-3 px-4">{t('productMaster.categoriesBrands.categoryName')}</th>
                  <th className="py-3 px-4">{t('productMaster.categoriesBrands.parentCategory')}</th>
                  <th className="py-3 px-4">{t('productMaster.categoriesBrands.description')}</th>
                  <th className="py-3 px-3 text-center">{t('productMaster.table.status')}</th>
                  <th className="py-3 px-3 text-center w-20">{t('productMaster.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      {t('productMaster.table.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((c, idx) => {
                    const parent = categories.find((p) => p.categoryId === c.parentId);
                    const isChild = !!c.parentId;

                    return (
                      <tr key={c.categoryId} className={`hover:bg-slate-50/80 transition-colors ${isChild ? 'bg-slate-50/30' : ''}`}>
                        <td className="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-900">{c.code || c.categoryId}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <span className={isChild ? 'pl-4 text-slate-800 inline-flex items-center gap-1.5' : 'text-slate-900 font-bold'}>
                            {isChild && <span className="text-slate-400">↳</span>}
                            {c.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {parent ? parent.name : t('productMaster.categoriesBrands.rootCategory')}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{c.description || '—'}</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              c.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {t(`productMaster.productStatuses.${c.status}`, c.status)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => openCategoryModal(c)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title={t('productMaster.actions.edit')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">{t('productMaster.table.stt')}</th>
                  <th className="py-3 px-3">{t('productMaster.categoriesBrands.brandCode')}</th>
                  <th className="py-3 px-4">{t('productMaster.categoriesBrands.brandName')}</th>
                  <th className="py-3 px-4">{t('productMaster.categoriesBrands.originType')}</th>
                  <th className="py-3 px-3 text-center">{t('productMaster.table.status')}</th>
                  <th className="py-3 px-3 text-center w-20">{t('productMaster.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBrands.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {t('productMaster.table.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredBrands.map((b, idx) => (
                    <tr key={b.brandId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-900">{b.code || b.brandId}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{b.name}</td>
                      <td className="py-3 px-4 text-slate-600">{t('productMaster.categoriesBrands.standardizedBrand')}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            b.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {t(`productMaster.productStatuses.${b.status}`, b.status)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => openBrandModal(b)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title={t('productMaster.actions.edit')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCategory
                  ? t('productMaster.categoriesBrands.editCategory')
                  : t('productMaster.categoriesBrands.addCategory')}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-4 space-y-3.5">
              {validationError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.categoriesBrands.categoryCode')} *
                </label>
                <input
                  type="text"
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.categoriesBrands.categoryName')} *
                </label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ví dụ: Nông sản, May mặc, Thép..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.categoriesBrands.parentCategory')}
                </label>
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">{t('productMaster.categoriesBrands.parentSelectNone')}</option>
                  {categories
                    .filter((c) => !editingCategory || c.categoryId !== editingCategory.categoryId)
                    .map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.name} ({c.code || c.categoryId})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.categoriesBrands.description')}
                </label>
                <textarea
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.table.status')}
                </label>
                <select
                  value={catStatus}
                  onChange={(e) => setCatStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="ACTIVE">{t('productMaster.productStatuses.ACTIVE')}</option>
                  <option value="INACTIVE">{t('productMaster.productStatuses.INACTIVE')}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {t('productMaster.actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {t('productMaster.actions.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingBrand
                  ? t('productMaster.categoriesBrands.editBrand')
                  : t('productMaster.categoriesBrands.addBrand')}
              </h3>
              <button
                onClick={() => setIsBrandModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="p-4 space-y-3.5">
              {validationError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.categoriesBrands.brandCode')} *
                </label>
                <input
                  type="text"
                  value={brandCode}
                  onChange={(e) => setBrandCode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.categoriesBrands.brandName')} *
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ví dụ: Vietcoco, Hòa Phát, ST25..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.table.status')}
                </label>
                <select
                  value={brandStatus}
                  onChange={(e) => setBrandStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="ACTIVE">{t('productMaster.productStatuses.ACTIVE')}</option>
                  <option value="INACTIVE">{t('productMaster.productStatuses.INACTIVE')}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {t('productMaster.actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {t('productMaster.actions.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
