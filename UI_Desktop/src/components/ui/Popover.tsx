// src/components/ui/Popover.tsx
/**
 * Generic Popover component - Apple Liquid-Glass style
 * Border-based depth, backdrop-blur, no heavy shadows
 */

import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  anchorPosition?: { x: number; y: number };
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  isDarkMode?: boolean;
}

export default function Popover({
  isOpen,
  onClose,
  children,
  anchorPosition,
  placement = 'bottom-right',
  isDarkMode = false
}: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    console.log('[Popover] Opened with anchor:', anchorPosition, 'placement:', placement);

    const handleClickOutside = (e: MouseEvent) => {
      // Check if popover exists and click is outside
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        // Don't close if clicking on a button (especially the trigger button)
        const target = e.target as HTMLElement;
        const isButton = target.closest('button');
        if (isButton) return;
        
        console.log('[Popover] Click outside detected, closing');
        onClose();
      }
    };

    // Longer delay to prevent immediate close from trigger click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 200);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorPosition, placement]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  console.log('[Popover] Rendering with isOpen=true, anchorPosition:', anchorPosition, 'placement:', placement);

  // Calculate position based on anchor and placement
  const getPositionStyle = (): React.CSSProperties => {
    if (anchorPosition) {
      const style: React.CSSProperties = { position: 'fixed' };
      
      const popoverWidth = 200;
      const popoverHeight = 250;
      const gap = 12;
      const edgePadding = 8;
      
      if (placement === 'bottom-right') {
        style.top = Math.min(anchorPosition.y + gap, window.innerHeight - popoverHeight - edgePadding);
        style.right = Math.max(edgePadding, window.innerWidth - anchorPosition.x + gap);
      } else if (placement === 'bottom-left') {
        style.top = Math.min(anchorPosition.y + gap, window.innerHeight - popoverHeight - edgePadding);
        style.left = Math.max(edgePadding, Math.min(anchorPosition.x + gap, window.innerWidth - popoverWidth - edgePadding));
      } else if (placement === 'top-right') {
        style.bottom = Math.max(edgePadding, window.innerHeight - anchorPosition.y + gap);
        style.right = Math.max(edgePadding, window.innerWidth - anchorPosition.x + gap);
      } else if (placement === 'top-left') {
        style.bottom = Math.max(edgePadding, window.innerHeight - anchorPosition.y + gap);
        style.left = Math.max(edgePadding, Math.min(anchorPosition.x + gap, window.innerWidth - popoverWidth - edgePadding));
      }
      
      console.log('[Popover] Calculated position style:', style);
      return style;
    }
    
    return {};
  };

  const positionStyle = getPositionStyle();

  const popoverContent = (
    <div
      ref={popoverRef}
      className={`fixed z-[9999] min-w-[180px] max-w-[220px] rounded-2xl border backdrop-blur-md transition-all duration-200 ${
        isDarkMode
          ? 'border-white/20 bg-white/15'
          : 'border-black/10 bg-black/5'
      }`}
      style={{
        ...positionStyle,
        animation: 'fadeInScale 150ms ease-out',
      }}
    >
      {children}
    </div>
  );

  return createPortal(popoverContent, document.body);
}

// Helper component for menu items
interface PopoverItemProps {
  icon?: string;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  isDarkMode?: boolean;
}

export function PopoverItem({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
  isDarkMode = false
}: PopoverItemProps) {
  const variantColors = {
    default: isDarkMode ? 'text-zinc-100 hover:bg-white/20' : 'text-zinc-800 hover:bg-black/10',
    danger: isDarkMode ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-500/10'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium transition-colors duration-150 first:rounded-t-2xl last:rounded-b-2xl ${
        variantColors[variant]
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {icon && (
        <span className="text-base flex-shrink-0">
          {icon}
        </span>
      )}
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

// Divider for menu sections
export function PopoverDivider({ isDarkMode = false }: { isDarkMode?: boolean }) {
  return (
    <div
      className={`h-px mx-2 ${
        isDarkMode ? 'bg-white/10' : 'bg-black/8'
      }`}
    />
  );
}
