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
import { ChapterDefinition } from '../../constants/accomplishments';
import { ANIMATION, COLORS, RADII, SHADOWS } from '../../constants/onboarding-theme';
import PuzzleGrid from './PuzzleGrid';

interface ChapterCardProps {
  chapter: ChapterDefinition;
  earnedPieceIds: Set<string>;
  index: number;
  onPress?: () => void;
}

export default function ChapterCard({ chapter, earnedPieceIds, index, onPress }: ChapterCardProps) {
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

  return (
    <TouchableOpacity activeOpacity={onPress ? 0.85 : 1} onPress={onPress} disabled={!onPress}>
    <Animated.View style={[styles.card, animStyle]}>
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
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    overflow: 'hidden',
    marginBottom: 20,
    ...SHADOWS.card,
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
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  chapterSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
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
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  gridContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
});
