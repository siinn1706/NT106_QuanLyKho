/** Chat Themes - Model for chat gradient/pattern selection
 *  Telegram-like wallpaper system - ONLY for chat background
 */

import { 
  gradientAssets, 
  patternAssets, 
  getGradientById, 
  getPatternById,
  type GradientAsset,
  type PatternAsset 
} from './assetRegistry';

// Chat theme configuration
export interface ChatThemeConfig {
  gradientId: string;
  patternId: string | null; // null = no pattern overlay
  patternOpacity: number;   // 0.03 - 0.25
  patternSizePx: number;    // tile size, typically 200-400
  patternTint: string;      // color for pattern (usually white/black with opacity)
}

// Preset combinations for quick selection
export interface ChatPreset {
  id: string;
  label: string;
  config: ChatThemeConfig;
}

// Default chat theme settings
export const DEFAULT_CHAT_CONFIG: ChatThemeConfig = {
  gradientId: 'default', // Will resolve to default-light or default-dark based on mode
  patternId: null,
  patternOpacity: 0.08,
  patternSizePx: 300,
  patternTint: 'rgba(255, 255, 255, 0.6)',
};

// Generate presets from available assets (first 8 combinations)
export function generatePresets(): ChatPreset[] {
  const presets: ChatPreset[] = [];
  
  // Add single default preset - sẽ tự đổi theo light/dark mode
  presets.push({
    id: 'preset-default',
    label: 'Mặc định',
    config: {
      gradientId: 'default', // Special ID - will be resolved based on isDarkMode
      patternId: null,
      patternOpacity: 0,
      patternSizePx: 300,
      patternTint: 'rgba(255, 255, 255, 0.5)',
    },
  });
  
  // Create gradient + pattern combos
  const gradients = gradientAssets.slice(0, 6);
  const patterns = patternAssets.slice(0, 6);
  
  gradients.forEach((gradient, idx) => {
    const pattern = patterns[idx % patterns.length];
    if (pattern) {
      presets.push({
        id: `preset-${gradient.id}-${pattern.id}`,
        label: gradient.label,
        config: {
          gradientId: gradient.id,
          patternId: pattern.id,
          patternOpacity: 0.06,
          patternSizePx: 280,
          patternTint: 'rgba(255, 255, 255, 0.5)',
        },
      });
    }
  });
  
  return presets;
}

// Helper to build CSS for chat background
export function buildChatBackgroundStyle(
  config: ChatThemeConfig,
  isDarkMode: boolean
): React.CSSProperties {
  // Resolve 'default' gradientId based on mode
  const resolvedGradientId = config.gradientId === 'default' 
    ? (isDarkMode ? 'default-dark' : 'default-light')
    : config.gradientId;
  
  const gradient = getGradientById(resolvedGradientId);
  const pattern = config.patternId ? getPatternById(config.patternId) : null;
  
  // Layer 1: Gradient background
  let backgroundImage = '';
  if (gradient) {
    backgroundImage = `url(${gradient.src})`;
  } else {
    // Fallback solid gradient
    backgroundImage = isDarkMode
      ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
      : 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)';
  }
  
  return {
    backgroundImage,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
}

// Helper to build pattern overlay style (using mask)
export function buildPatternOverlayStyle(
  config: ChatThemeConfig,
  isDarkMode: boolean
): React.CSSProperties {
  if (!config.patternId) {
    return { display: 'none' };
  }
  
  const pattern = getPatternById(config.patternId);
  if (!pattern) {
    return { display: 'none' };
  }
  
  // Use correct SVG based on mode
  const patternSrc = isDarkMode ? pattern.srcDark : pattern.srcLight;
  // Adjust tint based on mode: dark patterns typically need white tint, light patterns need dark tint
  const defaultTint = isDarkMode 
    ? 'rgba(255, 255, 255, 0.7)' 
    : 'rgba(0, 0, 0, 0.4)';
  const tint = config.patternTint || defaultTint;
  
  return {
    position: 'absolute',
    inset: 0,
    backgroundColor: tint,
    opacity: config.patternOpacity,
    WebkitMaskImage: `url(${patternSrc})`,
    maskImage: `url(${patternSrc})`,
    WebkitMaskSize: `${config.patternSizePx}px`,
    maskSize: `${config.patternSizePx}px`,
    WebkitMaskRepeat: 'repeat',
    maskRepeat: 'repeat',
    pointerEvents: 'none',
  };
}

// Get all available gradients
export function getGradients(): GradientAsset[] {
  return gradientAssets;
}

// Get all available patterns
export function getPatterns(): PatternAsset[] {
  return patternAssets;
}

// Export the chat presets
export const CHAT_PRESETS = generatePresets();
