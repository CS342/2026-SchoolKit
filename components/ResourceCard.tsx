import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { BookmarkButton } from './BookmarkButton';
import { DownloadIndicator } from './DownloadIndicator';
import { useTheme } from '../contexts/ThemeContext';
import {
  COLORS,
  SHADOWS,
  ANIMATION,
  TYPOGRAPHY,
  SIZING,
  SPACING,
  RADII,
  BORDERS,
  withOpacity,
  getGradientForColor,
} from '../constants/onboarding-theme';

interface ResourceCardProps {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
  index: number;
  category?: string;
  showDownloadIndicator?: boolean;
  animationBaseDelay?: number;
  staggerDelay?: number;
}

export function ResourceCard({
  id,
  title,
  icon,
  color,
  onPress,
  index,
  category,
  showDownloadIndicator = false,
  animationBaseDelay = 0,
  staggerDelay: staggerDelayProp = ANIMATION.staggerDelay,
}: ResourceCardProps) {
  const [fontSizeStep, setFontSizeStep] = useState(0);
  const FONT_STEPS = [1.0, 1.2, 1.45];
  const scale = useSharedValue(1);
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = animationBaseDelay + index * staggerDelayProp;
    translateY.value = withDelay(
      delay,
      withSpring(0, ANIMATION.springBouncy),
    );
  opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
  }, []);

  const { isDark, colors, fontScale } = useTheme();

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withSpring(1, ANIMATION.springBouncy),
    );
    onPress();
  };

  const gradient = getGradientForColor(color);

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.card, { backgroundColor: isDark ? colors.backgroundLight : COLORS.white, borderColor: isDark ? colors.borderCard : COLORS.borderCard }, SHADOWS.card, cardStyle]}>
        <LinearGradient
          colors={[...gradient] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Ionicons name={icon as any} size={SIZING.iconRole} color={COLORS.white} />
        </LinearGradient>

        {category ? (
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.textDark, fontSize: Math.round(22 * fontScale * FONT_STEPS[fontSizeStep]) }]}>{title}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: withOpacity(color, 0.1) }]}>
              <Text style={[styles.categoryText, { color, fontSize: Math.round(16 * fontScale) }]}>{category}</Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.titleFull, { color: colors.textDark, fontSize: Math.round(22 * fontScale * FONT_STEPS[fontSizeStep]) }]}>{title}</Text>
        )}

        <View style={styles.actions}>
          {showDownloadIndicator && <DownloadIndicator resourceId={id} size={32} />}
          <BookmarkButton resourceId={id} color={color} size={40} />
          <TouchableOpacity onPress={(e: any) => { e.stopPropagation?.(); setFontSizeStep(s => (s + 1) % FONT_STEPS.length); }} hitSlop={10} activeOpacity={0.7}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: fontSizeStep > 0 ? color : colors.textLight }}>Aa</Text>
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={32} color={colors.textLight} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    padding: 16,
    borderWidth: BORDERS.card,
    borderColor: COLORS.borderCard,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: SIZING.circleRole,
    height: SIZING.circleRole,
    borderRadius: SIZING.circleRole / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
    lineHeight: 28,
  },
  titleFull: {
    flex: 1,
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.textDark,
    lineHeight: 28,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADII.badgeSmall,
  },
  categoryText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
