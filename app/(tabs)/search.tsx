import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ResourceCard } from "../../components/ResourceCard";
import { RESOURCE_CATEGORIES } from "../../constants/resources";
import { useResources } from "../../hooks/useResources";
import {
  GRADIENTS,
  ANIMATION,
  TYPOGRAPHY,
  SIZING,
  SPACING,
  RADII,
  BORDERS,
} from "../../constants/onboarding-theme";
import { useTheme } from "../../contexts/ThemeContext";
import { useAccomplishments } from "../../contexts/AccomplishmentContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CATEGORIES = ["All", ...RESOURCE_CATEGORIES, "Design"] as const;
type CategoryTab = (typeof CATEGORIES)[number];
const RECENT_SEARCHES_KEY = "@schoolkit_recent_searches";
const MAX_RECENT_SEARCHES = 5;

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  All: "apps-outline",
  Emotions: "heart-outline",
  School: "school-outline",
  Social: "people-outline",
  Health: "medical-outline",
  Family: "home-outline",
  Design: "color-palette-outline",
};

// Animated decorative circle for background
function AnimatedCircle({
  shape,
  index,
}: {
  shape: { size: number; color: string; top?: number; bottom?: number; left?: number; right?: number };
  index: number;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withDelay(
      index * 150,
      withSpring(1, { damping: 20, stiffness: 100 })
    );
    scale.value = withDelay(
      index * 150,
      withSpring(1, { damping: 20, stiffness: 100 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: shape.size,
          height: shape.size,
          borderRadius: shape.size / 2,
          backgroundColor: shape.color,
          top: shape.top,
          bottom: shape.bottom,
          left: shape.left,
          right: shape.right,
        },
        animatedStyle,
      ]}
    />
  );
}

