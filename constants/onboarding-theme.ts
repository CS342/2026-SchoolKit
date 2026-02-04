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
};

export const BORDERS = {
  card: 2,
  cardSelected: 2.5,
  input: 1.5,
  innerGlow: 1,
  backButton: 1.5,
};

export const ANIMATION = {
  springBouncy: { damping: 20, stiffness: 180 },
  springSmooth: { damping: 22, stiffness: 120 },
  entranceDelay: 80,
  staggerDelay: 100,
  fastStaggerDelay: 50,
};

export const TYPOGRAPHY = {
  display: { fontSize: 42, fontWeight: '800' as const, letterSpacing: -1 },
  h1: { fontSize: 28, fontWeight: '800' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 20, fontWeight: '700' as const },
  bodyLarge: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '600' as const },
  bodySmall: { fontSize: 14, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '600' as const },
  button: { fontSize: 17, fontWeight: '800' as const },
  buttonSmall: { fontSize: 16, fontWeight: '700' as const },
  input: { fontSize: 20, fontWeight: '700' as const },
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
    fontSize: 28,
    fontWeight: '800',
    color: '#2D2D44',
    marginBottom: 8,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#7B68EE',
  },
});

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
};
