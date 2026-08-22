export interface RecipeIngredient {
  id: string;
  ingredientSku: string;
  ingredientName: string;
  quantity: number;
  unit: string; // 'gam', 'ml', 'shot', 'muong', 'trai'
  costPerUnit: number;
  subtotalCost: number;
}

export interface BeverageItem {
  id: string;
  code: string;
  name: string;
  category: 'cafe' | 'tea' | 'smoothie' | 'juice' | 'healthy';
  categoryName: string;
  sellingPrice: number;
  estimatedCostPrice: number;
  marginPercent: number;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  image: string;
  recipe: RecipeIngredient[];
  totalSoldToday: number;
  totalRevenueToday: number;
}

export interface IngredientStock {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minAlertStock: number;
  fifoCostPrice: number;
  warehouseId: string;
  warehouseName: string;
  expiryDate: string;
}

export const INITIAL_INGREDIENTS: IngredientStock[] = [
  {
    id: 'ing-01',
    sku: 'NL-CF-ROB',
    name: 'Hạt Cà Phê Robusta Mộc Đắk Lắk (Rang Vừa)',
    category: 'Cà phê nguyên liệu',
    currentStock: 45000,
    unit: 'gam',
    minAlertStock: 10000,
    fifoCostPrice: 280, // 280đ/gam = 280k/kg
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    expiryDate: '2026-11-20'
  },
  {
    id: 'ing-02',
    sku: 'NL-MATCHA-UJI',
    name: 'Bột Matcha Uji Ceremonial Grade (Nhật Bản)',
    category: 'Trà & Bột',
    currentStock: 8200,
    unit: 'gam',
    minAlertStock: 2000,
    fifoCostPrice: 1250, // 1250đ/gam = 1.25tr/kg
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    expiryDate: '2026-12-15'
  },
  {
    id: 'ing-03',
    sku: 'NL-SUA-TUOI-THANHTRUNG',
    name: 'Sữa Tươi Thanh Trùng Nguyên Chất Dalatmilk',
    category: 'Sữa & Kem',
    currentStock: 65000,
    unit: 'ml',
    minAlertStock: 15000,
    fifoCostPrice: 38, // 38đ/ml = 38k/lít
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    expiryDate: '2026-09-10'
  },
  {
    id: 'ing-04',
    sku: 'NL-KEM-BEO-MUOI',
    name: 'Kem Béo Thực Vật & Muối Hồng Himalaya Pha Chế',
    category: 'Sữa & Kem',
    currentStock: 18000,
    unit: 'ml',
    minAlertStock: 5000,
    fifoCostPrice: 75,
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    expiryDate: '2026-10-05'
  },
  {
    id: 'ing-05',
    sku: 'NL-TRA-HOAVANG',
    name: 'Trà Hoa Vàng Ba Chẽ Thượng Hạng',
    category: 'Trà thảo mộc',
    currentStock: 5400,
    unit: 'gam',
    minAlertStock: 1000,
    fifoCostPrice: 3200,
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    expiryDate: '2027-01-30'
  },
  {
    id: 'ing-06',
    sku: 'NL-BO-SAP-034',
    name: 'Bơ Sáp 034 Đắk Lắk Cấp Đông Cắt Hạt Lựu',
    category: 'Trái cây tươi',
    currentStock: 32000,
    unit: 'gam',
    minAlertStock: 8000,
    fifoCostPrice: 65,
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    expiryDate: '2026-09-30'
  },
  {
    id: 'ing-07',
    sku: 'NL-DUONG-PHAT-ORGANIC',
    name: 'Đường Phèn Hữu Cơ Nấu Mía Quảng Ngãi',
    category: 'Chất tạo ngọt',
    currentStock: 50000,
    unit: 'ml',
    minAlertStock: 10000,
    fifoCostPrice: 22,
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    expiryDate: '2027-05-15'
  }
];

