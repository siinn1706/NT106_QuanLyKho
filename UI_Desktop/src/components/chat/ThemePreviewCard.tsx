/** ThemePreviewCard - Component hiển thị preview theme trong Settings
 *  - Hiển thị thumbnail background
 *  - Hover effect với scale và glow
 *  - Selected state với checkmark
 */

import { ChatTheme } from '../../state/chat_theme_store';
import { useThemeStore } from '../../theme/themeStore';
import Icon from '../ui/Icon';

interface ThemePreviewCardProps {
    theme: ChatTheme;
    isSelected: boolean;
    onSelect: () => void;
}

export default function ThemePreviewCard({ theme, isSelected, onSelect }: ThemePreviewCardProps) {
    const isDarkMode = useThemeStore((state) => state.isDarkMode);

    // Get the appropriate background based on current mode
    const backgroundPath = isDarkMode ? theme.backgroundDark : theme.backgroundLight;

    // Determine background style
    const getBackgroundStyle = (): React.CSSProperties => {
        if (theme.type === 'solid' || !backgroundPath) {
            // Solid color background for default theme
            return {
                background: isDarkMode
                    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            };
        }

        return {
            backgroundImage: `url(${backgroundPath})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        };
    };

    return (
        <button
            onClick={onSelect}
            className={`
        relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-200 ease-out
        border-2
        ${isSelected
                    ? 'border-[var(--primary)] scale-[1.02]'
                    : 'border-transparent hover:border-[var(--border-hover)] hover:scale-[1.03]'
                }
        group
      `}
            title={theme.name}
        >
            {/* Background */}
            <div
                className="absolute inset-0"
                style={getBackgroundStyle()}
            />

            {/* Glass overlay for better readability */}
            <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/20' : 'bg-white/10'
                }`} />

            {/* Preview chat bubbles */}
            <div className="absolute inset-0 p-3 flex flex-col justify-center gap-2">
                {/* Bot message preview */}
                <div className={`self-start max-w-[70%] px-3 py-2 rounded-2xl rounded-bl-sm text-xs ${isDarkMode
                        ? 'bg-zinc-800/90 text-white'
                        : 'bg-white/90 text-gray-800'
                    }`}>
                    Xin chào!
                </div>

                {/* User message preview */}
                <div
                    className="self-end max-w-[70%] px-3 py-2 rounded-2xl rounded-br-sm text-xs text-white"
                    style={{ backgroundColor: theme.userBubbleColor }}
                >
                    Hi bạn
                </div>
            </div>

            {/* Theme name label */}
            <div className={`absolute bottom-0 left-0 right-0 px-2 py-2 text-center ${isDarkMode ? 'bg-black/60' : 'bg-white/80'
                }`}>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                    {theme.name}
                </span>
            </div>

            {/* Selected checkmark */}
            {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                    <Icon name="check" size="xs" className="text-white" />
                </div>
            )}

            {/* Hover glow effect */}
            <div className={`
        absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        pointer-events-none
      `} style={{
                    boxShadow: `0 0 20px ${theme.accentColor}40`,
                }} />
        </button>
    );
}
