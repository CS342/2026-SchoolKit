import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccomplishments } from '../contexts/AccomplishmentContext';
import { useTheme } from '../contexts/ThemeContext';
import { useResources } from '../hooks/useResources';
import { useResponsive } from '../hooks/useResponsive';
import { ANIMATION, COLORS, SHADOWS, TYPOGRAPHY } from '../constants/onboarding-theme';
import KnowledgeTree from '../components/tree/KnowledgeTree';

// Desktop web uses a wider two-column layout (intro/legend panel + tree hero)
// so the canvas isn't empty. Everything else keeps the original full-bleed tree.
const WEB_DESKTOP_MAX_WIDTH = 1120;
const WEB_TREE_WIDTH = 560; // initial fallback before the tree measures its area

// Category chrome for the desktop legend. Colors/icons intentionally mirror the
// tree's data colors so the panel reads as the same illustration.
const CATEGORIES = [
  { id: 'School', label: 'School', color: '#F59E0B', icon: 'school-outline' },
  { id: 'Emotions', label: 'Emotions', color: '#66D9A6', icon: 'heart-outline' },
  { id: 'Health', label: 'Health', color: '#7B68EE', icon: 'medkit-outline' },
  { id: 'Social', label: 'Social', color: '#0EA5E9', icon: 'people-outline' },
  { id: 'Family', label: 'Family', color: '#EC4899', icon: 'heart-circle-outline' },
] as const;

export default function KnowledgeTreeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isResourceFullyViewed } = useAccomplishments();
  const { isDark, colors } = useTheme();
  const { resources } = useResources();
  const { isWeb, isDesktop } = useResponsive();
  const webDesktop = isWeb && isDesktop;

  const treeResources = resources.filter(r => !r.designOnly);
  const litCount = treeResources.filter(r => isResourceFullyViewed(r.id)).length;

  const categoryStats = CATEGORIES.map(cat => {
    const items = treeResources.filter(r => r.category === cat.id);
    const lit = items.filter(r => isResourceFullyViewed(r.id)).length;
    return { ...cat, total: items.length, lit };
  }).filter(c => c.total > 0);

  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-12);

  useEffect(() => {
    headerOpacity.value = withDelay(
      ANIMATION.entranceDelay,
      withTiming(1, { duration: 300 }),
    );
    headerY.value = withDelay(
      ANIMATION.entranceDelay,
      withSpring(0, ANIMATION.springSmooth),
    );
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const tree = (
    <KnowledgeTree
      isResourceFullyViewed={isResourceFullyViewed}
      resources={treeResources}
      containerWidth={webDesktop ? WEB_TREE_WIDTH : undefined}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.appBackground }]}>
      <View style={webDesktop ? styles.webDesktopContainer : styles.fullContainer}>
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.white, borderColor: colors.border }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textDark }]}>Knowledge Tree</Text>
          <Text style={[styles.countBadge, { color: colors.textMuted }]}>
            {litCount} / {treeResources.length}
          </Text>
        </Animated.View>

        {webDesktop ? (
          <View style={styles.contentRow}>
            {/* Complementary intro + legend panel — fills the void beside the tree */}
            <View style={styles.sidePanel}>
              <Text style={[styles.panelTitle, { color: colors.textDark }]}>
                Grow your knowledge tree
              </Text>
              <Text style={[styles.panelSubtitle, { color: colors.textMuted }]}>
                Explore concepts across these areas. Each topic you finish lights up a leaf on the tree.
              </Text>

              <View style={styles.legendList}>
                {categoryStats.map(cat => {
                  const complete = cat.total > 0 && cat.lit === cat.total;
                  const pct = cat.total > 0 ? cat.lit / cat.total : 0;
                  return (
                    <View
                      key={cat.id}
                      style={[styles.legendRow, { backgroundColor: colors.white, borderColor: colors.border }]}
                    >
                      <View style={[styles.legendIcon, { backgroundColor: cat.color }]}>
                        <Ionicons name={cat.icon as any} size={18} color={colors.white} />
                      </View>
                      <View style={styles.legendBody}>
                        <View style={styles.legendTopRow}>
                          <Text style={[styles.legendLabel, { color: colors.textDark }]}>{cat.label}</Text>
                          <Text style={[styles.legendCount, { color: complete ? cat.color : colors.textMuted }]}>
                            {cat.lit}/{cat.total}
                          </Text>
                        </View>
                        <View style={[styles.legendTrack, { backgroundColor: colors.appBackgroundAlt }]}>
                          <View
                            style={[
                              styles.legendFill,
                              { width: `${Math.round(pct * 100)}%`, backgroundColor: cat.color },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              <Text style={[styles.panelFootnote, { color: colors.textMuted }]}>
                {litCount} of {treeResources.length} topics explored
              </Text>
            </View>

            {/* Tree stays the hero */}
            <View style={styles.treeContainer}>{tree}</View>
          </View>
        ) : (
          <View style={styles.treeContainer}>{tree}</View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullContainer: {
    flex: 1,
  },
  webDesktopContainer: {
    flex: 1,
    maxWidth: WEB_DESKTOP_MAX_WIDTH,
    width: '100%' as any,
    alignSelf: 'center' as const,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    ...SHADOWS.small,
  },
  title: {
    flex: 1,
    ...TYPOGRAPHY.h2,
    letterSpacing: -0.4,
  },
  countBadge: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Raleway_600SemiBold',
    letterSpacing: -0.1,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 40,
  },
  sidePanel: {
    width: 320,
    paddingTop: 24,
  },
  panelTitle: {
    ...TYPOGRAPHY.h1,
    marginBottom: 10,
  },
  panelSubtitle: {
    ...TYPOGRAPHY.body,
    marginBottom: 24,
  },
  legendList: {
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  legendIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendBody: {
    flex: 1,
    gap: 8,
  },
  legendTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendLabel: {
    ...TYPOGRAPHY.bodyStrong,
  },
  legendCount: {
    fontSize: 13,
    fontFamily: 'Raleway_700Bold',
    letterSpacing: -0.1,
  },
  legendTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  legendFill: {
    height: 6,
    borderRadius: 3,
  },
  panelFootnote: {
    ...TYPOGRAPHY.caption,
    marginTop: 20,
  },
  treeContainer: {
    flex: 1,
  },
});
