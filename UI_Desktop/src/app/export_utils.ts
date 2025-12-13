/**
 * export_utils.ts - Tiện ích xuất file Excel và PDF (theo mẫu hóa đơn)
 * 
 * Tính năng:
 * - Sử dụng mẫu phiếu từ resources/Form/
 * - Hỏi user chọn thư mục lưu file (Tauri dialog)
 * - Đặt tên file theo quy cách chuẩn
 * 
 * Quy cách đặt tên:
 * - Số phiếu: TENCT-KHO-PN/PX-YYYYMM-####
 * - Tên file: [TENCT]_[KHO]_[PN|PX]_[YYYY-MM-DD]_[SO-PHIEU]_[DOITAC].pdf/xlsx
 * 
 * External libraries (cần thiết vì resources không có sẵn):
 * - xlsx: Export Excel
 * - jspdf + jspdf-autotable: Export PDF với bảng
 * - @tauri-apps/plugin-dialog: Chọn thư mục lưu file
 * - @tauri-apps/plugin-fs: Ghi file vào đĩa
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

// ============================================
// INTERFACES
// ============================================

/**
 * Thông tin công ty (header hóa đơn)
 */
export interface CompanyInfo {
  code: string;        // Mã công ty (VD: N3T)
  name: string;
  address: string;
  phone: string;
  email: string;
  tax_id?: string;
  logo_url?: string;
}

/**
 * Thông tin kho
 */
export interface WarehouseInfo {
  code: string;        // Mã kho (VD: K01, TD01, HCM)
  name: string;
}

/**
 * Config xuất file
 */
export interface ExportConfig {
  company: CompanyInfo;
  warehouse: WarehouseInfo;
  monthlyCounter: number; // Số thứ tự trong tháng (sẽ được padding 4 số: 0001)
}

/**
 * Thông tin phiếu xuất kho
 */
export interface StockOutExportData {
  id: string;
  recipient: string;
  purpose: string;
  date: string;
  note: string;
  items: StockOutExportItem[];
  total_quantity: number;
  total_amount?: number; // Chỉ có khi purpose = "Bán hàng"
  created_at: string;
}

export interface StockOutExportItem {
  item_code: string;
  item_name: string;
  quantity: number;
  unit: string;
  sell_price?: number; // Chỉ có khi purpose = "Bán hàng"
  line_total?: number;
}

/**
 * Thông tin phiếu nhập kho
 */
export interface StockInExportData {
  id: string;
  supplier: string;
  date: string;
  note: string;
  items: StockInExportItem[];
  total_quantity: number;
  total_amount?: number;
  created_at: string;
}

export interface StockInExportItem {
  item_code: string;
  item_name: string;
  quantity: number;
  unit: string;
  purchase_price?: number;
  line_total?: number;
}

// ============================================
// DEFAULT CONFIG (có thể được override từ settings)
// ============================================

export const DEFAULT_COMPANY: CompanyInfo = {
  code: 'N3T',
  name: 'CÔNG TY TNHH QUẢN LÝ KHO N3T',
  address: 'Đường Đại học, P. Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh',
  phone: '(028) 1234 5678',
  email: 'contact@n3t-warehouse.vn',
  tax_id: '0123456789',
};

