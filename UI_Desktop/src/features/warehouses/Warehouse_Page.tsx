/** Warehouse_Page.tsx - Quản lý kho hàng */

import { useEffect, useState, useRef } from 'react';
import { 
  apiGetWarehouses, 
  apiCreateWarehouse, 
  apiUpdateWarehouse, 
  apiDeleteWarehouse,
  apiSetActiveWarehouse,
  apiGetWarehouseInventory,
  Warehouse, 
  WarehouseCreate,
  WarehouseInventoryStats,
  WarehouseManager
} from '../../app/api_client';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import { useAuthStore } from '../../state/auth_store';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface UserSearchResult {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface WarehouseForm {
  name: string;
  code: string;
  address: string;
  phone: string;
  managers: WarehouseManager[];
  notes: string;
}

export default function Warehouse_Page() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState<WarehouseForm>({
    name: '',
    code: '',
    address: '',
    phone: '',
    managers: [],
    notes: '',
  });
  
  // Detail modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [inventoryStats, setInventoryStats] = useState<WarehouseInventoryStats | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'inventory' | 'managers'>('info');
  
  const currentUser = useAuthStore((state) => state.user);

  // User search states for manager selection
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [activeManagerIndex, setActiveManagerIndex] = useState<number | null>(null);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadWarehouses();
  }, []);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserSearchResults([]);
        setActiveManagerIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const data = await apiGetWarehouses();
      setWarehouses(data);
    } catch (error) {
      console.error('Load warehouses error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
      managers: [],
      notes: '',
    });
    setEditingWarehouse(null);
  };
  
  const handleOpenAddModal = () => {
    resetForm();
    setShowFormModal(true);
  };
  
  const handleOpenEditModal = (warehouse: Warehouse) => {
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address,
      phone: warehouse.phone,
      managers: warehouse.managers || [],
      notes: warehouse.notes,
    });
    setEditingWarehouse(warehouse);
    setShowFormModal(true);
  };
  
  const handleFormChange = (field: keyof WarehouseForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAddManager = () => {
    setFormData(prev => ({
      ...prev,
      managers: [...prev.managers, { email: '', position: '' }]
    }));
  };
  
  const handleRemoveManager = (index: number) => {
    setFormData(prev => ({
      ...prev,
      managers: prev.managers.filter((_, i) => i !== index)
    }));
  };
  
  const handleManagerChange = (index: number, field: 'email' | 'position', value: string) => {
    setFormData(prev => ({
      ...prev,
      managers: prev.managers.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      )
    }));
  };

  // User search for manager selection
  const handleUserSearch = async (query: string, managerIndex: number) => {
    setUserSearchQuery(query);
    setActiveManagerIndex(managerIndex);
    
    // Update email field immediately
    handleManagerChange(managerIndex, 'email', query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${BASE_URL}/users?search=${encodeURIComponent(query)}&limit=5`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUserSearchResults(data.users || []);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setUserSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);
  };
  
  const handleSelectUser = (user: UserSearchResult, managerIndex: number) => {
    handleManagerChange(managerIndex, 'email', user.email);
    setUserSearchResults([]);
    setActiveManagerIndex(null);
    setUserSearchQuery('');
  };
  
  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      showWarning('Vui lòng nhập tên kho và mã kho!');
      return;
    }
    
    try {
      if (editingWarehouse) {
        await apiUpdateWarehouse(editingWarehouse.id, formData);
        showSuccess('Đã cập nhật kho thành công!');
      } else {
        await apiCreateWarehouse(formData as WarehouseCreate);
        showSuccess('Đã thêm kho thành công!');
      }
      setShowFormModal(false);
      resetForm();
      loadWarehouses();
    } catch (error: any) {
      console.error('Submit warehouse error:', error);
      showError(error.message || 'Không thể lưu kho!');
    }
  };
  
  const handleViewDetail = async (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowDetailModal(true);
    setActiveTab('info');
    setInventoryStats(null);
    
    setLoadingInventory(true);
    try {
      const stats = await apiGetWarehouseInventory(warehouse.id);
      setInventoryStats(stats);
    } catch (error) {
      console.error('Load inventory error:', error);
    } finally {
      setLoadingInventory(false);
    }
  };
  
  const getPositionLevel = (position: string): number => {
    if (position === 'Chủ kho') return 3;
    if (position === 'Trưởng kho') return 2;
    if (position === 'Nhân viên') return 1;
    return 0;
  };
  
  const getCurrentUserPosition = (): string | null => {
    if (!currentUser || !selectedWarehouse) return null;
    const manager = selectedWarehouse.managers.find(m => m.email === currentUser.email);
    return manager ? manager.position : null;
  };
  
  const canEditManager = (targetPosition: string): boolean => {
    const currentPosition = getCurrentUserPosition();
    if (!currentPosition) return false;
    
    const currentLevel = getPositionLevel(currentPosition);
    const targetLevel = getPositionLevel(targetPosition);
    
    return currentLevel > targetLevel;
  };
  
  const handleRemoveManagerFromWarehouse = async (managerEmail: string) => {
    if (!selectedWarehouse) return;
    
    const manager = selectedWarehouse.managers.find(m => m.email === managerEmail);
    if (!manager) return;
    
    if (!canEditManager(manager.position)) {
      showWarning('Bạn không có quyền xóa người quản lý này');
      return;
    }
    
    if (!confirm(`Bạn có chắc muốn xóa ${managerEmail} khỏi danh sách quản lý?`)) return;
    
    try {
      const updatedManagers = selectedWarehouse.managers.filter(m => m.email !== managerEmail);
      await apiUpdateWarehouse(selectedWarehouse.id, { managers: updatedManagers });
      showSuccess('Đã xóa người quản lý thành công');
      loadWarehouses();
      setSelectedWarehouse({ ...selectedWarehouse, managers: updatedManagers });
    } catch (error: any) {
      showError(error.message || 'Không thể xóa người quản lý');
    }
  };
  
  const handleChangeManagerPosition = async (managerEmail: string, newPosition: string) => {
    if (!selectedWarehouse) return;
    
    const manager = selectedWarehouse.managers.find(m => m.email === managerEmail);
    if (!manager) return;
    
    if (!canEditManager(manager.position)) {
      showWarning('Bạn không có quyền chỉnh sửa người quản lý này');
      return;
    }
    
    try {
      const updatedManagers = selectedWarehouse.managers.map(m =>
        m.email === managerEmail ? { ...m, position: newPosition } : m
      );
      await apiUpdateWarehouse(selectedWarehouse.id, { managers: updatedManagers });
      showSuccess('Đã cập nhật chức vụ thành công');
      loadWarehouses();
      setSelectedWarehouse({ ...selectedWarehouse, managers: updatedManagers });
    } catch (error: any) {
      showError(error.message || 'Không thể cập nhật chức vụ');
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa kho này?')) return;
    try {
      await apiDeleteWarehouse(id);
      showSuccess('Đã xóa kho thành công!');
      loadWarehouses();
    } catch (error: any) {
      showError(error.message || 'Không thể xóa kho!');
    }
  };
  
  const handleSetActive = async (id: number) => {
    try {
      await apiSetActiveWarehouse(id);
      showSuccess('Đã đổi kho active thành công!');
      loadWarehouses();
    } catch (error: any) {
      showError(error.message || 'Không thể đổi kho active!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Kho hàng</h1>
          <p className="text-[var(--text-3)] text-sm mt-1">Quản lý kho hàng và thống kê hàng hóa</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="h-11 px-6 rounded-[var(--radius-lg)] bg-[var(--primary)] text-white font-semibold transition-all duration-[180ms] hover:opacity-90 active:scale-[0.98] flex items-center gap-2"
        >
          <Icon name="plus" size="sm" />
          Thêm kho
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-[var(--surface-1)] rounded-[var(--radius-xl)] border border-[var(--border)]">
        <table className="min-w-full">
          <thead className="bg-[var(--surface-2)] border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3 text-left text-[var(--text-2)] text-[12px] font-semibold uppercase tracking-wider">Mã kho</th>
              <th className="px-4 py-3 text-left text-[var(--text-2)] text-[12px] font-semibold uppercase tracking-wider">Tên kho</th>
              <th className="px-4 py-3 text-left text-[var(--text-2)] text-[12px] font-semibold uppercase tracking-wider">Chức vụ</th>
              <th className="px-4 py-3 text-left text-[var(--text-2)] text-[12px] font-semibold uppercase tracking-wider">Địa chỉ</th>
              <th className="px-4 py-3 text-center text-[var(--text-2)] text-[12px] font-semibold uppercase tracking-wider">Trạng thái</th>
              <th className="px-4 py-3 text-center text-[var(--text-2)] text-[12px] font-semibold uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-[var(--text-3)]">
                    <Icon name="spinner" size="md" spin />
                    <span>Đang tải...</span>
                  </div>
                </td>
              </tr>
            ) : warehouses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--text-3)]">
                  <Icon name="warehouse" size="2x" className="mx-auto mb-3 opacity-50" />
                  <p>Chưa có kho nào</p>
                </td>
              </tr>
            ) : (
              warehouses.map(wh => (
                <tr 
                  key={wh.id} 
                  className="hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                  onClick={() => handleViewDetail(wh)}
                >
                  <td className="px-4 py-3.5">
                    <span className="font-mono font-semibold text-[var(--primary)]">{wh.code}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-medium text-[var(--text-1)]">{wh.name}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    {wh.managers && wh.managers.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {wh.managers.map((m, idx) => (
                          <span key={idx} className="text-[var(--text-2)] text-[13px]">
                            {m.email} - <span className="text-[var(--text-3)]">{m.position}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[var(--text-3)] text-[13px]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-[var(--text-2)] text-[13px]">{wh.address || '-'}</td>
                  <td className="px-4 py-3.5 text-center">
                    {wh.is_active ? (
                      <span className="px-2.5 py-1 rounded-full bg-[var(--success-light)] text-[var(--success)] text-[12px] font-semibold">
                        Đang dùng
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-3)] text-[12px] font-semibold">
                        Không dùng
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {!wh.is_active && (
                        <button 
                          onClick={() => handleSetActive(wh.id)}
                          className="h-8 px-3 rounded-[var(--radius-sm)] bg-[var(--success-light)] text-[var(--success)] text-[13px] font-medium border border-[var(--success)]/20 hover:border-[var(--success)]/40 transition-colors"
                          title="Đặt làm kho active"
                        >
                          <Icon name="check" size="sm" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenEditModal(wh)}
                        className="h-8 px-3 rounded-[var(--radius-sm)] bg-[var(--primary-light)] text-[var(--primary)] text-[13px] font-medium border border-[var(--primary)]/20 hover:border-[var(--primary)]/40 transition-colors"
                      >
                        <Icon name="pen" size="sm" />
                      </button>
                      <button 
                        onClick={() => handleDelete(wh.id)}
                        className="h-8 px-3 rounded-[var(--radius-sm)] bg-[var(--danger-light)] text-[var(--danger)] text-[13px] font-medium border border-[var(--danger)]/20 hover:border-[var(--danger)]/40 transition-colors"
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

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          resetForm();
        }}
        title={editingWarehouse ? 'Chỉnh sửa kho' : 'Thêm kho mới'}
        size="lg"
      >
        <div className="space-y-5">
          {/* Thông tin cơ bản */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-2)] uppercase tracking-wider">Thông tin cơ bản</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Mã kho *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleFormChange('code', e.target.value)}
                  placeholder="K1, K2, KHO-HCM..."
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Tên kho *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Kho chính, Kho phụ..."
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Số điện thoại</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  placeholder="0901234567"
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1.5">Địa chỉ</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                  placeholder="123 Đường ABC, Quận X, TP.HCM"
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                />
              </div>
            </div>
          </div>
          
          {/* Người quản lý */}
          <div className="space-y-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-2)] uppercase tracking-wider">Người quản lý (Chức vụ)</h3>
              <button
                onClick={handleAddManager}
                className="h-8 px-3 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] text-[13px] font-medium border border-[var(--primary)]/20 hover:border-[var(--primary)]/40 transition-colors"
              >
                <Icon name="plus" size="sm" className="mr-1" />
                Thêm
              </button>
            </div>
            <div className="space-y-3">
              {formData.managers.map((manager, index) => (
                <div key={index} className="grid grid-cols-2 gap-3 p-3 bg-[var(--surface-2)] rounded-lg">
                  <div className="relative">
                    <label className="block text-xs font-medium mb-1 text-[var(--text-3)]">Email người quản lý</label>
                    <input
                      type="email"
                      value={manager.email}
                      onChange={(e) => handleUserSearch(e.target.value, index)}
                      onFocus={() => setActiveManagerIndex(index)}
                      placeholder="Tìm theo email hoặc nhập email..."
                      className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
                    />
                    {/* User search dropdown */}
                    {activeManagerIndex === index && userSearchResults.length > 0 && (
                      <div 
                        ref={dropdownRef}
                        className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-auto"
                      >
                        {userSearchResults.map(user => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleSelectUser(user, index)}
                            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[var(--surface-2)] text-left transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center overflow-hidden">
                              {user.avatar_url ? (
                                <img src={`${BASE_URL}${user.avatar_url}`} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Icon name="user" size="sm" className="text-[var(--primary)]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--text-1)] truncate">
                                {user.display_name || user.username}
                              </p>
                              <p className="text-xs text-[var(--text-3)] truncate">{user.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {activeManagerIndex === index && isSearchingUsers && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg shadow-lg p-3 text-center">
                        <Icon name="spinner" spin size="sm" className="text-[var(--text-3)]" />
                        <span className="ml-2 text-sm text-[var(--text-3)]">Đang tìm...</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1 text-[var(--text-3)]">Chức vụ</label>
                      <select
                        value={manager.position}
                        onChange={(e) => handleManagerChange(index, 'position', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
                      >
                        <option value="">Chọn chức vụ</option>
                        <option value="Chủ kho">Chủ kho</option>
                        <option value="Trưởng kho">Trưởng kho</option>
                        <option value="Nhân viên">Nhân viên</option>
                      </select>
                    </div>
                    <button
                      onClick={() => handleRemoveManager(index)}
                      className="h-10 w-10 flex items-center justify-center rounded-lg bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]/20 hover:border-[var(--danger)]/40 transition-colors"
                    >
                      <Icon name="trash" size="sm" />
                    </button>
                  </div>
                </div>
              ))}
              {formData.managers.length === 0 && (
                <p className="text-sm text-[var(--text-3)] text-center py-4">Chưa có người quản lý nào</p>
              )}
            </div>
          </div>
          
          {/* Ghi chú */}
          <div className="pt-4 border-t border-[var(--border)]">
            <label className="block text-sm font-medium mb-1.5">Ghi chú</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
              placeholder="Ghi chú thêm về kho..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none resize-none"
            />
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowFormModal(false);
                resetForm();
              }}
              className="flex-1 h-10 rounded-xl border bg-[var(--surface-2)] border-[var(--border)] hover:bg-[var(--surface-3)] transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 h-10 rounded-xl bg-[var(--primary)] text-white font-semibold hover:opacity-90 transition-opacity"
            >
              {editingWarehouse ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Detail Modal - Chi tiết kho và thống kê hàng hóa */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Chi tiết kho: ${selectedWarehouse?.code || ''} - ${selectedWarehouse?.name || ''}`}
        size="xl"
      >
        {selectedWarehouse && (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-[var(--border)]">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 text-[14px] font-medium transition-colors border-b-2 ${
                  activeTab === 'info'
                    ? 'text-[var(--primary)] border-[var(--primary)]'
                    : 'text-[var(--text-3)] border-transparent hover:text-[var(--text-1)]'
                }`}
              >
                <Icon name="info" size="sm" className="inline mr-2" />
                Thông tin
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-2 text-[14px] font-medium transition-colors border-b-2 ${
                  activeTab === 'inventory'
                    ? 'text-[var(--primary)] border-[var(--primary)]'
                    : 'text-[var(--text-3)] border-transparent hover:text-[var(--text-1)]'
                }`}
              >
                <Icon name="boxes" size="sm" className="inline mr-2" />
                Hàng hóa
                {inventoryStats && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-[12px]">
                    {inventoryStats.total_items}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('managers')}
                className={`px-4 py-2 text-[14px] font-medium transition-colors border-b-2 ${
                  activeTab === 'managers'
                    ? 'text-[var(--primary)] border-[var(--primary)]'
                    : 'text-[var(--text-3)] border-transparent hover:text-[var(--text-1)]'
                }`}
              >
                <Icon name="users" size="sm" className="inline mr-2" />
                Người quản lý
                {selectedWarehouse.managers && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-[12px]">
                    {selectedWarehouse.managers.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'info' ? (
              <div className="space-y-5">
                {/* Thông tin cơ bản */}
                <div className="space-y-3">
                  <h3 className="text-[13px] font-semibold text-[var(--text-2)] uppercase tracking-wider">Thông tin cơ bản</h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
                    <div>
                      <p className="text-[12px] text-[var(--text-3)]">Mã kho</p>
                      <p className="text-[15px] font-mono font-semibold text-[var(--primary)]">{selectedWarehouse.code}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-[var(--text-3)]">Tên kho</p>
                      <p className="text-[15px] font-semibold text-[var(--text-1)]">{selectedWarehouse.name}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-[var(--text-3)]">Số điện thoại</p>
                      <p className="text-[15px] font-medium text-[var(--text-1)]">{selectedWarehouse.phone || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[12px] text-[var(--text-3)]">Địa chỉ</p>
                      <p className="text-[15px] font-medium text-[var(--text-1)]">{selectedWarehouse.address || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Người quản lý */}
                {selectedWarehouse.managers && selectedWarehouse.managers.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[13px] font-semibold text-[var(--text-2)] uppercase tracking-wider">Người quản lý</h3>
                    <div className="space-y-2">
                      {selectedWarehouse.managers.map((manager, idx) => (
                        <div key={idx} className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
                          <p className="text-[15px] font-semibold text-[var(--text-1)]">{manager.email}</p>
                          <p className="text-[13px] text-[var(--text-3)] mt-1">{manager.position}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ghi chú */}
                {selectedWarehouse.notes && (
                  <div className="space-y-3">
                    <h3 className="text-[13px] font-semibold text-[var(--text-2)] uppercase tracking-wider">Ghi chú</h3>
                    <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
                      <p className="text-[14px] text-[var(--text-1)] whitespace-pre-wrap">{selectedWarehouse.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'inventory' ? (
              <div className="space-y-4">
                {loadingInventory ? (
                  <div className="flex items-center justify-center py-12">
                    <Icon name="spinner" size="lg" spin className="text-[var(--text-3)]" />
                    <span className="ml-3 text-[var(--text-3)]">Đang tải thống kê...</span>
                  </div>
                ) : inventoryStats ? (
                  <>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-lg)] border border-[var(--border)]">
                        <p className="text-[12px] text-[var(--text-3)]">Tổng loại hàng</p>
                        <p className="text-[20px] font-bold text-[var(--primary)]">{inventoryStats.total_items}</p>
                      </div>
                      <div className="p-4 bg-[var(--success-light)] rounded-[var(--radius-lg)] border border-[var(--success)]/20">
                        <p className="text-[12px] text-[var(--success)]">Tồn kho</p>
                        <p className="text-[20px] font-bold text-[var(--success)]">{inventoryStats.items_in_stock}</p>
                      </div>
                      <div className="p-4 bg-[var(--warning-light)] rounded-[var(--radius-lg)] border border-[var(--warning)]/20">
                        <p className="text-[12px] text-[var(--warning)]">Sắp hết</p>
                        <p className="text-[20px] font-bold text-[var(--warning)]">{inventoryStats.items_low_stock}</p>
                      </div>
                      <div className="p-4 bg-[var(--danger-light)] rounded-[var(--radius-lg)] border border-[var(--danger)]/20">
                        <p className="text-[12px] text-[var(--danger)]">Hết hàng</p>
                        <p className="text-[20px] font-bold text-[var(--danger)]">{inventoryStats.items_out_of_stock}</p>
                      </div>
                    </div>

                    {inventoryStats.items_missing > 0 && (
                      <div className="p-4 bg-[var(--warning-light)] rounded-[var(--radius-lg)] border border-[var(--warning)]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[12px] font-medium text-[var(--warning)]">HÀNG THIẾU</p>
                            <p className="text-[18px] font-bold text-[var(--warning)]">
                              {inventoryStats.items_missing} loại hàng - {inventoryStats.total_missing.toLocaleString('vi-VN')} đơn vị
                            </p>
                          </div>
                          <Icon name="warning" size="2x" className="text-[var(--warning)]" />
                        </div>
                      </div>
                    )}

                    {/* Items List */}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {inventoryStats.items.map((item) => (
                        <div
                          key={item.item_id}
                          className={`p-4 rounded-[var(--radius-md)] border ${
                            item.status === 'out_of_stock'
                              ? 'bg-[var(--danger-light)] border-[var(--danger)]/30'
                              : item.status === 'low_stock'
                              ? 'bg-[var(--warning-light)] border-[var(--warning)]/30'
                              : 'bg-[var(--surface-2)] border-[var(--border)]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold text-[var(--text-1)]">{item.item_name}</p>
                              <p className="text-[12px] text-[var(--text-3)] font-mono">{item.item_code}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              item.status === 'out_of_stock'
                                ? 'bg-[var(--danger)] text-white'
                                : item.status === 'low_stock'
                                ? 'bg-[var(--warning)] text-white'
                                : 'bg-[var(--success-light)] text-[var(--success)]'
                            }`}>
                              {item.status === 'out_of_stock' ? 'HẾT HÀNG' : item.status === 'low_stock' ? 'SẮP HẾT' : 'BÌNH THƯỜNG'}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-[13px]">
                            <div>
                              <p className="text-[var(--text-3)]">Tồn kho</p>
                              <p className="font-semibold text-[var(--text-1)]">{item.current_stock.toLocaleString('vi-VN')} {item.unit}</p>
                            </div>
                            <div>
                              <p className="text-[var(--text-3)]">Đã nhập</p>
                              <p className="font-medium text-[var(--success)]">+{item.total_in.toLocaleString('vi-VN')}</p>
                            </div>
                            <div>
                              <p className="text-[var(--text-3)]">Đã xuất</p>
                              <p className="font-medium text-[var(--warning)]">-{item.total_out.toLocaleString('vi-VN')}</p>
                            </div>
                            {item.missing > 0 && (
                              <div>
                                <p className="text-[var(--text-3)]">Thiếu</p>
                                <p className="font-medium text-[var(--danger)]">{item.missing.toLocaleString('vi-VN')}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-[var(--text-3)]">
                    <Icon name="box-open" size="2x" className="mx-auto mb-3 opacity-50" />
                    <p>Chưa có dữ liệu hàng hóa trong kho này</p>
                  </div>
                )}
              </div>
            ) : activeTab === 'managers' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[16px] font-semibold text-[var(--text-1)]">Danh sách người quản lý</h3>
                    <p className="text-[13px] text-[var(--text-3)] mt-1">
                      Quyền hạn: Chủ kho &gt; Trưởng kho &gt; Nhân viên
                    </p>
                  </div>
                </div>

                {selectedWarehouse.managers && selectedWarehouse.managers.length > 0 ? (
                  <div className="space-y-3">
                    {selectedWarehouse.managers
                      .sort((a, b) => getPositionLevel(b.position) - getPositionLevel(a.position))
                      .map((manager, idx) => {
                        const isCurrentUser = currentUser?.email === manager.email;
                        const canEdit = canEditManager(manager.position);
                        const currentPosition = getCurrentUserPosition();
                        const currentLevel = currentPosition ? getPositionLevel(currentPosition) : 0;
                        
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-[var(--radius-lg)] border ${
                              isCurrentUser
                                ? 'bg-[var(--primary-light)] border-[var(--primary)]/30'
                                : 'bg-[var(--surface-2)] border-[var(--border)]'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-[15px] font-semibold text-[var(--text-1)]">
                                    {manager.email}
                                  </p>
                                  {isCurrentUser && (
                                    <span className="px-2 py-0.5 rounded-full bg-[var(--primary)] text-white text-[11px] font-semibold">
                                      BẠN
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 mt-2">
                                  {canEdit ? (
                                    <select
                                      value={manager.position}
                                      onChange={(e) => handleChangeManagerPosition(manager.email, e.target.value)}
                                      className="px-3 py-1.5 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] text-[13px] font-medium focus:border-[var(--primary)] outline-none"
                                    >
                                      <option value="Chủ kho">Chủ kho</option>
                                      <option value="Trưởng kho">Trưởng kho</option>
                                      <option value="Nhân viên">Nhân viên</option>
                                    </select>
                                  ) : (
                                    <span className={`px-3 py-1.5 rounded-lg text-[13px] font-medium ${
                                      manager.position === 'Chủ kho'
                                        ? 'bg-[var(--danger-light)] text-[var(--danger)]'
                                        : manager.position === 'Trưởng kho'
                                        ? 'bg-[var(--warning-light)] text-[var(--warning)]'
                                        : 'bg-[var(--success-light)] text-[var(--success)]'
                                    }`}>
                                      {manager.position}
                                    </span>
                                  )}
                                  
                                  <span className="text-[12px] text-[var(--text-3)]">
                                    Level {getPositionLevel(manager.position)}
                                  </span>
                                </div>

                                {!canEdit && !isCurrentUser && (
                                  <p className="text-[12px] text-[var(--text-3)] mt-2">
                                    {currentLevel === 0 
                                      ? 'Bạn không phải người quản lý kho này'
                                      : currentLevel === getPositionLevel(manager.position)
                                      ? 'Không thể chỉnh sửa người cùng cấp'
                                      : 'Không có quyền chỉnh sửa'}
                                  </p>
                                )}
                              </div>

                              {canEdit && (
                                <button
                                  onClick={() => handleRemoveManagerFromWarehouse(manager.email)}
                                  className="ml-4 h-9 w-9 flex items-center justify-center rounded-lg bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]/20 hover:border-[var(--danger)]/40 transition-colors"
                                  title="Xóa người quản lý"
                                >
                                  <Icon name="trash" size="sm" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[var(--text-3)]">
                    <Icon name="users" size="2x" className="mx-auto mb-3 opacity-50" />
                    <p>Chưa có người quản lý nào</p>
                  </div>
                )}

                <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-lg)] border border-[var(--border)]">
                  <h4 className="text-[14px] font-semibold text-[var(--text-1)] mb-2">Hướng dẫn phân quyền</h4>
                  <ul className="space-y-1 text-[13px] text-[var(--text-2)]">
                    <li>• <span className="font-semibold text-[var(--danger)]">Chủ kho (Level 3)</span>: Có thể chỉnh sửa và xóa Trưởng kho, Nhân viên</li>
                    <li>• <span className="font-semibold text-[var(--warning)]">Trưởng kho (Level 2)</span>: Có thể chỉnh sửa và xóa Nhân viên</li>
                    <li>• <span className="font-semibold text-[var(--success)]">Nhân viên (Level 1)</span>: Không thể chỉnh sửa người khác</li>
                    <li className="pt-2 border-t border-[var(--border)] mt-2">• Người cùng cấp không thể chỉnh sửa lẫn nhau</li>
                  </ul>
                </div>
              </div>
            ) : null}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-[var(--border)]">
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
    </div>
  );
}

