/**
 * ProductCodeInput.tsx - Component nhập mã sản phẩm với auto-lookup
 * 
 * Khi người dùng nhập mã hàng và nhấn Enter hoặc nút tìm kiếm:
 * - Tự động điền tên hàng hoá
 * - Tự động điền đơn vị tính (readonly, không thể thay đổi)
 * - Hiển thị số lượng tồn kho
 * - Hiển thị giá nhập gần nhất (cho trang nhập kho)
 */

import { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import { 
  ProductLookupResult, 
  searchProductsMock, 
  lookupProductByCodeMock,
  getAllProductsMock 
} from '../../app/product_lookup';

interface ProductCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  onProductFound: (product: ProductLookupResult) => void;
  onProductNotFound?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showSuggestions?: boolean; // Hiển thị dropdown gợi ý khi gõ
  autoFocus?: boolean;
}

export default function ProductCodeInput({
  value,
  onChange,
  onProductFound,
  onProductNotFound,
  placeholder = 'Nhập mã SKU hoặc barcode',
  className = '',
  disabled = false,
  showSuggestions = true,
  autoFocus = false,
}: ProductCodeInputProps) {
  const [suggestions, setSuggestions] = useState<ProductLookupResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tìm kiếm gợi ý khi nhập
  useEffect(() => {
    if (!showSuggestions || !value || value.length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const results = searchProductsMock(value, 8);
    setSuggestions(results);
    setShowDropdown(results.length > 0);
    setHighlightIndex(-1);
  }, [value, showSuggestions]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tra cứu sản phẩm theo mã
  const handleSearch = () => {
    if (!value.trim()) return;
    
    setIsSearching(true);
    setShowDropdown(false);
    
    // Mock lookup - sau này thay bằng API call
    const product = lookupProductByCodeMock(value.trim());
    
    setTimeout(() => {
      setIsSearching(false);
      if (product) {
        onProductFound(product);
      } else {
        onProductNotFound?.();
      }
    }, 200); // Simulate network delay
  };

  // Xử lý chọn từ dropdown
  const handleSelectProduct = (product: ProductLookupResult) => {
    onChange(product.sku);
    onProductFound(product);
    setShowDropdown(false);
  };

  // Xử lý phím tắt
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        handleSelectProduct(suggestions[highlightIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const inputClass = "w-full h-10 px-3 text-[14px] text-[var(--text-1)] bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-md)] transition-colors duration-150 placeholder:text-[var(--text-3)] hover:border-[var(--border-hover)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`${inputClass} flex-1 pr-3`}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={disabled || isSearching || !value.trim()}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Tìm sản phẩm (Enter)"
        >
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Icon name="search" size="sm" className="text-white" />
          )}
        </button>
      </div>

      {/* Dropdown suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden max-h-[280px] overflow-y-auto"
        >
          {suggestions.map((product, index) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelectProduct(product)}
              className={`w-full px-3 py-2.5 text-left transition-colors ${
                index === highlightIndex 
                  ? 'bg-[var(--primary)]/10' 
                  : 'hover:bg-[var(--surface-2)]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[var(--text-1)] truncate">
                    {product.name}
                  </p>
                  <p className="text-[12px] text-[var(--text-3)]">
                    {product.sku} • {product.unit}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-[13px] font-medium ${
                    product.quantity > 10 ? 'text-[var(--success)]' : 
                    product.quantity > 0 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'
                  }`}>
                    {product.quantity}
                  </p>
                  <p className="text-[11px] text-[var(--text-3)]">tồn kho</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Component hiển thị thông tin sản phẩm đã chọn
// ============================================

interface ProductInfoDisplayProps {
  product: ProductLookupResult | null;
  showPrice?: boolean;
  showStock?: boolean;
  compact?: boolean;
}

export function ProductInfoDisplay({ 
  product, 
  showPrice = false, 
  showStock = true,
  compact = false 
}: ProductInfoDisplayProps) {
  if (!product) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[var(--text-2)]">
        <span className="font-medium text-[var(--text-1)]">{product.name}</span>
        <span className="text-[var(--text-3)]">•</span>
        <span>{product.unit}</span>
        {showStock && (
          <>
            <span className="text-[var(--text-3)]">•</span>
            <span className={product.quantity > 10 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}>
              Tồn: {product.quantity}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 rounded-[var(--radius-md)] bg-[var(--info-light)] border border-[var(--info)]/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-[14px] font-medium text-[var(--text-1)]">{product.name}</p>
          <p className="text-[13px] text-[var(--text-2)] mt-0.5">
            Đơn vị: <span className="font-medium">{product.unit}</span>
          </p>
        </div>
        <div className="text-right">
          {showStock && (
            <div>
              <p className={`text-[16px] font-semibold ${
                product.quantity > 10 ? 'text-[var(--success)]' : 
                product.quantity > 0 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'
              }`}>
                {product.quantity}
              </p>
              <p className="text-[11px] text-[var(--text-3)]">tồn kho</p>
            </div>
          )}
          {showPrice && (
            <p className="text-[13px] text-[var(--text-2)] mt-1">
              {product.price.toLocaleString('vi-VN')}₫
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
