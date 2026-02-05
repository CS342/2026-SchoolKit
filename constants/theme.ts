import { StyleSheet } from 'react-native';

// ─── Color Palettes ──────────────────────────────────────────────

export const COLORS_LIGHT = {
  primary: '#7B68EE',
  textDark: '#2D2D44',
  textMuted: '#6B6B85',
  textLight: '#8E8EA8',
  border: '#E8E0F0',
  borderCard: '#E8E8F0',
  backgroundLight: '#F0EBFF',
  disabledText: '#B0A8C8',
  white: '#FFFFFF',
  studentK8: '#0EA5E9',
  studentHS: '#7B68EE',
  parent: '#EC4899',
  staff: '#66D9A6',
  inputPlaceholder: '#A8A8B8',
  inputBackground: '#F8F5FF',
  indicatorInactive: '#C8C8D8',
  accent: '#F59E0B',
  info: '#3B82F6',
  shadow: '#000000',
  whiteOverlay75: 'rgba(255,255,255,0.75)',
  whiteOverlay80: 'rgba(255,255,255,0.8)',
  appBackground: '#FBF9FF',
  appBackgroundAlt: '#F8F7FF',
  backgroundLighter: '#F5F3FF',
  borderPurple: '#E8E0FF',
  tabActiveBg: '#EDE9FE',
  disabledButton: '#D8D8E8',
  error: '#EF4444',
  warningBg: '#FEF3C7',
  warningText: '#D97706',
  offlineText: '#92400E',
  successBg: '#D1FAE5',
  successText: '#065F46',
};

export const COLORS_DARK = {
  primary: '#8B78FF',
  textDark: '#E8E8F0',
  textMuted: '#9898B0',
  textLight: '#707088',
  border: '#2E2B45',
  borderCard: '#2A2A42',
  backgroundLight: '#2A2845',
  disabledText: '#5A5470',
  white: '#1C1C2E',
  studentK8: '#38BDF8',
  studentHS: '#8B78FF',
  parent: '#F472B6',
  staff: '#86EFAC',
  inputPlaceholder: '#606078',
  inputBackground: '#1E1E32',
  indicatorInactive: '#3A3A52',
  accent: '#FBBF24',
  info: '#60A5FA',
  shadow: '#000000',
  whiteOverlay75: 'rgba(28,28,46,0.75)',
  whiteOverlay80: 'rgba(28,28,46,0.8)',
  appBackground: '#121220',
  appBackgroundAlt: '#151528',
  backgroundLighter: '#1E1E32',
  borderPurple: '#2E2B45',
  tabActiveBg: '#2E2A50',
  disabledButton: '#2A2A42',
  error: '#F87171',
  warningBg: '#3D3520',
  warningText: '#FBBF24',
  offlineText: '#FBBF24',
  successBg: '#1A3A2A',
  successText: '#86EFAC',
};

export type ThemeColors = typeof COLORS_LIGHT;

// ─── Gradient Palettes ───────────────────────────────────────────

export const GRADIENTS_LIGHT = {
  screenBackground: ['#F8F5FF', '#FFFFFF', '#FFF5FA'] as const,
  disabledButton: ['#D8D0E8', '#D0C8E0'] as const,
};

export const GRADIENTS_DARK = {
  screenBackground: ['#1A1830', '#121220', '#1A1528'] as const,
  disabledButton: ['#2A2845', '#252540'] as const,
};

export type ThemeGradients = typeof GRADIENTS_LIGHT;

// ─── Shadow Palettes ─────────────────────────────────────────────

export const SHADOWS_LIGHT = {
  card: {
    shadowColor: '#2D2D44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardSelected: {
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  small: {
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardLarge: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  iconCircle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
};

export const SHADOWS_DARK = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  cardSelected: {
    shadowColor: '#8B78FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    shadowColor: '#8B78FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  cardLarge: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  iconCircle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
};

export type ThemeShadows = typeof SHADOWS_LIGHT;

// ─── Decorative Shapes (dark variant) ────────────────────────────

interface DecorativeShape {
  size: number;
  color: string;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export const DECORATIVE_SHAPES_DARK: Record<string, DecorativeShape[]> = {
  step: [
    { size: 180, color: 'rgba(139,120,255,0.06)', top: -60, right: -40 },
    { size: 120, color: 'rgba(139,120,255,0.04)', bottom: 100, left: -40 },
    { size: 90, color: 'rgba(196,92,214,0.04)', top: 360, right: -20 },
  ],
  auth: [
    { size: 160, color: 'rgba(139,120,255,0.06)', top: -40, left: -50 },
    { size: 100, color: 'rgba(139,120,255,0.04)', bottom: 200, right: -30 },
  ],
  confirm: [
    { size: 180, color: 'rgba(139,120,255,0.06)', top: -50, right: -40 },
    { size: 130, color: 'rgba(139,120,255,0.04)', bottom: 140, left: -50 },
    { size: 90, color: 'rgba(196,92,214,0.04)', top: 300, right: -20 },
  ],
  profile: [
    { size: 160, color: 'rgba(139,120,255,0.06)', top: -30, right: -50 },
    { size: 120, color: 'rgba(139,120,255,0.04)', top: 100, left: -40 },
    { size: 80, color: 'rgba(196,92,214,0.04)', top: 200, right: -10 },
  ],
  search: [
    { size: 160, color: 'rgba(139,120,255,0.06)', top: 80, right: -50 },
    { size: 120, color: 'rgba(139,120,255,0.04)', top: 400, left: -40 },
    { size: 80, color: 'rgba(196,92,214,0.04)', top: 250, right: -10 },
  ],
};

// ─── Dark cancer-card pastels ────────────────────────────────────

export const CARD_COLORS_DARK = [
  '#B03A34', // darker pink
  '#B8706B', // darker light pink
  '#B88A6A', // darker peach
  '#7EA85C', // darker mint
  '#5DA880', // darker light green
  '#6872A8', // darker periwinkle
  '#4A92A8', // darker light blue
  '#8A6A98', // darker lilac
];

// ─── Full Theme Type ─────────────────────────────────────────────

export type AppTheme = {
  colors: ThemeColors;
  gradients: ThemeGradients;
  shadows: ThemeShadows;
  isDark: boolean;
  appStyles: ReturnType<typeof import('./onboarding-theme').makeAppStyles>;
  sharedStyles: ReturnType<typeof import('./onboarding-theme').makeSharedStyles>;
  decorativeShapes: Record<string, DecorativeShape[]>;
  themePreference: 'system' | 'light' | 'dark';
  setThemePreference: (pref: 'system' | 'light' | 'dark') => void;
};
