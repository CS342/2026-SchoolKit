import { StyleSheet } from 'react-native';
import { COLORS_LIGHT, SHADOWS_LIGHT } from './theme';

// Brand gradients refreshed to the new violet + healing accents; the per-item
// role/accent gradients (data colors) are kept for identity.
export const GRADIENTS = {
  primaryButton: ['#7E6BEE', '#6E5CD8', '#6152C4'] as const,
  disabledButton: ['#DAD3E6', '#D2CBE0'] as const,
  welcomeHero: ['#7E6BEE', '#6B5AD6', '#8A5FD0'] as const,
  screenBackground: ['#FAF8FC', '#FFFFFF', '#FBF7FC'] as const,
  loadingScreen: ['#6B5AD6', '#5E86D8', '#3C9A8D'] as const,
  authHeader: ['#7E6BEE', '#6B5AD6', '#5D4BC0'] as const,
  progressFill: ['#6B5AD6', '#8271EC'] as const,
  roleStudentK8: ['#0EA5E9', '#38BDF8'] as const,
  roleStudentHS: ['#6B5AD6', '#8271EC'] as const,
  roleParent: ['#EC4899', '#F472B6'] as const,
  roleStaff: ['#3C9A8D', '#5FBEB0'] as const,
  infoBlue: ['#4F9FCB', '#6FB4DC'] as const,
  accentAmber: ['#DE9A2E', '#F0BC63'] as const,
  errorRed: ['#E06666', '#EC8B8B'] as const,
  accentCyan: ['#06B6D4', '#22D3EE'] as const,
  accentViolet: ['#8B5CF6', '#A78BFA'] as const,
  accentOrange: ['#DC6A50', '#F0856B'] as const,
  accentEmerald: ['#3C9A8D', '#5FBEB0'] as const,
};

// Static shadows now point at the single softened light source.
export const SHADOWS = SHADOWS_LIGHT;

// Unified: the static COLORS is now the single light palette from theme.ts, so
// the (still light-only) onboarding/auth screens that import COLORS directly get
// the new design system without duplicating values. Migrating those screens to
// useTheme() later adds dark mode on top.
export const COLORS = COLORS_LIGHT;

export const PASSWORD_STRENGTH_COLORS = ['#EF4444', '#F59E0B', '#EAB308', '#22C55E', '#16A34A'];

// Design System v1 — a tidy set of 5 rungs (sm 10 · md 14 · lg 18 · xl 24 · pill).
// Legacy names keep compiling, mapped onto the new rungs (softened: the 28s → 24,
// 32 header → 24).
export const RADII = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
  card: 18,
  button: 14,
  input: 14,
  badge: 999,
  grid: 14,
  formCard: 24,
  headerBottom: 24,
  cardLarge: 24,
  userCard: 24,
  badgeSmall: 10,
};

// Hairline default, 1.5 for emphasis — the 2/2.5/3px borders are retired.
export const BORDERS = {
  hairline: 1,
  regular: 1.5,
  card: 1,
  cardSelected: 1.5,
  input: 1.5,
  innerGlow: 1,
  backButton: 1.5,
  cardLarge: 1.5,
};

export const ANIMATION = {
  springBouncy: { damping: 20, stiffness: 180 },
  springSmooth: { damping: 22, stiffness: 120 },
  entranceDelay: 80,
  staggerDelay: 100,
  fastStaggerDelay: 50,
};

