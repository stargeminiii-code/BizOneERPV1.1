import { Product } from '../types';

/**
 * Enterprise Tax Code Directory for Vietnamese Suppliers & Manufacturers
 */
export interface TaxCodeCompanyInfo {
  taxCode: string;
  companyName: string;
  shortName: string;
  brand: string;
  address: string;
  phone?: string;
  email?: string;
  suggestedSerial: string;
  suggestedCqtPrefix: string;
}

export const ENTERPRISE_TAX_DIRECTORY: Record<string, TaxCodeCompanyInfo> = {
  '1300928312': {
    taxCode: '1300928312',
    companyName: 'Công ty TNHH Chế Biến Dừa Lương Quới (Vietcoco)',
    shortName: 'Vietcoco Bến Tre',
    brand: 'Vietcoco',
    address: 'Lô A36-A37, KCN An Hiệp, Xã An Hiệp, Huyện Châu Thành, Tỉnh Bến Tre',
    phone: '0275 3626 313',
    email: 'sales@vietcoco.com.vn',
    suggestedSerial: '1C26VCC',
    suggestedCqtPrefix: 'M1-26-VCC'
  },
  '0101389216': {
    taxCode: '0101389216',
    companyName: 'Công ty Cổ phần Thiết Bị Y Tế MediPlus (Hà Nội)',
    shortName: 'MediPlus HN',
    brand: 'MediPlus',
    address: 'Tầng 5, Tòa nhà MediTower, Phố Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
    phone: '024 3795 8899',
    email: 'contact@mediplus.vn',
    suggestedSerial: '1C26MYT',
    suggestedCqtPrefix: 'M1-26-HKYFC'
  },
  '0900189284': {
    taxCode: '0900189284',
    companyName: 'Công ty Cổ phần Tập đoàn Hòa Phát',
    shortName: 'Hòa Phát Group',
    brand: 'Hòa Phát',
    address: 'KCN Phố Nối A, Xã Giai Phạm, Huyện Yên Mỹ, Tỉnh Hưng Yên',
    phone: '024 6284 8666',
    email: 'thephoaphat@hoaphat.com.vn',
    suggestedSerial: '1C26HPG',
    suggestedCqtPrefix: 'M1-26-HPG'
  },
  '3700381324': {
    taxCode: '3700381324',
    companyName: 'Tập đoàn Hoa Sen (Chi nhánh Bình Dương)',
    shortName: 'Hoa Sen Group',
    brand: 'Hoa Sen',
    address: 'Số 9 Đại Lộ Thống Nhất, KCN Sóng Thần II, Dĩ An, Bình Dương',
    phone: '0274 3790 955',
    email: 'kinhdoanh@hoasengroup.vn',
    suggestedSerial: '1C26HSG',
    suggestedCqtPrefix: 'M1-26-HSG'
  },
  '0300588569': {
    taxCode: '0300588569',
    companyName: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
    shortName: 'Vinamilk',
    brand: 'Vinamilk',
    address: 'Số 10 Tân Trào, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
    phone: '028 5415 5555',
    email: 'vinamilk@vinamilk.com.vn',
    suggestedSerial: '1C26VNM',
    suggestedCqtPrefix: 'M1-26-VNM'
  },
  '3600259837': {
    taxCode: '3600259837',
    companyName: 'Công ty TNHH POSCO VST (Việt Nam)',
    shortName: 'Posco Inox',
    brand: 'Posco',
    address: 'KCN Nhơn Trạch II - Nhơn Phú, Huyện Nhơn Trạch, Tỉnh Đồng Nai',
    phone: '0251 3560 555',
    email: 'poscovst@posco.com',
    suggestedSerial: '1C26PSC',
    suggestedCqtPrefix: 'M1-26-PSC'
  },
  '0300488929': {
    taxCode: '0300488929',
    companyName: 'Công ty Cổ phần Xi măng Vicem Hà Tiên',
    shortName: 'Vicem Hà Tiên',
    brand: 'Hà Tiên',
    address: 'Số 609 Võ Văn Kiệt, Phường Cầu Kho, Quận 1, TP. Hồ Chí Minh',
    phone: '028 3836 8363',
    email: 'hatien1@vicemhatien.com.vn',
    suggestedSerial: '1C26HT1',
    suggestedCqtPrefix: 'M1-26-HT1'
  },
  '3500101684': {
    taxCode: '3500101684',
    companyName: 'Công ty Cổ phần Thép Pomina',
    shortName: 'Thép Pomina',
    brand: 'Pomina',
    address: 'Đường số 27, KCN Sóng Thần 2, Dĩ An, Bình Dương',
    phone: '0274 3790 043',
    email: 'sales@pomina-steel.com',
    suggestedSerial: '1C26POM',
    suggestedCqtPrefix: 'M1-26-POM'
  },
  '0302302324': {
    taxCode: '0302302324',
    companyName: 'Công ty Cổ phần Bánh Kẹo Á Châu (ABC Bakery)',
    shortName: 'ABC Bakery',
    brand: 'ABC Bakery',
    address: '545 Kinh Dương Vương, Phường An Lạc, Quận Bình Tân, TP.HCM',
    phone: '028 3752 0866',
    email: 'contact@abcbakery.co',
    suggestedSerial: '1C26ABC',
    suggestedCqtPrefix: 'M1-26-ABC'
  }
};

