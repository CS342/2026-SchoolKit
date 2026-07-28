import React, { useRef } from 'react';
import { Pressable, Text, View, ActivityIndicator, StyleSheet, Animated, ViewStyle, TextStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { RADII, SPACING, TYPOGRAPHY } from '../../constants/onboarding-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: boolean;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const SIZES: Record<ButtonSize, { padV: number; padH: number; font: number; icon: number; radius: number }> = {
  sm: { padV: 8, padH: 14, font: 14, icon: 16, radius: RADII.sm },
  md: { padV: 12, padH: 20, font: 16, icon: 18, radius: RADII.md },
  lg: { padV: 15, padH: 24, font: 17, icon: 20, radius: RADII.md },
};

/**
 * The single button primitive. Variants: primary (brand gradient), secondary
 * (healing teal), outline, text, destructive. Consistent press-scale feedback
 * and a token-driven disabled state.
 */
export function Button({
  label, onPress, variant = 'primary', size = 'md', icon, iconRight = false,
  disabled = false, loading = false, fullWidth = false, style, accessibilityLabel,
}: ButtonProps) {
  const { colors, gradients, shadows, isDark } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const s = SIZES[size];
  const isDisabled = disabled || loading;

  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, damping: 18, stiffness: 220 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 220 }).start();

  const solidBg =
    variant === 'secondary' ? colors.teal :
    variant === 'destructive' ? colors.destructive :
    'transparent';
  const fgColor =
    variant === 'primary' || variant === 'secondary' || variant === 'destructive' ? '#FFFFFF' :
    colors.primary;

  const base: ViewStyle = {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: s.padV, paddingHorizontal: variant === 'text' ? SPACING.sm : s.padH,
    borderRadius: s.radius, alignSelf: fullWidth ? 'stretch' : 'flex-start',
    ...(variant === 'outline' ? { borderWidth: 1.5, borderColor: colors.borderCard } : null),
    ...(variant === 'primary' && !isDisabled ? shadows.button : null),
    opacity: isDisabled && variant !== 'primary' && variant !== 'secondary' && variant !== 'destructive' ? 0.5 : 1,
  };

  const content = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={fgColor} />
      ) : (
        <>
          {icon && !iconRight && <Ionicons name={icon} size={s.icon} color={fgColor} />}
          <Text style={[styles.label, { fontSize: s.font, color: fgColor }]} numberOfLines={1}>{label}</Text>
          {icon && iconRight && <Ionicons name={icon} size={s.icon} color={fgColor} />}
        </>
      )}
    </>
  );

  const inner = (
    variant === 'primary' ? (
      <LinearGradient
        colors={isDisabled ? gradients.disabledButton : gradients.primaryButton}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={base}
      >
        {content}
      </LinearGradient>
    ) : (
      <View style={[base, { backgroundColor: isDisabled && (variant === 'secondary' || variant === 'destructive') ? colors.disabledButton : solidBg }]}>
        {content}
      </View>
    )
  );

  return (
    <Animated.View style={[{ transform: [{ scale }], alignSelf: fullWidth ? 'stretch' : 'flex-start' }, style]}>
      <Pressable
        onPress={isDisabled ? undefined : onPress}
        onPressIn={isDisabled ? undefined : pressIn}
        onPressOut={isDisabled ? undefined : pressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: isDisabled }}
        style={(Platform.OS === 'web' ? ({ hovered }: any) => [{ cursor: isDisabled ? 'default' : 'pointer', opacity: hovered && !isDisabled ? 0.92 : 1 }] : undefined) as any}
      >
        {inner}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  label: { ...TYPOGRAPHY.button },
});