// Design System v1 type scale. The Raleway family carries the weight — we never
// also set fontWeight (which is ignored on native and diverges on web). Body text
// is regular weight so hierarchy can breathe. lineHeight is baked in.
// Legacy token names are kept (screenTitle/sectionTitle/emptyTitle/editTitle/
// bodyLarge/buttonSmall/input/bodyDescription/labelSmall) so existing consumers
// keep compiling; they now map onto the unified scale.
export const TYPOGRAPHY = {
  display: { fontSize: 40, fontFamily: 'Raleway_800ExtraBold', lineHeight: 44, letterSpacing: -0.5 },
  h1: { fontSize: 30, fontFamily: 'Raleway_700Bold', lineHeight: 36, letterSpacing: -0.3 },
  h2: { fontSize: 24, fontFamily: 'Raleway_700Bold', lineHeight: 30, letterSpacing: -0.2 },
  h3: { fontSize: 20, fontFamily: 'Raleway_600SemiBold', lineHeight: 26 },
  body: { fontSize: 16, fontFamily: 'Raleway_400Regular', lineHeight: 24 },
  bodyStrong: { fontSize: 16, fontFamily: 'Raleway_600SemiBold', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontFamily: 'Raleway_400Regular', lineHeight: 20 },
  caption: { fontSize: 13, fontFamily: 'Raleway_500Medium', lineHeight: 18 },
  overline: { fontSize: 11, fontFamily: 'Raleway_700Bold', lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase' as const },
  button: { fontSize: 16, fontFamily: 'Raleway_700Bold', letterSpacing: 0.2 },
  // ── legacy aliases mapped onto the new scale ──
  bodyLarge: { fontSize: 17, fontFamily: 'Raleway_400Regular', lineHeight: 26 },
  buttonSmall: { fontSize: 14, fontFamily: 'Raleway_700Bold', letterSpacing: 0.2 },
  input: { fontSize: 17, fontFamily: 'Raleway_500Medium' },
  screenTitle: { fontSize: 32, fontFamily: 'Raleway_800ExtraBold', lineHeight: 38, letterSpacing: -0.5 },
  sectionTitle: { fontSize: 24, fontFamily: 'Raleway_700Bold', lineHeight: 30, letterSpacing: -0.2 },
  emptyTitle: { fontSize: 22, fontFamily: 'Raleway_700Bold', lineHeight: 28 },
  editTitle: { fontSize: 22, fontFamily: 'Raleway_700Bold', lineHeight: 28 },
  bodyDescription: { fontSize: 16, fontFamily: 'Raleway_400Regular', lineHeight: 24 },
  labelSmall: { fontSize: 13, fontFamily: 'Raleway_500Medium', lineHeight: 18 },
};

export const SIZING = {
  iconHero: 56,
  iconPage: 48,
  iconCard: 24,
  iconRole: 24,
  iconButton: 20,
  iconNav: 22,
  iconInput: 20,
  circlePage: 80,
  circleRole: 52,
  circleCard: 44,
  circleResource: 72,
  circleSettings: 56,
  circleAvatar: 120,
};

// Design System v1 — 8-point grid (4 half-step). Named rungs + legacy aliases.
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 48,
  // legacy aliases
  screenPadding: 24,
  contentPadding: 20,
  sectionGap: 24,
  itemGap: 12,
  smallGap: 8,
};

export const SHARED_STYLES = StyleSheet.create({
  pageIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0EBFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 30,
    color: '#2C2A3A',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Raleway_700Bold',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#837D95',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
    fontFamily: 'Raleway_400Regular',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 4,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7B68EE',
  },
  skipPlaceholder: {
    height: 41,
  },
  badge: {
    backgroundColor: '#F0EBFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7B68EE',
  },
});

export function makeSharedStyles(c: typeof COLORS, fontScale = 1) {
  const fs = (size: number) => Math.round(size * fontScale);
  return StyleSheet.create({
    pageIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.backgroundLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    pageTitle: {
      fontSize: fs(30),
      color: c.textDark,
      marginBottom: 8,
      textAlign: 'center',
      fontFamily: 'Raleway_700Bold',
      letterSpacing: -0.3,
    },
    pageSubtitle: {
      fontSize: fs(16),
      color: c.textLight,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: fs(24),
      fontFamily: 'Raleway_400Regular',
    },
    buttonContainer: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 28,
      gap: 4,
    },
    skipButton: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    skipText: {
      fontSize: 18,
      fontWeight: '700',
      color: c.primary,
    },
    skipPlaceholder: {
      height: 41,
    },
    badge: {
      backgroundColor: c.backgroundLight,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
    },
    badgeText: {
      fontSize: 14,
      fontWeight: '700',
      color: c.primary,
    },
  });
}

export function withOpacity(color: string, opacity: number): string {
  const hex = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return color + hex;
}

export function getGradientForColor(color: string): readonly [string, string] {
  switch (color) {
    case '#0EA5E9':
      return GRADIENTS.roleStudentK8;
    case '#7B68EE':
      return GRADIENTS.roleStudentHS;
    case '#EC4899':
      return GRADIENTS.roleParent;
    case '#66D9A6':
      return GRADIENTS.roleStaff;
    case '#EF4444':
      return GRADIENTS.errorRed;
    case '#3B82F6':
      return GRADIENTS.infoBlue;
    case '#F59E0B':
      return GRADIENTS.accentAmber;
    case '#06B6D4':
      return GRADIENTS.accentCyan;
    case '#8B5CF6':
      return GRADIENTS.accentViolet;
    case '#F97316':
      return GRADIENTS.accentOrange;
    case '#10B981':
      return GRADIENTS.accentEmerald;
    default:
      return GRADIENTS.roleStudentHS;
  }
}

export const APP_STYLES = StyleSheet.create({
  // Tab screen headers
  tabHeader: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.borderCard,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  tabHeaderTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 6,
    fontFamily: 'Raleway_800ExtraBold',
  },
  tabHeaderSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  // Edit screen headers
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.borderCard,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  editHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: 'Raleway_600SemiBold',
  },
  editBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.borderCard,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  editSaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
  },
  editSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  editSaveButtonDisabled: {
    backgroundColor: COLORS.disabledButton,
  },
  editSaveTextDisabled: {
    color: COLORS.inputPlaceholder,
  },
  editScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  // Resource cards (index, search, bookmarks)
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: COLORS.borderCard,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  resourceIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Selectable cards (edit-role, edit-school-status, edit-grade-level, edit-topics)
  selectableCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.borderCard,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  // Empty states
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 24,
    marginBottom: 14,
    textAlign: 'center',
    fontFamily: 'Raleway_600SemiBold',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 26,
  },
  // Checkmark circle for edit screens
  checkmarkCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});

