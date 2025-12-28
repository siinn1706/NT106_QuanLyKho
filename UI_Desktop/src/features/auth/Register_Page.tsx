import { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../state/auth_store';
import { apiRegister, apiVerifyOtp, apiResendOtp } from '../../app/api_client';
import Icon from '../../components/ui/Icon';

export default function Register_Page() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all hover:scale-[1.02] shadow-ios";

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

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; 
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);
    if (pastedData.length === 6) {
      otpInputRefs.current[5]?.focus();
    }
  };

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
      await apiRegister({ name, email, password });
      setShowOtpModal(true);
      setResendCountdown(60); 
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setOtpError('Vui lòng nhập đầy đủ 6 số OTP');
      return;
    }

    setVerifyingOtp(true);
    setOtpError('');

    try {
      const response = await apiVerifyOtp({ email, otp: otpCode });
      login(response.user, response.token || ""); 
      navigate('/dashboard');
    } catch (err: any) {
      setOtpError(err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    
    try {
      await apiResendOtp({ email });
      setResendCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
    } catch (err: any) {
      setOtpError(err.message || 'Không thể gửi lại OTP. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-white/5 rounded-2xl p-2 border border-white/10">
            <img src="/src/resources/logo.png" alt="N3T Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Đăng ký</h1>
          <p className="text-zinc-400">Tạo tài khoản mới để bắt đầu quản lý kho</p>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-xl rounded-[32px] border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className={inputClass}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className={inputClass}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Nhập mật khẩu"
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
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    <div className={`h-1 flex-1 rounded ${passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                    <div className={`h-1 flex-1 rounded ${passwordStrength === 'medium' || passwordStrength === 'strong' ? passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500' : 'bg-zinc-700'}`}></div>
                    <div className={`h-1 flex-1 rounded ${passwordStrength === 'strong' ? 'bg-green-500' : 'bg-zinc-700'}`}></div>
                  </div>
                  <p className={`text-xs ${passwordStrength === 'weak' ? 'text-red-400' : passwordStrength === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {passwordStrength === 'weak' && 'Mật khẩu yếu'}
                    {passwordStrength === 'medium' && 'Mật khẩu trung bình'}
                    {passwordStrength === 'strong' && 'Mật khẩu mạnh'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Xác nhận mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
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

            <label className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-1 rounded border-zinc-600 bg-zinc-800 text-primary focus:ring-offset-0 focus:ring-1 focus:ring-primary/50 cursor-pointer"
              />
              <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                Tôi đồng ý với <button type="button" className="text-[#007AFF] hover:underline">Điều khoản dịch vụ</button> và <button type="button" className="text-[#007AFF] hover:underline">Chính sách bảo mật</button>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#007AFF] hover:bg-[#0062cc] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-primary/25 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <p className="text-zinc-400 text-sm">
              Đã có tài khoản?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-[#007AFF] hover:text-[#4da3ff] font-semibold transition-colors"
              >
                Đăng nhập
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-8">
          © 2025 N3T - Quản lý Kho. All rights reserved.
        </p>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-white/10 rounded-[32px] p-8 shadow-2xl max-w-md w-full">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <Icon name="close" size="lg" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#007AFF]/20 rounded-2xl mb-4">
                <Icon name="envelope" size="xl" className="text-[#007AFF]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Xác thực OTP</h2>
              <p className="text-zinc-400 text-sm">
                Mã OTP đã được gửi đến email<br />
                <span className="text-[#007AFF] font-medium">{email}</span>
              </p>
            </div>

            {otpError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                {otpError}
              </div>
            )}

            <div className="flex gap-2 justify-center mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 transition-all shadow-lg"
                  disabled={verifyingOtp}
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={verifyingOtp}
              className="w-full bg-[#007AFF] hover:bg-[#0062cc] text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {verifyingOtp ? 'Đang xác thực...' : 'Xác nhận OTP'}
            </button>

            <div className="text-center text-sm">
              {resendCountdown > 0 ? (
                <p className="text-zinc-400">
                  Gửi lại mã sau <span className="text-[#007AFF] font-semibold">{resendCountdown}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  className="text-[#007AFF] hover:text-[#4da3ff] font-semibold transition-colors"
                >
                  Gửi lại mã OTP
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}