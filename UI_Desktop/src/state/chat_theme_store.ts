/** Chat Theme Store - Zustand
 *  Quản lý state theme cho chat interface
 *  - Gradient backgrounds hoặc SVG patterns
 *  - Persist vào localStorage
 *  - Hỗ trợ dark/light mode variants
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Theme types
export interface ChatTheme {
    id: string;
    name: string;
    type: 'gradient' | 'pattern' | 'solid';
    /** Path to background image, relative to src/assets/themes/ */
    backgroundLight: string;
    backgroundDark: string;
    /** Message bubble colors - applied to user messages */
    userBubbleColor: string;
    /** Accent color for UI elements */
    accentColor: string;
}

// Define all available themes
export const CHAT_THEMES: ChatTheme[] = [
    // ===== SOLID THEMES =====
    {
        id: 'default',
        name: 'Mặc định',
        type: 'solid',
        backgroundLight: '',
        backgroundDark: '',
        userBubbleColor: '#3B82F6', // Blue
        accentColor: '#3B82F6',
    },

    // ===== GRADIENT THEMES =====
    {
        id: 'gradient-autumn',
        name: 'Mùa Thu',
        type: 'gradient',
        backgroundLight: '/src/assets/themes/bg-gradient/Gradient=Autumn.png',
        backgroundDark: '/src/assets/themes/bg-gradient/Gradient=Autumn.png',
        userBubbleColor: '#D97706',
        accentColor: '#D97706',
    },
    {
        id: 'gradient-spring',
        name: 'Mùa Xuân',
        type: 'gradient',
        backgroundLight: '/src/assets/themes/bg-gradient/Gradient=Spring.png',
        backgroundDark: '/src/assets/themes/bg-gradient/Gradient=Spring.png',
        userBubbleColor: '#10B981',
        accentColor: '#10B981',
    },
    {
        id: 'gradient-summer',
        name: 'Mùa Hè',
        type: 'gradient',
        backgroundLight: '/src/assets/themes/bg-gradient/Gradient=Summer.png',
        backgroundDark: '/src/assets/themes/bg-gradient/Gradient=Summer.png',
        userBubbleColor: '#F59E0B',
        accentColor: '#F59E0B',
    },
    {
        id: 'gradient-polar',
        name: 'Cực Quang',
        type: 'gradient',
        backgroundLight: '/src/assets/themes/bg-gradient/Gradient=Polar Lights.png',
        backgroundDark: '/src/assets/themes/bg-gradient/Gradient=Polar Lights.png',
        userBubbleColor: '#8B5CF6',
        accentColor: '#8B5CF6',
    },
    {
        id: 'gradient-iridescent',
        name: 'Cầu Vồng',
        type: 'gradient',
        backgroundLight: '/src/assets/themes/bg-gradient/Gradient=Iridescent.png',
        backgroundDark: '/src/assets/themes/bg-gradient/Gradient=Iridescent.png',
        userBubbleColor: '#EC4899',
        accentColor: '#EC4899',
    },
    {
        id: 'gradient-frosty',
        name: 'Sương Sớm',
        type: 'gradient',
        backgroundLight: '/src/assets/themes/bg-gradient/Gradient=Frosty morning.png',
        backgroundDark: '/src/assets/themes/bg-gradient/Gradient=Frosty morning.png',
        userBubbleColor: '#06B6D4',
        accentColor: '#06B6D4',
    },
    {
        id: 'gradient-warm-winter',
        name: 'Đông Ấm',
        type: 'gradient',
        backgroundLight: '/src/assets/themes/bg-gradient/Gradient=Warm Winter.png',
        backgroundDark: '/src/assets/themes/bg-gradient/Gradient=Warm Winter.png',
        userBubbleColor: '#EF4444',
        accentColor: '#EF4444',
    },
    {
        id: 'gradient-fresh',
        name: 'Buổi Sáng',
        type: 'gradient',
        backgroundLight: '/src/assets/themes/bg-gradient/Gradient=Fresh morning.png',
        backgroundDark: '/src/assets/themes/bg-gradient/Gradient=Fresh morning.png',
        userBubbleColor: '#22C55E',
        accentColor: '#22C55E',
    },

    // ===== PATTERN THEMES =====
    {
        id: 'pattern-space',
        name: 'Không Gian',
        type: 'pattern',
        backgroundLight: '/src/assets/themes/light/tg-pattern-light/Theme=Space.svg',
        backgroundDark: '/src/assets/themes/dark/tg-pattern-dark/Theme=Space.svg',
        userBubbleColor: '#6366F1',
        accentColor: '#6366F1',
    },
    {
        id: 'pattern-space-cat',
        name: 'Mèo Vũ Trụ',
        type: 'pattern',
        backgroundLight: '/src/assets/themes/light/tg-pattern-light/Theme=Space Cat.svg',
        backgroundDark: '/src/assets/themes/dark/tg-pattern-dark/Theme=Space Cat.svg',
        userBubbleColor: '#A855F7',
        accentColor: '#A855F7',
    },
    {
        id: 'pattern-magic',
        name: 'Phép Thuật',
        type: 'pattern',
        backgroundLight: '/src/assets/themes/light/tg-pattern-light/Theme=Magic.svg',
        backgroundDark: '/src/assets/themes/dark/tg-pattern-dark/Theme=Magic.svg',
        userBubbleColor: '#8B5CF6',
        accentColor: '#8B5CF6',
    },
    {
        id: 'pattern-food',
        name: 'Ẩm Thực',
        type: 'pattern',
        backgroundLight: '/src/assets/themes/light/tg-pattern-light/Theme=Food.svg',
        backgroundDark: '/src/assets/themes/dark/tg-pattern-dark/Theme=Food.svg',
        userBubbleColor: '#F97316',
        accentColor: '#F97316',
    },
    {
        id: 'pattern-unicorn',
        name: 'Kỳ Lân',
        type: 'pattern',
        backgroundLight: '/src/assets/themes/light/tg-pattern-light/Theme=Unicorn.svg',
        backgroundDark: '/src/assets/themes/dark/tg-pattern-dark/Theme=Unicorn.svg',
        userBubbleColor: '#EC4899',
        accentColor: '#EC4899',
    },
    {
        id: 'pattern-sport',
        name: 'Thể Thao',
        type: 'pattern',
        backgroundLight: '/src/assets/themes/light/tg-pattern-light/Theme=Sport.svg',
        backgroundDark: '/src/assets/themes/dark/tg-pattern-dark/Theme=Sport.svg',
        userBubbleColor: '#10B981',
        accentColor: '#10B981',
    },
    {
        id: 'pattern-city',
        name: 'Thành Phố',
        type: 'pattern',
        backgroundLight: '/src/assets/themes/light/tg-pattern-light/Theme=T-City.svg',
        backgroundDark: '/src/assets/themes/dark/tg-pattern-dark/Theme=T-City.svg',
        userBubbleColor: '#0EA5E9',
        accentColor: '#0EA5E9',
    },
    {
        id: 'pattern-wizard',
        name: 'Phù Thủy',
        type: 'pattern',
        backgroundLight: '/src/assets/themes/light/tg-pattern-light/Theme=Wizard world.svg',
        backgroundDark: '/src/assets/themes/dark/tg-pattern-dark/Theme=Wizard world.svg',
        userBubbleColor: '#7C3AED',
        accentColor: '#7C3AED',
    },
    {
        id: 'pattern-cartoon-space',
        name: 'Hoạt Hình',
        type: 'pattern',
        backgroundLight: '/src/assets/themes/light/tg-pattern-light/Theme=Cartoon Space.svg',
        backgroundDark: '/src/assets/themes/dark/tg-pattern-dark/Theme=Cartoon Space.svg',
        userBubbleColor: '#3B82F6',
        accentColor: '#3B82F6',
    },
];

// Store interface
interface ChatThemeStore {
    selectedThemeId: string;
    setTheme: (themeId: string) => void;
    getCurrentTheme: () => ChatTheme;
}

export const useChatThemeStore = create<ChatThemeStore>()(
    persist(
        (set, get) => ({
            selectedThemeId: 'default',

            setTheme: (themeId: string) => {
                const theme = CHAT_THEMES.find(t => t.id === themeId);
                if (theme) {
                    set({ selectedThemeId: themeId });
                }
            },

            getCurrentTheme: () => {
                const { selectedThemeId } = get();
                return CHAT_THEMES.find(t => t.id === selectedThemeId) || CHAT_THEMES[0];
            },
        }),
        {
            name: 'n3t-chat-theme-storage',
        }
    )
);
