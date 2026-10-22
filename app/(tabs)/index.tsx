import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { ScreenHeader, ResourceRow, Card } from "../../components/ui";
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { ResourceCard } from '../../components/ResourceCard';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { useResources, matchesSavedTopic } from '../../hooks/useResources';
import { type Resource } from '../../constants/resources';
import { useResponsive, CONTENT_WIDTH } from '../../hooks/useResponsive';
import { useAccomplishments } from '../../contexts/AccomplishmentContext';
import { TOTAL_PIECES } from '../../constants/accomplishments';
import { SHOW_KNOWLEDGE_TREE, SHOW_PUZZLES } from '../../constants/features';
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
 * Fade + slide-up entrance used to stagger the dashboard in on load. Uses the
 * animated-style approach (not layout `entering`) so it runs on web too, and
 * respects the OS "reduce motion" setting.
 */
function FadeSlideIn({
  delay = 0,
  offset = 14,
  style,
  children,
}: {
  delay?: number;
  offset?: number;
  style?: any;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const p = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (!reduceMotion) {
      p.value = withDelay(delay, withTiming(1, { duration: 420 }));
    }
  }, []);
  const aStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * offset }],
  }));
  return <Animated.View style={[style, aStyle]}>{children}</Animated.View>;
}

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
  const { t } = useTranslation();
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const remaining = Math.max(0, total - value);
  const reduceMotion = useReducedMotion();

  // Grow the bar from empty to its value on load (skipped under reduce-motion).
  const grow = useSharedValue(reduceMotion ? pct : 0);
  useEffect(() => {
    grow.value = reduceMotion ? pct : withDelay(260, withTiming(pct, { duration: 700 }));
  }, [pct, reduceMotion]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${grow.value}%` }));

  return (
    <Card onPress={onPress} accessibilityLabel={t('home.progress.a11y', { label, value, total, pct })} style={style}>
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
        <Animated.View style={[progressStyles.fill, { backgroundColor: color }, fillStyle]} />
      </View>
      <View style={progressStyles.metaRow}>
        <Text style={[progressStyles.pctText, { color }]}>{t('home.progress.percentComplete', { pct })}</Text>
        <Text style={[progressStyles.toGo, { color: remaining > 0 ? colors.textMuted : '#10B981' }]}>
          {remaining > 0 ? t('home.progress.toGo', { count: remaining }) : t('home.progress.allDone')}
        </Text>
      </View>
    </Card>
  );
}

type TopicStatusKind = 'done' | 'started' | 'new';

/**
 * Trailing control for a support-topic row: a progress label (only when there's
 * real progress to show) plus a chevron that signals the row opens a page.
 */
function TopicStatus({ status, colors }: { status: TopicStatusKind; colors: ThemeColors }) {
  const { t } = useTranslation();
  return (
    <View style={progressStyles.trailing}>
      {status === 'done' ? (
        <View style={progressStyles.statusWrap}>
          <Ionicons name="checkmark-circle" size={15} color="#10B981" />
          <Text style={[progressStyles.statusText, { color: '#10B981' }]}>{t('home.status.done')}</Text>
        </View>
      ) : status === 'started' ? (
        <Text style={[progressStyles.statusText, { color: '#DE9A2E' }]}>{t('home.status.inProgress')}</Text>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </View>
  );
}

/**
 * Prominent "resume" card at the top of the dashboard. Points at the topic the
 * person has started but not finished, or — if none is in progress — the first
 * one they haven't opened yet, so the page always offers a clear next action.
 */
function ContinueCard({
  resource,
  resumed,
  colors,
  onPress,
}: {
  resource: Resource;
  resumed: boolean;
  colors: ThemeColors;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={resumed ? t('home.continue.a11yResume', { title: resource.title }) : t('home.continue.a11yStart', { title: resource.title })}
      style={{ borderColor: resource.color + '55' }}
    >
      <View style={continueStyles.row}>
        <View style={[continueStyles.chip, { backgroundColor: resource.color }]}>
          <Ionicons name={resource.icon as keyof typeof Ionicons.glyphMap} size={24} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[continueStyles.eyebrow, { color: resource.color }]}>
            {resumed ? t('home.continue.eyebrowResume') : t('home.continue.eyebrowStart')}
          </Text>
          <Text style={[continueStyles.title, { color: colors.textDark }]} numberOfLines={2}>
            {resource.title}
          </Text>
        </View>
        <View style={[continueStyles.cta, { backgroundColor: resource.color }]}>
          <Text style={continueStyles.ctaText}>{resumed ? t('common.continue') : t('home.continue.start')}</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </View>
      </View>
    </Card>
  );
}

export default function ForYouScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data } = useOnboarding();
  const insets = useSafeAreaInsets();

  const { resources } = useResources();
  const { colors, appStyles, sharedStyles } = useTheme();
  const { isWeb, isDesktop } = useResponsive();
  const { earnedPieceIds, isResourceFullyViewed, openedResourceIds } = useAccomplishments();

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
  const showTreeStat = SHOW_KNOWLEDGE_TREE && hasTreeTotal;

  // ── "Continue where you left off" ─────────────────────────────────────────
  // Prefer a topic that's started but unfinished; otherwise the first unopened
  // one. Null when every topic is done (the card then hides).
  // Saved topics (by id, or by title on older profiles) whose page is visible to this
  // viewer — once each. Topics whose page is hidden (audience / hide switches) or no
  // longer exists stay saved but aren't shown.
  const topicResources = useMemo(
    () =>
      data.topics
        .map(t => resources.find(r => matchesSavedTopic(t, r)))
        .filter((r, i, all): r is Resource => !!r && all.findIndex(x => x?.id === r.id) === i),
    [data.topics, resources]
  );
  const visibleTopics = topicResources;
  // Empty state: distinguish "never picked topics" from "picked topics are all hidden".
  const topicsAllHidden = data.topics.length > 0 && visibleTopics.length === 0;
  const emptyTitle = topicsAllHidden ? t('home.empty.titleHidden') : t('home.empty.titleNone');
  const emptySubtitle = topicsAllHidden
    ? t('home.empty.subtitleHidden')
    : t('home.empty.subtitleNone');
  const continueItem = useMemo(() => {
    const inProgress = topicResources.find(
      r => openedResourceIds.has(r.id) && !isResourceFullyViewed(r.id)
    );
    if (inProgress) return { resource: inProgress, resumed: true };
    const notStarted = topicResources.find(r => !openedResourceIds.has(r.id));
    if (notStarted) return { resource: notStarted, resumed: false };
    return null;
  }, [topicResources, openedResourceIds, isResourceFullyViewed]);

  // Web topics grid geometry. Grid = two comfortable columns on desktop so the
  // enriched rows have room; list = a single full-width column. (Below desktop the
  // width is too tight for two, so both modes fall back to one column.)
  const topicCols = viewMode === 'grid' && isDesktop ? 2 : 1;
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
          eyebrow={t('home.header.welcomeBack')}
          title={t('home.header.greeting', { name: data.name })}
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
            {continueItem && (
              <FadeSlideIn delay={40} style={styles.continueWrap}>
                <ContinueCard
                  resource={continueItem.resource}
                  resumed={continueItem.resumed}
                  colors={colors}
                  onPress={() => handleTopicPress(continueItem.resource.title, continueItem.resource.route)}
                />
              </FadeSlideIn>
            )}
            {(SHOW_PUZZLES || showTreeStat) && (
            <FadeSlideIn delay={continueItem ? 110 : 40}>
              <Text style={styles.sectionTitle}>{t('home.sections.yourProgress')}</Text>
              <View style={styles.progressRow}>
                {SHOW_PUZZLES && (
                  <ProgressStat
                    label={t('home.progress.puzzles')}
                    icon="extension-puzzle"
                    color="#F59E0B"
                    value={puzzlesEarned}
                    total={TOTAL_PIECES}
                    onPress={() => router.push('/accomplishments' as any)}
                    colors={colors}
                    style={styles.progressCard}
                  />
                )}
                {showTreeStat && (
                  <ProgressStat
                    label={t('home.progress.knowledgeTree')}
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
            </FadeSlideIn>
            )}

            <FadeSlideIn delay={continueItem ? 170 : 100}>
              <View style={styles.topicsHeaderRow}>
                <Text style={styles.sectionTitleInline}>{t('home.sections.supportTopics')}</Text>
                <View style={[styles.segment, { backgroundColor: colors.appBackgroundAlt, borderColor: colors.borderCard }]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('home.view.grid')}
                    onPress={() => setViewMode('grid')}
                    style={[styles.segBtn, viewMode === 'grid' && { backgroundColor: colors.white }]}
                  >
                    <Ionicons name="grid-outline" size={16} color={viewMode === 'grid' ? colors.primary : colors.textLight} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('home.view.list')}
                    onPress={() => setViewMode('list')}
                    style={[styles.segBtn, viewMode === 'list' && { backgroundColor: colors.white }]}
                  >
                    <Ionicons name="list-outline" size={16} color={viewMode === 'list' ? colors.primary : colors.textLight} />
                  </Pressable>
                </View>
              </View>
            </FadeSlideIn>

            {visibleTopics.length > 0 ? (
              <View
                style={styles.topicsGrid}
                onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
              >
                {visibleTopics.map((resource, index) => {
                  const color = resource.color || colors.primary;
                  const icon = (resource.icon || 'bookmarks') as keyof typeof Ionicons.glyphMap;
                  const status: TopicStatusKind = isResourceFullyViewed(resource.id)
                    ? 'done'
                    : openedResourceIds.has(resource.id)
                      ? 'started'
                      : 'new';

                  return (
                    <FadeSlideIn
                      key={resource.id}
                      delay={(continueItem ? 220 : 150) + Math.min(index, 8) * 55}
                      style={topicWidth > 0 ? { width: topicWidth } : { width: '100%' }}
                    >
                      <ResourceRow
                        title={resource.title}
                        icon={icon}
                        color={color}
                        category={resource.category}
                        description={resource.shortDescription}
                        right={<TopicStatus status={status} colors={colors} />}
                        onPress={() => handleTopicPress(resource.title, resource.route)}
                      />
                    </FadeSlideIn>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={sharedStyles.pageIconCircle}>
                  <Ionicons name="compass-outline" size={SIZING.iconPage} color={colors.primary} />
                </View>
                <Text style={sharedStyles.pageTitle}>{emptyTitle}</Text>
                <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                  {emptySubtitle}
                </Text>
                <PrimaryButton
                  title={t('home.actions.updateProfile')}
                  onPress={() => router.push('/(tabs)/profile')}
                />
              </View>
            )}
          </View>
        ) : (
          // ── Native (mobile) — unchanged ────────────────────────────────────
          <>
            <Text style={styles.sectionTitle}>{t('home.sections.supportTopicsNative')}</Text>

            {visibleTopics.length > 0 ? (
              <View style={styles.topicsContainer}>
                {visibleTopics.map((resource, index) => (
                  <ResourceCard
                    key={resource.id}
                    id={resource.id}
                    title={resource.title}
                    icon={resource.icon || 'bookmarks'}
                    color={resource.color || colors.primary}
                    onPress={() => handleTopicPress(resource.title, resource.route)}
                    index={index}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={sharedStyles.pageIconCircle}>
                  <Ionicons name="compass-outline" size={SIZING.iconPage} color={colors.primary} />
                </View>
                <Text style={sharedStyles.pageTitle}>{emptyTitle}</Text>
                <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                  {emptySubtitle}
                </Text>
                <PrimaryButton
                  title={t('home.actions.updateProfile')}
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
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontFamily: 'Raleway_700Bold',
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  pctText: {
    ...TYPOGRAPHY.caption,
    fontFamily: 'Raleway_700Bold',
    fontSize: 12,
  },
  toGo: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
  },
});

const continueStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  chip: {
    width: 48,
    height: 48,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  eyebrow: {
    ...TYPOGRAPHY.caption,
    fontFamily: 'Raleway_700Bold',
    fontSize: 11,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  title: {
    ...TYPOGRAPHY.h3,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.pill,
    flexShrink: 0,
  },
  ctaText: {
    ...TYPOGRAPHY.caption,
    fontFamily: 'Raleway_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
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
    continueWrap: {
      marginBottom: SPACING.xxxl,
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
