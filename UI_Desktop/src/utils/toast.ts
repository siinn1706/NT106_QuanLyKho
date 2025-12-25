/** toast.ts - Toast notification utilities */

import toast from 'react-hot-toast';

export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: 'var(--success-light)',
      color: 'var(--success)',
      border: '1px solid var(--success)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
    },
    iconTheme: {
      primary: 'var(--success)',
      secondary: 'var(--success-light)',
    },
  });
};

export const showError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: 'var(--danger-light)',
      color: 'var(--danger)',
      border: '1px solid var(--danger)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
    },
    iconTheme: {
      primary: 'var(--danger)',
      secondary: 'var(--danger-light)',
    },
  });
};

export const showWarning = (message: string) => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: '⚠️',
    style: {
      background: 'var(--warning-light)',
      color: 'var(--warning)',
      border: '1px solid var(--warning)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
};

export const showInfo = (message: string) => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: 'ℹ️',
    style: {
      background: 'var(--primary-light)',
      color: 'var(--primary)',
      border: '1px solid var(--primary)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
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