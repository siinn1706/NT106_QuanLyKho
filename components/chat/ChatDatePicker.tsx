/** ChatDatePicker - Modal với Calendar hiển thị trực tiếp
 *  Sử dụng logic calendar từ DatePicker component nhưng không có button trigger
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useThemeStore } from '../../theme/themeStore';
import Icon from '../ui/Icon';

interface ChatDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  availableDates: Date[]; // Các ngày có tin nhắn
}

const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS_SHORT = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ============================================
// Wheel Picker Component - iOS style
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
  const centerIndex = Math.floor(visibleCount / 2);
  const containerHeight = itemHeight * visibleCount;
  
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
    
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    
    scrollTimeoutRef.current = window.setTimeout(() => {
      isScrollingRef.current = false;
      const idx = Math.round(newScrollY / itemHeight);
      const clampedIdx = Math.max(0, Math.min(idx, items.length - 1));
      
      if (!items[clampedIdx].disabled) {
        onSelect(items[clampedIdx].value);
      }
      
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

  const getItemStyle = useCallback((index: number): React.CSSProperties => {
    const currentCenterIdx = scrollY / itemHeight;
    const distanceFromCenter = Math.abs(index - currentCenterIdx);
    const maxDist = centerIndex + 0.5;
    const normalizedDist = Math.min(distanceFromCenter / maxDist, 1);
    
    const scale = 1.25 - normalizedDist * 0.55;
    const opacity = 1 - normalizedDist * 0.7;
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
    <div className="relative overflow-hidden" style={{ height: containerHeight }}>
      <div 
        className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
        style={{
          height: itemHeight * 1.2,
          background: 'linear-gradient(to bottom, var(--surface-1) 0%, transparent 100%)'
        }}
      />
      <div 
        className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
        style={{
          height: itemHeight * 1.2,
          background: 'linear-gradient(to top, var(--surface-1) 0%, transparent 100%)'
        }}
      />
      <div 
        className="absolute left-4 right-4 z-10 rounded-xl border-2 border-[var(--primary)]/40 pointer-events-none"
        style={{ top: itemHeight * centerIndex, height: itemHeight }}
      />
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-none relative z-30"
        onScroll={handleScroll}
      >
        <div style={{ height: itemHeight * centerIndex }} />
        {items.map((item, idx) => (
          <div
            key={item.value}
            className={`flex items-center justify-center cursor-pointer select-none ${item.disabled ? 'pointer-events-none' : ''}`}
            style={{ height: itemHeight, ...getItemStyle(idx) }}
            onClick={() => {
              if (item.disabled) return;
              onSelect(item.value);
              if (containerRef.current) {
                containerRef.current.scrollTo({ top: idx * itemHeight, behavior: 'smooth' });
              }
            }}
          >
            <span className={`whitespace-nowrap transition-colors duration-100 ${
              item.disabled ? 'text-[var(--text-3)]/30' 
                : item.value === selectedValue ? 'text-[var(--text-1)]' : 'text-[var(--text-2)]'
            }`}>
              {item.label}
            </span>
          </div>
        ))}
        <div style={{ height: itemHeight * centerIndex }} />
      </div>
    </div>
  );
}

// ============================================
// Main ChatDatePicker Component
// ============================================
export default function ChatDatePicker({ isOpen, onClose, onSelectDate, availableDates }: ChatDatePickerProps) {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  
  // pickerMode: 'calendar' | 'year' | 'month'
  const [pickerMode, setPickerMode] = useState<'calendar' | 'year' | 'month'>('calendar');

  const { currentYear, currentMonth, currentDay } = useMemo(() => {
    const now = new Date();
    return { currentYear: now.getFullYear(), currentMonth: now.getMonth(), currentDay: now.getDate() };
  }, []);

  // Ngày gần nhất có tin nhắn
  const latestDate = useMemo(() => {
    if (availableDates.length === 0) return new Date();
    return [...availableDates].sort((a, b) => b.getTime() - a.getTime())[0];
  }, [availableDates]);

  const [viewYear, setViewYear] = useState(latestDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(latestDate.getMonth());
  const [tempYear, setTempYear] = useState(latestDate.getFullYear());
  const [tempMonth, setTempMonth] = useState(latestDate.getMonth());
  const [pendingYearChange, setPendingYearChange] = useState(false);

  // Reset khi mở modal
  useEffect(() => {
    if (isOpen) {
      setViewYear(latestDate.getFullYear());
      setViewMonth(latestDate.getMonth());
      setTempYear(latestDate.getFullYear());
      setTempMonth(latestDate.getMonth());
      setPickerMode('calendar');
      setPendingYearChange(false);
    }
  }, [isOpen, latestDate]);

  // Set các ngày có tin nhắn để highlight
  const availableDateSet = useMemo(() => {
    const set = new Set<string>();
    availableDates.forEach(d => {
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return set;
  }, [availableDates]);

  const hasMessages = (year: number, month: number, day: number) => {
    return availableDateSet.has(`${year}-${month}-${day}`);
  };

  const handleSelectDate = (day: number) => {
    if (hasMessages(viewYear, viewMonth, day)) {
      onSelectDate(new Date(viewYear, viewMonth, day));
      onClose();
    }
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
    onSelectDate(new Date(currentYear, currentMonth, currentDay));
    onClose();
  };

  // Year picker
  const handleOpenYearPicker = () => {
    setTempYear(viewYear);
    setPickerMode('year');
  };

  const handleYearConfirm = () => {
    setViewYear(tempYear);
    setTempMonth(viewMonth);
    if (tempYear === currentYear && viewMonth > currentMonth) {
      setTempMonth(currentMonth);
      setViewMonth(currentMonth);
    }
    setPendingYearChange(true);
    setPickerMode('month');
  };

  // Month picker
  const handleOpenMonthPicker = () => {
    setTempMonth(viewMonth);
    setPickerMode('month');
  };

  const handleMonthConfirm = () => {
    setViewMonth(tempMonth);
    if (pendingYearChange) {
      setViewYear(tempYear);
    }
    setPendingYearChange(false);
    setPickerMode('calendar');
  };

  // Year items (10 năm trước đến năm hiện tại)
  const yearItems = useMemo(() => {
    const items = [];
    for (let y = currentYear - 10; y <= currentYear; y++) {
      items.push({ value: y, label: String(y) });
    }
    return items;
  }, [currentYear]);

  // Month items
  const monthItems = useMemo(() => {
    const targetYear = pendingYearChange ? tempYear : viewYear;
    return MONTHS.map((label, idx) => ({
      value: idx,
      label,
      disabled: targetYear === currentYear && idx > currentMonth
    }));
  }, [tempYear, viewYear, pendingYearChange, currentYear, currentMonth]);

  // Calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const days: (number | null)[] = [];
  
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const isToday = (day: number) => currentYear === viewYear && currentMonth === viewMonth && currentDay === day;
  const isFutureDate = (day: number) => {
    if (viewYear > currentYear) return true;
    if (viewYear === currentYear && viewMonth > currentMonth) return true;
    if (viewYear === currentYear && viewMonth === currentMonth && day > currentDay) return true;
    return false;
  };
  const isNextDisabled = viewYear === currentYear && viewMonth >= currentMonth;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - Liquid Glass overlay */}
      <div className="absolute inset-0 liquid-glass-overlay" onClick={onClose} />
      
      {/* Modal - Liquid Glass card */}
      <div className="relative w-[320px] rounded-2xl liquid-glass-card overflow-hidden animate-glass-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]/50">
          <span className="font-semibold text-[var(--text-1)]">Chọn ngày</span>
          <button
            onClick={onClose}
            className="p-2 rounded-full liquid-glass-icon-btn"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        {/* ==================== CALENDAR MODE ==================== */}
        {pickerMode === 'calendar' && (
          <>
            {/* Navigation header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border)]">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] transition-colors"
              >
                <Icon name="chevron-left" size="sm" className="text-[var(--text-2)]" />
              </button>
              
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
                <Icon name="chevron-right" size="sm" className="text-[var(--text-2)]" />
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
                      onClick={() => handleSelectDate(day)}
                      disabled={isFutureDate(day) || !hasMessages(viewYear, viewMonth, day)}
                      className={`
                        w-full h-full flex items-center justify-center rounded-lg text-sm font-medium
                        transition-all duration-100
                        ${isFutureDate(day) || !hasMessages(viewYear, viewMonth, day)
                          ? 'text-[var(--text-3)]/40 cursor-not-allowed'
                          : isToday(day)
                            ? 'bg-[var(--primary)] text-white'
                            : hasMessages(viewYear, viewMonth, day)
                              ? 'text-[var(--text-1)] hover:bg-[var(--surface-2)] font-semibold ring-2 ring-[var(--primary)]/30'
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
            <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--border)]/50 bg-[var(--surface-2)]/50">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm liquid-glass-btn-secondary rounded-lg"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1.5 text-sm font-medium liquid-glass-btn text-white rounded-lg"
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
              onSelect={setTempYear}
            />
            
            <div className="flex items-center justify-between px-3 py-3 border-t border-[var(--border)]/50 bg-[var(--surface-2)]/50">
              <button
                type="button"
                onClick={() => setPickerMode('calendar')}
                className="px-4 py-2 text-sm liquid-glass-btn-secondary rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleYearConfirm}
                className="px-4 py-2 text-sm font-medium liquid-glass-btn text-white rounded-lg"
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
              onSelect={setTempMonth}
            />
            
            <div className="flex items-center justify-between px-3 py-3 border-t border-[var(--border)]/50 bg-[var(--surface-2)]/50">
              <button
                type="button"
                onClick={() => {
                  if (pendingYearChange) {
                    setPickerMode('year');
                  } else {
                    setPickerMode('calendar');
                  }
                }}
                className="px-4 py-2 text-sm liquid-glass-btn-secondary rounded-lg"
              >
                {pendingYearChange ? 'Quay lại' : 'Hủy'}
              </button>
              <button
                type="button"
                onClick={handleMonthConfirm}
                className="px-4 py-2 text-sm font-medium liquid-glass-btn text-white rounded-lg"
              >
                Xác nhận
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
