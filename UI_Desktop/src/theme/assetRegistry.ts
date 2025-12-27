/** Asset Registry - Auto-load theme assets using Vite's import.meta.glob
 *  Tự động quét và đăng ký tất cả gradients/patterns mà không cần hardcode
 */

// Import all gradient PNGs
const gradientModules = import.meta.glob<{ default: string }>(
  '../assets/themes/bg-gradient/*.png',
  { eager: true }
);

// Import all light pattern SVGs (nested folders)
const patternLightModules = import.meta.glob<{ default: string }>(
  '../assets/themes/light/**/*.svg',
  { eager: true }
);

// Import all dark pattern SVGs (nested folders)
const patternDarkModules = import.meta.glob<{ default: string }>(
  '../assets/themes/dark/**/*.svg',
  { eager: true }
);

export interface GradientAsset {
  id: string;
  label: string;
  src: string;
}

export interface PatternAsset {
  id: string;
  label: string;
  category: string; // folder name (tg-pattern-light, tg-pattern-2-light, etc.)
  srcLight: string;
  srcDark: string;
}

/**
 * Extract safe slug ID from file path
 * Example: "/src/assets/themes/bg-gradient/Gradient=Autumn.png" -> "gradient-autumn"
 */
function extractSlug(path: string): string {
  const filename = path.split('/').pop() || '';
  const nameWithoutExt = filename.replace(/\.(png|svg)$/i, '');
  
  // Remove common prefixes like "Gradient=", "Theme="
  const cleanName = nameWithoutExt
    .replace(/^(Gradient|Theme)=/i, '')
    .trim();
  
  // Convert to slug: lowercase, replace spaces and special chars with dash
  return cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extract display label from file path
 * Example: "Gradient=Frosty morning.png" -> "Frosty morning"
 */
function extractLabel(path: string): string {
  const filename = path.split('/').pop() || '';
  const nameWithoutExt = filename.replace(/\.(png|svg)$/i, '');
  
  // Remove common prefixes
  return nameWithoutExt
    .replace(/^(Gradient|Theme)=/i, '')
    .trim();
}

/**
 * Extract category from pattern path
 * Example: "/light/tg-pattern-2-light/Theme=Food.svg" -> "tg-pattern-2"
 */
function extractCategory(path: string): string {
  const match = path.match(/\/(tg-pattern-\d*-?)/);
  return match ? match[1].replace(/-$/, '') : 'default';
}

/**
 * Find matching dark version for a light pattern
 */
function findDarkMatch(lightPath: string): string | null {
  const filename = lightPath.split('/').pop() || '';
  
  // Search for same filename in dark patterns
  for (const [darkPath, module] of Object.entries(patternDarkModules)) {
    if (darkPath.endsWith(filename)) {
      return module.default;
    }
  }
  return null;
}

// Build gradient registry - filter out default variants (handled separately)
export const gradientAssets: GradientAsset[] = Object.entries(gradientModules)
  .map(([path, module]) => ({
    id: extractSlug(path),
    label: extractLabel(path),
    src: module.default,
  }))
  .filter((g) => g.id !== 'default-dark' && g.id !== 'default-light')
  .sort((a, b) => a.label.localeCompare(b.label));

// Keep all gradients including defaults for internal lookup
export const allGradientAssets: GradientAsset[] = Object.entries(gradientModules)
  .map(([path, module]) => ({
    id: extractSlug(path),
    label: extractLabel(path),
    src: module.default,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

// Build pattern registry (matched light/dark pairs)
export const patternAssets: PatternAsset[] = Object.entries(patternLightModules)
  .map(([lightPath, lightModule]) => {
    const darkSrc = findDarkMatch(lightPath);
    
    return {
      id: `pattern-${extractSlug(lightPath)}`,
      label: extractLabel(lightPath),
      category: extractCategory(lightPath),
      srcLight: lightModule.default,
      srcDark: darkSrc || lightModule.default, // Fallback to light if no dark version
    };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

// Get unique categories for filtering
export const patternCategories: string[] = [
  ...new Set(patternAssets.map((p) => p.category)),
].sort();

// Helper to get gradient by ID (includes defaults)
export function getGradientById(id: string): GradientAsset | undefined {
  return allGradientAssets.find((g) => g.id === id);
}

// Helper to get pattern by ID  
export function getPatternById(id: string): PatternAsset | undefined {
  return patternAssets.find((p) => p.id === id);
}

// Default values
export const DEFAULT_GRADIENT_ID = 'default-light';
export const DEFAULT_PATTERN_ID = patternAssets[0]?.id || '';
