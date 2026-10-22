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
import { ScreenHeader, ResourceRow, AppIcon } from "../../components/ui";
import { BookmarkButton } from '../../components/BookmarkButton';
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
import { useTranslation } from 'react-i18next';
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
import { WEB_GRID_GAP } from '../../components/WebResourceTile';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive, gridColumns, CONTENT_WIDTH } from '../../hooks/useResponsive';
import { ThemeColors, ThemeShadows } from '../../constants/theme';

const CATEGORIES = ['All', ...RESOURCE_CATEGORIES, 'Designs'] as const;
type CategoryTab = (typeof CATEGORIES)[number];
type SegmentType = 'all' | 'saved' | 'downloaded';
type SortMode = 'recommended' | 'az' | 'category';

const SORT_OPTIONS: { value: SortMode }[] = [
  { value: 'recommended' },
  { value: 'az' },
  { value: 'category' },
];

function sortResources(list: Resource[], mode: SortMode): Resource[] {
  if (mode === 'recommended') return list;
  const copy = [...list];
  if (mode === 'az') return copy.sort((a, b) => a.title.localeCompare(b.title));
  // 'category': group by category, A–Z within each
  return copy.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
}

const RECENT_SEARCHES_KEY = '@schoolkit_recent_searches';
const MAX_RECENT_SEARCHES = 5;

