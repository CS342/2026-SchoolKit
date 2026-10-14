// Color-token resolution for content blocks. Pure (no RN import) so validation
// and tests can use it too.
//
// Rule (matches the hand-built finances page): `primary` is the theme brand color
// and adapts to light/dark; the five accent hues are FIXED per-item data colors —
// the same hex in both themes — chosen to read well against light and dark surfaces.

import type { ColorToken } from './types';

export const ACCENT_HEX: Record<Exclude<ColorToken, 'primary'>, string> = {
  teal: '#3C9A8D',
  coral: '#DC6A50',
  amber: '#DE9A2E',
  indigo: '#6C7CE0',
  sky: '#4F9FCB',
};

export const COLOR_TOKENS: ColorToken[] = ['primary', 'teal', 'coral', 'amber', 'indigo', 'sky'];

export function isColorToken(v: unknown): v is ColorToken {
  return typeof v === 'string' && (COLOR_TOKENS as string[]).includes(v);
}

/**
 * Resolve a token to a hex. `primaryHex` is the current theme's primary
 * (`useTheme().colors.primary`), passed in so this stays free of RN/theme imports.
 */
export function resolveColor(token: ColorToken, primaryHex: string): string {
  return token === 'primary' ? primaryHex : ACCENT_HEX[token];
}

/** Append an 8-bit alpha (0..1) to a 6-digit hex, e.g. withAlpha('#3C9A8D', 0.1). */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(255, Math.round(alpha * 255)))
    .toString(16)
    .padStart(2, '0');
  return hex + a;
}
