/**
 * voucherExcel.ts - Excel Export using ExcelJS + Template
 * 
 * Load template .xlsx từ assets, fill data vào Named Ranges và Items table,
 * sau đó save file qua Tauri dialog + fs
 * 
 * Template Contract:
 * - Named Ranges: VoucherNo, VoucherDate, PartnerName, InvoiceNo, InvoiceDate,
 *   WarehouseCode, WarehouseLocation, Attachments, TotalInWords,
 *   PreparedBy, Receiver, Storekeeper, Director
 * - Items table: A16:I45 (30 rows)
 *   A: STT, B:C (merged) item_name, D: sku, E: unit,
 *   F: qty_doc, G: qty_actual, H: unit_price, I: formula (thành tiền)
 */

import * as ExcelJS from 'exceljs';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import type { VoucherExportData } from '../../types/voucher';
import { amountToVietnameseWords } from './numberToWordsVi';

// Import templates as URLs (Vite will handle these as assets)
import templateNhapUrl from '../../assets/templates/Mau_Phieu_Nhap.xlsx?url';
import templateXuatUrl from '../../assets/templates/Mau_Phieu_Xuat.xlsx?url';

/**
 * Format date to dd/MM/yyyy
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Helper: Set value vào Named Cell
 * Note: Vì template chưa có, tạm hardcode cell address mapping
 * Khi có template thực sự, cần update mapping này cho đúng
 */
function setNamedCell(
  worksheet: ExcelJS.Worksheet,
  name: string,
  value: string | number | undefined
): void {
  // Cell mapping (cần update khi có template thực)
  const cellMap: Record<string, string> = {
    'VoucherNo': 'C5',
    'VoucherDate': 'C6',
    'PartnerName': 'C7',
    'InvoiceNo': 'C8',
    'InvoiceDate': 'C9',
    'WarehouseCode': 'C10',
    'WarehouseLocation': 'C11',
    'Attachments': 'C12',
    'TotalInWords': 'B50',
    'PreparedBy': 'B53',
    'Receiver': 'D53',
    'Storekeeper': 'F53',
    'Director': 'H53',
  };

  const cellAddress = cellMap[name];
  if (!cellAddress) {
    console.warn(`Named range "${name}" not mapped in cellMap`);
    return;
  }

  const cell = worksheet.getCell(cellAddress);
  cell.value = value ?? '';
}

/**
 * Generate filename: <voucher_type>_<warehouse_code>_<YYYYMM>_<voucher_no>.xlsx
 * VD: PN_KHO1_202512_PN-000123.xlsx
 */
function generateFileName(data: VoucherExportData): string {
  const date = new Date(data.voucher_date);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const voucherNoSafe = data.voucher_no.replace(/[\/\\:*?"<>|]/g, '-');
  const warehouseSafe = data.warehouse_code.replace(/[\/\\:*?"<>|]/g, '-');
  
  return `${data.voucher_type}_${warehouseSafe}_${yyyy}${mm}_${voucherNoSafe}.xlsx`;
}

/**
 * Export voucher to Excel using template
 * @param data - Voucher data to export
 * @returns Promise<boolean> - true if success, false if cancelled/error
 */
export async function exportVoucherToExcel(data: VoucherExportData): Promise<boolean> {
  try {
    // Validate: max 30 items
    if (data.items.length > 30) {
      alert('Template chỉ hỗ trợ tối đa 30 dòng hàng hóa. Vui lòng giảm số lượng.');
      return false;
    }

    // Load template
    const templateUrl = data.voucher_type === 'PN' ? templateNhapUrl : templateXuatUrl;
    
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(`Cannot load template: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Template worksheet not found');
    }

    // Fill header named cells
    setNamedCell(worksheet, 'VoucherNo', data.voucher_no);
    setNamedCell(worksheet, 'VoucherDate', formatDate(data.voucher_date));
    setNamedCell(worksheet, 'PartnerName', data.partner_name);
    setNamedCell(worksheet, 'InvoiceNo', data.invoice_no ?? '');
    setNamedCell(worksheet, 'InvoiceDate', data.invoice_date ? formatDate(data.invoice_date) : '');
    setNamedCell(worksheet, 'WarehouseCode', data.warehouse_code);
    setNamedCell(worksheet, 'WarehouseLocation', data.warehouse_location ?? '');
    setNamedCell(worksheet, 'Attachments', data.attachments ?? '');
    setNamedCell(worksheet, 'PreparedBy', data.prepared_by ?? '');
    setNamedCell(worksheet, 'Receiver', data.receiver ?? '');
    setNamedCell(worksheet, 'Storekeeper', data.storekeeper ?? '');
    setNamedCell(worksheet, 'Director', data.director ?? '');

    // Fill items table (rows 16-45)
    const startRow = 16;
    const maxRows = 30;

    // Tính tổng tiền
    let totalAmount = 0;

    for (let i = 0; i < maxRows; i++) {
      const row = startRow + i;
      const item = data.items[i];

      if (item) {
        // Fill data
        worksheet.getCell(`A${row}`).value = i + 1; // STT
        worksheet.getCell(`B${row}`).value = item.name; // item_name (B:C merged)
        worksheet.getCell(`D${row}`).value = item.sku; // sku/code
        worksheet.getCell(`E${row}`).value = item.unit; // unit
        worksheet.getCell(`F${row}`).value = item.qty_doc; // qty_doc
        worksheet.getCell(`G${row}`).value = item.qty_actual; // qty_actual
        worksheet.getCell(`H${row}`).value = item.unit_price; // unit_price
        // Cột I có formula tự động, KHÔNG ghi đè

        totalAmount += item.qty_actual * item.unit_price;
      } else {
        // Clear unused rows
        worksheet.getCell(`A${row}`).value = null;
        worksheet.getCell(`B${row}`).value = null;
        worksheet.getCell(`D${row}`).value = null;
        worksheet.getCell(`E${row}`).value = null;
        worksheet.getCell(`F${row}`).value = null;
        worksheet.getCell(`G${row}`).value = null;
        worksheet.getCell(`H${row}`).value = null;
      }
    }

    // Fill TotalInWords
    const totalInWords = amountToVietnameseWords(totalAmount);
    setNamedCell(worksheet, 'TotalInWords', totalInWords);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Open save dialog
    const fileName = generateFileName(data);
    const filePath = await save({
      defaultPath: fileName,
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
      title: `Lưu ${data.voucher_type === 'PN' ? 'Phiếu Nhập' : 'Phiếu Xuất'} Kho`,
    });

    if (!filePath) {
      // User cancelled
      return false;
    }

    // Write file
    await writeFile(filePath, new Uint8Array(buffer));

    return true;
  } catch (error) {
    console.error('Export Excel error:', error);
    alert(`Lỗi khi xuất Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}
