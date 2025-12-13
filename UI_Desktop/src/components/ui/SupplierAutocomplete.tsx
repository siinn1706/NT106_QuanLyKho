import { useState, useEffect, useRef } from 'react';
import { apiGetSuppliers, Supplier } from '../../app/api_client';
import Icon from './Icon';

interface SupplierAutocompleteProps {
  value: string;
  onChange: (value: string, supplier?: Supplier) => void;
  onSupplierSelect?: (supplier: Supplier | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function SupplierAutocomplete({
  value,
  onChange,
  onSupplierSelect,
  placeholder = "Nhập tên nhà cung cấp...",
  className = "",
  disabled = false,
}: SupplierAutocompleteProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load suppliers khi component mount
    apiGetSuppliers()
      .then(setSuppliers)
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Filter suppliers khi value thay đổi
    if (value.trim()) {
      const filtered = suppliers.filter(sup =>
        sup.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuppliers(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredSuppliers([]);
      setShowDropdown(false);
    }
    setSelectedIndex(-1);
  }, [value, suppliers]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (onSupplierSelect) onSupplierSelect(null);
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    onChange(supplier.name, supplier);
    if (onSupplierSelect) onSupplierSelect(supplier);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredSuppliers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredSuppliers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredSuppliers.length) {
          handleSelectSupplier(filteredSuppliers[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.trim() && filteredSuppliers.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-10 rounded-lg border bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--primary)] outline-none ${className}`}
        />
        {value && !disabled && (
          <button
            onClick={() => {
              onChange('');
              if (onSupplierSelect) onSupplierSelect(null);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
          >
            <Icon name="close" size="sm" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && filteredSuppliers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredSuppliers.map((supplier, index) => (
            <button
              key={supplier.id}
              onClick={() => handleSelectSupplier(supplier)}
              className={`w-full px-4 py-2.5 text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                  : 'hover:bg-[var(--surface-2)]'
              } ${index !== filteredSuppliers.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-1)] truncate">
                    {supplier.name}
                  </p>
                  {supplier.tax_id && (
                    <p className="text-xs text-[var(--text-3)] mt-0.5">
                      MST: {supplier.tax_id}
                    </p>
                  )}
                  {supplier.phone && (
                    <p className="text-xs text-[var(--text-3)]">
                      <Icon name="phone" size="xs" className="inline mr-1" />
                      {supplier.phone}
                    </p>
                  )}
                </div>
                {supplier.outstanding_debt > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--warning-light)] text-[var(--warning)] whitespace-nowrap">
                    Nợ: {supplier.outstanding_debt.toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
