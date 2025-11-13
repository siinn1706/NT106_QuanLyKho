/** Register_Page.tsx - Màn hình đăng ký
 *  - UI: Name + Email + Password + Confirm Password
 *  - Validate form đầy đủ
 *  - Sau khi đăng ký thành công, tự động login
 */

import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../state/auth_store';
import { apiRegister } from '../../app/api_client';

export default function Register_Page() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  // Password strength checker
  const checkPasswordStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
    if (pwd.length < 6) return 'weak';
    if (pwd.length < 10) return 'medium';
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) return 'strong';
    return 'medium';
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
  };

  // Form validation
  const validateForm = (): string | null => {
    if (!name.trim()) return 'Vui lòng nhập họ tên';
    if (name.length < 2) return 'Họ tên quá ngắn';
    if (!email.trim()) return 'Vui lòng nhập email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ';
    if (!password) return 'Vui lòng nhập mật khẩu';
    if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
    if (password !== confirmPassword) return 'Mật khẩu xác nhận không khớp';
    return null;
  };

  // Handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    
    try {
      // Gọi API register
      const response = await apiRegister({ name, email, password });
      
      // Tự động login sau khi đăng ký thành công
      login(response.user);
      
      // Chuyển sang dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      {/* Register Card */}
      <div className="w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <span className="text-3xl font-bold text-white">N3T</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Đăng ký</h1>
          <p className="text-zinc-400">Tạo tài khoản mới để bắt đầu quản lý kho</p>
        </div>

        {/* Register Form */}
        <div className="bg-zinc-800/50 backdrop-blur-xl rounded-2xl border border-zinc-700/50 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Họ và tên
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {password && (
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
                Xác nhận mật khẩu
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Terms Agreement */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-1 rounded border-zinc-600 bg-zinc-900 text-primary focus:ring-primary focus:ring-offset-0"
              />
              <span className="text-sm text-zinc-400">
                Tôi đồng ý với{' '}
                <button type="button" className="text-primary hover:underline">
                  Điều khoản dịch vụ
                </button>
                {' '}và{' '}
                <button type="button" className="text-primary hover:underline">
                  Chính sách bảo mật
                </button>
              </span>
            </label>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang đăng ký...
                </span>
              ) : (
                'Đăng ký'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              Đã có tài khoản?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-primary hover:text-primary-dark font-semibold transition-colors"
              >
                Đăng nhập
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-500 text-xs mt-8">
          © 2025 N3T - Quản lý Kho. All rights reserved.
        </p>
      </div>
    </div>
  );
}

