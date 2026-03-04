import React from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../contexts/ThemeContext';
import { GRADIENTS, COLORS } from '../constants/onboarding-theme';

interface StepInfo {
  current: number;
  total: number;
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

function BrandPanel({ variant, step }: { variant: string; step?: StepInfo }) {
  return (
    <LinearGradient
      colors={[...GRADIENTS.welcomeHero]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={brandStyles.container}
    >
      {/* Decorative circles */}
      <View style={brandStyles.circle1} />
      <View style={brandStyles.circle2} />
      <View style={brandStyles.circle3} />

      <View style={brandStyles.content}>
        <View style={brandStyles.logoArea}>
          <View style={brandStyles.logoGlow}>
            {Array.from({ length: 15 }, (_, i) => {
              const size = 60 + i * 4;
              const opacity = 0.35 - i * 0.022;
              return (
                <View
                  key={i}
                  style={{
                    position: 'absolute' as const,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: `rgba(255,255,255,${Math.max(opacity, 0.02)})`,
                  }}
                />
              );
            })}
            <Image
              source={require('../assets/images/SchoolKit-transparent.png')}
              style={{ width: 80, height: 80, resizeMode: 'contain' }}
            />
          </View>
          <Text style={brandStyles.appName}>SchoolKit</Text>
          <Text style={brandStyles.tagline}>Support for every school journey</Text>
        </View>

        {/* Step progress for onboarding */}
        {variant === 'onboarding' && step && (
          <View style={brandStyles.stepsContainer}>
            {Array.from({ length: step.total }, (_, i) => {
              const stepNum = i + 1;
              const isActive = stepNum === step.current;
              const isComplete = stepNum < step.current;
              return (
                <View key={i} style={brandStyles.stepRow}>
                  <View
                    style={[
                      brandStyles.stepDot,
                      isComplete && brandStyles.stepDotComplete,
                      isActive && brandStyles.stepDotActive,
                    ]}
                  >
                    {isComplete ? (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          brandStyles.stepDotText,
                          (isActive || isComplete) && brandStyles.stepDotTextActive,
                        ]}
                      >
                        {stepNum}
                      </Text>
                    )}
                  </View>
                  {i < step.total - 1 && (
                    <View
                      style={[
                        brandStyles.stepLine,
                        isComplete && brandStyles.stepLineComplete,
                      ]}
                    />
                  )}
                  <Text
                    style={[
                      brandStyles.stepLabel,
                      isActive && brandStyles.stepLabelActive,
                      isComplete && brandStyles.stepLabelComplete,
                    ]}
                  >
                    {STEP_LABELS[i] || `Step ${stepNum}`}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Contextual message for non-onboarding */}
        {variant === 'auth' && (
          <Text style={brandStyles.contextMessage}>
            Join thousands of students, parents, and educators on their school journey.
          </Text>
        )}
        {variant === 'confirm' && (
          <View style={brandStyles.confirmIcon}>
            <Ionicons name="mail-outline" size={48} color="rgba(255,255,255,0.8)" />
            <Text style={brandStyles.contextMessage}>Almost there!</Text>
          </View>
        )}
      </View>

      {/* Bottom decorative text */}
      <Text style={brandStyles.footerText}>Stanford Byers Center for Biodesign</Text>
    </LinearGradient>
  );
}

/**
 * Wrapper for auth & onboarding pages.
 * On web desktop/tablet: split layout with branded left panel + content right.
 * On mobile: pass-through (no-op).
 */
export function AuthWebWrapper({ children, variant = 'auth', step }: AuthWebWrapperProps) {
  const { isWeb, isMobile } = useResponsive();
  const { isDark } = useTheme();

  // On native or narrow web, pass through
  if (!isWeb || isMobile) {
    return <>{children}</>;
  }

  return (
    <View style={splitStyles.wrapper}>
      <View style={splitStyles.leftPanel}>
        <BrandPanel variant={variant} step={step} />
      </View>
      <View
        style={[
          splitStyles.rightPanel,
          {
            backgroundColor: isDark ? '#1C1C2E' : '#FFFFFF',
          },
        ]}
      >
        <View style={splitStyles.rightContent}>
          {children}
        </View>
      </View>
    </View>
  );
}

const splitStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    width: '38%',
    minWidth: 320,
    maxWidth: 480,
  },
  rightPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContent: {
    width: '100%',
    maxWidth: 540,
    flex: 1,
  },
});

const brandStyles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoGlow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    fontFamily: 'Raleway_600SemiBold',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    textAlign: 'center',
  },
  stepsContainer: {
    paddingLeft: 24,
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    position: 'relative',
    height: 44,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepDotActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        boxShadow: '0 0 16px rgba(255,255,255,0.4)',
      },
    }),
  },
  stepDotComplete: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  stepDotTextActive: {
    color: COLORS.primary,
  },
  stepLine: {
    position: 'absolute',
    left: 13,
    top: 36,
    width: 2,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  stepLineComplete: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  stepLabel: {
    marginLeft: 14,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
  },
  stepLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepLabelComplete: {
    color: 'rgba(255,255,255,0.7)',
  },
  contextMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  confirmIcon: {
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    paddingBottom: 24,
  },
  // Decorative circles
  circle1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circle2: {
    position: 'absolute',
    bottom: 100,
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  circle3: {
    position: 'absolute',
    top: '40%',
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
