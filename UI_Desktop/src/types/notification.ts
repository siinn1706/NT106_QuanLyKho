/**
 * notification.ts - Notification type definitions
 * 
 * Định nghĩa chuẩn cho hệ thống thông báo đa module
 */

// ==================== MODULE TYPES ====================
export type NotificationModule = 
  | 'home'
  | 'items'
  | 'stock'
  | 'suppliers'
  | 'warehouses'
  | 'reports'
  | 'system';

// ==================== NOTIFICATION KINDS ====================
export type NotificationKind = 
  | 'derived'   // Từ trạng thái dữ liệu (tồn tại khi điều kiện còn đúng)
  | 'event';    // Từ sự kiện (unread/seen)

// ==================== NOTIFICATION TYPES ====================
// Items
export type ItemNotificationType = 
  | 'low_stock'
  | 'out_of_stock'
  | 'expired'
  | 'expiring_soon'
  | 'negative_stock'
  | 'invalid_item';

// Stock
export type StockNotificationType =
  | 'stock_in_created'
  | 'stock_out_created'
  | 'stock_in_cancelled'
  | 'stock_out_cancelled'
  | 'stock_record_invalid';

// Suppliers
export type SupplierNotificationType =
  | 'supplier_missing_contact'
  | 'supplier_outstanding_debt'
  | 'supplier_missing_tax_id'
  | 'supplier_duplicate'
  | 'supplier_created'
  | 'supplier_updated';

// Warehouses
export type WarehouseNotificationType =
  | 'warehouse_inactive_selected'
  | 'warehouse_missing_manager'
  | 'warehouse_invalid'
  | 'warehouse_created'
  | 'warehouse_updated';

// Reports
export type ReportNotificationType =
  | 'report_export_failed'
  | 'report_data_mismatch'
  | 'report_ready';

// System
export type SystemNotificationType =
  | 'system_error'
  | 'system_info'
  | 'system_maintenance';

export type NotificationType = 
  | ItemNotificationType
  | StockNotificationType
  | SupplierNotificationType
  | WarehouseNotificationType
  | ReportNotificationType
  | SystemNotificationType;

// ==================== SEVERITY ====================
export type NotificationSeverity = 'info' | 'warning' | 'critical';

// ==================== NOTIFICATION SCOPE ====================
export interface NotificationScope {
  warehouseCode?: string;
  supplierId?: string;
  itemId?: string;
}

// ==================== MAIN NOTIFICATION INTERFACE ====================
export interface Notification {
  id: string;                        // Deterministic ID (ví dụ: low_stock_item_123)
  module: NotificationModule;
  scope: NotificationScope;
  kind: NotificationKind;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  createdAt: string;                 // ISO timestamp
  updatedAt: string;                 // ISO timestamp
  actionUrl?: string;                // Route để navigate khi click
  readAt?: string | null;            // Timestamp khi đã đọc, null = unread
  dismissedUntil?: string | null;    // Timestamp snooze/dismiss
  dedupeKey: string;                 // Key để gom notifications trùng
  metadata?: Record<string, any>;    // Additional data
}

// ==================== NOTIFICATION COUNTS ====================
export interface NotificationCounts {
  home: number;
  items: number;
  stock: number;
  suppliers: number;
  warehouses: number;
  reports: number;
  // Sub-counts
  stockIn: number;
  stockOut: number;
  itemsAlerts: number;
}

// ==================== PERSISTENCE ====================
export interface NotificationPersistence {
  userId: string;
  readMap: Record<string, string>;        // notificationId -> readAt timestamp
  lastSeenMap: Record<string, string>;    // moduleKey -> lastSeen timestamp
  dismissedUntilMap: Record<string, string>; // notificationId -> dismissedUntil timestamp
}

// ==================== NOTIFICATION CONFIG ====================
export interface NotificationConfig {
  expiringDays: number;              // Days before expiry to alert (default 7)
  lowStockThreshold: number;         // Default min_stock if not set (default 10)
  outstandingDebtThreshold: number;  // Ngưỡng nợ cảnh báo (default 100000000)
  pollInterval: number;              // Poll interval in ms (default 120000 = 2 minutes)
  cacheTTL: number;                  // Cache TTL in ms (default 60000 = 1 minute)
}

// ==================== TYPE GUARDS ====================
export function isItemNotification(type: NotificationType): type is ItemNotificationType {
  return ['low_stock', 'out_of_stock', 'expired', 'expiring_soon', 'negative_stock', 'invalid_item'].includes(type);
}

export function isStockNotification(type: NotificationType): type is StockNotificationType {
  return ['stock_in_created', 'stock_out_created', 'stock_in_cancelled', 'stock_out_cancelled', 'stock_record_invalid'].includes(type);
}

export function isSupplierNotification(type: NotificationType): type is SupplierNotificationType {
  return ['supplier_missing_contact', 'supplier_outstanding_debt', 'supplier_missing_tax_id', 'supplier_duplicate', 'supplier_created', 'supplier_updated'].includes(type);
}

export function isWarehouseNotification(type: NotificationType): type is WarehouseNotificationType {
  return ['warehouse_inactive_selected', 'warehouse_missing_manager', 'warehouse_invalid', 'warehouse_created', 'warehouse_updated'].includes(type);
}
