import { COLORS_LIGHT, COLORS_DARK } from '../../../constants/theme';

// Current light-palette surface/text/border tokens → their dark counterparts.
// Built from the theme so designs authored with today's tokens remap too.
const TOKEN_KEYS = [
  'appBackground', 'appBackgroundAlt', 'backgroundLighter', 'backgroundLight',
  'textDark', 'textMuted', 'textLight', 'border', 'borderPurple',
  'tealSoft', 'coralSoft', 'amberSoft', 'successBg', 'infoBg',
] as const;
const CURRENT_TOKEN_MAP: Record<string, string> = {};
for (const key of TOKEN_KEYS) {
  const light = COLORS_LIGHT[key].toLowerCase();
  if (!(light in CURRENT_TOKEN_MAP)) CURRENT_TOKEN_MAP[light] = COLORS_DARK[key];
}

/**
 * Utility to map common "light mode" colors to their dark mode equivalents
 * specifically for dynamically generated design documents.
 */
export function getThemeAwareColor(color: string | undefined, isDark: boolean): string {
  if (!color) return 'transparent';
  if (!isDark) return color;

  // Normalize color format
  let normalized = color.trim().toLowerCase();
  
  // Expand shorthand hex (e.g., #fff -> #ffffff)
  if (normalized.startsWith('#') && normalized.length === 4) {
    normalized = '#' + normalized[1] + normalized[1] + normalized[2] + normalized[2] + normalized[3] + normalized[3];
  }

  // Background mappings
  if (normalized === '#ffffff' || normalized === 'white' || normalized === '#fbf9ff' || normalized === '#f8f7ff' || normalized === '#f5f3ff') {
    return COLORS_DARK.appBackground;
  }

  // Soft background / Card background mappings
  if (normalized === '#f0ebff' || normalized === '#f8f5ff' || normalized === '#edf7fc' || normalized === '#fff8f2' || normalized === '#fff8f5') {
    return COLORS_DARK.backgroundLight;
  }

  // Primary/Main text mappings
  if (normalized === '#000000' || normalized === 'black' || normalized === '#2d2d44' || normalized === '#1a1a2e') {
    return COLORS_DARK.textDark;
  }

  // Muted/Secondary text mappings
  if (normalized === '#6b6b85' || normalized === '#8e8ea8' || normalized === '#a8a8b8') {
    return COLORS_DARK.textMuted;
  }

  // Border mappings
  if (normalized === '#e8e8f0' || normalized === '#e8e0f0' || normalized === '#f0f0f0' || normalized === '#e8e0ff') {
    return COLORS_DARK.borderCard;
  }

  // Input backgrounds
  if (normalized === '#f8f5ff') {
    return COLORS_DARK.inputBackground;
  }

  // Current palette tokens
  if (normalized in CURRENT_TOKEN_MAP) {
    return CURRENT_TOKEN_MAP[normalized];
  }

  return color;
}
