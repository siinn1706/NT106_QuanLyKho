/** ChatWallpaperPreview - Mini chat preview showing gradient + pattern */

import { memo, useMemo } from 'react';
import { useThemeStore } from '../../theme/themeStore';
import { 
  buildChatBackgroundStyle, 
  buildPatternOverlayStyle,
  type ChatThemeConfig 
} from '../../theme/chatThemes';

interface ChatWallpaperPreviewProps {
  config: ChatThemeConfig;
  className?: string;
}

function ChatWallpaperPreview({ config, className = '' }: ChatWallpaperPreviewProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  
  const backgroundStyle = useMemo(
    () => buildChatBackgroundStyle(config, isDarkMode),
    [config.gradientId, isDarkMode]
  );
  
  const patternStyle = useMemo(
    () => buildPatternOverlayStyle(config, isDarkMode),
    [config.patternId, config.patternOpacity, config.patternSizePx, config.patternTint, isDarkMode]
  );
  
  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      {/* Layer 1: Gradient */}
      <div className="absolute inset-0" style={backgroundStyle} />
      
      {/* Layer 2: Pattern overlay */}
      <div style={patternStyle} />
      
      {/* Mini chat bubbles preview */}
      <div className="relative z-10 p-4 flex flex-col gap-2 h-full justify-center">
        {/* Bot message */}
        <div className={`
          self-start max-w-[75%] px-3 py-2 rounded-2xl rounded-bl-sm text-xs
          ${isDarkMode 
            ? 'bg-zinc-800/90 text-white' 
            : 'bg-white/90 text-gray-800'
          }
          backdrop-blur-sm
        `}>
          Xin chào! 👋
        </div>
        
        {/* User message */}
        <div className="
          self-end max-w-[75%] px-3 py-2 rounded-2xl rounded-br-sm text-xs text-white
          bg-[var(--primary)]
        ">
          Chào bạn!
        </div>
        
        {/* Bot message */}
        <div className={`
          self-start max-w-[75%] px-3 py-2 rounded-2xl rounded-bl-sm text-xs
          ${isDarkMode 
            ? 'bg-zinc-800/90 text-white' 
            : 'bg-white/90 text-gray-800'
          }
          backdrop-blur-sm
        `}>
          Tôi có thể giúp gì?
        </div>
      </div>
    </div>
  );
}

export default memo(ChatWallpaperPreview);