export const DEFAULT_WAREHOUSE: WarehouseInfo = {
  code: 'K01',
  name: 'Kho chính',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Chuẩn hóa chuỗi: bỏ dấu, chỉ giữ A-Z 0-9 - _
 */
const normalizeString = (str: string, maxLength: number = 16): string => {
  // Bỏ dấu tiếng Việt
  const normalized = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    // Chỉ giữ A-Z, 0-9, -, _
    .replace(/[^A-Za-z0-9\-_]/g, '')
    .toUpperCase();
  
  return normalized.substring(0, maxLength);
};

/**
 * Tạo số phiếu theo format: TENCT-KHO-PN/PX-YYYYMM-####
 */
export const generateReceiptNumber = (
  type: 'PN' | 'PX',
  config: ExportConfig,
  date: Date = new Date()
): string => {
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const counter = String(config.monthlyCounter).padStart(4, '0');
  
  return `${config.company.code}-${config.warehouse.code}-${type}-${yearMonth}-${counter}`;
};

/**
 * Tạo tên file theo format: [TENCT]_[KHO]_[PN|PX]_[YYYY-MM-DD]_[SO-PHIEU]_[DOITAC].ext
 */
export const generateFileName = (
  type: 'PN' | 'PX',
  receiptNumber: string,
  partnerName: string,
  date: Date,
  extension: 'xlsx' | 'pdf'
): string => {
  const parts = receiptNumber.split('-');
  const companyCode = parts[0]; // N3T
  const warehouseCode = parts[1]; // K01
  
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const partnerNormalized = normalizeString(partnerName, 16);
  
  return `${companyCode}_${warehouseCode}_${type}_${dateStr}_${receiptNumber}_${partnerNormalized}.${extension}`;
};

/**
 * Format số tiền VND
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Format số tiền không có ký hiệu (cho Excel)
 */
const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

/**
 * Format ngày theo DD/MM/YYYY
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format ngày giờ đầy đủ
 */
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ============================================
// EXCEL EXPORT - PHIẾU XUẤT KHO
// ============================================

/**
 * Xuất phiếu xuất kho sang file Excel
 * Sử dụng dialog để chọn thư mục lưu
 */
export const exportStockOutToExcel = async (
  data: StockOutExportData,
  config: ExportConfig = { company: DEFAULT_COMPANY, warehouse: DEFAULT_WAREHOUSE, monthlyCounter: 1 }
): Promise<boolean> => {
  try {
    const isSale = data.purpose === 'Bán hàng';
    const receiptDate = new Date(data.date);
    
    // Tạo số phiếu
    const receiptNumber = generateReceiptNumber('PX', config, receiptDate);
    
    // Tạo tên file
    const fileName = generateFileName('PX', receiptNumber, data.recipient, receiptDate, 'xlsx');
    
    // Hỏi user chọn nơi lưu file
    const filePath = await save({
      defaultPath: fileName,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
      title: 'Lưu phiếu xuất kho',
    });
    
    if (!filePath) return false; // User cancelled
    
    // Tạo workbook
    const wb = XLSX.utils.book_new();
    
    // ============================================
    // Sheet: Phiếu xuất kho (Invoice style)
    // ============================================
    const invoiceData: (string | number)[][] = [];
    
    // Header công ty (dòng 1-5)
    invoiceData.push([config.company.name]);
    invoiceData.push([config.company.address]);
    invoiceData.push([`ĐT: ${config.company.phone} | Email: ${config.company.email}`]);
    if (config.company.tax_id) {
      invoiceData.push([`Mã số thuế: ${config.company.tax_id}`]);
    }
    invoiceData.push([]); // Dòng trống
    
    // Tiêu đề phiếu
    invoiceData.push([isSale ? 'PHIẾU BÁN HÀNG' : 'PHIẾU XUẤT KHO']);
    invoiceData.push([`Số phiếu: ${receiptNumber}`]);
    invoiceData.push([`Kho: ${config.warehouse.name} (${config.warehouse.code})`]);
    invoiceData.push([]); // Dòng trống
    
    // Thông tin giao dịch
    invoiceData.push(['THÔNG TIN GIAO DỊCH']);
    invoiceData.push(['Người nhận:', data.recipient]);
    invoiceData.push(['Mục đích:', data.purpose]);
    invoiceData.push(['Ngày xuất:', formatDate(data.date)]);
    invoiceData.push(['Thời gian tạo:', formatDateTime(data.created_at)]);
    if (data.note) {
      invoiceData.push(['Ghi chú:', data.note]);
    }
    invoiceData.push([]); // Dòng trống
    
    // Header bảng sản phẩm
    invoiceData.push(['CHI TIẾT SẢN PHẨM']);
    if (isSale) {
      invoiceData.push(['STT', 'Mã hàng', 'Tên hàng', 'ĐVT', 'SL', 'Đơn giá', 'Thành tiền']);
    } else {
      invoiceData.push(['STT', 'Mã hàng', 'Tên hàng', 'ĐVT', 'Số lượng']);
    }
    
    // Data rows
    data.items.forEach((item, idx) => {
      if (isSale && item.sell_price !== undefined) {
        const lineTotal = item.quantity * item.sell_price;
        invoiceData.push([
          idx + 1,
          item.item_code,
          item.item_name,
          item.unit,
          item.quantity,
          formatNumber(item.sell_price),
          formatNumber(lineTotal),
        ]);
      } else {
        invoiceData.push([
          idx + 1,
          item.item_code,
          item.item_name,
          item.unit,
          item.quantity,
        ]);
      }
    });
    
    invoiceData.push([]); // Dòng trống
    
    // Summary
    if (isSale) {
      invoiceData.push(['', '', '', '', 'TỔNG SỐ LƯỢNG:', data.total_quantity, '']);
      if (data.total_amount !== undefined) {
        invoiceData.push(['', '', '', '', 'TỔNG TIỀN:', '', formatCurrency(data.total_amount)]);
      }
    } else {
      invoiceData.push(['', '', '', 'TỔNG SỐ LƯỢNG:', data.total_quantity]);
    }
    
    invoiceData.push([]); // Dòng trống
    invoiceData.push([]); // Dòng trống
    
    // Chữ ký
    const signatureRow = ['Người lập phiếu', '', '', 'Người nhận', '', 'Thủ kho', ''];
    invoiceData.push(signatureRow);
    invoiceData.push(['(Ký, ghi rõ họ tên)', '', '', '(Ký, ghi rõ họ tên)', '', '(Ký, ghi rõ họ tên)', '']);
    
    // Tạo worksheet
    const ws = XLSX.utils.aoa_to_sheet(invoiceData);
    
    // Cài đặt độ rộng cột
    ws['!cols'] = isSale
      ? [
          { wch: 5 },   // STT
          { wch: 15 },  // Mã hàng
          { wch: 30 },  // Tên hàng
          { wch: 10 },  // ĐVT
          { wch: 10 },  // SL
          { wch: 15 },  // Đơn giá
          { wch: 18 },  // Thành tiền
        ]
      : [
          { wch: 5 },   // STT
          { wch: 15 },  // Mã hàng
          { wch: 35 },  // Tên hàng
          { wch: 10 },  // ĐVT
          { wch: 12 },  // Số lượng
        ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Phiếu xuất kho');
    
    // Export to binary
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Ghi file qua Tauri FS
    await writeFile(filePath, new Uint8Array(wbout));
    
    return true;
  } catch (error) {
    console.error('Export Excel error:', error);
    return false;
  }
};

// ============================================
// PDF EXPORT - PHIẾU XUẤT KHO
// ============================================

/**
 * Xuất phiếu xuất kho sang file PDF
 */
export const exportStockOutToPDF = async (
  data: StockOutExportData,
  config: ExportConfig = { company: DEFAULT_COMPANY, warehouse: DEFAULT_WAREHOUSE, monthlyCounter: 1 }
): Promise<boolean> => {
  try {
    const isSale = data.purpose === 'Bán hàng';
    const receiptDate = new Date(data.date);
    
    // Tạo số phiếu
    const receiptNumber = generateReceiptNumber('PX', config, receiptDate);
    
    // Tạo tên file
    const fileName = generateFileName('PX', receiptNumber, data.recipient, receiptDate, 'pdf');
    
    // Hỏi user chọn nơi lưu file
    const filePath = await save({
      defaultPath: fileName,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      title: 'Lưu phiếu xuất kho',
    });
    
    if (!filePath) return false; // User cancelled
    
    // Tạo PDF với A4 size
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    let y = 15; // Current Y position
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    
    // ============================================
    // HEADER CÔNG TY
    // ============================================
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(config.company.name, pageWidth / 2, y, { align: 'center' });
    y += 6;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(config.company.address, pageWidth / 2, y, { align: 'center' });
    y += 5;
    
    doc.text(`DT: ${config.company.phone} | Email: ${config.company.email}`, pageWidth / 2, y, { align: 'center' });
    y += 5;
    
    if (config.company.tax_id) {
      doc.text(`Ma so thue: ${config.company.tax_id}`, pageWidth / 2, y, { align: 'center' });
      y += 5;
    }
    
    // Đường kẻ phân cách
    y += 3;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // ============================================
    // TIÊU ĐỀ PHIẾU
    // ============================================
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const title = isSale ? 'PHIEU BAN HANG' : 'PHIEU XUAT KHO';
    doc.text(title, pageWidth / 2, y, { align: 'center' });
    y += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`So phieu: ${receiptNumber}`, pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text(`Kho: ${config.warehouse.name} (${config.warehouse.code})`, pageWidth / 2, y, { align: 'center' });
    y += 10;
    
    // ============================================
    // THÔNG TIN GIAO DỊCH
    // ============================================
    doc.setFontSize(10);
    const infoStartY = y;
    
    // Cột trái
    doc.setFont('helvetica', 'bold');
    doc.text('Nguoi nhan:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(normalizeString(data.recipient, 40), margin + 28, y);
    y += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Muc dich:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.purpose, margin + 28, y);
    y += 6;
    
    if (data.note) {
      doc.setFont('helvetica', 'bold');
      doc.text('Ghi chu:', margin, y);
      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(data.note, contentWidth - 28);
      doc.text(noteLines, margin + 28, y);
      y += noteLines.length * 5;
    }
    
    // Cột phải
    const rightCol = pageWidth - margin - 50;
    let rightY = infoStartY;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Ngay xuat:', rightCol, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(data.date), rightCol + 22, rightY);
    rightY += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Ngay tao:', rightCol, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateTime(data.created_at), rightCol + 22, rightY);
    
    y = Math.max(y, rightY) + 10;
    
    // ============================================
    // BẢNG SẢN PHẨM
    // ============================================
    
    // Chuẩn bị data cho bảng
    const tableHead = isSale
      ? [['STT', 'Ma hang', 'Ten hang', 'DVT', 'SL', 'Don gia', 'Thanh tien']]
      : [['STT', 'Ma hang', 'Ten hang', 'DVT', 'So luong']];
    
    const tableBody = data.items.map((item, idx) => {
      if (isSale && item.sell_price !== undefined) {
        const lineTotal = item.quantity * item.sell_price;
        return [
          (idx + 1).toString(),
          item.item_code,
          item.item_name,
          item.unit,
          item.quantity.toString(),
          formatNumber(item.sell_price),
          formatNumber(lineTotal),
        ];
      } else {
        return [
          (idx + 1).toString(),
          item.item_code,
          item.item_name,
          item.unit,
          item.quantity.toString(),
        ];
      }
    });
    
    // Vẽ bảng với autoTable
    autoTable(doc, {
      startY: y,
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: isSale
        ? {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'left', cellWidth: 25 },
            2: { halign: 'left', cellWidth: 50 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'center', cellWidth: 15 },
            5: { halign: 'right', cellWidth: 25 },
            6: { halign: 'right', cellWidth: 28 },
          }
        : {
            0: { halign: 'center', cellWidth: 15 },
            1: { halign: 'left', cellWidth: 30 },
            2: { halign: 'left', cellWidth: 70 },
            3: { halign: 'center', cellWidth: 20 },
            4: { halign: 'center', cellWidth: 25 },
          },
      margin: { left: margin, right: margin },
      didDrawPage: () => {
        // Footer mỗi trang
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Trang ${doc.getCurrentPageInfo().pageNumber}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      },
    });
    
    // Lấy vị trí Y sau bảng
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8;
    
    // ============================================
    // TỔNG KẾT
    // ============================================
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    
    const summaryX = pageWidth - margin - 60;
    
    doc.text('Tong so luong:', summaryX, y);
    doc.text(data.total_quantity.toString(), pageWidth - margin, y, { align: 'right' });
    y += 6;
    
    if (isSale && data.total_amount !== undefined) {
      doc.setFontSize(11);
      doc.text('TONG TIEN:', summaryX, y);
      doc.setTextColor(200, 80, 0);
      doc.text(formatCurrency(data.total_amount), pageWidth - margin, y, { align: 'right' });
      doc.setTextColor(0);
      y += 10;
    }
    
    // ============================================
    // CHỮ KÝ
    // ============================================
    y += 15;
    
    // Kiểm tra có cần sang trang mới không
    if (y > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      y = 30;
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    const signaturePositions = [margin + 15, pageWidth / 2, pageWidth - margin - 30];
    const signatureLabels = ['Nguoi lap phieu', 'Nguoi nhan', 'Thu kho'];
    
    signatureLabels.forEach((label, idx) => {
      doc.text(label, signaturePositions[idx], y, { align: 'center' });
    });
    
    y += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    
    signatureLabels.forEach((_, idx) => {
      doc.text('(Ky, ghi ro ho ten)', signaturePositions[idx], y, { align: 'center' });
    });
    
    // ============================================
    // SAVE FILE qua Tauri FS
    // ============================================
    const pdfOutput = doc.output('arraybuffer');
    await writeFile(filePath, new Uint8Array(pdfOutput));
    
    return true;
  } catch (error) {
    console.error('Export PDF error:', error);
    return false;
  }
};

// ============================================
// EXCEL EXPORT - PHIẾU NHẬP KHO
// ============================================

/**
 * Xuất phiếu nhập kho sang file Excel
 */
export const exportStockInToExcel = async (
  data: StockInExportData,
  config: ExportConfig = { company: DEFAULT_COMPANY, warehouse: DEFAULT_WAREHOUSE, monthlyCounter: 1 }
): Promise<boolean> => {
  try {
    const receiptDate = new Date(data.date);
    
    // Tạo số phiếu
    const receiptNumber = generateReceiptNumber('PN', config, receiptDate);
    
    // Tạo tên file
    const fileName = generateFileName('PN', receiptNumber, data.supplier, receiptDate, 'xlsx');
    
    // Hỏi user chọn nơi lưu file
    const filePath = await save({
      defaultPath: fileName,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
      title: 'Lưu phiếu nhập kho',
    });
    
    if (!filePath) return false;
    
    // Tạo workbook
    const wb = XLSX.utils.book_new();
    const invoiceData: (string | number)[][] = [];
    
    // Header công ty
    invoiceData.push([config.company.name]);
    invoiceData.push([config.company.address]);
    invoiceData.push([`ĐT: ${config.company.phone} | Email: ${config.company.email}`]);
    if (config.company.tax_id) {
      invoiceData.push([`Mã số thuế: ${config.company.tax_id}`]);
    }
    invoiceData.push([]);
    
    // Tiêu đề phiếu
    invoiceData.push(['PHIẾU NHẬP KHO']);
    invoiceData.push([`Số phiếu: ${receiptNumber}`]);
    invoiceData.push([`Kho: ${config.warehouse.name} (${config.warehouse.code})`]);
    invoiceData.push([]);
    
    // Thông tin giao dịch
    invoiceData.push(['THÔNG TIN GIAO DỊCH']);
    invoiceData.push(['Nhà cung cấp:', data.supplier]);
    invoiceData.push(['Ngày nhập:', formatDate(data.date)]);
    invoiceData.push(['Thời gian tạo:', formatDateTime(data.created_at)]);
    if (data.note) {
      invoiceData.push(['Ghi chú:', data.note]);
    }
    invoiceData.push([]);
    
    // Header bảng sản phẩm
    invoiceData.push(['CHI TIẾT SẢN PHẨM']);
    const hasPrice = data.items.some(item => item.purchase_price !== undefined);
    if (hasPrice) {
      invoiceData.push(['STT', 'Mã hàng', 'Tên hàng', 'ĐVT', 'SL', 'Đơn giá', 'Thành tiền']);
    } else {
      invoiceData.push(['STT', 'Mã hàng', 'Tên hàng', 'ĐVT', 'Số lượng']);
    }
    
    // Data rows
    data.items.forEach((item, idx) => {
      if (hasPrice && item.purchase_price !== undefined) {
        const lineTotal = item.quantity * item.purchase_price;
        invoiceData.push([
          idx + 1,
          item.item_code,
          item.item_name,
          item.unit,
          item.quantity,
          formatNumber(item.purchase_price),
          formatNumber(lineTotal),
        ]);
      } else {
        invoiceData.push([
          idx + 1,
          item.item_code,
          item.item_name,
          item.unit,
          item.quantity,
        ]);
      }
    });
    
    invoiceData.push([]);
    
    // Summary
    if (hasPrice) {
      invoiceData.push(['', '', '', '', 'TỔNG SỐ LƯỢNG:', data.total_quantity, '']);
      if (data.total_amount !== undefined) {
        invoiceData.push(['', '', '', '', 'TỔNG TIỀN:', '', formatCurrency(data.total_amount)]);
      }
    } else {
      invoiceData.push(['', '', '', 'TỔNG SỐ LƯỢNG:', data.total_quantity]);
    }
    
    invoiceData.push([]);
    invoiceData.push([]);
    
    // Chữ ký
    invoiceData.push(['Người lập phiếu', '', '', 'Người giao', '', 'Thủ kho', '']);
    invoiceData.push(['(Ký, ghi rõ họ tên)', '', '', '(Ký, ghi rõ họ tên)', '', '(Ký, ghi rõ họ tên)', '']);
    
    // Tạo worksheet
    const ws = XLSX.utils.aoa_to_sheet(invoiceData);
    
    ws['!cols'] = hasPrice
      ? [
          { wch: 5 },
          { wch: 15 },
          { wch: 30 },
          { wch: 10 },
          { wch: 10 },
          { wch: 15 },
          { wch: 18 },
        ]
      : [
          { wch: 5 },
          { wch: 15 },
          { wch: 35 },
          { wch: 10 },
          { wch: 12 },
        ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Phiếu nhập kho');
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    await writeFile(filePath, new Uint8Array(wbout));
    
    return true;
  } catch (error) {
    console.error('Export Excel error:', error);
    return false;
  }
};

// ============================================
// PDF EXPORT - PHIẾU NHẬP KHO
// ============================================

/**
 * Xuất phiếu nhập kho sang file PDF
 */
export const exportStockInToPDF = async (
  data: StockInExportData,
  config: ExportConfig = { company: DEFAULT_COMPANY, warehouse: DEFAULT_WAREHOUSE, monthlyCounter: 1 }
): Promise<boolean> => {
  try {
    const receiptDate = new Date(data.date);
    
    // Tạo số phiếu
    const receiptNumber = generateReceiptNumber('PN', config, receiptDate);
    
    // Tạo tên file
    const fileName = generateFileName('PN', receiptNumber, data.supplier, receiptDate, 'pdf');
    
    // Hỏi user chọn nơi lưu file
    const filePath = await save({
      defaultPath: fileName,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      title: 'Lưu phiếu nhập kho',
    });
    
    if (!filePath) return false;
    
    const hasPrice = data.items.some(item => item.purchase_price !== undefined);
    
    // Tạo PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    let y = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    
    // Header công ty
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(config.company.name, pageWidth / 2, y, { align: 'center' });
    y += 6;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(config.company.address, pageWidth / 2, y, { align: 'center' });
    y += 5;
    
    doc.text(`DT: ${config.company.phone} | Email: ${config.company.email}`, pageWidth / 2, y, { align: 'center' });
    y += 5;
    
    if (config.company.tax_id) {
      doc.text(`Ma so thue: ${config.company.tax_id}`, pageWidth / 2, y, { align: 'center' });
      y += 5;
    }
    
    y += 3;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // Tiêu đề
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PHIEU NHAP KHO', pageWidth / 2, y, { align: 'center' });
    y += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`So phieu: ${receiptNumber}`, pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text(`Kho: ${config.warehouse.name} (${config.warehouse.code})`, pageWidth / 2, y, { align: 'center' });
    y += 10;
    
    // Thông tin giao dịch
    const infoStartY = y;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Nha cung cap:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(normalizeString(data.supplier, 40), margin + 30, y);
    y += 6;
    
    if (data.note) {
      doc.setFont('helvetica', 'bold');
      doc.text('Ghi chu:', margin, y);
      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(data.note, contentWidth - 28);
      doc.text(noteLines, margin + 28, y);
      y += noteLines.length * 5;
    }
    
    const rightCol = pageWidth - margin - 50;
    let rightY = infoStartY;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Ngay nhap:', rightCol, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(data.date), rightCol + 22, rightY);
    rightY += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Ngay tao:', rightCol, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateTime(data.created_at), rightCol + 22, rightY);
    
    y = Math.max(y, rightY) + 10;
    
    // Bảng sản phẩm
    const tableHead = hasPrice
      ? [['STT', 'Ma hang', 'Ten hang', 'DVT', 'SL', 'Don gia', 'Thanh tien']]
      : [['STT', 'Ma hang', 'Ten hang', 'DVT', 'So luong']];
    
    const tableBody = data.items.map((item, idx) => {
      if (hasPrice && item.purchase_price !== undefined) {
        const lineTotal = item.quantity * item.purchase_price;
        return [
          (idx + 1).toString(),
          item.item_code,
          item.item_name,
          item.unit,
          item.quantity.toString(),
          formatNumber(item.purchase_price),
          formatNumber(lineTotal),
        ];
      } else {
        return [
          (idx + 1).toString(),
          item.item_code,
          item.item_name,
          item.unit,
          item.quantity.toString(),
        ];
      }
    });
    
    autoTable(doc, {
      startY: y,
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: hasPrice
        ? {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'left', cellWidth: 25 },
            2: { halign: 'left', cellWidth: 50 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'center', cellWidth: 15 },
            5: { halign: 'right', cellWidth: 25 },
            6: { halign: 'right', cellWidth: 28 },
          }
        : {
            0: { halign: 'center', cellWidth: 15 },
            1: { halign: 'left', cellWidth: 30 },
            2: { halign: 'left', cellWidth: 70 },
            3: { halign: 'center', cellWidth: 20 },
            4: { halign: 'center', cellWidth: 25 },
          },
      margin: { left: margin, right: margin },
      didDrawPage: () => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Trang ${doc.getCurrentPageInfo().pageNumber}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      },
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8;
    
    // Tổng kết
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    
    const summaryX = pageWidth - margin - 60;
    
    doc.text('Tong so luong:', summaryX, y);
    doc.text(data.total_quantity.toString(), pageWidth - margin, y, { align: 'right' });
    y += 6;
    
    if (hasPrice && data.total_amount !== undefined) {
      doc.setFontSize(11);
      doc.text('TONG TIEN:', summaryX, y);
      doc.setTextColor(0, 128, 0);
      doc.text(formatCurrency(data.total_amount), pageWidth - margin, y, { align: 'right' });
      doc.setTextColor(0);
      y += 10;
    }
    
    // Chữ ký
    y += 15;
    
    if (y > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      y = 30;
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    const signaturePositions = [margin + 15, pageWidth / 2, pageWidth - margin - 30];
    const signatureLabels = ['Nguoi lap phieu', 'Nguoi giao', 'Thu kho'];
    
    signatureLabels.forEach((label, idx) => {
      doc.text(label, signaturePositions[idx], y, { align: 'center' });
    });
    
    y += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    
    signatureLabels.forEach((_, idx) => {
      doc.text('(Ky, ghi ro ho ten)', signaturePositions[idx], y, { align: 'center' });
    });
    
    // Save
    const pdfOutput = doc.output('arraybuffer');
    await writeFile(filePath, new Uint8Array(pdfOutput));
    
    return true;
  } catch (error) {
    console.error('Export PDF error:', error);
    return false;
  }
};

// ============================================
// HELPER: Prepare data từ component
// ============================================

/**
 * Chuẩn bị data xuất kho từ record
 */
export const prepareStockOutExportData = (
  record: {
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
  }
): StockOutExportData => {
  return {
    id: record.id,
    recipient: record.recipient,
    purpose: record.purpose,
    date: record.date,
    note: record.note,
    items: record.items.map((item) => ({
      item_code: item.item_code,
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      sell_price: item.sell_price,
      line_total: item.sell_price ? item.quantity * item.sell_price : undefined,
    })),
    total_quantity: record.total_quantity,
    total_amount: record.total_amount,
    created_at: record.created_at,
  };
};

/**
 * Chuẩn bị data nhập kho từ record
 */
export const prepareStockInExportData = (
  record: {
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
      purchase_price?: number;
    }>;
    total_quantity: number;
    total_amount?: number;
    created_at: string;
  }
): StockInExportData => {
  return {
    id: record.id,
    supplier: record.supplier,
    date: record.date,
    note: record.note,
    items: record.items.map((item) => ({
      item_code: item.item_code,
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      purchase_price: item.purchase_price,
      line_total: item.purchase_price ? item.quantity * item.purchase_price : undefined,
    })),
    total_quantity: record.total_quantity,
    total_amount: record.total_amount,
    created_at: record.created_at,
  };
};

// Backward compatibility - giữ lại tên cũ
export const prepareExportData = prepareStockOutExportData;