/**
 * Smart Tax Code Lookup
 */
export function lookupEnterpriseByTaxCode(taxCodeInput: string): TaxCodeCompanyInfo | null {
  if (!taxCodeInput) return null;
  const cleanCode = taxCodeInput.replace(/\D/g, '');

  if (ENTERPRISE_TAX_DIRECTORY[cleanCode]) {
    return ENTERPRISE_TAX_DIRECTORY[cleanCode];
  }

  // Partial search
  const foundKey = Object.keys(ENTERPRISE_TAX_DIRECTORY).find((k) => k.startsWith(cleanCode) || cleanCode.startsWith(k));
  if (foundKey) {
    return ENTERPRISE_TAX_DIRECTORY[foundKey];
  }

  return null;
}

/**
 * Auto-generate Next Sequential Product ID: P000001 -> P999999
 * Scans existing products and any pending items to find the smallest unused numeric index.
 */
export function generateNextProductId(
  existingProducts: Array<{ productId?: string; id?: string }> = [],
  occupiedIds: string[] = []
): string {
  const usedNumbers = new Set<number>();

  // Extract from existing products
  existingProducts.forEach((p) => {
    const rawId = p.productId || p.id || '';
    const match = rawId.match(/^P(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) {
        usedNumbers.add(num);
      }
    }
  });

  // Extract from occupiedIds (e.g. current modal rows)
  occupiedIds.forEach((rawId) => {
    if (!rawId) return;
    const match = rawId.match(/^P(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) {
        usedNumbers.add(num);
      }
    }
  });

  // Find first unused number starting from 1 to 999999
  for (let i = 1; i <= 999999; i++) {
    if (!usedNumbers.has(i)) {
      return `P${String(i).padStart(6, '0')}`;
    }
  }

  // Fallback
  return `P${String(existingProducts.length + occupiedIds.length + 1).padStart(6, '0')}`;
}

/**
 * Intelligent Brand Code Extraction
 */
export function extractBrandCode(brandName?: string): string {
  if (!brandName || !brandName.trim()) return 'GEN';
  const clean = brandName.trim().toUpperCase();

  if (clean.includes('VIETCOCO') || clean.includes('VIET COCO')) return 'VCC';
  if (clean.includes('HÒA PHÁT') || clean.includes('HOA PHAT')) return 'HPG';
  if (clean.includes('HOA SEN') || clean.includes('HOASEN')) return 'HSG';
  if (clean.includes('POMINA')) return 'POM';
  if (clean.includes('VINAMILK')) return 'VNM';
  if (clean.includes('MEDIPLUS') || clean.includes('MEDI PLUS')) return 'MDP';
  if (clean.includes('POSCO')) return 'PSC';
  if (clean.includes('HÀ TIÊN') || clean.includes('HA TIEN')) return 'HT1';
  if (clean.includes('KIM TÍN') || clean.includes('KIM TIN')) return 'KT';
  if (clean.includes('LAVIE')) return 'LAV';
  if (clean.includes('AQUAFINA')) return 'AQF';
  if (clean.includes('TH TRUE')) return 'THM';

  // For generic words: take first letters of each word
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words.map((w) => w[0]).join('').slice(0, 4);
  }
  return clean.replace(/[^A-Z0-9]/g, '').slice(0, 4);
}

/**
 * Intelligent Product Code (Mã SP Cha) Generation
 * E.g. "Sữa dừa Premium Vietcoco 330ml" -> "VCCCM330-PRM"
 */
