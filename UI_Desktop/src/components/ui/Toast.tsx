/** Toast.tsx - Toast notification component */

import { useEffect, useState } from 'react';
import Icon from './Icon';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const duration = toast.duration ?? 3000;
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const icons: Record<ToastType, string> = {
    success: 'check-circle',
    error: 'exclamation-circle',
    warning: 'exclamation-triangle',
    info: 'info-circle',
  };

  const colors: Record<ToastType, string> = {
    success: 'bg-[var(--success-light)] border-[var(--success)] text-[var(--success)]',
    error: 'bg-[var(--danger-light)] border-[var(--danger)] text-[var(--danger)]',
    warning: 'bg-[var(--warning-light)] border-[var(--warning)] text-[var(--warning)]',
    info: 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]',
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] border-2 shadow-lg min-w-[300px] max-w-[500px] animate-spring ${colors[toast.type]}`}
      role="alert"
    >
      <Icon name={icons[toast.type]} size="md" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="p-1 hover:opacity-70 transition-opacity"
        aria-label="Đóng"
      >
        <Icon name="close" size="sm" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Listen for toast events
    const handleToast = (event: CustomEvent<Omit<Toast, 'id'>>) => {
      const newToast: Toast = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...event.detail,
      };
      setToasts((prev) => [...prev, newToast]);
    };

    window.addEventListener('show-toast' as any, handleToast as EventListener);
    return () => {
      window.removeEventListener('show-toast' as any, handleToast as EventListener);
    };
  }, []);

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={handleClose} />
      ))}
    </div>
  );
}

// Helper function to show toast
export function showToast(message: string, type: ToastType = 'info', duration?: number) {
  const event = new CustomEvent('show-toast', {
    detail: { message, type, duration },
  });
  window.dispatchEvent(event);
}

