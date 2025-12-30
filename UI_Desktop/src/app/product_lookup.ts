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
        id: String(found.id),  // Ensure ID is string
        name: found.name,
        sku: found.sku,
        unit: found.unit,
        quantity: found.quantity,
        price: found.price,
        category: found.category,
        supplier_id: found.supplier_id ? String(found.supplier_id) : undefined,
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
 * @param searchMode Chế độ tìm kiếm: 'sku' chỉ tìm theo mã, 'name' chỉ tìm theo tên, 'both' tìm cả hai
 * @returns Danh sách sản phẩm phù hợp
 */
export async function searchProducts(
  keyword: string, 
  limit: number = 10,
  searchMode: 'sku' | 'name' | 'both' = 'both'
): Promise<ProductLookupResult[]> {
  if (!keyword || keyword.trim() === '') return [];
  
  const normalizedKeyword = keyword.trim().toLowerCase();
  
  try {
    const products = await getProductList();
    
    // Filter theo searchMode
    const results = products
      .filter(p => {
        const matchSku = p.sku.toLowerCase().includes(normalizedKeyword);
        const matchName = p.name.toLowerCase().includes(normalizedKeyword);
        
        switch (searchMode) {
          case 'sku':
            return matchSku;
          case 'name':
            return matchName;
          case 'both':
          default:
            return matchSku || matchName;
        }
      })
      .slice(0, limit)
      .map(p => ({
        id: String(p.id),  // Ensure ID is string
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        quantity: p.quantity,
        price: p.price,
        category: p.category,
        supplier_id: p.supplier_id ? String(p.supplier_id) : undefined,
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
// MOCK DATA - Removed (using real API now)
// ============================================

// Mock functions kept for backward compatibility but no longer used
export function lookupProductByCodeMock(_code: string): ProductLookupResult | null {
  console.warn('lookupProductByCodeMock is deprecated, use lookupProductByCode instead');
  return null;
}

export function searchProductsMock(_keyword: string, _limit: number = 10): ProductLookupResult[] {
  console.warn('searchProductsMock is deprecated, use searchProducts instead');
  return [];
}

export function searchProductsBySkuMock(_keyword: string, _limit: number = 10): ProductLookupResult[] {
  console.warn('searchProductsBySkuMock is deprecated, use searchProducts instead');
  return [];
}

export function searchProductsByNameMock(_keyword: string, _limit: number = 10): ProductLookupResult[] {
  console.warn('searchProductsByNameMock is deprecated, use searchProducts instead');
  return [];
}

export function getAllProductsMock(): ProductLookupResult[] {
  console.warn('getAllProductsMock is deprecated, use getProductList instead');
  return [];
}