/**
 * Button.tsx - Button component với variants
 * 
 * Design rules:
 * - KHÔNG shadow (border-based depth)
 * - Radius theo scale (--radius-md cho button)
 * - Transitions 150-200ms
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary: `
    bg-[var(--primary)] text-white border border-[var(--primary)]
    hover:bg-[var(--primary-hover)] hover:border-[var(--primary-hover)]
    active:bg-[var(--primary-active)] active:border-[var(--primary-active)]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  secondary: `
    bg-[var(--surface-1)] text-[var(--text-1)] border border-[var(--border)]
    hover:bg-[var(--surface-2)] hover:border-[var(--border-hover)]
    active:bg-[var(--surface-3)]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  ghost: `
    bg-transparent text-[var(--text-2)] border border-transparent
    hover:bg-[var(--surface-2)] hover:text-[var(--text-1)]
    active:bg-[var(--surface-3)]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  destructive: `
    bg-[var(--danger)] text-white border border-[var(--danger)]
    hover:bg-[#dc2626] hover:border-[#dc2626]
    active:bg-[#b91c1c] active:border-[#b91c1c]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
};

const sizeStyles: Record<string, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium
        rounded-[var(--radius-md)] transition-all duration-[180ms] ease-out
        focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:ring-offset-1
        active:scale-[0.98]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg 
          className="animate-spin h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <>
          {leftIcon && <span className="inline-flex">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

// Variant shortcuts
export const PrimaryButton = (props: Omit<ButtonProps, 'variant'>) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props: Omit<ButtonProps, 'variant'>) => <Button variant="secondary" {...props} />;
export const GhostButton = (props: Omit<ButtonProps, 'variant'>) => <Button variant="ghost" {...props} />;
export const DestructiveButton = (props: Omit<ButtonProps, 'variant'>) => <Button variant="destructive" {...props} />;
