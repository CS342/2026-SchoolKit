import React from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, GRADIENTS } from '../constants/onboarding-theme';

interface StepInfo {
  current: number;
  total: number;
  label?: string;
}

interface AuthWebWrapperProps {
  children: React.ReactNode;
  variant?: 'welcome' | 'auth' | 'confirm' | 'onboarding';
  step?: StepInfo;
}

const STEP_LABELS = [
  'Your name',
  'About you',
  'Grade level',
  'School journey',
  'Topics',
  'Voice',
];

/**
 * Horizontal stepper bar for onboarding steps (web desktop only).
 * Frosted glass effect, logo left, step circles center, step label right.
 */
function WebStepperBar({ step }: { step: StepInfo }) {
  return (
    <View style={stepperStyles.bar}>
      <View style={stepperStyles.inner}>
        {/* Left: Logo + brand name */}
        <View style={stepperStyles.brand}>
          <Image
            source={require('../assets/images/HeaderLogo.png')}
            style={stepperStyles.logo}
          />
          <Text style={stepperStyles.brandName}>SchoolKit</Text>
        </View>

        {/* Center: Step circles with connecting lines */}
        <View style={stepperStyles.stepsRow}>
          {Array.from({ length: step.total }, (_, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === step.current;
            const isComplete = stepNum < step.current;

            return (
              <React.Fragment key={i}>
                {i > 0 && (
                  <View
                    style={[
                      stepperStyles.connector,
                      isComplete && stepperStyles.connectorComplete,
                    ]}
                  />
                )}
                {isComplete ? (
                  <LinearGradient
                    colors={[...GRADIENTS.primaryButton]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={stepperStyles.circleComplete}
                  >
                    <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      stepperStyles.circle,
                      isActive && stepperStyles.circleActive,
                    ]}
                  >
                    <Text
                      style={[
                        stepperStyles.circleText,
                        isActive && stepperStyles.circleTextActive,
                      ]}
                    >
                      {stepNum}
                    </Text>
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Right: Current step label */}
        <View style={stepperStyles.labelContainer}>
          <Text style={stepperStyles.stepLabel}>
            {step.label || STEP_LABELS[step.current - 1] || `Step ${step.current}`}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Wrapper for auth & onboarding pages.
 * On web desktop:
 *   - welcome: pass-through (gradient fills entire screen from DecorativeBackground)
 *   - auth/confirm: centered card with logo top bar on gradient background
 *   - onboarding: horizontal stepper bar at top + wide centered content
 * On mobile: pass-through (no-op).
 */
export function AuthWebWrapper({ children, variant = 'auth', step }: AuthWebWrapperProps) {
  const { isWeb, isMobile } = useResponsive();
  const { isDark } = useTheme();

  // On native or narrow web, pass through
  if (!isWeb || isMobile) {
    return <>{children}</>;
  }

  // Welcome: full-bleed pass-through (DecorativeBackground handles gradient)
  if (variant === 'welcome') {
    return <>{children}</>;
  }

  // Auth / Confirm: same layout as onboarding with logo-only top bar
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

  // Onboarding: stepper bar at top + wide centered content
  return (
    <View style={onboardingStyles.wrapper}>
      {step && <WebStepperBar step={step} />}
      {/* Subtle radial gradient background */}
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

/* ─── Stepper bar styles (frosted glass) ──────────── */
const stepperStyles = StyleSheet.create({
  bar: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(123,104,238,0.08)',
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
    color: COLORS.primary,
    marginLeft: 10,
    letterSpacing: -0.4,
    fontFamily: 'Raleway_600SemiBold',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  connector: {
    height: 2,
    width: 36,
    backgroundColor: 'rgba(123,104,238,0.12)',
    borderRadius: 1,
    marginHorizontal: 4,
  },
  connectorComplete: {
    backgroundColor: COLORS.primary,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EEF9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  circleActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: `0 0 0 4px rgba(123,104,238,0.12), 0 0 20px rgba(123,104,238,0.18)`,
      },
    }),
  },
  circleComplete: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(123,104,238,0.25)',
      },
    }),
  },
  circleText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.3)',
  },
  circleTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  labelContainer: {
    minWidth: 150,
    alignItems: 'flex-end',
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.2,
  },
});

/* ─── Onboarding layout styles ────────────────────── */
const onboardingStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
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
