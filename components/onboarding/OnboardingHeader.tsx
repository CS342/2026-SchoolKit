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

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  showHelper?: boolean;
}

export function OnboardingHeader({ currentStep, totalSteps, showHelper = false }: OnboardingHeaderProps) {
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
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color="#6B6B85" />
        </Pressable>

        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>{currentStep} of {totalSteps}</Text>
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadge: {
    backgroundColor: '#F0EBFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7B68EE',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    marginTop: 0,
    paddingHorizontal: 20,
  },
  helperText: {
    fontSize: 13,
    color: '#8E8EA8',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
