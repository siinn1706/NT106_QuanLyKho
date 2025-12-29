/** DateSeparator - Hiển thị ngày phân cách giữa các nhóm tin nhắn
 *  Click vào để mở date picker
 */

import { memo } from 'react';
import { useThemeStore } from '../../theme/themeStore';

interface DateSeparatorProps {
  date: Date;
  onClick?: () => void;
}

function DateSeparator({ date, onClick }: DateSeparatorProps) {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  
  // Format ngày theo tiếng Việt
  const formatDate = (d: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time để so sánh chỉ ngày
    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Hôm nay';
    }
    if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Hôm qua';
    }
    
    // Định dạng: "Thứ X, DD tháng MM, YYYY" hoặc ngắn hơn nếu cùng năm
    const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const monthNames = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    
    const dayName = dayNames[d.getDay()];
    const day = d.getDate();
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    
    if (year === today.getFullYear()) {
      return `${dayName}, ${day} tháng ${month}`;
    }
    return `${dayName}, ${day} tháng ${month}, ${year}`;
  };
  
  return (
    <div className="flex items-center justify-center py-3">
      <button
        onClick={onClick}
        className={`
          px-4 py-1.5 rounded-full text-xs font-medium
          border backdrop-blur-md
          transition-all duration-150
          hover:scale-105 cursor-pointer
          ${isDarkMode 
            ? 'bg-zinc-800/70 border-white/10 text-zinc-300 hover:bg-zinc-700/80' 
            : 'bg-white/70 border-black/10 text-zinc-600 hover:bg-white/90'
          }
        `}
      >
        {formatDate(date)}
      </button>
    </div>
  );
}

export default memo(DateSeparator);
