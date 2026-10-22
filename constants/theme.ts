import { Platform, StyleSheet } from 'react-native';

type ShadowSpec = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Cross-platform elevation. On web, react-native-web deprecates the RN
 * `shadow*` props in favor of CSS `boxShadow`, so we emit that there; native
 * keeps `shadow*` + `elevation`. Spread the result into a style, or use it
 * directly as a shadow token. The return type is intentionally narrow (only
 * the shadow props) so spreading it into a style doesn't widen that style to
 * the full ViewStyle surface (which would clash with TextInput's TextStyle).
 */
export function shadow(spec: ShadowSpec): { boxShadow: string } | ShadowSpec {
  if (Platform.OS === 'web') {
    const { shadowColor, shadowOffset, shadowOpacity, shadowRadius } = spec;
    return {
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px ${hexToRgba(shadowColor, shadowOpacity)}`,
    };
  }
  return spec;
}

// ─── Color Palettes ──────────────────────────────────────────────

// Design System v1 — warm, healing, reassuring. Violet anchor + sage-teal &
// coral healing accents, warm neutrals. Existing keys keep their names so every
// useTheme() consumer re-skins automatically; new keys add the healing palette.
export const COLORS_LIGHT = {
  primary: '#6B5AD6',          // refined brand violet (AA on white)
  textDark: '#2C2A3A',         // warm near-black (ink)
  textMuted: '#5E5972',
  textLight: '#837D95',        // AA-safe secondary text
  border: '#EAE5F1',
  borderCard: '#EAE5F1',
  backgroundLight: '#E9E4FA',  // primary-soft (icon circles, badges)
  disabledText: '#A39DB5',
  white: '#FFFFFF',
  studentElementary: '#F59E0B',
  studentK8: '#0EA5E9',
  studentHS: '#6B5AD6',
  parent: '#EC4899',
  staff: '#66D9A6',
  inputPlaceholder: '#948EA8',
  inputBackground: '#F4F1F9',
  indicatorInactive: '#D2CCE0',
  accent: '#DE9A2E',           // warm amber
  info: '#4F9FCB',
  shadow: '#2C2A3A',           // warm-tinted shadow (was pure black)
  whiteOverlay75: 'rgba(255,255,255,0.75)',
  whiteOverlay80: 'rgba(255,255,255,0.8)',
  appBackground: '#FAF8FC',    // warm off-white
  appBackgroundAlt: '#F4F1F9',
  backgroundLighter: '#F5F2FD',
  borderPurple: '#E0D9F0',
  tabActiveBg: '#E9E4FA',
  disabledButton: '#DAD3E6',
  error: '#E06666',            // softened, never alarming
  warningBg: '#FBF1DE',
  warningText: '#96631A',
  offlineText: '#96631A',
  successBg: '#E7F4EE',
  successText: '#226B4A',
  // ── healing palette (new) ──
  teal: '#3C9A8D',
  tealSoft: '#D0ECE7',
  coral: '#DC6A50',
  coralSoft: '#FADDD4',
  amber: '#DE9A2E',
  amberSoft: '#FBF1DE',
  primarySoft: '#E9E4FA',
  destructive: '#E06666',
  success: '#3E9E77',
  warning: '#E29B3E',
  infoBg: '#E9F3F9',
  // ── solid fills that carry white text/icons (buttons, pills, avatars) ──
  // Same as the base color in light; deeper in dark so white stays readable.
  primaryFill: '#6B5AD6',
  tealFill: '#3C9A8D',
  successFill: '#3E9E77',
  destructiveFill: '#E06666',
};

export const COLORS_DARK = {
  primary: '#9A8CF2',
  textDark: '#ECE9F5',
  textMuted: '#A8A2BC',
  textLight: '#948EA8',
  border: '#322C42',
  borderCard: '#322C42',
  backgroundLight: '#2A2447',
  disabledText: '#6A6480',
  white: '#221E30',            // "surface" semantic in dark
  studentElementary: '#FBBF24',
  studentK8: '#38BDF8',
  studentHS: '#9A8CF2',
  parent: '#F472B6',
  staff: '#86EFAC',
  inputPlaceholder: '#6E6888',
  inputBackground: '#2A2539',
  indicatorInactive: '#3E3854',
  accent: '#F0BC63',
  info: '#6FB4DC',
  shadow: '#000000',
  whiteOverlay75: 'rgba(34,30,48,0.75)',
  whiteOverlay80: 'rgba(34,30,48,0.8)',
  appBackground: '#191622',    // warm-dark
  appBackgroundAlt: '#221E30',
  backgroundLighter: '#2A2539',
  borderPurple: '#3A3352',
  tabActiveBg: '#2E2850',
  disabledButton: '#2E2842',
  error: '#E88787',
  warningBg: '#2A2413',
  warningText: '#E0B058',
  offlineText: '#E0B058',
  successBg: '#14271D',
  successText: '#5CBB92',
  // ── healing palette (new) ──
  teal: '#63C6B8',
  tealSoft: '#183630',
  coral: '#F49A82',
  coralSoft: '#3A241E',
  amber: '#F0BC63',
  amberSoft: '#332811',
  primarySoft: '#2A2447',
  destructive: '#E88787',
  success: '#5CBB92',
  warning: '#E0B058',
  infoBg: '#122430',
  // ── solid fills that carry white text/icons (white ≥ 4.4:1 on each) ──
  primaryFill: '#7462D8',
  tealFill: '#2F8578',
  successFill: '#2F8A63',
  destructiveFill: '#C94F4F',
};

export type ThemeColors = typeof COLORS_LIGHT;

// ─── Gradient Palettes ───────────────────────────────────────────

export const GRADIENTS_LIGHT = {
  primaryButton: ['#7E6BEE', '#6E5CD8', '#6152C4'] as const,
  authHeader: ['#7E6BEE', '#6B5AD6', '#5D4BC0'] as const,
  progressFill: ['#6B5AD6', '#8271EC'] as const,
  screenBackground: ['#FAF8FC', '#FFFFFF', '#FBF7FC'] as const,
  disabledButton: ['#DAD3E6', '#D2CBE0'] as const,
};

export const GRADIENTS_DARK = {
  primaryButton: ['#7866E0', '#7060D6', '#6552C8'] as const,
  authHeader: ['#7866E0', '#6E5CD8', '#5D4BC0'] as const,
  progressFill: ['#9A8CF2', '#A99BF6'] as const,
  screenBackground: ['#211C33', '#191622', '#1E1A2C'] as const,
  disabledButton: ['#2E2842', '#28233C'] as const,
};

export type ThemeGradients = typeof GRADIENTS_LIGHT | typeof GRADIENTS_DARK;

// ─── Shadow Palettes ─────────────────────────────────────────────

// Raw shadow specs (RN `shadow*` + elevation). Softened & warm-tinted for the
// "lighten & refine" direction — shadows recede rather than announce themselves
// (the button glow drops from 0.4 to 0.18). These keep their numeric values on
// every platform; consumers that need raw numbers (e.g. the Konva design editor)
// read from SHADOW_SPECS_*. For applying to RN Views, use SHADOWS_* below, which
// emit CSS boxShadow on web.
export const SHADOW_SPECS_LIGHT = {
  card:         { shadowColor: '#2C2A3A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 3 },
  cardSelected: { shadowColor: '#6B5AD6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 18, elevation: 6 },
  button:       { shadowColor: '#6B5AD6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 5 },
  small:        { shadowColor: '#2C2A3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,  elevation: 3 },
  header:       { shadowColor: '#2C2A3A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  cardLarge:    { shadowColor: '#2C2A3A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.09, shadowRadius: 22, elevation: 6 },
  iconCircle:   { shadowColor: '#2C2A3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,  elevation: 2 },
} satisfies Record<string, ShadowSpec>;

export const SHADOW_SPECS_DARK = {
  card:         { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,  shadowRadius: 12, elevation: 4 },
  cardSelected: { shadowColor: '#9A8CF2', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3,  shadowRadius: 18, elevation: 6 },
  button:       { shadowColor: '#9A8CF2', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 16, elevation: 5 },
  small:        { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2,  shadowRadius: 8,  elevation: 4 },
  header:       { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 },
  cardLarge:    { shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3,  shadowRadius: 16, elevation: 6 },
  iconCircle:   { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2,  shadowRadius: 4,  elevation: 3 },
} satisfies Record<string, ShadowSpec>;

function toViewShadows<T extends Record<string, ShadowSpec>>(specs: T): { [K in keyof T]: ReturnType<typeof shadow> } {
  const out = {} as { [K in keyof T]: ReturnType<typeof shadow> };
  (Object.keys(specs) as (keyof T)[]).forEach((k) => { out[k] = shadow(specs[k]); });
  return out;
}

// View-ready shadow tokens: boxShadow on web, shadow*/elevation on native.
export const SHADOWS_LIGHT = toViewShadows(SHADOW_SPECS_LIGHT);
export const SHADOWS_DARK = toViewShadows(SHADOW_SPECS_DARK);

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

export type TextSizePreference = 'small' | 'default' | 'large';

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
  textSizePreference: TextSizePreference;
  setTextSizePreference: (pref: TextSizePreference) => void;
  fontScale: number;
};
