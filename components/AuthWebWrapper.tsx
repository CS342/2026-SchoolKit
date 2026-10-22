import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../constants/theme';
import type { OnboardingData } from '../contexts/OnboardingContext';

interface StepInfo {
  current: number;
  total: number;
  label?: string;
  labelKey?: OnboardingScreenKey;
}

interface AuthWebWrapperProps {
  children: React.ReactNode;
  variant?: 'welcome' | 'auth' | 'confirm' | 'onboarding';
  step?: StepInfo;
}

/* ─── Single source of truth for the onboarding flow ───────────────
 * The step counter used to be hardcoded (and inconsistent) on every
 * screen. Derive current/total/label from one per-role flow instead.
 *
 * Navigation reality (see step2.handleContinue):
 *   students SKIP the grade screen (step2b) → shorter flow.
 *   parents / staff DO answer grade → one extra step.
 *
 *   student flow (6):     name → language → role → journey → topics → voice
 *   guardian flow (7):    name → language → role → grade → journey → topics → voice
 *
 * The three pre-role screens (name/language/role) don't yet know the
 * role, so they default to the student flow; a guardian's total ticks
 * up by one once they reach the grade screen.
 */
export type OnboardingScreenKey =
  | 'name'
  | 'language'
  | 'role'
  | 'grade'
  | 'journey'
  | 'topics'
  | 'voice';

const ONBOARDING_LABELS: Record<OnboardingScreenKey, string> = {
  name: 'Your name',
  language: 'Language',
  role: 'About you',
  grade: 'Grade level',
  journey: 'School journey',
  topics: 'Topics',
  voice: 'Voice',
};

const STUDENT_FLOW: OnboardingScreenKey[] = [
  'name', 'language', 'role', 'journey', 'topics', 'voice',
];
const GUARDIAN_FLOW: OnboardingScreenKey[] = [
  'name', 'language', 'role', 'grade', 'journey', 'topics', 'voice',
];

/**
 * Resolve the consistent step position for an onboarding screen.
 * Pass `isStudent` once the role is known (step3 onward + the grade
 * screen); leave it undefined on the pre-role screens.
 */
export function getOnboardingStep(
  screen: OnboardingScreenKey,
  isStudent?: boolean,
): StepInfo {
  const flow = isStudent === false ? GUARDIAN_FLOW : STUDENT_FLOW;
  const idx = flow.indexOf(screen);
  return {
    current: idx >= 0 ? idx + 1 : 1,
    total: flow.length,
    label: ONBOARDING_LABELS[screen],
    labelKey: screen,
  };
}

/**
 * Where to send a user who has an incomplete onboarding profile.
 * Only the required answers (name, then role) gate resume. The optional /
 * skippable steps (grade, journey, topics, voice) write empty values when
 * skipped, so an empty field can't be told apart from "never visited" — we
 * resume into the optional tail (step3) rather than guessing which one.
 * Every step screen seeds its inputs from saved data, so landing a step early
 * only costs a few taps through pre-filled screens, never lost answers.
 */
export function getResumeRoute(data: OnboardingData) {
  if (!data.name) return '/onboarding/step1';
  if (!data.role) return '/onboarding/step2';
  const isGuardian = data.role === 'parent' || data.role === 'staff';
  if (isGuardian && !data.gradeLevel) return '/onboarding/step2b';
  return '/onboarding/step3';
}

/**
 * Warm brand panel shown on the LEFT at desktop/tablet web widths.
 * Wordmark + reassuring headline + horizontal progress stepper.
 */
function BrandPanel({ step, narrow }: { step?: StepInfo; narrow: boolean }) {
  const { t } = useTranslation();
  const { gradients } = useTheme();
  const s = useMemo(() => makeBrandStyles(), []);
  return (
    <LinearGradient
      colors={[...gradients.authHeader]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.panel, narrow && s.panelNarrow]}
    >
      {/* Soft decorative orbs for depth */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[s.orb, s.orb1]} />
        <View style={[s.orb, s.orb2]} />
      </View>

      {/* Brand */}
      <View style={s.brand}>
        <View style={s.logoChip}>
          <Image
            source={require('../assets/images/HeaderLogo.png')}
            style={s.logo}
          />
        </View>
        <Text style={s.brandName}>SchoolKit</Text>
      </View>

      {/* Welcoming headline */}
      <View style={s.headlineBlock}>
        <Text style={s.headline}>{t('onboarding.frame.headline')}</Text>
        <Text style={s.subcopy}>
          {t('onboarding.frame.subcopy')}
        </Text>
      </View>

      {/* Horizontal progress stepper */}
      {step ? (
        <View style={s.stepperBlock}>
          <View style={s.segments}>
            {Array.from({ length: step.total }, (_, i) => {
              const stepNum = i + 1;
              const done = stepNum < step.current;
              const active = stepNum === step.current;
              return (
                <View
                  key={i}
                  style={[
                    s.segment,
                    done && s.segmentDone,
                    active && s.segmentActive,
                  ]}
                />
              );
            })}
          </View>
          <Text style={s.stepCaption}>
            {t('onboarding.frame.stepOf', { current: step.current, total: step.total })}
            {step.labelKey ? `  ·  ${t(`onboarding.labels.${step.labelKey}`)}` : step.label ? `  ·  ${step.label}` : ''}
          </Text>
        </View>
      ) : (
        <View style={s.stepperBlock} />
      )}
    </LinearGradient>
  );
}