export function generateProductCode(productName: string, brand?: string): string {
  if (!productName || !productName.trim()) return 'SKU-001';
  const raw = productName.trim();
  const upper = raw.toUpperCase();

  // 1. Detect Brand Acronym
  let brandPrefix = '';
  if (brand) {
    brandPrefix = extractBrandCode(brand);
  } else if (upper.includes('VIETCOCO') || upper.includes('VIET COCO')) {
    brandPrefix = 'VCC';
  } else if (upper.includes('HÒA PHÁT') || upper.includes('HOA PHAT')) {
    brandPrefix = 'HPG';
  } else if (upper.includes('HOA SEN')) {
    brandPrefix = 'HSG';
  } else if (upper.includes('VINAMILK')) {
    brandPrefix = 'VNM';
  } else if (upper.includes('MEDIPLUS')) {
    brandPrefix = 'MDP';
  } else {
    // Default brand code from first letters
    brandPrefix = extractBrandCode(brand || 'VCC');
  }

  // 2. Detect Product Type Code
  let typeCode = '';
  if (upper.includes('SỮA DỪA') || upper.includes('SUA DUA') || upper.includes('COCONUT MILK')) {
    typeCode = 'CM'; // Coconut Milk
  } else if (upper.includes('NƯỚC CỐT DỪA') || upper.includes('NUOC COT DUA') || upper.includes('COCONUT CREAM')) {
    typeCode = 'NCD';
  } else if (upper.includes('NƯỚC DỪA') || upper.includes('NUOC DUA') || upper.includes('COCONUT WATER')) {
    typeCode = 'CW'; // Coconut Water
  } else if (upper.includes('DẦU DỪA') || upper.includes('DAU DUA') || upper.includes('COCONUT OIL')) {
    typeCode = 'CO';
  } else if (upper.includes('THÉP CUỘN') || upper.includes('THEP CUON')) {
    typeCode = 'TC';
  } else if (upper.includes('THÉP CÂY') || upper.includes('THEP CAY') || upper.includes('THÉP THANH')) {
    typeCode = 'TV';
  } else if (upper.includes('TÔN LẠNH') || upper.includes('TON LANH')) {
    typeCode = 'TL';
  } else if (upper.includes('TÔN MẠ') || upper.includes('TON MA')) {
    typeCode = 'TM';
  } else if (upper.includes('KHẨU TRANG') || upper.includes('KHAU TRANG')) {
    typeCode = 'KT';
  } else if (upper.includes('GĂNG TAY') || upper.includes('GANG TAY')) {
    typeCode = 'GT';
  } else if (upper.includes('XI MĂNG') || upper.includes('XI MANG')) {
    typeCode = 'XM';
  } else {
    // Generate 2-3 char initials from name
    const cleanName = raw.replace(/(Vietcoco|Hòa Phát|Hoa Sen|Vinamilk|MediPlus|\d+ml|\d+g|\d+kg|\d+L)/gi, '').trim();
    const words = cleanName.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      typeCode = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1) {
      typeCode = words[0].slice(0, 2).toUpperCase();
    } else {
      typeCode = 'PRD';
    }
  }

  // 3. Detect Volume / Dimension
  let specSize = '';
  const volMatch = upper.match(/(\d+)\s*(ML|L|G|KG|MM|M)/i);
  if (volMatch) {
    specSize = volMatch[1];
  } else {
    const numMatch = upper.match(/D(\d+)|PHI\s*(\d+)/i);
    if (numMatch) {
      specSize = `D${numMatch[1] || numMatch[2]}`;
    }
  }

  // 4. Detect Sub-Type / Suffix
  let suffix = '';
  if (upper.includes('PREMIUM')) {
    suffix = 'PRM';
  } else if (upper.includes('UHT')) {
    suffix = 'UHT';
  } else if (upper.includes('ORGANIC') || upper.includes('HỮU CƠ')) {
    suffix = 'ORG';
  } else if (upper.includes('MATCHA')) {
    suffix = 'MTC';
  } else if (upper.includes('CHOCOLATE') || upper.includes('SOCOLA')) {
    suffix = 'CHO';
  } else if (upper.includes('NGUYÊN CHẤT') || upper.includes('ORIGINAL')) {
    suffix = 'ORI';
  } else if (upper.includes('CÓ ĐƯỜNG') || upper.includes('SWEET')) {
    suffix = 'SWT';
  } else if (upper.includes('KHÔNG ĐƯỜNG') || upper.includes('UNSWEET')) {
    suffix = 'USW';
  } else if (upper.includes('BÉO ĐẬM ĐẶC')) {
    suffix = 'RIC';
  } else if (upper.includes('N95')) {
    suffix = 'N95';
  } else if (upper.includes('CB300')) {
    suffix = 'CB3';
  } else if (upper.includes('CB400')) {
    suffix = 'CB4';
  }

  // Combine components
  let mainBody = `${brandPrefix}${typeCode}${specSize}`;
  if (suffix) {
    return `${mainBody}-${suffix}`;
  }
  return mainBody;
}

