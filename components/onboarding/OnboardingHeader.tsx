import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { ProgressBar } from './ProgressBar';
import { COLORS, TYPOGRAPHY, BORDERS, SHARED_STYLES } from '../../constants/onboarding-theme';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  showHelper?: boolean;
  onBack?: () => void;
}

export function OnboardingHeader({ currentStep, totalSteps, showHelper = false, onBack }: OnboardingHeaderProps) {
  const router = useRouter();
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

  return (
    <Animated.View style={[styles.container, entranceStyle]}>
      <View style={styles.topRow}>
        {currentStep === 1 ? (
          <View style={styles.placeholder} />
        ) : (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.textMuted} />
          </Pressable>
        )}

        <View style={SHARED_STYLES.badge}>
          <Text style={SHARED_STYLES.badgeText}>{currentStep} of {totalSteps}</Text>
        </View>

        <View style={styles.placeholder} />
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
