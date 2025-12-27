/** Theme Module - Central export for theme system */

export { useThemeStore, ACCENT_COLORS } from './themeStore';
export { 
  gradientAssets, 
  patternAssets, 
  patternCategories,
  getGradientById,
  getPatternById,
  type GradientAsset,
  type PatternAsset 
} from './assetRegistry';
export { 
  DEFAULT_CHAT_CONFIG,
  CHAT_PRESETS,
  buildChatBackgroundStyle,
  buildPatternOverlayStyle,
  getGradients,
  getPatterns,
  type ChatThemeConfig,
  type ChatPreset
} from './chatThemes';
export {
  ACCENT_COLORS as AccentColorsList,
  lightTokens,
  darkTokens,
  getTokens,
  getAccentById,
  DEFAULT_ACCENT_ID,
  type AccentColor
} from './themeTokens';
