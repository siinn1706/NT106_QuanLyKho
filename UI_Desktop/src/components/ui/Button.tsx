import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizeStyles: Record<string, string> = {
  sm: 'h-8 px-3.5 text-[13px] gap-1.5 rounded-[var(--radius-lg)]',
  md: 'h-10 px-5 text-sm gap-2 rounded-[var(--radius-xl)]',
  lg: 'h-12 px-6 text-[15px] gap-2.5 rounded-[var(--radius-2xl)]',
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
  const isDisabled = disabled || isLoading;

  const baseStyles = `
    relative inline-flex items-center justify-center font-medium
    transition-all duration-[180ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2
    disabled:cursor-not-allowed
    select-none
  `;

  const variantStyles: Record<string, string> = {
    primary: `
      text-white
      bg-[var(--glass-primary-bg)]
      backdrop-blur-[12px]
      border border-[var(--glass-primary-border)]
      [box-shadow:var(--glass-btn-shadow),inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_-1px_1px_rgba(0,0,0,0.08)]
      
      before:absolute before:inset-0 before:rounded-[inherit] before:pointer-events-none
      before:bg-[var(--glass-primary-radial)]
      
      after:absolute after:inset-0 after:rounded-[inherit] after:p-[1px] after:pointer-events-none
      after:bg-[linear-gradient(180deg,var(--glass-primary-rim)_0%,transparent_40%)]
      after:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]
      after:[mask-composite:exclude] after:[-webkit-mask-composite:xor]
      
      hover:translate-y-[-1px]
      hover:[box-shadow:var(--glass-btn-shadow-hover),inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(0,0,0,0.1)]
      hover:border-[rgba(255,255,255,0.35)]
      
      active:translate-y-0 active:scale-[0.98]
      active:[box-shadow:inset_0_2px_4px_rgba(0,0,0,0.15)]
      
      disabled:opacity-50 disabled:translate-y-0 disabled:scale-100
      disabled:[box-shadow:none] disabled:border-[rgba(255,255,255,0.15)]
    `,
    secondary: `
      text-[var(--text-1)]
      bg-[var(--glass-btn-bg)]
      backdrop-blur-[var(--glass-blur)]
      border border-[var(--glass-btn-border)]
      [box-shadow:var(--glass-btn-shadow),var(--glass-btn-inset)]
      
      before:absolute before:inset-0 before:rounded-[inherit] before:pointer-events-none
      before:bg-[var(--glass-btn-radial)]
      
      after:absolute after:inset-0 after:rounded-[inherit] after:p-[1px] after:pointer-events-none
      after:bg-[linear-gradient(180deg,var(--glass-btn-rim)_0%,transparent_50%)]
      after:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]
      after:[mask-composite:exclude] after:[-webkit-mask-composite:xor]
      
      hover:bg-[var(--glass-btn-bg-hover)]
      hover:translate-y-[-1px]
      hover:[box-shadow:var(--glass-btn-shadow-hover),var(--glass-btn-inset)]
      
      active:bg-[var(--glass-btn-bg-active)]
      active:translate-y-0 active:scale-[0.98]
      active:[box-shadow:inset_0_1px_3px_rgba(0,0,0,0.08)]
      
      disabled:opacity-50 disabled:translate-y-0 disabled:scale-100
      disabled:[box-shadow:none]
    `,
    ghost: `
      text-[var(--text-2)]
      bg-transparent
      border border-transparent
      
      hover:text-[var(--text-1)]
      hover:bg-[var(--glass-item-hover)]
      hover:backdrop-blur-[8px]
      
      active:bg-[var(--glass-btn-bg-active)]
      active:scale-[0.98]
      
      disabled:opacity-50
    `,
    destructive: `
      text-white
      bg-[var(--danger)]
      backdrop-blur-[12px]
      border border-[rgba(255,255,255,0.15)]
      [box-shadow:0_2px_12px_-2px_rgba(239,68,68,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)]
      
      before:absolute before:inset-0 before:rounded-[inherit] before:pointer-events-none
      before:bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_50%,rgba(0,0,0,0.08)_100%)]
      
      after:absolute after:inset-0 after:rounded-[inherit] after:p-[1px] after:pointer-events-none
      after:bg-[linear-gradient(180deg,rgba(255,255,255,0.25)_0%,transparent_40%)]
      after:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]
      after:[mask-composite:exclude] after:[-webkit-mask-composite:xor]
      
      hover:translate-y-[-1px]
      hover:[box-shadow:0_4px_20px_-4px_rgba(239,68,68,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)]
      
      active:translate-y-0 active:scale-[0.98]
      active:[box-shadow:inset_0_2px_4px_rgba(0,0,0,0.2)]
      
      disabled:opacity-50 disabled:translate-y-0 disabled:scale-100
    `,
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      disabled={isDisabled}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center justify-center gap-[inherit]">
        {isLoading ? (
          <svg 
            className="animate-spin h-4 w-4" 
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle 
              className="opacity-20" 
              cx="12" cy="12" r="10" 
              stroke="currentColor" 
              strokeWidth="3"
            />
            <path 
              className="opacity-80" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </span>
    </button>
  );
}

export const PrimaryButton = (props: Omit<ButtonProps, 'variant'>) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props: Omit<ButtonProps, 'variant'>) => <Button variant="secondary" {...props} />;
export const GhostButton = (props: Omit<ButtonProps, 'variant'>) => <Button variant="ghost" {...props} />;
export const DestructiveButton = (props: Omit<ButtonProps, 'variant'>) => <Button variant="destructive" {...props} />;