/**
 * Intelligent Variant SKU Generation according to BizOne ERP standard
 * Examples:
 * - Parent: "VCCCM330-PRM", Variant: "1 Hộp" -> "VCCCM330-PRM-C1"
 * - Parent: "VCCCM330-PRM", Variant: "Combo 2 Hộp" -> "VCCCM330-PRM-C2"
 * - Parent: "VCCCM330-PRM", Variant: "Combo 3 Hộp" -> "VCCCM330-PRM-C3"
 * - Parent: "VCCCM330-PRM", Variant: "Thùng 24 Hộp" -> "VCCCM330-PRM-T24"
 * - Parent: "VCCCM330-PRM", Variant: "Thùng 12 Hộp" -> "VCCCM330-PRM-T12"
 * - Parent: "VCCCM330-PRM", Variant: "Lốc 6 Hộp" -> "VCCCM330-PRM-L6"
 */
export function generateVariantSku(parentProductCode: string, variantName: string): string {
  const baseCode = (parentProductCode || 'SKU-001').trim().toUpperCase();
  if (!variantName || !variantName.trim()) {
    return `${baseCode}-C1`;
  }

  const vNorm = variantName.trim().toUpperCase();

  // 1. Single / 1 unit patterns
  if (
    vNorm === '1 HỘP' ||
    vNorm === '1 CHAI' ||
    vNorm === '1 LON' ||
    vNorm === '1 GÓI' ||
    vNorm === '1 CÁI' ||
    vNorm === '1 TÚI' ||
    vNorm === '1 CUỘN' ||
    vNorm === 'HỘP LẺ' ||
    vNorm === 'CHAI LẺ' ||
    vNorm === 'LON LẺ' ||
    vNorm === 'ĐƠN CHIẾC' ||
    vNorm === 'LẺ' ||
    vNorm === 'MẶC ĐỊNH'
  ) {
    return `${baseCode}-C1`;
  }

  // 2. Combo X patterns (e.g. "Combo 2 Hộp", "Combo 2", "Combo 3 Hộp", "Combo 4")
  const comboMatch = vNorm.match(/COMBO\s*(\d+)/i);
  if (comboMatch) {
    return `${baseCode}-C${comboMatch[1]}`;
  }

  // 3. Number + Unit patterns (e.g. "2 Hộp", "3 Hộp", "4 Chai")
  const numUnitMatch = vNorm.match(/^(\d+)\s*(HỘP|CHAI|LON|GÓI|CÁI|TÚI|CUỘN|CÂY|TẤM|BAO)/i);
  if (numUnitMatch) {
    return `${baseCode}-C${numUnitMatch[1]}`;
  }

  // 4. Thùng X patterns (e.g. "Thùng 24 Hộp", "Thùng 24", "Thùng 12 Hộp")
  const thùngMatch = vNorm.match(/THÙNG\s*(\d+)/i);
  if (thùngMatch) {
    return `${baseCode}-T${thùngMatch[1]}`;
  }

  // 5. Lốc X patterns (e.g. "Lốc 6 Hộp", "Lốc 6")
  const locMatch = vNorm.match(/LỐC\s*(\d+)/i);
  if (locMatch) {
    return `${baseCode}-L${locMatch[1]}`;
  }

  // 6. Bao X patterns (e.g. "Bao 50kg", "Bao 25kg")
  const baoMatch = vNorm.match(/BAO\s*(\d+)/i);
  if (baoMatch) {
    return `${baseCode}-B${baoMatch[1]}`;
  }

  // 7. General fallback: extract uppercase alphanumeric token
  const token = vNorm.replace(/[^A-Z0-9]/g, '').slice(0, 5);
  return `${baseCode}-${token || 'C1'}`;
}

/**
 * Predefined Combo Templates for Quick Multi-Variant Generation
 */
export function getStandardCombos(parentProductCode: string, unit = 'Hộp') {
  const pCode = parentProductCode.trim().toUpperCase();
  return [
    {
      name: `1 ${unit}`,
      variantSku: `${pCode}-C1`,
      packSize: '1',
      multiplier: 1,
      isDefault: true
    },
    {
      name: `Combo 2 ${unit}`,
      variantSku: `${pCode}-C2`,
      packSize: '2',
      multiplier: 2,
      isDefault: false
    },
    {
      name: `Combo 3 ${unit}`,
      variantSku: `${pCode}-C3`,
      packSize: '3',
      multiplier: 3,
      isDefault: false
    },
    {
      name: `Combo 4 ${unit}`,
      variantSku: `${pCode}-C4`,
      packSize: '4',
      multiplier: 4,
      isDefault: false
    },
    {
      name: `Lốc 6 ${unit}`,
      variantSku: `${pCode}-L6`,
      packSize: '6',
      multiplier: 6,
      isDefault: false
    },
    {
      name: `Thùng 12 ${unit}`,
      variantSku: `${pCode}-T12`,
      packSize: '12',
      multiplier: 12,
      isDefault: false
    },
    {
      name: `Thùng 24 ${unit}`,
      variantSku: `${pCode}-T24`,
      packSize: '24',
      multiplier: 24,
      isDefault: false
    }
  ];
}
