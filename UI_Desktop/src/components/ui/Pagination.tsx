/** Pagination.tsx - Pagination component */

import Icon from './Icon';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="text-sm text-[var(--text-3)]">
        Trang {currentPage} / {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 w-9 flex items-center justify-center rounded-lg border bg-[var(--surface-2)] border-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface-3)] transition-colors"
          title="Trang trước"
        >
          <Icon name="chevron-left" size="sm" />
        </button>
        
        {getPageNumbers().map((page, idx) => (
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-[var(--text-3)]">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-colors ${
                currentPage === page
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--surface-2)] border-[var(--border)] hover:bg-[var(--surface-3)] text-[var(--text-1)]'
              }`}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-9 w-9 flex items-center justify-center rounded-lg border bg-[var(--surface-2)] border-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surface-3)] transition-colors"
          title="Trang sau"
        >
          <Icon name="chevron-right" size="sm" />
        </button>
      </div>
    </div>
  );
}

