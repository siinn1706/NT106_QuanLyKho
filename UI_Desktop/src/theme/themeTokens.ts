/** Theme Tokens - App color tokens and accent colors
 *  Separated from chat themes - applies to app chrome only
 */

// Available accent colors (professional, subtle)
export interface AccentColor {
  id: string;
  label: string;
  value: string;
  hoverValue: string;
  activeValue: string;
  lightBg: string; // For subtle backgrounds
}

export const ACCENT_COLORS: AccentColor[] = [
  {
    id: 'cyan',
    label: 'Xanh Cyan',
    value: '#00BCD4',
    hoverValue: '#00ACC1',
    activeValue: '#0097A7',
    lightBg: 'rgba(0, 188, 212, 0.12)',
  },
  {
    id: 'blue',
    label: 'Xanh Dương',
    value: '#3B82F6',
    hoverValue: '#2563EB',
    activeValue: '#1D4ED8',
    lightBg: 'rgba(59, 130, 246, 0.12)',
  },
  {
    id: 'violet',
    label: 'Tím',
    value: '#8B5CF6',
    hoverValue: '#7C3AED',
    activeValue: '#6D28D9',
    lightBg: 'rgba(139, 92, 246, 0.12)',
  },
  {
    id: 'emerald',
    label: 'Xanh Lục',
    value: '#10B981',
    hoverValue: '#059669',
    activeValue: '#047857',
    lightBg: 'rgba(16, 185, 129, 0.12)',
  },
  {
    id: 'orange',
    label: 'Cam',
    value: '#F97316',
    hoverValue: '#EA580C',
    activeValue: '#C2410C',
    lightBg: 'rgba(249, 115, 22, 0.12)',
  },
  {
    id: 'rose',
    label: 'Hồng',
    value: '#F43F5E',
    hoverValue: '#E11D48',
    activeValue: '#BE123C',
    lightBg: 'rgba(244, 63, 94, 0.12)',
  },
];

// Light theme tokens
export const lightTokens = {
  bg: '#F8FAFC',
  surface1: '#FFFFFF',
  surface2: '#F1F5F9',
  surface3: '#E2E8F0',
  text1: '#0F172A',
  text2: '#475569',
  text3: '#94A3B8',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  borderHover: '#CBD5E1',
  sidebarBg: '#FFFFFF',
  sidebarHover: '#F1F5F9',
  sidebarText: '#475569',
  inputBg: '#FFFFFF',
  inputBorder: '#E2E8F0',
};

// Dark theme tokens
export const darkTokens = {
  bg: '#0A0A0A',
  surface1: '#141414',
  surface2: '#1F1F1F',
  surface3: '#2A2A2A',
  text1: '#FAFAFA',
  text2: '#A1A1A1',
  text3: '#6B6B6B',
  textInverse: '#0A0A0A',
  border: '#262626',
  borderHover: '#3D3D3D',
  sidebarBg: '#141414',
  sidebarHover: '#1F1F1F',
  sidebarText: '#A1A1A1',
  inputBg: '#141414',
  inputBorder: '#262626',
};

// Get tokens based on mode
export function getTokens(isDark: boolean) {
  return isDark ? darkTokens : lightTokens;
}

// Get accent by ID
export function getAccentById(id: string): AccentColor {
  return ACCENT_COLORS.find((a) => a.id === id) || ACCENT_COLORS[0];
}

export const DEFAULT_ACCENT_ID = 'cyan';
