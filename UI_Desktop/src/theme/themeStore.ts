/** Theme Store - Zustand store for app theme + chat theme
 *  Persists to localStorage
 *  Supports separate chat themes for light/dark mode
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  ACCENT_COLORS, 
  getAccentById, 
  DEFAULT_ACCENT_ID,
  type AccentColor 
} from './themeTokens';
import { 
  DEFAULT_CHAT_CONFIG, 
  type ChatThemeConfig 
} from './chatThemes';

interface ThemeStore {
  // App theme
  isDarkMode: boolean;
  accentId: string;
  
  // Chat theme riêng cho từng mode
  lightModeChatConfig: ChatThemeConfig;
  darkModeChatConfig: ChatThemeConfig;
  
  // Flag để biết đã sync với server chưa
  syncedWithServer: boolean;
  
  // Actions
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
  setAccent: (id: string) => void;
  
  // Cập nhật chat config theo current mode
  setChatConfig: (config: Partial<ChatThemeConfig>) => void;
  
  // Cập nhật chat config cho mode cụ thể
  setLightModeChatConfig: (config: Partial<ChatThemeConfig>) => void;
  setDarkModeChatConfig: (config: Partial<ChatThemeConfig>) => void;
  
  // Sync từ server
  syncFromServer: (data: {
    accentId: string;
    lightModeTheme: ChatThemeConfig;
    darkModeTheme: ChatThemeConfig;
  }) => void;
  
  resetToDefault: () => void;
  
  // Getters
  getAccent: () => AccentColor;
  getChatConfig: () => ChatThemeConfig; // Lấy config theo current mode
}

// Default chat config cho mỗi mode
const DEFAULT_LIGHT_CHAT_CONFIG: ChatThemeConfig = {
  gradientId: 'default',
  patternId: null,
  patternOpacity: 0.1,
  patternSizePx: 300,
  patternTint: 'rgba(255, 255, 255, 0.6)',
};

const DEFAULT_DARK_CHAT_CONFIG: ChatThemeConfig = {
  gradientId: 'default',
  patternId: null,
  patternOpacity: 0.1,
  patternSizePx: 300,
  patternTint: 'rgba(255, 255, 255, 0.6)',
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      accentId: DEFAULT_ACCENT_ID,
      lightModeChatConfig: DEFAULT_LIGHT_CHAT_CONFIG,
      darkModeChatConfig: DEFAULT_DARK_CHAT_CONFIG,
      syncedWithServer: false,
      
      setDarkMode: (value) => {
        if (value) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ isDarkMode: value });
      },
      
      toggleDarkMode: () => {
        const newMode = !get().isDarkMode;
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ isDarkMode: newMode });
      },
      
      setAccent: (id) => {
        const accent = getAccentById(id);
        // Apply accent CSS variables
        document.documentElement.style.setProperty('--primary', accent.value);
        document.documentElement.style.setProperty('--primary-hover', accent.hoverValue);
        document.documentElement.style.setProperty('--primary-active', accent.activeValue);
        document.documentElement.style.setProperty('--primary-light', accent.lightBg);
        set({ accentId: id });
      },
      
      // Cập nhật chat config theo current mode
      setChatConfig: (config) => {
        const isDark = get().isDarkMode;
        if (isDark) {
          set((state) => ({
            darkModeChatConfig: { ...state.darkModeChatConfig, ...config },
          }));
        } else {
          set((state) => ({
            lightModeChatConfig: { ...state.lightModeChatConfig, ...config },
          }));
        }
      },
      
      setLightModeChatConfig: (config) => {
        set((state) => ({
          lightModeChatConfig: { ...state.lightModeChatConfig, ...config },
        }));
      },
      
      setDarkModeChatConfig: (config) => {
        set((state) => ({
          darkModeChatConfig: { ...state.darkModeChatConfig, ...config },
        }));
      },
      
      // Sync từ server khi user đăng nhập
      syncFromServer: (data) => {
        const accent = getAccentById(data.accentId);
        document.documentElement.style.setProperty('--primary', accent.value);
        document.documentElement.style.setProperty('--primary-hover', accent.hoverValue);
        document.documentElement.style.setProperty('--primary-active', accent.activeValue);
        document.documentElement.style.setProperty('--primary-light', accent.lightBg);
        
        set({
          accentId: data.accentId,
          lightModeChatConfig: data.lightModeTheme,
          darkModeChatConfig: data.darkModeTheme,
          syncedWithServer: true,
        });
      },
      
      resetToDefault: () => {
        // Reset to defaults
        document.documentElement.classList.remove('dark');
        const defaultAccent = getAccentById(DEFAULT_ACCENT_ID);
        document.documentElement.style.setProperty('--primary', defaultAccent.value);
        document.documentElement.style.setProperty('--primary-hover', defaultAccent.hoverValue);
        document.documentElement.style.setProperty('--primary-active', defaultAccent.activeValue);
        document.documentElement.style.setProperty('--primary-light', defaultAccent.lightBg);
        
        set({
          isDarkMode: false,
          accentId: DEFAULT_ACCENT_ID,
          lightModeChatConfig: DEFAULT_LIGHT_CHAT_CONFIG,
          darkModeChatConfig: DEFAULT_DARK_CHAT_CONFIG,
          syncedWithServer: false,
        });
      },
      
      getAccent: () => getAccentById(get().accentId),
      
      // Lấy chat config theo current mode
      getChatConfig: () => {
        const state = get();
        return state.isDarkMode ? state.darkModeChatConfig : state.lightModeChatConfig;
      },
    }),
    {
      name: 'n3t-theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply persisted theme on load
          if (state.isDarkMode) {
            document.documentElement.classList.add('dark');
          }
          const accent = getAccentById(state.accentId);
          document.documentElement.style.setProperty('--primary', accent.value);
          document.documentElement.style.setProperty('--primary-hover', accent.hoverValue);
          document.documentElement.style.setProperty('--primary-active', accent.activeValue);
          document.documentElement.style.setProperty('--primary-light', accent.lightBg);
        }
      },
    }
  )
);

// Export accent colors for UI
export { ACCENT_COLORS };
