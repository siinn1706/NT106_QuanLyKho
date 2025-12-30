/**
 * notification_engine.ts - Notification generation engine
 * 
 * Logic build derived alerts và event notifications từ data sources
 */

import {
  Notification,
  NotificationConfig,
  NotificationSeverity,
} from '../types/notification';
import {
  apiGetItems,
  apiGetSuppliers,
  apiGetWarehouses,
  apiGetStockInRecords,
  apiGetStockOutRecords,
  Item,
  Supplier,
  Warehouse,
  StockInRecord,
  StockOutRecord,
} from '../app/api_client';
import { useCompanyStore } from '../state/company_store';

// ==================== CACHE ====================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Record<string, CacheEntry<any>> = {};

async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  const now = Date.now();
  const entry = cache[key];
  
  if (entry && now - entry.timestamp < ttl) {
    return entry.data;
  }
  
  try {
    const data = await fetcher();
    cache[key] = { data, timestamp: now };
    return data;
  } catch (error) {
    // If fetch fails and we have stale cache, use it
    if (entry) {
      console.warn(`[NotificationEngine] Using stale cache for ${key}:`, error);
      return entry.data;
    }
    throw error;
  }
}

// ==================== ITEMS NOTIFICATIONS ====================
function buildItemNotifications(items: Item[], config: NotificationConfig): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  items.forEach((item) => {
    const quantity = item.quantity || 0;
    const minStock = item.min_stock || config.lowStockThreshold;
    
    // Negative stock (data corruption)
    if (quantity < 0) {
      notifications.push({
        id: `negative_stock_${item.id}`,
        module: 'items',
        scope: { itemId: item.id.toString() },
        kind: 'derived',
        type: 'negative_stock',
        severity: 'critical',
        title: 'Tồn kho âm',
        message: `${item.name} (${item.sku}) có số lượng âm: ${quantity}. Vui lòng kiểm tra dữ liệu.`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        actionUrl: '/items/alerts',
        dedupeKey: `negative_stock_${item.id}`,
        metadata: { itemId: item.id, sku: item.sku, quantity },
      });
    }
    // Out of stock
    else if (quantity === 0) {
      notifications.push({
        id: `out_of_stock_${item.id}`,
        module: 'items',
        scope: { itemId: item.id.toString() },
        kind: 'derived',
        type: 'out_of_stock',
        severity: 'critical',
        title: 'Hết hàng',
        message: `${item.name} (${item.sku}) đã hết hàng`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        actionUrl: '/items/alerts',
        dedupeKey: `out_of_stock_${item.id}`,
        metadata: { itemId: item.id, sku: item.sku },
      });
    }
    // Low stock
    else if (quantity > 0 && quantity < minStock) {
      notifications.push({
        id: `low_stock_${item.id}`,
        module: 'items',
        scope: { itemId: item.id.toString() },
        kind: 'derived',
        type: 'low_stock',
        severity: 'warning',
        title: 'Hàng sắp hết',
        message: `${item.name} (${item.sku}) chỉ còn ${quantity} ${item.unit}. Mức tối thiểu: ${minStock}`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        actionUrl: '/items/alerts',
        dedupeKey: `low_stock_${item.id}`,
        metadata: { itemId: item.id, sku: item.sku, quantity, minStock },
      });
    }
    
    // Expiry check
    if (item.expiry_date) {
      const expiryDate = new Date(item.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        notifications.push({
          id: `expired_${item.id}`,
          module: 'items',
          scope: { itemId: item.id.toString() },
          kind: 'derived',
          type: 'expired',
          severity: 'critical',
          title: 'Hàng hết hạn',
          message: `${item.name} (${item.sku}) đã hết hạn`,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          actionUrl: '/items/alerts',
          dedupeKey: `expired_${item.id}`,
          metadata: { itemId: item.id, sku: item.sku, expiryDate: item.expiry_date },
        });
      } else if (daysUntilExpiry <= config.expiringDays) {
        notifications.push({
          id: `expiring_soon_${item.id}`,
          module: 'items',
          scope: { itemId: item.id.toString() },
          kind: 'derived',
          type: 'expiring_soon',
          severity: 'warning',
          title: 'Hàng sắp hết hạn',
          message: `${item.name} (${item.sku}) sẽ hết hạn sau ${daysUntilExpiry} ngày`,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          actionUrl: '/items/alerts',
          dedupeKey: `expiring_soon_${item.id}`,
          metadata: { itemId: item.id, sku: item.sku, expiryDate: item.expiry_date, daysUntilExpiry },
        });
      }
    }
    
    // Invalid item check
    if (!item.sku || !item.name || !item.unit || !item.category || (item.price || 0) < 0) {
      const missing = [];
      if (!item.sku) missing.push('SKU');
      if (!item.name) missing.push('tên');
      if (!item.unit) missing.push('đơn vị');
      if (!item.category) missing.push('danh mục');
      if ((item.price || 0) < 0) missing.push('giá hợp lệ');
      
      notifications.push({
        id: `invalid_item_${item.id}`,
        module: 'items',
        scope: { itemId: item.id.toString() },
        kind: 'derived',
        type: 'invalid_item',
        severity: 'warning',
        title: 'Hàng thiếu dữ liệu',
        message: `${item.name || item.sku || `ID ${item.id}`} thiếu: ${missing.join(', ')}`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        actionUrl: `/items`,
        dedupeKey: `invalid_item_${item.id}`,
        metadata: { itemId: item.id, missing },
      });
    }
  });
  
  return notifications;
}

