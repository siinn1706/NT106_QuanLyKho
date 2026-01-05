import { useEffect, useState } from 'react';
import { apiGetItems, apiCreateItem, apiUpdateItem, apiDeleteItem, Item } from '../../app/api_client';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import CustomSelect from '../../components/ui/CustomSelect';
import DatePicker from '../../components/ui/DatePicker';
import PasskeyModal from '../../components/ui/PasskeyModal';
import { showToast } from '../../utils/toast';
import { rtWSClient } from '../../services/rt_ws_client';

const CATEGORIES = [
  'Điện tử',
  'Thực phẩm',
  'Vệ sinh',
  'Văn phòng phẩm',
  'Đóng gói',
  'Phụ kiện',
  'Khác',
];

function capitalizeUnit(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

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

function isExpiringSoon(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= 30;
}

function isExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  return expiry < now;
}

function isLowStock(quantity: number, minStock?: number): boolean {
  if (!minStock) return false;
  return quantity <= minStock;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getDaysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}


export default function Items_List_Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<ItemFormData>(emptyFormData);
  const [formErrors, setFormErrors] = useState<Partial<ItemFormData>>({});

  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'expiring' | 'expired' | 'low-stock'>('all');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await apiGetItems();
      setItems(data);
    } catch (error) {
      console.error("Error loading items:", error);
      showToast.error("Không thể tải dữ liệu!");
      setItems([]); 
    } finally {
      setLoading(false);
    }
  };

  // Listen for inventory updates via WebSocket
  useEffect(() => {
    const handleReload = () => {
      console.log('[Items] Inventory updated, reloading items...');
      loadItems();
    };

    rtWSClient.on('inventory:updated', handleReload);

    return () => {
      rtWSClient.off('inventory:updated', handleReload);
    };
  }, []);

  const validateForm = (): boolean => {
    const errors: Partial<ItemFormData> = {};
    if (!formData.name.trim()) errors.name = 'Vui lòng nhập tên hàng hoá';
    if (!formData.sku.trim()) errors.sku = 'Vui lòng nhập mã SKU';
    if (!formData.unit.trim()) errors.unit = 'Vui lòng nhập đơn vị tính';
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Vui lòng nhập giá hợp lệ';
    if (!formData.category) errors.category = 'Vui lòng chọn danh mục';
    
    const existingSku = items.find(item => 
      item.sku.toLowerCase() === formData.sku.trim().toLowerCase() &&
      item.id !== selectedItem?.id
    );
    if (existingSku) errors.sku = 'Mã SKU đã tồn tại';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAdd = () => {
    setFormData(emptyFormData);
    setFormErrors({});
    setSelectedItem(null);
    setShowAddModal(true);
  };

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

  const handleOpenDelete = (item: Item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    const newItem: Omit<Item, 'id'> = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      quantity: 0,
      unit: capitalizeUnit(formData.unit),
      price: parseFloat(formData.price),
      category: formData.category,
      expiry_date: formData.expiry_date || undefined,
      min_stock: formData.min_stock ? parseInt(formData.min_stock) : undefined,
      description: formData.description.trim() || undefined,
    };

    try {
      const created = await apiCreateItem(newItem);
      setItems([...items, created]);
      setShowAddModal(false);
      showToast.success('Thêm hàng hoá thành công!');
    } catch (e: any) {
      console.error("Error creating item:", e);
      showToast.error('Lỗi khi lưu: ' + (e.message || "Unknown error"));
    }
  };

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
      await apiUpdateItem(selectedItem.id.toString(), updatedData);
      
      const updatedItem = { ...selectedItem, ...updatedData };
      setItems(items.map(item => item.id === selectedItem.id ? updatedItem : item));
      setShowEditModal(false);
      showToast.success('Cập nhật thành công!');
    } catch (e: any) {
       console.error("Error updating item:", e);
       showToast.error('Không thể cập nhật: ' + (e.message || "Unknown error"));
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(false);
    setShowPasskeyModal(true);
  };
  
  const handlePasskeyConfirm = async (passkey: string) => {
    if (!selectedItem) return;

    try {
      await apiDeleteItem(selectedItem.id.toString(), passkey);
      setItems(items.filter(item => item.id !== selectedItem.id));
      setShowPasskeyModal(false);
      showToast.success('Đã xóa hàng hoá khỏi DB!');
    } catch (e: any) {
       console.error("Error deleting item:", e);
       showToast.error('Không thể xóa: ' + (e.message || "Unknown error"));
    }
  };
  
  const handlePasskeyCancel = () => {
    setShowPasskeyModal(false);
    setSelectedItem(null);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    let matchesStatus = true;
    if (filterStatus === 'expiring') matchesStatus = isExpiringSoon(item.expiry_date);
    else if (filterStatus === 'expired') matchesStatus = isExpired(item.expiry_date);
    else if (filterStatus === 'low-stock') matchesStatus = isLowStock(item.quantity, item.min_stock);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const expiringCount = items.filter(item => isExpiringSoon(item.expiry_date)).length;
  const expiredCount = items.filter(item => isExpired(item.expiry_date)).length;
  const lowStockCount = items.filter(item => isLowStock(item.quantity, item.min_stock)).length;

  // Reusable classes
  const inputClass = "w-full h-11 px-4 text-[14px] text-[var(--text-1)] bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-lg)] transition-colors duration-150 placeholder:text-[var(--text-3)] hover:border-[var(--border-hover)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";
  const labelClass = "text-[13px] font-medium text-[var(--text-2)] mb-1.5 block";
  const errorClass = "text-[12px] text-[var(--danger)] mt-1";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-[24px] font-semibold text-[var(--text-1)]">Danh sách hàng hoá</h1>
        <button onClick={handleOpenAdd} className="h-11 px-6 rounded-[var(--radius-md)] bg-[var(--success)] text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
          <Icon name="plus" size="sm" className="text-white" />
          Thêm hàng hoá
        </button>
      </div>

      {/* Alert Badges */}
      {(expiringCount > 0 || expiredCount > 0 || lowStockCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {expiredCount > 0 && (
            <button onClick={() => setFilterStatus(filterStatus === 'expired' ? 'all' : 'expired')} className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border transition-colors ${filterStatus === 'expired' ? 'bg-[var(--danger)] text-white border-[var(--danger)]' : 'bg-[var(--danger-light)] text-[var(--danger)] border-[var(--danger)]/30 hover:border-[var(--danger)]'}`}>
              <Icon name="warning" size="sm" />
              <span className="text-[13px] font-medium">{expiredCount} hàng đã hết hạn</span>
            </button>
          )}
          {expiringCount > 0 && (
            <button onClick={() => setFilterStatus(filterStatus === 'expiring' ? 'all' : 'expiring')} className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border transition-colors ${filterStatus === 'expiring' ? 'bg-[var(--warning)] text-white border-[var(--warning)]' : 'bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/30 hover:border-[var(--warning)]'}`}>
              <Icon name="clock" size="sm" />
              <span className="text-[13px] font-medium">{expiringCount} hàng sắp hết hạn</span>
            </button>
          )}
          {lowStockCount > 0 && (
            <button onClick={() => setFilterStatus(filterStatus === 'low-stock' ? 'all' : 'low-stock')} className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border transition-colors ${filterStatus === 'low-stock' ? 'bg-[var(--info)] text-white border-[var(--info)]' : 'bg-[var(--info-light)] text-[var(--info)] border-[var(--info)]/30 hover:border-[var(--info)]'}`}>
              <Icon name="archive" size="sm" />
              <span className="text-[13px] font-medium">{lowStockCount} hàng sắp hết</span>
            </button>
          )}
          {filterStatus !== 'all' && (
            <button onClick={() => setFilterStatus('all')} className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors">
              <Icon name="close" size="sm" />
              <span className="text-[13px] font-medium">Xoá bộ lọc</span>
            </button>
          )}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" size="sm" className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm hàng hoá..." className="w-full h-11 pl-11 pr-4 text-[14px] text-[var(--text-1)] bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-md)] placeholder:text-[var(--text-3)] hover:border-[var(--border-hover)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors" />
        </div>
        <CustomSelect value={filterCategory} onChange={setFilterCategory} placeholder="Tất cả danh mục" className="w-full sm:w-48" size="md" options={[{ value: '', label: 'Tất cả danh mục' }, ...CATEGORIES.map(cat => ({ value: cat, label: cat }))] } />
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
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[var(--text-3)]">
                    <Icon name="archive" size="xl" className="mx-auto mb-2 opacity-30" />
                    <p>Không có hàng hoá nào trong CSDL</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const expired = isExpired(item.expiry_date);
                  const expiring = isExpiringSoon(item.expiry_date);
                  const lowStock = isLowStock(item.quantity, item.min_stock);
                  const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date);
                  
                  return (
                    <tr key={item.id} className={`border-b border-[var(--border)] transition-colors ${expired ? 'bg-[var(--danger-light)]/50' : expiring ? 'bg-[var(--warning-light)]/50' : 'hover:bg-[var(--surface-2)]/50'}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] text-[var(--text-1)] font-medium">{item.name}</span>
                          {expired && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--danger)] text-white">HẾT HẠN</span>}
                          {expiring && !expired && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--warning)] text-white">SẮP HẾT HẠN</span>}
                          {lowStock && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--info)] text-white">TỒN THẤP</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[14px] text-[var(--text-2)] font-mono">{item.sku}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`text-[14px] tabular-nums font-medium ${lowStock ? 'text-[var(--danger)]' : 'text-[var(--text-1)]'}`}>{item.quantity}</span>
                        {item.min_stock && <span className="text-[12px] text-[var(--text-3)] ml-1">/ {item.min_stock}</span>}
                      </td>
                      <td className="px-4 py-3.5 text-[14px] text-[var(--text-2)] text-center">{item.unit}</td>
                      <td className="px-4 py-3.5 text-[14px] text-[var(--text-1)] text-right tabular-nums font-medium">{item.price?.toLocaleString('vi-VN')}₫</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--primary-light)] text-[var(--primary)] text-[12px] font-medium border border-[var(--primary)]/20">{item.category}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {item.expiry_date ? (
                          <div>
                            <span className={`text-[14px] ${expired ? 'text-[var(--danger)] font-medium' : expiring ? 'text-[var(--warning)] font-medium' : 'text-[var(--text-2)]'}`}>{formatDate(item.expiry_date)}</span>
                            {daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30 && <p className="text-[11px] text-[var(--warning)]">Còn {daysUntilExpiry} ngày</p>}
                            {daysUntilExpiry !== null && daysUntilExpiry <= 0 && <p className="text-[11px] text-[var(--danger)]">Đã hết hạn {Math.abs(daysUntilExpiry)} ngày</p>}
                          </div>
                        ) : <span className="text-[var(--text-3)]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenEdit(item)} className="h-8 px-3 rounded-[var(--radius-sm)] bg-[var(--primary-light)] text-[var(--primary)] text-[13px] font-medium border border-[var(--primary)]/20 hover:border-[var(--primary)]/40 transition-colors">Sửa</button>
                          <button onClick={() => handleOpenDelete(item)} className="h-8 px-3 rounded-[var(--radius-sm)] bg-[var(--danger-light)] text-[var(--danger)] text-[13px] font-medium border border-[var(--danger)]/20 hover:border-[var(--danger)]/40 transition-colors">Xoá</button>
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

      {/* Modal Add/Edit/Delete components (giữ nguyên logic hiển thị form nhưng dùng các hàm handleAdd/Update/Delete mới ở trên) */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Thêm hàng hoá mới" size="lg">
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Tên hàng hoá <span className="text-[var(--danger)]">*</span></label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="VD: Tên Hàng Hoá" />{formErrors.name && <p className={errorClass}>{formErrors.name}</p>}</div>
                <div><label className={labelClass}>Mã SKU/Barcode <span className="text-[var(--danger)]">*</span></label><input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })} className={inputClass} placeholder="VD: MA-HANG-001" />{formErrors.sku && <p className={errorClass}>{formErrors.sku}</p>}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Đơn vị tính <span className="text-[var(--danger)]">*</span></label><input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} onBlur={(e) => setFormData({ ...formData, unit: capitalizeUnit(e.target.value) })} className={inputClass} placeholder="VD: Cái, Hộp..." />{formErrors.unit && <p className={errorClass}>{formErrors.unit}</p>}</div>
                <div><label className={labelClass}>Danh mục <span className="text-[var(--danger)]">*</span></label><CustomSelect value={formData.category} onChange={(val) => setFormData({ ...formData, category: val })} placeholder="Chọn danh mục" className="w-full" size="md" options={CATEGORIES.map(c => ({ value: c, label: c }))} />{formErrors.category && <p className={errorClass}>{formErrors.category}</p>}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Giá bán (₫) <span className="text-[var(--danger)]">*</span></label><input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={inputClass} placeholder="VD: 100000" min="0" />{formErrors.price && <p className={errorClass}>{formErrors.price}</p>}</div>
                <div><label className={labelClass}>Mức tồn kho tối thiểu</label><input type="number" value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })} className={inputClass} placeholder="VD: 10" min="0" /></div>
            </div>
            <div><label className={labelClass}>Hạn sử dụng</label><DatePicker value={formData.expiry_date} onChange={(date) => setFormData({ ...formData, expiry_date: date })} placeholder="Chọn ngày" className="w-full md:w-1/2" /></div>
            <div><label className={labelClass}>Mô tả</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className={`${inputClass} h-auto min-h-[80px] py-3 resize-none`} placeholder="Mô tả..." /></div>
            <div className="flex gap-3 justify-end pt-2"><button type="button" onClick={() => setShowAddModal(false)} className="h-11 px-6 rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-2)] font-medium border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors">Hủy</button><button type="button" onClick={handleAdd} className="h-11 px-8 rounded-[var(--radius-md)] bg-[var(--success)] text-white font-medium hover:opacity-90 transition-opacity">Thêm hàng hoá</button></div>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Sửa thông tin hàng hoá" size="lg">
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Tên hàng hoá <span className="text-[var(--danger)]">*</span></label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} />{formErrors.name && <p className={errorClass}>{formErrors.name}</p>}</div>
                <div><label className={labelClass}>Mã SKU/Barcode <span className="text-[var(--danger)]">*</span></label><input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })} className={inputClass} />{formErrors.sku && <p className={errorClass}>{formErrors.sku}</p>}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Đơn vị tính <span className="text-[var(--danger)]">*</span></label><input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} onBlur={(e) => setFormData({ ...formData, unit: capitalizeUnit(e.target.value) })} className={inputClass} />{formErrors.unit && <p className={errorClass}>{formErrors.unit}</p>}</div>
                <div><label className={labelClass}>Danh mục <span className="text-[var(--danger)]">*</span></label><CustomSelect value={formData.category} onChange={(val) => setFormData({ ...formData, category: val })} placeholder="Chọn danh mục" className="w-full" size="md" options={CATEGORIES.map(c => ({ value: c, label: c }))} />{formErrors.category && <p className={errorClass}>{formErrors.category}</p>}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Giá bán (₫) <span className="text-[var(--danger)]">*</span></label><input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={inputClass} min="0" />{formErrors.price && <p className={errorClass}>{formErrors.price}</p>}</div>
                <div><label className={labelClass}>Mức tồn kho tối thiểu</label><input type="number" value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })} className={inputClass} min="0" /></div>
            </div>
            <div><label className={labelClass}>Hạn sử dụng</label><DatePicker value={formData.expiry_date} onChange={(date) => setFormData({ ...formData, expiry_date: date })} placeholder="Chọn ngày" className="w-full md:w-1/2" /></div>
            <div><label className={labelClass}>Mô tả</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className={`${inputClass} h-auto min-h-[80px] py-3 resize-none`} /></div>
            <div className="flex gap-3 justify-end pt-2"><button type="button" onClick={() => setShowEditModal(false)} className="h-11 px-6 rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-2)] font-medium border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors">Hủy</button><button type="button" onClick={handleUpdate} className="h-11 px-8 rounded-[var(--radius-md)] bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity">Lưu thay đổi</button></div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Xác nhận xoá" size="sm">
        <div className="space-y-5">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--danger-light)] flex items-center justify-center"><Icon name="trash" size="xl" className="text-[var(--danger)]" /></div>
                <p className="text-[15px] text-[var(--text-1)]">Bạn có chắc muốn xoá hàng hoá</p><p className="text-[16px] font-semibold text-[var(--text-1)] mt-1">"{selectedItem?.name}"?</p><p className="text-[13px] text-[var(--text-3)] mt-2">Hành động này không thể hoàn tác.</p>
            </div>
            <div className="flex gap-3 justify-center pt-2"><button type="button" onClick={() => setShowDeleteModal(false)} className="h-11 px-6 rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-2)] font-medium border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors">Hủy</button><button type="button" onClick={handleDeleteClick} className="h-11 px-8 rounded-[var(--radius-md)] bg-[var(--danger)] text-white font-medium hover:opacity-90 transition-opacity">Xoá</button></div>
        </div>
      </Modal>
      
      {/* Passkey Modal for Delete */}
      <PasskeyModal
        isOpen={showPasskeyModal}
        onClose={handlePasskeyCancel}
        onConfirm={handlePasskeyConfirm}
        title="Xác nhận xóa hàng hóa"
        message={`Nhập Passkey 6 chữ số để xóa "${selectedItem?.name}"`}
      />
    </div>
  );
}