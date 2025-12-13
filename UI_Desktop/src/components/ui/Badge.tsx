/**
 * Badge.tsx - Badge / StatusPill components
 * 
 * Design rules:
 * - Background colors với opacity thấp
 * - Text colors saturated hơn
 * - Radius nhỏ hơn cha (--radius-sm)
 */

import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--surface-2)] text-[var(--text-2)]',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[var(--text-3)]',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  purple: 'bg-purple-500',
};

const sizeStyles: Record<string, string> = {
  sm: 'h-5 px-1.5 text-xs',
  md: 'h-6 px-2 text-xs',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium
        rounded-[var(--radius-xs)]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}

// ==================== STATUS PILL ====================
export type StatusType = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'warning' | 'error';

export interface StatusPillProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Hoạt động', variant: 'success' },
  inactive: { label: 'Không hoạt động', variant: 'default' },
  pending: { label: 'Đang xử lý', variant: 'warning' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'danger' },
  warning: { label: 'Cảnh báo', variant: 'warning' },
  error: { label: 'Lỗi', variant: 'danger' },
};

export function StatusPill({ status, label, className = '' }: StatusPillProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} dot className={className}>
      {label || config.label}
    </Badge>
  );
}

// ==================== COUNT BADGE ====================
export interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: BadgeVariant;
  className?: string;
}

export function CountBadge({ 
  count, 
  max = 99, 
  variant = 'danger',
  className = '' 
}: CountBadgeProps) {
  const displayCount = count > max ? `${max}+` : count.toString();
  
  return (
    <Badge variant={variant} size="sm" className={`min-w-[20px] justify-center ${className}`}>
      {displayCount}
    </Badge>
  );
}

// ==================== STOCK STATUS BADGE ====================
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'overstock';

export interface StockBadgeProps {
  status: StockStatus;
  quantity?: number;
  className?: string;
}

const stockConfig: Record<StockStatus, { label: string; variant: BadgeVariant }> = {
  'in-stock': { label: 'Còn hàng', variant: 'success' },
  'low-stock': { label: 'Sắp hết', variant: 'warning' },
  'out-of-stock': { label: 'Hết hàng', variant: 'danger' },
  'overstock': { label: 'Tồn quá nhiều', variant: 'purple' },
};

export function StockBadge({ status, quantity, className = '' }: StockBadgeProps) {
  const config = stockConfig[status];
  
  return (
    <Badge variant={config.variant} dot className={className}>
      {config.label}
      {quantity !== undefined && ` (${quantity})`}
    </Badge>
  );
}

// ==================== TRANSACTION TYPE BADGE ====================
export type TransactionType = 'import' | 'export' | 'adjust' | 'transfer';

export interface TransactionBadgeProps {
  type: TransactionType;
  className?: string;
}

const transactionConfig: Record<TransactionType, { label: string; variant: BadgeVariant }> = {
  import: { label: 'Nhập kho', variant: 'success' },
  export: { label: 'Xuất kho', variant: 'info' },
  adjust: { label: 'Điều chỉnh', variant: 'warning' },
  transfer: { label: 'Chuyển kho', variant: 'purple' },
};

export function TransactionBadge({ type, className = '' }: TransactionBadgeProps) {
  const config = transactionConfig[type];
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
