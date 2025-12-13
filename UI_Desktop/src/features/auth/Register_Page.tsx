/** Register_Page.tsx - Màn hình đăng ký
 *  - UI: Name + Email + Password + Confirm Password
 *  - Validate form đầy đủ
 *  - Sau khi đăng ký thành công, tự động login
 */

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../state/auth_store';
import { apiRegister, apiVerifyOtp, apiResendOtp } from '../../app/api_client';
import Icon from '../../components/ui/Icon';

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
  
  // OTP state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

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

  // OTP countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // OTP input handling
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');

    // Auto-focus next input
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
      // Gọi API register - BE sẽ gửi OTP qua email
      await apiRegister({ name, email, password });
      
      // Hiển thị modal OTP
      setShowOtpModal(true);
      setResendCountdown(60); // 60 giây countdown
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setOtpError('Vui lòng nhập đầy đủ 6 số OTP');
      return;
    }

    setVerifyingOtp(true);
    setOtpError('');

    try {
      // Gọi API verify OTP
      const response = await apiVerifyOtp({ email, otp: otpCode });
      
      // Xác thực thành công - lưu user và chuyển trang
      login(response.user);
      navigate('/dashboard');
    } catch (err: any) {
      setOtpError(err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    
    try {
      // Gọi API resend OTP
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
      {/* Register Card */}
      <div className="w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img src="/src/resources/logo.png" alt="N3T Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Đăng ký</h1>
          <p className="text-zinc-400">Tạo tài khoản mới để bắt đầu quản lý kho</p>
        </div>

        {/* Register Form */}
        <div className="liquid-glass-dark backdrop-blur-xl rounded-[32px] border border-white/10 p-8 shadow-ios-lg">
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
                className="w-full px-4 py-3 liquid-glass-ui-dark border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all hover:scale-[1.02] shadow-ios"
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
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-4 pr-12 py-3 liquid-glass-ui-dark border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all hover:scale-[1.02] shadow-ios [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                >
                  <Icon name={showPassword ? 'eye-slash' : 'eye'} size="md" />
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full pl-4 pr-12 py-3 liquid-glass-ui-dark border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all hover:scale-[1.02] shadow-ios [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                >
                  <Icon name={showPassword ? 'eye-slash' : 'eye'} size="md" />
                </button>
              </div>
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
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-ios-lg hover:scale-105 liquid-glass-hover disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="liquid-glass-dark backdrop-blur-xl rounded-[32px] border border-white/10 p-8 shadow-ios-lg max-w-md w-full animate-scaleIn">
            {/* Close Button */}
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <Icon name="close" size="lg" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-4">
                <Icon name="envelope" size="xl" className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Xác thực OTP</h2>
              <p className="text-zinc-400 text-sm">
                Mã OTP đã được gửi đến email<br />
                <span className="text-primary font-medium">{email}</span>
              </p>
            </div>

            {/* OTP Error */}
            {otpError && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm mb-4">
                {otpError}
              </div>
            )}

            {/* OTP Input */}
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
                  className="w-12 h-14 text-center text-2xl font-bold liquid-glass-ui-dark border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-ios"
                  disabled={verifyingOtp}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyOtp}
              disabled={verifyingOtp}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-ios-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {verifyingOtp ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang xác thực...
                </span>
              ) : (
                'Xác nhận OTP'
              )}
            </button>

            {/* Resend OTP */}
            <div className="text-center text-sm">
              {resendCountdown > 0 ? (
                <p className="text-zinc-400">
                  Gửi lại mã sau <span className="text-primary font-semibold">{resendCountdown}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  className="text-primary hover:text-primary-dark font-semibold transition-colors"
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