// ==================== STOCK NOTIFICATIONS ====================
function buildStockNotifications(
  stockInRecords: StockInRecord[],
  stockOutRecords: StockOutRecord[],
  lastSeenMap: Record<string, string>
): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();
  const lastSeenStockIn = lastSeenMap['stock_in'] || new Date(0).toISOString();
  const lastSeenStockOut = lastSeenMap['stock_out'] || new Date(0).toISOString();
  
  // Stock In events
  stockInRecords.forEach((record) => {
    const createdAt = new Date(record.created_at);
    
    // New record created after last seen
    if (record.created_at > lastSeenStockIn) {
      notifications.push({
        id: `stock_in_created_${record.id}`,
        module: 'stock',
        scope: { warehouseCode: record.warehouse_code },
        kind: 'event',
        type: 'stock_in_created',
        severity: 'info',
        title: 'Phiếu nhập mới',
        message: `Phiếu nhập #${record.id} đã được tạo${record.supplier ? ` từ ${record.supplier}` : ''}`,
        createdAt: record.created_at,
        updatedAt: record.created_at,
        actionUrl: '/stock/in',
        dedupeKey: `stock_in_created_${record.id}`,
        metadata: { recordId: record.id, warehouseCode: record.warehouse_code },
      });
    }
    
    // Cancelled record
    if (record.status === 'cancelled' && record.created_at > lastSeenStockIn) {
      notifications.push({
        id: `stock_in_cancelled_${record.id}`,
        module: 'stock',
        scope: { warehouseCode: record.warehouse_code },
        kind: 'event',
        type: 'stock_in_cancelled',
        severity: 'warning',
        title: 'Phiếu nhập đã hủy',
        message: `Phiếu nhập #${record.id} đã bị hủy`,
        createdAt: record.created_at,
        updatedAt: record.created_at,
        actionUrl: '/stock/in',
        dedupeKey: `stock_in_cancelled_${record.id}`,
        metadata: { recordId: record.id, warehouseCode: record.warehouse_code },
      });
    }
    
    // Invalid record (derived)
    if (!record.items || record.items.length === 0 || !record.warehouse_code) {
      notifications.push({
        id: `stock_record_invalid_in_${record.id}`,
        module: 'stock',
        scope: { warehouseCode: record.warehouse_code },
        kind: 'derived',
        type: 'stock_record_invalid',
        severity: 'warning',
        title: 'Phiếu nhập lỗi',
        message: `Phiếu nhập #${record.id} thiếu dữ liệu (items hoặc warehouse_code)`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        actionUrl: '/stock/in',
        dedupeKey: `stock_record_invalid_in_${record.id}`,
        metadata: { recordId: record.id },
      });
    }
  });
  
  // Stock Out events
  stockOutRecords.forEach((record) => {
    const createdAt = new Date(record.created_at);
    
    // New record created after last seen
    if (record.created_at > lastSeenStockOut) {
      notifications.push({
        id: `stock_out_created_${record.id}`,
        module: 'stock',
        scope: { warehouseCode: record.warehouse_code },
        kind: 'event',
        type: 'stock_out_created',
        severity: 'info',
        title: 'Phiếu xuất mới',
        message: `Phiếu xuất #${record.id} đã được tạo`,
        createdAt: record.created_at,
        updatedAt: record.created_at,
        actionUrl: '/stock/out',
        dedupeKey: `stock_out_created_${record.id}`,
        metadata: { recordId: record.id, warehouseCode: record.warehouse_code },
      });
    }
    
    // Cancelled record
    if (record.status === 'cancelled' && record.created_at > lastSeenStockOut) {
      notifications.push({
        id: `stock_out_cancelled_${record.id}`,
        module: 'stock',
        scope: { warehouseCode: record.warehouse_code },
        kind: 'event',
        type: 'stock_out_cancelled',
        severity: 'warning',
        title: 'Phiếu xuất đã hủy',
        message: `Phiếu xuất #${record.id} đã bị hủy`,
        createdAt: record.created_at,
        updatedAt: record.created_at,
        actionUrl: '/stock/out',
        dedupeKey: `stock_out_cancelled_${record.id}`,
        metadata: { recordId: record.id, warehouseCode: record.warehouse_code },
      });
    }
    
    // Invalid record (derived)
    if (!record.items || record.items.length === 0 || !record.warehouse_code) {
      notifications.push({
        id: `stock_record_invalid_out_${record.id}`,
        module: 'stock',
        scope: { warehouseCode: record.warehouse_code },
        kind: 'derived',
        type: 'stock_record_invalid',
        severity: 'warning',
        title: 'Phiếu xuất lỗi',
        message: `Phiếu xuất #${record.id} thiếu dữ liệu (items hoặc warehouse_code)`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        actionUrl: '/stock/out',
        dedupeKey: `stock_record_invalid_out_${record.id}`,
        metadata: { recordId: record.id },
      });
    }
  });
  
  return notifications;
}

