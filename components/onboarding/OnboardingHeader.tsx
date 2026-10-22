import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { ProgressBar } from './ProgressBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../hooks/useResponsive';
import { TYPOGRAPHY, BORDERS } from '../../constants/onboarding-theme';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../constants/theme';

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
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isWeb, isMobile } = useResponsive();
  const { colors, sharedStyles } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const webStyles = useMemo(() => makeWebStyles(colors), [colors]);
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
            accessibilityLabel={t('common.goBack')}
          >
            <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
            <Text style={webStyles.backText}>{t('common.back')}</Text>
          </Pressable>
        ) : (
          <View style={{ height: 20 }} />
        )}
        {showHelper && (
          <Text style={webStyles.helperText}>
            {t('onboarding.frame.changeLater')}
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
            accessibilityLabel={t('common.goBack')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textMuted} />
          </Pressable>
        )}

        <View style={sharedStyles.badge}>
          <Text style={sharedStyles.badgeText}>{t('onboarding.frame.countOf', { current: currentStep, total: totalSteps })}</Text>
        </View>

        <View style={styles.placeholder}>{rightAction}</View>
      </View>

      <View style={styles.progressContainer}>
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      </View>

      {showHelper && (
        <Text style={styles.helperText}>
          {t('onboarding.frame.changeLater')}
        </Text>
      )}
    </Animated.View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
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
    backgroundColor: c.white,
    borderWidth: BORDERS.backButton,
    borderColor: c.border,
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
    color: c.textLight,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});

const makeWebStyles = (c: ThemeColors) => StyleSheet.create({
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
    color: c.textMuted,
    marginLeft: 4,
  },
  helperText: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    color: c.textLight,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
