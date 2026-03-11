import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useStories } from '../../contexts/StoriesContext';
import { ResourceCard } from '../../components/ResourceCard';
import { StoryCard } from '../../components/StoryCard';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { useResources } from '../../hooks/useResources';
import { RESOURCE_CATEGORIES } from '../../constants/resources';
import type { Resource } from '../../constants/resources';
import {
  GRADIENTS,
  ANIMATION,
  TYPOGRAPHY,
  SIZING,
  SPACING,
  RADII,
  BORDERS,
} from '../../constants/onboarding-theme';
import { WebResourceTile, WEB_GRID_GAP, WEB_GRID_COLS } from '../../components/WebResourceTile';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';

const CATEGORIES = ['All', ...RESOURCE_CATEGORIES, 'Design'] as const;
type CategoryTab = (typeof CATEGORIES)[number];
type SegmentType = 'all' | 'saved' | 'downloaded';

const RECENT_SEARCHES_KEY = '@schoolkit_recent_searches';
const MAX_RECENT_SEARCHES = 5;

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  All: 'apps-outline',
  Emotions: 'heart-outline',
  School: 'school-outline',
  Social: 'people-outline',
  Health: 'medical-outline',
  Family: 'home-outline',
  Design: 'color-palette-outline',
};

function AnimatedSection({ children, delay }: { children: React.ReactNode; delay: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    translateY.value = withDelay(delay, withSpring(0, ANIMATION.springSmooth));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}


export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, shadows, appStyles, sharedStyles, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [activeSegment, setActiveSegment] = useState<SegmentType>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('All');

  const indicatorPosition = useSharedValue(0);

  const { isWeb, isDesktop } = useResponsive();
  const isWebDesktop = isWeb && isDesktop;
  const [gridWidth, setGridWidth] = useState(0);
  const tileSize = gridWidth > 0 ? Math.floor((gridWidth - WEB_GRID_GAP * (WEB_GRID_COLS - 1)) / WEB_GRID_COLS) : 0;

  const { bookmarksWithTimestamps, downloads = [] } = useOnboarding();
  const { stories, storyBookmarks, downloadedStories } = useStories();
  const { resources } = useResources();

  const [segmentContainerWidth, setSegmentContainerWidth] = useState(0);

  const headerOpacity = useSharedValue(0);
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    loadRecentSearches();
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));

  const SEGMENT_COUNT = 3;
  const SEGMENT_WIDTH = segmentContainerWidth > 0
    ? (segmentContainerWidth - 8) / SEGMENT_COUNT
    : 0;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value * SEGMENT_WIDTH }],
  }));

  const handleSegmentChange = (segment: SegmentType) => {
    setActiveSegment(segment);
    const idx = segment === 'all' ? 0 : segment === 'saved' ? 1 : 2;
    indicatorPosition.value = withSpring(idx, ANIMATION.springBouncy);
  };

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  };

  const addRecentSearch = async (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
      setShowRecentSearches(false);
    }
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
    setShowRecentSearches(false);
    addRecentSearch(query);
  };

  // All resources
  const allFilteredResources = useMemo(() => resources.filter(resource => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'Design') return matchesSearch && resource.designOnly === true;
    if (resource.designOnly) return false;
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [resources, searchQuery, selectedCategory]);

  // Saved
  const bookmarkedResources = useMemo(() => bookmarksWithTimestamps
    .map(b => {
      const resource = resources.find(r => r.id === b.resourceId);
      return resource ? { ...resource, savedAt: b.savedAt } : null;
    })
    .filter((r): r is Resource & { savedAt: number } => r !== null)
    .filter(r => !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase())),
  [bookmarksWithTimestamps, resources, searchQuery]);

  const bookmarkedStories = useMemo(() => stories
    .filter(s => storyBookmarks.includes(s.id))
    .filter(s => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase())),
  [stories, storyBookmarks, searchQuery]);

  // Downloaded
  const downloadedResources = useMemo(() => downloads
    .map(id => resources.find(r => r.id === id))
    .filter((r): r is Resource => r !== undefined)
    .filter(r => !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase())),
  [downloads, resources, searchQuery]);

  const filteredDownloadedStories = useMemo(() => downloadedStories
    .filter(s => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase())),
  [downloadedStories, searchQuery]);

  const handleResourcePress = (id: string, title: string, route?: string) => {
    if (route) {
      router.push(route as any);
    } else {
      router.push(`/topic-detail?title=${encodeURIComponent(title)}&id=${id}` as any);
    }
  };

  const styles = useMemo(() => makeStyles(colors, shadows, isWebDesktop), [colors, shadows, isWebDesktop]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[appStyles.tabHeader, shadows.header, { paddingTop: insets.top + 10 }, headerStyle]}>
        <Text style={appStyles.tabHeaderTitle}>Library</Text>

        {/* Search bar */}
        <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
          <Ionicons
            name="search"
            size={20}
            color={isFocused ? colors.primary : colors.textLight}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search resources..."
            placeholderTextColor={colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => { setIsFocused(true); setShowRecentSearches(true); }}
            onBlur={() => { setIsFocused(false); setTimeout(() => setShowRecentSearches(false), 200); }}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.textLight} />
            </Pressable>
          )}
        </View>

        {/* 3-segment toggle */}
        <View style={styles.segmentContainer}>
          <View
            style={[styles.segmentBackground, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)' }]}
            onLayout={(e) => setSegmentContainerWidth(e.nativeEvent.layout.width)}
          >
            <Animated.View style={[styles.segmentIndicator, { width: SEGMENT_WIDTH, backgroundColor: colors.white }, indicatorStyle]} />
            {(['all', 'saved', 'downloaded'] as SegmentType[]).map(seg => (
              <TouchableOpacity
                key={seg}
                style={[styles.segmentButton, { width: SEGMENT_WIDTH }]}
                onPress={() => handleSegmentChange(seg)}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, { color: activeSegment === seg ? colors.textDark : colors.textLight }, activeSegment === seg && styles.segmentTextActive]}>
                  {seg === 'all' ? 'All' : seg === 'saved' ? 'Saved' : 'Downloaded'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Recent searches (All segment only) */}
        {showRecentSearches && recentSearches.length > 0 && searchQuery.length === 0 && activeSegment === 'all' && (
          <AnimatedSection delay={100}>
            <View style={styles.recentSearchesContainer}>
              <View style={styles.recentSearchesHeader}>
                <Text style={[styles.label, { color: colors.textLight }]}>Recent Searches</Text>
                <Pressable onPress={clearRecentSearches}>
                  <Text style={[styles.clearRecentText, { color: colors.primary }]}>Clear</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recentSearches.map((query, index) => (
                  <Pressable
                    key={index}
                    style={[styles.recentSearchChip, { backgroundColor: colors.backgroundLighter, borderColor: colors.borderPurple }]}
                    onPress={() => handleRecentSearchPress(query)}
                  >
                    <Ionicons name="time-outline" size={15} color={colors.primary} />
                    <Text style={[styles.recentSearchText, { color: colors.primary }]}>{query}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </AnimatedSection>
        )}

        {/* ── ALL ──────────────────────────────────────────────────────── */}
        {activeSegment === 'all' && (
          <>
            <AnimatedSection delay={150}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
                contentContainerStyle={styles.filtersContent}
              >
                {CATEGORIES.map(category => {
                  const isActive = selectedCategory === category;
                  const iconName = CATEGORY_ICONS[category] || 'ellipse';
                  const chipContent = (
                    <>
                      <Ionicons name={iconName} size={20} color={isActive ? colors.white : colors.textMuted} />
                      <Text style={[styles.filterChipText, { color: isActive ? colors.white : colors.textMuted }]}>
                        {category}
                      </Text>
                    </>
                  );
                  if (isActive) {
                    return (
                      <Pressable key={category} onPress={() => setSelectedCategory(category)}>
                        <LinearGradient
                          colors={[...GRADIENTS.primaryButton] as [string, string, ...string[]]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.filterChip, styles.filterChipActive]}
                        >
                          {chipContent}
                        </LinearGradient>
                      </Pressable>
                    );
                  }
                  return (
                    <Pressable
                      key={category}
                      style={[styles.filterChip, { backgroundColor: colors.white, borderColor: colors.borderCard }]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      {chipContent}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </AnimatedSection>

            {allFilteredResources.length > 0 ? (
              <View
                style={styles.resourcesContainer}
                onLayout={isWebDesktop ? (e) => setGridWidth(e.nativeEvent.layout.width) : undefined}
              >
                {allFilteredResources.map((resource, index) => (
                  isWebDesktop && tileSize > 0 ? (
                    <WebResourceTile
                      key={resource.id}
                      id={resource.id}
                      title={resource.title}
                      category={resource.category}
                      icon={resource.icon}
                      color={resource.color}
                      onPress={() => handleResourcePress(resource.id, resource.title, resource.route)}
                      tileSize={tileSize}
                      showDownloadIndicator
                    />
                  ) : (
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
                      animationBaseDelay={200}
                      staggerDelay={ANIMATION.fastStaggerDelay}
                    />
                  )
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <LinearGradient
                  colors={[...GRADIENTS.primaryButton] as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyIconCircle}
                >
                  <Ionicons name={searchQuery ? 'search-outline' : 'compass-outline'} size={SIZING.iconPage} color={colors.white} />
                </LinearGradient>
                <Text style={sharedStyles.pageTitle}>{searchQuery ? 'No results found' : 'Start exploring'}</Text>
                <Text style={sharedStyles.pageSubtitle}>
                  {searchQuery ? 'Try different keywords or adjust your filters' : 'Search for topics and support materials'}
                </Text>
              </View>
            )}
          </>
        )}

        {/* ── SAVED ────────────────────────────────────────────────────── */}
        {activeSegment === 'saved' && (
          bookmarkedStories.length > 0 || bookmarkedResources.length > 0 ? (
            <>
              {bookmarkedStories.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={[styles.sectionTitle, { color: colors.textDark }]}>Stories</Text>
                  <View style={styles.storiesContainer}>
                    {bookmarkedStories.map((story, index) => (
                      <StoryCard key={story.id} story={story} index={index} />
                    ))}
                  </View>
                </View>
              )}
              {bookmarkedResources.length > 0 && (
                <View style={styles.sectionContainer}>
                  {bookmarkedStories.length > 0 && (
                    <Text style={[styles.sectionTitle, { color: colors.textDark }]}>Resources</Text>
                  )}
                  <View style={styles.resourcesContainer}>
                    {bookmarkedResources.map((resource, index) => (
                      isWebDesktop && tileSize > 0 ? (
                        <WebResourceTile
                          key={resource.id}
                          id={resource.id}
                          title={resource.title}
                          category={resource.category}
                          icon={resource.icon}
                          color={resource.color}
                          onPress={() => handleResourcePress(resource.id, resource.title, resource.route)}
                          tileSize={tileSize}
                          showDownloadIndicator
                        />
                      ) : (
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
                      )
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
              <Text style={sharedStyles.pageTitle}>
                {searchQuery ? 'No saved items match' : 'Nothing saved yet'}
              </Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                {searchQuery ? 'Try a different search term' : 'Bookmark resources and stories to find them here quickly.'}
              </Text>
              {!searchQuery && (
                <PrimaryButton title="Browse Resources" icon="search" onPress={() => handleSegmentChange('all')} />
              )}
            </View>
          )
        )}

        {/* ── DOWNLOADED ───────────────────────────────────────────────── */}
        {activeSegment === 'downloaded' && (
          filteredDownloadedStories.length > 0 || downloadedResources.length > 0 ? (
            <>
              {filteredDownloadedStories.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={[styles.sectionTitle, { color: colors.textDark }]}>Stories</Text>
                  <View style={styles.storiesContainer}>
                    {filteredDownloadedStories.map((story, index) => (
                      <StoryCard key={`dl-${story.id}`} story={story} index={index} />
                    ))}
                  </View>
                </View>
              )}
              {downloadedResources.length > 0 && (
                <View style={styles.sectionContainer}>
                  {filteredDownloadedStories.length > 0 && (
                    <Text style={[styles.sectionTitle, { color: colors.textDark }]}>Resources</Text>
                  )}
                  <View style={styles.resourcesContainer}>
                    {downloadedResources.map((resource, index) => (
                      isWebDesktop && tileSize > 0 ? (
                        <WebResourceTile
                          key={`dl-${resource.id}`}
                          id={resource.id}
                          title={resource.title}
                          category={resource.category}
                          icon={resource.icon}
                          color={resource.color}
                          onPress={() => handleResourcePress(resource.id, resource.title, resource.route)}
                          tileSize={tileSize}
                          showDownloadIndicator
                        />
                      ) : (
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
                      )
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
              <Text style={sharedStyles.pageTitle}>
                {searchQuery ? 'No downloads match' : 'No downloads yet'}
              </Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                {searchQuery ? 'Try a different search term' : 'Download resources and stories to access them offline.'}
              </Text>
              {!searchQuery && (
                <PrimaryButton title="Go to Stories" icon="chatbubbles-outline" onPress={() => router.push('/(tabs)/stories')} />
              )}
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

type C = typeof import('../../constants/theme').COLORS_LIGHT;
type S = typeof import('../../constants/theme').SHADOWS_LIGHT;

const makeStyles = (c: C, s: S, isWebDesktop = false) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingHorizontal: 14,
      backgroundColor: c.white,
      borderRadius: RADII.cardLarge,
      borderWidth: BORDERS.card,
      borderColor: c.borderCard,
      ...s.small,
    },
    searchContainerFocused: {
      borderColor: c.primary,
      borderWidth: BORDERS.cardSelected,
      ...s.cardSelected,
    },
    searchIcon: { marginRight: 8 },
    searchInput: {
      flex: 1,
      paddingVertical: 13,
      ...TYPOGRAPHY.body,
      color: c.textDark,
    },
    clearButton: { padding: 4 },
    segmentContainer: {
      marginTop: 14,
      marginBottom: 2,
    },
    segmentBackground: {
      flexDirection: 'row',
      borderRadius: 12,
      padding: 4,
      position: 'relative',
    },
    segmentIndicator: {
      position: 'absolute',
      top: 4,
      left: 4,
      bottom: 4,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    segmentButton: {
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: '600',
    },
    segmentTextActive: {
      fontWeight: '700',
    },
    recentSearchesContainer: {
      marginBottom: SPACING.itemGap,
    },
    recentSearchesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    clearRecentText: { fontSize: 13 },
    recentSearchChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: RADII.button,
      marginRight: 8,
      borderWidth: BORDERS.input,
    },
    recentSearchText: {
      fontSize: 13,
      fontWeight: '500',
      marginLeft: 5,
    },
    filtersContainer: { marginBottom: SPACING.smallGap },
    filtersContent: {
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: RADII.badge,
      borderWidth: BORDERS.card,
      marginRight: 10,
      ...s.card,
    },
    filterChipActive: {
      borderWidth: 0,
      ...s.button,
    },
    filterChipText: {
      fontSize: 16,
      fontWeight: '700',
    },
    scrollContent: {
      paddingHorizontal: SPACING.screenPadding,
      paddingTop: SPACING.itemGap,
      paddingBottom: 40,
    },
    sectionContainer: { marginBottom: 20 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
    },
    resourcesContainer: isWebDesktop
      ? { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: WEB_GRID_GAP }
      : { gap: 10 },
    storiesContainer: {
      gap: 10,
      width: '100%',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 16,
    },
    emptyIconCircle: {
      width: SIZING.circlePage,
      height: SIZING.circlePage,
      borderRadius: SIZING.circlePage / 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.sectionGap,
    },
  });
