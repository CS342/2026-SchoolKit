import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useStories } from '../../contexts/StoriesContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { StoryCard } from '../../components/StoryCard';
import { CommunityNormsModal } from '../../components/CommunityNormsModal';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import {
  GRADIENTS,
  SHADOWS,
  SIZING,
  COLORS,
} from '../../constants/onboarding-theme';
import { useTheme } from '../../contexts/ThemeContext';

export default function StoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAnonymous } = useAuth();
  const { stories, storiesLoading, refreshStories } = useStories();
  const { colors, appStyles, sharedStyles } = useTheme();
  const headerOpacity = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showNormsModal, setShowNormsModal] = useState(false);
  const [sort, setSort] = useState<'new' | 'popular' | 'my-stories'>('new');

  const isModerator = !!user;
  const [isModeratorMode, setIsModeratorMode] = useState(false);
  const { data: onboardingData } = useOnboarding();

  const displayedStories = useMemo(() => {
    // If we're looking at "My Stories", we want all of our own stories regardless of status/audience
    if (sort === 'my-stories' && user) {
      return stories.filter(s => s.author_id === user.id);
    }

    let filtered = isModeratorMode
      ? stories.filter(s => s.status === 'pending')
      : stories.filter(s => s.status === 'approved');

    // Filter by target audience matching the current user's role
    if (!isModeratorMode) {
      filtered = filtered.filter(story => {
        const audiences = story.target_audiences || [];
        if (audiences.length === 0) return true; // Show all if none specified
        
        let userGroup = 'Students';
        if (onboardingData?.role === 'student-k8' || onboardingData?.role === 'student-hs') userGroup = 'Students';
        else if (onboardingData?.role === 'parent') userGroup = 'Parents';
        else if (onboardingData?.role === 'staff') userGroup = 'School Staff';

        return audiences.includes(userGroup) || audiences.includes(onboardingData?.role || '');
      });
    }

    if (!isModeratorMode && sort === 'popular') {
      return [...filtered].sort((a, b) => b.like_count - a.like_count);
    }
    return filtered;
  }, [stories, isModeratorMode, user?.id, sort, onboardingData?.role]);

  const rejectedCount = useMemo(() => {
    if (!user) return 0;
    return stories.filter(s => s.author_id === user?.id && s.status === 'rejected').length;
  }, [stories, user]);

  const pendingCount = useMemo(() => {
    return stories.filter(s => s.status === 'pending').length;
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
      <Animated.View style={[appStyles.tabHeader, { paddingTop: insets.top + 10 }, headerStyle]}>
        <View style={styles.headerTitleRow}>
          <Text style={[appStyles.tabHeaderTitle, { marginBottom: 0 }]}>Stories</Text>
          <View style={styles.headerActions}>
            {/* Mod shield button */}
            {isModerator && (
              <Pressable
                onPress={() => setIsModeratorMode(v => !v)}
                style={[styles.modBtn, isModeratorMode && styles.modBtnActive]}
                hitSlop={8}
              >
                <Ionicons
                  name={isModeratorMode ? 'shield' : 'shield-outline'}
                  size={17}
                  color={isModeratorMode ? '#fff' : COLORS.textLight}
                />
                {/* Pending dot — only when mod mode is off */}
                {!isModeratorMode && pendingCount > 0 && (
                  <View style={styles.modDot} />
                )}
              </Pressable>
            )}
            {/* Info / norms */}
            <Pressable onPress={() => setShowNormsModal(true)} hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="information-circle-outline" size={22} color={colors.textLight} />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {/* Sort bar OR mod mode indicator */}
      {isModeratorMode ? (
        <View style={styles.modModeBar}>
          <Ionicons name="shield" size={13} color={COLORS.primary} />
          <Text style={styles.modModeBarText}>Moderator Mode</Text>
          {pendingCount > 0 && (
            <View style={styles.modModeCount}>
              <Text style={styles.modModeCountText}>{pendingCount} pending</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.sortBar}>
          <Pressable
            onPress={() => setSort('new')}
            style={[styles.sortTab, sort === 'new' && styles.sortTabActive]}
          >
            <Ionicons name="time-outline" size={14} color={sort === 'new' ? colors.primary : COLORS.textLight} />
            <Text style={[styles.sortText, sort === 'new' && styles.sortTextActive]}>New</Text>
          </Pressable>
          <Pressable
            onPress={() => setSort('popular')}
            style={[styles.sortTab, sort === 'popular' && styles.sortTabActive]}
          >
            <Ionicons name="flame-outline" size={14} color={sort === 'popular' ? colors.primary : COLORS.textLight} />
            <Text style={[styles.sortText, sort === 'popular' && styles.sortTextActive]}>Popular</Text>
          </Pressable>
          {user && (
            <Pressable
              onPress={() => setSort('my-stories')}
              style={[styles.sortTab, sort === 'my-stories' && styles.sortTabActive, { marginLeft: 'auto' }]}
            >
              <Ionicons name="person-outline" size={14} color={sort === 'my-stories' ? colors.primary : COLORS.textLight} />
              <Text style={[styles.sortText, sort === 'my-stories' && styles.sortTextActive]}>My Stories</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Rejected stories notification */}
      {rejectedCount > 0 && !isModeratorMode && (
        <Pressable
          style={styles.rejectedBanner}
          onPress={() => router.push('/rejected-stories' as any)}
        >
          <View style={styles.rejectedBannerLeft}>
            <View style={styles.rejectedDot} />
            <Text style={styles.rejectedBannerText}>
              {rejectedCount} {rejectedCount === 1 ? 'story' : 'stories'} rejected
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
            showAuthorStatus={sort === 'my-stories'}
          />
        )}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          storiesLoading ? null : isModeratorMode ? (
            <View style={styles.emptyContainer}>
              <View style={[sharedStyles.pageIconCircle, { backgroundColor: COLORS.successText + '15' }]}>
                <Ionicons name="checkmark-circle-outline" size={SIZING.iconPage} color={COLORS.successText} />
              </View>
              <Text style={sharedStyles.pageTitle}>All caught up!</Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                There are currently no pending stories to review.
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={sharedStyles.pageIconCircle}>
                <Ionicons name="chatbubbles-outline" size={SIZING.iconPage} color={colors.primary} />
              </View>
              <Text style={sharedStyles.pageTitle}>No stories yet</Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                Be the first to share your experience navigating cancer and school.
              </Text>
              {!isAnonymous && (
                <PrimaryButton
                  title="Share Your Story"
                  icon="create-outline"
                  onPress={() => router.push('/create-story' as any)}
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
          onPress={() => router.push('/create-story' as any)}
        >
          <LinearGradient
            colors={[...GRADIENTS.primaryButton] as [string, string, ...string[]]}
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
    </View>
  );
}

const makeStyles = (c: typeof import('../../constants/theme').COLORS_LIGHT) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },

    // ── Header ──────────────────────────────────────────────
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    modBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: '#D1D1D6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modBtnActive: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    modDot: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: COLORS.error,
      borderWidth: 1.5,
      borderColor: '#fff',
    },

    // ── Mod mode indicator bar ───────────────────────────────
    modModeBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: COLORS.primary + '0D',
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.primary + '30',
      marginBottom: 8,
    },
    modModeBarText: {
      fontSize: 13,
      fontWeight: '600',
      color: COLORS.primary,
      flex: 1,
    },
    modModeCount: {
      backgroundColor: COLORS.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 100,
    },
    modModeCountText: {
      fontSize: 12,
      fontWeight: '600',
      color: COLORS.primary,
    },

    // ── Sort bar ─────────────────────────────────────────────
    sortBar: {
      flexDirection: 'row',
      backgroundColor: COLORS.white,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E5E5EA',
      marginBottom: 8,
    },
    sortTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 100,
    },
    sortTabActive: {
      backgroundColor: COLORS.primary + '15',
    },
    sortText: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.textLight,
    },
    sortTextActive: {
      color: COLORS.primary,
    },

    // ── Rejected banner ──────────────────────────────────────
    rejectedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: COLORS.error + '0D',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: COLORS.error + '25',
    },
    rejectedBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
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
      fontWeight: '600',
      color: COLORS.error,
    },
    rejectedBannerAction: {
      fontSize: 13,
      fontWeight: '600',
      color: COLORS.error,
    },

    // ── List ─────────────────────────────────────────────────
    scrollContent: {
      paddingTop: 0,
      paddingBottom: 100,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 16,
    },

    // ── FAB ──────────────────────────────────────────────────
    fab: {
      position: 'absolute',
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
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