// ==================== SUPPLIER NOTIFICATIONS ====================
function buildSupplierNotifications(
  suppliers: Supplier[],
  config: NotificationConfig,
  lastSeenMap: Record<string, string>
): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();
  const lastSeenSuppliers = lastSeenMap['suppliers'] || new Date(0).toISOString();
  
  // Check for duplicates
  const nameMap = new Map<string, Supplier[]>();
  const taxIdMap = new Map<string, Supplier[]>();
  
  suppliers.forEach((supplier) => {
    if (supplier.name) {
      const existing = nameMap.get(supplier.name.toLowerCase()) || [];
      existing.push(supplier);
      nameMap.set(supplier.name.toLowerCase(), existing);
    }
    
    if (supplier.tax_id) {
      const existing = taxIdMap.get(supplier.tax_id) || [];
      existing.push(supplier);
      taxIdMap.set(supplier.tax_id, existing);
    }
  });
  
  suppliers.forEach((supplier) => {
    // Missing contact info
    if (!supplier.phone && !supplier.email) {
      notifications.push({
        id: `supplier_missing_contact_${supplier.id}`,
        module: 'suppliers',
        scope: { supplierId: supplier.id.toString() },
        kind: 'derived',
        type: 'supplier_missing_contact',
        severity: 'warning',
        title: 'NCC thiếu thông tin liên hệ',
        message: `${supplier.name} thiếu số điện thoại và email`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        actionUrl: '/suppliers',
        dedupeKey: `supplier_missing_contact_${supplier.id}`,
        metadata: { supplierId: supplier.id },
      });
    }
    
    // Outstanding debt
    if ((supplier.outstanding_debt || 0) > config.outstandingDebtThreshold) {
      notifications.push({
        id: `supplier_outstanding_debt_${supplier.id}`,
        module: 'suppliers',
        scope: { supplierId: supplier.id.toString() },
        kind: 'derived',
        type: 'supplier_outstanding_debt',
        severity: 'critical',
        title: 'NCC nợ vượt ngưỡng',
        message: `${supplier.name} có công nợ ${(supplier.outstanding_debt || 0).toLocaleString('vi-VN')} VNĐ`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        actionUrl: '/suppliers',
        dedupeKey: `supplier_outstanding_debt_${supplier.id}`,
        metadata: { supplierId: supplier.id, debt: supplier.outstanding_debt },
      });
    }
    
    // Missing tax ID (if required)
    if (!supplier.tax_id) {
      notifications.push({
        id: `supplier_missing_tax_id_${supplier.id}`,
        module: 'suppliers',
        scope: { supplierId: supplier.id.toString() },
        kind: 'derived',
        type: 'supplier_missing_tax_id',
        severity: 'info',
        title: 'NCC thiếu MST',
        message: `${supplier.name} chưa có mã số thuế`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        actionUrl: '/suppliers',
        dedupeKey: `supplier_missing_tax_id_${supplier.id}`,
        metadata: { supplierId: supplier.id },
      });
    }
    
    // Duplicate name
    const sameName = nameMap.get(supplier.name.toLowerCase()) || [];
    if (sameName.length > 1) {
      const otherIds = sameName.filter(s => s.id !== supplier.id).map(s => s.id);
      notifications.push({
        id: `supplier_duplicate_name_${supplier.id}`,
        module: 'suppliers',
        scope: { supplierId: supplier.id.toString() },
        kind: 'derived',
        type: 'supplier_duplicate',
        severity: 'warning',
        title: 'NCC trùng tên',
        message: `${supplier.name} có ${sameName.length - 1} NCC cùng tên`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        actionUrl: '/suppliers',
        dedupeKey: `supplier_duplicate_name_${supplier.id}`,
        metadata: { supplierId: supplier.id, otherIds },
      });
    }
    
    // Duplicate tax_id
    if (supplier.tax_id) {
      const sameTaxId = taxIdMap.get(supplier.tax_id) || [];
      if (sameTaxId.length > 1) {
        const otherIds = sameTaxId.filter(s => s.id !== supplier.id).map(s => s.id);
        notifications.push({
          id: `supplier_duplicate_tax_${supplier.id}`,
          module: 'suppliers',
          scope: { supplierId: supplier.id.toString() },
          kind: 'derived',
          type: 'supplier_duplicate',
          severity: 'critical',
          title: 'NCC trùng MST',
          message: `${supplier.name} có MST trùng với ${sameTaxId.length - 1} NCC khác`,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          actionUrl: '/suppliers',
          dedupeKey: `supplier_duplicate_tax_${supplier.id}`,
          metadata: { supplierId: supplier.id, taxId: supplier.tax_id, otherIds },
        });
      }
    }
    
    // Note: Supplier doesn't have created_at/updated_at fields
    // Event notifications for suppliers would need to be tracked separately
    // or added to the Supplier type in the backend
  });
  
  return notifications;
}

