/**
 * exportApi.ts - API client để gọi backend export Excel/PDF
 * 
 * Flow:
 * 1. Gọi API POST /export/excel hoặc /export/pdf với JSON data
 * 2. Nhận file stream từ backend
 * 3. Mở Tauri save dialog để chọn nơi lưu
 * 4. Ghi file xuống đĩa
 */

import { save } from '@tauri-apps/plugin-dialog';
import { writeFile, BaseDirectory } from '@tauri-apps/plugin-fs';

// API Base URL (điều chỉnh theo môi trường)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ============================================
// TYPES
// ============================================

export interface VoucherItem {
  sku: string;
  name: string;
  unit: string;
  qty_doc: number;
  qty_actual: number;
  unit_price: number;
}

export interface VoucherExportData {
  voucher_type: 'PN' | 'PX';
  voucher_no: string;
  voucher_date: string;
  partner_name: string;
  invoice_no?: string;
  invoice_date?: string;
  warehouse_code: string;
  warehouse_location?: string;
  attachments?: string;
  tax_rate?: number;  // Thuế suất (%): 0, 5, 8, 10...
  prepared_by?: string;
  receiver?: string;
  storekeeper?: string;
  director?: string;
  items: VoucherItem[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract filename from Content-Disposition header
 */
function extractFilename(contentDisposition: string | null, defaultName: string): string {
  if (!contentDisposition) return defaultName;
  
  const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  if (match && match[1]) {
    return match[1].replace(/['"]/g, '');
  }
  return defaultName;
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export phiếu ra file Excel qua API
 * 
 * @param data - VoucherExportData
 * @returns Promise<boolean> - true nếu thành công
 */
export async function exportToExcel(data: VoucherExportData): Promise<boolean> {
  try {
    // Validate
    if (data.items.length > 30) {
      alert('Template chỉ hỗ trợ tối đa 30 dòng hàng hóa.');
      return false;
    }

    /**
     * API: POST /export/excel
     * Purpose: Export voucher to Excel file
     * Request (JSON): VoucherExportData
     * Response: File stream (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
     * Headers: Content-Disposition: attachment; filename="..."
     */
    const response = await fetch(`${API_BASE_URL}/export/excel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    // Get filename from header
    const contentDisposition = response.headers.get('Content-Disposition');
    const defaultFilename = `${data.voucher_type}_${data.warehouse_code}_${data.voucher_no}.xlsx`;
    const suggestedFilename = extractFilename(contentDisposition, defaultFilename);

    // Get file data
    const arrayBuffer = await response.arrayBuffer();

    // Open save dialog
    const filePath = await save({
      defaultPath: suggestedFilename,
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
      title: `Lưu ${data.voucher_type === 'PN' ? 'Phiếu Nhập' : 'Phiếu Xuất'} Kho`,
    });

    if (!filePath) {
      // User cancelled
      return false;
    }

    // Write file using explicit options
    const uint8Array = new Uint8Array(arrayBuffer);
    await writeFile(filePath, uint8Array);
    
    alert(`Đã xuất file thành công: ${filePath}`);

    return true;
  } catch (error) {
    console.error('Export Excel error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    alert(`Lỗi khi xuất Excel: ${errorMsg}`);
    return false;
  }
}

/**
 * Export phiếu ra file PDF qua API
 * 
 * @param data - VoucherExportData
 * @returns Promise<boolean> - true nếu thành công
 */
export async function exportToPdf(data: VoucherExportData): Promise<boolean> {
  try {
    // Validate
    if (data.items.length > 30) {
      alert('Template chỉ hỗ trợ tối đa 30 dòng hàng hóa.');
      return false;
    }

    /**
     * API: POST /export/pdf
     * Purpose: Export voucher to PDF file
     * Request (JSON): VoucherExportData
     * Response: File stream (application/pdf)
     * Headers: Content-Disposition: attachment; filename="..."
     */
    const response = await fetch(`${API_BASE_URL}/export/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    // Get filename from header
    const contentDisposition = response.headers.get('Content-Disposition');
    const defaultFilename = `${data.voucher_type}_${data.warehouse_code}_${data.voucher_no}.pdf`;
    const suggestedFilename = extractFilename(contentDisposition, defaultFilename);

    // Get file data
    const arrayBuffer = await response.arrayBuffer();

    // Open save dialog
    const filePath = await save({
      defaultPath: suggestedFilename,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      title: `Lưu ${data.voucher_type === 'PN' ? 'Phiếu Nhập' : 'Phiếu Xuất'} Kho`,
    });

    if (!filePath) {
      // User cancelled
      return false;
    }

    // Write file using explicit options
    const uint8Array = new Uint8Array(arrayBuffer);
    await writeFile(filePath, uint8Array);
    
    alert(`Đã xuất file thành công: ${filePath}`);

    return true;
  } catch (error) {
    console.error('Export PDF error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    alert(`Lỗi khi xuất PDF: ${errorMsg}`);
    return false;
  }
}
