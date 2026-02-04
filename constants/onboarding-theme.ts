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
};

export const ANIMATION = {
  springBouncy: { damping: 20, stiffness: 180 },
  springSmooth: { damping: 22, stiffness: 120 },
  entranceDelay: 80,
  staggerDelay: 100,
  fastStaggerDelay: 50,
};

interface DecorativeShape {
  size: number;
  color: string;
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
}

export const DECORATIVE_SHAPES: Record<string, DecorativeShape[]> = {
  welcome: [
    { size: 200, color: 'rgba(255,255,255,0.06)', top: -40, right: -60 },
    { size: 140, color: 'rgba(255,255,255,0.04)', bottom: 120, left: -50 },
    { size: 100, color: 'rgba(255,255,255,0.05)', top: '35%', right: -20 },
    { size: 80, color: 'rgba(255,255,255,0.03)', bottom: '25%', left: 30 },
  ],
  step: [
    { size: 180, color: 'rgba(123,104,238,0.04)', top: -60, right: -40 },
    { size: 120, color: 'rgba(123,104,238,0.03)', bottom: 100, left: -40 },
    { size: 90, color: 'rgba(196,92,214,0.03)', top: '45%', right: -20 },
  ],
  loading: [
    { size: 200, color: 'rgba(255,255,255,0.06)', top: -50, left: -60 },
    { size: 150, color: 'rgba(255,255,255,0.04)', bottom: 80, right: -40 },
    { size: 100, color: 'rgba(255,255,255,0.05)', top: '40%', left: -20 },
    { size: 70, color: 'rgba(255,255,255,0.03)', top: '20%', right: 20 },
  ],
  auth: [
    { size: 160, color: 'rgba(123,104,238,0.04)', top: -40, left: -50 },
    { size: 100, color: 'rgba(123,104,238,0.03)', bottom: 200, right: -30 },
  ],
};
