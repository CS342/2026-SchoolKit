import React, { useState, useEffect } from "react";
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
  withSequence,
} from "react-native-reanimated";
import { BookmarkButton } from "../../components/BookmarkButton";
import { DownloadIndicator } from "../../components/DownloadIndicator";
import { ALL_RESOURCES, RESOURCE_CATEGORIES } from "../../constants/resources";
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
  DECORATIVE_SHAPES,
  APP_STYLES,
  withOpacity,
} from "../../constants/onboarding-theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CATEGORIES = ["All", ...RESOURCE_CATEGORIES];
const RECENT_SEARCHES_KEY = "@schoolkit_recent_searches";
const MAX_RECENT_SEARCHES = 5;

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  All: "apps-outline",
  Emotions: "heart-outline",
  School: "school-outline",
  Social: "people-outline",
  Health: "medical-outline",
  Family: "home-outline",
};

// Map resource colors to gradient pairs for icon circles
function getGradientForColor(color: string): readonly [string, string] {
  switch (color) {
    case "#0EA5E9":
      return GRADIENTS.roleStudentK8;
    case "#7B68EE":
      return GRADIENTS.roleStudentHS;
    case "#EC4899":
      return GRADIENTS.roleParent;
    case "#66D9A6":
      return GRADIENTS.roleStaff;
    case "#EF4444":
      return ["#EF4444", "#F87171"] as const;
    case "#3B82F6":
      return ["#3B82F6", "#60A5FA"] as const;
    default:
      return GRADIENTS.roleStudentHS;
  }
}

// Animated decorative circle for background
function AnimatedCircle({
  shape,
  index,
}: {
  shape: (typeof DECORATIVE_SHAPES)["welcome"][number];
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

interface ResourceCardProps {
  id: string;
  title: string;
  category: string;
  icon: string;
  color: string;
  onPress: () => void;
  index: number;
}

function ResourceCard({
  id,
  title,
  category,
  icon,
  color,
  onPress,
  index,
}: ResourceCardProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = 300 + index * ANIMATION.fastStaggerDelay;
    translateY.value = withDelay(
      delay,
      withSpring(0, ANIMATION.springBouncy)
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
      withSpring(1, ANIMATION.springBouncy)
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
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: withOpacity(color, 0.1) },
            ]}
          >
            <Text style={[styles.resourceCategory, { color }]}>
              {category}
            </Text>
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

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
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
    }
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
    setShowRecentSearches(false);
    addRecentSearch(query);
  };

  const filteredResources = ALL_RESOURCES.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.category.toLowerCase().includes(searchQuery.toLowerCase());
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

  return (
    <View style={styles.container}>
      {/* Decorative background shapes */}
      {(DECORATIVE_SHAPES.search || []).map((shape, index) => (
        <AnimatedCircle key={index} shape={shape} index={index} />
      ))}

      {/* Header */}
      <Animated.View style={[APP_STYLES.tabHeader, SHADOWS.header, headerStyle]}>
        <Text style={APP_STYLES.tabHeaderTitle}>Search</Text>
        <Text style={APP_STYLES.tabHeaderSubtitle}>
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
            color={isFocused ? COLORS.primary : COLORS.textLight}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics..."
            placeholderTextColor={COLORS.inputPlaceholder}
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
                color={COLORS.textLight}
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
                        color={COLORS.primary}
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
                    color={isActive ? COLORS.white : COLORS.textMuted}
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
                color={COLORS.white}
              />
            </LinearGradient>
            <Text style={APP_STYLES.emptyTitle}>
              {searchQuery.length > 0 ? "No results found" : "Start exploring"}
            </Text>
            <Text style={APP_STYLES.emptyText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  },

  // Search bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.screenPadding,
    marginTop: SPACING.sectionGap,
    marginBottom: SPACING.itemGap,
    paddingHorizontal: SPACING.contentPadding,
    backgroundColor: COLORS.white,
    borderRadius: RADII.cardLarge,
    borderWidth: BORDERS.card,
    borderColor: COLORS.borderCard,
    ...SHADOWS.small,
  },
  searchContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: BORDERS.cardSelected,
    ...SHADOWS.cardSelected,
  },
  searchIcon: {
    marginRight: SPACING.smallGap,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    ...TYPOGRAPHY.body,
    color: COLORS.textDark,
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
    color: COLORS.textMuted,
  },
  clearRecentText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
  },
  recentSearchesScroll: {
    flexDirection: "row",
  },
  recentSearchChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLighter,
    paddingHorizontal: SPACING.itemGap,
    paddingVertical: SPACING.smallGap,
    borderRadius: RADII.button,
    marginRight: SPACING.smallGap,
    borderWidth: BORDERS.input,
    borderColor: COLORS.borderPurple,
  },
  recentSearchText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
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
    backgroundColor: COLORS.white,
    borderWidth: BORDERS.card,
    borderColor: COLORS.borderCard,
    marginRight: SPACING.smallGap,
    ...SHADOWS.card,
  },
  filterChipActive: {
    borderWidth: 0,
    ...SHADOWS.button,
  },
  filterChipText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  filterChipTextActive: {
    color: COLORS.white,
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
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.badge,
  },
  resultsText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // Resource list
  resourcesContainer: {
    gap: SPACING.itemGap,
    marginHorizontal: SPACING.screenPadding,
  },

  // Resource card (matches ForYou topicCard pattern)
  resourceCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    padding: 16,
    borderWidth: BORDERS.card,
    borderColor: COLORS.borderCard,
    flexDirection: "row",
    alignItems: "center",
  },
  resourceIconCircle: {
    width: SIZING.circleRole,
    height: SIZING.circleRole,
    borderRadius: SIZING.circleRole / 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
    lineHeight: 24,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADII.badgeSmall,
  },
  resourceCategory: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
  },
  resourceActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  // Empty state
  emptyStateCard: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    backgroundColor: COLORS.white,
    borderRadius: RADII.cardLarge,
    borderWidth: BORDERS.card,
    borderColor: COLORS.borderCard,
    marginHorizontal: SPACING.screenPadding,
    ...SHADOWS.cardLarge,
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
