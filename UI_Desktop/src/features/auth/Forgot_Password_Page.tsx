/** Forgot_Password_Page.tsx - Màn hình quên mật khẩu
 *  - UI: Email input + Send reset link button
 *  - Gọi API /auth/forgot-password
 *  - Hiển thị thông báo thành công/lỗi
 */

import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon';

export default function Forgot_Password_Page() {
  const navigate = useNavigate();
  
  // Form state
  const [email, setEmail] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form validation
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Email không hợp lệ');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Có lỗi xảy ra');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gửi email thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate('/login')}
          className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <Icon name="arrow-left" size="md" />
          <span>Quay lại đăng nhập</span>
        </button>

        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img src="/src/resources/logo.png" alt="N3T Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Quên mật khẩu?</h1>
          <p className="text-zinc-400">Nhập email của bạn để nhận link đặt lại mật khẩu</p>
        </div>

        {/* Forgot Password Form */}
        <div className="liquid-glass-dark backdrop-blur-xl rounded-[32px] border border-white/10 p-8 shadow-ios-lg">
          {success ? (
            // Success message
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full">
                <Icon name="check-circle" size="2x" className="text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Email đã được gửi!
                </h3>
                <p className="text-zinc-400">
                  Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn để đặt lại mật khẩu.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-ios"
              >
                Quay lại đăng nhập
              </button>
            </div>
          ) : (
            // Form
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-12 pr-4 py-3 liquid-glass-ui-dark border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all hover:scale-[1.02] shadow-ios"
                    disabled={loading}
                    autoFocus
                  />
                  <Icon name="envelope" size="md" className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-ios"
              >
                {loading ? 'Đang gửi...' : 'Gửi email đặt lại mật khẩu'}
              </button>

              {/* Info text */}
              <p className="text-xs text-zinc-500 text-center">
                Bạn sẽ nhận được email chứa link để đặt lại mật khẩu trong vài phút.
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
