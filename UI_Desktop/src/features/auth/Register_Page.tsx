/** Register_Page.tsx - Màn hình Đăng ký
 * - UI: Name + Email + Password + Confirm Password
 * - Validate form (check pass match)
 * - Gọi API Register -> Auto Login -> Redirect
 */

import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../state/auth_store';
import { apiRegister, apiLogin } from '../../app/api_client'; // Import thêm apiLogin để auto login
import Icon from '../../components/ui/Icon';
import { showToast } from '../../utils/toast';

export default function Register_Page() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Styles (Fix lỗi màu nền input)
  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all hover:scale-[1.02] shadow-ios";

  // Validate form
  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Vui lòng nhập họ tên';
    if (!formData.email.trim()) return 'Vui lòng nhập email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Email không hợp lệ';
    if (!formData.password) return 'Vui lòng nhập mật khẩu';
    if (formData.password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
    if (formData.password !== formData.confirmPassword) return 'Mật khẩu xác nhận không khớp';
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
      // 1. Gọi API đăng ký
      await apiRegister({
        email: formData.email,
        password: formData.password,
        name: formData.name
      });

      showToast.success('Đăng ký tài khoản thành công!');

      // 2. Tự động đăng nhập luôn để tiện cho user
      try {
        const loginRes = await apiLogin({
          email: formData.email,
          password: formData.password
        });
        login(loginRes.user, loginRes.token || "");
        navigate('/dashboard');
      } catch {
        // Nếu auto login lỗi thì chuyển về trang login bắt đăng nhập tay
        navigate('/login');
      }

    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-white/5 rounded-2xl p-2 border border-white/10">
            <img src="/src/resources/logo.png" alt="N3T Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Đăng ký</h1>
          <p className="text-zinc-400">Tạo tài khoản quản lý kho mới</p>
        </div>

        {/* Form */}
        <div className="bg-zinc-900/60 backdrop-blur-xl rounded-[32px] border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <Icon name="warning" size="sm" />
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Họ và tên</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nguyễn Văn A"
                className={inputClass}
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="user@example.com"
                className={inputClass}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Tối thiểu 6 ký tự"
                  className={`${inputClass} pr-12`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  <Icon name={showPassword ? 'eye-slash' : 'eye'} size="md" />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">Xác nhận mật khẩu</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="Nhập lại mật khẩu"
                className={inputClass}
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#007AFF] hover:bg-[#0062cc] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-primary/25 hover:scale-[1.02] disabled:opacity-50 mt-2"
            >
              {loading ? 'Đang xử lý...' : 'Đăng ký tài khoản'}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <p className="text-zinc-400 text-sm">
              Đã có tài khoản?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-[#007AFF] hover:text-[#4da3ff] font-semibold transition-colors ml-1"
              >
                Đăng nhập
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}