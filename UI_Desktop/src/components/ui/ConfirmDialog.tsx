// src/components/ui/ConfirmDialog.tsx
/**
 * Apple-style confirmation dialog with Liquid-Glass aesthetic
 * Border-based depth, no shadows, subtle animations
 */

import { useEffect } from 'react';
import Icon from './Icon';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  variant = 'primary',
  onConfirm,
  onCancel,
  isDarkMode = false
}: ConfirmDialogProps) {
  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantColors = {
    danger: {
      bg: 'var(--danger)',
      hoverBg: 'var(--danger)',
      text: 'var(--text-inverse)'
    },
    primary: {
      bg: 'var(--primary)',
      hoverBg: 'var(--primary-hover)',
      text: 'var(--text-inverse)'
    },
    warning: {
      bg: 'var(--warning)',
      hoverBg: 'var(--warning)',
      text: 'var(--text-inverse)'
    }
  };

  const colors = variantColors[variant];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Backdrop - subtle blur, no heavy gradient */}
      <div 
        className={`absolute inset-0 transition-opacity duration-200 ${
          isDarkMode 
            ? 'bg-black/40' 
            : 'bg-black/20'
        }`}
        style={{ backdropFilter: 'blur(8px)' }}
      />

      {/* Dialog - Liquid Glass with border-based depth */}
      <div 
        className={`relative w-full max-w-md rounded-[var(--radius-2xl)] border backdrop-blur-xl transition-all duration-200 ${
          isDarkMode
            ? 'border-white/20 bg-zinc-900/90'
            : 'border-white/40 bg-white/85'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: isDarkMode
            ? '0 4px 24px -4px rgba(0, 0, 0, 0.5)'
            : '0 4px 24px -4px rgba(0, 0, 0, 0.12)'
        }}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-3">
            <div 
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${
                isDarkMode
                  ? 'border-white/20 bg-white/10'
                  : 'border-black/10 bg-black/5'
              }`}
            >
              <Icon 
                name={variant === 'danger' ? 'warning' : 'info-circle'} 
                size="md"
                className={
                  variant === 'danger' 
                    ? 'text-[var(--danger)]' 
                    : 'text-[var(--primary)]'
                }
              />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-1 ${
                isDarkMode ? 'text-zinc-50' : 'text-zinc-900'
              }`}>
                {title}
              </h3>
              <p className={`text-sm leading-relaxed ${
                isDarkMode ? 'text-zinc-300' : 'text-zinc-600'
              }`}>
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={`flex gap-3 p-6 pt-4 border-t ${
          isDarkMode ? 'border-white/10' : 'border-black/8'
        }`}>
          {/* Cancel - Secondary button with border-based depth */}
          <button
            onClick={onCancel}
            className={`flex-1 px-4 py-2.5 rounded-[var(--radius-xl)] border font-medium text-sm transition-all duration-150 ${
              isDarkMode
                ? 'border-white/20 bg-white/10 text-zinc-200 hover:bg-white/15 active:bg-white/8'
                : 'border-black/10 bg-black/5 text-zinc-700 hover:bg-black/8 active:bg-black/4'
            }`}
          >
            {cancelLabel}
          </button>

          {/* Confirm - Primary with variant color */}
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-[var(--radius-xl)] font-semibold text-sm transition-all duration-150"
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.05)',
              opacity: 0.95
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.95';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
