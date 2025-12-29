/**
 * Button.tsx - Button component với variants
 * 
 * Design rules:
 * - Liquid Glass design - subtle translucency and depth
 * - Radius theo scale (--radius-md cho button)
 * - Transitions 150-200ms with micro-interactions
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
    liquid-glass-btn text-white
    hover:translate-y-[-1px]
    active:translate-y-0 active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
  `,
  secondary: `
    liquid-glass-btn-secondary text-[var(--text-1)]
    hover:translate-y-[-1px]
    active:translate-y-0 active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
  `,
  ghost: `
    bg-transparent text-[var(--text-2)] border border-transparent
    hover:bg-[var(--surface-2)]/60 hover:text-[var(--text-1)] hover:backdrop-blur-sm
    active:bg-[var(--surface-3)]/60 active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  destructive: `
    bg-[var(--danger)] text-white border border-[var(--danger)]/80
    shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]
    hover:bg-[#dc2626] hover:translate-y-[-1px] hover:shadow-[0_4px_12px_rgba(220,38,38,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]
    active:translate-y-0 active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
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
