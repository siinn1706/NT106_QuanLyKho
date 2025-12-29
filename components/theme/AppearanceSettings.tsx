/** AppearanceSettings - Theme picker UI for Settings modal
 *  Section 1: App theme (light/dark + accent color)
 *  Section 2: Chat theme (gradient + pattern selection) - riêng cho mỗi mode
 */

import { useState, memo, useCallback } from 'react';
import { useThemeStore, ACCENT_COLORS } from '../../theme/themeStore';
import { 
  getGradients, 
  getPatterns, 
  type ChatThemeConfig 
} from '../../theme/chatThemes';
import { gradientAssets, patternAssets } from '../../theme/assetRegistry';
import GradientPreviewCard from './GradientPreviewCard';
import PatternPreviewCard from './PatternPreviewCard';
import ChatWallpaperPreview from './ChatWallpaperPreview';
import Icon from '../ui/Icon';

type ChatTab = 'presets' | 'gradients' | 'patterns';

function AppearanceSettings() {
  const { 
    isDarkMode, 
    setDarkMode, 
    accentId, 
    setAccent, 
    getChatConfig, // Lấy config theo current mode
    setChatConfig, // Sẽ tự động set vào light/dark config tương ứng
    resetToDefault 
  } = useThemeStore();
  
  // Lấy chatConfig cho current mode
  const chatConfig = getChatConfig();
  
  const [activeTab, setActiveTab] = useState<ChatTab>('gradients');
  
  const handleGradientSelect = useCallback((id: string) => {
    setChatConfig({ gradientId: id });
  }, [setChatConfig]);
  
  const handlePatternSelect = useCallback((id: string | null) => {
    // Auto-adjust tint based on current mode when selecting pattern
    const tint = isDarkMode 
      ? 'rgba(255, 255, 255, 0.7)' 
      : 'rgba(0, 0, 0, 0.4)';
    setChatConfig({ patternId: id, patternTint: tint });
  }, [setChatConfig, isDarkMode]);
  
  const handlePatternOpacityChange = useCallback((value: number) => {
    setChatConfig({ patternOpacity: value });
  }, [setChatConfig]);
  
  return (
    <div className="space-y-8">
      {/* Section 1: App Theme */}
      <section>
        <h3 className={`text-sm font-semibold mb-4 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Màu giao diện ứng dụng
        </h3>
        
        {/* Light/Dark toggle with glass effect */}
        <div className="flex items-center justify-between mb-6">
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Chế độ tối
          </span>
          <button
            onClick={() => setDarkMode(!isDarkMode)}
            className={`
              relative w-12 h-7 rounded-full transition-all duration-200 backdrop-blur-sm
              ${isDarkMode 
                ? 'bg-[var(--primary)] shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]' 
                : 'bg-gray-300/80'
              }
            `}
          >
            <div className={`
              absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm
              transition-transform duration-200
              ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}
            `} />
          </button>
        </div>
        
        {/* Accent color picker with glass effect */}
        <div className="space-y-3">
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Màu nhấn
          </span>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((accent) => (
              <button
                key={accent.id}
                onClick={() => setAccent(accent.id)}
                className={`
                  w-9 h-9 rounded-full transition-all duration-200 backdrop-blur-sm
                  ${accentId === accent.id 
                    ? 'ring-2 ring-offset-2 ring-offset-[var(--surface-1)] scale-110 shadow-[0_0_12px_var(--tw-ring-color)]' 
                    : 'hover:scale-105 hover:ring-1 hover:ring-white/30'
                  }
                  }
                `}
                style={{ 
                  backgroundColor: accent.value,
                  '--tw-ring-color': accent.value,
                } as React.CSSProperties}
                title={accent.label}
              >
                {accentId === accent.id && (
                  <Icon name="check" size="xs" className="text-white mx-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>
      
      {/* Divider with glass effect */}
      <div className={`h-px ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
      
      {/* Section 2: Chat Theme */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Theme chat
          </h3>
          <button
            onClick={resetToDefault}
            className="liquid-glass-btn-secondary text-xs px-3 py-1.5"
          >
            Khôi phục mặc định
          </button>
        </div>
        
        {/* Live preview */}
        <div className="mb-6">
          <span className={`text-xs mb-2 block ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Xem trước
          </span>
          <ChatWallpaperPreview 
            config={chatConfig} 
            className="h-40 border border-[var(--border)] rounded-xl"
          />
        </div>
        
        {/* Tab navigation with glass effect */}
        <div className={`
          flex gap-1 p-1 rounded-xl backdrop-blur-sm mb-4
          ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}
        `}>
          {(['gradients', 'patterns'] as ChatTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 backdrop-blur-sm
                ${activeTab === tab
                  ? isDarkMode 
                    ? 'bg-white/15 text-white border border-white/20' 
                    : 'bg-white/90 text-gray-900 border border-black/10'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-white/5'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
                }
              `}
            >
              {tab === 'gradients' ? 'Gradient' : 'Pattern'}
            </button>
          ))}
        </div>
        
        {/* Pattern opacity slider (only when pattern selected) */}
        {activeTab === 'patterns' && chatConfig.patternId && (
          <div className="mb-4 flex items-center gap-4">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Độ mờ:
            </span>
            <input
              type="range"
              min={0.02}
              max={0.25}
              step={0.01}
              value={chatConfig.patternOpacity}
              onChange={(e) => handlePatternOpacityChange(parseFloat(e.target.value))}
              className="flex-1 accent-[var(--primary)]"
            />
            <span className={`text-xs w-10 text-right ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {Math.round(chatConfig.patternOpacity * 100)}%
            </span>
          </div>
        )}
        
        {/* Gradients grid */}
        {activeTab === 'gradients' && (
          <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
            {/* Default option - tự đổi theo light/dark mode */}
            <button
              onClick={() => handleGradientSelect('default')}
              className={`
                relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer
                transition-all duration-150 ease-out border-2
                ${chatConfig.gradientId === 'default'
                  ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
                  : 'border-transparent hover:border-[var(--border-hover)]'
                }
              `}
              title="Mặc định"
            >
              <div 
                className="absolute inset-0"
                style={{
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                    : 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)'
                }}
              />
              <div className={`
                absolute bottom-0 left-0 right-0 px-2 py-1.5
                ${isDarkMode ? 'bg-black/60' : 'bg-white/80'}
                backdrop-blur-sm
              `}>
                <span className={`text-xs font-medium truncate block ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Mặc định
                </span>
              </div>
              {chatConfig.gradientId === 'default' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-sm">
                  <Icon name="check" size="xs" className="text-white" />
                </div>
              )}
            </button>
            
            {/* Filter gradients: Dark mode shows Polar Lights, Light mode shows others */}
            {gradientAssets
              .filter((gradient) => {
                const isDarkTheme = gradient.id === 'polar-lights';
                return isDarkMode ? isDarkTheme : !isDarkTheme;
              })
              .map((gradient) => (
              <GradientPreviewCard
                key={gradient.id}
                id={gradient.id}
                label={gradient.label}
                src={gradient.src}
                isSelected={chatConfig.gradientId === gradient.id}
                onSelect={() => handleGradientSelect(gradient.id)}
              />
            ))}
          </div>
        )}
        
        {/* Patterns grid */}
        {activeTab === 'patterns' && (
          <div className="space-y-3">
            {/* No pattern option with glass effect */}
            <button
              onClick={() => handlePatternSelect(null)}
              className={`
                w-full px-4 py-2.5 rounded-xl text-sm text-left transition-all duration-200 backdrop-blur-sm
                border
                ${chatConfig.patternId === null
                  ? 'border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]'
                  : isDarkMode 
                    ? 'border-white/10 hover:border-white/25 hover:bg-white/5' 
                    : 'border-black/10 hover:border-black/20 hover:bg-black/5'
                }
                ${isDarkMode ? 'text-white' : 'text-gray-700'}
              `}
            >
              Không dùng pattern
            </button>
            
            <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-1">
              {patternAssets.map((pattern) => (
                <PatternPreviewCard
                  key={pattern.id}
                  id={pattern.id}
                  label={pattern.label}
                  srcLight={pattern.srcLight}
                  srcDark={pattern.srcDark}
                  isSelected={chatConfig.patternId === pattern.id}
                  onSelect={() => handlePatternSelect(pattern.id)}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default memo(AppearanceSettings);
