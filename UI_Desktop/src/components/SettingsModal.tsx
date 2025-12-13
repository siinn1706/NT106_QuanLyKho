import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../state/ui_store';
import { useAuthStore } from '../state/auth_store';
import { useCompanyStore, Warehouse, type WarehouseManager } from '../state/company_store';
import { apiLogout, apiUploadCompanyLogo } from '../app/api_client';
import { BASE_URL } from '../app/api_client';
import Icon from './ui/Icon';
import CustomSelect from './ui/CustomSelect';
import PasskeyModal from './ui/PasskeyModal';

type TabKey = 'general' | 'company' | 'warehouse' | 'account' | 'notifications' | 'about';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TabKey;
}

export default function SettingsModal({ isOpen, onClose, initialTab = 'general' }: SettingsModalProps) {
  const { isDarkMode, toggleDarkMode } = useUIStore();
  const { user, logout } = useAuthStore();
  const { 
    companyInfo, updateCompanyInfo, setCompanyLogo,
    warehouses, activeWarehouseId, addWarehouse, updateWarehouse, deleteWarehouse, setActiveWarehouse 
  } = useCompanyStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [language, setLanguage] = useState('vi');
  const [notifications, setNotifications] = useState({
    lowStock: true,
    newOrders: true,
    systemUpdates: false,
  });

  // Form states cho Company
  const [companyForm, setCompanyForm] = useState(companyInfo);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Form states cho Warehouse
  const [warehouseForm, setWarehouseForm] = useState<Omit<Warehouse, 'id' | 'createdAt'>>({
    name: '',
    code: '',
    address: '',
    phone: '',
    managers: [],
    notes: '',
  });
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  
  // Manager form states
  const [managerForm, setManagerForm] = useState<WarehouseManager>({ name: '', position: '' });
  const [editingManagerIndex, setEditingManagerIndex] = useState<number | null>(null);

  // Passkey states
  const [showChangePasskeyModal, setShowChangePasskeyModal] = useState(false);
  const [showForgotPasskeyModal, setShowForgotPasskeyModal] = useState(false);
  const [changePasskeyData, setChangePasskeyData] = useState({ currentPassword: '', newPasskey: '', confirmPasskey: '' });
  const [forgotPasskeyData, setForgotPasskeyData] = useState({ password: '', email: '' });
  
  // Passkey validation for warehouse operations
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [passkeyAction, setPasskeyAction] = useState<'update' | 'delete' | null>(null);
  const [pendingWarehouseId, setPendingWarehouseId] = useState<string | null>(null);

  const APP_VERSION = '1.0.0';
  const BUILD_DATE = '13/11/2025';

  // Sync tab when modal opens or initialTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setCompanyForm(companyInfo); // Reset form khi mở modal
      setShowWarehouseForm(false);
      setEditingWarehouseId(null);
    }
  }, [isOpen, initialTab, companyInfo]);

  if (!isOpen) return null;

  const handleCheckUpdate = () => {
    alert('Đang kiểm tra cập nhật...');
    setTimeout(() => {
      alert('Bạn đang sử dụng phiên bản mới nhất!');
    }, 1000);
  };

  const handleClearCache = () => {
    if (confirm('Bạn có chắc muốn xóa cache? Điều này có thể làm chậm lần khởi động tiếp theo.')) {
      localStorage.clear();
      alert('Đã xóa cache thành công!');
    }
  };

  const handleExportData = () => {
    alert('Chức năng xuất dữ liệu đang được phát triển...');
  };

  const handleLogout = async () => {
    if (!confirm('Bạn có chắc muốn đăng xuất?')) return;
    try {
      await apiLogout();
    } catch {}
    logout();
    onClose();
    navigate('/login');
  };

  const handleChangePassword = () => {
    onClose();
    navigate('/change-password');
  };

  // ===== COMPANY HANDLERS =====
  const handleCompanyFormChange = (field: string, value: string) => {
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveCompanyInfo = () => {
    updateCompanyInfo(companyForm);
    alert('Đã lưu thông tin công ty!');
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa 10MB!');
      return;
    }

    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Định dạng ảnh phải là PNG, JPG, JPEG hoặc WEBP!');
      return;
    }

    try {
      // Upload via API
      const response = await apiUploadCompanyLogo(file);
      setCompanyForm((prev) => ({ ...prev, logo: response.logo_url }));
      alert('Logo đã được tải lên thành công!');
    } catch (error) {
      console.error('Upload logo failed:', error);
      alert(error instanceof Error ? error.message : 'Không thể tải logo lên. Vui lòng thử lại!');
    }
  };

  const handleRemoveLogo = () => {
    setCompanyForm((prev) => ({ ...prev, logo: '' }));
  };

  // ===== WAREHOUSE HANDLERS =====
  const resetWarehouseForm = () => {
    setWarehouseForm({
      name: '',
      code: '',
      address: '',
      phone: '',
      managers: [],
      notes: '',
    });
    setEditingWarehouseId(null);
    setShowWarehouseForm(false);
    setManagerForm({ name: '', position: '' });
    setEditingManagerIndex(null);
  };

  const handleWarehouseFormChange = (field: string, value: string) => {
    setWarehouseForm((prev) => ({ ...prev, [field]: value }));
  };
  
  // Manager handlers
  const handleAddManager = () => {
    if (!managerForm.name.trim() || !managerForm.position.trim()) {
      alert('Vui lòng nhập tên và chức vụ!');
      return;
    }
    
    if (editingManagerIndex !== null) {
      // Update existing
      const updated = [...warehouseForm.managers];
      updated[editingManagerIndex] = managerForm;
      setWarehouseForm((prev) => ({ ...prev, managers: updated }));
      setEditingManagerIndex(null);
    } else {
      // Add new
      setWarehouseForm((prev) => ({ 
        ...prev, 
        managers: [...prev.managers, managerForm] 
      }));
    }
    
    setManagerForm({ name: '', position: '' });
  };
  
  const handleEditManager = (index: number) => {
    setManagerForm(warehouseForm.managers[index]);
    setEditingManagerIndex(index);
  };
  
  const handleDeleteManager = (index: number) => {
    const updated = warehouseForm.managers.filter((_, i) => i !== index);
    setWarehouseForm((prev) => ({ ...prev, managers: updated }));
  };

  const handleAddWarehouse = () => {
    if (!warehouseForm.name.trim() || !warehouseForm.code.trim()) {
      alert('Vui lòng nhập tên kho và mã kho!');
      return;
    }
    addWarehouse(warehouseForm);
    resetWarehouseForm();
  };

  const handleEditWarehouse = (wh: Warehouse) => {
    setWarehouseForm({
      name: wh.name,
      code: wh.code,
      address: wh.address,
      phone: wh.phone,
      managers: wh.managers,
      notes: wh.notes,
    });
    setEditingWarehouseId(wh.id);
    setShowWarehouseForm(true);
  };

  const handleUpdateWarehouse = () => {
    if (!editingWarehouseId) return;
    if (!warehouseForm.name.trim() || !warehouseForm.code.trim()) {
      alert('Vui lòng nhập tên kho và mã kho!');
      return;
    }
    // Yêu cầu passkey trước khi update
    setPasskeyAction('update');
    setPendingWarehouseId(editingWarehouseId);
    setShowPasskeyModal(true);
  };

  const handleDeleteWarehouse = (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa kho này?')) return;
    // Yêu cầu passkey trước khi delete
    setPasskeyAction('delete');
    setPendingWarehouseId(id);
    setShowPasskeyModal(true);
  };
  
  const handlePasskeyConfirm = (passkey: string) => {
    // TODO: Validate passkey với backend
    // Giả sử passkey đúng là "123456" (sẽ thay bằng API call)
    if (passkey !== '123456') {
      alert('Passkey không chính xác!');
      setShowPasskeyModal(false);
      return;
    }
    
    // Thực hiện action tương ứng
    if (passkeyAction === 'update' && pendingWarehouseId) {
      updateWarehouse(pendingWarehouseId, warehouseForm);
      resetWarehouseForm();
    } else if (passkeyAction === 'delete' && pendingWarehouseId) {
      deleteWarehouse(pendingWarehouseId);
    }
    
    // Reset states
    setShowPasskeyModal(false);
    setPasskeyAction(null);
    setPendingWarehouseId(null);
  };
  
  const handlePasskeyCancel = () => {
    setShowPasskeyModal(false);
    setPasskeyAction(null);
    setPendingWarehouseId(null);
  };

  // ===== PASSKEY HANDLERS =====
  const handleChangePasskey = () => {
    // Validate
    if (!changePasskeyData.currentPassword || !changePasskeyData.newPasskey || !changePasskeyData.confirmPasskey) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    if (changePasskeyData.newPasskey.length !== 6 || !/^\d{6}$/.test(changePasskeyData.newPasskey)) {
      alert('Passkey phải là 6 chữ số!');
      return;
    }
    if (changePasskeyData.newPasskey !== changePasskeyData.confirmPasskey) {
      alert('Passkey mới không khớp!');
      return;
    }
    // TODO: Call API để đổi passkey (BE sẽ verify password và gửi mail)
    alert('Đã gửi yêu cầu đổi passkey. Vui lòng kiểm tra email!');
    setShowChangePasskeyModal(false);
    setChangePasskeyData({ currentPassword: '', newPasskey: '', confirmPasskey: '' });
  };

  const handleForgotPasskey = () => {
    // Validate
    if (!forgotPasskeyData.password || !forgotPasskeyData.email) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    // TODO: Call API để gửi passkey mới qua email (BE sẽ verify password)
    alert('Đã gửi passkey mới đến email của bạn!');
    setShowForgotPasskeyModal(false);
    setForgotPasskeyData({ password: '', email: '' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[700px] h-[600px] rounded-[32px] flex overflow-hidden border bg-[var(--surface-1)] border-[var(--border)] text-[var(--text-1)]">
        {/* Sidebar */}
        <div className="w-48 border-r bg-[var(--surface-2)] border-[var(--border)]">
          <div className="h-16 px-6 flex items-center border-b border-[var(--border)]">
            <h2 className="font-bold text-lg">Cài đặt</h2>
          </div>
          <nav className="p-2">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-colors duration-150 ${
                activeTab === 'general'
                  ? 'bg-[var(--surface-3)] text-[var(--primary)]'
                  : 'hover:bg-[var(--surface-3)]/50'
              }`}
            >
              Chung
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-colors duration-150 ${
                activeTab === 'company'
                  ? 'bg-[var(--surface-3)] text-[var(--primary)]'
                  : 'hover:bg-[var(--surface-3)]/50'
              }`}
            >
              Công ty
            </button>
            <button
              onClick={() => setActiveTab('warehouse')}
              className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-colors duration-150 ${
                activeTab === 'warehouse'
                  ? 'bg-[var(--surface-3)] text-[var(--primary)]'
                  : 'hover:bg-[var(--surface-3)]/50'
              }`}
            >
              Kho hàng
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-colors duration-150 ${
                activeTab === 'account'
                  ? 'bg-[var(--surface-3)] text-[var(--primary)]'
                  : 'hover:bg-[var(--surface-3)]/50'
              }`}
            >
              Tài khoản
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-colors duration-150 ${
                activeTab === 'notifications'
                  ? 'bg-[var(--surface-3)] text-[var(--primary)]'
                  : 'hover:bg-[var(--surface-3)]/50'
              }`}
            >
              Thông báo
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-colors duration-150 ${
                activeTab === 'about'
                  ? 'bg-[var(--surface-3)] text-[var(--primary)]'
                  : 'hover:bg-[var(--surface-3)]/50'
              }`}
            >
              Thông tin
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border)]">
            <h3 className="font-semibold text-lg">
              {activeTab === 'general' && 'Cài đặt chung'}
              {activeTab === 'company' && 'Thông tin công ty'}
              {activeTab === 'warehouse' && 'Quản lý kho hàng'}
              {activeTab === 'account' && 'Tài khoản'}
              {activeTab === 'notifications' && 'Cài đặt thông báo'}
              {activeTab === 'about' && 'Thông tin ứng dụng'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-colors duration-150 hover:bg-[var(--surface-2)]"
            >
              <Icon name="close" size="md" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Theme Toggle */}
                <div className="p-4 rounded-xl border transition-colors duration-150 bg-[var(--surface-2)] border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--primary-light)]">
                        <Icon name={isDarkMode ? 'sun' : 'moon'} size="lg" className="text-[var(--primary)]" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Giao diện</h4>
                        <p className="text-sm text-[var(--text-2)]">
                          Chuyển đổi giữa chế độ sáng và tối
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleDarkMode}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        isDarkMode ? 'bg-[var(--primary)]' : 'bg-[var(--surface-3)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          isDarkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Language */}
                <div className="p-4 rounded-xl border transition-colors duration-150 bg-[var(--surface-2)] border-[var(--border)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--info-light)]">
                      <Icon name="globe" size="lg" className="text-[var(--info)]" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Ngôn ngữ</h4>
                      <p className="text-sm text-[var(--text-2)]">
                        Chọn ngôn ngữ hiển thị
                      </p>
                    </div>
                  </div>
                  <CustomSelect
                    value={language}
                    onChange={setLanguage}
                    className="w-full"
                    size="md"
                    options={[
                      { value: 'vi', label: 'Tiếng Việt' },
                      { value: 'en', label: 'English' },
                    ]}
                  />
                </div>

                {/* Data Management */}
                <div className="p-4 rounded-xl border transition-colors duration-150 bg-[var(--surface-2)] border-[var(--border)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--overstock-light)]">
                      <Icon name="database" size="lg" className="text-[var(--overstock)]" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Quản lý dữ liệu</h4>
                      <p className="text-sm text-[var(--text-2)]">
                        Sao lưu và xóa dữ liệu
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportData}
                      className="flex-1 px-4 py-2 rounded-xl border transition-colors duration-150 bg-[var(--surface-1)] border-[var(--border)] hover:bg-[var(--surface-3)]"
                    >
                      <Icon name="download" size="sm" className="inline mr-2" />
                      Xuất dữ liệu
                    </button>
                    <button
                      onClick={handleClearCache}
                      className="flex-1 px-4 py-2 rounded-xl border transition-colors duration-150 border-[var(--danger)]/50 text-[var(--danger)] hover:bg-[var(--danger-light)]"
                    >
                      <Icon name="trash" size="sm" className="inline mr-2" />
                      Xóa cache
                    </button>
                  </div>
                </div>

                {/* Security */}
                <div className="p-4 rounded-xl border transition-colors duration-150 bg-[var(--surface-2)] border-[var(--border)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--success-light)]">
                      <Icon name="shield" size="lg" className="text-[var(--success)]" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Bảo mật</h4>
                      <p className="text-sm text-[var(--text-2)]">
                        Cài đặt bảo mật tài khoản
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/change-password');
                    }}
                    className="w-full px-4 py-2 rounded-xl border transition-colors duration-150 bg-[var(--surface-1)] border-[var(--border)] hover:bg-[var(--surface-3)]"
                  >
                    <Icon name="key" size="sm" className="inline mr-2" />
                    Đổi mật khẩu
                  </button>
                </div>
              </div>
            )}

            {/* ===== COMPANY TAB ===== */}
            {activeTab === 'company' && (
              <div className="space-y-6">
                {/* Logo Upload */}
                <div className="p-4 rounded-xl border bg-[var(--surface-2)] border-[var(--border)]">
                  <h4 className="font-semibold mb-3">Logo công ty</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden bg-[var(--surface-1)]">
                      {companyForm.logo ? (
                        <img 
                          src={companyForm.logo.startsWith('http') ? companyForm.logo : `${BASE_URL}${companyForm.logo}`} 
                          alt="Logo" 
                          className="w-full h-full object-contain" 
                        />
                      ) : (
                        <Icon name="image" size="xl" className="text-[var(--text-2)]" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl border bg-[var(--surface-1)] border-[var(--border)] hover:bg-[var(--surface-3)] transition-colors text-sm"
                      >
                        <Icon name="upload" size="sm" className="inline mr-2" />
                        Tải lên
                      </button>
                      {companyForm.logo && (
                        <button
                          onClick={handleRemoveLogo}
                          className="px-4 py-2 rounded-xl border border-[var(--danger)]/50 text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors text-sm"
                        >
                          <Icon name="trash" size="sm" className="inline mr-2" />
                          Xóa logo
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-2)] mt-2">Định dạng: PNG, JPG, JPEG, WEBP. Tối đa 10MB. Ảnh phải vuông (1:1).</p>
                </div>

                {/* Basic Info */}
                <div className="p-4 rounded-xl border bg-[var(--surface-2)] border-[var(--border)]">
                  <h4 className="font-semibold mb-4">Thông tin cơ bản</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tên công ty</label>
                      <input
                        type="text"
                        value={companyForm.name}
                        onChange={(e) => handleCompanyFormChange('name', e.target.value)}
                        placeholder="Công ty TNHH ABC"
                        className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Mã số thuế (MST)</label>
                      <input
                        type="text"
                        value={companyForm.taxId}
                        onChange={(e) => handleCompanyFormChange('taxId', e.target.value)}
                        placeholder="0123456789"
                        className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Địa chỉ</label>
                      <input
                        type="text"
                        value={companyForm.address}
                        onChange={(e) => handleCompanyFormChange('address', e.target.value)}
                        placeholder="123 Đường ABC, Quận X, TP.HCM"
                        className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="p-4 rounded-xl border bg-[var(--surface-2)] border-[var(--border)]">
                  <h4 className="font-semibold mb-4">Thông tin liên hệ</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Điện thoại</label>
                      <input
                        type="tel"
                        value={companyForm.phone}
                        onChange={(e) => handleCompanyFormChange('phone', e.target.value)}
                        placeholder="028 1234 5678"
                        className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={companyForm.email}
                        onChange={(e) => handleCompanyFormChange('email', e.target.value)}
                        placeholder="info@company.com"
                        className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Info */}
                <div className="p-4 rounded-xl border bg-[var(--surface-2)] border-[var(--border)]">
                  <h4 className="font-semibold mb-4">Thông tin ngân hàng</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tên ngân hàng</label>
                      <input
                        type="text"
                        value={companyForm.bankName}
                        onChange={(e) => handleCompanyFormChange('bankName', e.target.value)}
                        placeholder="Ngân hàng TMCP Ngoại Thương (Vietcombank)"
                        className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Số tài khoản</label>
                        <input
                          type="text"
                          value={companyForm.bankAccount}
                          onChange={(e) => handleCompanyFormChange('bankAccount', e.target.value)}
                          placeholder="0123456789"
                          className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Chi nhánh</label>
                        <input
                          type="text"
                          value={companyForm.bankBranch}
                          onChange={(e) => handleCompanyFormChange('bankBranch', e.target.value)}
                          placeholder="Chi nhánh Quận 1"
                          className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveCompanyInfo}
                  className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <Icon name="save" size="sm" className="inline mr-2" />
                  Lưu thông tin
                </button>
              </div>
            )}

            {/* ===== WAREHOUSE TAB ===== */}
            {activeTab === 'warehouse' && (
              <div className="space-y-6">
                {/* Active Warehouse */}
                {warehouses.length > 0 && (
                  <div className="p-4 rounded-xl border bg-[var(--primary-light)] border-[var(--primary)]/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--primary)]">
                        <Icon name="warehouse" size="lg" className="text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Kho đang sử dụng</h4>
                        <p className="text-sm text-[var(--text-2)]">
                          Chọn kho để làm việc
                        </p>
                      </div>
                    </div>
                    <CustomSelect
                      value={activeWarehouseId || ''}
                      onChange={(val) => setActiveWarehouse(val)}
                      options={warehouses.map((wh) => ({ value: wh.id, label: `${wh.code} - ${wh.name}` }))}
                      size="md"
                      className="w-full mt-2"
                    />
                  </div>
                )}

                {/* Add Warehouse Button */}
                {!showWarehouseForm && (
                  <button
                    onClick={() => setShowWarehouseForm(true)}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--text-2)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                  >
                    <Icon name="plus" size="sm" className="inline mr-2" />
                    Thêm kho mới
                  </button>
                )}

                {/* Warehouse Form */}
                {showWarehouseForm && (
                  <div className="p-4 rounded-xl border bg-[var(--surface-2)] border-[var(--border)]">
                    <h4 className="font-semibold mb-4">
                      {editingWarehouseId ? 'Chỉnh sửa kho' : 'Thêm kho mới'}
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Mã kho *</label>
                          <input
                            type="text"
                            value={warehouseForm.code}
                            onChange={(e) => handleWarehouseFormChange('code', e.target.value)}
                            placeholder="KHO-HCM"
                            className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Tên kho *</label>
                          <input
                            type="text"
                            value={warehouseForm.name}
                            onChange={(e) => handleWarehouseFormChange('name', e.target.value)}
                            placeholder="Kho Hồ Chí Minh"
                            className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Địa chỉ</label>
                        <input
                          type="text"
                          value={warehouseForm.address}
                          onChange={(e) => handleWarehouseFormChange('address', e.target.value)}
                          placeholder="123 Đường ABC, Quận X"
                          className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Điện thoại</label>
                        <input
                          type="tel"
                          value={warehouseForm.phone}
                          onChange={(e) => handleWarehouseFormChange('phone', e.target.value)}
                          placeholder="028 1234 5678"
                          className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                        />
                      </div>
                      
                      {/* Managers Management */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Người quản lý</label>
                        
                        {/* Manager Form */}
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={managerForm.name}
                            onChange={(e) => setManagerForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Tên người quản lý"
                            className="flex-1 px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
                          />
                          <input
                            type="text"
                            value={managerForm.position}
                            onChange={(e) => setManagerForm((prev) => ({ ...prev, position: e.target.value }))}
                            placeholder="Chức vụ"
                            className="flex-1 px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
                          />
                          <button
                            onClick={handleAddManager}
                            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors text-sm whitespace-nowrap"
                          >
                            {editingManagerIndex !== null ? 'Cập nhật' : 'Thêm'}
                          </button>
                        </div>
                        
                        {/* Managers List */}
                        {warehouseForm.managers.length > 0 && (
                          <div className="space-y-2">
                            {warehouseForm.managers.map((mgr, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-3)] border border-[var(--border)]">
                                <Icon name="user" size="sm" className="text-[var(--text-2)]" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{mgr.name}</p>
                                  <p className="text-xs text-[var(--text-2)]">{mgr.position}</p>
                                </div>
                                <button
                                  onClick={() => handleEditManager(idx)}
                                  className="p-1.5 rounded hover:bg-[var(--surface-1)] transition-colors"
                                  title="Sửa"
                                >
                                  <Icon name="edit" size="sm" className="text-[var(--text-2)]" />
                                </button>
                                <button
                                  onClick={() => handleDeleteManager(idx)}
                                  className="p-1.5 rounded hover:bg-[var(--danger-light)] transition-colors"
                                  title="Xóa"
                                >
                                  <Icon name="trash" size="sm" className="text-[var(--danger)]" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Ghi chú</label>
                        <textarea
                          value={warehouseForm.notes}
                          onChange={(e) => handleWarehouseFormChange('notes', e.target.value)}
                          placeholder="Ghi chú về kho..."
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={resetWarehouseForm}
                          className="flex-1 py-2 rounded-xl border bg-[var(--surface-1)] border-[var(--border)] hover:bg-[var(--surface-3)] transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={editingWarehouseId ? handleUpdateWarehouse : handleAddWarehouse}
                          className="flex-1 py-2 rounded-xl bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-hover)] transition-colors"
                        >
                          {editingWarehouseId ? 'Cập nhật' : 'Thêm kho'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warehouse List */}
                {warehouses.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Danh sách kho ({warehouses.length})</h4>
                    {warehouses.map((wh) => (
                      <div
                        key={wh.id}
                        className={`p-4 rounded-xl border transition-colors ${
                          wh.id === activeWarehouseId
                            ? 'bg-[var(--primary-light)] border-[var(--primary)]/30'
                            : 'bg-[var(--surface-2)] border-[var(--border)]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              wh.id === activeWarehouseId ? 'bg-[var(--primary)]' : 'bg-[var(--surface-3)]'
                            }`}>
                              <Icon name="warehouse" size="md" className={wh.id === activeWarehouseId ? 'text-white' : 'text-[var(--text-2)]'} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{wh.name}</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface-3)] text-[var(--text-2)]">
                                  {wh.code}
                                </span>
                                {wh.id === activeWarehouseId && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--primary)] text-white">
                                    Đang dùng
                                  </span>
                                )}
                              </div>
                              {wh.address && (
                                <p className="text-sm text-[var(--text-2)]">{wh.address}</p>
                              )}
                              {wh.managers.length > 0 && (
                                <div className="mt-1">
                                  <p className="text-xs text-[var(--text-2)] font-medium">Quản lý:</p>
                                  {wh.managers.map((mgr, idx) => (
                                    <p key={idx} className="text-xs text-[var(--text-2)] ml-2">
                                      • {mgr.name} - {mgr.position}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditWarehouse(wh)}
                              className="p-2 rounded-lg hover:bg-[var(--surface-3)] transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Icon name="edit" size="sm" className="text-[var(--text-2)]" />
                            </button>
                            {warehouses.length > 1 && (
                              <button
                                onClick={() => handleDeleteWarehouse(wh.id)}
                                className="p-2 rounded-lg hover:bg-[var(--danger-light)] transition-colors"
                                title="Xóa"
                              >
                                <Icon name="trash" size="sm" className="text-[var(--danger)]" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {warehouses.length === 0 && !showWarehouseForm && (
                  <div className="text-center py-8 text-[var(--text-2)]">
                    <Icon name="warehouse" size="xl" className="mx-auto mb-3 opacity-50" />
                    <p>Chưa có kho hàng nào.</p>
                    <p className="text-sm">Thêm kho mới để bắt đầu quản lý.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {/* Low Stock Alert */}
                <div className="p-4 rounded-xl border transition-colors duration-150 bg-[var(--surface-2)] border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--warning-light)]">
                        <Icon name="bell" size="md" className="text-[var(--warning)]" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Cảnh báo hàng sắp hết</h4>
                        <p className="text-sm text-[var(--text-2)]">
                          Nhận thông báo khi hàng hoá sắp hết
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, lowStock: !notifications.lowStock })}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        notifications.lowStock ? 'bg-[var(--primary)]' : 'bg-[var(--surface-3)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          notifications.lowStock ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* New Orders */}
                <div className="p-4 rounded-xl border transition-colors duration-150 bg-[var(--surface-2)] border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--info-light)]">
                        <Icon name="bell" size="md" className="text-[var(--info)]" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Đơn hàng mới</h4>
                        <p className="text-sm text-[var(--text-2)]">
                          Thông báo khi có đơn nhập/xuất mới
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, newOrders: !notifications.newOrders })}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        notifications.newOrders ? 'bg-[var(--primary)]' : 'bg-[var(--surface-3)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          notifications.newOrders ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* System Updates */}
                <div className="p-4 rounded-xl border transition-colors duration-150 bg-[var(--surface-2)] border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--success-light)]">
                        <Icon name="bell" size="md" className="text-[var(--success)]" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Cập nhật hệ thống</h4>
                        <p className="text-sm text-[var(--text-2)]">
                          Thông báo khi có phiên bản mới
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, systemUpdates: !notifications.systemUpdates })}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        notifications.systemUpdates ? 'bg-[var(--primary)]' : 'bg-[var(--surface-3)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          notifications.systemUpdates ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                {/* App Info */}
                <div className="p-4 rounded-xl border text-center bg-[var(--surface-2)] border-[var(--border)]">
                  <div className="w-28 h-28 flex items-center justify-center mx-auto mb-4">
                    <img src="/src/resources/logo.png" alt="N3T Logo" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Quản Lý Kho N3T</h3>
                  <p className="text-sm mb-1 text-[var(--text-2)]">
                    Phiên bản: {APP_VERSION}
                  </p>
                  <p className="text-sm text-[var(--text-2)]">
                    Ngày build: {BUILD_DATE}
                  </p>
                </div>

                {/* Update Check */}
                <div className="p-4 rounded-xl border bg-[var(--surface-2)] border-[var(--border)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--primary-light)]">
                      <Icon name="sync" size="lg" className="text-[var(--primary)]" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Kiểm tra cập nhật</h4>
                      <p className="text-sm text-[var(--text-2)]">
                        Tìm và cài đặt phiên bản mới nhất
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckUpdate}
                    className="w-full px-4 py-2 bg-[var(--primary)] text-white rounded-xl transition-colors duration-150 hover:bg-[var(--primary-hover)]"
                  >
                    Kiểm tra ngay
                  </button>
                </div>

                {/* Info */}
                <div className="p-4 rounded-xl border bg-[var(--surface-2)] border-[var(--border)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--info-light)]">
                      <Icon name="info" size="lg" className="text-[var(--info)]" />
                    </div>
                    <h4 className="font-semibold">Thông tin</h4>
                  </div>
                  <div className="text-sm space-y-2 text-[var(--text-2)]">
                    <p>© 2025 N3T Team. All rights reserved.</p>
                    <p>Developed by: Nhóm 12 - NT106</p>
                    <p>Email: support@n3t.com</p>
                    <p className="mt-4 pt-4 border-t border-[var(--border)]">
                      Ứng dụng quản lý kho hàng hiện đại với giao diện thân thiện, 
                      hỗ trợ theo dõi tồn kho, nhập xuất và báo cáo chi tiết.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="p-6 rounded-xl border bg-[var(--surface-2)] border-[var(--border)]">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-[var(--primary)] to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{user?.name || 'User'}</h3>
                      <p className="text-sm text-[var(--text-2)]">{user?.email || 'user@example.com'}</p>
                      {user?.role && (
                        <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-[var(--primary-light)] text-[var(--primary)]">
                          {user.role}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 rounded-xl border transition-colors duration-150 bg-[var(--surface-1)] border-[var(--border)] hover:bg-[var(--surface-3)]">
                    <Icon name="user" size="sm" className="inline mr-2" />
                    Chỉnh sửa hồ sơ
                  </button>
                </div>

                {/* Account Info */}
                <div className="p-4 rounded-xl border bg-[var(--surface-2)] border-[var(--border)]">
                  <h4 className="font-semibold mb-4">Thông tin tài khoản</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                      <span className="text-sm text-[var(--text-2)]">Email</span>
                      <span className="text-sm font-medium">{user?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                      <span className="text-sm text-[var(--text-2)]">ID</span>
                      <span className="text-sm font-medium font-mono">{user?.id ? user.id.substring(0,8) + '...' : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-[var(--text-2)]">Vai trò</span>
                      <span className="text-sm font-medium">{user?.role || 'User'}</span>
                    </div>
                  </div>
                </div>

                {/* Security Section */}
                <div className="p-4 rounded-xl border bg-[var(--surface-2)] border-[var(--border)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--success-light)]">
                      <Icon name="shield" size="lg" className="text-[var(--success)]" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Bảo mật</h4>
                      <p className="text-sm text-[var(--text-2)]">Cài đặt bảo mật tài khoản</p>
                    </div>
                  </div>
                  
                  {/* Password */}
                  <div className="mb-4 pb-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="key" size="sm" className="text-[var(--warning)]" />
                      <span className="text-sm font-medium">Mật khẩu</span>
                    </div>
                    <p className="text-xs text-[var(--text-2)] mb-2">Thay đổi mật khẩu đăng nhập</p>
                    <button onClick={handleChangePassword} className="w-full px-4 py-2 rounded-xl border transition-colors duration-150 bg-[var(--surface-1)] border-[var(--border)] hover:bg-[var(--surface-3)] text-sm">
                      Đổi mật khẩu
                    </button>
                  </div>

                  {/* Passkey */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="lock" size="sm" className="text-[var(--primary)]" />
                      <span className="text-sm font-medium">Passkey (6 số)</span>
                    </div>
                    <p className="text-xs text-[var(--text-2)] mb-3">Mã bảo mật 6 chữ số để xác thực các thao tác quan trọng</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowChangePasskeyModal(true)}
                        className="flex-1 px-3 py-2 rounded-xl border transition-colors duration-150 bg-[var(--surface-1)] border-[var(--border)] hover:bg-[var(--surface-3)] text-sm"
                      >
                        Đổi Passkey
                      </button>
                      <button 
                        onClick={() => setShowForgotPasskeyModal(true)}
                        className="flex-1 px-3 py-2 rounded-xl border transition-colors duration-150 border-[var(--warning)]/50 text-[var(--warning)] hover:bg-[var(--warning-light)] text-sm"
                      >
                        Quên Passkey
                      </button>
                    </div>
                  </div>
                </div>

                {/* Logout */}
                <div className="p-4 rounded-xl border-2 bg-[var(--danger-light)] border-[var(--danger)]/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--danger)]/20">
                      <Icon name="signOut" size="lg" className="text-[var(--danger)]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--danger)]">Đăng xuất</h4>
                      <p className="text-sm text-[var(--text-2)]">Thoát khỏi tài khoản hiện tại</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="w-full px-4 py-2 rounded-xl transition-colors duration-150 font-semibold bg-[var(--danger)] hover:opacity-90 text-white">
                    <Icon name="signOut" size="sm" className="inline mr-2" />
                    Đăng xuất ngay
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Passkey Modal */}
      {showChangePasskeyModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[450px] rounded-[24px] bg-[var(--surface-1)] border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Đổi Passkey</h3>
              <button
                onClick={() => {
                  setShowChangePasskeyModal(false);
                  setChangePasskeyData({ currentPassword: '', newPasskey: '', confirmPasskey: '' });
                }}
                className="p-2 rounded-full hover:bg-[var(--surface-2)] transition-colors"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mật khẩu hiện tại *</label>
                <input
                  type="password"
                  value={changePasskeyData.currentPassword}
                  onChange={(e) => setChangePasskeyData({ ...changePasskeyData, currentPassword: e.target.value })}
                  placeholder="Nhập mật khẩu để xác thực"
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Passkey mới (6 chữ số) *</label>
                <input
                  type="text"
                  maxLength={6}
                  value={changePasskeyData.newPasskey}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setChangePasskeyData({ ...changePasskeyData, newPasskey: val });
                  }}
                  placeholder="123456"
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none font-mono text-center text-lg tracking-widest"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Xác nhận Passkey mới *</label>
                <input
                  type="text"
                  maxLength={6}
                  value={changePasskeyData.confirmPasskey}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setChangePasskeyData({ ...changePasskeyData, confirmPasskey: val });
                  }}
                  placeholder="123456"
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none font-mono text-center text-lg tracking-widest"
                />
              </div>
              <p className="text-xs text-[var(--text-2)] bg-[var(--info-light)] p-3 rounded-lg border border-[var(--info)]/30">
                <Icon name="info" size="xs" className="inline mr-1" />
                Mã xác thực sẽ được gửi đến email của bạn sau khi hoàn tất.
              </p>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowChangePasskeyModal(false);
                  setChangePasskeyData({ currentPassword: '', newPasskey: '', confirmPasskey: '' });
                }}
                className="flex-1 px-4 py-2 rounded-xl border bg-[var(--surface-2)] border-[var(--border)] hover:bg-[var(--surface-3)] transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleChangePasskey}
                className="flex-1 px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-hover)] transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Passkey Modal */}
      {showForgotPasskeyModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[450px] rounded-[24px] bg-[var(--surface-1)] border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Quên Passkey</h3>
              <button
                onClick={() => {
                  setShowForgotPasskeyModal(false);
                  setForgotPasskeyData({ password: '', email: '' });
                }}
                className="p-2 rounded-full hover:bg-[var(--surface-2)] transition-colors"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mật khẩu *</label>
                <input
                  type="password"
                  value={forgotPasskeyData.password}
                  onChange={(e) => setForgotPasskeyData({ ...forgotPasskeyData, password: e.target.value })}
                  placeholder="Nhập mật khẩu để xác thực"
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={forgotPasskeyData.email}
                  onChange={(e) => setForgotPasskeyData({ ...forgotPasskeyData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none"
                />
              </div>
              <p className="text-xs text-[var(--text-2)] bg-[var(--warning-light)] p-3 rounded-lg border border-[var(--warning)]/30">
                <Icon name="warning" size="xs" className="inline mr-1" />
                Passkey mới sẽ được gửi đến email sau khi xác thực thành công.
              </p>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowForgotPasskeyModal(false);
                  setForgotPasskeyData({ password: '', email: '' });
                }}
                className="flex-1 px-4 py-2 rounded-xl border bg-[var(--surface-2)] border-[var(--border)] hover:bg-[var(--surface-3)] transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleForgotPasskey}
                className="flex-1 px-4 py-2 rounded-xl bg-[var(--warning)] text-white font-semibold hover:opacity-90 transition-colors"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Passkey Modal for Warehouse Operations */}
      <PasskeyModal
        isOpen={showPasskeyModal}
        onClose={handlePasskeyCancel}
        onConfirm={handlePasskeyConfirm}
        title={passkeyAction === 'delete' ? "Xác nhận xóa kho" : "Xác nhận cập nhật kho"}
        message="Vui lòng nhập Passkey 6 chữ số để xác thực"
      />
    </div>
  );
}
