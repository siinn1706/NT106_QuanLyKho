/**
 * Stock_In_Page.tsx - Trang Nhập kho
 * 
 * Tính năng:
 * - Hiển thị danh sách các phiếu nhập kho
 * - Bộ lọc theo NCC, mã hàng, ngày
 * - Modal tạo phiếu nhập kho mới (nhập nhiều sản phẩm cùng lúc)
 */

import { useState, useEffect } from 'react';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import DatePicker from '../../components/ui/DatePicker';
import ProductCodeInput from '../../components/ui/ProductCodeInput';
import PasskeyModal from '../../components/ui/PasskeyModal';
import SupplierAutocomplete from '../../components/ui/SupplierAutocomplete';
import { ProductLookupResult } from '../../app/product_lookup';
import { ExportVoucherButtons } from '../../components/export/ExportVoucherButtons';
import { stockInToVoucherData } from '../../utils/export/voucherConverter';
import { apiGetStockInRecords, apiCreateStockIn, apiDeleteStockIn, StockInRecord as APIStockInRecord, Supplier } from '../../app/api_client';
import { useCompanyStore } from '../../state/company_store';

// ============================================
// INTERFACES
// ============================================

// Interface cho phiếu nhập kho
interface StockInRecord {
  id: string;
  warehouse_code: string;  // Mã kho (K1, K2,...)
  supplier: string;
  date: string;
  note: string;
  items: StockInItem[];
  total_quantity: number;
  total_amount: number;
  created_at: string;
  status: 'completed' | 'pending' | 'cancelled';
  tax_rate?: number;  // Thuế suất (%)
  payment_method?: 'tiền_mặt' | 'chuyển_khoản' | 'công_nợ';  // Phương thức thanh toán
  payment_bank_account?: string;  // Số tài khoản (nếu chuyển khoản)
  payment_bank_name?: string;  // Tên ngân hàng (nếu chuyển khoản)
}

interface StockInItem {
  item_id: string;
  item_code: string;
  item_name: string;
  quantity: number;
  unit: string;
  price: number;
}

