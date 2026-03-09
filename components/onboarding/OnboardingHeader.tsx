import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { ProgressBar } from './ProgressBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../hooks/useResponsive';
import { COLORS, TYPOGRAPHY, BORDERS, SHARED_STYLES } from '../../constants/onboarding-theme';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  showHelper?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showBackOnFirstStep?: boolean;
}

export function OnboardingHeader({ currentStep, totalSteps, showHelper = false, onBack, rightAction, showBackOnFirstStep = false }: OnboardingHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb, isMobile } = useResponsive();
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 400 });
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const isWebDesktop = isWeb && !isMobile;

  // On web desktop, render only a minimal "Back" link (stepper bar handles progress)
  if (isWebDesktop) {
    const showBack = currentStep > 1 || showBackOnFirstStep;
    return (
      <View style={webStyles.container}>
        {showBack ? (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            style={webStyles.backLink}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
            <Text style={webStyles.backText}>Back</Text>
          </Pressable>
        ) : (
          <View style={{ height: 20 }} />
        )}
        {showHelper && (
          <Text style={webStyles.helperText}>
            You can change or update any of this later.
          </Text>
        )}
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top + 10 }, entranceStyle]}>
      <View style={styles.topRow}>
        {currentStep === 1 && !showBackOnFirstStep ? (
          <View style={styles.placeholder} />
        ) : (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.textMuted} />
          </Pressable>
        )}

        <View style={SHARED_STYLES.badge}>
          <Text style={SHARED_STYLES.badgeText}>{currentStep} of {totalSteps}</Text>
        </View>

        <View style={styles.placeholder}>{rightAction}</View>
      </View>

      <View style={styles.progressContainer}>
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      </View>

      {showHelper && (
        <Text style={styles.helperText}>
          You can change or update any of this later.
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: BORDERS.backButton,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    marginTop: 0,
    paddingHorizontal: 20,
  },
  helperText: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});

const webStyles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 32,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(123,104,238,0.06)',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  helperText: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
