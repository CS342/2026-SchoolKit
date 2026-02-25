import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
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
import { StoryCard } from "../../components/StoryCard";
import { CommunityNormsModal } from "../../components/CommunityNormsModal";
import { TopicTagsModal } from "../../components/TopicTagsModal";
import { PrimaryButton } from "../../components/onboarding/PrimaryButton";
import {
  GRADIENTS,
  SHADOWS,
  SIZING,
  COLORS,
} from "../../constants/onboarding-theme";
import { useTheme } from "../../contexts/ThemeContext";

export default function StoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAnonymous } = useAuth();
  const { stories, storiesLoading, refreshStories, downloadedStories } = useStories();
  const { isOnline } = useOffline();
  const { colors, appStyles, sharedStyles } = useTheme();
  const headerOpacity = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showNormsModal, setShowNormsModal] = useState(false);
  const [sort, setSort] = useState<"new" | "popular" | "my-stories">("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const MODERATOR_EMAILS = ['janinatroper@gmail.com', 'lvalsote@stanford.edu', 'ngounder@stanford.edu'];
  const isModerator = user?.email && MODERATOR_EMAILS.includes(user.email);
  const [isModeratorMode, setIsModeratorMode] = useState(false);
  const { data: onboardingData } = useOnboarding();

  const displayedStories = useMemo(() => {
    // When offline, show only downloaded stories (with search still applied)
    if (!isOnline) {
      if (!searchQuery.trim()) return downloadedStories;
      const q = searchQuery.toLowerCase().trim();
      return downloadedStories.filter((s) =>
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.body && s.body.toLowerCase().includes(q))
      );
    }

    // If we're looking at "My Stories", we want all of our own stories regardless of status/audience
    if (sort === "my-stories" && user) {
      return stories.filter((s) => s.author_id === user.id);
    }

    let filtered = isModeratorMode
      ? stories.filter((s) => s.status === "pending" || (s.status === "approved" && s.report_count > 0))
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
      filtered = filtered.filter((s) => 
        (s.title && s.title.toLowerCase().includes(q)) || 
        (s.body && s.body.toLowerCase().includes(q))
      );
    }
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(s => 
        s.story_tags && s.story_tags.some(tag => selectedTags.includes(tag))
      );
    }

    if (!isModeratorMode && sort === "popular") {
      return [...filtered].sort((a, b) => b.like_count - a.like_count);
    }
    return filtered;
  }, [stories, isModeratorMode, user?.id, sort, onboardingData?.role, searchQuery, selectedTags]);

  const rejectedCount = useMemo(() => {
    if (!user) return 0;
    return stories.filter(
      (s) => s.author_id === user?.id && s.status === "rejected"
    ).length;
  }, [stories, user]);

  const pendingCount = useMemo(() => {
    return stories.filter((s) => s.status === "pending" || (s.status === "approved" && s.report_count > 0)).length;
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

  const styles = useMemo(() => makeStyles(colors), [colors]);

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
              Safe Space
            </Text>
            <Text style={styles.headerSubtitle}>
              A warm space to share and support each other
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

      {/* Search and Filter */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stories..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
            </Pressable>
          )}
        </View>
        <Pressable 
          style={[styles.filterBtn, selectedTags.length > 0 && styles.filterBtnActive]}
          onPress={() => setShowTagsModal(true)}
        >
          <Ionicons name={selectedTags.length > 0 ? "filter" : "filter-outline"} size={20} color={selectedTags.length > 0 ? COLORS.primary : COLORS.textDark} />
          {selectedTags.length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{selectedTags.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Sort bar OR mod mode indicator */}
      {isModeratorMode ? (
        <View style={styles.modModeBar}>
          <Ionicons name="shield" size={13} color={COLORS.primary} />
          <Text style={styles.modModeBarText}>Moderator Mode</Text>
          {pendingCount > 0 && (
            <View style={styles.modModeCount}>
              <Text style={styles.modModeCountText}>
                {pendingCount} pending
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.sortBar}>
          <Pressable
            onPress={() => setSort("new")}
            style={[styles.sortTab, sort === "new" && styles.sortTabActive]}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={sort === "new" ? colors.primary : COLORS.textLight}
            />
            <Text
              style={[styles.sortText, sort === "new" && styles.sortTextActive]}
            >
              New
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSort("popular")}
            style={[styles.sortTab, sort === "popular" && styles.sortTabActive]}
          >
            <Ionicons
              name="trending-up-outline"
              size={14}
              color={sort === "popular" ? colors.primary : COLORS.textLight}
            />
            <Text
              style={[
                styles.sortText,
                sort === "popular" && styles.sortTextActive,
              ]}
            >
              Popular
            </Text>
          </Pressable>
          {user && (
            <Pressable
              onPress={() => setSort("my-stories")}
              style={[
                styles.sortTab,
                sort === "my-stories" && styles.sortTabActive,
                { marginLeft: "auto" },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={14}
                color={
                  sort === "my-stories" ? colors.primary : COLORS.textLight
                }
              />
              <Text
                style={[
                  styles.sortText,
                  sort === "my-stories" && styles.sortTextActive,
                ]}
              >
                My Stories
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Offline banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={15} color="#5C5C8A" />
          <Text style={styles.offlineBannerText}>
            You're offline · Showing your downloads
          </Text>
        </View>
      )}

      {/* Rejected stories notification */}
      {rejectedCount > 0 && !isModeratorMode && !(!isOnline) && (
        <Pressable
          style={styles.rejectedBanner}
          onPress={() => router.push("/rejected-stories" as any)}
        >
          <View style={styles.rejectedBannerLeft}>
            <View style={styles.rejectedDot} />
            <Text style={styles.rejectedBannerText}>
              {rejectedCount}{" "}
              {rejectedCount === 1 ? "story needs" : "stories need"} a revision
            </Text>
          </View>
          <Text style={styles.rejectedBannerAction}>Review →</Text>
        </Pressable>
      )}

      <FlatList
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
                <Ionicons name="cloud-offline-outline" size={SIZING.iconPage} color="#9090C0" />
              </View>
              <Text style={sharedStyles.pageTitle}>No downloads yet</Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                Save stories while online using the download button, then read them anytime offline.
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
      {!isAnonymous && stories.length > 0 && (
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
          setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
          );
        }}
        onClearAll={() => setSelectedTags([])}
      />
    </View>
  );
}

const makeStyles = (c: typeof import("../../constants/theme").COLORS_LIGHT) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },

    // ── Header ──────────────────────────────────────────────
    headerSubtitle: {
      fontSize: 12,
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
      borderWidth: 1.5,
      borderColor: "#fff",
    },

    // ── Search & Filter ─────────────────────────────────────────────
    searchFilterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 8,
      gap: 10,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.white,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E5EA',
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: c.textDark,
      paddingVertical: 0,
    },
    filterBtn: {
      padding: 10,
      backgroundColor: c.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E5EA',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterBtnActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primary + '10',
    },
    filterBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: COLORS.primary,
      borderRadius: 10,
      width: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: c.appBackground,
    },
    filterBadgeText: {
      fontSize: 9,
      fontWeight: 'bold',
      color: c.white,
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
      fontSize: 13,
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
      fontSize: 12,
      fontWeight: "600",
      color: COLORS.primary,
    },

    // ── Sort bar ─────────────────────────────────────────────
    sortBar: {
      flexDirection: "row",
      backgroundColor: COLORS.white,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#E5E5EA",
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
      fontSize: 14,
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
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 9,
      backgroundColor: "#EDEDF8",
      borderRadius: 8,
    },
    offlineBannerText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#5C5C8A",
    },

    // ── Rejected banner ──────────────────────────────────────
    rejectedBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: 16,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: COLORS.error + "0D",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: COLORS.error + "25",
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
      fontSize: 13,
      fontWeight: "600",
      color: COLORS.error,
    },
    rejectedBannerAction: {
      fontSize: 13,
      fontWeight: "600",
      color: COLORS.error,
    },

    // ── List ─────────────────────────────────────────────────
    scrollContent: {
      paddingTop: 0,
      paddingBottom: 100,
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
