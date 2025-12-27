/** useThemeSync - Hook để sync theme preferences với backend
 *  - Khi user đăng nhập: load preferences từ server
 *  - Khi user thay đổi theme: save lên server
 */

import { useEffect, useCallback, useRef } from 'react';
import { useThemeStore } from '../theme/themeStore';
import { useAuthStore } from '../state/auth_store';
import {
  apiGetUserPreferences,
  apiUpdateUserPreferences,
  type ChatThemeConfig as ApiChatThemeConfig,
  type UserPreferencesUpdate,
} from '../app/api_client';
import type { ChatThemeConfig } from '../theme/chatThemes';

// Convert từ frontend ChatThemeConfig sang API format
function toApiChatConfig(config: ChatThemeConfig): ApiChatThemeConfig {
  return {
    gradient_id: config.gradientId,
    pattern_id: config.patternId,
    pattern_opacity: config.patternOpacity,
    pattern_size_px: config.patternSizePx,
    pattern_tint: config.patternTint,
  };
}

// Convert từ API format sang frontend ChatThemeConfig
function fromApiChatConfig(api: ApiChatThemeConfig): ChatThemeConfig {
  return {
    gradientId: api.gradient_id,
    patternId: api.pattern_id,
    patternOpacity: api.pattern_opacity,
    patternSizePx: api.pattern_size_px,
    patternTint: api.pattern_tint ?? 'rgba(255, 255, 255, 0.6)',
  };
}

export function useThemeSync() {
  const { user, token } = useAuthStore();
  const {
    accentId,
    lightModeChatConfig,
    darkModeChatConfig,
    syncFromServer,
    syncedWithServer,
  } = useThemeStore();
  
  // Track previous values để detect changes
  const prevAccentId = useRef(accentId);
  const prevLightConfig = useRef(lightModeChatConfig);
  const prevDarkConfig = useRef(darkModeChatConfig);
  
  // Flag để tránh sync loop
  const isSyncing = useRef(false);

  // Load preferences từ server khi đăng nhập
  useEffect(() => {
    if (!user || !token) return;
    if (syncedWithServer) return; // Đã sync rồi
    
    const loadFromServer = async () => {
      try {
        isSyncing.current = true;
        const prefs = await apiGetUserPreferences();
        
        syncFromServer({
          accentId: prefs.accent_id,
          lightModeTheme: fromApiChatConfig(prefs.light_mode_theme),
          darkModeTheme: fromApiChatConfig(prefs.dark_mode_theme),
        });
        
        console.log('[ThemeSync] Loaded preferences from server');
      } catch (error) {
        console.warn('[ThemeSync] Failed to load preferences:', error);
      } finally {
        isSyncing.current = false;
      }
    };
    
    loadFromServer();
  }, [user, token, syncFromServer, syncedWithServer]);
  
  // Save preferences lên server khi có thay đổi
  const saveToServer = useCallback(async () => {
    if (!user || !token) return;
    if (isSyncing.current) return;
    
    const update: UserPreferencesUpdate = {};
    
    // Kiểm tra xem có gì thay đổi không
    let hasChanges = false;
    
    if (accentId !== prevAccentId.current) {
      update.accent_id = accentId;
      prevAccentId.current = accentId;
      hasChanges = true;
    }
    
    if (JSON.stringify(lightModeChatConfig) !== JSON.stringify(prevLightConfig.current)) {
      update.light_mode_theme = toApiChatConfig(lightModeChatConfig);
      prevLightConfig.current = lightModeChatConfig;
      hasChanges = true;
    }
    
    if (JSON.stringify(darkModeChatConfig) !== JSON.stringify(prevDarkConfig.current)) {
      update.dark_mode_theme = toApiChatConfig(darkModeChatConfig);
      prevDarkConfig.current = darkModeChatConfig;
      hasChanges = true;
    }
    
    if (!hasChanges) return;
    
    try {
      await apiUpdateUserPreferences(update);
      console.log('[ThemeSync] Saved preferences to server');
    } catch (error) {
      console.warn('[ThemeSync] Failed to save preferences:', error);
    }
  }, [user, token, accentId, lightModeChatConfig, darkModeChatConfig]);
  
  // Debounce save để không gọi API quá nhiều
  useEffect(() => {
    if (!syncedWithServer) return; // Chỉ save sau khi đã sync từ server
    
    const timeout = setTimeout(saveToServer, 1000);
    return () => clearTimeout(timeout);
  }, [accentId, lightModeChatConfig, darkModeChatConfig, saveToServer, syncedWithServer]);
  
  return null;
}

export default useThemeSync;
