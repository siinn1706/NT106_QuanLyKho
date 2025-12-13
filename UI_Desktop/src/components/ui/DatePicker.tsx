/**
 * DatePicker.tsx - Custom date picker đồng bộ với design system
 * 
 * Features:
 * - Wheel picker riêng cho tháng và năm (click vào để đổi)
 * - Logic: chọn năm → hỏi chọn tháng, chọn tháng → apply ngay
 * - Animation mượt: item ở giữa to nhất, 2 đầu bé dần
 * - Không cho chọn ngày tương lai
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

interface DatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: string; // Format: YYYY-MM-DD - Ngày tối thiểu có thể chọn
}

const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];
const MONTHS_SHORT = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ============================================
// Wheel Picker Component - iOS style
// Item ở giữa TO NHẤT, 2 đầu bé dần
// ============================================
interface WheelPickerProps {
  items: { value: number; label: string; disabled?: boolean }[];
  selectedValue: number;
  onSelect: (value: number) => void;
  itemHeight?: number;
}

function WheelPicker({ items, selectedValue, onSelect, itemHeight = 48 }: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  
  const visibleCount = 5;
  const centerIndex = Math.floor(visibleCount / 2); // = 2
  const containerHeight = itemHeight * visibleCount;
  
  // Scroll đến item được chọn khi mount
  useEffect(() => {
    const idx = items.findIndex(item => item.value === selectedValue);
    if (idx >= 0 && containerRef.current && !isScrollingRef.current) {
      const targetScroll = idx * itemHeight;
      containerRef.current.scrollTop = targetScroll;
      setScrollY(targetScroll);
    }
  }, [selectedValue, items, itemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollY = e.currentTarget.scrollTop;
    setScrollY(newScrollY);
    isScrollingRef.current = true;
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = window.setTimeout(() => {
      isScrollingRef.current = false;
      const idx = Math.round(newScrollY / itemHeight);
      const clampedIdx = Math.max(0, Math.min(idx, items.length - 1));
      
      if (!items[clampedIdx].disabled) {
        onSelect(items[clampedIdx].value);
      }
      
      // Snap to position
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: clampedIdx * itemHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  }, [items, itemHeight, onSelect]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Tính style iOS-like: item ở giữa to nhất (scale 1.2), 2 đầu bé dần (scale 0.7)
  const getItemStyle = useCallback((index: number): React.CSSProperties => {
    // Vị trí item trong viewport (0 = top, centerIndex = center)
    const currentCenterIdx = scrollY / itemHeight;
    const distanceFromCenter = Math.abs(index - currentCenterIdx);
    
    // Clamp distance to [0, centerIndex]
    const maxDist = centerIndex + 0.5;
    const normalizedDist = Math.min(distanceFromCenter / maxDist, 1);
    
    // Scale: 1.25 (center) → 0.7 (edge) - iOS-like curve
    const scale = 1.25 - normalizedDist * 0.55;
    
    // Opacity: 1 (center) → 0.3 (edge)
    const opacity = 1 - normalizedDist * 0.7;
    
    // Font size thay đổi: 18px (center) → 14px (edge)
    const fontSize = 18 - normalizedDist * 4;
    
    return {
      transform: `scale(${scale.toFixed(3)})`,
      opacity: opacity.toFixed(3),
      fontSize: `${fontSize.toFixed(1)}px`,
      fontWeight: distanceFromCenter < 0.5 ? 700 : 500,
      transition: isScrollingRef.current ? 'none' : 'all 0.12s ease-out',
    };
  }, [scrollY, itemHeight, centerIndex]);

  return (
    <div 
      className="relative overflow-hidden"
      style={{ height: containerHeight }}
    >
      {/* Gradient fade trên - nhẹ hơn để thấy rõ 5 dòng */}
      <div 
        className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
        style={{
          height: itemHeight * 1.2,
          background: 'linear-gradient(to bottom, var(--surface-1) 0%, transparent 100%)'
        }}
      />
      
      {/* Gradient fade dưới */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
        style={{
          height: itemHeight * 1.2,
          background: 'linear-gradient(to top, var(--surface-1) 0%, transparent 100%)'
        }}
      />
      
      {/* Selection highlight - chỉ border, không fill, không chặn scroll */}
      <div 
        className="absolute left-4 right-4 z-10 rounded-xl border-2 border-[var(--primary)]/40 pointer-events-none"
        style={{
          top: itemHeight * centerIndex,
          height: itemHeight,
        }}
      />
      
      {/* Scrollable list - z-index cao hơn để nhận scroll */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-none relative z-30"
        onScroll={handleScroll}
      >
        {/* Top padding để center item đầu tiên */}
        <div style={{ height: itemHeight * centerIndex }} />
        
        {items.map((item, idx) => (
          <div
            key={item.value}
            className={`
              flex items-center justify-center cursor-pointer select-none
              ${item.disabled ? 'pointer-events-none' : ''}
            `}
            style={{
              height: itemHeight,
              ...getItemStyle(idx),
            }}
            onClick={() => {
              if (item.disabled) return;
              onSelect(item.value);
              if (containerRef.current) {
                containerRef.current.scrollTo({
                  top: idx * itemHeight,
                  behavior: 'smooth'
                });
              }
            }}
          >
            <span className={`
              whitespace-nowrap transition-colors duration-100
              ${item.disabled 
                ? 'text-[var(--text-3)]/30' 
                : item.value === selectedValue 
                  ? 'text-[var(--text-1)]' 
                  : 'text-[var(--text-2)]'
              }
            `}>
              {item.label}
            </span>
          </div>
        ))}
        
        {/* Bottom padding */}
        <div style={{ height: itemHeight * centerIndex }} />
      </div>
    </div>
  );
}

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Chọn ngày',
  className = '',
  disabled = false,
  minDate = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  // pickerMode: 'calendar' | 'year' | 'month'
  // Logic: click năm → mở year picker → chọn xong → mở month picker → apply
  //        click tháng → mở month picker → chọn xong → apply ngay
  const [pickerMode, setPickerMode] = useState<'calendar' | 'year' | 'month'>('calendar');
  const containerRef = useRef<HTMLDivElement>(null);

  // Dùng useMemo để tránh tạo Date mới mỗi render
  const { currentYear, currentMonth, currentDay } = useMemo(() => {
    const now = new Date();
    return {
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth(),
      currentDay: now.getDate(),
    };
  }, []);

  // Parse value hoặc dùng ngày hiện tại
  const parseDate = useCallback((dateStr: string) => {
    if (dateStr) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return { year, month: month - 1, day };
    }
    return { year: currentYear, month: currentMonth, day: currentDay };
  }, [currentYear, currentMonth, currentDay]);

  const parsed = parseDate(value);
  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);
  
  // Temp values khi đang chọn trong picker
  const [tempYear, setTempYear] = useState(parsed.year);
  const [tempMonth, setTempMonth] = useState(parsed.month);
  
  // Flag để biết user vừa chọn năm xong (cần hỏi tháng)
  const [pendingYearChange, setPendingYearChange] = useState(false);

  // Format ngày hiển thị
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Click outside để đóng
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setPickerMode('calendar');
        setPendingYearChange(false);
      }
    };
    
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Reset view khi mở
  useEffect(() => {
    if (isOpen) {
      const p = parseDate(value);
      setViewYear(p.year);
      setViewMonth(p.month);
      setTempYear(p.year);
      setTempMonth(p.month);
      setPickerMode('calendar');
      setPendingYearChange(false);
    }
  }, [isOpen, value, parseDate]);

  const handleSelectDate = (day: number) => {
    const month = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    onChange(`${viewYear}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    // Không cho chọn qua tháng hiện tại của năm hiện tại
    if (viewYear === currentYear && viewMonth >= currentMonth) return;
    
    if (viewMonth === 11) {
      if (viewYear < currentYear) {
        setViewMonth(0);
        setViewYear(viewYear + 1);
      }
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleToday = () => {
    const month = String(currentMonth + 1).padStart(2, '0');
    const day = String(currentDay).padStart(2, '0');
    onChange(`${currentYear}-${month}-${day}`);
    setIsOpen(false);
  };

  // ========== Year Picker Logic ==========
  const handleOpenYearPicker = () => {
    setTempYear(viewYear);
    setPickerMode('year');
  };

  const handleYearSelect = (year: number) => {
    setTempYear(year);
  };

  const handleYearConfirm = () => {
    // Sau khi chọn năm → mở month picker
    setViewYear(tempYear);
    setTempMonth(viewMonth);
    
    // Nếu năm mới là năm hiện tại và tháng view > tháng hiện tại → reset
    if (tempYear === currentYear && viewMonth > currentMonth) {
      setTempMonth(currentMonth);
      setViewMonth(currentMonth);
    }
    
    setPendingYearChange(true);
    setPickerMode('month');
  };

  // ========== Month Picker Logic ==========
  const handleOpenMonthPicker = () => {
    setTempMonth(viewMonth);
    setTempYear(viewYear);
    setPendingYearChange(false); // Chọn tháng trực tiếp, không cần flow năm→tháng
    setPickerMode('month');
  };

  const handleMonthSelect = (month: number) => {
    setTempMonth(month);
  };

  const handleMonthConfirm = () => {
    // Validate
    let finalMonth = tempMonth;
    if (tempYear === currentYear && finalMonth > currentMonth) {
      finalMonth = currentMonth;
    }
    
    setViewMonth(finalMonth);
    if (pendingYearChange) {
      // Đã chọn năm trước đó, giờ apply luôn
      setViewYear(tempYear);
    }
    
    setPendingYearChange(false);
    setPickerMode('calendar');
  };

  // ========== Generate items cho pickers ==========
  const yearItems = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => {
      const year = currentYear - 49 + i;
      return { 
        value: year, 
        label: String(year),
        disabled: year > currentYear 
      };
    });
  }, [currentYear]);

  const monthItems = useMemo(() => {
    const targetYear = pickerMode === 'month' ? tempYear : viewYear;
    return MONTHS.map((label, idx) => ({
      value: idx,
      label,
      disabled: targetYear === currentYear && idx > currentMonth
    }));
  }, [tempYear, viewYear, pickerMode, currentYear, currentMonth]);

  // ========== Calendar grid ==========
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const days: (number | null)[] = [];
  
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isSelected = (day: number) => {
    if (!value) return false;
    const [y, m, d] = value.split('-').map(Number);
    return y === viewYear && m === viewMonth + 1 && d === day;
  };

  const isToday = (day: number) => {
    return currentYear === viewYear && currentMonth === viewMonth && currentDay === day;
  };

  const isFutureDate = (day: number) => {
    // So sánh với ngày hiện tại
    if (viewYear > currentYear) return true;
    if (viewYear === currentYear && viewMonth > currentMonth) return true;
    if (viewYear === currentYear && viewMonth === currentMonth && day > currentDay) return true;
    return false;
  };

  // Kiểm tra ngày có nhỏ hơn minDate không
  const isBeforeMinDate = (day: number) => {
    if (!minDate) return false;
    const [minYear, minMonth, minDay] = minDate.split('-').map(Number);
    
    if (viewYear < minYear) return true;
    if (viewYear === minYear && viewMonth < minMonth - 1) return true;
    if (viewYear === minYear && viewMonth === minMonth - 1 && day < minDay) return true;
    return false;
  };

  // Kiểm tra ngày có bị disabled không (tương lai hoặc trước minDate)
  const isDateDisabled = (day: number) => {
    return isFutureDate(day) || isBeforeMinDate(day);
  };

  // Disable nút next nếu đang ở tháng hiện tại
  const isNextDisabled = viewYear === currentYear && viewMonth >= currentMonth;

  // Tính toán vị trí dropdown để không bị tràn
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('left');
  
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownWidth = 300;
      const viewportWidth = window.innerWidth;
      
      // Nếu dropdown mở sang trái bị tràn ra ngoài viewport bên phải
      if (rect.left + dropdownWidth > viewportWidth - 20) {
        setDropdownPosition('right');
      } else {
        setDropdownPosition('left');
      }
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full h-11 px-4 pr-10 text-left text-[14px]
          bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-md)]
          transition-all duration-[180ms] ease-out cursor-pointer
          hover:border-[var(--text-3)]
          focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/15' : ''}
          ${value ? 'text-[var(--text-1)]' : 'text-[var(--text-3)]'}
        `}
      >
        {value ? formatDisplayDate(value) : placeholder}
        <svg 
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-3)] pointer-events-none"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute top-full z-[9999] mt-2 w-[300px] bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-xl)] overflow-hidden animate-gentle ${
          dropdownPosition === 'right' ? 'right-0' : 'left-0'
        }`}>
          
          {/* ==================== CALENDAR MODE ==================== */}
          {pickerMode === 'calendar' && (
            <>
              {/* Header với năm và tháng tách riêng */}
              <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border)]">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                >
                  <svg className="w-4 h-4 text-[var(--text-2)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Tháng - Click để đổi tháng */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleOpenMonthPicker}
                    className="px-2 py-1 rounded-lg hover:bg-[var(--surface-2)] transition-colors group"
                  >
                    <span className="font-semibold text-[var(--text-1)] group-hover:text-[var(--primary)]">
                      {MONTHS_SHORT[viewMonth]}
                    </span>
                    <svg className="inline-block ml-0.5 w-3 h-3 text-[var(--text-3)] group-hover:text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Năm - Click để đổi năm */}
                  <button
                    type="button"
                    onClick={handleOpenYearPicker}
                    className="px-2 py-1 rounded-lg hover:bg-[var(--surface-2)] transition-colors group"
                  >
                    <span className="font-semibold text-[var(--text-1)] group-hover:text-[var(--primary)]">
                      {viewYear}
                    </span>
                    <svg className="inline-block ml-0.5 w-3 h-3 text-[var(--text-3)] group-hover:text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={isNextDisabled}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-[var(--text-2)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Days header */}
              <div className="grid grid-cols-7 px-2 py-2 border-b border-[var(--border)]">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-[var(--text-3)] py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 p-2">
                {days.map((day, idx) => (
                  <div key={idx} className="aspect-square">
                    {day && (
                      <button
                        type="button"
                        onClick={() => !isDateDisabled(day) && handleSelectDate(day)}
                        disabled={isDateDisabled(day)}
                        className={`
                          w-full h-full flex items-center justify-center rounded-lg text-sm font-medium
                          transition-all duration-100
                          ${isDateDisabled(day)
                            ? 'text-[var(--text-3)]/40 cursor-not-allowed'
                            : isSelected(day)
                              ? 'bg-[var(--primary)] text-white'
                              : isToday(day)
                                ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/30'
                                : 'text-[var(--text-1)] hover:bg-[var(--surface-2)]'
                          }
                        `}
                      >
                        {day}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--border)] bg-[var(--surface-2)]">
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="px-3 py-1.5 text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
                >
                  Xóa
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-3 py-1.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors"
                >
                  Hôm nay
                </button>
              </div>
            </>
          )}

          {/* ==================== YEAR PICKER MODE ==================== */}
          {pickerMode === 'year' && (
            <>
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <h4 className="font-semibold text-[var(--text-1)] text-center">Chọn năm</h4>
              </div>
              
              <WheelPicker
                items={yearItems}
                selectedValue={tempYear}
                onSelect={handleYearSelect}
              />
              
              <div className="flex items-center justify-between px-3 py-3 border-t border-[var(--border)] bg-[var(--surface-2)]">
                <button
                  type="button"
                  onClick={() => setPickerMode('calendar')}
                  className="px-4 py-2 text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleYearConfirm}
                  className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Tiếp tục
                </button>
              </div>
            </>
          )}

          {/* ==================== MONTH PICKER MODE ==================== */}
          {pickerMode === 'month' && (
            <>
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <h4 className="font-semibold text-[var(--text-1)] text-center">
                  Chọn tháng {pendingYearChange && <span className="text-[var(--text-3)] font-normal">({tempYear})</span>}
                </h4>
              </div>
              
              <WheelPicker
                items={monthItems}
                selectedValue={tempMonth}
                onSelect={handleMonthSelect}
              />
              
              <div className="flex items-center justify-between px-3 py-3 border-t border-[var(--border)] bg-[var(--surface-2)]">
                <button
                  type="button"
                  onClick={() => {
                    if (pendingYearChange) {
                      // Quay lại year picker
                      setPickerMode('year');
                    } else {
                      setPickerMode('calendar');
                    }
                  }}
                  className="px-4 py-2 text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
                >
                  {pendingYearChange ? 'Quay lại' : 'Hủy'}
                </button>
                <button
                  type="button"
                  onClick={handleMonthConfirm}
                  className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