/**
 * Wrapper for auth & onboarding pages.
 * On web desktop / tablet (width >= 768):
 *   - welcome: pass-through (gradient fills entire screen from DecorativeBackground)
 *   - auth/confirm: centered card with logo top bar on gradient background
 *   - onboarding: two-panel frame — warm brand panel (left) + screen content (right)
 * On mobile / narrow web: pass-through (renders exactly as before).
 */
export function AuthWebWrapper({ children, variant = 'auth', step }: AuthWebWrapperProps) {
  const { isWeb, isMobile, isTablet } = useResponsive();
  const { colors } = useTheme();
  const stepperStyles = useMemo(() => makeStepperStyles(colors), [colors]);
  const onboardingStyles = useMemo(() => makeOnboardingStyles(colors), [colors]);

  // On native or narrow web, pass through (single centered column as before)
  if (!isWeb || isMobile) {
    return <>{children}</>;
  }

  // Welcome: full-bleed pass-through (DecorativeBackground handles gradient)
  if (variant === 'welcome') {
    return <>{children}</>;
  }

  // Auth / Confirm: same layout as before with logo-only top bar
  if (variant === 'auth' || variant === 'confirm') {
    return (
      <View style={onboardingStyles.wrapper}>
        {/* Logo-only top bar (no stepper) */}
        <View style={stepperStyles.bar}>
          <View style={[stepperStyles.inner, { justifyContent: 'center' }]}>
            <View style={stepperStyles.brand}>
              <Image
                source={require('../assets/images/HeaderLogo.png')}
                style={stepperStyles.logo}
              />
              <Text style={stepperStyles.brandName}>SchoolKit</Text>
            </View>
          </View>
        </View>
        {/* Background orbs */}
        <View style={onboardingStyles.bgLayer}>
          <View style={[onboardingStyles.bgOrb, onboardingStyles.bgOrb1]} />
          <View style={[onboardingStyles.bgOrb, onboardingStyles.bgOrb2]} />
          <View style={[onboardingStyles.bgOrb, onboardingStyles.bgOrb3]} />
        </View>
        <View style={onboardingStyles.contentArea}>
          {children}
        </View>
      </View>
    );
  }

  // Onboarding: two-panel frame (brand panel left, screen content right)
  return (
    <View style={onboardingStyles.twoPanel}>
      <BrandPanel step={step} narrow={isTablet} />
      <View style={onboardingStyles.rightPanel}>
        {children}
      </View>
    </View>
  );
}

/* ─── Brand panel styles (left, warm gradient) ─────────────────────
 * The gradient (authHeader) is purple in both light & dark themes, so
 * white foreground reads well in both — the panel is intentionally
 * theme-stable while the right panel follows the theme. */
const makeBrandStyles = () => StyleSheet.create({
  panel: {
    width: 440,
    flexShrink: 0,
    paddingHorizontal: 48,
    paddingVertical: 56,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  panelNarrow: {
    width: 320,
    paddingHorizontal: 32,
    paddingVertical: 44,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  orb1: {
    width: 340,
    height: 340,
    top: -120,
    right: -140,
  },
  orb2: {
    width: 240,
    height: 240,
    bottom: -90,
    left: -110,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoChip: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 12,
    letterSpacing: -0.4,
    fontFamily: 'Raleway_600SemiBold',
  },
  headlineBlock: {
    marginVertical: 24,
  },
  headline: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    marginBottom: 14,
  },
  subcopy: {
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.86)',
    fontWeight: '500',
    maxWidth: 320,
  },
  stepperBlock: {
    gap: 12,
  },
  segments: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  segmentDone: {
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        boxShadow: '0 0 14px rgba(255,255,255,0.5)',
      },
    }),
  },
  stepCaption: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.2,
  },
});

/* ─── Stepper bar styles (frosted glass, used by auth/confirm) ─────── */
const makeStepperStyles = (c: ThemeColors) => StyleSheet.create({
  bar: {
    backgroundColor: c.whiteOverlay80,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 1px 24px rgba(123,104,238,0.06)',
      },
    }),
  },
  inner: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 18,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 150,
  },
  logo: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },
  brandName: {
    fontSize: 19,
    fontWeight: '800',
    color: c.primary,
    marginLeft: 10,
    letterSpacing: -0.4,
    fontFamily: 'Raleway_600SemiBold',
  },
});

/* ─── Onboarding layout styles ────────────────────── */
const makeOnboardingStyles = (c: ThemeColors) => StyleSheet.create({
  // Two-panel frame (onboarding, web desktop/tablet)
  twoPanel: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: c.appBackground,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: c.appBackground,
    overflow: 'hidden',
  },
  // Auth/confirm single-column frame
  wrapper: {
    flex: 1,
    backgroundColor: c.appBackground,
  },
  bgLayer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  bgOrb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  bgOrb1: {
    width: 600,
    height: 600,
    top: -200,
    right: -200,
    backgroundColor: 'rgba(123,104,238,0.04)',
  },
  bgOrb2: {
    width: 500,
    height: 500,
    bottom: -150,
    left: -200,
    backgroundColor: 'rgba(196,92,214,0.03)',
  },
  bgOrb3: {
    width: 300,
    height: 300,
    top: '40%',
    left: '50%',
    backgroundColor: 'rgba(14,165,233,0.025)',
  },
  contentArea: {
    flex: 1,
  },
});
