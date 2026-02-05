import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
      <Animated.View style={[styles.card, SHADOWS.card, cardStyle]}>
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
            <Text style={styles.title}>{title}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: withOpacity(color, 0.1) }]}>
              <Text style={[styles.categoryText, { color }]}>{category}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.titleFull}>{title}</Text>
        )}

        <View style={styles.actions}>
          {showDownloadIndicator && <DownloadIndicator resourceId={id} />}
          <BookmarkButton resourceId={id} color={color} size={22} />
          <Ionicons name="chevron-forward" size={22} color={COLORS.textLight} />
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
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
    lineHeight: 24,
  },
  titleFull: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.textDark,
    lineHeight: 24,
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
