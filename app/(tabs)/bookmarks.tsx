import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useStories } from '../../contexts/StoriesContext';
import { ResourceCard } from '../../components/ResourceCard';
import { StoryCard } from '../../components/StoryCard';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { useResources } from '../../hooks/useResources';
import type { Resource } from '../../constants/resources';
import {
  SIZING,
  SPACING,
  ANIMATION,
} from '../../constants/onboarding-theme';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'saved' | 'downloaded';

export default function BookmarksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookmarksWithTimestamps, downloads = [] } = useOnboarding();
  const { stories, storyBookmarks, downloadedStories } = useStories();
  const { resources } = useResources();
  const { colors, appStyles, sharedStyles } = useTheme();
  const headerOpacity = useSharedValue(0);
  
  const [activeTab, setActiveTab] = useState<TabType>('saved');
  const indicatorPosition = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  useEffect(() => {
    indicatorPosition.value = withSpring(activeTab === 'saved' ? 0 : 1, ANIMATION.springBouncy);
  }, [activeTab]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value * ((SCREEN_WIDTH - 40) / 2) }],
  }));

  // Get bookmarked resources sorted by most recently saved
  const bookmarkedResources = bookmarksWithTimestamps
    .map(b => {
      const resource = resources.find(r => r.id === b.resourceId);
      return resource ? { ...resource, savedAt: b.savedAt } : null;
    })
    .filter((r): r is Resource & { savedAt: number } => r !== null);

  // Get bookmarked stories
  const bookmarkedStories = stories.filter(s => storyBookmarks.includes(s.id));

  // Get downloaded resources
  const downloadedResources = downloads
    .map(id => resources.find(r => r.id === id))
    .filter((r): r is Resource => r !== undefined);

  const totalSaved = bookmarkedResources.length + bookmarkedStories.length;
  const totalDownloaded = downloadedResources.length + downloadedStories.length;

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
          <Text style={[appStyles.tabHeaderTitle, { marginBottom: 0 }]}>Library</Text>
        </View>
        <Text style={appStyles.tabHeaderSubtitle}>Your saved resources and offline stories</Text>

        <View style={styles.tabsContainer}>
          <View style={styles.tabBackground}>
            <Animated.View style={[styles.tabIndicator, indicatorStyle]} />
            
            <TouchableOpacity 
              style={styles.tabButton} 
              onPress={() => setActiveTab('saved')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
                Saved
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.tabButton} 
              onPress={() => setActiveTab('downloaded')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'downloaded' && styles.tabTextActive]}>
                Downloaded
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'saved' ? (
          totalSaved > 0 ? (
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
          )
        ) : (
          totalDownloaded > 0 ? (
            <>
              {downloadedStories.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Stories ({downloadedStories.length})</Text>
                  <View style={styles.resourcesContainer}>
                    {downloadedStories.map((story, index) => (
                      <StoryCard key={`dl-${story.id}`} story={story} index={index} />
                    ))}
                  </View>
                </View>
              )}
              {downloadedResources.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Resources ({downloadedResources.length})</Text>
                  <View style={styles.resourcesContainer}>
                    {downloadedResources.map((resource, index) => (
                      <ResourceCard
                        key={`dl-${resource.id}`}
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
                  <Ionicons name="download-outline" size={SIZING.iconPage} color={colors.primary} />
              </View>
              <Text style={sharedStyles.pageTitle}>No downloads</Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                Download stories to read them later when you're offline.
              </Text>
              <PrimaryButton
                title="Read Stories"
                icon="book-outline"
                onPress={() => router.push('/(tabs)/stories')}
              />
            </View>
          )
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
    tabsContainer: {
      marginTop: 20,
      marginBottom: 4,
    },
    tabBackground: {
      flexDirection: 'row',
      backgroundColor: 'rgba(0,0,0,0.04)',
      borderRadius: 12,
      padding: 4,
      position: 'relative',
    },
    tabIndicator: {
      position: 'absolute',
      top: 4,
      left: 4,
      bottom: 4,
      width: '50%',
      backgroundColor: c.white,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textLight,
    },
    tabTextActive: {
      color: c.textDark,
      fontWeight: '700',
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
