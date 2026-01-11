import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiForgotPassword } from '../../app/api_client';
import { useThemeStore } from '../../theme/themeStore';
import Icon from '../../components/ui/Icon';

export default function ForgotPassword_Page() {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await apiForgotPassword(email);
      setMessage({ 
        type: 'success', 
        text: 'Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư.' 
      });
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.message || 'Có lỗi xảy ra. Vui lòng thử lại.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 relative">
      {/* Theme toggle */}
      <button
        onClick={toggleDarkMode}
        className={`absolute top-6 right-6 p-3 rounded-[var(--radius-xl)] border backdrop-blur-md transition-all duration-150 ${
          isDarkMode
            ? 'border-white/20 bg-white/10 hover:bg-white/15'
            : 'border-black/10 bg-white/80 hover:bg-white/90'
        }`}
        title={isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}
      >
        <Icon name={isDarkMode ? 'sun' : 'moon'} size="md" />
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl p-2 border ${
            isDarkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <img src="/logo.png" alt="N3T Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Quên mật khẩu</h1>
          <p className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}>Nhập email để nhận liên kết đặt lại mật khẩu</p>
        </div>

        <div className={`backdrop-blur-xl rounded-[32px] border p-8 shadow-2xl ${
          isDarkMode 
            ? 'bg-zinc-900/60 border-white/10' 
            : 'bg-white/80 border-zinc-200'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {message.text && (
              <div className={`px-4 py-3 rounded-lg text-sm ${
                message.type === 'error' 
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                  : 'bg-green-500/10 border border-green-500/20 text-green-400'
              }`}>
                {message.text}
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all ${
                  isDarkMode 
                    ? 'bg-white/5 border border-white/10 text-white placeholder-zinc-500'
                    : 'bg-zinc-100 border border-zinc-300 text-zinc-900 placeholder-zinc-400'
                }`}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#007AFF] hover:bg-[#0062cc] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-primary/25 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className={`text-sm transition-colors ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              ← Quay lại đăng nhập
            </button>
          </div>
        </div>

        <p className={`text-center text-xs mt-8 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
          © 2025 N3T - Quản lý Kho. All rights reserved.
        </p>
      </div>
    </div>
  );
}