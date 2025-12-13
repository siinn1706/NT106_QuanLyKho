/**
 * product_lookup.ts - Service tra cứu thông tin sản phẩm theo mã SKU/barcode
 * 
 * Khi người dùng nhập mã hàng, hệ thống sẽ tự động hiển thị:
 * - Tên hàng hoá
 * - Đơn vị tính (được quyết định khi tạo sản phẩm, không thể thay đổi khi nhập/xuất)
 * - Số lượng tồn kho hiện tại
 * - Giá nhập gần nhất (nếu có)
 */

import { Item, apiGetItems } from './api_client';

// Interface cho kết quả tra cứu sản phẩm
export interface ProductLookupResult {
  id: string;
  name: string;           // Tên hàng hoá
  sku: string;            // Mã SKU/barcode
  unit: string;           // Đơn vị tính (cố định theo sản phẩm)
  quantity: number;       // Số lượng tồn kho hiện tại
  price: number;          // Giá nhập gần nhất
  category: string;       // Danh mục
  supplier_id?: string;   // ID nhà cung cấp
  expiry_date?: string;   // Hạn sử dụng (YYYY-MM-DD)
  min_stock?: number;     // Mức tồn kho tối thiểu
  description?: string;   // Mô tả sản phẩm
}

// Cache danh sách sản phẩm để tránh gọi API nhiều lần
let productCache: Item[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 phút

/**
 * Lấy danh sách sản phẩm (có cache)
 */
export async function getProductList(): Promise<Item[]> {
  const now = Date.now();
  
  // Nếu cache còn hiệu lực, trả về từ cache
  if (productCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return productCache;
  }
  
  try {
    productCache = await apiGetItems();
    cacheTimestamp = now;
    return productCache;
  } catch (error) {
    console.error('Lỗi khi tải danh sách sản phẩm:', error);
    // Nếu có cache cũ, trả về cache cũ
    if (productCache) return productCache;
    throw error;
  }
}

/**
 * Xóa cache để force refresh
 */
export function clearProductCache(): void {
  productCache = null;
  cacheTimestamp = 0;
}

/**
 * Tra cứu sản phẩm theo mã SKU hoặc barcode
 * @param code Mã SKU hoặc barcode
 * @returns Thông tin sản phẩm hoặc null nếu không tìm thấy
 */
export async function lookupProductByCode(code: string): Promise<ProductLookupResult | null> {
  if (!code || code.trim() === '') return null;
  
  const normalizedCode = code.trim().toLowerCase();
  
  try {
    const products = await getProductList();
    
    // Tìm sản phẩm theo SKU (exact match, case-insensitive)
    const found = products.find(p => 
      p.sku.toLowerCase() === normalizedCode
    );
    
    if (found) {
      return {
        id: found.id,
        name: found.name,
        sku: found.sku,
        unit: found.unit,
        quantity: found.quantity,
        price: found.price,
        category: found.category,
        supplier_id: found.supplier_id,
        expiry_date: found.expiry_date,
        min_stock: found.min_stock,
        description: found.description,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Lỗi khi tra cứu sản phẩm:', error);
    return null;
  }
}

/**
 * Tìm kiếm sản phẩm theo từ khóa (tên hoặc mã)
 * @param keyword Từ khóa tìm kiếm
 * @param limit Số kết quả tối đa
 * @returns Danh sách sản phẩm phù hợp
 */
export async function searchProducts(keyword: string, limit: number = 10): Promise<ProductLookupResult[]> {
  if (!keyword || keyword.trim() === '') return [];
  
  const normalizedKeyword = keyword.trim().toLowerCase();
  
  try {
    const products = await getProductList();
    
    // Tìm sản phẩm có tên hoặc mã chứa từ khóa
    const results = products
      .filter(p => 
        p.name.toLowerCase().includes(normalizedKeyword) ||
        p.sku.toLowerCase().includes(normalizedKeyword)
      )
      .slice(0, limit)
      .map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        quantity: p.quantity,
        price: p.price,
        category: p.category,
        supplier_id: p.supplier_id,
        expiry_date: p.expiry_date,
        min_stock: p.min_stock,
        description: p.description,
      }));
    
    return results;
  } catch (error) {
    console.error('Lỗi khi tìm kiếm sản phẩm:', error);
    return [];
  }
}

// ============================================
// MOCK DATA - Sử dụng khi BE chưa sẵn sàng
// ============================================

