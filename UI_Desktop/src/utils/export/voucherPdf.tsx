/**
 * voucherPdf.ts - PDF Export using @react-pdf/renderer
 * 
 * Tạo PDF phiếu nhập/xuất kho với layout rõ ràng, đẹp mắt
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import type { VoucherExportData } from '../../types/voucher';
import { amountToVietnameseWords } from './numberToWordsVi';

// Register font (optional - sử dụng font mặc định nếu không cần tiếng Việt đặc biệt)
// Font.register({ family: 'Roboto', src: '...' });

/**
 * Styles cho PDF
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 120,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 15,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    padding: 6,
    fontWeight: 'bold',
    fontSize: 9,
    borderBottom: '1pt solid #000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #ccc',
    padding: 4,
    fontSize: 9,
  },
  colSTT: { width: 30, textAlign: 'center' },
  colName: { width: 180 },
  colSKU: { width: 80 },
  colUnit: { width: 40, textAlign: 'center' },
  colQty: { width: 50, textAlign: 'right' },
  colPrice: { width: 70, textAlign: 'right' },
  colTotal: { width: 80, textAlign: 'right' },
  summary: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1pt solid #000',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  summaryLabel: {
    width: 120,
    fontWeight: 'bold',
    textAlign: 'right',
    marginRight: 10,
  },
  summaryValue: {
    width: 100,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  totalInWords: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  signature: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: 150,
    textAlign: 'center',
  },
  signatureLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  signatureNote: {
    fontSize: 8,
    fontStyle: 'italic',
    marginTop: 40,
  },
});

/**
 * Format date
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format number with thousand separators
 */
function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

/**
 * PDF Document Component
 */
const VoucherPDFDocument: React.FC<{ data: VoucherExportData }> = ({ data }) => {
  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.qty_actual * item.unit_price,
    0
  );

  const totalInWords = amountToVietnameseWords(totalAmount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>CONG TY TNHH QUAN LY KHO N3T</Text>
          <Text>Dia chi: Duong Dai hoc, P. Linh Trung, TP. Thu Duc, TP. HCM</Text>
          <Text>DT: (028) 1234 5678</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {data.voucher_type === 'PN' ? 'PHIEU NHAP KHO' : 'PHIEU XUAT KHO'}
        </Text>

        {/* Info */}
        <View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>So phieu:</Text>
            <Text style={styles.value}>{data.voucher_no}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Ngay phieu:</Text>
            <Text style={styles.value}>{formatDate(data.voucher_date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>
              {data.voucher_type === 'PN' ? 'Nha cung cap:' : 'Khach hang:'}
            </Text>
            <Text style={styles.value}>{data.partner_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Kho:</Text>
            <Text style={styles.value}>
              {data.warehouse_code}
              {data.warehouse_location ? ` - ${data.warehouse_location}` : ''}
            </Text>
          </View>
          {data.invoice_no && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>So hoa don:</Text>
              <Text style={styles.value}>
                {data.invoice_no}
                {data.invoice_date ? ` - ${formatDate(data.invoice_date)}` : ''}
              </Text>
            </View>
          )}
          {data.attachments && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Chung tu kem theo:</Text>
              <Text style={styles.value}>{data.attachments}</Text>
            </View>
          )}
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colSTT}>STT</Text>
            <Text style={styles.colName}>Ten hang hoa</Text>
            <Text style={styles.colSKU}>Ma hang</Text>
            <Text style={styles.colUnit}>DVT</Text>
            <Text style={styles.colQty}>SL CT</Text>
            <Text style={styles.colQty}>SL TT</Text>
            <Text style={styles.colPrice}>Don gia</Text>
            <Text style={styles.colTotal}>Thanh tien</Text>
          </View>

          {/* Rows */}
          {data.items.map((item, index) => {
            const lineTotal = item.qty_actual * item.unit_price;
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colSTT}>{index + 1}</Text>
                <Text style={styles.colName}>{item.name}</Text>
                <Text style={styles.colSKU}>{item.sku}</Text>
                <Text style={styles.colUnit}>{item.unit}</Text>
                <Text style={styles.colQty}>{formatNumber(item.qty_doc)}</Text>
                <Text style={styles.colQty}>{formatNumber(item.qty_actual)}</Text>
                <Text style={styles.colPrice}>{formatNumber(item.unit_price)}</Text>
                <Text style={styles.colTotal}>{formatNumber(lineTotal)}</Text>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TONG CONG:</Text>
            <Text style={styles.summaryValue}>{formatNumber(totalAmount)}</Text>
          </View>
          <View style={styles.totalInWords}>
            <Text>Bang chu: {totalInWords}</Text>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Nguoi lap phieu</Text>
            <Text style={styles.signatureNote}>(Ky, ghi ro ho ten)</Text>
            {data.prepared_by && <Text>{data.prepared_by}</Text>}
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>
              {data.voucher_type === 'PN' ? 'Nguoi giao' : 'Nguoi nhan'}
            </Text>
            <Text style={styles.signatureNote}>(Ky, ghi ro ho ten)</Text>
            {data.receiver && <Text>{data.receiver}</Text>}
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Thu kho</Text>
            <Text style={styles.signatureNote}>(Ky, ghi ro ho ten)</Text>
            {data.storekeeper && <Text>{data.storekeeper}</Text>}
          </View>
        </View>
      </Page>
    </Document>
  );
};

/**
 * Generate PDF filename
 */
function generateFileName(data: VoucherExportData): string {
  const date = new Date(data.voucher_date);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const voucherNoSafe = data.voucher_no.replace(/[\/\\:*?"<>|]/g, '-');
  const warehouseSafe = data.warehouse_code.replace(/[\/\\:*?"<>|]/g, '-');

  return `${data.voucher_type}_${warehouseSafe}_${yyyy}${mm}_${voucherNoSafe}.pdf`;
}

/**
 * Export voucher to PDF
 * @param data - Voucher data to export
 * @returns Promise<boolean> - true if success, false if cancelled/error
 */
export async function exportVoucherToPDF(data: VoucherExportData): Promise<boolean> {
  try {
    // Validate: max 30 items
    if (data.items.length > 30) {
      alert('Template chỉ hỗ trợ tối đa 30 dòng hàng hóa. Vui lòng giảm số lượng.');
      return false;
    }

    // Generate PDF
    const blob = await pdf(<VoucherPDFDocument data={data} />).toBlob();
    const arrayBuffer = await blob.arrayBuffer();

    // Open save dialog
    const fileName = generateFileName(data);
    const filePath = await save({
      defaultPath: fileName,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      title: `Lưu ${data.voucher_type === 'PN' ? 'Phiếu Nhập' : 'Phiếu Xuất'} Kho`,
    });

    if (!filePath) {
      // User cancelled
      return false;
    }

    // Write file
    await writeFile(filePath, new Uint8Array(arrayBuffer));

    return true;
  } catch (error) {
    console.error('Export PDF error:', error);
    alert(`Lỗi khi xuất PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}
