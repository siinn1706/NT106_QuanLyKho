/** toast.ts - Toast notification utilities with Liquid Glass design */

import toast from 'react-hot-toast';

// Liquid Glass toast style base
const liquidGlassBase = {
  backdropFilter: 'blur(16px) saturate(180%)',
  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  borderRadius: '16px',
  padding: '14px 18px',
  fontSize: '14px',
  fontWeight: '500',
  boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.1), 0 8px 24px -4px rgba(0, 0, 0, 0.08)',
};

export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      ...liquidGlassBase,
      background: 'rgba(34, 197, 94, 0.15)',
      color: '#16a34a',
      border: '1px solid rgba(34, 197, 94, 0.3)',
    },
    iconTheme: {
      primary: '#16a34a',
      secondary: 'rgba(34, 197, 94, 0.15)',
    },
  });
};

export const showError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      ...liquidGlassBase,
      background: 'rgba(239, 68, 68, 0.15)',
      color: '#dc2626',
      border: '1px solid rgba(239, 68, 68, 0.3)',
    },
    iconTheme: {
      primary: '#dc2626',
      secondary: 'rgba(239, 68, 68, 0.15)',
    },
  });
};

export const showWarning = (message: string) => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: '⚠️',
    style: {
      ...liquidGlassBase,
      background: 'rgba(245, 158, 11, 0.15)',
      color: '#d97706',
      border: '1px solid rgba(245, 158, 11, 0.3)',
    },
  });
};

export const showInfo = (message: string) => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: 'ℹ️',
    style: {
      ...liquidGlassBase,
      background: 'rgba(59, 130, 246, 0.15)',
      color: '#2563eb',
      border: '1px solid rgba(59, 130, 246, 0.3)',
    },
  });
};

// Export as an object for convenience
export const showToast = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
};