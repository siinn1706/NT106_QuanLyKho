import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../state/auth_store';
// import { apiLogin } from '../../app/api_client';//call trực tiếp ko thông qua api nữa
import { signInWithEmailAndPassword } from 'firebase/auth'; 
import { auth } from '../../firebase';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Login_Page() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form validation
  const validateForm = (): string | null => {
    if (!email.trim()) return 'Vui lòng nhập email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ';
    if (!password) return 'Vui lòng nhập mật khẩu';
    if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
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
      // --- CODE KẾT NỐI FIREBASE ---
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Lưu vào Store
      login({
        id: user.uid,
        email: user.email || '',
        name: user.displayName || 'User', // Lấy tên từ Firebase
        role: 'user'
      });
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('Email hoặc mật khẩu không chính xác.');
      } else {
        setError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      {/* Login Card */}
      <div className="w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img src="/src/resources/logo.png" alt="N3T Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Đăng nhập</h1>
          <p className="text-zinc-400">Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục</p>
        </div>

        {/* Login Form */}
        <div className="liquid-glass-dark backdrop-blur-xl rounded-[32px] border border-white/10 p-8 shadow-ios-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-3 liquid-glass-ui-dark border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all hover:scale-[1.02] shadow-ios"
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-4 pr-12 py-3 liquid-glass-ui-dark border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all hover:scale-[1.02] shadow-ios"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-ios-lg hover:scale-105 liquid-glass-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              Chưa có tài khoản?{' '}
              <button onClick={() => navigate('/register')} className="text-primary hover:text-primary-dark font-semibold transition-colors">
                Đăng ký ngay
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