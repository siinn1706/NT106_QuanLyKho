/** PatternPreviewCard - Preview card for SVG pattern selection */

import { memo, useMemo } from 'react';
import { useThemeStore } from '../../theme/themeStore';
import Icon from '../ui/Icon';

interface PatternPreviewCardProps {
  id: string;
  label: string;
  srcLight: string;
  srcDark: string;
  isSelected: boolean;
  onSelect: () => void;
}

function PatternPreviewCard({ 
  id, 
  label, 
  srcLight, 
  srcDark, 
  isSelected, 
  onSelect 
}: PatternPreviewCardProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  
  const patternStyle = useMemo(() => {
    const src = isDarkMode ? srcDark : srcLight;
    return {
      position: 'absolute' as const,
      inset: 0,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
      opacity: 0.15,
      WebkitMaskImage: `url(${src})`,
      maskImage: `url(${src})`,
      WebkitMaskSize: '120px',
      maskSize: '120px',
      WebkitMaskRepeat: 'repeat',
      maskRepeat: 'repeat',
    };
  }, [isDarkMode, srcLight, srcDark]);
  
  return (
    <button
      onClick={onSelect}
      className={`
        relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer
        transition-all duration-150 ease-out
        border-2
        ${isSelected
          ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
          : 'border-transparent hover:border-[var(--border-hover)]'
        }
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50
      `}
      title={label}
    >
      {/* Background base color */}
      <div className={`absolute inset-0 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-zinc-800 to-zinc-900' 
          : 'bg-gradient-to-br from-slate-100 to-slate-200'
      }`} />
      
      {/* Pattern overlay using mask */}
      <div style={patternStyle} />
      
      {/* Label overlay */}
      <div className={`
        absolute bottom-0 left-0 right-0 px-2 py-1.5
        ${isDarkMode ? 'bg-black/60' : 'bg-white/80'}
        backdrop-blur-sm
      `}>
        <span className={`text-xs font-medium truncate block ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          {label}
        </span>
      </div>
      
      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-sm">
          <Icon name="check" size="xs" className="text-white" />
        </div>
      )}
    </button>
  );
}

export default memo(PatternPreviewCard);
