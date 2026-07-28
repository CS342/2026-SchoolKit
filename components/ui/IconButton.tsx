import React, { useRef } from 'react';
import { Pressable, Animated, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'circle' | 'plain';
  size?: number;          // icon size
  diameter?: number;      // touch target (circle)
  color?: string;
  accessibilityLabel: string;
  style?: ViewStyle;
}

/**
 * Icon-only control with a guaranteed ≥44pt touch target. `circle` gives a
 * tinted background; `plain` is bare. Opacity press feedback for bare icons.
 */
export function IconButton({
  icon, onPress, variant = 'plain', size = 22, diameter = 44, color, accessibilityLabel, style,
}: IconButtonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;
  const fg = color ?? colors.textMuted;

  const base: ViewStyle = {
    width: diameter, height: diameter, borderRadius: diameter / 2,
    alignItems: 'center', justifyContent: 'center',
    ...(variant === 'circle' ? { backgroundColor: colors.appBackgroundAlt } : null),
  };

  return (
    <Animated.View style={[{ opacity }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.timing(opacity, { toValue: 0.6, duration: 80, useNativeDriver: true }).start()}
        onPressOut={() => Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }).start()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={Platform.OS === 'web' ? ({ hovered }: any) => [base, { cursor: 'pointer', opacity: hovered ? 0.75 : 1 }] : base}
      >
        <Ionicons name={icon} size={size} color={fg} />
      </Pressable>
    </Animated.View>
  );
}
