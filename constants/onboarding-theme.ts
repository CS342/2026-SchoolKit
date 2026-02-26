import { StyleSheet } from 'react-native';

export const GRADIENTS = {
  primaryButton: ['#7B68EE', '#9B6EE8', '#B06AE4'] as const,
  disabledButton: ['#D8D0E8', '#D0C8E0'] as const,
  welcomeHero: ['#7B68EE', '#9B59E8', '#C45CD6'] as const,
  screenBackground: ['#F8F5FF', '#FFFFFF', '#FFF5FA'] as const,
  loadingScreen: ['#7B68EE', '#5B8DEE', '#0EA5E9'] as const,
  authHeader: ['#7B68EE', '#8B60E8', '#B06AE4'] as const,
  progressFill: ['#7B68EE', '#9B6EE8'] as const,
  roleStudentK8: ['#0EA5E9', '#38BDF8'] as const,
  roleStudentHS: ['#7B68EE', '#9B6EE8'] as const,
  roleParent: ['#EC4899', '#F472B6'] as const,
  roleStaff: ['#66D9A6', '#86EFAC'] as const,
  infoBlue: ['#3B82F6', '#60A5FA'] as const,
  accentAmber: ['#F59E0B', '#FBBF24'] as const,
  errorRed: ['#EF4444', '#F87171'] as const,
  accentCyan: ['#06B6D4', '#22D3EE'] as const,
  accentViolet: ['#8B5CF6', '#A78BFA'] as const,
  accentOrange: ['#F97316', '#FB923C'] as const,
  accentEmerald: ['#10B981', '#34D399'] as const,
};

export const SHADOWS = {
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

export const COLORS = {
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
  // App backgrounds
  appBackground: '#FBF9FF',
  appBackgroundAlt: '#F8F7FF',
  // Purple tints
  backgroundLighter: '#F5F3FF',
  borderPurple: '#E8E0FF',
  tabActiveBg: '#EDE9FE',
  // Disabled state
  disabledButton: '#D8D8E8',
  // Semantic colors
  error: '#EF4444',
  // Warning/offline colors
  warningBg: '#FEF3C7',
  warningText: '#D97706',
  offlineText: '#92400E',
  successBg: '#D1FAE5',
  successText: '#065F46',
};

export const PASSWORD_STRENGTH_COLORS = ['#EF4444', '#F59E0B', '#EAB308', '#22C55E', '#16A34A'];

export const RADII = {
  card: 20,
  button: 16,
  input: 14,
  badge: 20,
  grid: 16,
  formCard: 24,
  headerBottom: 32,
  cardLarge: 24,
  userCard: 28,
  badgeSmall: 10,
};

export const BORDERS = {
  card: 2,
  cardSelected: 2.5,
  input: 1.5,
  innerGlow: 1,
  backButton: 1.5,
  cardLarge: 3,
};

export const ANIMATION = {
  springBouncy: { damping: 20, stiffness: 180 },
  springSmooth: { damping: 22, stiffness: 120 },
  entranceDelay: 80,
  staggerDelay: 100,
  fastStaggerDelay: 50,
};

export const TYPOGRAPHY = {
  display: { fontSize: 44, fontWeight: '800' as const, letterSpacing: -1 },
  h1: { fontSize: 30, fontWeight: '800' as const },
  h2: { fontSize: 24, fontWeight: '700' as const },
  h3: { fontSize: 22, fontWeight: '700' as const },
  bodyLarge: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 18, fontWeight: '600' as const },
  bodySmall: { fontSize: 16, fontWeight: '600' as const },
  caption: { fontSize: 14, fontWeight: '600' as const },
  button: { fontSize: 19, fontWeight: '800' as const },
  buttonSmall: { fontSize: 18, fontWeight: '700' as const },
  input: { fontSize: 22, fontWeight: '700' as const },
  screenTitle: { fontSize: 38, fontWeight: '800' as const },
  sectionTitle: { fontSize: 28, fontWeight: '800' as const },
  emptyTitle: { fontSize: 26, fontWeight: '800' as const },
  editTitle: { fontSize: 24, fontWeight: '800' as const },
  bodyDescription: { fontSize: 17, fontWeight: '500' as const },
  labelSmall: { fontSize: 15, fontWeight: '600' as const },
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

export const SPACING = {
  screenPadding: 24,
  contentPadding: 20,
  sectionGap: 24,
  itemGap: 14,
  smallGap: 8,
  xs: 4,
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
    fontWeight: '800',
    color: '#2D2D44',
    marginBottom: 8,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8EA8',
    textAlign: 'center',
    marginBottom: 20,
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

export function makeSharedStyles(c: typeof COLORS) {
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
      fontSize: 30,
      fontWeight: '800',
      color: c.textDark,
      marginBottom: 8,
      textAlign: 'center',
    },
    pageSubtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.textLight,
      textAlign: 'center',
      marginBottom: 20,
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

export function makeAppStyles(c: typeof COLORS) {
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
    },
    tabHeaderSubtitle: {
      fontSize: 18,
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
      fontSize: 26,
      fontWeight: '800',
      color: c.textDark,
      marginTop: 24,
      marginBottom: 14,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '500',
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 26,
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