// Animated section wrapper for staggered entrance
function AnimatedSection({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(
      delay,
      withSpring(0, ANIMATION.springSmooth)
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, shadows, appStyles, decorativeShapes, isDark } = useTheme();
  const { fireEvent } = useAccomplishments();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>("All");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const { resources } = useResources();
  const [isFocused, setIsFocused] = useState(false);

  // Entrance animations
  const headerOpacity = useSharedValue(0);
  const searchBarScale = useSharedValue(0.97);
  const searchBarOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    searchBarScale.value = withDelay(
      100,
      withSpring(1, ANIMATION.springSmooth)
    );
    searchBarOpacity.value = withDelay(
      100,
      withTiming(1, { duration: 350 })
    );
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const searchBarEntrance = useAnimatedStyle(() => ({
    transform: [{ scale: searchBarScale.value }],
    opacity: searchBarOpacity.value,
  }));

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  };

  const addRecentSearch = async (query: string) => {
    if (!query.trim()) return;
    const updated = [
      query,
      ...recentSearches.filter((s) => s !== query),
    ].slice(0, MAX_RECENT_SEARCHES);
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
      fireEvent('search_performed');
    }
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
    setShowRecentSearches(false);
    addRecentSearch(query);
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCategory === "Design") {
      // Design tab shows only design-editor pages
      return matchesSearch && resource.designOnly === true;
    }

    // All other tabs exclude design-only pages
    if (resource.designOnly) return false;

    const matchesCategory =
      selectedCategory === "All" || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Empty state animation
  const emptyOpacity = useSharedValue(0);
  const emptyScale = useSharedValue(0.9);

  useEffect(() => {
    if (filteredResources.length === 0) {
      emptyOpacity.value = withDelay(
        200,
        withTiming(1, { duration: 400 })
      );
      emptyScale.value = withDelay(
        200,
        withSpring(1, ANIMATION.springSmooth)
      );
    } else {
      emptyOpacity.value = 0;
      emptyScale.value = 0.9;
    }
  }, [searchQuery, selectedCategory]);

  const emptyStateEntrance = useAnimatedStyle(() => ({
    opacity: emptyOpacity.value,
    transform: [{ scale: emptyScale.value }],
  }));

  const handleResourcePress = (id: string, title: string, route?: string) => {
    if (route) {
      router.push(route as any);
    } else {
      router.push(
        `/topic-detail?title=${encodeURIComponent(title)}&id=${id}` as any
      );
    }
  };

  const styles = useMemo(() => makeStyles(colors, shadows), [colors, shadows]);

  return (
    <View style={styles.container}>
      {/* Decorative background shapes */}
      {((decorativeShapes as any).search || []).map((shape: any, index: number) => (
        <AnimatedCircle key={index} shape={shape} index={index} />
      ))}

      {/* Header */}
      <Animated.View style={[appStyles.tabHeader, shadows.header, { paddingTop: insets.top + 10 }, headerStyle]}>
        <Text style={appStyles.tabHeaderTitle}>Search</Text>
        <Text style={appStyles.tabHeaderSubtitle}>
          Find support and information
        </Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <Animated.View
          style={[
            styles.searchContainer,
            isFocused && styles.searchContainerFocused,
            searchBarEntrance,
          ]}
        >
          <Ionicons
            name="search"
            size={22}
            color={isFocused ? colors.primary : colors.textLight}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics..."
            placeholderTextColor={colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => {
              setIsFocused(true);
              setShowRecentSearches(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              setTimeout(() => setShowRecentSearches(false), 200);
            }}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={22}
                color={colors.textLight}
              />
            </Pressable>
          )}
        </Animated.View>

        {/* Recent Searches */}
        {showRecentSearches &&
          recentSearches.length > 0 &&
          searchQuery.length === 0 && (
            <AnimatedSection delay={200}>
              <View style={styles.recentSearchesContainer}>
                <View style={styles.recentSearchesHeader}>
                  <Text style={styles.recentSearchesTitle}>
                    Recent Searches
                  </Text>
                  <Pressable onPress={clearRecentSearches}>
                    <Text style={styles.clearRecentText}>Clear</Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.recentSearchesScroll}
                >
                  {recentSearches.map((query, index) => (
                    <Pressable
                      key={index}
                      style={styles.recentSearchChip}
                      onPress={() => handleRecentSearchPress(query)}
                    >
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.recentSearchText}>{query}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </AnimatedSection>
          )}

        {/* Category Filters */}
        <AnimatedSection delay={200}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            {CATEGORIES.map((category) => {
              const isActive = selectedCategory === category;
              const iconName = CATEGORY_ICONS[category] || "ellipse";

              const chipContent = (
                <>
                  <Ionicons
                    name={iconName}
                    size={16}
                    color={isActive ? colors.white : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </>
              );

              if (isActive) {
                return (
                  <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <LinearGradient
                      colors={
                        [...GRADIENTS.primaryButton] as [
                          string,
                          string,
                          ...string[],
                        ]
                      }
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
                  style={styles.filterChip}
                  onPress={() => setSelectedCategory(category)}
                >
                  {chipContent}
                </Pressable>
              );
            })}
          </ScrollView>
        </AnimatedSection>

        {/* Results Count */}
        {searchQuery.length > 0 && (
          <AnimatedSection delay={300}>
            <View style={styles.resultsContainer}>
              <View style={styles.resultsBadge}>
                <Text style={styles.resultsText}>
                  {filteredResources.length}{" "}
                  {filteredResources.length === 1 ? "result" : "results"}
                </Text>
              </View>
            </View>
          </AnimatedSection>
        )}

        {/* Resource Cards */}
        <View style={styles.resourcesContainer}>
          {filteredResources.map((resource, index) => (
            <ResourceCard
              key={resource.id}
              id={resource.id}
              title={resource.title}
              category={resource.category}
              icon={resource.icon}
              color={resource.color}
              onPress={() =>
                handleResourcePress(
                  resource.id,
                  resource.title,
                  resource.route
                )
              }
              index={index}
              showDownloadIndicator
              animationBaseDelay={300}
              staggerDelay={ANIMATION.fastStaggerDelay}
            />
          ))}
        </View>

        {/* Empty State */}
        {filteredResources.length === 0 && (
          <Animated.View style={[styles.emptyStateCard, emptyStateEntrance]}>
            <LinearGradient
              colors={
                [...GRADIENTS.primaryButton] as [
                  string,
                  string,
                  ...string[],
                ]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconCircle}
            >
              <Ionicons
                name={
                  searchQuery.length > 0
                    ? "search-outline"
                    : "compass-outline"
                }
                size={SIZING.iconPage}
                color={colors.white}
              />
            </LinearGradient>
            <Text style={appStyles.emptyTitle}>
              {searchQuery.length > 0 ? "No results found" : "Start exploring"}
            </Text>
            <Text style={appStyles.emptyText}>
              {searchQuery.length > 0
                ? "Try searching with different keywords or adjust your filters"
                : "Search for topics, resources, and support materials"}
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

type C = typeof import("../../constants/theme").COLORS_LIGHT;
type S = typeof import("../../constants/theme").SHADOWS_LIGHT;

const makeStyles = (c: C, s: S) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },

    // Search bar
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: SPACING.screenPadding,
      marginTop: SPACING.sectionGap,
      marginBottom: SPACING.itemGap,
      paddingHorizontal: SPACING.contentPadding,
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
    searchIcon: {
      marginRight: SPACING.smallGap,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 16,
      ...TYPOGRAPHY.body,
      color: c.textDark,
    },
    clearButton: {
      padding: SPACING.xs,
    },

    // Recent searches
    recentSearchesContainer: {
      marginHorizontal: SPACING.screenPadding,
      marginBottom: SPACING.itemGap,
    },
    recentSearchesHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.smallGap,
    },
    recentSearchesTitle: {
      ...TYPOGRAPHY.caption,
      fontWeight: "700",
      color: c.textMuted,
    },
    clearRecentText: {
      ...TYPOGRAPHY.caption,
      color: c.primary,
    },
    recentSearchesScroll: {
      flexDirection: "row",
    },
    recentSearchChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.backgroundLighter,
      paddingHorizontal: SPACING.itemGap,
      paddingVertical: SPACING.smallGap,
      borderRadius: RADII.button,
      marginRight: SPACING.smallGap,
      borderWidth: BORDERS.input,
      borderColor: c.borderPurple,
    },
    recentSearchText: {
      ...TYPOGRAPHY.caption,
      color: c.primary,
      marginLeft: 6,
    },

    // Category filters
    filtersContainer: {
      marginBottom: SPACING.smallGap,
    },
    filtersContent: {
      paddingHorizontal: SPACING.screenPadding,
      paddingVertical: SPACING.xs,
      flexDirection: "row",
      alignItems: "center",
    },
    filterChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: SPACING.itemGap,
      paddingVertical: 10,
      borderRadius: RADII.badge,
      backgroundColor: c.white,
      borderWidth: BORDERS.card,
      borderColor: c.borderCard,
      marginRight: SPACING.smallGap,
      ...s.card,
    },
    filterChipActive: {
      borderWidth: 0,
      ...s.button,
    },
    filterChipText: {
      ...TYPOGRAPHY.caption,
      fontWeight: "700",
      color: c.textMuted,
    },
    filterChipTextActive: {
      color: c.white,
    },

    // Scroll content
    scrollContent: {
      paddingTop: SPACING.itemGap,
      paddingBottom: 40,
    },

    // Results count
    resultsContainer: {
      marginHorizontal: SPACING.screenPadding,
      marginBottom: SPACING.itemGap,
    },
    resultsBadge: {
      alignSelf: "flex-start",
      backgroundColor: c.backgroundLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: RADII.badge,
    },
    resultsText: {
      ...TYPOGRAPHY.caption,
      fontWeight: "700",
      color: c.primary,
    },

    // Resource list
    resourcesContainer: {
      gap: SPACING.itemGap,
      marginHorizontal: SPACING.screenPadding,
    },

    // Empty state
    emptyStateCard: {
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 32,
      backgroundColor: c.white,
      borderRadius: RADII.cardLarge,
      borderWidth: BORDERS.card,
      borderColor: c.borderCard,
      marginHorizontal: SPACING.screenPadding,
      ...s.cardLarge,
    },
    emptyIconCircle: {
      width: SIZING.circlePage,
      height: SIZING.circlePage,
      borderRadius: SIZING.circlePage / 2,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.sectionGap,
    },
  });
