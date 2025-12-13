/**
 * Card.tsx - Card / Panel components
 * 
 * Design rules:
 * - KHÔNG shadow (dùng border-based depth)
 * - Surface layering: bg > surface-1 > surface-2
 * - Radius: cha (--radius-lg) > con (--radius-md)
 */

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
  hoverable?: boolean;
}

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export default function Card({
  children,
  className = '',
  padding = 'md',
  bordered = true,
  hoverable = false,
}: CardProps) {
  return (
    <div
      className={`
        bg-[var(--surface-1)] rounded-[var(--radius-lg)]
        ${bordered ? 'border border-[var(--border)]' : ''}
        ${hoverable ? 'transition-all duration-150 hover:border-[var(--border-hover)] cursor-pointer' : ''}
        ${paddingStyles[padding]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
}

// ==================== CARD HEADER ====================
export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className = '',
}: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-2)]">
            {icon}
          </span>
        )}
        <div>
          <h3 className="text-base font-semibold text-[var(--text-1)]">{title}</h3>
          {subtitle && (
            <p className="text-sm text-[var(--text-3)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ==================== CARD CONTENT ====================
export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`mt-4 ${className}`}>
      {children}
    </div>
  );
}

// ==================== CARD FOOTER ====================
export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}

export function CardFooter({ children, className = '', bordered = true }: CardFooterProps) {
  return (
    <div 
      className={`
        mt-4 pt-4 flex items-center gap-3
        ${bordered ? 'border-t border-[var(--border)]' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
}

// ==================== STAT CARD ====================
export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: {
    value: string | number;
    type: 'up' | 'down' | 'neutral';
  };
  subtitle?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  change,
  subtitle,
  className = '',
}: StatCardProps) {
  const changeColors = {
    up: 'text-[var(--success)]',
    down: 'text-[var(--danger)]',
    neutral: 'text-[var(--text-3)]',
  };
  
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-3)]">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-1)] tabular-nums">
            {value}
          </p>
          {(change || subtitle) && (
            <div className="mt-2 flex items-center gap-2">
              {change && (
                <span className={`text-sm font-medium ${changeColors[change.type]}`}>
                  {change.type === 'up' && '↑'}
                  {change.type === 'down' && '↓'}
                  {change.value}
                </span>
              )}
              {subtitle && (
                <span className="text-sm text-[var(--text-3)]">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <span className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--primary)]">
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}

// ==================== PANEL (alternative to Card) ====================
export interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export function Panel({ children, className = '' }: PanelProps) {
  return (
    <div 
      className={`
        bg-[var(--surface-2)] rounded-[var(--radius-lg)] p-4
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
}
