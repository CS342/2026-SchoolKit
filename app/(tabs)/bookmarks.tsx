import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
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
import { useOnboarding } from '../../contexts/OnboardingContext';
import { BookmarkButton } from '../../components/BookmarkButton';
import { DownloadIndicator } from '../../components/DownloadIndicator';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { ALL_RESOURCES } from '../../constants/resources';
import {
  COLORS,
  GRADIENTS,
  SHADOWS,
  ANIMATION,
  TYPOGRAPHY,
  SIZING,
  SPACING,
  RADII,
  BORDERS,
  SHARED_STYLES,
  APP_STYLES,
  withOpacity,
} from '../../constants/onboarding-theme';

// Map resource colors to gradient pairs for icon circles
function getGradientForColor(color: string): readonly [string, string] {
  switch (color) {
    case '#0EA5E9':
      return GRADIENTS.roleStudentK8;
    case '#7B68EE':
      return GRADIENTS.roleStudentHS;
    case '#EC4899':
      return GRADIENTS.roleParent;
    case '#66D9A6':
      return GRADIENTS.roleStaff;
    case '#EF4444':
      return ['#EF4444', '#F87171'] as const;
    case '#3B82F6':
      return ['#3B82F6', '#60A5FA'] as const;
    default:
      return GRADIENTS.roleStudentHS;
  }
}

interface ResourceCardProps {
  id: string;
  title: string;
  category: string;
  icon: string;
  color: string;
  onPress: () => void;
  index: number;
}

function ResourceCard({ id, title, category, icon, color, onPress, index }: ResourceCardProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      index * ANIMATION.staggerDelay,
      withSpring(0, ANIMATION.springBouncy),
    );
    opacity.value = withDelay(
      index * ANIMATION.staggerDelay,
      withTiming(1, { duration: 400 }),
    );
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
      <Animated.View style={[styles.resourceCard, SHADOWS.card, cardStyle]}>
        <LinearGradient
          colors={[...gradient] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.resourceIconCircle}
        >
          <Ionicons name={icon as any} size={SIZING.iconRole} color={COLORS.white} />
        </LinearGradient>

        <View style={styles.resourceContent}>
          <Text style={styles.resourceTitle}>{title}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: withOpacity(color, 0.082) }]}>
            <Text style={[styles.categoryText, { color }]}>{category}</Text>
          </View>
        </View>

        <View style={styles.resourceActions}>
          <DownloadIndicator resourceId={id} />
          <BookmarkButton resourceId={id} color={color} size={22} />
          <Ionicons name="chevron-forward" size={22} color={COLORS.textLight} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function BookmarksScreen() {
  const router = useRouter();
  const { bookmarksWithTimestamps } = useOnboarding();
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  // Get bookmarked resources sorted by most recently saved
  const bookmarkedResources = bookmarksWithTimestamps
    .map(b => {
      const resource = ALL_RESOURCES.find(r => r.id === b.resourceId);
      return resource ? { ...resource, savedAt: b.savedAt } : null;
    })
    .filter((r): r is typeof ALL_RESOURCES[0] & { savedAt: number } => r !== null);

  const handleResourcePress = (id: string, title: string, route?: string) => {
    if (route) {
      router.push(route as any);
    } else {
      router.push(`/topic-detail?title=${encodeURIComponent(title)}&id=${id}` as any);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[APP_STYLES.tabHeader, headerStyle]}>
        <View style={styles.headerTitleRow}>
          <Text style={[APP_STYLES.tabHeaderTitle, { marginBottom: 0 }]}>Saved</Text>
          <View style={[SHARED_STYLES.badge, styles.countBadge]}>
            <Ionicons name="bookmark" size={14} color={COLORS.primary} />
            <Text style={SHARED_STYLES.badgeText}>
              {bookmarkedResources.length} saved
            </Text>
          </View>
        </View>
        <Text style={APP_STYLES.tabHeaderSubtitle}>Your bookmarked resources</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {bookmarkedResources.length > 0 ? (
          <View style={styles.resourcesContainer}>
            {bookmarkedResources.map((resource, index) => (
              <ResourceCard
                key={resource.id}
                id={resource.id}
                title={resource.title}
                category={resource.category}
                icon={resource.icon}
                color={resource.color}
                onPress={() => handleResourcePress(resource.id, resource.title, resource.route)}
                index={index}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={SHARED_STYLES.pageIconCircle}>
              <Ionicons name="bookmark-outline" size={SIZING.iconPage} color={COLORS.primary} />
            </View>
            <Text style={SHARED_STYLES.pageTitle}>No saved resources yet</Text>
            <Text style={[SHARED_STYLES.pageSubtitle, { marginBottom: 28 }]}>
              Tap the bookmark icon on any resource to save it here for quick access.
            </Text>
            <PrimaryButton
              title="Browse Resources"
              icon="search"
              onPress={() => router.push('/(tabs)/search')}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.sectionGap,
    paddingBottom: 40,
  },
  resourcesContainer: {
    gap: SPACING.itemGap,
  },
  resourceCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    padding: 16,
    borderWidth: BORDERS.card,
    borderColor: COLORS.borderCard,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceIconCircle: {
    width: SIZING.circleRole,
    height: SIZING.circleRole,
    borderRadius: SIZING.circleRole / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textDark,
    lineHeight: 24,
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.badgeSmall,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resourceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
});
