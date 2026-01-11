/** Change_Passkey_Page.tsx - Đổi passkey với OTP verification
 *  - Bước 1: Request OTP (authenticated user)
 *  - Bước 2: Nhập OTP + passkey mới
 *  - Confirm và hiển thị thành công
 */

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../app/auth_service';
import Icon from '../../components/ui/Icon';
import { showToast } from '../../utils/toast';

export default function Change_Passkey_Page() {
  const navigate = useNavigate();
  
  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPasskey, setNewPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  
  // UI state
  const [step, setStep] = useState<1 | 2>(1); // 1=Request OTP, 2=Confirm OTP+Passkey
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showPasskey, setShowPasskey] = useState(false);

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
    
    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    
    setLoading(true);
    
    try {
      await authService.passkeyRequestOTP(currentPassword);
      showToast.success('Mã OTP đã được gửi đến email của bạn');
      setStep(2);
      setResendCountdown(60);
    } catch (err: any) {
      if (err.message.includes('401') || err.message.includes('Authentication')) {
        setError('Mật khẩu không đúng hoặc phiên đăng nhập hết hạn.');
      } else {
        setError(err.message || 'Không thể gửi OTP. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle step 2: Confirm OTP + New Passkey
  const handleConfirmChange = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 số OTP');
      return;
    }

    if (!newPasskey) {
      setError('Vui lòng nhập passkey mới');
      return;
    }

    if (newPasskey.length < 6) {
      setError('Passkey phải có ít nhất 6 ký tự');
      return;
    }

    if (newPasskey !== confirmPasskey) {
      setError('Passkey xác nhận không khớp');
      return;
    }
    
    setLoading(true);
    
    try {
      await authService.passkeyConfirm(otpCode, newPasskey);
      showToast.success('Đổi passkey thành công!');
      navigate('/dashboard'); // or navigate to settings
    } catch (err: any) {
      if (err.message.includes('401') || err.message.includes('Authentication')) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(err.message || 'Đổi passkey thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    
    try {
      await authService.passkeyRequestOTP(currentPassword);
      showToast.success('Mã OTP mới đã được gửi');
      setResendCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại OTP. Vui lòng thử lại.');
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#007AFF]/30 transition-all hover:scale-[1.02] shadow-ios";

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => step === 1 ? navigate(-1) : setStep(1)}
          className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <Icon name="arrow-left" size="md" />
          <span>{step === 1 ? 'Quay lại' : 'Yêu cầu OTP mới'}</span>
        </button>

        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-white/5 rounded-2xl p-2 border border-white/10">
            <img src="/logo.png" alt="N3T Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {step === 1 ? 'Đổi Passkey' : 'Xác thực OTP'}
          </h1>
          <p className="text-zinc-400">
            {step === 1 
              ? 'Passkey được dùng cho các thao tác nhạy cảm' 
              : 'Nhập mã OTP và passkey mới'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-zinc-900/60 backdrop-blur-xl rounded-[32px] border border-white/10 p-8 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
              <Icon name="warning" size="sm" />
              {error}
            </div>
          )}

          {step === 1 ? (
            // Step 1: Request OTP (with password verification)
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div className="bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Icon name="info-circle" size="lg" className="text-[#007AFF] mt-0.5" />
                  <div className="text-sm text-zinc-300">
                    <p className="font-semibold text-white mb-1">Lưu ý quan trọng</p>
                    <ul className="list-disc list-inside space-y-1 text-zinc-400">
                      <li>Passkey khác với mật khẩu đăng nhập</li>
                      <li>Dùng cho xác thực các thao tác quan trọng</li>
                      <li>Cần OTP email để thay đổi</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 ml-1">
                  Mật khẩu hiện tại *
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu để xác thực"
                  className={inputClass}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || !currentPassword}
                className="w-full bg-[#007AFF] hover:bg-[#0062cc] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-primary/25 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang gửi OTP...
                  </span>
                ) : (
                  'Gửi mã OTP đến email'
                )}
              </button>
            </form>
          ) : (
            // Step 2: Confirm OTP + New Passkey
            <form onSubmit={handleConfirmChange} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 ml-1 text-center">
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
                      className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 transition-all shadow-lg"
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
                <label className="block text-sm font-medium text-zinc-300 mb-2 ml-1">
                  Passkey mới
                </label>
                <div className="relative">
                  <input
                    type={showPasskey ? 'text' : 'password'}
                    value={newPasskey}
                    onChange={(e) => setNewPasskey(e.target.value)}
                    placeholder="Nhập passkey mới"
                    className={`${inputClass} pr-12`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasskey(!showPasskey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  >
                    <Icon name={showPasskey ? 'eye-slash' : 'eye'} size="md" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 ml-1">
                  Xác nhận passkey
                </label>
                <div className="relative">
                  <input
                    type={showPasskey ? 'text' : 'password'}
                    value={confirmPasskey}
                    onChange={(e) => setConfirmPasskey(e.target.value)}
                    placeholder="Nhập lại passkey mới"
                    className={`${inputClass} pr-12`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasskey(!showPasskey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  >
                    <Icon name={showPasskey ? 'eye-slash' : 'eye'} size="md" />
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
                  'Xác nhận đổi passkey'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-zinc-500 text-xs mt-8">
          © 2025 N3T - Quản lý Kho. All rights reserved.
        </p>
      </div>
    </div>
  );
}
