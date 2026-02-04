import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GRADIENTS, ANIMATION, COLORS } from '../../constants/onboarding-theme';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

function Pill({ state }: { state: 'completed' | 'active' | 'inactive' }) {
  const width = useSharedValue(state === 'active' ? 10 : 10);

  useEffect(() => {
    width.value = withSpring(state === 'active' ? 28 : 10, ANIMATION.springSmooth);
  }, [state]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));

  if (state === 'active') {
    return (
      <Animated.View style={[styles.pill, animatedStyle, { overflow: 'hidden' }]}>
        <LinearGradient
          colors={[...GRADIENTS.progressFill]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.pill,
        animatedStyle,
        {
          backgroundColor: state === 'completed' ? COLORS.primary : COLORS.border,
        },
      ]}
    />
  );
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        let state: 'completed' | 'active' | 'inactive';
        if (stepNum < currentStep) state = 'completed';
        else if (stepNum === currentStep) state = 'active';
        else state = 'inactive';
        return <Pill key={i} state={state} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    height: 10,
    borderRadius: 5,
  },
});
