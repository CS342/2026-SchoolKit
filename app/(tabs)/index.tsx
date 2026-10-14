import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { ScreenHeader, ResourceRow, Card } from "../../components/ui";
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { getRoleDisplayName, getSchoolStatusText } from '../../utils/profile';
import { ResourceCard } from '../../components/ResourceCard';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { useResources } from '../../hooks/useResources';
import { useResponsive, gridColumns, CONTENT_WIDTH } from '../../hooks/useResponsive';
import { useAccomplishments } from '../../contexts/AccomplishmentContext';
import { TOTAL_PIECES } from '../../constants/accomplishments';
import {
  TYPOGRAPHY,
  SIZING,
  SPACING,
  RADII,
} from '../../constants/onboarding-theme';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeColors } from '../../constants/theme';

// Gap between topic cards in the web dashboard grid.
const WEB_TOPIC_GAP = SPACING.lg;

/**
 * A single labelled mini progress bar for the web "Your progress" row.
 * Only rendered with real, computed values — never fabricated.
 */
function ProgressStat({
  label,
  icon,
  color,
  value,
  total,
  onPress,
  colors,
  style,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: number;
  total: number;
  onPress: () => void;
  colors: ThemeColors;
  style?: any;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <Card onPress={onPress} accessibilityLabel={`${label}, ${value} of ${total}`} style={style}>
      <View style={progressStyles.headerRow}>
        <View style={[progressStyles.chip, { backgroundColor: color }]}>
          <Ionicons name={icon} size={18} color="#FFFFFF" />
        </View>
        <Text style={[progressStyles.label, { color: colors.textDark }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[progressStyles.count, { color: colors.textMuted }]}>
          {value} / {total}
        </Text>
      </View>
      <View style={[progressStyles.track, { backgroundColor: colors.backgroundLighter }]}>
        <View style={[progressStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </Card>
  );
}

export default function ForYouScreen() {
  const router = useRouter();
  const { data } = useOnboarding();
  const insets = useSafeAreaInsets();

  const { resources } = useResources();
  const { colors, appStyles, sharedStyles } = useTheme();
  const { isWeb } = useResponsive();
  const { earnedPieceIds, isResourceFullyViewed } = useAccomplishments();

  const [gridWidth, setGridWidth] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ── Real progress (never fabricated) ──────────────────────────────────────
  // Puzzles: earned pieces over the fixed total (Profile shows the same "X / 20").
  const puzzlesEarned = earnedPieceIds.size;
  // Knowledge Tree: fully-viewed resources over the tree's resource count —
  // identical to the knowledge-tree screen's own litCount / treeResources.length.
  const treeResources = useMemo(() => resources.filter(r => !r.designOnly), [resources]);
  const treeLit = useMemo(
    () => treeResources.filter(r => isResourceFullyViewed(r.id)).length,
    [treeResources, isResourceFullyViewed]
  );
  const hasTreeTotal = treeResources.length > 0;

  // Web topics grid geometry.
  const topicCols = viewMode === 'list'
    ? 1
    : (gridWidth > 0 ? gridColumns(gridWidth, 300) : 1);
  const topicWidth = gridWidth > 0
    ? Math.floor((gridWidth - WEB_TOPIC_GAP * (topicCols - 1)) / topicCols)
    : 0;

  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const handleTopicPress = (topic: string, route?: string) => {
    if (route) {
      router.push(route as any);
    } else {
      router.push(`/topic-detail?title=${encodeURIComponent(topic)}`);
    }
  };

  const styles = useMemo(() => makeStyles(colors, isWeb), [colors, isWeb]);

  return (
    <View style={styles.container}>
      <Animated.View style={headerStyle}>
        <ScreenHeader
          eyebrow="Welcome back,"
          title={`${data.name}!`}
          left={
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              {data.profilePicture && data.profilePicture.startsWith('icon:') ? (
                data.profilePicture === 'icon:initial' || !data.profilePicture.replace('icon:', '')
                  ? <Text style={[styles.avatarInitial, { color: '#FFFFFF' }]}>{data.name.charAt(0).toUpperCase()}</Text>
                  : <Ionicons name={data.profilePicture.replace('icon:', '') as any} size={22} color="#FFFFFF" />
              ) : data.profilePicture ? (
                <Image source={{ uri: data.profilePicture }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarInitial, { color: '#FFFFFF' }]}>
                  {data.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          }
        />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isWeb ? (
          // ── Web learning-portal dashboard ──────────────────────────────────
          <View style={styles.webWrap}>
            <Text style={styles.sectionTitle}>Your progress</Text>
            <View style={styles.progressRow}>
              <ProgressStat
                label="Puzzles"
                icon="extension-puzzle"
                color="#F59E0B"
                value={puzzlesEarned}
                total={TOTAL_PIECES}
                onPress={() => router.push('/accomplishments' as any)}
                colors={colors}
                style={styles.progressCard}
              />
              {hasTreeTotal && (
                <ProgressStat
                  label="Knowledge Tree"
                  icon="leaf"
                  color="#10B981"
                  value={treeLit}
                  total={treeResources.length}
                  onPress={() => router.push('/knowledge-tree' as any)}
                  colors={colors}
                  style={styles.progressCard}
                />
              )}
            </View>

            <View style={styles.topicsHeaderRow}>
              <Text style={styles.sectionTitleInline}>Your support topics</Text>
              <View style={[styles.segment, { backgroundColor: colors.appBackgroundAlt, borderColor: colors.borderCard }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Grid view"
                  onPress={() => setViewMode('grid')}
                  style={[styles.segBtn, viewMode === 'grid' && { backgroundColor: colors.white }]}
                >
                  <Ionicons name="grid-outline" size={16} color={viewMode === 'grid' ? colors.primary : colors.textLight} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="List view"
                  onPress={() => setViewMode('list')}
                  style={[styles.segBtn, viewMode === 'list' && { backgroundColor: colors.white }]}
                >
                  <Ionicons name="list-outline" size={16} color={viewMode === 'list' ? colors.primary : colors.textLight} />
                </Pressable>
              </View>
            </View>

            {data.topics.length > 0 ? (
              <View
                style={styles.topicsGrid}
                onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
              >
                {data.topics.map((topic, index) => {
                  const resource = resources.find(r => r.title.toLowerCase() === topic.toLowerCase());
                  const color = resource?.color || colors.primary;
                  const icon = (resource?.icon || 'bookmarks') as keyof typeof Ionicons.glyphMap;

                  return (
                    <View
                      key={index}
                      style={topicWidth > 0 ? { width: topicWidth } : { width: '100%' }}
                    >
                      <ResourceRow
                        title={topic}
                        icon={icon}
                        color={color}
                        category={resource?.category}
                        onPress={() => handleTopicPress(topic, resource?.route)}
                      />
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={sharedStyles.pageIconCircle}>
                  <Ionicons name="compass-outline" size={SIZING.iconPage} color={colors.primary} />
                </View>
                <Text style={sharedStyles.pageTitle}>No topics selected yet</Text>
                <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                  Visit your profile to update your interests and get personalized support.
                </Text>
                <PrimaryButton
                  title="Update Profile"
                  onPress={() => router.push('/(tabs)/profile')}
                />
              </View>
            )}
          </View>
        ) : (
          // ── Native (mobile) — unchanged ────────────────────────────────────
          <>
            <Text style={styles.sectionTitle}>Your Support Topics</Text>

            {data.topics.length > 0 ? (
              <View style={styles.topicsContainer}>
                {data.topics.map((topic, index) => {
                  const resource = resources.find(r => r.title.toLowerCase() === topic.toLowerCase());
                  const color = resource?.color || colors.primary;
                  const icon = resource?.icon || 'bookmarks';

                  return (
                    <ResourceCard
                      key={index}
                      id={resource?.id || topic}
                      title={topic}
                      icon={icon}
                      color={color}
                      onPress={() => handleTopicPress(topic, resource?.route)}
                      index={index}
                    />
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={sharedStyles.pageIconCircle}>
                  <Ionicons name="compass-outline" size={SIZING.iconPage} color={colors.primary} />
                </View>
                <Text style={sharedStyles.pageTitle}>No topics selected yet</Text>
                <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                  Visit your profile to update your interests and get personalized support.
                </Text>
                <PrimaryButton
                  title="Update Profile"
                  onPress={() => router.push('/(tabs)/profile')}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  chip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    ...TYPOGRAPHY.bodyStrong,
    flex: 1,
    minWidth: 0,
  },
  count: {
    ...TYPOGRAPHY.caption,
    fontFamily: 'Raleway_700Bold',
    flexShrink: 0,
  },
  track: {
    height: 8,
    borderRadius: RADII.pill,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: 8,
    borderRadius: RADII.pill,
  },
});

const makeStyles = (c: ThemeColors, isWeb: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 4,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0,
    },
    avatarImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    avatarInitial: {
      fontSize: 20,
      fontWeight: '700',
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap' as const,
      gap: 8,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      maxWidth: '100%',
      flexShrink: 1,
    },
    roleBadgeText: {
      marginLeft: 0,
      flexShrink: 1,
    },
    scrollContent: {
      paddingHorizontal: SPACING.screenPadding,
      paddingTop: SPACING.sectionGap,
      paddingBottom: 40,
    },
    sectionTitle: {
      ...TYPOGRAPHY.h2,
      color: c.textDark,
      marginBottom: SPACING.sectionGap,
    },
    // ── Web dashboard ──────────────────────────────────────────────────────
    webWrap: {
      width: '100%' as const,
      maxWidth: CONTENT_WIDTH.app,
      alignSelf: 'center' as const,
    },
    progressRow: {
      flexDirection: 'row',
      flexWrap: 'wrap' as const,
      gap: WEB_TOPIC_GAP,
      marginBottom: SPACING.xxxl,
    },
    progressCard: {
      flexGrow: 1,
      flexBasis: 280,
      minWidth: 240,
    },
    topicsHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.sectionGap,
      gap: SPACING.md,
    },
    sectionTitleInline: {
      ...TYPOGRAPHY.h2,
      color: c.textDark,
      flexShrink: 1,
    },
    segment: {
      flexDirection: 'row',
      borderRadius: RADII.md,
      borderWidth: 1,
      padding: 3,
      gap: 3,
    },
    segBtn: {
      width: 34,
      height: 30,
      borderRadius: RADII.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topicsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap' as const,
      gap: WEB_TOPIC_GAP,
      width: '100%' as const,
    },
    // ── Native ─────────────────────────────────────────────────────────────
    topicsContainer: { gap: SPACING.itemGap },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 16,
    },
  });