// Interface cho form row
interface ProductRow {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  quantity: string;
  unit: string;
  price: string;
  availableStock: number | null;
  isLookedUp: boolean;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_STOCK_IN_RECORDS: StockInRecord[] = [
  {
    id: 'K1_PN_1225_0001',
    warehouse_code: 'K1',
    supplier: 'Nhà cung cấp A',
    date: '2025-12-13',
    note: 'Nhập hàng đợt 1 tháng 12',
    items: [
      { item_id: 'ITEM001', item_code: 'SP-001', item_name: 'Sản phẩm mẫu A', quantity: 50, unit: 'Cái', price: 100000 },
      { item_id: 'ITEM002', item_code: 'SP-002', item_name: 'Sản phẩm mẫu B', quantity: 30, unit: 'Hộp', price: 50000 },
    ],
    total_quantity: 80,
    total_amount: 6500000,
    created_at: '2025-12-13T08:30:00',
    status: 'completed',
  },
  {
    id: 'K1_PN_1225_0002',
    warehouse_code: 'K1',
    supplier: 'Nhà cung cấp B',
    date: '2025-12-12',
    note: 'Bổ sung hàng thiếu',
    items: [
      { item_id: 'ITEM003', item_code: 'SP-003', item_name: 'Sản phẩm mẫu C', quantity: 100, unit: 'Chai', price: 25000 },
    ],
    total_quantity: 100,
    total_amount: 2500000,
    created_at: '2025-12-12T14:15:00',
    status: 'completed',
  },
  {
    id: 'SI003',
    warehouse_code: 'K1',
    supplier: 'Nhà cung cấp A',
    date: '2025-12-10',
    note: '',
    items: [
      { item_id: 'ITEM004', item_code: 'SP-004', item_name: 'Sản phẩm mẫu D', quantity: 20, unit: 'Thùng', price: 150000 },
      { item_id: 'ITEM005', item_code: 'SP-005', item_name: 'Sản phẩm mẫu E', quantity: 50, unit: 'Kg', price: 80000 },
    ],
    total_quantity: 70,
    total_amount: 7000000,
    created_at: '2025-12-10T10:00:00',
    status: 'completed',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const createEmptyRow = (): ProductRow => ({
  id: crypto.randomUUID(),
  itemId: '',
  itemName: '',
  itemCode: '',
  quantity: '',
  unit: '',
  price: '',
  availableStock: null,
  isLookedUp: false,
});

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('vi-VN') + '₫';
};

// ============================================
// COMPONENT
// ============================================

export default function Stock_In_Page() {
  // Get active warehouse
  const { warehouses, activeWarehouseId } = useCompanyStore();
  const activeWarehouse = warehouses.find(wh => wh.id === activeWarehouseId);

  // Data states
  const [records, setRecords] = useState<StockInRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterItemCode, setFilterItemCode] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([createEmptyRow()]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [batchInfo, setBatchInfo] = useState({
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    tax_rate: 0,  // Thuế suất (%)
    payment_method: 'tiền_mặt' as 'tiền_mặt' | 'chuyển_khoản' | 'công_nợ',
    payment_bank_account: '',
    payment_bank_name: '',
  });

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<StockInRecord | null>(null);
  
  // Delete passkey modal
  const [showDeletePasskeyModal, setShowDeletePasskeyModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await apiGetStockInRecords();
      // Convert API response to local type
      const converted: StockInRecord[] = data.map(r => ({
        ...r,
        status: r.status as 'completed' | 'pending' | 'cancelled',
      }));
      setRecords(converted);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      // Fallback to mock data if API fails
      setRecords(MOCK_STOCK_IN_RECORDS);
    } finally {
      setLoading(false);
    }
  };

  // Product row handlers
  const addProduct = () => {
    setProducts([...products, createEmptyRow()]);
  };

  const removeProduct = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const updateProduct = (id: string, updates: Partial<ProductRow>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleProductFound = (rowId: string, product: ProductLookupResult) => {
    updateProduct(rowId, {
      itemId: product.id,
      itemName: product.name,
      itemCode: product.sku,
      unit: product.unit,
      price: product.price.toString(),
      availableStock: product.quantity,
      isLookedUp: true,
    });
  };

  const handleProductNotFound = (rowId: string) => {
    updateProduct(rowId, {
      itemId: '',
      itemName: '',
      unit: '',
      availableStock: null,
      isLookedUp: false,
    });
    alert('Không tìm thấy sản phẩm với mã này!');
  };
  
  // Delete handlers
  const handleDeleteClick = (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa phiếu nhập kho này?')) return;
    setPendingDeleteId(id);
    setShowDeletePasskeyModal(true);
  };
  
  const handleDeleteConfirm = async (passkey: string) => {
    // TODO: Validate passkey với backend
    if (passkey !== '123456') {
      alert('Passkey không chính xác!');
      setShowDeletePasskeyModal(false);
      return;
    }
    
    if (!pendingDeleteId) return;
    
    try {
      await apiDeleteStockIn(pendingDeleteId);
      setRecords(records.filter(r => r.id !== pendingDeleteId));
      alert('Đã xóa phiếu nhập kho thành công!');
    } catch (error) {
      console.error('Delete stock in error:', error);
      alert('Không thể xóa phiếu nhập kho!');
    } finally {
      setShowDeletePasskeyModal(false);
      setPendingDeleteId(null);
    }
  };
  
  const handleDeleteCancel = () => {
    setShowDeletePasskeyModal(false);
    setPendingDeleteId(null);
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validProducts = products.filter(p => 
      p.itemName && p.itemCode && p.quantity && p.unit
    );
    
    if (validProducts.length === 0) {
      alert('Vui lòng nhập ít nhất 1 sản phẩm!');
      return;
    }

    if (!batchInfo.supplier.trim()) {
      alert('Vui lòng nhập tên nhà cung cấp!');
      return;
    }

    if (!activeWarehouse) {
      alert('Vui lòng chọn kho hàng trong cài đặt!');
      return;
    }

    try {
      // Gọi API tạo phiếu nhập kho
      const newRecord = await apiCreateStockIn({
        warehouse_code: activeWarehouse.code,  // Thêm mã kho
        supplier: batchInfo.supplier,
        date: batchInfo.date,
        note: batchInfo.note,
        tax_rate: batchInfo.tax_rate,
        payment_method: batchInfo.payment_method,
        payment_bank_account: batchInfo.payment_method === 'chuyển_khoản' ? batchInfo.payment_bank_account : undefined,
        payment_bank_name: batchInfo.payment_method === 'chuyển_khoản' ? batchInfo.payment_bank_name : undefined,
        items: validProducts.map(p => ({
          item_id: p.itemId,
          item_code: p.itemCode,
          item_name: p.itemName,
          quantity: parseInt(p.quantity),
          unit: p.unit,
          price: parseFloat(p.price) || 0,
        })),
      });

      // Thêm vào danh sách local
      const convertedRecord: StockInRecord = {
        ...newRecord,
        status: newRecord.status as 'completed' | 'pending' | 'cancelled',
      };
      setRecords([convertedRecord, ...records]);
      setShowModal(false);
      resetForm();
      alert('Nhập kho thành công!');
    } catch (error) {
      console.error('Lỗi tạo phiếu nhập:', error);
      alert(error instanceof Error ? error.message : 'Không thể tạo phiếu nhập kho');
    }
  };

  const resetForm = () => {
    setProducts([createEmptyRow()]);
    setSelectedSupplier(null);
    setBatchInfo({
      supplier: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
      tax_rate: 0,
      payment_method: 'tiền_mặt',
      payment_bank_account: '',
      payment_bank_name: '',
    });
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleViewDetail = (record: StockInRecord) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  // Filter logic
  const filteredRecords = records.filter(record => {
    // Filter by warehouse - CHỈ HIỂN THỊ PHIẾU CỦA KHO ĐANG ACTIVE
    if (activeWarehouse && record.warehouse_code !== activeWarehouse.code) {
      return false;
    }
    // Filter by supplier
    if (filterSupplier && !record.supplier.toLowerCase().includes(filterSupplier.toLowerCase())) {
      return false;
    }
    // Filter by item code
    if (filterItemCode) {
      const hasItem = record.items.some(item => 
        item.item_code.toLowerCase().includes(filterItemCode.toLowerCase())
      );
      if (!hasItem) return false;
    }
    // Filter by date range
    if (filterDateFrom && record.date < filterDateFrom) return false;
    if (filterDateTo && record.date > filterDateTo) return false;
    return true;
  });

  // Calculate totals for modal
  const totalQuantity = products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
  const totalAmount = products.reduce((sum, p) => {
    const qty = parseInt(p.quantity) || 0;
    const price = parseFloat(p.price) || 0;
    return sum + (qty * price);
  }, 0);

  // Reusable classes
  const inputClass = "w-full h-11 px-4 text-[14px] text-[var(--text-1)] bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-lg)] transition-colors duration-150 placeholder:text-[var(--text-3)] hover:border-[var(--border-hover)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";
  const inputCompactClass = "w-full h-10 px-3 text-[14px] text-[var(--text-1)] bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-md)] transition-colors duration-150 placeholder:text-[var(--text-3)] hover:border-[var(--border-hover)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";
  const inputReadonlyClass = "w-full h-10 px-3 text-[14px] text-[var(--text-1)] bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-md)] cursor-not-allowed";
  const labelClass = "flex items-center gap-2 text-[13px] font-medium text-[var(--text-2)] mb-2";
  const filterInputClass = "h-10 px-3 text-[14px] text-[var(--text-1)] bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-md)] transition-colors duration-150 placeholder:text-[var(--text-3)] hover:border-[var(--border-hover)] focus:outline-none focus:border-[var(--primary)]";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-[var(--text-1)]">Nhập kho</h1>
          <p className="text-[13px] text-[var(--text-3)] mt-1">Quản lý các phiếu nhập kho</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 h-11 px-5 rounded-[var(--radius-lg)] bg-[var(--success)] text-white font-medium hover:opacity-90 transition-opacity"
        >
          <Icon name="plus" size="sm" />
          Tạo phiếu nhập
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)]">
        {/* Filters */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Supplier */}
            <div className="relative">
              <Icon name="search" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
              <input
                type="text"
                placeholder="Tên NCC..."
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className={`${filterInputClass} pl-9 w-[180px]`}
              />
            </div>

            {/* Filter by Item Code */}
            <div className="relative">
              <Icon name="barcode" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
              <input
                type="text"
                placeholder="Mã mặt hàng..."
                value={filterItemCode}
                onChange={(e) => setFilterItemCode(e.target.value)}
                className={`${filterInputClass} pl-9 w-[180px]`}
              />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[var(--text-3)]">Từ</span>
              <DatePicker
                value={filterDateFrom}
                onChange={setFilterDateFrom}
                placeholder="Chọn ngày"
                className="w-[140px]"
              />
              <span className="text-[13px] text-[var(--text-3)]">Đến</span>
              <DatePicker
                value={filterDateTo}
                onChange={setFilterDateTo}
                placeholder="Chọn ngày"
                className="w-[140px]"
                minDate={filterDateFrom || undefined}
              />
            </div>

            {/* Clear filters */}
            {(filterSupplier || filterItemCode || filterDateFrom || filterDateTo) && (
              <button
                onClick={() => {
                  setFilterSupplier('');
                  setFilterItemCode('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
                className="h-10 px-3 text-[13px] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--surface-2)]">
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[var(--text-2)] uppercase tracking-wider">Mã phiếu</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[var(--text-2)] uppercase tracking-wider">Nhà cung cấp</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[var(--text-2)] uppercase tracking-wider">Ngày nhập</th>
                <th className="px-4 py-3 text-center text-[12px] font-semibold text-[var(--text-2)] uppercase tracking-wider">Số SP</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold text-[var(--text-2)] uppercase tracking-wider">Tổng SL</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold text-[var(--text-2)] uppercase tracking-wider">Tổng tiền</th>
                <th className="px-4 py-3 text-center text-[12px] font-semibold text-[var(--text-2)] uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-center text-[12px] font-semibold text-[var(--text-2)] uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-[var(--text-3)]">
                      <Icon name="spinner" size="md" className="animate-spin" />
                      <span>Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[var(--text-3)]">
                    Không có phiếu nhập kho nào
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-[var(--surface-2)]/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="text-[14px] font-medium text-[var(--primary)]">{record.id}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[14px] text-[var(--text-1)]">{record.supplier}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[14px] text-[var(--text-2)]">{formatDate(record.date)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-[14px] text-[var(--text-2)]">{record.items.length}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-[14px] font-medium text-[var(--success)]">+{record.total_quantity}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-[14px] font-medium text-[var(--text-1)] tabular-nums">{formatCurrency(record.total_amount)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[12px] font-medium ${
                        record.status === 'completed' 
                          ? 'bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)]/20'
                          : record.status === 'pending'
                          ? 'bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)]/20'
                          : 'bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]/20'
                      }`}>
                        {record.status === 'completed' ? 'Hoàn thành' : record.status === 'pending' ? 'Chờ xử lý' : 'Đã hủy'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetail(record)}
                          className="h-8 px-3 rounded-[var(--radius-sm)] bg-[var(--primary-light)] text-[var(--primary)] text-[13px] font-medium border border-[var(--primary)]/20 hover:border-[var(--primary)]/40 transition-colors"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleDeleteClick(record.id)}
                          className="h-8 px-3 rounded-[var(--radius-sm)] bg-[var(--danger-light)] text-[var(--danger)] text-[13px] font-medium border border-[var(--danger)]/20 hover:border-[var(--danger)]/40 transition-colors"
                          title="Xóa phiếu"
                        >
                          <Icon name="trash" size="sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================ */}
      {/* MODAL TẠO PHIẾU NHẬP KHO */}
      {/* ============================================ */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Tạo phiếu nhập kho"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Batch Info */}
          <div className="pb-5 border-b border-[var(--border)]">
            <h3 className="text-[14px] font-semibold text-[var(--text-1)] mb-4">Thông tin lô hàng</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <Icon name="building" size="sm" className="opacity-60" />
                  Nhà cung cấp <span className="text-[var(--danger)]">*</span>
                </label>
                <SupplierAutocomplete
                  value={batchInfo.supplier}
                  onChange={(val) => setBatchInfo({ ...batchInfo, supplier: val })}
                  onSupplierSelect={(supplier) => {
                    if (!supplier) return;
                    setSelectedSupplier(supplier);
                    setBatchInfo({
                      ...batchInfo,
                      supplier: supplier.name,
                      // Auto-fill bank info if payment method is chuyển_khoản
                      payment_bank_account: batchInfo.payment_method === 'chuyển_khoản' ? supplier.bank_account || '' : batchInfo.payment_bank_account,
                      payment_bank_name: batchInfo.payment_method === 'chuyển_khoản' ? supplier.bank_name || '' : batchInfo.payment_bank_name,
                    });
                  }}
                  placeholder="Nhập tên NCC..."
                />
              </div>
              <div>
                <label className={labelClass}>
                  <Icon name="calendar" size="sm" className="opacity-60" />
                  Ngày nhập
                </label>
                <DatePicker
                  value={batchInfo.date}
                  onChange={(date) => setBatchInfo({ ...batchInfo, date })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="pb-5 border-b border-[var(--border)]">
            <h3 className="text-[14px] font-semibold text-[var(--text-1)] mb-4">Phương thức thanh toán</h3>
            <div className="space-y-4">
              {/* Payment method selector */}
              <div>
                <label className={labelClass}>
                  <Icon name="credit-card" size="sm" className="opacity-60" />
                  Hình thức
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'tiền_mặt', label: 'Tiền mặt', icon: 'dollar' },
                    { value: 'chuyển_khoản', label: 'Chuyển khoản', icon: 'bank' },
                    { value: 'công_nợ', label: 'Công nợ', icon: 'clock' },
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => {
                        const newPaymentMethod = method.value as 'tiền_mặt' | 'chuyển_khoản' | 'công_nợ';
                        setBatchInfo({
                          ...batchInfo,
                          payment_method: newPaymentMethod,
                          // Auto-fill bank info if switching to chuyển_khoản and supplier is selected
                          payment_bank_account: newPaymentMethod === 'chuyển_khoản' && selectedSupplier ? selectedSupplier.bank_account || '' : batchInfo.payment_bank_account,
                          payment_bank_name: newPaymentMethod === 'chuyển_khoản' && selectedSupplier ? selectedSupplier.bank_name || '' : batchInfo.payment_bank_name,
                        });
                      }}
                      className={`flex-1 h-11 px-4 rounded-[var(--radius-md)] flex items-center justify-center gap-2 font-medium text-[14px] border transition-all duration-150 ${
                        batchInfo.payment_method === method.value
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)] hover:border-[var(--primary)]'
                      }`}
                    >
                      <Icon name={method.icon} size="sm" />
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank info - only show if chuyển_khoản */}
              {batchInfo.payment_method === 'chuyển_khoản' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)] border border-[var(--border)]">
                  <div>
                    <label className={labelClass}>
                      <Icon name="hash" size="sm" className="opacity-60" />
                      Số tài khoản
                    </label>
                    <input
                      type="text"
                      value={batchInfo.payment_bank_account}
                      onChange={(e) => setBatchInfo({ ...batchInfo, payment_bank_account: e.target.value })}
                      className={inputClass}
                      placeholder="Nhập số TK hoặc để tự động từ NCC"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <Icon name="bank" size="sm" className="opacity-60" />
                      Tên ngân hàng
                    </label>
                    <input
                      type="text"
                      value={batchInfo.payment_bank_name}
                      onChange={(e) => setBatchInfo({ ...batchInfo, payment_bank_name: e.target.value })}
                      className={inputClass}
                      placeholder="Nhập tên NH hoặc để tự động từ NCC"
                    />
                  </div>
                  {selectedSupplier && selectedSupplier.bank_account && (
                    <div className="col-span-2 flex items-center gap-2 text-[13px] text-[var(--text-3)]">
                      <Icon name="info" size="sm" />
                      <span>Thông tin từ NCC: {selectedSupplier.bank_account} - {selectedSupplier.bank_name || 'Chưa có tên NH'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Products List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold text-[var(--text-1)]">
                Danh sách sản phẩm ({products.length})
              </h3>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-1.5 h-9 px-4 rounded-[var(--radius-md)] bg-[var(--primary-light)] text-[var(--primary)] text-[13px] font-medium border border-[var(--primary)]/20 hover:border-[var(--primary)]/40 transition-colors"
              >
                <Icon name="plus" size="xs" />
                Thêm sản phẩm
              </button>
            </div>

            {/* Hint */}
            <div className="mb-4 p-3 rounded-[var(--radius-md)] bg-[var(--info-light)] border border-[var(--info)]/20">
              <p className="text-[13px] text-[var(--text-2)]">
                <span className="font-medium">Hướng dẫn:</span> Nhập mã hàng và nhấn Enter hoặc nút tìm kiếm. Tên hàng và đơn vị sẽ được tự động điền.
              </p>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[120px_1fr_60px_70px_50px_90px_32px] gap-1.5 px-2 py-2 text-[10px] font-semibold text-[var(--text-2)] uppercase tracking-wider border-b border-[var(--border)]">
              <div>Mã hàng</div>
              <div>Tên hàng</div>
              <div className="text-center">Tồn</div>
              <div className="text-center">SL</div>
              <div className="text-center">ĐVT</div>
              <div className="text-right">Giá</div>
              <div></div>
            </div>

            {/* Product Rows */}
            <div className="divide-y divide-dashed divide-[var(--border)]">
              {products.map((product, index) => (
                <div key={product.id} className="grid grid-cols-[120px_1fr_60px_70px_50px_90px_32px] gap-1.5 py-2 items-center">
                  {/* Mã hàng */}
                  <ProductCodeInput
                    value={product.itemCode}
                    onChange={(val) => updateProduct(product.id, { itemCode: val })}
                    onProductFound={(p) => handleProductFound(product.id, p)}
                    onProductNotFound={() => handleProductNotFound(product.id)}
                    placeholder="Mã SKU"
                    className="h-10"
                  />

                  {/* Tên hàng */}
                  <input
                    type="text"
                    value={product.itemName}
                    readOnly
                    className={inputReadonlyClass}
                    placeholder="Tên hàng hoá"
                  />

                  {/* Tồn kho */}
                  <div className="text-center text-[14px] text-[var(--text-3)]">
                    {product.availableStock !== null ? product.availableStock : '—'}
                  </div>

                  {/* Số lượng */}
                  <input
                    type="number"
                    value={product.quantity}
                    onChange={(e) => updateProduct(product.id, { quantity: e.target.value })}
                    className={`${inputCompactClass} text-center`}
                    placeholder="0"
                    min="1"
                  />

                  {/* Đơn vị */}
                  <div className="text-center text-[14px] text-[var(--text-2)]">
                    {product.unit || '—'}
                  </div>

                  {/* Giá nhập */}
                  <input
                    type="number"
                    value={product.price}
                    onChange={(e) => updateProduct(product.id, { price: e.target.value })}
                    className={`${inputCompactClass} text-right`}
                    placeholder="0"
                    min="0"
                  />

                  {/* Xóa */}
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    disabled={products.length <= 1}
                    className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-3)] hover:text-[var(--danger)] hover:bg-[var(--danger-light)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--text-3)] transition-colors"
                  >
                    <Icon name="trash" size="sm" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add more button */}
            <button
              type="button"
              onClick={addProduct}
              className="w-full mt-2 py-3 border-2 border-dashed border-[var(--border)] rounded-[var(--radius-md)] text-[13px] text-[var(--text-3)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
            >
              + Thêm sản phẩm khác
            </button>
          </div>

          {/* Note */}
          <div>
            <label className={labelClass}>
              <Icon name="note" size="sm" className="opacity-60" />
              Ghi chú chung
            </label>
            <textarea
              value={batchInfo.note}
              onChange={(e) => setBatchInfo({ ...batchInfo, note: e.target.value })}
              className={`${inputClass} h-auto min-h-[80px] py-3 resize-none`}
              placeholder="Ghi chú thêm về lô hàng (tùy chọn)"
            />
          </div>

          {/* Tax Rate */}
          <div>
            <label className={labelClass}>
              <Icon name="percentage" size="sm" className="opacity-60" />
              Thuế suất (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={batchInfo.tax_rate}
                onChange={(e) => setBatchInfo({ ...batchInfo, tax_rate: parseFloat(e.target.value) || 0 })}
                className={`${inputClass} w-28`}
                placeholder="0"
                min="0"
                max="100"
                step="0.1"
              />
              <span className="text-[var(--text-3)]">%</span>
              <div className="flex gap-2">
                {[0, 5, 8, 10].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setBatchInfo({ ...batchInfo, tax_rate: rate })}
                    className={`h-9 px-3 rounded-[var(--radius-md)] text-[13px] font-medium border transition-colors ${
                      batchInfo.tax_rate === rate
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)] hover:border-[var(--primary)]'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary & Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[12px] text-[var(--text-3)]">Tổng SL</p>
                <p className="text-[18px] font-semibold text-[var(--success)]">+{totalQuantity}</p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--text-3)]">Tạm tính</p>
                <p className="text-[15px] font-medium text-[var(--text-2)]">{formatCurrency(totalAmount)}</p>
              </div>
              {batchInfo.tax_rate > 0 && (
                <div>
                  <p className="text-[12px] text-[var(--text-3)]">Thuế ({batchInfo.tax_rate}%)</p>
                  <p className="text-[15px] font-medium text-[var(--warning)]">{formatCurrency(totalAmount * batchInfo.tax_rate / 100)}</p>
                </div>
              )}
              <div>
                <p className="text-[12px] text-[var(--text-3)]">Tổng cộng</p>
                <p className="text-[18px] font-semibold text-[var(--text-1)]">{formatCurrency(totalAmount * (1 + batchInfo.tax_rate / 100))}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-11 px-6 rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-2)] font-medium border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="h-11 px-8 rounded-[var(--radius-md)] bg-[var(--success)] text-white font-medium hover:opacity-90 transition-opacity"
              >
                Xác nhận nhập kho ({products.filter(p => p.itemCode && p.quantity).length} sản phẩm)
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ============================================ */}
      {/* MODAL CHI TIẾT PHIẾU */}
      {/* ============================================ */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Chi tiết phiếu nhập - ${selectedRecord?.id}`}
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-5">
            {/* Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
              <div>
                <p className="text-[12px] text-[var(--text-3)]">Nhà cung cấp</p>
                <p className="text-[14px] font-medium text-[var(--text-1)]">{selectedRecord.supplier}</p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--text-3)]">Ngày nhập</p>
                <p className="text-[14px] font-medium text-[var(--text-1)]">{formatDate(selectedRecord.date)}</p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--text-3)]">Tổng số lượng</p>
                <p className="text-[14px] font-semibold text-[var(--success)]">+{selectedRecord.total_quantity}</p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--text-3)]">Phương thức thanh toán</p>
                <p className="text-[14px] font-medium text-[var(--text-1)]">
                  {selectedRecord.payment_method === 'tiền_mặt' && 'Tiền mặt'}
                  {selectedRecord.payment_method === 'chuyển_khoản' && 'Chuyển khoản'}
                  {selectedRecord.payment_method === 'công_nợ' && 'Công nợ'}
                  {!selectedRecord.payment_method && 'Tiền mặt'}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--text-3)]">Tổng tiền (trước thuế)</p>
                <p className="text-[14px] font-semibold text-[var(--text-1)]">{formatCurrency(selectedRecord.total_amount)}</p>
              </div>
              {selectedRecord.note && (
                <div className="col-span-2">
                  <p className="text-[12px] text-[var(--text-3)]">Ghi chú</p>
                  <p className="text-[14px] text-[var(--text-2)]">{selectedRecord.note}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <h4 className="text-[14px] font-semibold text-[var(--text-1)] mb-3">Danh sách sản phẩm</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[var(--surface-2)]">
                      <th className="px-3 py-2 text-left text-[12px] font-semibold text-[var(--text-2)]">Mã hàng</th>
                      <th className="px-3 py-2 text-left text-[12px] font-semibold text-[var(--text-2)]">Tên hàng</th>
                      <th className="px-3 py-2 text-center text-[12px] font-semibold text-[var(--text-2)]">SL</th>
                      <th className="px-3 py-2 text-center text-[12px] font-semibold text-[var(--text-2)]">Đơn vị</th>
                      <th className="px-3 py-2 text-right text-[12px] font-semibold text-[var(--text-2)]">Đơn giá</th>
                      <th className="px-3 py-2 text-right text-[12px] font-semibold text-[var(--text-2)]">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {selectedRecord.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2.5 text-[13px] text-[var(--primary)] font-medium">{item.item_code}</td>
                        <td className="px-3 py-2.5 text-[13px] text-[var(--text-1)]">{item.item_name}</td>
                        <td className="px-3 py-2.5 text-[13px] text-[var(--text-1)] text-center font-medium">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-[13px] text-[var(--text-2)] text-center">{item.unit}</td>
                        <td className="px-3 py-2.5 text-[13px] text-[var(--text-2)] text-right tabular-nums">{formatCurrency(item.price)}</td>
                        <td className="px-3 py-2.5 text-[13px] text-[var(--text-1)] text-right tabular-nums font-medium">{formatCurrency(item.quantity * item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tax Summary - read only from record */}
            {(selectedRecord.tax_rate ?? 0) > 0 && (
              <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-[var(--text-3)]">Thuế suất</p>
                    <p className="text-[16px] font-medium text-[var(--text-1)]">{selectedRecord.tax_rate}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-[var(--text-3)]">Tiền thuế</p>
                    <p className="text-[14px] font-medium text-[var(--warning)]">
                      +{formatCurrency(selectedRecord.total_amount * (selectedRecord.tax_rate ?? 0) / 100)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-[var(--text-3)]">Tổng sau thuế</p>
                    <p className="text-[18px] font-semibold text-[var(--text-1)]">
                      {formatCurrency(selectedRecord.total_amount * (1 + (selectedRecord.tax_rate ?? 0) / 100))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Export & Close buttons */}
            <div className="flex justify-between pt-3 border-t border-[var(--border)]">
              {/* Export buttons - NEW TEMPLATE-BASED */}
              {selectedRecord && (
                <ExportVoucherButtons 
                  data={stockInToVoucherData(selectedRecord, 'K01', 'Kho chính Thủ Đức', selectedRecord.tax_rate ?? 0)}
                />
              )}

              {/* Close button */}
              <button
                onClick={() => setShowDetailModal(false)}
                className="h-10 px-6 rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-2)] font-medium border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Passkey Modal for Delete */}
      <PasskeyModal
        isOpen={showDeletePasskeyModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa phiếu nhập kho"
        message="Vui lòng nhập Passkey 6 chữ số để xác thực"
      />
    </div>
  );
}