// ==================== WAREHOUSE NOTIFICATIONS ====================
function buildWarehouseNotifications(
  warehouses: Warehouse[],
  activeWarehouseId: string | null,
  lastSeenMap: Record<string, string>
): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();
  const lastSeenWarehouses = lastSeenMap['warehouses'] || new Date(0).toISOString();
  
  // Check for duplicate codes
  const codeMap = new Map<string, Warehouse[]>();
  warehouses.forEach((wh) => {
    if (wh.code) {
      const existing = codeMap.get(wh.code.toLowerCase()) || [];
      existing.push(wh);
      codeMap.set(wh.code.toLowerCase(), existing);
    }
  });
  
  warehouses.forEach((wh) => {
    // Inactive warehouse selected
    if (activeWarehouseId === wh.id.toString() && !wh.is_active) {
      notifications.push({
        id: `warehouse_inactive_selected_${wh.id}`,
        module: 'warehouses',
        scope: { warehouseCode: wh.code },
        kind: 'derived',
        type: 'warehouse_inactive_selected',
        severity: 'warning',
        title: 'Kho không hoạt động đang được chọn',
        message: `${wh.name} (${wh.code}) không hoạt động nhưng đang được chọn`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        actionUrl: '/warehouses',
        dedupeKey: `warehouse_inactive_selected_${wh.id}`,
        metadata: { warehouseId: wh.id, code: wh.code },
      });
    }
    
    // Missing managers
    if (!wh.managers || wh.managers.length === 0) {
      notifications.push({
        id: `warehouse_missing_manager_${wh.id}`,
        module: 'warehouses',
        scope: { warehouseCode: wh.code },
        kind: 'derived',
        type: 'warehouse_missing_manager',
        severity: 'warning',
        title: 'Kho thiếu quản lý',
        message: `${wh.name} (${wh.code}) chưa có người quản lý`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        actionUrl: '/warehouses',
        dedupeKey: `warehouse_missing_manager_${wh.id}`,
        metadata: { warehouseId: wh.id, code: wh.code },
      });
    }
    
    // Invalid warehouse
    if (!wh.code || !wh.name) {
      notifications.push({
        id: `warehouse_invalid_${wh.id}`,
        module: 'warehouses',
        scope: { warehouseCode: wh.code },
        kind: 'derived',
        type: 'warehouse_invalid',
        severity: 'warning',
        title: 'Kho thiếu dữ liệu',
        message: `Kho ID ${wh.id} thiếu ${!wh.code ? 'mã kho' : 'tên kho'}`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        actionUrl: '/warehouses',
        dedupeKey: `warehouse_invalid_${wh.id}`,
        metadata: { warehouseId: wh.id },
      });
    }
    
    // Duplicate code
    if (wh.code) {
      const sameCode = codeMap.get(wh.code.toLowerCase()) || [];
      if (sameCode.length > 1) {
        const otherIds = sameCode.filter(w => w.id !== wh.id).map(w => w.id);
        notifications.push({
          id: `warehouse_duplicate_code_${wh.id}`,
          module: 'warehouses',
          scope: { warehouseCode: wh.code },
          kind: 'derived',
          type: 'warehouse_invalid',
          severity: 'critical',
          title: 'Kho trùng mã',
          message: `${wh.name} có mã kho trùng với ${sameCode.length - 1} kho khác`,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          actionUrl: '/warehouses',
          dedupeKey: `warehouse_duplicate_code_${wh.id}`,
          metadata: { warehouseId: wh.id, code: wh.code, otherIds },
        });
      }
    }
    
    // New/updated warehouse (event)
    if (wh.created_at && wh.created_at > lastSeenWarehouses) {
      notifications.push({
        id: `warehouse_created_${wh.id}`,
        module: 'warehouses',
        scope: { warehouseCode: wh.code },
        kind: 'event',
        type: 'warehouse_created',
        severity: 'info',
        title: 'Kho mới',
        message: `${wh.name} (${wh.code}) đã được thêm`,
        createdAt: wh.created_at,
        updatedAt: wh.created_at,
        actionUrl: '/warehouses',
        dedupeKey: `warehouse_created_${wh.id}`,
        metadata: { warehouseId: wh.id, code: wh.code },
      });
    }
  });
  
  return notifications;
}

