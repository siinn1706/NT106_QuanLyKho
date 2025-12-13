/**
 * Items_List_Page.tsx - Danh sách hàng hoá
 * 
 * Chức năng:
 * - Hiển thị danh sách tất cả hàng hoá trong kho
 * - Thêm mới hàng hoá (định nghĩa mã, tên, đơn vị, giá, hạn sử dụng...)
 * - Sửa/Xóa hàng hoá
 * - Cảnh báo hàng sắp hết hạn sử dụng (trong vòng 1 tháng)
 * - Cảnh báo hàng sắp hết (dưới mức tồn kho tối thiểu)
 * 
 * UI: SF Pro Display, border-based depth, no shadows
 */

import { useEffect, useState } from 'react';
import { apiGetItems, apiCreateItem, apiUpdateItem, apiDeleteItem, Item } from '../../app/api_client';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import CustomSelect from '../../components/ui/CustomSelect';
import DatePicker from '../../components/ui/DatePicker';

// ============================================
// MOCK DATA - Dữ liệu mẫu khi chưa có BE
// ============================================
const MOCK_ITEMS: Item[] = [
  {
    id: 'ITEM001',
    name: 'Sản phẩm mẫu A',
    sku: 'SP-001',
    quantity: 50,
    unit: 'Cái',
    price: 100000,
    category: 'Điện tử',
    expiry_date: undefined,
    min_stock: 10,
  },
  {
    id: 'ITEM002',
    name: 'Sản phẩm mẫu B',
    sku: 'SP-002',
    quantity: 30,
    unit: 'Hộp',
    price: 50000,
    category: 'Thực phẩm',
    min_stock: 5,
  },
  {
    id: 'ITEM003',
    name: 'Sản phẩm mẫu C',
    sku: 'SP-003',
    quantity: 200,
    unit: 'Chai',
    price: 25000,
    category: 'Thực phẩm',
    expiry_date: '2025-01-10', // Sắp hết hạn
    min_stock: 50,
  },
  {
    id: 'ITEM004',
    name: 'Sản phẩm mẫu D',
    sku: 'SP-004',
    quantity: 15, // Sắp hết
    unit: 'Thùng',
    price: 150000,
    category: 'Vệ sinh',
    expiry_date: '2026-06-15',
    min_stock: 20,
  },
  {
    id: 'ITEM005',
    name: 'Sản phẩm mẫu E',
    sku: 'SP-005',
    quantity: 100,
    unit: 'Kg',
    price: 80000,
    category: 'Thực phẩm',
    expiry_date: '2025-01-05', // Đã hết hạn
    min_stock: 30,
  },
];

// Danh sách danh mục
const CATEGORIES = [
  'Điện tử',
  'Thực phẩm',
  'Vệ sinh',
  'Văn phòng phẩm',
  'Đóng gói',
  'Phụ kiện',
  'Khác',
];

