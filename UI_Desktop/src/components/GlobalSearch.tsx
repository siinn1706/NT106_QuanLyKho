/** GlobalSearch.tsx - Global search component */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch, SearchResult } from '../hooks/useGlobalSearch';
import Icon from './ui/Icon';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { search, results, isSearching } = useGlobalSearch();

  // Search on query change
  useEffect(() => {
    if (query.trim()) {
      search(query);
    }
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.route);
    setIsOpen(false);
    setQuery('');
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    const icons = {
      item: 'box',
      supplier: 'building',
      warehouse: 'warehouse',
      stock_in: 'arrow-down',
      stock_out: 'arrow-up',
    };
    return icons[type];
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    const labels = {
      item: 'Hàng hóa',
      supplier: 'Nhà cung cấp',
      warehouse: 'Kho hàng',
      stock_in: 'Phiếu nhập',
      stock_out: 'Phiếu xuất',
    };
    return labels[type];
  };

  return (
    <div ref={searchRef} className="relative z-[100]">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Tìm kiếm hàng hoá, báo cáo... (Ctrl+K)"
          className="w-80 py-2 pr-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all duration-180"
          style={{ paddingLeft: '2.5rem' }}
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none">
          <Icon name="search" size="sm" />
        </span>
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
          >
            <Icon name="close" size="sm" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown - Liquid Glass */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 liquid-glass-dropdown max-h-[500px] overflow-y-auto z-[999] animate-glass-in">
          {isSearching ? (
            <div className="p-8 text-center text-[var(--text-3)]">
              <Icon name="spinner" size="lg" spin className="mx-auto mb-2" />
              <p>Đang tìm kiếm...</p>
            </div>
          ) : query.trim() && results.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-3)]">
              <Icon name="search" size="lg" className="mx-auto mb-2 opacity-50" />
              <p>Không tìm thấy kết quả</p>
            </div>
          ) : !query.trim() ? (
            <div className="p-4">
              <p className="text-sm text-[var(--text-3)] mb-2">Gợi ý tìm kiếm:</p>
              <div className="space-y-1">
                <div className="px-3 py-2 text-sm text-[var(--text-2)]">• Tên hàng hóa, SKU</div>
                <div className="px-3 py-2 text-sm text-[var(--text-2)]">• Tên nhà cung cấp</div>
                <div className="px-3 py-2 text-sm text-[var(--text-2)]">• Mã kho, tên kho</div>
                <div className="px-3 py-2 text-sm text-[var(--text-2)]">• Mã phiếu nhập/xuất</div>
              </div>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-[var(--surface-2)] transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0">
                    <Icon name={getTypeIcon(result.type)} size="md" className="text-[var(--primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-1)] truncate">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-sm text-[var(--text-3)] truncate">{result.subtitle}</p>
                    )}
                  </div>
                  <span className="px-2 py-1 rounded text-xs bg-[var(--surface-2)] text-[var(--text-3)] flex-shrink-0">
                    {getTypeLabel(result.type)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

