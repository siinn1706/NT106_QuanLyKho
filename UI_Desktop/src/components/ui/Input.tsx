/**
 * Input.tsx - Input, Select, Textarea components
 * 
 * Design rules (SF Pro Display only):
 * - KHÔNG shadow
 * - Border-based focus states
 * - Height: 44px (touch-friendly)
 * - Radius: --radius-md (12px)
 * - Font: 14px body text
 */

import React from 'react';

// ==================== INPUT ====================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-2)] mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={`
            w-full h-11 px-4 text-[14px] text-[var(--text-1)]
            bg-[var(--surface-1)] border border-[var(--border)]
            rounded-[var(--radius-md)] transition-all duration-[180ms] ease-out
            placeholder:text-[var(--text-3)]
            hover:border-[var(--border-hover)]
            focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--surface-2)]
            ${leftIcon ? 'pl-11' : ''}
            ${rightIcon ? 'pr-11' : ''}
            ${error ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/15' : ''}
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-[12px] text-[var(--danger)]">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-[12px] text-[var(--text-3)]">{hint}</p>
      )}
    </div>
  );
}

// ==================== SELECT ====================
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  hint,
  options,
  placeholder,
  className = '',
  id,
  ...props
}: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={selectId}
          className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-2)] mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`
            w-full h-11 px-4 pr-10 text-[14px] text-[var(--text-1)]
            bg-[var(--surface-1)] border border-[var(--border)]
            rounded-[var(--radius-lg)] transition-colors duration-150
            appearance-none cursor-pointer
            hover:border-[var(--border-hover)]
            focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--surface-2)]
            ${error ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20' : ''}
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Chevron icon */}
        <svg 
          className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)] pointer-events-none"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && (
        <p className="mt-1.5 text-[12px] text-[var(--danger)]">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-[12px] text-[var(--text-3)]">{hint}</p>
      )}
    </div>
  );
}

// ==================== TEXTAREA ====================
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={textareaId}
          className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-2)] mb-2"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`
          w-full min-h-[120px] p-4 text-[14px] text-[var(--text-1)]
          bg-[var(--surface-1)] border border-[var(--border)]
          rounded-[var(--radius-lg)] transition-colors duration-150
          placeholder:text-[var(--text-3)]
          hover:border-[var(--border-hover)]
          focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--surface-2)]
          resize-y
          ${error ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20' : ''}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-[12px] text-[var(--danger)]">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-[12px] text-[var(--text-3)]">{hint}</p>
      )}
    </div>
  );
}

// ==================== SEARCH INPUT ====================
export interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onSearch?: (value: string) => void;
}

export function SearchInput({ 
  onSearch, 
  onChange,
  ...props 
}: SearchInputProps) {
  return (
    <Input
      leftIcon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      placeholder="Tìm kiếm..."
      onChange={(e) => {
        onChange?.(e);
        onSearch?.(e.target.value);
      }}
      {...props}
    />
  );
}
