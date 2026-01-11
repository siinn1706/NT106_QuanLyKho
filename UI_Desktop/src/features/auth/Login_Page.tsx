import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../state/auth_store';
import { useThemeStore } from '../../theme/themeStore';
import { authService } from '../../app/auth_service';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { showToast } from '../../utils/toast';

export default function Login_Page() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = (): string | null => {
    if (!usernameOrEmail.trim()) return 'Vui lòng nhập username hoặc email';
    if (!password) return 'Vui lòng nhập mật khẩu';
    if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
    return null;
  };

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
      const response = await authService.login(usernameOrEmail, password);
      login(response.user, response.access_token, rememberMe);
      
      showToast.success(`Chào mừng trở lại, ${response.user.display_name || response.user.username}!`);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 relative">
      {/* Theme toggle - top right */}
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
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 liquid-glass rounded-2xl p-2 border border-[var(--glass-btn-border)]">
            <img src="/logo.png" alt="N3T Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-1)] mb-2">Đăng nhập</h1>
          <p className="text-[var(--text-2)]">Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục</p>
        </div>

        <div className="liquid-glass-card rounded-[var(--radius-2xl)] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-[var(--danger-light)] border border-[var(--danger-border)] text-[var(--danger)] px-4 py-3 rounded-[var(--radius-lg)] text-sm flex items-center gap-2">
                <Icon name="warning" size="sm" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-2)] mb-2 ml-1">
                Username hoặc Email
              </label>
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="username hoặc email@example.com"
                className="w-full px-4 py-3 liquid-glass-input rounded-[var(--radius-xl)] text-[var(--text-1)] placeholder-[var(--text-3)]"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-2)] mb-2 ml-1">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full px-4 py-3 pr-12 liquid-glass-input rounded-[var(--radius-xl)] text-[var(--text-1)] placeholder-[var(--text-3)]"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
                >
                  <Icon name={showPassword ? 'eye-slash' : 'eye'} size="md" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border)] bg-[var(--glass-input-bg)] text-[var(--primary)] focus:ring-offset-0 focus:ring-1 focus:ring-[var(--primary)]/50 cursor-pointer"
                />
                <span className="text-sm text-[var(--text-2)] group-hover:text-[var(--text-1)] transition-colors">Ghi nhớ đăng nhập</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors font-medium"
              >
                Quên mật khẩu?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full"
            >
              Đăng nhập
            </Button>
          </form>

          <div className="mt-8 text-center border-t border-[var(--border)] pt-6">
            <p className="text-[var(--text-2)] text-sm">
              Chưa có tài khoản?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold transition-colors ml-1"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-[var(--text-3)] text-xs mt-8">
          © 2025 N3T - Quản lý Kho. All rights reserved.
        </p>
      </div>
    </div>
  );
}