export const INITIAL_BEVERAGES: BeverageItem[] = [
  {
    id: 'bev-01',
    code: 'DU-MATCHA-LATTE',
    name: 'Matcha Latte Sữa Tươi Hạnh Nhân Uji',
    category: 'tea',
    categoryName: 'Trà & Matcha',
    sellingPrice: 55000,
    estimatedCostPrice: 15400,
    marginPercent: 72,
    isAvailable: true,
    preparationTimeMinutes: 3,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=80',
    recipe: [
      {
        id: 'r-01',
        ingredientSku: 'NL-MATCHA-UJI',
        ingredientName: 'Bột Matcha Uji (Nhật Bản)',
        quantity: 6,
        unit: 'gam',
        costPerUnit: 1250,
        subtotalCost: 7500
      },
      {
        id: 'r-02',
        ingredientSku: 'NL-SUA-TUOI-THANHTRUNG',
        ingredientName: 'Sữa Tươi Dalatmilk',
        quantity: 150,
        unit: 'ml',
        costPerUnit: 38,
        subtotalCost: 5700
      },
      {
        id: 'r-03',
        ingredientSku: 'NL-DUONG-PHAT-ORGANIC',
        ingredientName: 'Nước Đường Mía Hữu Cơ',
        quantity: 20,
        unit: 'ml',
        costPerUnit: 22,
        subtotalCost: 440
      },
      {
        id: 'r-04',
        ingredientSku: 'BAOBI-LY-NAP',
        ingredientName: 'Ly giấy Kraft + Nắp + Ống hút sinh học',
        quantity: 1,
        unit: 'cái',
        costPerUnit: 1760,
        subtotalCost: 1760
      }
    ],
    totalSoldToday: 68,
    totalRevenueToday: 3740000
  },
  {
    id: 'bev-02',
    code: 'DU-CF-MUOI',
    name: 'Cà Phê Muối Kem Béo Thượng Hạng',
    category: 'cafe',
    categoryName: 'Cà Phê',
    sellingPrice: 38000,
    estimatedCostPrice: 10200,
    marginPercent: 73.1,
    isAvailable: true,
    preparationTimeMinutes: 2,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
    recipe: [
      {
        id: 'r-05',
        ingredientSku: 'NL-CF-ROB',
        ingredientName: 'Cà phê Robusta Mộc',
        quantity: 20,
        unit: 'gam',
        costPerUnit: 280,
        subtotalCost: 5600
      },
      {
        id: 'r-06',
        ingredientSku: 'NL-KEM-BEO-MUOI',
        ingredientName: 'Kem Béo & Muối Hồng',
        quantity: 40,
        unit: 'ml',
        costPerUnit: 75,
        subtotalCost: 3000
      },
      {
        id: 'r-07',
        ingredientSku: 'BAOBI-LY-NAP',
        ingredientName: 'Ly giấy Kraft + Nắp',
        quantity: 1,
        unit: 'cái',
        costPerUnit: 1600,
        subtotalCost: 1600
      }
    ],
    totalSoldToday: 114,
    totalRevenueToday: 4332000
  },
  {
    id: 'bev-03',
    code: 'DU-TRA-HOAVANG-COLDBREW',
    name: 'Trà Hoa Vàng Coldbrew Mật Ong Rừng',
    category: 'healthy',
    categoryName: 'Thảo Mộc & Healthy',
    sellingPrice: 65000,
    estimatedCostPrice: 19800,
    marginPercent: 69.5,
    isAvailable: true,
    preparationTimeMinutes: 1,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80',
    recipe: [
      {
        id: 'r-08',
        ingredientSku: 'NL-TRA-HOAVANG',
        ingredientName: 'Trà Hoa Vàng Ba Chẽ',
        quantity: 5,
        unit: 'gam',
        costPerUnit: 3200,
        subtotalCost: 16000
      },
      {
        id: 'r-09',
        ingredientSku: 'NL-DUONG-PHAT-ORGANIC',
        ingredientName: 'Mật Ong & Đường Hữu Cơ',
        quantity: 15,
        unit: 'ml',
        costPerUnit: 120,
        subtotalCost: 1800
      },
      {
        id: 'r-10',
        ingredientSku: 'BAOBI-CHAI-THUY-TINH',
        ingredientName: 'Chai thủy tinh nắp nhôm 330ml',
        quantity: 1,
        unit: 'cái',
        costPerUnit: 2000,
        subtotalCost: 2000
      }
    ],
    totalSoldToday: 42,
    totalRevenueToday: 2730000
  },
  {
    id: 'bev-04',
    code: 'DU-SINHTO-BO-034',
    name: 'Sinh Tố Bơ 034 Sữa Hạt Macca',
    category: 'smoothie',
    categoryName: 'Sinh Tố & Trái Cây',
    sellingPrice: 59000,
    estimatedCostPrice: 16800,
    marginPercent: 71.5,
    isAvailable: true,
    preparationTimeMinutes: 4,
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&auto=format&fit=crop&q=80',
    recipe: [
      {
        id: 'r-11',
        ingredientSku: 'NL-BO-SAP-034',
        ingredientName: 'Bơ Sáp 034 Đắk Lắk',
        quantity: 150,
        unit: 'gam',
        costPerUnit: 65,
        subtotalCost: 9750
      },
      {
        id: 'r-12',
        ingredientSku: 'NL-SUA-TUOI-THANHTRUNG',
        ingredientName: 'Sữa Tươi Dalatmilk',
        quantity: 120,
        unit: 'ml',
        costPerUnit: 38,
        subtotalCost: 4560
      },
      {
        id: 'r-13',
        ingredientSku: 'NL-DUONG-PHAT-ORGANIC',
        ingredientName: 'Nước Đường Mía Hữu Cơ',
        quantity: 25,
        unit: 'ml',
        costPerUnit: 22,
        subtotalCost: 550
      },
      {
        id: 'r-14',
        ingredientSku: 'BAOBI-LY-NAP',
        ingredientName: 'Ly sinh tố + Ống hút to',
        quantity: 1,
        unit: 'cái',
        costPerUnit: 1940,
        subtotalCost: 1940
      }
    ],
    totalSoldToday: 53,
    totalRevenueToday: 3127000
  }
];