// Helper function: Viết hoa chữ cái đầu tiên của đơn vị tính
function capitalizeUnit(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

// Interface cho form thêm/sửa hàng hoá
interface ItemFormData {
  name: string;
  sku: string;
  unit: string;
  price: string;
  category: string;
  expiry_date: string;
  min_stock: string;
  description: string;
}

const emptyFormData: ItemFormData = {
  name: '',
  sku: '',
  unit: '',
  price: '',
  category: '',
  expiry_date: '',
  min_stock: '',
  description: '',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Kiểm tra sản phẩm sắp hết hạn (trong vòng 30 ngày)
function isExpiringSoon(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= 30;
}

// Kiểm tra sản phẩm đã hết hạn
function isExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  return expiry < now;
}

// Kiểm tra sản phẩm sắp hết hàng
function isLowStock(quantity: number, minStock?: number): boolean {
  if (!minStock) return false;
  return quantity <= minStock;
}

// Format ngày tháng
function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Tính số ngày còn lại đến hạn sử dụng
function getDaysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================
// COMPONENT CHÍNH
// ============================================

export default function Items_List_Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<ItemFormData>(emptyFormData);
  const [formErrors, setFormErrors] = useState<Partial<ItemFormData>>({});

  // Filter states
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'expiring' | 'expired' | 'low-stock'>('all');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      /**
       * API: GET /items
       * Purpose: Get list of all items with full details
       * Request (JSON): null
       * Response (JSON) [200]:
       * [
       *   {
       *     "id": "ITEM001",
       *     "name": "Laptop Dell XPS",
       *     "sku": "SKU001",
       *     "quantity": 50,
       *     "unit": "Cái",
       *     "price": 25000000,
       *     "category": "Điện tử",
       *     "expiry_date": "2024-12-31",
       *     "min_stock": 10,
       *     "description": "Laptop cao cấp"
       *   }
       * ]
       */
      const data = await apiGetItems();
      setItems(data.length > 0 ? data : MOCK_ITEMS);
    } catch {
      // Dùng mock data khi chưa có BE
      setItems(MOCK_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<ItemFormData> = {};
    
    if (!formData.name.trim()) errors.name = 'Vui lòng nhập tên hàng hoá';
    if (!formData.sku.trim()) errors.sku = 'Vui lòng nhập mã SKU';
    if (!formData.unit.trim()) errors.unit = 'Vui lòng nhập đơn vị tính';
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Vui lòng nhập giá hợp lệ';
    if (!formData.category) errors.category = 'Vui lòng chọn danh mục';
    
    // Kiểm tra mã SKU đã tồn tại
    const existingSku = items.find(item => 
      item.sku.toLowerCase() === formData.sku.trim().toLowerCase() &&
      item.id !== selectedItem?.id
    );
    if (existingSku) errors.sku = 'Mã SKU đã tồn tại';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Mở modal thêm mới
  const handleOpenAdd = () => {
    setFormData(emptyFormData);
    setFormErrors({});
    setSelectedItem(null);
    setShowAddModal(true);
  };

  // Mở modal sửa
  const handleOpenEdit = (item: Item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      unit: item.unit,
      price: item.price.toString(),
      category: item.category,
      expiry_date: item.expiry_date || '',
      min_stock: item.min_stock?.toString() || '',
      description: item.description || '',
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Mở modal xoá
  const handleOpenDelete = (item: Item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  // Xử lý thêm mới
  const handleAdd = async () => {
    if (!validateForm()) return;

    const newItem: Omit<Item, 'id'> = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      quantity: 0, // Số lượng ban đầu = 0, sẽ tăng khi nhập kho
      unit: capitalizeUnit(formData.unit),
      price: parseFloat(formData.price),
      category: formData.category,
      expiry_date: formData.expiry_date || undefined,
      min_stock: formData.min_stock ? parseInt(formData.min_stock) : undefined,
      description: formData.description.trim() || undefined,
    };

    try {
      /**
       * API: POST /items
       * Purpose: Create new item in inventory
       * Request (JSON):
       * {
       *   "name": "Laptop Dell XPS",
       *   "sku": "SKU001",
       *   "quantity": 0,
       *   "unit": "Cái",
       *   "price": 25000000,
       *   "category": "Điện tử",
       *   "expiry_date": "2024-12-31",
       *   "min_stock": 10,
       *   "description": "Laptop cao cấp"
       * }
       * Response (JSON) [200]:
       * { "id": "ITEM001", ...item_data }
       * Response Errors:
       * - 400: { "detail": "SKU already exists" }
       * - 401: { "detail": "Unauthorized" }
       */
      const created = await apiCreateItem(newItem);
      setItems([...items, created]);
      setShowAddModal(false);
      alert('Thêm hàng hoá thành công!');
    } catch {
      // Mock: thêm vào state local
      const mockId = `ITEM${Date.now()}`;
      setItems([...items, { id: mockId, ...newItem } as Item]);
      setShowAddModal(false);
      alert('Thêm hàng hoá thành công!');
    }
  };

  // Xử lý cập nhật
  const handleUpdate = async () => {
    if (!selectedItem || !validateForm()) return;

    const updatedData: Partial<Item> = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      unit: capitalizeUnit(formData.unit),
      price: parseFloat(formData.price),
      category: formData.category,
      expiry_date: formData.expiry_date || undefined,
      min_stock: formData.min_stock ? parseInt(formData.min_stock) : undefined,
      description: formData.description.trim() || undefined,
    };

    try {
      /**
       * API: PUT /items/{id}
       * Purpose: Update existing item
       * Request (JSON): { ...partial item fields }
       * Response (JSON) [200]: { ...updated item }
       */
      const updated = await apiUpdateItem(selectedItem.id, updatedData);
      setItems(items.map(item => item.id === selectedItem.id ? updated : item));
      setShowEditModal(false);
      alert('Cập nhật hàng hoá thành công!');
    } catch {
      // Mock: cập nhật state local
      setItems(items.map(item => 
        item.id === selectedItem.id 
          ? { ...item, ...updatedData } 
          : item
      ));
      setShowEditModal(false);
      alert('Cập nhật hàng hoá thành công!');
    }
  };

  // Xử lý xoá
  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      /**
       * API: DELETE /items/{id}
       * Purpose: Delete item from inventory
       * Response (JSON) [200]: { "status": "deleted" }
       * Response Errors:
       * - 400: { "detail": "Cannot delete item with existing stock" }
       */
      await apiDeleteItem(selectedItem.id);
      setItems(items.filter(item => item.id !== selectedItem.id));
      setShowDeleteModal(false);
      alert('Xoá hàng hoá thành công!');
    } catch {
      // Mock: xoá từ state local
      setItems(items.filter(item => item.id !== selectedItem.id));
      setShowDeleteModal(false);
      alert('Xoá hàng hoá thành công!');
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    // Text search
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = !filterCategory || item.category === filterCategory;
    
    // Status filter
    let matchesStatus = true;
    if (filterStatus === 'expiring') {
      matchesStatus = isExpiringSoon(item.expiry_date);
    } else if (filterStatus === 'expired') {
      matchesStatus = isExpired(item.expiry_date);
    } else if (filterStatus === 'low-stock') {
      matchesStatus = isLowStock(item.quantity, item.min_stock);
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Thống kê cảnh báo
  const expiringCount = items.filter(item => isExpiringSoon(item.expiry_date)).length;
  const expiredCount = items.filter(item => isExpired(item.expiry_date)).length;
  const lowStockCount = items.filter(item => isLowStock(item.quantity, item.min_stock)).length;

  // Reusable classes
  const inputClass = "w-full h-11 px-4 text-[14px] text-[var(--text-1)] bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-lg)] transition-colors duration-150 placeholder:text-[var(--text-3)] hover:border-[var(--border-hover)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";
  const labelClass = "text-[13px] font-medium text-[var(--text-2)] mb-1.5 block";
  const errorClass = "text-[12px] text-[var(--danger)] mt-1";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-[24px] font-semibold text-[var(--text-1)]">Danh sách hàng hoá</h1>
        <button 
          onClick={handleOpenAdd}
          className="h-11 px-6 rounded-[var(--radius-md)] bg-[var(--success)] text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Icon name="plus" size="sm" className="text-white" />
          Thêm hàng hoá
        </button>
      </div>

      {/* Alert Badges */}
      {(expiringCount > 0 || expiredCount > 0 || lowStockCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {expiredCount > 0 && (
            <button
              onClick={() => setFilterStatus(filterStatus === 'expired' ? 'all' : 'expired')}
              className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border transition-colors ${
                filterStatus === 'expired'
                  ? 'bg-[var(--danger)] text-white border-[var(--danger)]'
                  : 'bg-[var(--danger-light)] text-[var(--danger)] border-[var(--danger)]/30 hover:border-[var(--danger)]'
              }`}
            >
              <Icon name="exclamation-triangle" size="sm" />
              <span className="text-[13px] font-medium">{expiredCount} hàng đã hết hạn</span>
            </button>
          )}
          {expiringCount > 0 && (
            <button
              onClick={() => setFilterStatus(filterStatus === 'expiring' ? 'all' : 'expiring')}
              className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border transition-colors ${
                filterStatus === 'expiring'
                  ? 'bg-[var(--warning)] text-white border-[var(--warning)]'
                  : 'bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/30 hover:border-[var(--warning)]'
              }`}
            >
              <Icon name="clock" size="sm" />
              <span className="text-[13px] font-medium">{expiringCount} hàng sắp hết hạn</span>
            </button>
          )}
          {lowStockCount > 0 && (
            <button
              onClick={() => setFilterStatus(filterStatus === 'low-stock' ? 'all' : 'low-stock')}
              className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border transition-colors ${
                filterStatus === 'low-stock'
                  ? 'bg-[var(--info)] text-white border-[var(--info)]'
                  : 'bg-[var(--info-light)] text-[var(--info)] border-[var(--info)]/30 hover:border-[var(--info)]'
              }`}
            >
              <Icon name="archive" size="sm" />
              <span className="text-[13px] font-medium">{lowStockCount} hàng sắp hết</span>
            </button>
          )}
          {filterStatus !== 'all' && (
            <button
              onClick={() => setFilterStatus('all')}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
            >
              <Icon name="times" size="sm" />
              <span className="text-[13px] font-medium">Xoá bộ lọc</span>
            </button>
          )}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Icon 
            name="search" 
            size="sm" 
            className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm hàng hoá..."
            className="w-full h-11 pl-11 pr-4 text-[14px] text-[var(--text-1)] bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-md)] placeholder:text-[var(--text-3)] hover:border-[var(--border-hover)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
          />
        </div>
        <CustomSelect
          value={filterCategory}
          onChange={setFilterCategory}
          placeholder="Tất cả danh mục"
          className="w-full sm:w-48"
          size="md"
          options={[
            { value: '', label: 'Tất cả danh mục' },
            ...CATEGORIES.map(cat => ({ value: cat, label: cat })),
          ]}
        />
      </div>

      {/* Table */}
      <div className="bg-[var(--surface-1)] rounded-[var(--radius-2xl)] border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                <th className="px-4 py-3.5 text-left text-[13px] font-semibold text-[var(--text-2)]">Tên hàng</th>
                <th className="px-4 py-3.5 text-left text-[13px] font-semibold text-[var(--text-2)]">Mã SKU</th>
                <th className="px-4 py-3.5 text-right text-[13px] font-semibold text-[var(--text-2)]">Số lượng</th>
                <th className="px-4 py-3.5 text-center text-[13px] font-semibold text-[var(--text-2)]">Đơn vị</th>
                <th className="px-4 py-3.5 text-right text-[13px] font-semibold text-[var(--text-2)]">Giá</th>
                <th className="px-4 py-3.5 text-center text-[13px] font-semibold text-[var(--text-2)]">Danh mục</th>
                <th className="px-4 py-3.5 text-center text-[13px] font-semibold text-[var(--text-2)]">Hạn sử dụng</th>
                <th className="px-4 py-3.5 text-center text-[13px] font-semibold text-[var(--text-2)]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[var(--text-3)]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                      Đang tải...
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[var(--text-3)]">
                    <Icon name="archive" size="xl" className="mx-auto mb-2 opacity-30" />
                    <p>Không có hàng hoá nào</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const expired = isExpired(item.expiry_date);
                  const expiring = isExpiringSoon(item.expiry_date);
                  const lowStock = isLowStock(item.quantity, item.min_stock);
                  const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date);
                  
                  return (
                    <tr 
                      key={item.id} 
                      className={`border-b border-[var(--border)] transition-colors ${
                        expired 
                          ? 'bg-[var(--danger-light)]/50' 
                          : expiring 
                            ? 'bg-[var(--warning-light)]/50' 
                            : 'hover:bg-[var(--surface-2)]/50'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] text-[var(--text-1)] font-medium">{item.name}</span>
                          {expired && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--danger)] text-white">
                              HẾT HẠN
                            </span>
                          )}
                          {expiring && !expired && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--warning)] text-white">
                              SẮP HẾT HẠN
                            </span>
                          )}
                          {lowStock && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--info)] text-white">
                              TỒN THẤP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[14px] text-[var(--text-2)] font-mono">{item.sku}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`text-[14px] tabular-nums font-medium ${
                          lowStock ? 'text-[var(--danger)]' : 'text-[var(--text-1)]'
                        }`}>
                          {item.quantity}
                        </span>
                        {item.min_stock && (
                          <span className="text-[12px] text-[var(--text-3)] ml-1">
                            / {item.min_stock}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[14px] text-[var(--text-2)] text-center">{item.unit}</td>
                      <td className="px-4 py-3.5 text-[14px] text-[var(--text-1)] text-right tabular-nums font-medium">
                        {item.price?.toLocaleString('vi-VN')}₫
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--primary-light)] text-[var(--primary)] text-[12px] font-medium border border-[var(--primary)]/20">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {item.expiry_date ? (
                          <div>
                            <span className={`text-[14px] ${
                              expired ? 'text-[var(--danger)] font-medium' : 
                              expiring ? 'text-[var(--warning)] font-medium' : 
                              'text-[var(--text-2)]'
                            }`}>
                              {formatDate(item.expiry_date)}
                            </span>
                            {daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
                              <p className="text-[11px] text-[var(--warning)]">
                                Còn {daysUntilExpiry} ngày
                              </p>
                            )}
                            {daysUntilExpiry !== null && daysUntilExpiry <= 0 && (
                              <p className="text-[11px] text-[var(--danger)]">
                                Đã hết hạn {Math.abs(daysUntilExpiry)} ngày
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--text-3)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 px-3 rounded-[var(--radius-sm)] bg-[var(--primary-light)] text-[var(--primary)] text-[13px] font-medium border border-[var(--primary)]/20 hover:border-[var(--primary)]/40 transition-colors"
                          >
                            Sửa
                          </button>
                          <button 
                            onClick={() => handleOpenDelete(item)}
                            className="h-8 px-3 rounded-[var(--radius-sm)] bg-[var(--danger-light)] text-[var(--danger)] text-[13px] font-medium border border-[var(--danger)]/20 hover:border-[var(--danger)]/40 transition-colors"
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================ */}
      {/* MODAL THÊM HÀNG HOÁ */}
      {/* ============================================ */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Thêm hàng hoá mới"
        size="lg"
      >
        <div className="space-y-5">
          {/* Row 1: Tên & Mã SKU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Tên hàng hoá <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                placeholder="VD: Tên Hàng Hoá"
              />
              {formErrors.name && <p className={errorClass}>{formErrors.name}</p>}
            </div>
            <div>
              <label className={labelClass}>
                Mã SKU/Barcode <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className={inputClass}
                placeholder="VD: MA-HANG-001"
              />
              {formErrors.sku && <p className={errorClass}>{formErrors.sku}</p>}
            </div>
          </div>

          {/* Row 2: Đơn vị & Danh mục */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Đơn vị tính <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                onBlur={(e) => setFormData({ ...formData, unit: capitalizeUnit(e.target.value) })}
                className={inputClass}
                placeholder="VD: Cái, Hộp, Kg, Lít..."
              />
              <p className="text-[11px] text-[var(--text-3)] mt-1">Chữ cái đầu sẽ tự động viết hoa</p>
              {formErrors.unit && <p className={errorClass}>{formErrors.unit}</p>}
            </div>
            <div>
              <label className={labelClass}>
                Danh mục <span className="text-[var(--danger)]">*</span>
              </label>
              <CustomSelect
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                placeholder="Chọn danh mục"
                className="w-full"
                size="md"
                options={CATEGORIES.map(c => ({ value: c, label: c }))}
              />
              {formErrors.category && <p className={errorClass}>{formErrors.category}</p>}
            </div>
          </div>

          {/* Row 3: Giá & Mức tồn kho tối thiểu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Giá bán (₫) <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={inputClass}
                placeholder="VD: 100000"
                min="0"
              />
              {formErrors.price && <p className={errorClass}>{formErrors.price}</p>}
            </div>
            <div>
              <label className={labelClass}>Mức tồn kho tối thiểu</label>
              <input
                type="number"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                className={inputClass}
                placeholder="VD: 10 (cảnh báo khi dưới mức này)"
                min="0"
              />
              <p className="text-[11px] text-[var(--text-3)] mt-1">Hệ thống sẽ cảnh báo khi tồn kho dưới mức này</p>
            </div>
          </div>

          {/* Row 4: Hạn sử dụng */}
          <div>
            <label className={labelClass}>Hạn sử dụng</label>
            <DatePicker
              value={formData.expiry_date}
              onChange={(date) => setFormData({ ...formData, expiry_date: date })}
              placeholder="Chọn ngày (nếu có)"
              className="w-full md:w-1/2"
            />
            <p className="text-[11px] text-[var(--text-3)] mt-1">Hệ thống sẽ cảnh báo 30 ngày trước khi hết hạn</p>
          </div>

          {/* Row 5: Mô tả */}
          <div>
            <label className={labelClass}>Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`${inputClass} h-auto min-h-[80px] py-3 resize-none`}
              placeholder="Mô tả thêm về sản phẩm (tùy chọn)"
            />
          </div>

          {/* Note */}
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--info-light)] border border-[var(--info)]/20">
            <p className="text-[13px] text-[var(--text-2)]">
              <span className="font-medium">Lưu ý:</span> Số lượng ban đầu sẽ là 0. 
              Để tăng số lượng, hãy sử dụng chức năng <span className="font-medium">Nhập kho</span>.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="h-11 px-6 rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-2)] font-medium border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="h-11 px-8 rounded-[var(--radius-md)] bg-[var(--success)] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Thêm hàng hoá
            </button>
          </div>
        </div>
      </Modal>

      {/* ============================================ */}
      {/* MODAL SỬA HÀNG HOÁ */}
      {/* ============================================ */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Sửa thông tin hàng hoá"
        size="lg"
      >
        <div className="space-y-5">
          {/* Giống modal thêm mới */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Tên hàng hoá <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
              />
              {formErrors.name && <p className={errorClass}>{formErrors.name}</p>}
            </div>
            <div>
              <label className={labelClass}>
                Mã SKU/Barcode <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className={inputClass}
              />
              {formErrors.sku && <p className={errorClass}>{formErrors.sku}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Đơn vị tính <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                onBlur={(e) => setFormData({ ...formData, unit: capitalizeUnit(e.target.value) })}
                className={inputClass}
                placeholder="VD: Cái, Hộp, Kg, Lít..."
              />
              <p className="text-[11px] text-[var(--text-3)] mt-1">Chữ cái đầu sẽ tự động viết hoa</p>
              {formErrors.unit && <p className={errorClass}>{formErrors.unit}</p>}
            </div>
            <div>
              <label className={labelClass}>
                Danh mục <span className="text-[var(--danger)]">*</span>
              </label>
              <CustomSelect
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                placeholder="Chọn danh mục"
                className="w-full"
                size="md"
                options={CATEGORIES.map(c => ({ value: c, label: c }))}
              />
              {formErrors.category && <p className={errorClass}>{formErrors.category}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Giá bán (₫) <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={inputClass}
                min="0"
              />
              {formErrors.price && <p className={errorClass}>{formErrors.price}</p>}
            </div>
            <div>
              <label className={labelClass}>Mức tồn kho tối thiểu</label>
              <input
                type="number"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                className={inputClass}
                min="0"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Hạn sử dụng</label>
            <DatePicker
              value={formData.expiry_date}
              onChange={(date) => setFormData({ ...formData, expiry_date: date })}
              placeholder="Chọn ngày (nếu có)"
              className="w-full md:w-1/2"
            />
          </div>

          <div>
            <label className={labelClass}>Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`${inputClass} h-auto min-h-[80px] py-3 resize-none`}
            />
          </div>

          {/* Current stock info */}
          {selectedItem && (
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] border border-[var(--border)]">
              <p className="text-[13px] text-[var(--text-2)]">
                <span className="font-medium">Số lượng tồn kho hiện tại:</span>{' '}
                <span className="font-semibold text-[var(--text-1)]">{selectedItem.quantity} {selectedItem.unit}</span>
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="h-11 px-6 rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-2)] font-medium border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              className="h-11 px-8 rounded-[var(--radius-md)] bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </Modal>

      {/* ============================================ */}
      {/* MODAL XÁC NHẬN XOÁ */}
      {/* ============================================ */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xoá"
        size="sm"
      >
        <div className="space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--danger-light)] flex items-center justify-center">
              <Icon name="trash" size="xl" className="text-[var(--danger)]" />
            </div>
            <p className="text-[15px] text-[var(--text-1)]">
              Bạn có chắc muốn xoá hàng hoá
            </p>
            <p className="text-[16px] font-semibold text-[var(--text-1)] mt-1">
              "{selectedItem?.name}"?
            </p>
            <p className="text-[13px] text-[var(--text-3)] mt-2">
              Hành động này không thể hoàn tác.
            </p>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="h-11 px-6 rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-2)] font-medium border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="h-11 px-8 rounded-[var(--radius-md)] bg-[var(--danger)] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Xoá
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
