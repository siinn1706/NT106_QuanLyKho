/**
 * CustomSelect.tsx - Custom dropdown select với bo tròn hoàn toàn
 */

import { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Chọn...',
  className = '',
  disabled = false,
  size = 'sm',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tìm label của option đang được chọn
  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption?.label || placeholder;

  // Click outside để đóng
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full inline-flex items-center justify-between gap-3
          ${size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4 text-sm'}
          bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-md)]
          transition-all duration-[180ms] ease-out cursor-pointer
          hover:border-[var(--text-3)]
          focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/15' : ''}
          ${selectedOption ? 'text-[var(--text-1)]' : 'text-[var(--text-3)]'}
        `}
      >
        <span className="truncate leading-none">{displayText}</span>
        <svg 
          className={`w-3 h-3 flex-shrink-0 text-[var(--text-3)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M8 11.5l-5-5h10l-5 5z" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full z-[9999] mt-1 min-w-full bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden animate-slideUp">
          <div className="py-1 max-h-[220px] overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`
                  w-full px-4 py-2.5 text-left text-sm transition-colors
                  ${opt.value === value 
                    ? 'bg-[var(--primary)] text-white' 
                    : 'text-[var(--text-1)] hover:bg-[var(--surface-2)]'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
