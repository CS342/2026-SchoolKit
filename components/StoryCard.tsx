import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Animated as RNAnimated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Story, useStories } from '../contexts/StoriesContext';
import { UserRole } from '../contexts/OnboardingContext';
import {
  COLORS,
  SHADOWS,
  ANIMATION,
  TYPOGRAPHY,
  RADII,
  BORDERS,
  SPACING,
  withOpacity,
} from '../constants/onboarding-theme';

interface StoryCardProps {
  story: Story;
  index: number;
}

function getRoleColor(role: UserRole | null): string {
  switch (role) {
    case 'student-k8': return COLORS.studentK8;
    case 'student-hs': return COLORS.studentHS;
    case 'parent': return COLORS.parent;
    case 'staff': return COLORS.staff;
    default: return COLORS.primary;
  }
}

function getRoleLabel(role: UserRole | null): string {
  switch (role) {
    case 'student-k8': return 'Student';
    case 'student-hs': return 'Student';
    case 'parent': return 'Parent';
    case 'staff': return 'Staff';
    default: return '';
  }
}

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function StoryCard({ story, index }: StoryCardProps) {
  const router = useRouter();
  const { isStoryBookmarked, addStoryBookmark, removeStoryBookmark } = useStories();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);
  const bookmarkScale = useRef(new RNAnimated.Value(1)).current;

  const roleColor = getRoleColor(story.author_role);
  const roleLabel = getRoleLabel(story.author_role);
  const initial = (story.author_name || '?')[0].toUpperCase();
  const bookmarked = isStoryBookmarked(story.id);

  useEffect(() => {
    const delay = index * ANIMATION.staggerDelay;
    translateY.value = withDelay(delay, withSpring(0, ANIMATION.springBouncy));
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
    router.push(`/story-detail?id=${story.id}` as any);
  };

  const handleBookmark = () => {
    RNAnimated.sequence([
      RNAnimated.timing(bookmarkScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      RNAnimated.spring(bookmarkScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();

    if (bookmarked) {
      removeStoryBookmark(story.id);
    } else {
      addStoryBookmark(story.id);
    }
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.card, SHADOWS.card, cardStyle]}>
        {/* Author row */}
        <View style={styles.authorRow}>
          <View style={[styles.avatarCircle, { backgroundColor: roleColor }]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <View style={styles.authorInfo}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName} numberOfLines={1}>{story.author_name || 'Anonymous'}</Text>
              {roleLabel ? (
                <View style={[styles.roleBadge, { backgroundColor: withOpacity(roleColor, 0.1) }]}>
                  <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.timeText}>{getRelativeTime(story.created_at)}</Text>
          </View>
        </View>

        {/* Content */}
        <Text style={styles.title} numberOfLines={2}>{story.title}</Text>
        <Text style={styles.bodyPreview} numberOfLines={3}>{story.body}</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Ionicons name="chatbubble-outline" size={16} color={COLORS.textLight} />
            <Text style={styles.footerText}>
              {story.comment_count} {story.comment_count === 1 ? 'comment' : 'comments'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleBookmark}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <RNAnimated.View style={{ transform: [{ scale: bookmarkScale }] }}>
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={bookmarked ? COLORS.primary : COLORS.textLight}
              />
            </RNAnimated.View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    padding: 18,
    borderWidth: BORDERS.card,
    borderColor: COLORS.borderCard,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    flexShrink: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADII.badgeSmall,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textLight,
    marginTop: 1,
  },
  title: {
    ...TYPOGRAPHY.body,
    color: COLORS.textDark,
    marginBottom: 6,
    lineHeight: 24,
  },
  bodyPreview: {
    ...TYPOGRAPHY.bodyDescription,
    color: COLORS.textMuted,
    lineHeight: 22,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    paddingTop: 12,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
  },
});