// ==================== MAIN BUILD FUNCTION ====================
export async function buildAllNotifications(config: NotificationConfig): Promise<Notification[]> {
  const allNotifications: Notification[] = [];
  
  try {
    // Get lastSeenMap from store
    const { useNotificationsStore } = await import('../state/notifications_store');
    const lastSeenMap = useNotificationsStore.getState().lastSeenMap;
    
    // Fetch data with cache
    const [items, suppliers, warehouses, stockInRecords, stockOutRecords] = await Promise.all([
      cachedFetch('items', () => apiGetItems(), config.cacheTTL).catch(() => []),
      cachedFetch('suppliers', () => apiGetSuppliers(), config.cacheTTL).catch(() => []),
      cachedFetch('warehouses', () => apiGetWarehouses(), config.cacheTTL).catch(() => []),
      cachedFetch('stockIn', () => apiGetStockInRecords(), config.cacheTTL).catch(() => []),
      cachedFetch('stockOut', () => apiGetStockOutRecords(), config.cacheTTL).catch(() => []),
    ]);
    
    // Get active warehouse from company store
    const activeWarehouseId = useCompanyStore.getState().activeWarehouseId;
    
    // Build notifications from each source
    allNotifications.push(
      ...buildItemNotifications(items, config),
      ...buildStockNotifications(stockInRecords, stockOutRecords, lastSeenMap),
      ...buildSupplierNotifications(suppliers, config, lastSeenMap),
      ...buildWarehouseNotifications(warehouses, activeWarehouseId, lastSeenMap)
    );
    
    // TODO: Build report notifications (when report API exists)
    
  } catch (error) {
    console.error('[NotificationEngine] Build error:', error);
    throw error;
  }
  
  return allNotifications;
}

// ==================== CLEAR CACHE ====================
export function clearNotificationCache() {
  Object.keys(cache).forEach(key => delete cache[key]);
}
