/**
 * Modal.tsx - Modal / Dialog component
 * 
 * Design rules:
 * - Background overlay với opacity
 * - KHÔNG blur background quá (chỉ blur nhẹ nếu cần)
 * - KHÔNG shadow quá đậm
 * - Radius cha (--radius-2xl)
 */

import React, { useEffect, useRef } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const sizeStyles: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = 'md',
  closeOnOverlay = true,
  showCloseButton = true,
  className = '',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);
  
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-8 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay - che kín hoàn toàn background */}
      <div 
        className="fixed inset-0 bg-black/70 transition-opacity duration-200"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative z-10 w-full ${sizeStyles[size]} my-4
          bg-[var(--surface-1)] border border-[var(--border)]
          rounded-[var(--radius-2xl)]
          transform transition-all duration-200 ease-out
          animate-in fade-in zoom-in-95
          ${className}
        `.trim().replace(/\s+/g, ' ')}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-6 pb-0">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 
                  id="modal-title"
                  className="text-lg font-semibold text-[var(--text-1)]"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-[var(--text-3)]">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="
                  flex-shrink-0 ml-4 p-1.5 rounded-[var(--radius-md)]
                  text-[var(--text-3)] hover:text-[var(--text-1)]
                  hover:bg-[var(--surface-2)] transition-colors duration-150
                "
                aria-label="Đóng"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}

// ==================== MODAL FOOTER ====================
export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div 
      className={`
        flex items-center justify-end gap-3 
        pt-4 border-t border-[var(--border)]
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
}

// ==================== CONFIRM DIALOG ====================
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: 'bg-[var(--danger)] hover:bg-red-600 focus:ring-[var(--danger)]',
    warning: 'bg-[var(--warning)] hover:bg-amber-600 focus:ring-[var(--warning)]',
    info: 'bg-[var(--primary)] hover:bg-cyan-600 focus:ring-[var(--primary)]',
  };
  
  const iconStyles = {
    danger: 'bg-red-50 text-[var(--danger)] dark:bg-red-950',
    warning: 'bg-amber-50 text-[var(--warning)] dark:bg-amber-950',
    info: 'bg-blue-50 text-[var(--primary)] dark:bg-blue-950',
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 flex items-center justify-center rounded-full mb-4 ${iconStyles[variant]}`}>
          {variant === 'danger' && (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {variant === 'warning' && (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {variant === 'info' && (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-1)]">{title}</h3>
        <p className="mt-2 text-sm text-[var(--text-3)]">{message}</p>
      </div>
      
      <div className="flex items-center gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="
            flex-1 h-10 px-4 text-sm font-medium
            bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)]
            rounded-[var(--radius-md)] transition-colors duration-150
            hover:bg-[var(--surface-3)]
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`
            flex-1 h-10 px-4 text-sm font-medium text-white
            rounded-[var(--radius-md)] transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${variantStyles[variant]}
          `.trim().replace(/\s+/g, ' ')}
        >
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : confirmText}
        </button>
      </div>
    </Modal>
  );
}
