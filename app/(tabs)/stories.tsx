import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useStories } from "../../contexts/StoriesContext";
import { useOffline } from "../../contexts/OfflineContext";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { StoryCard, TAG_COLORS, DEFAULT_TAG_COLOR } from "../../components/StoryCard";
import { CommunityNormsModal } from "../../components/CommunityNormsModal";
import { PrimaryButton } from "../../components/onboarding/PrimaryButton";
import {
  GRADIENTS,
  SHADOWS,
  SIZING,
  COLORS,
  BORDERS,
  SPACING,
  RADII,
  TYPOGRAPHY,
} from "../../constants/onboarding-theme";
import { useTheme } from "../../contexts/ThemeContext";
import { TopicTagsModal } from "../../components/TopicTagsModal";

export default function StoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAnonymous } = useAuth();
  const { stories, storiesLoading, refreshStories, downloadedStories } =
    useStories();
  const { isOnline } = useOffline();
  const { colors, appStyles, sharedStyles } = useTheme();
  const headerOpacity = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showNormsModal, setShowNormsModal] = useState(false);
  const [sort, setSort] = useState<"new" | "popular" | "my-stories">("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dismissedPendingNotif, setDismissedPendingNotif] = useState(false);
  const [dismissedRejectedNotif, setDismissedRejectedNotif] = useState(false);

  const MODERATOR_EMAILS = [
    "janinatroper@gmail.com",
    "lvalsote@stanford.edu",
    "ngounder@stanford.edu",
  ];
  const isModerator = Boolean(
    user?.email && MODERATOR_EMAILS.includes(user.email)
  );
  const [isModeratorMode, setIsModeratorMode] = useState(false);
  const { data: onboardingData } = useOnboarding();

  const displayedStories = useMemo(() => {
    // When offline, show only downloaded stories (with search still applied)
    if (!isOnline) {
      if (!searchQuery.trim()) return downloadedStories;
      const q = searchQuery.toLowerCase().trim();
      return downloadedStories.filter(
        (s) =>
          (s.title && s.title.toLowerCase().includes(q)) ||
          (s.body && s.body.toLowerCase().includes(q))
      );
    }

    // If we're looking at "My Stories", we want all of our own stories regardless of status/audience
    if (!isModeratorMode && sort === "my-stories" && user) {
      return stories.filter((s) => s.author_id === user.id);
    }

    let filtered = isModeratorMode
      ? stories.filter(
          (s) =>
            s.status === "pending" ||
            (s.status === "approved" && s.report_count > 0)
        )
      : stories.filter((s) => s.status === "approved");

    // Filter by target audience matching the current user's role
    if (!isModeratorMode) {
      filtered = filtered.filter((story) => {
        const audiences = story.target_audiences || [];
        if (audiences.length === 0) return true; // Show all if none specified

        let userGroup = "Students";
        if (
          onboardingData?.role === "student-k8" ||
          onboardingData?.role === "student-hs"
        )
          userGroup = "Students";
        else if (onboardingData?.role === "parent") userGroup = "Parents";
        else if (onboardingData?.role === "staff") userGroup = "School Staff";

        return (
          audiences.includes(userGroup) ||
          audiences.includes(onboardingData?.role || "")
        );
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          (s.title && s.title.toLowerCase().includes(q)) ||
          (s.body && s.body.toLowerCase().includes(q))
      );
    }
    if (selectedTags.length > 0) {
      filtered = filtered.filter(
        (s) =>
          s.story_tags && s.story_tags.some((tag) => selectedTags.includes(tag))
      );
    }

    if (!isModeratorMode && sort === "popular") {
      return [...filtered].sort((a, b) => b.like_count - a.like_count);
    }
    return filtered;
  }, [
    stories,
    isModeratorMode,
    user?.id,
    sort,
    onboardingData?.role,
    searchQuery,
    selectedTags,
  ]);

  const rejectedCount = useMemo(() => {
    if (!user) return 0;
    return stories.filter(
      (s) => s.author_id === user?.id && s.status === "rejected"
    ).length;
  }, [stories, user]);

  const userPendingCount = useMemo(() => {
    if (!user) return 0;
    return stories.filter(
      (s) => s.author_id === user.id && s.status === "pending"
    ).length;
  }, [stories, user]);

  const pendingCount = useMemo(() => {
    return stories.filter(
      (s) =>
        s.status === "pending" ||
        (s.status === "approved" && s.report_count > 0)
    ).length;
  }, [stories]);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshStories();
    setRefreshing(false);
  };

  const { isDark, fontScale } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark, fontScale), [colors, isDark, fontScale]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          appStyles.tabHeader,
          { paddingTop: insets.top + 10 },
          headerStyle,
        ]}
      >
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={[appStyles.tabHeaderTitle, { marginBottom: 0 }]}>
              Peer Support
            </Text>
            <Text style={styles.headerSubtitle}>
              Safe space to share and find support.
            </Text>
          </View>
          <View style={styles.headerActions}>
            {/* Mod shield button */}
            {isModerator && (
              <Pressable
                onPress={() => setIsModeratorMode((v) => !v)}
                style={[styles.modBtn, isModeratorMode && styles.modBtnActive]}
                hitSlop={8}
              >
                <Ionicons
                  name={isModeratorMode ? "shield" : "shield-outline"}
                  size={17}
                  color={isModeratorMode ? "#fff" : COLORS.textLight}
                />
                {/* Pending dot — only when mod mode is off */}
                {!isModeratorMode && pendingCount > 0 && (
                  <View style={styles.modDot} />
                )}
              </Pressable>
            )}
            {/* Info / norms */}
            <Pressable
              onPress={() => setShowNormsModal(true)}
              hitSlop={8}
              style={{ padding: 4 }}
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={colors.textLight}
              />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <FlatList
        ListHeaderComponent={
          <View style={{ paddingBottom: 8 }}>
            {/* Search and Filter */}
            <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={COLORS.textLight}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stories..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {Boolean(searchQuery.length > 0) && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={10}>
              <Ionicons
                name="close-circle"
                size={18}
                color={COLORS.textLight}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Sort bar OR mod mode indicator */}
      {isModeratorMode ? (
        <View style={styles.modModeBar}>
          <Ionicons name="shield" size={13} color={COLORS.primary} />
          <Text style={styles.modModeBarText}>Moderator Mode</Text>
          {Boolean(pendingCount > 0) && (
            <View style={styles.modModeCount}>
              <Text style={styles.modModeCountText}>
                {pendingCount} pending
              </Text>
            </View>
          )}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsContainer}
          contentContainerStyle={styles.chipsContent}
        >
          {/* Filter Button */}
          <Pressable
            style={styles.chipWrapper}
            onPress={() => setShowTagsModal(true)}
          >
            {selectedTags.length > 0 ? (
              <LinearGradient
                colors={
                  [...GRADIENTS.primaryButton] as [string, string, ...string[]]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.chip, styles.chipActive]}
              >
                <Ionicons name="options" size={16} color={colors.white} />
                <Text style={[styles.chipText, styles.chipTextActive]}>
                  Filter
                </Text>
                <View
                  style={[
                    styles.filterBadge,
                    { borderColor: GRADIENTS.primaryButton[0] },
                  ]}
                >
                  <Text style={styles.filterBadgeText}>
                    {selectedTags.length}
                  </Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.chip}>
                <Ionicons
                  name="options-outline"
                  size={16}
                  color={colors.textMuted}
                />
                <Text style={styles.chipText}>Tags</Text>
              </View>
            )}
          </Pressable>
          {/* Selected Tag Pills */}
          {selectedTags.map((tag) => {
            const colorInfo = TAG_COLORS[tag] ?? DEFAULT_TAG_COLOR;
            return (
              <Pressable
                key={tag}
                style={styles.chipWrapper}
                onPress={() =>
                  setSelectedTags((prev) => prev.filter((t) => t !== tag))
                }
              >
                <View
                  style={[
                    styles.chip,
                    styles.chipActive,
                    {
                      paddingRight: 8,
                      paddingLeft: 12,
                      backgroundColor: colorInfo.text, // Bright color when selected
                      borderColor: "transparent",
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: COLORS.white }]}>
                    {tag}
                  </Text>
                  <Ionicons
                    name="close"
                    size={14}
                    color={COLORS.white}
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </Pressable>
            );
          })}

          {/* Sort Options */}
          {[
            { id: "new", label: "New", icon: "time-outline" as const },
            {
              id: "popular",
              label: "Popular",
              icon: "trending-up-outline" as const,
            },
            ...(user
              ? [
                  {
                    id: "my-stories",
                    label: "My Stories",
                    icon: "person-outline" as const,
                  },
                ]
              : []),
          ].map((option) => {
            const isActive = sort === option.id;
            const hasDot =
              option.id === "my-stories" &&
              rejectedCount > 0 &&
              dismissedRejectedNotif;

            const content = (
              <>
                <Ionicons
                  name={option.icon}
                  size={16}
                  color={isActive ? colors.white : colors.textMuted}
                />
                <Text
                  style={[styles.chipText, isActive && styles.chipTextActive]}
                >
                  {option.label}
                </Text>
              </>
            );

            if (isActive) {
              return (
                <Pressable
                  key={option.id}
                  style={styles.chipWrapper}
                  onPress={() => setSort(option.id as any)}
                >
                  <LinearGradient
                    colors={
                      [...GRADIENTS.primaryButton] as [
                        string,
                        string,
                        ...string[]
                      ]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.chip, styles.chipActive]}
                  >
                    {content}
                  </LinearGradient>
                  {hasDot && (
                    <View
                      style={[
                        styles.modDot,
                        { position: "absolute", top: 0, left: 0, right: undefined, zIndex: 10 },
                      ]}
                    />
                  )}
                </Pressable>
              );
            }
            return (
              <Pressable
                key={option.id}
                style={[styles.chipWrapper, styles.chip]}
                onPress={() => setSort(option.id as any)}
              >
                {content}
                {hasDot && (
                  <View
                    style={[
                      styles.modDot,
                      { position: "absolute", top: 0, left: 0, right: undefined, zIndex: 10 },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Offline banner */}
      {Boolean(!isOnline) && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={15} color="#5C5C8A" />
          <Text style={styles.offlineBannerText}>
            You're offline · Showing your downloads
          </Text>
        </View>
      )}

      {/* Pending stories notification */}
      {Boolean(
        userPendingCount > 0 &&
          !dismissedPendingNotif &&
          !isModeratorMode &&
          isOnline
      ) && (
        <View style={styles.pendingBanner}>
          <Ionicons name="time-outline" size={15} color="#F57C00" />
          <Text style={styles.pendingBannerText}>
            {userPendingCount === 1
              ? "Your story is"
              : `${userPendingCount} stories are`}{" "}
            being reviewed · see My Stories
          </Text>
          <Pressable
            onPress={() => setDismissedPendingNotif(true)}
            hitSlop={10}
          >
            <Ionicons name="close" size={16} color="#F57C00" />
          </Pressable>
        </View>
      )}

      {/* Rejected stories notification */}
      {Boolean(
        rejectedCount > 0 &&
          !dismissedRejectedNotif &&
          !isModeratorMode &&
          isOnline
      ) && (
        <View style={styles.rejectedBanner}>
          <Pressable
            style={styles.rejectedBannerContent}
            onPress={() => router.push("/rejected-stories" as any)}
          >
            <View style={styles.rejectedBannerLeft}>
              <View style={styles.rejectedDot} />
              <Text style={styles.rejectedBannerText}>
                {rejectedCount}{" "}
                {rejectedCount === 1 ? "story needs" : "stories need"} a
                revision
              </Text>
            </View>
            <Text style={styles.rejectedBannerAction}>Review →</Text>
          </Pressable>
          <Pressable
            onPress={() => setDismissedRejectedNotif(true)}
            hitSlop={10}
            style={{ paddingLeft: 8 }}
          >
            <Ionicons name="close" size={16} color={COLORS.error} />
          </Pressable>
        </View>
      )}
          </View>
        }
        data={displayedStories}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <StoryCard
            story={item}
            index={index}
            allowModeration={isModeratorMode}
            showAuthorStatus={sort === "my-stories"}
          />
        )}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          storiesLoading ? null : !isOnline ? (
            <View style={styles.emptyContainer}>
              <View style={sharedStyles.pageIconCircle}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={SIZING.iconPage}
                  color="#9090C0"
                />
              </View>
              <Text style={sharedStyles.pageTitle}>No downloads yet</Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                Save stories while online using the download button, then read
                them anytime offline.
              </Text>
            </View>
          ) : isModeratorMode ? (
            <View style={styles.emptyContainer}>
              <View
                style={[
                  sharedStyles.pageIconCircle,
                  { backgroundColor: COLORS.successText + "15" },
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={SIZING.iconPage}
                  color={COLORS.successText}
                />
              </View>
              <Text style={sharedStyles.pageTitle}>All caught up!</Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                There are currently no pending stories to review.
              </Text>
            </View>
          ) : sort === "my-stories" ? (
            <View style={styles.emptyContainer}>
              <View style={sharedStyles.pageIconCircle}>
                <Ionicons
                  name="document-text-outline"
                  size={SIZING.iconPage}
                  color={colors.primary}
                />
              </View>
              <Text style={sharedStyles.pageTitle}>No stories yet</Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                You haven't shared any stories. When you do, they will appear
                here.
              </Text>
              <PrimaryButton
                title="Share Your Story"
                icon="create-outline"
                onPress={() => router.push("/create-story" as any)}
              />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={sharedStyles.pageIconCircle}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={SIZING.iconPage}
                  color={colors.primary}
                />
              </View>
              <Text style={sharedStyles.pageTitle}>
                Your voice matters here
              </Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                This is a safe, supportive space. Sharing your experience can
                bring comfort and courage to someone else walking a similar
                path.
              </Text>
              {!isAnonymous && (
                <PrimaryButton
                  title="Share Your Story"
                  icon="create-outline"
                  onPress={() => router.push("/create-story" as any)}
                />
              )}
            </View>
          )
        }
        ItemSeparatorComponent={null}
      />

      {/* FAB */}
      {Boolean(!isAnonymous && stories.length > 0) && (
        <Pressable
          style={[styles.fab, SHADOWS.button]}
          onPress={() => router.push("/create-story" as any)}
        >
          <LinearGradient
            colors={
              [...GRADIENTS.primaryButton] as [string, string, ...string[]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      )}

      <CommunityNormsModal
        visible={showNormsModal}
        onClose={() => setShowNormsModal(false)}
        mode="view"
      />

      <TopicTagsModal
        visible={showTagsModal}
        onClose={() => setShowTagsModal(false)}
        selectedTags={selectedTags}
        onToggleTag={(tag: string) => {
          setSelectedTags((prev: string[]) => {
            if (prev.includes(tag))
              return prev.filter((t: string) => t !== tag);
            if (prev.length >= 3) return prev;
            return [...prev, tag];
          });
        }}
        maxTags={3}
        onClearAll={() => setSelectedTags([])}
      />
    </View>
  );
}

const makeStyles = (
  c: typeof import("../../constants/theme").COLORS_LIGHT,
  isDark: boolean,
  fontScale = 1
) => {
  const fs = (size: number) => Math.round(size * fontScale);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },

    // ── Header ──────────────────────────────────────────────
    headerSubtitle: {
      fontSize: fs(12),
      color: COLORS.textLight,
      fontWeight: "400",
      marginTop: 2,
    },
    headerTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    modBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: "#D1D1D6",
      alignItems: "center",
      justifyContent: "center",
    },
    modBtnActive: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    modDot: {
      position: "absolute",
      top: -2,
      right: -2,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: COLORS.error,
      borderWidth: 1, // Decreased border width
      borderColor: "#fff",
    },

    // ── Search & Filter ─────────────────────────────────────────────
    searchFilterContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 8,
      gap: 10,
    },
    searchContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? c.backgroundLight : c.white,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: isDark ? c.borderCard : "#E5E5EA",
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: fs(15),
      color: c.textDark,
      paddingVertical: 0,
    },
    // ── Category filter chips (search-tab style) ─────────────
    chipsContainer: {
      flexGrow: 0,
    },
    chipsContent: {
      paddingHorizontal: SPACING.screenPadding,
      paddingVertical: 10,
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    chip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 8,
      height: 40,
      borderRadius: RADII.badge,
      backgroundColor: isDark ? c.backgroundLight : c.white,
      borderWidth: BORDERS.card,
      borderColor: isDark ? c.borderCard : c.borderCard,
      shadowColor: "#2D2D44",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 4,
      overflow: "visible", // Ensure dot isn't cut off
    },
    chipWrapper: {
      marginRight: SPACING.smallGap,
      overflow: "visible", // Ensure dot isn't cut off
    },
    chipActive: {
      borderWidth: 0,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 8,
    },
    chipText: {
      ...TYPOGRAPHY.caption,
      fontWeight: "700" as const,
      color: c.textMuted,
    },
    chipTextActive: {
      color: c.white,
    },
    filterBadge: {
      position: "absolute",
      top: -4,
      right: -8,
      backgroundColor: c.white,
      borderRadius: 10,
      width: 16,
      height: 16,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1.5,
    },
    filterBadgeText: {
      fontSize: fs(8),
      fontWeight: "bold",
      color: COLORS.primary,
    },

    // ── Mod mode indicator bar ───────────────────────────────
    modModeBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      backgroundColor: COLORS.primary + "0D",
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.primary + "30",
      marginBottom: 8,
    },
    modModeBarText: {
      fontSize: fs(13),
      fontWeight: "600",
      color: COLORS.primary,
      flex: 1,
    },
    modModeCount: {
      backgroundColor: COLORS.primary + "20",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 100,
    },
    modModeCountText: {
      fontSize: fs(12),
      fontWeight: "600",
      color: COLORS.primary,
    },

    // ── Sort bar ─────────────────────────────────────────────
    sortBar: {
      flexDirection: "row",
      backgroundColor: isDark ? c.backgroundLight : c.white,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? c.borderCard : "#E5E5EA",
      marginBottom: 8,
    },
    sortTab: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 100,
    },
    sortTabActive: {
      backgroundColor: COLORS.primary + "15",
    },
    sortText: {
      fontSize: fs(14),
      fontWeight: "600",
      color: COLORS.textLight,
    },
    sortTextActive: {
      color: COLORS.primary,
    },

    // ── Offline banner ───────────────────────────────────────
    offlineBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 9,
      backgroundColor: "#EDEDF8",
      borderRadius: 8,
    },
    offlineBannerText: {
      fontSize: fs(13),
      fontWeight: "600",
      color: "#5C5C8A",
    },

    // ── Pending banner ───────────────────────────────────────
    pendingBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: "#FFF3E0",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#FFB74D40",
    },
    pendingBannerText: {
      flex: 1,
      fontSize: fs(13),
      fontWeight: "600",
      color: "#E65100",
    },

    // ── Rejected banner ──────────────────────────────────────
    rejectedBanner: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: COLORS.error + "0D",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: COLORS.error + "25",
    },
    rejectedBannerContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rejectedBannerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    rejectedDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: COLORS.error,
    },
    rejectedBannerText: {
      fontSize: fs(13),
      fontWeight: "600",
      color: COLORS.error,
    },
    rejectedBannerAction: {
      fontSize: fs(13),
      fontWeight: "600",
      color: COLORS.error,
    },

    // ── List ─────────────────────────────────────────────────
    scrollContent: {
      paddingTop: 8,
      paddingBottom: 100,
      paddingHorizontal: 14,
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 16,
    },

    // ── FAB ──────────────────────────────────────────────────
    fab: {
      position: "absolute",
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    fabGradient: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
