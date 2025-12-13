/** Change_Password_Page.tsx - Màn hình đổi mật khẩu
 *  - UI: Email + Old Password + New Password + Confirm Password
 *  - Gọi API /auth/change-password
 *  - Hiển thị thông báo thành công/lỗi
 */

import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../state/auth_store';
import Icon from '../../components/ui/Icon';
import { apiLogout } from '../../app/api_client';

export default function Change_Password_Page() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  // Form state
  const [email, setEmail] = useState(user?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  // Password strength checker
  const checkPasswordStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
    if (pwd.length < 6) return 'weak';
    if (pwd.length < 10) return 'medium';
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) return 'strong';
    return 'medium';
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
  };

  // Form validation
  const validateForm = (): string | null => {
    if (!email.trim()) return 'Vui lòng nhập email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ';
    if (!oldPassword) return 'Vui lòng nhập mật khẩu cũ';
    if (!newPassword) return 'Vui lòng nhập mật khẩu mới';
    if (newPassword.length < 6) return 'Mật khẩu mới phải có ít nhất 6 ký tự';
    if (newPassword === oldPassword) return 'Mật khẩu mới phải khác mật khẩu cũ';
    if (newPassword !== confirmPassword) return 'Mật khẩu xác nhận không khớp';
    return null;
  };

  // Handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Có lỗi xảy ra');
      }

      setSuccess(true);
      
      // Đợi 2 giây để hiển thị thông báo thành công
      setTimeout(async () => {
        try {
          // Logout user
          await apiLogout();
        } catch {}
        
        // Clear user state
        logout();
        
        // Redirect to login
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <Icon name="arrow-left" size="md" />
          <span>Quay lại</span>
        </button>

        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-[24px] mb-4">
            <Icon name="key" size="xl" className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Đổi mật khẩu</h1>
          <p className="text-zinc-400">Cập nhật mật khẩu mới cho tài khoản của bạn</p>
        </div>

        {/* Change Password Form */}
        <div className="liquid-glass-dark backdrop-blur-xl rounded-[32px] border border-white/10 p-8 shadow-ios-lg">
          {success ? (
            // Success message
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full">
                <Icon name="check-circle" size="2x" className="text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Đổi mật khẩu thành công!
                </h3>
                <p className="text-zinc-400">
                  Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại...
                </p>
              </div>
            </div>
          ) : (
            // Form
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 liquid-glass-ui-dark border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all hover:scale-[1.02] shadow-ios"
                  disabled={loading}
                  readOnly={!!user?.email}
                />
              </div>

              {/* Old Password Field */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Mật khẩu cũ
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu cũ"
                    className="w-full pl-4 pr-12 py-3 liquid-glass-ui-dark border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all hover:scale-[1.02] shadow-ios [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                  >
                    <Icon name={showOldPassword ? 'eye-slash' : 'eye'} size="md" />
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full pl-4 pr-12 py-3 liquid-glass-ui-dark border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all hover:scale-[1.02] shadow-ios [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                  >
                    <Icon name={showNewPassword ? 'eye-slash' : 'eye'} size="md" />
                  </button>
                </div>
                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      <div className={`h-1 flex-1 rounded ${passwordStrength === 'weak' ? 'bg-danger' : passwordStrength === 'medium' ? 'bg-warning' : 'bg-success'}`}></div>
                      <div className={`h-1 flex-1 rounded ${passwordStrength === 'medium' || passwordStrength === 'strong' ? passwordStrength === 'medium' ? 'bg-warning' : 'bg-success' : 'bg-zinc-700'}`}></div>
                      <div className={`h-1 flex-1 rounded ${passwordStrength === 'strong' ? 'bg-success' : 'bg-zinc-700'}`}></div>
                    </div>
                    <p className={`text-xs ${passwordStrength === 'weak' ? 'text-danger' : passwordStrength === 'medium' ? 'text-warning' : 'text-success'}`}>
                      {passwordStrength === 'weak' && 'Mật khẩu yếu'}
                      {passwordStrength === 'medium' && 'Mật khẩu trung bình'}
                      {passwordStrength === 'strong' && 'Mật khẩu mạnh'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-4 pr-12 py-3 liquid-glass-ui-dark border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all hover:scale-[1.02] shadow-ios [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                  >
                    <Icon name={showConfirmPassword ? 'eye-slash' : 'eye'} size="md" />
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-ios"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang xử lý...
                  </span>
                ) : (
                  'Đổi mật khẩu'
                )}
              </button>

              {/* Info text */}
              <p className="text-xs text-zinc-500 text-center">
                Mật khẩu mới phải có ít nhất 6 ký tự và khác mật khẩu cũ
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-500 text-sm mt-6">
          © 2025 N3T - Quản lý Kho. All rights reserved.
        </p>
      </div>
    </div>
  );
}
