/** Forgot_Password_Page.tsx - Màn hình quên mật khẩu với OTP flow
 *  - Bước 1: Request OTP bằng username/email
 *  - Bước 2: Nhập OTP + mật khẩu mới
 *  - Confirm và redirect về login
 */

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../app/auth_service';
import { useThemeStore } from '../../theme/themeStore';
import Icon from '../../components/ui/Icon';
import { showToast } from '../../utils/toast';

export default function Forgot_Password_Page() {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  
  // Form state
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  
  // UI state
  const [step, setStep] = useState<1 | 2>(1); // 1=Request OTP, 2=Confirm OTP+Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

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

  // Handle step 1: Request OTP
  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!usernameOrEmail.trim()) {
      setError('Vui lòng nhập username hoặc email');
      return;
    }
    
    setLoading(true);
    
    try {
      await authService.passwordResetRequestOTP(usernameOrEmail);
      showToast.success('Mã OTP đã được gửi đến email của bạn');
      setStep(2);
      setResendCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Không tìm thấy tài khoản. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Handle step 2: Confirm OTP + New Password
  const handleConfirmReset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 số OTP');
      return;
    }

    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setLoading(true);
    
    try {
      // Extract email from usernameOrEmail if it contains @
      const email = usernameOrEmail.includes('@') ? usernameOrEmail : '';
      if (!email) {
        throw new Error('Vui lòng sử dụng email để đặt lại mật khẩu');
      }
      
      await authService.passwordResetConfirm(email, otpCode, newPassword);
      showToast.success('Đặt lại mật khẩu thành công!');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    
    try {
      await authService.passwordResetRequestOTP(usernameOrEmail);
      showToast.success('Mã OTP mới đã được gửi');
      setResendCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại OTP. Vui lòng thử lại.');
    }
  };

  const inputClass = `w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#007AFF]/30 transition-all hover:scale-[1.02] shadow-ios ${
    isDarkMode 
      ? 'bg-white/5 border border-white/10 text-white placeholder-zinc-500'
      : 'bg-zinc-100 border border-zinc-300 text-zinc-900 placeholder-zinc-400'
  }`;

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
        {/* Back button */}
        <button
          onClick={() => step === 1 ? navigate('/login') : setStep(1)}
          className={`mb-6 flex items-center gap-2 transition-colors ${
            isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Icon name="arrow-left" size="md" />
          <span>{step === 1 ? 'Quay lại đăng nhập' : 'Quay lại'}</span>
        </button>

        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl p-2 border ${
            isDarkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <img src="/src/resources/logo.png" alt="N3T Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {step === 1 ? 'Quên mật khẩu?' : 'Đặt lại mật khẩu'}
          </h1>
          <p className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}>
            {step === 1 
              ? 'Nhập username hoặc email để nhận mã OTP' 
              : 'Nhập mã OTP và mật khẩu mới'}
          </p>
        </div>

        {/* Form */}
        <div className={`backdrop-blur-xl rounded-[32px] border p-8 shadow-2xl ${
          isDarkMode 
            ? 'bg-zinc-900/60 border-white/10' 
            : 'bg-white/80 border-zinc-200'
        }`}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
              <Icon name="warning" size="sm" />
              {error}
            </div>
          )}

          {step === 1 ? (
            // Step 1: Request OTP
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ml-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  Username hoặc Email
                </label>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="username hoặc email@example.com"
                  className={inputClass}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#007AFF] hover:bg-[#0062cc] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-primary/25 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang gửi...
                  </span>
                ) : (
                  'Gửi mã OTP'
                )}
              </button>
            </form>
          ) : (
            // Step 2: Confirm OTP + New Password
            <form onSubmit={handleConfirmReset} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ml-1 text-center ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  Mã OTP (đã gửi đến email)
                </label>
                <div className="flex gap-2 justify-center mb-2">
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
                      className={`w-12 h-14 text-center text-2xl font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 transition-all shadow-lg ${
                        isDarkMode 
                          ? 'bg-white/5 border border-white/10 text-white'
                          : 'bg-zinc-100 border border-zinc-300 text-zinc-900'
                      }`}
                      disabled={loading}
                    />
                  ))}
                </div>
                <div className="text-center text-sm mt-2">
                  {resendCountdown > 0 ? (
                    <p className="text-zinc-400">
                      Gửi lại mã sau <span className="text-[#007AFF] font-semibold">{resendCountdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-[#007AFF] hover:text-[#4da3ff] font-semibold transition-colors"
                    >
                      Gửi lại mã OTP
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ml-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className={`${inputClass} pr-12`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                      isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    <Icon name={showPassword ? 'eye-slash' : 'eye'} size="md" />
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ml-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`${inputClass} pr-12`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                      isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    <Icon name={showPassword ? 'eye-slash' : 'eye'} size="md" />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#007AFF] hover:bg-[#0062cc] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-primary/25 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang xử lý...
                  </span>
                ) : (
                  'Đặt lại mật khẩu'
                )}
              </button>
            </form>
          )}
        </div>

        <p className={`text-center text-xs mt-8 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
          © 2025 N3T - Quản lý Kho. All rights reserved.
        </p>
      </div>
    </div>
  );
}
