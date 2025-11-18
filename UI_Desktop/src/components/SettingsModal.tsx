import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaMoon, FaSun, FaBell, FaLanguage, FaDownload, FaInfoCircle, FaKey, FaDatabase, FaTrash, FaSync, FaShieldAlt, FaUser, FaSignOutAlt, FaArrowLeft, FaSave } from 'react-icons/fa';
import { useUIStore } from '../state/ui_store';
import { useAuthStore } from '../state/auth_store';
import { apiLogout, apiChangePassword } from '../app/api_client';


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { isDarkMode, toggleDarkMode } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'general' | 'account' | 'notifications' | 'about'>('general');

  // State cho việc đổi mật khẩu
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passForm, setPassForm] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const [passStatus, setPassStatus] = useState({ loading: false, error: '', success: '' });

  const [language, setLanguage] = useState('vi');
  const [notifications, setNotifications] = useState({
    lowStock: true,
    newOrders: true,
    systemUpdates: false,
  });

  const APP_VERSION = '1.0.0';
  const BUILD_DATE = '13/11/2025';

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
    } catch (e) {
      // ignore server-side logout errors; proceed client-side
    } finally {
      logout();
      onClose();
      navigate('/login');
    }
  };

  const handleChangePassword = () => {
    setIsChangingPass(true);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassStatus({ loading: true, error: '', success: '' });

    if (passForm.newPass !== passForm.confirmPass) {
      setPassStatus({ loading: false, error: 'Mật khẩu mới không khớp', success: '' });
      return;
    }
    if (passForm.newPass.length < 6) {
      setPassStatus({ loading: false, error: 'Mật khẩu phải có ít nhất 6 ký tự', success: '' });
      return;
    }

    try {
      if (!user?.email) throw new Error("Không tìm thấy email người dùng");
      
      await apiChangePassword({
        email: user.email,
        oldPassword: passForm.oldPass,
        newPassword: passForm.newPass
      });

      setPassStatus({ loading: false, error: '', success: 'Đổi mật khẩu thành công!' });
      // Reset form sau 1s
      setTimeout(() => {
        setIsChangingPass(false);
        setPassForm({ oldPass: '', newPass: '', confirmPass: '' });
        setPassStatus({ loading: false, error: '', success: '' });
      }, 1500);
    } catch (err: any) {
      setPassStatus({ loading: false, error: err.message, success: '' });
    }
  };

  const renderChangePasswordForm = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <button 
          onClick={() => { setIsChangingPass(false); setPassStatus({ loading: false, error: '', success: '' }); }}
          className={`p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors`}
        >
          <FaArrowLeft />
        </button>
        <h3 className="font-bold text-lg">Đổi mật khẩu</h3>
      </div>

      <form onSubmit={handleChangePasswordSubmit} className="space-y-4 max-w-md">
        {passStatus.error && (
          <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm border border-red-200">
            {passStatus.error}
          </div>
        )}
        {passStatus.success && (
          <div className="p-3 bg-green-100 text-green-600 rounded-lg text-sm border border-green-200">
            {passStatus.success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu hiện tại</label>
          <input
            type="password"
            required
            className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-zinc-300'}`}
            value={passForm.oldPass}
            onChange={e => setPassForm({...passForm, oldPass: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
          <input
            type="password"
            required
            className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-zinc-300'}`}
            value={passForm.newPass}
            onChange={e => setPassForm({...passForm, newPass: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            required
            className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-zinc-300'}`}
            value={passForm.confirmPass}
            onChange={e => setPassForm({...passForm, confirmPass: e.target.value})}
          />
        </div>

        <button
          type="submit"
          disabled={passStatus.loading}
          className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
        >
          {passStatus.loading ? 'Đang xử lý...' : <><FaSave /> Lưu thay đổi</>}
        </button>
      </form>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-[700px] h-[600px] rounded-2xl shadow-2xl flex overflow-hidden ${
        isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'
      }`}>
        {/* Sidebar */}
        <div className={`w-48 border-r ${
          isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className={`h-16 px-6 flex items-center border-b ${
            isDarkMode ? 'border-zinc-700' : 'border-zinc-200'
          }`}>
            <h2 className="font-bold text-lg">Cài đặt</h2>
          </div>
          <nav className="p-2">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors ${
                activeTab === 'general'
                  ? isDarkMode
                    ? 'bg-primary/20 text-primary'
                    : 'bg-primary/10 text-primary'
                  : isDarkMode
                    ? 'hover:bg-zinc-700'
                    : 'hover:bg-zinc-100'
              }`}
            >
              Chung
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors ${
                activeTab === 'account'
                  ? isDarkMode
                    ? 'bg-primary/20 text-primary'
                    : 'bg-primary/10 text-primary'
                  : isDarkMode
                    ? 'hover:bg-zinc-700'
                    : 'hover:bg-zinc-100'
              }`}
            >
              Tài khoản
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors ${
                activeTab === 'notifications'
                  ? isDarkMode
                    ? 'bg-primary/20 text-primary'
                    : 'bg-primary/10 text-primary'
                  : isDarkMode
                    ? 'hover:bg-zinc-700'
                    : 'hover:bg-zinc-100'
              }`}
            >
              Thông báo
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors ${
                activeTab === 'about'
                  ? isDarkMode
                    ? 'bg-primary/20 text-primary'
                    : 'bg-primary/10 text-primary'
                  : isDarkMode
                    ? 'hover:bg-zinc-700'
                    : 'hover:bg-zinc-100'
              }`}
            >
              Thông tin
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className={`h-16 flex items-center justify-between px-6 border-b ${
            isDarkMode ? 'border-zinc-700' : 'border-zinc-200'
          }`}>
            <h3 className="font-semibold text-lg">
              {activeTab === 'general' && 'Cài đặt chung'}
              {activeTab === 'account' && 'Tài khoản'}
              {activeTab === 'notifications' && 'Cài đặt thông báo'}
              {activeTab === 'about' && 'Thông tin ứng dụng'}
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
              }`}
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'general' && (isChangingPass ? renderChangePasswordForm() : 
              <div className="space-y-6">
                {/* Theme Toggle */}
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {isDarkMode ? <FaMoon size={20} /> : <FaSun size={20} />}
                      <div>
                        <h4 className="font-semibold">Giao diện</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          Chuyển đổi giữa chế độ sáng và tối
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleDarkMode}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isDarkMode ? 'bg-primary' : 'bg-zinc-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isDarkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Language */}
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <FaLanguage size={20} />
                    <div>
                      <h4 className="font-semibold">Ngôn ngữ</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Chọn ngôn ngữ hiển thị
                      </p>
                    </div>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-zinc-700 border-zinc-600 text-white'
                        : 'bg-white border-zinc-300 text-zinc-900'
                    }`}
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>

                {/* Data Management */}
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <FaDatabase size={20} />
                    <div>
                      <h4 className="font-semibold">Quản lý dữ liệu</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Sao lưu và xóa dữ liệu
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportData}
                      className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                        isDarkMode
                          ? 'border-zinc-600 hover:bg-zinc-700'
                          : 'border-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      <FaDownload className="inline mr-2" size={14} />
                      Xuất dữ liệu
                    </button>
                    <button
                      onClick={handleClearCache}
                      className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                        isDarkMode
                          ? 'border-red-600 text-red-500 hover:bg-red-600/10'
                          : 'border-red-500 text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <FaTrash className="inline mr-2" size={14} />
                      Xóa cache
                    </button>
                  </div>
                </div>

                {/* Security */}
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <FaShieldAlt size={20} />
                    <div>
                      <h4 className="font-semibold">Bảo mật</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Cài đặt bảo mật tài khoản
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'border-zinc-600 hover:bg-zinc-700'
                        : 'border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    <FaKey className="inline mr-2" size={14} />
                    Đổi mật khẩu
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'account' && (isChangingPass ? renderChangePasswordForm() :
              <div className="space-y-6">
                {/* User Info */}
                <div className={`p-6 rounded-lg ${
                  isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                }`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{user?.name || 'User'}</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {user?.email || 'user@example.com'}
                      </p>
                      {user?.role && (
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                          isDarkMode ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
                        }`}>
                          {user.role}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'border-zinc-600 hover:bg-zinc-700'
                        : 'border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    <FaUser className="inline mr-2" size={14} />
                    Chỉnh sửa hồ sơ
                  </button>
                </div>

                {/* Account Info */}
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                }`}>
                  <h4 className="font-semibold mb-4">Thông tin tài khoản</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-zinc-700 dark:border-zinc-600">
                      <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Email
                      </span>
                      <span className="text-sm font-medium">
                        {user?.email || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-zinc-700 dark:border-zinc-600">
                      <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        ID
                      </span>
                      <span className="text-sm font-medium font-mono">
                        {user?.id ? user.id.substring(0, 8) + '...' : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Vai trò
                      </span>
                      <span className="text-sm font-medium">
                        {user?.role || 'User'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <FaKey size={20} />
                    <div>
                      <h4 className="font-semibold">Mật khẩu</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Thay đổi mật khẩu đăng nhập
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'border-zinc-600 hover:bg-zinc-700'
                        : 'border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    Đổi mật khẩu
                  </button>
                </div>

                {/* Logout */}
                <div className={`p-4 rounded-lg border-2 ${
                  isDarkMode 
                    ? 'bg-red-900/10 border-red-800' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <FaSignOutAlt size={20} className="text-red-600" />
                    <div>
                      <h4 className="font-semibold text-red-600">Đăng xuất</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Thoát khỏi tài khoản hiện tại
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className={`w-full px-4 py-2 rounded-lg transition-colors font-semibold ${
                      isDarkMode
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    <FaSignOutAlt className="inline mr-2" size={14} />
                    Đăng xuất ngay
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {/* Low Stock Alert */}
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaBell size={18} />
                      <div>
                        <h4 className="font-semibold">Cảnh báo hàng sắp hết</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          Nhận thông báo khi hàng hoá sắp hết
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, lowStock: !notifications.lowStock })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.lowStock ? 'bg-primary' : 'bg-zinc-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications.lowStock ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* New Orders */}
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaBell size={18} />
                      <div>
                        <h4 className="font-semibold">Đơn hàng mới</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          Thông báo khi có đơn nhập/xuất mới
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, newOrders: !notifications.newOrders })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.newOrders ? 'bg-primary' : 'bg-zinc-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications.newOrders ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* System Updates */}
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaBell size={18} />
                      <div>
                        <h4 className="font-semibold">Cập nhật hệ thống</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          Thông báo khi có phiên bản mới
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, systemUpdates: !notifications.systemUpdates })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.systemUpdates ? 'bg-primary' : 'bg-zinc-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
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
                <div className={`p-4 rounded-lg text-center ${
                  isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                }`}>
                  <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                    N3T
                  </div>
                  <h3 className="text-xl font-bold mb-2">Quản Lý Kho N3T</h3>
                  <p className={`text-sm mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Phiên bản: {APP_VERSION}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Ngày build: {BUILD_DATE}
                  </p>
                </div>

                {/* Update Check */}
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <FaSync size={20} />
                    <div>
                      <h4 className="font-semibold">Kiểm tra cập nhật</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Tìm và cài đặt phiên bản mới nhất
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckUpdate}
                    className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Kiểm tra ngay
                  </button>
                </div>

                {/* Info */}
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <FaInfoCircle size={20} />
                    <h4 className="font-semibold">Thông tin</h4>
                  </div>
                  <div className={`text-sm space-y-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    <p>© 2025 N3T Team. All rights reserved.</p>
                    <p>Developed by: Nhóm 12 - NT106</p>
                    <p>Email: support@n3t.com</p>
                    <p className="mt-4 pt-4 border-t border-zinc-700">
                      Ứng dụng quản lý kho hàng hiện đại với giao diện thân thiện, 
                      hỗ trợ theo dõi tồn kho, nhập xuất và báo cáo chi tiết.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
