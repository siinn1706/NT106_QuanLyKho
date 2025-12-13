/**
 * voucherConverter.ts - Convert Stock records to VoucherExportData
 * 
 * Chuyển đổi dữ liệu từ StockInRecord/StockOutRecord sang VoucherExportData
 * để sử dụng cho export Excel/PDF qua Backend API
 */

import type { VoucherExportData, VoucherItem } from '../../app/exportApi';

/**
 * Stock In Record interface (from Stock_In_Page)
 */
export interface StockInRecord {
  id: string;
  supplier: string;
  date: string;
  note: string;
  items: Array<{
    item_id: string;
    item_code: string;
    item_name: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
  total_quantity: number;
  total_amount: number;
  created_at: string;
  status?: string;
  tax_rate?: number;  // Thuế suất (%)
}

/**
 * Stock Out Record interface (from Stock_Out_Page)
 */
export interface StockOutRecord {
  id: string;
  recipient: string;
  purpose: string;
  date: string;
  note: string;
  items: Array<{
    item_id: string;
    item_code: string;
    item_name: string;
    quantity: number;
    unit: string;
    sell_price?: number;
  }>;
  total_quantity: number;
  total_amount?: number;
  created_at: string;
  tax_rate?: number;  // Thuế suất (%)
}

/**
 * Generate voucher number from record ID
 * VD: SI001 -> PN-000001, SO002 -> PX-000002
 */
function generateVoucherNo(recordId: string, type: 'PN' | 'PX'): string {
  const numMatch = recordId.match(/\d+/);
  const num = numMatch ? numMatch[0].padStart(6, '0') : '000001';
  return `${type}-${num}`;
}

/**
 * Convert StockInRecord to VoucherExportData
 */
export function stockInToVoucherData(
  record: StockInRecord,
  warehouseCode: string = 'K01',
  warehouseLocation?: string,
  taxRate?: number,
  additionalInfo?: {
    invoice_no?: string;
    invoice_date?: string;
    prepared_by?: string;
    receiver?: string;
    storekeeper?: string;
    director?: string;
  }
): VoucherExportData {
  const items: VoucherItem[] = record.items.map((item) => ({
    sku: item.item_code,
    name: item.item_name,
    unit: item.unit,
    qty_doc: item.quantity,      // Số lượng chứng từ = số lượng nhập
    qty_actual: item.quantity,    // Số lượng thực tế = số lượng nhập
    unit_price: item.price,
  }));

  return {
    voucher_type: 'PN',
    voucher_no: generateVoucherNo(record.id, 'PN'),
    voucher_date: record.date,
    partner_name: record.supplier,
    warehouse_code: warehouseCode,
    warehouse_location: warehouseLocation,
    attachments: record.note ? `Ghi chú: ${record.note}` : undefined,
    tax_rate: taxRate ?? record.tax_rate ?? 0,
    items,
    ...additionalInfo,
  };
}

/**
 * Convert StockOutRecord to VoucherExportData
 */
export function stockOutToVoucherData(
  record: StockOutRecord,
  warehouseCode: string = 'K01',
  warehouseLocation?: string,
  taxRate?: number,
  additionalInfo?: {
    invoice_no?: string;
    invoice_date?: string;
    prepared_by?: string;
    receiver?: string;
    storekeeper?: string;
    director?: string;
  }
): VoucherExportData {
  const items: VoucherItem[] = record.items.map((item) => ({
    sku: item.item_code,
    name: item.item_name,
    unit: item.unit,
    qty_doc: item.quantity,       // Số lượng chứng từ
    qty_actual: item.quantity,     // Số lượng thực tế
    unit_price: item.sell_price ?? 0,
  }));

  return {
    voucher_type: 'PX',
    voucher_no: generateVoucherNo(record.id, 'PX'),
    voucher_date: record.date,
    partner_name: record.recipient,
    warehouse_code: warehouseCode,
    warehouse_location: warehouseLocation,
    attachments: record.note ? `Mục đích: ${record.purpose}. ${record.note}` : record.purpose,
    tax_rate: taxRate ?? record.tax_rate ?? 0,
    items,
    ...additionalInfo,
  };
}
