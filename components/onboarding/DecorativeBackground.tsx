import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { DECORATIVE_SHAPES } from '../../constants/onboarding-theme';

interface DecorativeBackgroundProps {
  variant: 'welcome' | 'step' | 'loading' | 'auth';
  gradientColors?: readonly string[] | string[];
  children: React.ReactNode;
}

function AnimatedCircle({
  shape,
  index,
}: {
  shape: (typeof DECORATIVE_SHAPES)['welcome'][number];
  index: number;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withDelay(index * 150, withSpring(1, { damping: 20, stiffness: 100 }));
    scale.value = withDelay(index * 150, withSpring(1, { damping: 20, stiffness: 100 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: shape.size,
          height: shape.size,
          borderRadius: shape.size / 2,
          backgroundColor: shape.color,
          top: shape.top as number | undefined,
          bottom: shape.bottom as number | undefined,
          left: shape.left as number | undefined,
          right: shape.right as number | undefined,
        },
        animatedStyle,
      ]}
    />
  );
}

export function DecorativeBackground({
  variant,
  gradientColors,
  children,
}: DecorativeBackgroundProps) {
  const shapes = DECORATIVE_SHAPES[variant] || [];

  const content = (
    <>
      {shapes.map((shape, index) => (
        <AnimatedCircle key={index} shape={shape} index={index} />
      ))}
      {children}
    </>
  );

  if (gradientColors) {
    return (
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {content}
      </LinearGradient>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