// AppIcon names: Ionicons, or `mci:` for Material Community Icons.
const CATEGORY_ICONS: Record<string, string> = {
  All: 'apps-outline',
  School: 'mci:school-outline',
  Social: 'mci:forum-outline',
  Health: 'mci:heart-pulse',
  Family: 'mci:home-heart',
  Designs: 'color-palette-outline',
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
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, shadows, gradients, appStyles, sharedStyles, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [activeSegment, setActiveSegment] = useState<SegmentType>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('All');
  const [webViewMode, setWebViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortMode>('recommended');

  const { isAdmin } = useAuth();
  // Designs is an admin-only catalog, gated like the Content tab in the sidebar.
  const visibleCategories = useMemo<readonly CategoryTab[]>(
    () => (isAdmin ? CATEGORIES : CATEGORIES.filter(c => c !== 'Designs')),
    [isAdmin],
  );
  useEffect(() => {
    if (!isAdmin && selectedCategory === 'Designs') setSelectedCategory('All');
  }, [isAdmin, selectedCategory]);

  const indicatorPosition = useSharedValue(0);

  const { isWeb, isDesktop } = useResponsive();
  const isWebDesktop = isWeb && isDesktop;
  const [gridWidth, setGridWidth] = useState(0);
  // Web catalog grid (ResourceRow) — denser, responsive, capped at app width.
  const WEB_ROW_GAP = 16;
  const webRowCols = webViewMode === 'list'
    ? 1
    : (gridWidth > 0 ? gridColumns(gridWidth, 360) : 1);
  const webRowWidth = gridWidth > 0
    ? Math.floor((gridWidth - WEB_ROW_GAP * (webRowCols - 1)) / webRowCols)
    : undefined;

  const { bookmarksWithTimestamps, downloads = [] } = useOnboarding();
  const { stories, storyBookmarks, downloadedStories } = useStories();
  // `resources` (audience-filtered) drives browsing; saved/downloaded look up
  // `allResources` so they keep showing after a role or grade change.
  const { resources, allResources, loading: resourcesLoading } = useResources();

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
    if (selectedCategory === 'Designs') {
      return resource.designOnly && matchesSearch;
    }
    if (resource.designOnly) return false;
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [resources, searchQuery, selectedCategory]);

  const sortedAllResources = useMemo(
    () => sortResources(allFilteredResources, sortBy),
    [allFilteredResources, sortBy],
  );

  // Saved
  const bookmarkedResources = useMemo(() => bookmarksWithTimestamps
    .map(b => {
      const resource = allResources.find(r => r.id === b.resourceId);
      return resource ? { ...resource, savedAt: b.savedAt } : null;
    })
    .filter((r): r is Resource & { savedAt: number } => r !== null)
    .filter(r => !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase())),
  [bookmarksWithTimestamps, allResources, searchQuery]);

  const bookmarkedStories = useMemo(() => stories
    .filter(s => storyBookmarks.includes(s.id))
    .filter(s => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase())),
  [stories, storyBookmarks, searchQuery]);

  // Downloaded
  const downloadedResources = useMemo(() => downloads
    .map(id => allResources.find(r => r.id === id))
    .filter((r): r is Resource => r !== undefined)
    .filter(r => !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase())),
  [downloads, allResources, searchQuery]);

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

  // Web-only: dense, left-aligned catalog grid of compact ResourceRow cards.
  const renderWebRows = (list: Resource[], keyPrefix = '') => (
    <View
      style={styles.webRowsContainer}
      onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
    >
      {list.map(resource => (
        // Width-fixed column wrapper so cards in a row stretch to equal height
        // (ResourceRow's Card uses fillHeight → flex:1 inside this column).
        <View key={`${keyPrefix}${resource.id}`} style={webRowWidth ? { width: webRowWidth } : { width: '100%' }}>
          <ResourceRow
            title={resource.title}
            icon={resource.icon as keyof typeof Ionicons.glyphMap}
            color={resource.color}
            category={resource.category}
            description={resource.shortDescription}
            downloaded={downloads.includes(resource.id)}
            fillHeight
            onPress={() => handleResourcePress(resource.id, resource.title, resource.route)}
            right={<BookmarkButton resourceId={resource.id} size={20} />}
          />
        </View>
      ))}
    </View>
  );

  // Placeholder cards shown while the resource list is loading and empty.
  const renderWebSkeleton = () => (
    <View style={styles.webRowsContainer}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={`sk-${i}`} style={[styles.skeletonCard, webRowWidth ? { width: webRowWidth } : { width: '100%' }]}>
          <View style={styles.skeletonChip} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.skeletonLine, { width: '80%' }]} />
            <View style={[styles.skeletonLine, { width: '45%', height: 10 }]} />
            <View style={[styles.skeletonLine, { width: '95%', height: 10, marginTop: 6 }]} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader title={t('home.library.title')} subtitle={t('home.library.subtitle')} />
      <Animated.View style={[styles.headerWrap, headerStyle]}>
        <View style={isWebDesktop ? styles.webToolbarRow : undefined}>
        {/* Search bar */}
        <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused, isWebDesktop && styles.searchContainerWeb]}>
          <Ionicons
            name="search"
            size={20}
            color={isFocused ? colors.primary : colors.textLight}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t('home.library.searchPlaceholder')}
            placeholderTextColor={colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => { setIsFocused(true); setShowRecentSearches(true); }}
            onBlur={() => { setIsFocused(false); setTimeout(() => setShowRecentSearches(false), 200); }}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.a11y.clearSearch')} onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.textLight} />
            </Pressable>
          )}
        </View>

        {/* 3-segment toggle */}
        <View style={[styles.segmentContainer, isWebDesktop && styles.segmentContainerWeb]}>
          <View
            style={[styles.segmentBackground, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)' }]}
            onLayout={(e) => setSegmentContainerWidth(e.nativeEvent.layout.width)}
          >
            <Animated.View style={[styles.segmentIndicator, { width: SEGMENT_WIDTH, backgroundColor: colors.white, shadowColor: colors.shadow }, indicatorStyle]} />
            {(['all', 'saved', 'downloaded'] as SegmentType[]).map(seg => (
              <TouchableOpacity
                key={seg}
                style={[styles.segmentButton, { width: SEGMENT_WIDTH }]}
                onPress={() => handleSegmentChange(seg)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={seg === 'all' ? t('home.segment.all') : seg === 'saved' ? t('home.segment.saved') : t('home.segment.downloaded')}
                accessibilityState={{ selected: activeSegment === seg }}
              >
                <Text style={[styles.segmentText, { color: activeSegment === seg ? colors.textDark : colors.textLight }, activeSegment === seg && styles.segmentTextActive]}>
                  {seg === 'all' ? t('home.segment.all') : seg === 'saved' ? t('home.segment.saved') : t('home.segment.downloaded')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* View toggle (web only) */}
        {isWebDesktop && (
          <View style={[styles.viewToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)' }]}>
            {(['grid', 'list'] as const).map(mode => {
              const active = webViewMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setWebViewMode(mode)}
                  style={[styles.viewToggleBtn, active && { backgroundColor: colors.white, shadowColor: colors.shadow }]}
                  accessibilityLabel={mode === 'grid' ? t('home.view.grid') : t('home.view.list')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons
                    name={mode === 'grid' ? 'grid-outline' : 'list-outline'}
                    size={18}
                    color={active ? colors.primary : colors.textLight}
                  />
                </Pressable>
              );
            })}
          </View>
        )}
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
                <Text style={[styles.label, { color: colors.textLight }]}>{t('home.recent.title')}</Text>
                <Pressable onPress={clearRecentSearches}>
                  <Text style={[styles.clearRecentText, { color: colors.primary }]}>{t('home.recent.clear')}</Text>
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
              {isWebDesktop && (
                <View style={styles.filtersCaptionRow}>
                  <Text style={[styles.filtersCaption, { color: colors.textLight }]}>{t('home.library.browseByTopic')}</Text>
                </View>
              )}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.filtersContainer, isWebDesktop && styles.filtersContainerWeb]}
                contentContainerStyle={styles.filtersContent}
              >
                {visibleCategories.map(category => {
                  const isActive = selectedCategory === category;
                  const iconName = CATEGORY_ICONS[category] || 'ellipse';
                  const categoryLabel = t(`home.categories.${category}`, { defaultValue: category });
                  const chipContent = (
                    <>
                      <AppIcon name={iconName} size={20} color={isActive ? '#FFFFFF' : colors.textMuted} />
                      <Text style={[styles.filterChipText, { color: isActive ? '#FFFFFF' : colors.textMuted }]}>
                        {categoryLabel}
                      </Text>
                    </>
                  );
                  if (isActive) {
                    return (
                      <Pressable
                        key={category}
                        onPress={() => setSelectedCategory(category)}
                        accessibilityRole="button"
                        accessibilityLabel={categoryLabel}
                        accessibilityState={{ selected: true }}
                      >
                        <LinearGradient
                          colors={[...gradients.primaryButton]}
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
                      accessibilityRole="button"
                      accessibilityLabel={categoryLabel}
                      accessibilityState={{ selected: false }}
                    >
                      {chipContent}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </AnimatedSection>

            {/* Result count + sort + active-filter reset (web). Anchors the grid
                and separates the topic filter from the scope segment above. */}
            {isWebDesktop && (allFilteredResources.length > 0 || resourcesLoading) && (
              <AnimatedSection delay={180}>
                <View style={styles.countSortRow}>
                  <View style={styles.countSortLeft}>
                    <Text style={[styles.countText, { color: colors.textMuted }]}>
                      {resourcesLoading && allFilteredResources.length === 0
                        ? t('common.loading')
                        : allFilteredResources.length === 1
                          ? t('home.resultsOne', { count: allFilteredResources.length })
                          : t('home.resultsOther', { count: allFilteredResources.length })}
                    </Text>
                    {(selectedCategory !== 'All' || searchQuery.length > 0) && (
                      <Pressable
                        onPress={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                        style={styles.clearFilterBtn}
                        accessibilityRole="button"
                        accessibilityLabel={t('home.filters.clearFilters')}
                      >
                        <Ionicons name="close-circle" size={15} color={colors.primary} />
                        <Text style={[styles.clearFilterText, { color: colors.primary }]}>
                          {t('home.filters.clear')}{selectedCategory !== 'All' ? ` · ${selectedCategory}` : ''}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  <View style={styles.sortGroup}>
                    <Text style={[styles.sortLabel, { color: colors.textLight }]}>{t('home.sort.label')}</Text>
                    {SORT_OPTIONS.map(opt => {
                      const active = sortBy === opt.value;
                      const optLabel = t(`home.sort.${opt.value}`);
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => setSortBy(opt.value)}
                          style={[styles.sortChip, active && { backgroundColor: colors.primarySoft }]}
                          accessibilityRole="button"
                          accessibilityLabel={t('home.sort.sortByA11y', { label: optLabel })}
                          accessibilityState={{ selected: active }}
                        >
                          <Text style={[styles.sortChipText, { color: active ? colors.primary : colors.textMuted }]}>
                            {optLabel}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </AnimatedSection>
            )}

            {isWebDesktop && resourcesLoading && allFilteredResources.length === 0 ? (
              renderWebSkeleton()
            ) : sortedAllResources.length > 0 ? (
              isWebDesktop ? renderWebRows(sortedAllResources) : (
                <View style={styles.resourcesContainer}>
                  {sortedAllResources.map((resource, index) => (
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
                  ))}
                </View>
              )
            ) : (
              <View style={styles.emptyContainer}>
                <LinearGradient
                  colors={[...gradients.primaryButton]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyIconCircle}
                >
                  <Ionicons name={searchQuery ? 'search-outline' : 'compass-outline'} size={SIZING.iconPage} color="#FFFFFF" />
                </LinearGradient>
                <Text style={sharedStyles.pageTitle}>{(searchQuery || selectedCategory !== 'All') ? t('home.library.emptyAllTitleFiltered') : t('home.library.emptyAllTitle')}</Text>
                <Text style={[sharedStyles.pageSubtitle, (searchQuery || selectedCategory !== 'All') && { marginBottom: 24 }]}>
                  {(searchQuery || selectedCategory !== 'All') ? t('home.library.emptyAllSubtitleFiltered') : t('home.library.emptyAllSubtitle')}
                </Text>
                {(searchQuery || selectedCategory !== 'All') && (
                  <PrimaryButton title={t('home.filters.clearFilters')} icon="close-circle-outline" onPress={() => { setSelectedCategory('All'); setSearchQuery(''); }} />
                )}
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
                  <Text style={[styles.sectionTitle, { color: colors.textDark }]}>{t('home.sections.stories')}</Text>
                  <View style={styles.storiesContainer}>
                    {bookmarkedStories.map((story, index) => (
                      <View key={story.id} style={styles.storyGridItem}>
                        <StoryCard story={story} index={index} />
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {bookmarkedResources.length > 0 && (
                <View style={styles.sectionContainer}>
                  {bookmarkedStories.length > 0 && (
                    <Text style={[styles.sectionTitle, { color: colors.textDark }]}>{t('home.sections.resources')}</Text>
                  )}
                  {isWebDesktop ? renderWebRows(bookmarkedResources) : (
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
                  )}
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={sharedStyles.pageIconCircle}>
                <Ionicons name="bookmark-outline" size={SIZING.iconPage} color={colors.primary} />
              </View>
              <Text style={sharedStyles.pageTitle}>
                {searchQuery ? t('home.saved.emptyTitleSearch') : t('home.saved.emptyTitle')}
              </Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                {searchQuery ? t('home.emptySearchHint') : t('home.saved.emptySubtitle')}
              </Text>
              {!searchQuery && (
                <PrimaryButton title={t('home.actions.browseResources')} icon="search" onPress={() => handleSegmentChange('all')} />
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
                  <Text style={[styles.sectionTitle, { color: colors.textDark }]}>{t('home.sections.stories')}</Text>
                  <View style={styles.storiesContainer}>
                    {filteredDownloadedStories.map((story, index) => (
                      <View key={`dl-${story.id}`} style={styles.storyGridItem}>
                        <StoryCard story={story} index={index} />
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {downloadedResources.length > 0 && (
                <View style={styles.sectionContainer}>
                  {filteredDownloadedStories.length > 0 && (
                    <Text style={[styles.sectionTitle, { color: colors.textDark }]}>{t('home.sections.resources')}</Text>
                  )}
                  {isWebDesktop ? renderWebRows(downloadedResources, 'dl-') : (
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
                  )}
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={sharedStyles.pageIconCircle}>
                <Ionicons name="download-outline" size={SIZING.iconPage} color={colors.primary} />
              </View>
              <Text style={sharedStyles.pageTitle}>
                {searchQuery ? t('home.downloaded.emptyTitleSearch') : t('home.downloaded.emptyTitle')}
              </Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                {searchQuery ? t('home.emptySearchHint') : t('home.downloaded.emptySubtitle')}
              </Text>
              {!searchQuery && (
                <PrimaryButton title={t('home.actions.goToStories')} icon="chatbubbles-outline" onPress={() => router.push('/(tabs)/stories')} />
              )}
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: ThemeColors, s: ThemeShadows, isWebDesktop = false) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    headerWrap: isWebDesktop
      ? {
          paddingHorizontal: SPACING.screenPadding,
          paddingTop: 20,
          paddingBottom: 10,
          alignItems: 'center' as const,
        }
      : { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
    webToolbarRow: {
      width: '100%' as const,
      maxWidth: CONTENT_WIDTH.app,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 16,
      flexWrap: 'wrap' as const,
    },
    searchContainerWeb: {
      marginTop: 0,
      width: 360,
      maxWidth: '100%' as const,
    },
    segmentContainerWeb: {
      marginTop: 0,
      marginBottom: 0,
      width: 300,
    },
    viewToggle: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    viewToggleBtn: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    webRowsContainer: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 16,
      width: '100%' as const,
      maxWidth: CONTENT_WIDTH.app,
      alignSelf: 'center' as const,
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
    filtersCaptionRow: {
      width: '100%' as const,
      maxWidth: CONTENT_WIDTH.app,
      alignSelf: 'center' as const,
      marginBottom: 8,
    },
    filtersCaption: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
    },
    filtersContainer: { marginBottom: SPACING.smallGap },
    filtersContainerWeb: {
      width: '100%' as const,
      maxWidth: CONTENT_WIDTH.app,
      alignSelf: 'center' as const,
    },
    // Count + sort + clear-filter toolbar (web)
    countSortRow: {
      width: '100%' as const,
      maxWidth: CONTENT_WIDTH.app,
      alignSelf: 'center' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      flexWrap: 'wrap' as const,
      gap: 12,
      marginTop: 4,
      marginBottom: 14,
    },
    countSortLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
    },
    countText: {
      fontSize: 14,
      fontWeight: '600',
    },
    clearFilterBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    clearFilterText: {
      fontSize: 13,
      fontWeight: '700',
    },
    sortGroup: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    sortLabel: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginRight: 2,
    },
    sortChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: RADII.pill,
    },
    sortChipText: {
      fontSize: 13,
      fontWeight: '600',
    },
    // Loading skeleton cards
    skeletonCard: {
      flexDirection: 'row' as const,
      gap: SPACING.md,
      padding: SPACING.lg,
      borderRadius: RADII.cardLarge,
      borderWidth: BORDERS.card,
      borderColor: c.borderCard,
      backgroundColor: c.white,
      minHeight: 120,
    },
    skeletonChip: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.border,
    },
    skeletonLine: {
      height: 14,
      borderRadius: 7,
      backgroundColor: c.border,
    },
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
      ? {
          flexDirection: 'row' as const,
          flexWrap: 'wrap' as const,
          gap: WEB_GRID_GAP,
          width: '100%' as const,
          maxWidth: CONTENT_WIDTH.app,
          alignSelf: 'center' as const,
        }
      : { gap: 10 },
    storiesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    storyGridItem: {
      width: '48.5%',
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