export function makeAppStyles(c: typeof COLORS, fontScale = 1) {
  const fs = (size: number) => Math.round(size * fontScale);
  return StyleSheet.create({
    tabHeader: {
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 24,
      backgroundColor: c.white,
      borderBottomWidth: 2,
      borderBottomColor: c.borderCard,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    tabHeaderTitle: {
      fontSize: 30,
      fontWeight: '800',
      color: c.textDark,
      marginBottom: 6,
      fontFamily: 'Raleway_800ExtraBold',
    },
    tabHeaderSubtitle: {
      fontSize: fs(18),
      fontWeight: '600',
      color: c.textMuted,
    },
    editHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: c.white,
      borderBottomWidth: 2,
      borderBottomColor: c.borderCard,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    editHeaderTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: c.textDark,
      fontFamily: 'Raleway_600SemiBold',
    },
    editBackButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.white,
      borderWidth: 1.5,
      borderColor: c.borderCard,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    editSaveButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: c.primary,
      borderRadius: 16,
    },
    editSaveText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    editSaveButtonDisabled: {
      backgroundColor: c.disabledButton,
    },
    editSaveTextDisabled: {
      color: c.inputPlaceholder,
    },
    editScrollContent: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 40,
    },
    resourceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.white,
      padding: 24,
      borderRadius: 24,
      borderWidth: 3,
      borderColor: c.borderCard,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    resourceIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 18,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    selectableCard: {
      backgroundColor: c.white,
      borderRadius: 20,
      borderWidth: 3,
      borderColor: c.borderCard,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 32,
      backgroundColor: c.white,
      borderRadius: 24,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    emptyTitle: {
      fontSize: fs(26),
      fontWeight: '800',
      color: c.textDark,
      marginTop: 24,
      marginBottom: 14,
      textAlign: 'center',
      fontFamily: 'Raleway_600SemiBold',
    },
    emptyText: {
      fontSize: fs(18),
      fontWeight: '500',
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: fs(26),
    },
    checkmarkCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 12,
    },
  });
}

interface DecorativeShape {
  size: number;
  color: string;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export const DECORATIVE_SHAPES: Record<string, DecorativeShape[]> = {
  welcome: [
    { size: 200, color: 'rgba(255,255,255,0.06)', top: -40, right: -60 },
    { size: 140, color: 'rgba(255,255,255,0.04)', bottom: 120, left: -50 },
    { size: 100, color: 'rgba(255,255,255,0.05)', top: 280, right: -20 },
    { size: 80, color: 'rgba(255,255,255,0.03)', bottom: 200, left: 30 },
  ],
  step: [
    { size: 180, color: 'rgba(123,104,238,0.04)', top: -60, right: -40 },
    { size: 120, color: 'rgba(123,104,238,0.03)', bottom: 100, left: -40 },
    { size: 90, color: 'rgba(196,92,214,0.03)', top: 360, right: -20 },
  ],
  loading: [
    { size: 200, color: 'rgba(255,255,255,0.06)', top: -50, left: -60 },
    { size: 150, color: 'rgba(255,255,255,0.04)', bottom: 80, right: -40 },
    { size: 100, color: 'rgba(255,255,255,0.05)', top: 320, left: -20 },
    { size: 70, color: 'rgba(255,255,255,0.03)', top: 160, right: 20 },
  ],
  auth: [
    { size: 160, color: 'rgba(123,104,238,0.04)', top: -40, left: -50 },
    { size: 100, color: 'rgba(123,104,238,0.03)', bottom: 200, right: -30 },
  ],
  confirm: [
    { size: 180, color: 'rgba(123,104,238,0.04)', top: -50, right: -40 },
    { size: 130, color: 'rgba(123,104,238,0.03)', bottom: 140, left: -50 },
    { size: 90, color: 'rgba(196,92,214,0.03)', top: 300, right: -20 },
  ],
  profile: [
    { size: 160, color: 'rgba(123,104,238,0.04)', top: -30, right: -50 },
    { size: 120, color: 'rgba(123,104,238,0.03)', top: 100, left: -40 },
    { size: 80, color: 'rgba(196,92,214,0.03)', top: 200, right: -10 },
  ],
  search: [
    { size: 160, color: 'rgba(123,104,238,0.04)', top: 80, right: -50 },
    { size: 120, color: 'rgba(123,104,238,0.03)', top: 400, left: -40 },
    { size: 80, color: 'rgba(196,92,214,0.03)', top: 250, right: -10 },
  ],
};
