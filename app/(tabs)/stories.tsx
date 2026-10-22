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
  Platform,
  ActivityIndicator,
} from "react-native";
import { ScreenHeader } from "../../components/ui";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

const WEB_NORMS = [
  { icon: "🎒", key: "schoolStoriesOnly" },
  { icon: "💙", key: "beKind" },
  { icon: "🩺", key: "noMedicalAdvice" },
  { icon: "🔒", key: "protectPrivacy" },
  { icon: "🤝", key: "respectJourneys" },
  { icon: "🚫", key: "zeroTolerance" },
  { icon: "🌿", key: "safeLanguage" },
];
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
  BORDERS,
  SPACING,
  RADII,
  TYPOGRAPHY,
} from "../../constants/onboarding-theme";
import { useTheme } from "../../contexts/ThemeContext";
import { TopicTagsModal } from "../../components/TopicTagsModal";
import { ThemeColors } from "../../constants/theme";
import Constants from "expo-constants";
import { isStudentRole } from '../../utils/profile';

export default function StoriesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, isAnonymous, isModerator } = useAuth();
  const { stories, storiesLoading, refreshStories, downloadedStories } =
    useStories();
  const { isOnline } = useOffline();
  const { colors, gradients, shadows, isDark, fontScale, appStyles, sharedStyles } = useTheme();
  const headerOpacity = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showNormsModal, setShowNormsModal] = useState(false);
  const [sort, setSort] = useState<"new" | "popular" | "my-stories">("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dismissedPendingNotif, setDismissedPendingNotif] = useState(false);
  const [dismissedRejectedNotif, setDismissedRejectedNotif] = useState(false);

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

    let filtered = stories;

    // If we're looking at "My Stories", we want all of our own stories regardless of status/audience
    if (!isModeratorMode && sort === "my-stories" && user) {
      filtered = stories.filter((s) => s.author_id === user.id);
    } else {
      filtered = isModeratorMode
        ? stories.filter(
            (s) =>
              s.status === "pending" ||
              (s.status === "approved" && (s.report_count > 0 || s.comment_report_count > 0))
          )
        : stories.filter((s) => s.status === "approved");

      // Filter by target audience matching the current user's role
      if (!isModeratorMode) {
        filtered = filtered.filter((story) => {
          const audiences = story.target_audiences || [];
          if (audiences.length === 0) return true; // Show all if none specified

          let userGroup = "Students";
          if (
            isStudentRole(onboardingData?.role))
            userGroup = "Students";
          else if (onboardingData?.role === "parent") userGroup = "Parents";
          else if (onboardingData?.role === "staff") userGroup = "School Staff";

          return (
            audiences.includes(userGroup) ||
            audiences.includes(onboardingData?.role || "")
          );
        });
      }
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
        (s.status === "approved" && (s.report_count > 0 || s.comment_report_count > 0))
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


  const styles = useMemo(() => makeStyles(colors, isDark, fontScale), [colors, isDark, fontScale]);

  // ── Web Layout ──────────────────────────────────────────────
  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        {/* Sticky page header */}
        <ScreenHeader
          title={t('stories.header.title')}
          subtitle={t('stories.header.subtitle')}
          right={
            <>
              {isModerator && (
                <Pressable
                  onPress={() => setIsModeratorMode((v) => !v)}
                  style={[styles.modBtn, { borderColor: colors.border }, isModeratorMode && { backgroundColor: colors.primaryFill, borderColor: colors.primary }]}
                  hitSlop={8}
                >
                  <Ionicons
                    name={isModeratorMode ? "shield" : "shield-outline"}
                    size={17}
                    color={isModeratorMode ? '#FFFFFF' : colors.textLight}
                  />
                  {!isModeratorMode && pendingCount > 0 && <View style={[styles.modDot, { backgroundColor: colors.destructiveFill, borderColor: colors.white }]} />}
                </Pressable>
              )}
              <Pressable onPress={() => setShowNormsModal(true)} hitSlop={8} style={{ padding: 4 }}>
                <Ionicons name="information-circle-outline" size={22} color={colors.textLight} />
              </Pressable>
            </>
          }
        />

        {/* Three-column scrollable area */}
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.appBackground }}
          contentContainerStyle={styles.webContentArea}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          <View style={styles.webThreeCol}>
            {/* ── Left Sidebar ──────────────────────────── */}
            <View style={styles.webLeftCol}>
              <View style={[styles.webSidebarCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
                <Text style={[styles.webSidebarLabel, { color: colors.textLight }]}>{t('stories.sortBy')}</Text>
                {[
                  { id: "new", label: t('stories.options.new'), icon: "time-outline" as const },
                  { id: "popular", label: t('stories.options.popular'), icon: "trending-up-outline" as const },
                  ...(user ? [{ id: "my-stories", label: t('stories.options.myStories'), icon: "person-outline" as const }] : []),
                ].map((opt) => {
                  const isActive = sort === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      style={[styles.webSortRow, isActive && { backgroundColor: colors.primary + "12" }]}
                      onPress={() => setSort(opt.id as any)}
                    >
                      <Ionicons name={opt.icon} size={16} color={isActive ? colors.primary : colors.textMuted} />
                      <Text style={[styles.webSortText, { color: isActive ? colors.primary : colors.textMuted }, isActive && styles.webSortTextActive]}>{opt.label}</Text>
                    </Pressable>
                  );
                })}

                <View style={[styles.webDivider, { backgroundColor: colors.border }]} />

                <Text style={[styles.webSidebarLabel, { color: colors.textLight }]}>{t('stories.filterByTag')}</Text>
                <Pressable style={[styles.webTagPickerBtn, { backgroundColor: colors.primary + "10" }]} onPress={() => setShowTagsModal(true)}>
                  <Ionicons name="options-outline" size={15} color={colors.primary} />
                  <Text style={[styles.webTagPickerText, { color: colors.primary }]}>
                    {selectedTags.length > 0
                      ? t(selectedTags.length === 1 ? 'stories.tagsSelectedOne' : 'stories.tagsSelectedOther', { count: selectedTags.length })
                      : t('stories.chooseTags')}
                  </Text>
                </Pressable>
                {selectedTags.length > 0 && (
                  <View style={{ gap: 6, marginTop: 8 }}>
                    {selectedTags.map((tag) => {
                      const tc = TAG_COLORS[tag] ?? DEFAULT_TAG_COLOR;
                      return (
                        <Pressable
                          key={tag}
                          style={[styles.webTagPill, { backgroundColor: isDark ? tc.text + '30' : tc.bg }]}
                          onPress={() => setSelectedTags((p) => p.filter((t) => t !== tag))}
                        >
                          <Text style={[styles.webTagPillText, { color: isDark ? tc.bg : tc.text }]}>{tag}</Text>
                          <Ionicons name="close" size={12} color={isDark ? tc.bg : tc.text} />
                        </Pressable>
                      );
                    })}
                    <Pressable onPress={() => setSelectedTags([])}>
                      <Text style={[styles.webClearTags, { color: colors.textLight }]}>{t('stories.clearAll')}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* ── Main Feed ─────────────────────────────── */}
            <View style={styles.webMidCol}>
              {/* Search bar above the feed */}
              <View style={[styles.webSearchBox, { marginBottom: 16, backgroundColor: colors.white, borderColor: colors.border }]}>
                <Ionicons name="search" size={15} color={colors.textLight} />
                <TextInput
                  style={[styles.webSearchInput, { color: colors.textDark }]}
                  placeholder={t('stories.searchPlaceholder')}
                  placeholderTextColor={colors.textLight}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={15} color={colors.textLight} />
                  </Pressable>
                )}
              </View>

              {isModeratorMode && (
                <View style={[styles.modModeBar, { borderRadius: 12, marginBottom: 16, backgroundColor: colors.primary + "10", borderBottomColor: colors.primary + "30" }]}>
                  <Ionicons name="shield" size={13} color={colors.primary} />
                  <Text style={[styles.modModeBarText, { color: colors.primary }]}>{t('stories.moderatorMode')}</Text>
                  {pendingCount > 0 && (
                    <View style={[styles.modModeCount, { backgroundColor: colors.primary + "20" }]}>
                      <Text style={[styles.modModeCountText, { color: colors.primary }]}>{t('stories.pendingCount', { count: pendingCount })}</Text>
                    </View>
                  )}
                </View>
              )}
              {userPendingCount > 0 && !dismissedPendingNotif && !isModeratorMode && isOnline && (
                <View style={[styles.pendingBanner, { borderRadius: 12, marginBottom: 12, backgroundColor: colors.warningBg, borderColor: colors.warningText + "40" }]}>
                  <Ionicons name="time-outline" size={15} color={colors.warningText} />
                  <Text style={[styles.pendingBannerText, { color: colors.warningText }]}>
                    {t(userPendingCount === 1 ? 'stories.reviewingOne' : 'stories.reviewingOther', { count: userPendingCount })}
                  </Text>
                  <Pressable onPress={() => setDismissedPendingNotif(true)} hitSlop={10}>
                    <Ionicons name="close" size={16} color={colors.warningText} />
                  </Pressable>
                </View>
              )}
              {rejectedCount > 0 && !dismissedRejectedNotif && !isModeratorMode && isOnline && (
                <View style={[styles.rejectedBanner, { borderRadius: 12, marginBottom: 12, backgroundColor: colors.error + "0D", borderColor: colors.error + "25" }]}>
                  <Pressable style={styles.rejectedBannerContent} onPress={() => router.push("/rejected-stories" as any)}>
                    <View style={styles.rejectedBannerLeft}>
                      <View style={[styles.rejectedDot, { backgroundColor: colors.destructiveFill }]} />
                      <Text style={[styles.rejectedBannerText, { color: colors.error }]}>
                        {t(rejectedCount === 1 ? 'stories.needsRevisionOne' : 'stories.needsRevisionOther', { count: rejectedCount })}
                      </Text>
                    </View>
                    <Text style={[styles.rejectedBannerAction, { color: colors.error }]}>{t('stories.reviewAction')}</Text>
                  </Pressable>
                  <Pressable onPress={() => setDismissedRejectedNotif(true)} hitSlop={10} style={{ paddingLeft: 8 }}>
                    <Ionicons name="close" size={16} color={colors.error} />
                  </Pressable>
                </View>
              )}

              {storiesLoading ? (
                <View style={{ paddingVertical: 60, alignItems: "center" }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : displayedStories.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={sharedStyles.pageIconCircle}>
                    <Ionicons name="chatbubbles-outline" size={SIZING.iconPage} color={colors.primary} />
                  </View>
                  <Text style={sharedStyles.pageTitle}>{t('stories.empty.voiceTitle')}</Text>
                  <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                    {t('stories.empty.voiceSubtitleWeb')}
                  </Text>
                  {!isAnonymous && (
                    <PrimaryButton
                      title={t('stories.shareYourStory')}
                      icon="create-outline"
                      onPress={() => router.push("/create-story" as any)}
                    />
                  )}
                </View>
              ) : (
                displayedStories.map((item, index) => (
                  <StoryCard
                    key={item.id}
                    story={item}
                    index={index}
                    allowModeration={isModeratorMode}
                    showAuthorStatus={sort === "my-stories"}
                  />
                ))
              )}
            </View>

            {/* ── Right Sidebar ─────────────────────────── */}
            <View style={styles.webRightCol}>
                <View style={[styles.webSidebarCard, { marginBottom: 16, backgroundColor: colors.white, borderColor: colors.border }]}>
                  <Text style={[styles.webRightCardTitle, { color: colors.textDark }]}>{t('stories.shareYourStory')}</Text>
                  <Text style={[styles.webRightCardBody, { color: colors.textMuted }]}>
                    {t('stories.shareCardBody')}
                  </Text>
                  {isAnonymous ? (
                    <Pressable style={[styles.webShareBtn, { backgroundColor: colors.primaryFill }]} onPress={() => router.push("/auth" as any)}>
                      <Ionicons name="lock-closed-outline" size={15} color="#FFFFFF" />
                      <Text style={styles.webShareBtnText}>{t('stories.signInToShare')}</Text>
                    </Pressable>
                  ) : (
                    <Pressable style={[styles.webShareBtn, { backgroundColor: colors.primaryFill }]} onPress={() => router.push("/create-story" as any)}>
                      <Ionicons name="create-outline" size={15} color="#FFFFFF" />
                      <Text style={styles.webShareBtnText}>{t('stories.writeAStory')}</Text>
                    </Pressable>
                  )}
                </View>
              <Pressable style={[styles.webSidebarCard, { backgroundColor: colors.white, borderColor: colors.border }]} onPress={() => setShowNormsModal(true)}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Ionicons name="shield-checkmark-outline" size={17} color={colors.primary} />
                  <Text style={[styles.webRightCardTitle, { color: colors.textDark }]}>{t('stories.communityNorms')}</Text>
                </View>
                {WEB_NORMS.map((norm, i) => (
                  <View key={i} style={styles.webNormItem}>
                    <Text style={styles.webNormIcon}>{norm.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.webNormTitle, { color: colors.textDark }]}>{t(`stories.webNorms.${norm.key}.title`)}</Text>
                      <Text style={[styles.webNormDesc, { color: colors.textMuted }]}>{t(`stories.webNorms.${norm.key}.desc`)}</Text>
                    </View>
                  </View>
                ))}
                <Pressable onPress={() => setShowNormsModal(true)} style={[styles.webNormReadMore, { borderTopColor: colors.border }]}>
                  <Text style={[styles.webNormReadMoreText, { color: colors.primary }]}>{t('stories.readFullNorms')}</Text>
                </Pressable>
              </Pressable>
            </View>
          </View>
        </ScrollView>
        <CommunityNormsModal visible={showNormsModal} onClose={() => setShowNormsModal(false)} mode="view" />
        <TopicTagsModal
          visible={showTagsModal}
          onClose={() => setShowTagsModal(false)}
          selectedTags={selectedTags}
          onToggleTag={(tag: string) => {
            setSelectedTags((prev: string[]) => {
              if (prev.includes(tag)) return prev.filter((t: string) => t !== tag);
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          appStyles.tabHeader,
          { paddingTop: insets.top + 10, backgroundColor: colors.white, borderBottomColor: colors.border },
          headerStyle,
        ]}
      >
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={[appStyles.tabHeaderTitle, { color: colors.textDark, marginBottom: 0 }]}>
              {t('stories.header.title')}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              {t('stories.header.subtitle')}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {/* Mod shield button */}
            {isModerator && (
              <Pressable
                onPress={() => setIsModeratorMode((v) => !v)}
                style={[styles.modBtn, { borderColor: colors.border }, isModeratorMode && { backgroundColor: colors.primaryFill, borderColor: colors.primary }]}
                hitSlop={8}
              >
                <Ionicons
                  name={isModeratorMode ? "shield" : "shield-outline"}
                  size={17}
                  color={isModeratorMode ? '#FFFFFF' : colors.textLight}
                />
                {/* Pending dot — only when mod mode is off */}
                {!isModeratorMode && pendingCount > 0 && (
                  <View style={[styles.modDot, { backgroundColor: colors.destructiveFill, borderColor: colors.white }]} />
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
        <View style={[styles.searchContainer, { backgroundColor: colors.white, borderColor: colors.border }]}>
          <Ionicons
            name="search"
            size={18}
            color={colors.textLight}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.textDark }]}
            placeholder={t('stories.searchPlaceholder')}
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {Boolean(searchQuery.length > 0) && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={10}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textLight}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Sort bar OR mod mode indicator */}
      {isModeratorMode ? (
        <View style={[styles.modModeBar, { backgroundColor: colors.primary + "10", borderBottomColor: colors.primary + "30" }]}>
          <Ionicons name="shield" size={13} color={colors.primary} />
          <Text style={[styles.modModeBarText, { color: colors.primary }]}>{t('stories.moderatorMode')}</Text>
          {Boolean(pendingCount > 0) && (
            <View style={[styles.modModeCount, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.modModeCountText, { color: colors.primary }]}>
                {t('stories.pendingCount', { count: pendingCount })}
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
                colors={gradients.primaryButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.chip, styles.chipActive]}
              >
                <Ionicons name="options" size={16} color="#FFFFFF" />
                <Text style={[styles.chipText, styles.chipTextActive]}>
                  {t('stories.filter')}
                </Text>
                <View
                  style={[
                    styles.filterBadge,
                    { backgroundColor: colors.white, borderColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.filterBadgeText, { color: colors.primary }]}>
                    {selectedTags.length}
                  </Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={[styles.chip, { backgroundColor: colors.white, borderColor: colors.border }]}>
                <Ionicons
                  name="options-outline"
                  size={16}
                  color={colors.textMuted}
                />
                <Text style={[styles.chipText, { color: colors.textMuted }]}>{t('stories.tags')}</Text>
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
                  <Text style={[styles.chipText, { color: '#FFFFFF' }]}>
                    {tag}
                  </Text>
                  <Ionicons
                    name="close"
                    size={14}
                    color="#FFFFFF"
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </Pressable>
            );
          })}

          {/* Sort Options */}
          {[
            { id: "new", label: t('stories.options.new'), icon: "time-outline" as const },
            {
              id: "popular",
              label: t('stories.options.popular'),
              icon: "trending-up-outline" as const,
            },
            ...(user
              ? [
                  {
                    id: "my-stories",
                    label: t('stories.options.myStories'),
                    icon: "person-outline" as const,
                  },
                ]
              : []),
          ].map((option) => {
            const isActive = sort === option.id;
            const hasDot =
              option.id === "my-stories" &&
              rejectedCount > 0 &&
              !dismissedRejectedNotif;

            const content = (
              <>
                <Ionicons
                  name={option.icon}
                  size={16}
                  color={isActive ? '#FFFFFF' : colors.textMuted}
                />
                <Text
                  style={[styles.chipText, { color: isActive ? '#FFFFFF' : colors.textMuted }, isActive && styles.chipTextActive]}
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
                    colors={gradients.primaryButton}
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
                        { position: "absolute", top: 0, left: 0, right: undefined, zIndex: 10, backgroundColor: colors.destructiveFill, borderColor: colors.white },
                      ]}
                    />
                  )}
                </Pressable>
              );
            }
            return (
              <Pressable
                key={option.id}
                style={[styles.chipWrapper, styles.chip, { backgroundColor: colors.white, borderColor: colors.border }]}
                onPress={() => setSort(option.id as any)}
              >
                {content}
                {hasDot && (
                  <View
                    style={[
                      styles.modDot,
                      { position: "absolute", top: 0, left: 0, right: undefined, zIndex: 10, backgroundColor: colors.destructiveFill, borderColor: colors.white },
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
        <View style={[styles.offlineBanner, { backgroundColor: colors.appBackgroundAlt }]}>
          <Ionicons name="cloud-offline-outline" size={15} color={colors.textMuted} />
          <Text style={[styles.offlineBannerText, { color: colors.textMuted }]}>
            {t('stories.offline')}
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
        <View style={[styles.pendingBanner, { backgroundColor: colors.warningBg, borderColor: colors.warningText + "40" }]}>
          <Ionicons name="time-outline" size={15} color={colors.warningText} />
          <Text style={[styles.pendingBannerText, { color: colors.warningText }]}>
            {t(userPendingCount === 1 ? 'stories.reviewingSeeMyStoriesOne' : 'stories.reviewingSeeMyStoriesOther', { count: userPendingCount })}
          </Text>
          <Pressable
            onPress={() => setDismissedPendingNotif(true)}
            hitSlop={10}
          >
            <Ionicons name="close" size={16} color={colors.warningText} />
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
        <View style={[styles.rejectedBanner, { backgroundColor: colors.error + "0D", borderColor: colors.error + "25" }]}>
          <Pressable
            style={styles.rejectedBannerContent}
            onPress={() => router.push("/rejected-stories" as any)}
          >
            <View style={styles.rejectedBannerLeft}>
              <View style={[styles.rejectedDot, { backgroundColor: colors.destructiveFill }]} />
              <Text style={[styles.rejectedBannerText, { color: colors.error }]}>
                {t(rejectedCount === 1 ? 'stories.needsRevisionOne' : 'stories.needsRevisionOther', { count: rejectedCount })}
              </Text>
            </View>
            <Text style={[styles.rejectedBannerAction, { color: colors.error }]}>{t('stories.reviewAction')}</Text>
          </Pressable>
          <Pressable
            onPress={() => setDismissedRejectedNotif(true)}
            hitSlop={10}
            style={{ paddingLeft: 8 }}
          >
            <Ionicons name="close" size={16} color={colors.error} />
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
                  color={colors.textMuted}
                />
              </View>
              <Text style={sharedStyles.pageTitle}>{t('stories.empty.noDownloadsTitle')}</Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                {t('stories.empty.noDownloadsSubtitle')}
              </Text>
            </View>
          ) : isModeratorMode ? (
            <View style={styles.emptyContainer}>
              <View
                style={[
                  sharedStyles.pageIconCircle,
                  { backgroundColor: colors.successBg },
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={SIZING.iconPage}
                  color={colors.successText}
                />
              </View>
              <Text style={sharedStyles.pageTitle}>{t('stories.empty.allCaughtUpTitle')}</Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                {t('stories.empty.allCaughtUpSubtitle')}
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
              <Text style={sharedStyles.pageTitle}>{t('stories.empty.noStoriesTitle')}</Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                {t('stories.empty.noStoriesSubtitle')}
              </Text>
              <PrimaryButton
                title={t('stories.shareYourStory')}
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
                {t('stories.empty.voiceTitle')}
              </Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                {t('stories.empty.voiceSubtitle')}
              </Text>
              {!isAnonymous && (
                <PrimaryButton
                  title={t('stories.shareYourStory')}
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
          style={[styles.fab, shadows.button]}
          onPress={() => router.push("/create-story" as any)}
        >
          <LinearGradient
            colors={gradients.primaryButton}
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
            if (prev.includes(tag)) return prev.filter((t: string) => t !== tag);
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
  c: ThemeColors,
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
      fontSize: fs(15),
      color: c.textLight,
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
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    modBtnActive: {
      backgroundColor: c.primaryFill,
      borderColor: c.primary,
    },
    modDot: {
      position: "absolute",
      top: -2,
      right: -2,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: c.destructiveFill,
      borderWidth: 1.5,
      borderColor: c.white,
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
      borderColor: c.borderCard,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: fs(17),
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
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 4,
      overflow: "visible", 
    },
    chipWrapper: {
      marginRight: SPACING.smallGap,
      overflow: "visible", 
    },
    chipActive: {
      borderWidth: 0,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 8,
    },
    chipText: {
      fontSize: fs(15),
      fontWeight: "700" as const,
      color: c.textMuted,
    },
    chipTextActive: {
      color: '#FFFFFF',
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
      color: c.primary,
    },

    // ── Mod mode indicator bar ───────────────────────────────
    modModeBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      backgroundColor: c.primary + "0D",
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.primary + "30",
      marginBottom: 8,
    },
    modModeBarText: {
      fontSize: fs(13),
      fontWeight: "600",
      color: c.primary,
      flex: 1,
    },
    modModeCount: {
      backgroundColor: c.primary + "20",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 100,
    },
    modModeCountText: {
      fontSize: fs(12),
      fontWeight: "600",
      color: c.primary,
    },

    // ── Sort bar ─────────────────────────────────────────────
    sortBar: {
      flexDirection: "row",
      backgroundColor: isDark ? c.backgroundLight : c.white,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderCard,
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
      backgroundColor: c.primary + "15",
    },
    sortText: {
      fontSize: fs(15),
      fontWeight: "600",
      color: c.textLight,
    },
    sortTextActive: {
      color: c.primary,
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
      backgroundColor: c.appBackgroundAlt,
      borderRadius: 8,
    },
    offlineBannerText: {
      fontSize: fs(13),
      fontWeight: "600",
      color: c.textMuted,
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
      backgroundColor: c.warningBg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.warningText + "40",
    },
    pendingBannerText: {
      flex: 1,
      fontSize: fs(13),
      fontWeight: "600",
      color: c.warningText,
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
      backgroundColor: c.error + "0D",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.error + "25",
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
      backgroundColor: c.destructiveFill,
    },
    rejectedBannerText: {
      fontSize: fs(13),
      fontWeight: "600",
      color: c.error,
    },
    rejectedBannerAction: {
      fontSize: fs(13),
      fontWeight: "600",
      color: c.error,
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
      ...Platform.select({
        web: {
          position: "fixed" as any,
        },
        default: {
          position: "absolute",
        },
      }),
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      zIndex: 100,
      elevation: 10,
    },
    fabGradient: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
    },

    // ── Web Layout ───────────────────────────────────────────
    webPageHeader: {
      backgroundColor: c.white,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      paddingHorizontal: 24,
      paddingBottom: 14,
    },
    webPageHeaderInner: {
      maxWidth: 1400 as any,
      alignSelf: "center" as any,
      width: "100%" as any,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
    },
    webPageTitle: {
      fontSize: fs(32),
      fontWeight: "800" as const,
      color: c.textDark,
      letterSpacing: -0.5,
    },
    webContentArea: {
      maxWidth: 1400 as any,
      alignSelf: "center" as any,
      width: "100%" as any,
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 100,
    },
    webThreeCol: {
      flexDirection: "row" as const,
      gap: 32,
      alignItems: "flex-start" as const,
    },
    webLeftCol: {
      width: 240,
    },
    webMidCol: {
      flex: 1,
      minWidth: 0 as any,
    },
    webRightCol: {
      width: 320,
    },
    webSidebarCard: {
      backgroundColor: c.white,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1.5,
      borderColor: c.border,
      marginBottom: 0,
    },
    webSearchBox: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      backgroundColor: c.white,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    webSearchInput: {
      flex: 1,
      fontSize: fs(16),
      color: c.textDark,
      paddingVertical: 0,
    },
    webSidebarLabel: {
      fontSize: fs(10),
      fontWeight: "700" as const,
      color: c.textLight,
      letterSpacing: 1,
      textTransform: "uppercase" as const,
      marginBottom: 8,
    },
    webSortRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      paddingVertical: 9,
      paddingHorizontal: 10,
      borderRadius: 10,
      marginBottom: 2,
    },
    webSortRowActive: {
      backgroundColor: c.primary + "12",
    },
    webSortText: {
      fontSize: fs(16),
      fontWeight: "600" as const,
      color: c.textMuted,
    },
    webSortTextActive: {
      color: c.primary,
    },
    webDivider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: 14,
    },
    webTagPickerBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: c.primary + "10",
      borderRadius: 10,
    },
    webTagPickerText: {
      flex: 1,
      fontSize: fs(15),
      fontWeight: "600" as const,
      color: c.primary,
    },
    webTagPill: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 100,
    },
    webTagPillText: {
      fontSize: fs(14),
      fontWeight: "600" as const,
    },
    webClearTags: {
      fontSize: fs(12),
      fontWeight: "600" as const,
      color: c.textLight,
      marginTop: 2,
    },
    webRightCardTitle: {
      fontSize: fs(18),
      fontWeight: "700" as const,
      color: c.textDark,
      marginBottom: 8,
    },
    webRightCardBody: {
      fontSize: fs(15),
      color: c.textMuted,
      lineHeight: fs(21),
      marginBottom: 14,
    },
    webShareBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
      backgroundColor: c.primaryFill,
      paddingVertical: 10,
      borderRadius: 100,
    },
    webShareBtnText: {
      fontSize: fs(16),
      fontWeight: "700" as const,
      color: '#FFFFFF',
    },
    webNormLine: {
      fontSize: fs(13),
      color: c.textMuted,
      marginBottom: 6,
      lineHeight: fs(18),
    },
    webNormItem: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      gap: 12,
      marginBottom: 14,
    },
    webNormIcon: {
      fontSize: fs(16),
      marginTop: 2,
    },
    webNormTitle: {
      fontSize: fs(15),
      fontWeight: "700" as const,
      color: c.textDark,
      marginBottom: 3,
    },
    webNormDesc: {
      fontSize: fs(14),
      color: c.textMuted,
      lineHeight: fs(18),
    },
    webNormReadMore: {
      marginTop: 8,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    webNormReadMoreText: {
      fontSize: fs(15),
      fontWeight: "600" as const,
      color: c.primary,
    },
  });
};
