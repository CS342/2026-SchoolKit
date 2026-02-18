import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useStories } from '../../contexts/StoriesContext';
import { ResourceCard } from '../../components/ResourceCard';
import { StoryCard } from '../../components/StoryCard';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { ALL_RESOURCES } from '../../constants/resources';
import {
  SIZING,
  SPACING,
} from '../../constants/onboarding-theme';
import { useTheme } from '../../contexts/ThemeContext';

// Exporting BookmarksScreen as default component
export default function BookmarksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookmarksWithTimestamps } = useOnboarding();
  const { stories, storyBookmarks } = useStories();
  const { colors, appStyles, sharedStyles } = useTheme();
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

  // Get bookmarked stories
  const bookmarkedStories = stories.filter(s => storyBookmarks.includes(s.id));

  const totalSaved = bookmarkedResources.length + bookmarkedStories.length;

  const handleResourcePress = (id: string, title: string, route?: string) => {
    if (route) {
      router.push(route as any);
    } else {
      router.push(`/topic-detail?title=${encodeURIComponent(title)}&id=${id}` as any);
    }
  };

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Animated.View style={[appStyles.tabHeader, { paddingTop: insets.top + 10 }, headerStyle]}>
        <View style={styles.headerTitleRow}>
          <Text style={[appStyles.tabHeaderTitle, { marginBottom: 0 }]}>Saved</Text>
          <View style={[sharedStyles.badge, styles.countBadge]}>
            <Ionicons name="bookmark" size={14} color={colors.primary} />
            <Text style={sharedStyles.badgeText}>
              {totalSaved} saved
            </Text>
          </View>
        </View>
        <Text style={appStyles.tabHeaderSubtitle}>Your bookmarked resources</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {totalSaved > 0 ? (
          <>
            {bookmarkedStories.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Stories</Text>
                <View style={styles.resourcesContainer}>
                  {bookmarkedStories.map((story, index) => (
                    <StoryCard key={story.id} story={story} index={index} />
                  ))}
                </View>
              </View>
            )}
            {bookmarkedResources.length > 0 && (
              <View style={styles.sectionContainer}>
                {bookmarkedStories.length > 0 && (
                  <Text style={styles.sectionTitle}>Resources</Text>
                )}
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
                      showDownloadIndicator
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={sharedStyles.pageIconCircle}>
              <Ionicons name="bookmark-outline" size={SIZING.iconPage} color={colors.primary} />
            </View>
            <Text style={sharedStyles.pageTitle}>Nothing saved yet</Text>
            <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
              Bookmark resources and stories to save them here for quick access.
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

const makeStyles = (c: typeof import('../../constants/theme').COLORS_LIGHT) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
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
    sectionContainer: {
      marginBottom: SPACING.sectionGap,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textDark,
      marginBottom: 12,
    },
    resourcesContainer: {
      gap: SPACING.itemGap,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 16,
    },
  });
