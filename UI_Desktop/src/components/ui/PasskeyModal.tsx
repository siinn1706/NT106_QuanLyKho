import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

interface PasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (passkey: string) => void;
  title?: string;
  message?: string;
}

export default function PasskeyModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Xác thực Passkey",
  message = "Vui lòng nhập mã Passkey 6 chữ số để tiếp tục"
}: PasskeyModalProps) {
  const [passkey, setPasskey] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPasskey(['', '', '', '', '', '']);
      setError('');
      // Focus vào ô đầu tiên
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (index: number, value: string) => {
    // Chỉ nhận số
    if (value && !/^\d$/.test(value)) return;

    const newPasskey = [...passkey];
    newPasskey[index] = value;
    setPasskey(newPasskey);
    setError('');

    // Auto focus sang ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !passkey[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    
    if (!/^\d{6}$/.test(pasteData)) {
      setError('Passkey phải là 6 chữ số');
      return;
    }

    const digits = pasteData.split('');
    setPasskey(digits);
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = () => {
    const passkeyValue = passkey.join('');
    
    if (passkeyValue.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số');
      return;
    }

    onConfirm(passkeyValue);
  };

  const handleCancel = () => {
    setPasskey(['', '', '', '', '', '']);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[420px] rounded-[24px] overflow-hidden border bg-[var(--surface-1)] border-[var(--border)] text-[var(--text-1)] shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--primary-light)]">
              <Icon name="lock" size="lg" className="text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-sm text-[var(--text-2)]">{message}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex gap-3 justify-center mb-4">
            {passkey.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-[var(--surface-2)] border-[var(--border)] focus:border-[var(--primary)] outline-none transition-colors"
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)]/30 mb-4">
              <Icon name="alertTriangle" size="sm" className="text-[var(--danger)]" />
              <p className="text-sm text-[var(--danger)]">{error}</p>
            </div>
          )}

          <p className="text-xs text-center text-[var(--text-2)] mb-4">
            Nhập mã Passkey 6 chữ số của bạn để xác nhận thao tác này
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border bg-[var(--surface-2)] border-[var(--border)] hover:bg-[var(--surface-3)] transition-colors font-medium"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={passkey.some(d => !d)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
