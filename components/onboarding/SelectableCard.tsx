import React, { useMemo } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { ANIMATION, TYPOGRAPHY, SIZING, RADII, BORDERS } from '../../constants/onboarding-theme';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../constants/theme';
import { AppIcon } from '../ui/AppIcon';

interface SelectableCardProps {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  multiSelect?: boolean;
  color?: string;
  /** Ionicons name or `mci:<name>` (see AppIcon). */
  icon?: string;
  index?: number;
}

export function SelectableCard({
  title,
  subtitle,
  selected,
  onPress,
  multiSelect = false,
  color: colorProp,
  icon,
  index = 0,
}: SelectableCardProps) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const color = colorProp ?? colors.primary;
  const scale = useSharedValue(1);
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);
  const indicatorScale = useSharedValue(selected ? 1 : 0);

  React.useEffect(() => {
    translateY.value = withDelay(index * ANIMATION.staggerDelay, withSpring(0, ANIMATION.springBouncy));
    opacity.value = withDelay(index * ANIMATION.staggerDelay, withTiming(1, { duration: 400 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const indicatorAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: indicatorScale.value }],
  }));

  React.useEffect(() => {
    indicatorScale.value = withSpring(selected ? 1 : 0, ANIMATION.springBouncy);
  }, [selected]);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withSpring(1, ANIMATION.springBouncy)
    );
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole={multiSelect ? "checkbox" : "radio"}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
    >
      <Animated.View
        style={[
          styles.card,
          selected && {
            backgroundColor: color + '14',
            borderColor: color,
            borderWidth: BORDERS.cardSelected,
            ...shadows.cardSelected,
          },
          !selected && shadows.card,
          animatedStyle,
        ]}
      >
        {icon && (
          <View style={[styles.iconCircle, { backgroundColor: color }]}>
            <AppIcon name={icon} size={24} color="#FFFFFF" />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.title, selected && { color: colors.textDark }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, selected && { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          )}
        </View>

        {multiSelect ? (
          <View
            style={[
              styles.checkbox,
              selected && { backgroundColor: color, borderColor: color },
            ]}
          >
            <Animated.View style={indicatorAnimStyle}>
              {selected && <Ionicons name="checkmark" size={20} color={colors.white} />}
            </Animated.View>
          </View>
        ) : (
          <View style={[styles.radio, selected && { borderColor: color }]}>
            <Animated.View
              style={[
                styles.radioDot,
                { backgroundColor: color },
                indicatorAnimStyle,
              ]}
            />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.white,
    borderRadius: RADII.card,
    padding: 18,
    marginBottom: 14,
    borderWidth: BORDERS.card,
    borderColor: c.borderCard,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: SIZING.circleCard,
    height: SIZING.circleCard,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    ...TYPOGRAPHY.body,
    color: c.textDark,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: c.textLight,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: BORDERS.cardSelected,
    borderColor: c.indicatorInactive,
    backgroundColor: c.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: BORDERS.cardSelected,
    borderColor: c.indicatorInactive,
    backgroundColor: c.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});
