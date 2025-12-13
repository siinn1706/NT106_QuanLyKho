/**
 * Table.tsx - Table component
 * 
 * Design rules:
 * - KHÔNG shadow
 * - Border-based separation
 * - Radius cho container (--radius-lg)
 * - Row hover với surface transition
 */

import React from 'react';

// ==================== TABLE CONTAINER ====================
export interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div 
      className={`
        w-full overflow-hidden
        bg-[var(--surface-1)] border border-[var(--border)] 
        rounded-[var(--radius-lg)]
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {children}
        </table>
      </div>
    </div>
  );
}

// ==================== TABLE HEADER ====================
export interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHeader({ children, className = '' }: TableHeaderProps) {
  return (
    <thead 
      className={`
        bg-[var(--surface-2)] border-b border-[var(--border)]
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </thead>
  );
}

// ==================== TABLE BODY ====================
export interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function TableBody({ children, className = '' }: TableBodyProps) {
  return (
    <tbody 
      className={`
        divide-y divide-[var(--border)]
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </tbody>
  );
}

// ==================== TABLE ROW ====================
export interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function TableRow({ 
  children, 
  className = '', 
  onClick,
  hoverable = true 
}: TableRowProps) {
  return (
    <tr 
      className={`
        ${hoverable ? 'hover:bg-[var(--surface-2)] transition-colors duration-100' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

// ==================== TABLE HEADER CELL ====================
export interface TableHeadProps {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | false;
  onSort?: () => void;
  width?: string | number;
}

export function TableHead({ 
  children, 
  className = '', 
  align = 'left',
  sortable = false,
  sorted = false,
  onSort,
  width
}: TableHeadProps) {
  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  
  return (
    <th 
      className={`
        px-4 py-3 text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider
        ${alignStyles[align]}
        ${sortable ? 'cursor-pointer select-none hover:text-[var(--text-1)]' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={width ? { width } : undefined}
      onClick={sortable ? onSort : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <span className="inline-flex flex-col">
            <svg 
              className={`w-3 h-3 -mb-1 ${sorted === 'asc' ? 'text-[var(--primary)]' : 'text-[var(--text-3)]'}`}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M5 10l5-5 5 5H5z" />
            </svg>
            <svg 
              className={`w-3 h-3 ${sorted === 'desc' ? 'text-[var(--primary)]' : 'text-[var(--text-3)]'}`}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M5 10l5 5 5-5H5z" />
            </svg>
          </span>
        )}
      </span>
    </th>
  );
}

// ==================== TABLE DATA CELL ====================
export interface TableCellProps {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  colSpan?: number;
}

export function TableCell({ 
  children, 
  className = '', 
  align = 'left',
  colSpan
}: TableCellProps) {
  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  
  return (
    <td 
      className={`
        px-4 py-3 text-sm text-[var(--text-1)]
        ${alignStyles[align]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
}

// ==================== EMPTY STATE ====================
export interface TableEmptyProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  colSpan?: number;
}

export function TableEmpty({
  icon,
  title = 'Không có dữ liệu',
  description,
  action,
  colSpan = 1
}: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12">
        <div className="flex flex-col items-center justify-center text-center">
          {icon && (
            <span className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-3)] mb-4">
              {icon}
            </span>
          )}
          <p className="text-sm font-medium text-[var(--text-2)]">{title}</p>
          {description && (
            <p className="text-sm text-[var(--text-3)] mt-1 max-w-sm">{description}</p>
          )}
          {action && (
            <div className="mt-4">{action}</div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ==================== LOADING STATE ====================
export interface TableLoadingProps {
  colSpan?: number;
  rows?: number;
}

export function TableLoading({ colSpan = 1, rows = 3 }: TableLoadingProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          <td colSpan={colSpan} className="px-4 py-3">
            <div className="animate-pulse flex items-center gap-4">
              <div className="h-4 bg-[var(--surface-2)] rounded w-1/4" />
              <div className="h-4 bg-[var(--surface-2)] rounded w-1/3" />
              <div className="h-4 bg-[var(--surface-2)] rounded w-1/6" />
              <div className="h-4 bg-[var(--surface-2)] rounded w-1/5" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
