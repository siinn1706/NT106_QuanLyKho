/**
 * voucher.ts - Type definitions for Voucher Export
 * 
 * Định nghĩa cấu trúc dữ liệu cho phiếu nhập/xuất kho
 */

export type VoucherItem = {
  sku: string;
  name: string;
  unit: string;
  qty_doc: number;        // Số lượng trên chứng từ
  qty_actual: number;     // Số lượng thực tế
  unit_price: number;     // Đơn giá
};

export type VoucherExportData = {
  voucher_type: "PN" | "PX";     // PN = Phiếu Nhập, PX = Phiếu Xuất
  voucher_no: string;            // Số phiếu (VD: PN-000123)
  voucher_date: string;          // Ngày phiếu (ISO or dd/MM/yyyy)
  partner_name: string;          // Tên đối tác (nhà cung cấp/khách hàng)
  invoice_no?: string;           // Số hóa đơn
  invoice_date?: string;         // Ngày hóa đơn
  warehouse_code: string;        // Mã kho (VD: KHO1)
  warehouse_location?: string;   // Địa điểm kho
  attachments?: string;          // Số chứng từ kèm theo
  prepared_by?: string;          // Người lập phiếu
  receiver?: string;             // Người nhận
  storekeeper?: string;          // Thủ kho
  director?: string;             // Giám đốc
  items: VoucherItem[];          // Danh sách hàng hóa (MAX 30 items)
};
