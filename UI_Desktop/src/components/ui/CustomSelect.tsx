import { useState, useRef, useEffect, useCallback, useId, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface CustomSelectProps {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onOpenChange?: (open: boolean) => void;
}

const sizeStyles = {
  sm: { trigger: 'h-9 px-3 text-[13px]', menu: 'text-[13px]', item: 'py-2 px-3' },
  md: { trigger: 'h-10 px-4 text-sm', menu: 'text-sm', item: 'py-2.5 px-4' },
  lg: { trigger: 'h-12 px-5 text-[15px]', menu: 'text-[15px]', item: 'py-3 px-5' },
};

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Chọn...',
  className = '',
  disabled = false,
  size = 'md',
  onOpenChange,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0, flip: false });
  const [isPositioned, setIsPositioned] = useState(false);
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  
  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption?.label || placeholder;
  const styles = sizeStyles[size];

  // Position calculation - use viewport coordinates for fixed positioning
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const menuHeight = Math.min(280, options.length * 44 + 16);
    const spaceBelow = viewportHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const flip = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    
    let left = rect.left;
    const menuWidth = Math.max(rect.width, 180);
    
    // Adjust for viewport boundaries
    if (left + menuWidth > viewportWidth - 8) {
      left = viewportWidth - menuWidth - 8;
    }
    if (left < 8) left = 8;
    
    const top = flip 
      ? rect.top - menuHeight - 4 
      : rect.bottom + 4;
    
    setMenuPosition({
      top,
      left,
      width: rect.width,
      flip,
    });
    setIsPositioned(true);
  }, [options.length]);

  const openTimeRef = useRef(0);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    openTimeRef.current = Date.now();
    setIsOpen(true);
    onOpenChange?.(true);
    const selectedIdx = options.findIndex(opt => opt.value === value);
    setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
  }, [disabled, onOpenChange, options, value]);

  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      // Get trigger position relative to viewport
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calculate menu dimensions
      const menuHeight = Math.min(280, options.length * 44 + 16);
      const menuWidth = Math.max(rect.width, 180);
      
      // Check if there's space below or should flip above
      const spaceBelow = viewportHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const shouldFlip = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      
      // Calculate top position
      let top = shouldFlip ? rect.top - menuHeight - 4 : rect.bottom + 4;
      
      // Calculate left position
      let left = rect.left;
      
      // Ensure dropdown stays within viewport horizontally
      if (left + menuWidth > viewportWidth - 8) {
        left = viewportWidth - menuWidth - 8;
      }
      if (left < 8) {
        left = 8;
      }
      
      console.log('CustomSelect positioning:', {
        trigger: { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height },
        viewport: { width: viewportWidth, height: viewportHeight },
        calculated: { top, left, width: rect.width },
        shouldFlip,
        menuHeight,
        spaceBelow,
        spaceAbove
      });
      
      setMenuPosition({
        top,
        left,
        width: rect.width,
        flip: shouldFlip,
      });
      setIsPositioned(true);
    } else if (!isOpen) {
      setIsPositioned(false);
    }
  }, [isOpen, options.length]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsPositioned(false);
    onOpenChange?.(false);
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  }, [onOpenChange]);

  const handleSelect = useCallback((optValue: string) => {
    onChange(optValue);
    handleClose();
  }, [onChange, handleClose]);

  // Shared positioning function
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return null;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const menuHeight = Math.min(280, options.length * 44 + 16);
    const menuWidth = Math.max(rect.width, 180);
    
    const spaceBelow = viewportHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const shouldFlip = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    
    let top = shouldFlip ? rect.top - menuHeight - 4 : rect.bottom + 4;
    let left = rect.left;
    
    if (left + menuWidth > viewportWidth - 8) {
      left = viewportWidth - menuWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }
    
    return {
      top,
      left,
      width: rect.width,
      flip: shouldFlip,
    };
  }, [options.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        handleClose();
      }
    };

    const handleScroll = () => {
      if (!triggerRef.current) return;
      if (Date.now() - openTimeRef.current < 100) return;
      
      const rect = triggerRef.current.getBoundingClientRect();
      // Close if trigger is out of viewport
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        handleClose();
      } else {
        // Update position
        const newPos = calculatePosition();
        if (newPos) {
          setMenuPosition(newPos);
        }
      }
    };
    
    const handleResize = () => {
      const newPos = calculatePosition();
      if (newPos) {
        setMenuPosition(newPos);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, handleClose, updatePosition]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          const opt = options[highlightedIndex];
          if (!opt.disabled) handleSelect(opt.value);
        } else {
          handleOpen();
        }
        break;
      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          handleClose();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          handleOpen();
        } else {
          setHighlightedIndex(prev => {
            let next = prev + 1;
            while (next < options.length && options[next].disabled) next++;
            return next < options.length ? next : prev;
          });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => {
            let next = prev - 1;
            while (next >= 0 && options[next].disabled) next--;
            return next >= 0 ? next : prev;
          });
        }
        break;
      case 'Tab':
        if (isOpen) handleClose();
        break;
    }
  };

  useEffect(() => {
    if (!isOpen || !isPositioned || highlightedIndex < 0 || !menuRef.current) return;
    const item = menuRef.current.querySelector(`[data-index="${highlightedIndex}"]`) as HTMLElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, isOpen, isPositioned]);

  const menu = isOpen && isPositioned && createPortal(
    <div
      ref={menuRef}
      role="listbox"
      id={listboxId}
      aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-${highlightedIndex}` : undefined}
      className={`
        fixed z-[9999] min-w-[180px]
        liquid-glass-dropdown
        ${styles.menu}
      `}
      style={{
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
        width: Math.max(menuPosition.width, 180),
        transformOrigin: menuPosition.flip ? 'bottom center' : 'top center',
        animation: 'glass-dropdown-in 150ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
      }}
    >
      <div className="py-1.5 max-h-[264px] overflow-y-auto glass-scrollbar">
        {options.map((opt, index) => {
          const isSelected = opt.value === value;
          const isHighlighted = index === highlightedIndex;
          const isDisabled = opt.disabled;
          
          return (
            <button
              key={opt.value}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={isSelected}
              aria-disabled={isDisabled}
              data-index={index}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && handleSelect(opt.value)}
              onMouseEnter={() => !isDisabled && setHighlightedIndex(index)}
              className={`
                w-full flex items-center gap-3 text-left
                ${styles.item}
                transition-all duration-[120ms] ease-out
                rounded-[var(--radius-md)] mx-1.5
                ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                ${isSelected 
                  ? 'bg-[var(--primary-light)] text-[var(--primary)] font-medium border border-[var(--primary)]/20'
                  : isHighlighted 
                    ? 'bg-[var(--glass-item-hover)] text-[var(--text-1)]'
                    : 'text-[var(--text-1)]'
                }
              `}
              style={{ width: 'calc(100% - 12px)' }}
            >
              {opt.icon && (
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center opacity-70">
                  {opt.icon}
                </span>
              )}
              <span className="flex-1 truncate">{opt.label}</span>
              {isSelected && (
                <svg className="w-4 h-4 flex-shrink-0 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => isOpen ? handleClose() : handleOpen()}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full inline-flex items-center justify-between gap-3
          ${styles.trigger}
          rounded-[var(--radius-lg)]
          bg-[var(--glass-input-bg)]
          backdrop-blur-[12px]
          border border-[var(--glass-input-border)]
          transition-all duration-[180ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]
          cursor-pointer
          
          hover:border-[var(--glass-btn-border)]
          
          focus:outline-none focus-visible:border-[var(--primary)]
          focus-visible:ring-2 focus-visible:ring-[var(--primary)]/20
          
          disabled:opacity-50 disabled:cursor-not-allowed
          
          ${isOpen ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20 bg-[var(--glass-input-focus-bg)]' : ''}
          ${selectedOption ? 'text-[var(--text-1)]' : 'text-[var(--text-3)]'}
        `}
      >
        <span className="truncate leading-none">{displayText}</span>
        <svg 
          className={`w-4 h-4 flex-shrink-0 text-[var(--text-3)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {menu}
    </div>
  );
}
