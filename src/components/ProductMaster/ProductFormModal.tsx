import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Product, ProductType, ProductStatus } from '../../types';
import { ProductMasterRepository } from '../../repositories/productMasterRepository';
import { useLanguage } from '../../i18n';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  tenantId?: string;
  onSave: (productData: Partial<Product>) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  tenantId = 'tenant-001',
  onSave
}) => {
  const { t } = useLanguage();
  ProductMasterRepository.initialize();

  const categories = ProductMasterRepository.findCategories(tenantId);
  const brands = ProductMasterRepository.findBrands(tenantId);
  const units = ProductMasterRepository.findUnits(tenantId);

  // State
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState<ProductType>('FINISHED_GOOD');
  const [categoryId, setCategoryId] = useState(categories[0]?.categoryId || 'cat-beverages');
  const [brandId, setBrandId] = useState(brands[0]?.brandId || 'brd-vietcoco');
  const [unitId, setUnitId] = useState(units[0]?.unitId || 'u-hop');
  const [packSize, setPackSize] = useState('1');
  const [sku, setSku] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [trackLot, setTrackLot] = useState<boolean>(true);
  const [trackExpiry, setTrackExpiry] = useState<boolean>(true);
  const [shelfLifeDays, setShelfLifeDays] = useState<number>(365);
  const [location, setLocation] = useState('Khu A - Kệ 01');
  const [status, setStatus] = useState<ProductStatus>('ACTIVE');
  const [note, setNote] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setValidationError(null);
    if (productToEdit) {
      setProductCode(productToEdit.productCode || productToEdit.code || '');
      setProductName(productToEdit.productName || productToEdit.name || '');
      setProductType(productToEdit.productType || 'FINISHED_GOOD');
      setPackSize(String(productToEdit.packSize || '1'));
      setSku(productToEdit.variantSku || productToEdit.sku || '');
      setCostPrice(productToEdit.costPrice || 0);
      setSellingPrice(productToEdit.sellingPrice || 0);
      setTrackLot(productToEdit.trackLot ?? true);
      setTrackExpiry(productToEdit.trackExpiry ?? true);
      setShelfLifeDays(productToEdit.shelfLifeDays || 365);
      setLocation(productToEdit.location || 'Khu A - Kệ 01');
      setStatus((productToEdit.status as ProductStatus) || 'ACTIVE');
      setNote(productToEdit.note || '');

      // Match category and brand if names match
      const matchedCat = categories.find((c) => c.name === productToEdit.category || c.categoryId === productToEdit.categoryId);
      if (matchedCat) setCategoryId(matchedCat.categoryId);

      const matchedBrd = brands.find((b) => b.name === productToEdit.brand || b.brandId === productToEdit.brandId);
      if (matchedBrd) setBrandId(matchedBrd.brandId);

      const matchedUnit = units.find((u) => u.name === productToEdit.unit);
      if (matchedUnit) setUnitId(matchedUnit.unitId);
    } else {
      // Auto-generate next code
      const rand = Math.floor(1000 + Math.random() * 9000);
      setProductCode(`SP-${rand}`);
      setProductName('');
      setProductType('FINISHED_GOOD');
      setPackSize('1');
      setSku(`SKU-${rand}`);
      setCostPrice(0);
      setSellingPrice(0);
      setTrackLot(true);
      setTrackExpiry(true);
      setShelfLifeDays(365);
      setLocation('Khu A - Kệ 01');
      setStatus('ACTIVE');
      setNote('');
    }
  }, [productToEdit, isOpen, tenantId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setValidationError(t('productMaster.form.validationNameRequired'));
      return;
    }
    if (!productCode.trim()) {
      setValidationError(t('productMaster.form.validationCodeRequired'));
      return;
    }

    const selectedCategory = categories.find((c) => c.categoryId === categoryId)?.name || 'Mặc định';
    const selectedBrand = brands.find((b) => b.brandId === brandId)?.name || 'Vietcoco';
    const selectedUnit = units.find((u) => u.unitId === unitId)?.name || 'Hộp';

    const payload: Partial<Product> = {
      id: productToEdit?.id || `prod-${Date.now()}`,
      productId: productToEdit?.productId || `P${Math.floor(100000 + Math.random() * 900000)}`,
      tenantId,
      code: productCode.trim().toUpperCase(),
      productCode: productCode.trim().toUpperCase(),
      name: productName.trim(),
      productName: productName.trim(),
      productType,
      category: selectedCategory,
      categoryId,
      brand: selectedBrand,
      brandId,
      unit: selectedUnit,
      packSize,
      sku: (sku.trim() || productCode.trim()).toUpperCase(),
      variantSku: (sku.trim() || productCode.trim()).toUpperCase(),
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      minStock: 10,
      location,
      trackLot,
      trackExpiry,
      shelfLifeDays: Number(shelfLifeDays) || 365,
      status,
      note: note.trim(),
      supplierName: selectedBrand
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {productToEdit ? t('productMaster.form.editTitle') : t('productMaster.form.createTitle')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">
              {t('productMaster.form.generalInfo')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.form.code')} *
                </label>
                <input
                  type="text"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  placeholder={t('productMaster.form.codePlaceholder')}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.form.type')} *
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as ProductType)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="FINISHED_GOOD">{t('productMaster.productTypes.FINISHED_GOOD')}</option>
                  <option value="TRADING_GOOD">{t('productMaster.productTypes.TRADING_GOOD')}</option>
                  <option value="RAW_MATERIAL">{t('productMaster.productTypes.RAW_MATERIAL')}</option>
                  <option value="FOOD">{t('productMaster.productTypes.FOOD')}</option>
                  <option value="BEVERAGE">{t('productMaster.productTypes.BEVERAGE')}</option>
                  <option value="FNB_INGREDIENT">{t('productMaster.productTypes.FNB_INGREDIENT')}</option>
                  <option value="PACKAGING">{t('productMaster.productTypes.PACKAGING')}</option>
                  <option value="COMBO">{t('productMaster.productTypes.COMBO')}</option>
                  <option value="SERVICE">{t('productMaster.productTypes.SERVICE')}</option>
                  <option value="OTHER">{t('productMaster.productTypes.OTHER')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('productMaster.form.name')} *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={t('productMaster.form.namePlaceholder')}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.form.category')}
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.form.brand')}
                </label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {brands.map((b) => (
                    <option key={b.brandId} value={b.brandId}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">
              {t('productMaster.form.pricingInventory')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.form.sku')}
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder={t('productMaster.form.skuPlaceholder')}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.form.unit')}
                </label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {units.map((u) => (
                    <option key={u.unitId} value={u.unitId}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.form.packSize')}
                </label>
                <input
                  type="text"
                  value={packSize}
                  onChange={(e) => setPackSize(e.target.value)}
                  placeholder="1, 2, 6, 12, 24..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.form.costPrice')}
                </label>
                <input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.form.sellingPrice')}
                </label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.form.location')}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('productMaster.form.locationPlaceholder')}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('productMaster.table.status')}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="ACTIVE">{t('productMaster.productStatuses.ACTIVE')}</option>
                  <option value="INACTIVE">{t('productMaster.productStatuses.INACTIVE')}</option>
                  <option value="ARCHIVED">{t('productMaster.productStatuses.ARCHIVED')}</option>
                </select>
              </div>
            </div>

            {/* Lot & Expiry checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trackLot}
                  onChange={(e) => setTrackLot(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span>{t('productMaster.form.trackLot')}</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trackExpiry}
                  onChange={(e) => setTrackExpiry(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span>{t('productMaster.form.trackExpiry')}</span>
              </label>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  {t('productMaster.form.shelfLifeDays')}
                </label>
                <input
                  type="number"
                  value={shelfLifeDays}
                  onChange={(e) => setShelfLifeDays(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('productMaster.form.notes')}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('productMaster.form.notesPlaceholder')}
                rows={2}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {t('productMaster.actions.cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
            >
              {t('productMaster.actions.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
