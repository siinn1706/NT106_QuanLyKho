/** ChatBackground - Layered chat background with gradient + pattern
 *  Only used in Chat container, NOT applied to entire app
 *  Uses getChatConfig() to get config based on current mode (light/dark)
 */

import { memo, useMemo } from 'react';
import { useThemeStore } from '../../theme/themeStore';
import { 
  buildChatBackgroundStyle, 
  buildPatternOverlayStyle 
} from '../../theme/chatThemes';

interface ChatBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

function ChatBackground({ children, className = '' }: ChatBackgroundProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  // Lấy chat config theo current mode
  const chatConfig = useThemeStore((s) => s.getChatConfig());
  
  const backgroundStyle = useMemo(
    () => buildChatBackgroundStyle(chatConfig, isDarkMode),
    [chatConfig.gradientId, isDarkMode]
  );
  
  const patternStyle = useMemo(
    () => buildPatternOverlayStyle(chatConfig, isDarkMode),
    [chatConfig.patternId, chatConfig.patternOpacity, chatConfig.patternSizePx, chatConfig.patternTint, isDarkMode]
  );
  
  return (
    <div className={`relative ${className}`}>
      {/* Layer 1: Gradient background - fixed position within container */}
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={backgroundStyle} 
      />
      
      {/* Layer 2: SVG pattern overlay (using CSS mask for tinting) */}
      <div className="z-0" style={patternStyle} />
      
      {/* Layer 3: Optional subtle noise (very light) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.015] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Content - render children directly, they control their own layout */}
      {children}
    </div>
  );
}

export default memo(ChatBackground);
