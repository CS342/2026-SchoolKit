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
} from '../../constants/onboarding-theme';

// Default color for topics not in resources
const DEFAULT_COLOR = COLORS.primary;

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

interface TopicCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  resourceId: string | null;
  onPress: () => void;
  index: number;
}

function TopicCard({ title, icon, color, resourceId, onPress, index }: TopicCardProps) {
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
      <Animated.View style={[styles.topicCard, SHADOWS.card, cardStyle]}>
        <LinearGradient
          colors={[...gradient] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.topicIconCircle}
        >
          <Ionicons name={icon} size={SIZING.iconRole} color={COLORS.white} />
        </LinearGradient>

        <Text style={styles.topicTitle}>{title}</Text>

        <View style={styles.topicActions}>
          {resourceId && <BookmarkButton resourceId={resourceId} color={color} size={22} />}
          <Ionicons name="chevron-forward" size={22} color={COLORS.textLight} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function ForYouScreen() {
  const router = useRouter();
  const { data } = useOnboarding();
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const getRoleDisplayName = () => {
    switch (data.role) {
      case 'student-k8':
        return 'Student (K-8)';
      case 'student-hs':
        return 'Student (High School+)';
      case 'parent':
        return 'Parent/Caregiver';
      case 'staff':
        return 'School Staff';
      default:
        return 'User';
    }
  };

  const handleTopicPress = (topic: string, route?: string) => {
    if (route) {
      router.push(route as any);
    } else {
      router.push(`/topic-detail?title=${encodeURIComponent(topic)}`);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[APP_STYLES.tabHeader, headerStyle]}>
        <Text style={[APP_STYLES.tabHeaderSubtitle, { marginBottom: 4 }]}>Welcome back,</Text>
        <Text style={[APP_STYLES.tabHeaderTitle, { marginBottom: 12 }]}>{data.name}!</Text>
        <View style={[SHARED_STYLES.badge, styles.roleBadge]}>
          <Ionicons name="person-circle-outline" size={16} color={COLORS.primary} />
          <Text style={[SHARED_STYLES.badgeText, styles.roleBadgeText]}>
            {getRoleDisplayName()}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Your Support Topics</Text>

        {data.topics.length > 0 ? (
          <View style={styles.topicsContainer}>
            {data.topics.map((topic, index) => {
              const resource = ALL_RESOURCES.find(r => r.title === topic);
              const color = resource?.color || DEFAULT_COLOR;
              const icon = resource?.icon || 'bookmarks';
              return (
                <TopicCard
                  key={index}
                  title={topic}
                  icon={icon as keyof typeof Ionicons.glyphMap}
                  color={color}
                  resourceId={resource?.id || null}
                  onPress={() => handleTopicPress(topic, resource?.route)}
                  index={index}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={SHARED_STYLES.pageIconCircle}>
              <Ionicons name="compass-outline" size={SIZING.iconPage} color={COLORS.primary} />
            </View>
            <Text style={SHARED_STYLES.pageTitle}>No topics selected yet</Text>
            <Text style={[SHARED_STYLES.pageSubtitle, { marginBottom: 28 }]}>
              Visit your profile to update your interests and get personalized support.
            </Text>
            <PrimaryButton
              title="Update Profile"
              onPress={() => router.push('/(tabs)/profile')}
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
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  roleBadgeText: {
    marginLeft: 0,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.sectionGap,
    paddingBottom: 40,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textDark,
    marginBottom: SPACING.sectionGap,
  },
  topicsContainer: {
    gap: SPACING.itemGap,
  },
  topicCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    padding: 16,
    borderWidth: BORDERS.card,
    borderColor: COLORS.borderCard,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicIconCircle: {
    width: SIZING.circleRole,
    height: SIZING.circleRole,
    borderRadius: SIZING.circleRole / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  topicTitle: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.textDark,
    lineHeight: 24,
  },
  topicActions: {
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