const MOCK_PRODUCTS: Item[] = [
  {
    id: 'ITEM001',
    name: 'Sản phẩm mẫu A',
    sku: 'SP-001',
    quantity: 50,
    unit: 'Cái',
    price: 100000,
    category: 'Điện tử',
    supplier_id: 'SUP001',
    min_stock: 10,
    description: 'Mô tả sản phẩm mẫu A',
  },
  {
    id: 'ITEM002',
    name: 'Sản phẩm mẫu B',
    sku: 'SP-002',
    quantity: 30,
    unit: 'Hộp',
    price: 50000,
    category: 'Thực phẩm',
    supplier_id: 'SUP002',
    min_stock: 5,
    description: 'Mô tả sản phẩm mẫu B',
  },
  {
    id: 'ITEM003',
    name: 'Sản phẩm mẫu C',
    sku: 'SP-003',
    quantity: 100,
    unit: 'Chai',
    price: 25000,
    category: 'Vệ sinh',
    supplier_id: 'SUP001',
    min_stock: 15,
  },
  {
    id: 'ITEM004',
    name: 'Sản phẩm mẫu D',
    sku: 'SP-004',
    quantity: 80,
    unit: 'Thùng',
    price: 150000,
    category: 'Đóng gói',
    supplier_id: 'SUP001',
    min_stock: 10,
  },
  {
    id: 'ITEM005',
    name: 'Sản phẩm mẫu E',
    sku: 'SP-005',
    quantity: 25,
    unit: 'Kg',
    price: 80000,
    category: 'Thực phẩm',
    supplier_id: 'SUP003',
    min_stock: 5,
    expiry_date: '2025-02-15', // Sắp hết hạn
  },
  {
    id: 'ITEM006',
    name: 'Sản phẩm mẫu F',
    sku: 'SP-006',
    quantity: 500,
    unit: 'Ream',
    price: 85000,
    category: 'Văn phòng phẩm',
    supplier_id: 'SUP004',
    min_stock: 100,
  },
  {
    id: 'ITEM007',
    name: 'Sản phẩm mẫu G',
    sku: 'SP-007',
    quantity: 200,
    unit: 'Lít',
    price: 45000,
    category: 'Vệ sinh',
    supplier_id: 'SUP005',
    min_stock: 50,
    expiry_date: '2025-08-15',
    description: 'Mô tả sản phẩm mẫu G',
  },
  {
    id: 'ITEM008',
    name: 'Sản phẩm mẫu H',
    sku: 'SP-008',
    quantity: 1000,
    unit: 'Gói',
    price: 8000,
    category: 'Đóng gói',
    supplier_id: 'SUP006',
    min_stock: 200,
  },
  // Sản phẩm có hạn sử dụng để test expiry warning
  {
    id: 'ITEM009',
    name: 'Sản phẩm mẫu I (Sắp hết hạn)',
    sku: 'SP-009',
    quantity: 150,
    unit: 'Hộp',
    price: 32000,
    category: 'Thực phẩm',
    supplier_id: 'SUP007',
    min_stock: 30,
    expiry_date: '2025-01-15', // Sắp hết hạn
    description: 'Mô tả sản phẩm mẫu I',
  },
  {
    id: 'ITEM010',
    name: 'Sản phẩm mẫu J (Đã hết hạn)',
    sku: 'SP-010',
    quantity: 80,
    unit: 'Hộp',
    price: 45000,
    category: 'Thực phẩm',
    supplier_id: 'SUP007',
    min_stock: 20,
    expiry_date: '2025-01-01', // Đã hết hạn
    description: 'Mô tả sản phẩm mẫu J',
  },
  {
    id: 'ITEM011',
    name: 'Sản phẩm mẫu K',
    sku: 'SP-011',
    quantity: 45,
    unit: 'Tuýp',
    price: 55000,
    category: 'Vệ sinh',
    supplier_id: 'SUP008',
    min_stock: 10,
    expiry_date: '2026-06-30',
    description: 'Mô tả sản phẩm mẫu K',
  },
];

/**
 * Tra cứu sản phẩm bằng mock data (dùng khi chưa có BE)
 */
export function lookupProductByCodeMock(code: string): ProductLookupResult | null {
  if (!code || code.trim() === '') return null;
  
  const normalizedCode = code.trim().toLowerCase();
  
  const found = MOCK_PRODUCTS.find(p => 
    p.sku.toLowerCase() === normalizedCode
  );
  
  if (found) {
    return {
      id: found.id,
      name: found.name,
      sku: found.sku,
      unit: found.unit,
      quantity: found.quantity,
      price: found.price,
      category: found.category,
      supplier_id: found.supplier_id,
      expiry_date: found.expiry_date,
      min_stock: found.min_stock,
      description: found.description,
    };
  }
  
  return null;
}

/**
 * Tìm kiếm sản phẩm bằng mock data
 */
export function searchProductsMock(keyword: string, limit: number = 10): ProductLookupResult[] {
  if (!keyword || keyword.trim() === '') return [];
  
  const normalizedKeyword = keyword.trim().toLowerCase();
  
  return MOCK_PRODUCTS
    .filter(p => 
      p.name.toLowerCase().includes(normalizedKeyword) ||
      p.sku.toLowerCase().includes(normalizedKeyword)
    )
    .slice(0, limit)
    .map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      unit: p.unit,
      quantity: p.quantity,
      price: p.price,
      category: p.category,
      supplier_id: p.supplier_id,
      expiry_date: p.expiry_date,
      min_stock: p.min_stock,
      description: p.description,
    }));
}

/**
 * Lấy tất cả mock products (cho dropdown/autocomplete)
 */
export function getAllProductsMock(): ProductLookupResult[] {
  return MOCK_PRODUCTS.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    unit: p.unit,
    quantity: p.quantity,
    price: p.price,
    category: p.category,
    supplier_id: p.supplier_id,
    expiry_date: p.expiry_date,
    min_stock: p.min_stock,
    description: p.description,
  }));
}