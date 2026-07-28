import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ChapterDefinition } from '../../constants/accomplishments';
import { ANIMATION, COLORS, RADII, SHADOWS, SPACING } from '../../constants/onboarding-theme';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../ui';
import PuzzleGrid from './PuzzleGrid';

interface ChapterCardProps {
  chapter: ChapterDefinition;
  earnedPieceIds: Set<string>;
  index: number;
  onPress?: () => void;
  /** Web trophy-case variant: a compact grid card instead of a full-width banner. */
  web?: boolean;
  /** Fixed pixel width for the web grid cell. */
  cardWidth?: number;
}

export default function ChapterCard({ chapter, earnedPieceIds, index, onPress, web, cardWidth }: ChapterCardProps) {
  const { colors, shadows } = useTheme();
  const earnedCount = chapter.pieces.filter(p => earnedPieceIds.has(p.id)).length;
  const isComplete = earnedCount === chapter.pieceCount;

  // Staggered entrance animation (matches app-wide pattern)
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(28);

  useEffect(() => {
    const delay = ANIMATION.entranceDelay + index * ANIMATION.staggerDelay;
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    translateY.value = withDelay(delay, withSpring(0, ANIMATION.springSmooth));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const accent = chapter.gradientColors[0];

  // ─── Web trophy-case variant ───────────────────────────────────────────────
  if (web) {
    return (
      <Animated.View style={[{ width: cardWidth }, animStyle]}>
        <Card
          onPress={onPress}
          accessibilityLabel={`${chapter.title}, ${chapter.subtitle}. ${earnedCount} of ${chapter.pieceCount} pieces earned.`}
        >
          <View style={styles.webHeaderRow}>
            <LinearGradient
              colors={chapter.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.webChip}
            >
              <Ionicons name={isComplete ? 'trophy' : 'extension-puzzle'} size={22} color="#FFF" />
            </LinearGradient>
            <View style={styles.webHeaderText}>
              <Text style={[styles.webTitle, { color: colors.textDark }]} numberOfLines={1}>
                {chapter.title}
              </Text>
              <Text style={[styles.webSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {chapter.subtitle}
              </Text>
            </View>
            {isComplete ? (
              <View style={[styles.webBadge, { backgroundColor: accent }]}>
                <Text style={styles.webBadgeText}>Complete</Text>
              </View>
            ) : (
              <Text style={[styles.webProgress, { color: accent }]}>
                {earnedCount} / {chapter.pieceCount}
              </Text>
            )}
          </View>

          <View
            style={[
              styles.webPuzzle,
              { backgroundColor: colors.appBackground, borderColor: colors.borderCard },
            ]}
          >
            <PuzzleGrid chapter={chapter} earnedPieceIds={earnedPieceIds} pieceSize={34} />
          </View>
        </Card>
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity activeOpacity={onPress ? 0.85 : 1} onPress={onPress} disabled={!onPress}>
      <Animated.View style={[styles.card, { backgroundColor: colors.white }, shadows.card, animStyle]}>
        {/* Gradient header strip */}
        <LinearGradient
          colors={chapter.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.chapterTitle}>{chapter.title}</Text>
              <Text style={styles.chapterSubtitle}>{chapter.subtitle}</Text>
            </View>
            {isComplete ? (
              <View style={styles.completeBadge}>
                <Text style={styles.completeBadgeText}>Complete</Text>
              </View>
            ) : (
              <Text style={styles.progressText}>
                {earnedCount} / {chapter.pieceCount}
              </Text>
            )}
          </View>
        </LinearGradient>

        {/* Puzzle grid */}
        <View style={styles.gridContainer}>
          <PuzzleGrid
            chapter={chapter}
            earnedPieceIds={earnedPieceIds}
            pieceSize={52}
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.card,
    overflow: 'hidden',
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 18,
    fontFamily: 'Raleway_800ExtraBold',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  chapterSubtitle: {
    fontSize: 13,
    fontFamily: 'Raleway_600SemiBold',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  progressText: {
    fontSize: 16,
    fontFamily: 'Raleway_700Bold',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: -0.2,
  },
  completeBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  completeBadgeText: {
    fontSize: 12,
    fontFamily: 'Raleway_700Bold',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  gridContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  // ── Web trophy-case variant ──
  webHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  webChip: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webHeaderText: {
    flex: 1,
  },
  webTitle: {
    fontSize: 17,
    fontFamily: 'Raleway_800ExtraBold',
    letterSpacing: -0.3,
  },
  webSubtitle: {
    fontSize: 12.5,
    fontFamily: 'Raleway_600SemiBold',
    marginTop: 1,
  },
  webProgress: {
    fontSize: 15,
    fontFamily: 'Raleway_700Bold',
    letterSpacing: -0.2,
  },
  webBadge: {
    borderRadius: RADII.badgeSmall,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  webBadgeText: {
    fontSize: 11,
    fontFamily: 'Raleway_700Bold',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  webPuzzle: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: RADII.md,
    borderWidth: 1,
  },
});
