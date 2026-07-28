import React, { useRef } from 'react';
import { Pressable, View, Animated, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { RADII, SPACING } from '../../constants/onboarding-theme';

export type CardVariant = 'resting' | 'selected' | 'elevated' | 'flat';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  padded?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

/**
 * The single card primitive. All radius/border/shadow come from tokens, so every
 * card in the app reads as one family. Pressable cards get a subtle scale on
 * press and a hover lift on web.
 */
export function Card({ children, variant = 'resting', onPress, padded = true, style, accessibilityLabel }: CardProps) {
  const { colors, shadows } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const base: ViewStyle = {
    backgroundColor: colors.white,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: variant === 'selected' ? colors.primary : colors.borderCard,
    ...(padded ? { padding: SPACING.lg } : null),
    ...(variant === 'elevated' ? shadows.cardLarge : variant === 'flat' ? null : variant === 'selected' ? shadows.cardSelected : shadows.card),
  };

  if (!onPress) {
    return <View style={[base, style]} accessibilityLabel={accessibilityLabel}>{children}</View>;
  }

  const pressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, damping: 18, stiffness: 220 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 220 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={Platform.OS === 'web' ? ({ hovered }: any) => [base, hovered ? { transform: [{ translateY: -2 }], cursor: 'pointer' } : { cursor: 'pointer' }] : base}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
