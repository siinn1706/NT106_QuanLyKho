/** GradientPreviewCard - Preview card for gradient selection */

import { memo } from 'react';
import { useThemeStore } from '../../theme/themeStore';
import Icon from '../ui/Icon';

interface GradientPreviewCardProps {
  id: string;
  label: string;
  src: string;
  isSelected: boolean;
  onSelect: () => void;
}

function GradientPreviewCard({ id, label, src, isSelected, onSelect }: GradientPreviewCardProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  
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
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
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

export default memo(GradientPreviewCard);
