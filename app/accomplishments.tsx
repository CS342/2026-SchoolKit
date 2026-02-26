import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
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
import { CHAPTERS, TOTAL_PIECES } from '../constants/accomplishments';
import { ANIMATION, COLORS, RADII, SHADOWS, TYPOGRAPHY } from '../constants/onboarding-theme';
import ChapterCard from '../components/puzzle/ChapterCard';

export default function AccomplishmentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { visibleChapterIds, earnedPieceIds } = useAccomplishments();

  const visibleChapters = CHAPTERS.filter(c => visibleChapterIds.has(c.id));
  const totalEarned = earnedPieceIds.size;
  const hasAny = visibleChapters.length > 0;

  // Header entrance animation
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-12);

  useEffect(() => {
    headerOpacity.value = withDelay(ANIMATION.entranceDelay, withTiming(1, { duration: 300 }));
    headerY.value = withDelay(ANIMATION.entranceDelay, withSpring(0, ANIMATION.springSmooth));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  // Empty state entrance
  const emptyOpacity = useSharedValue(0);
  const emptyY = useSharedValue(20);

  useEffect(() => {
    if (!hasAny) {
      emptyOpacity.value = withDelay(160, withTiming(1, { duration: 400 }));
      emptyY.value = withDelay(160, withSpring(0, ANIMATION.springSmooth));
    }
  }, [hasAny]);

  const emptyStyle = useAnimatedStyle(() => ({
    opacity: emptyOpacity.value,
    transform: [{ translateY: emptyY.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>

        <Text style={styles.title}>My Puzzles</Text>

        {hasAny && (
          <Text style={styles.countBadge}>
            {totalEarned} / {TOTAL_PIECES}
          </Text>
        )}
        {!hasAny && <View style={styles.placeholder} />}
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {hasAny ? (
          visibleChapters.map((chapter, index) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              earnedPieceIds={earnedPieceIds}
              index={index}
              onPress={() => router.push({ pathname: '/chapter-detail' as any, params: { chapterId: chapter.id } })}
            />
          ))
        ) : (
          <Animated.View style={[styles.emptyState, emptyStyle]}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="eye-outline" size={40} color={COLORS.textLight} />
            </View>
            <Text style={styles.emptyTitle}>Still unfolding</Text>
            <Text style={styles.emptyMessage}>
              Your story is still unfolding.{'\n'}
              Explore the app and something{'\n'}
              unexpected might find you.
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
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  title: {
    flex: 1,
    ...TYPOGRAPHY.h2,
    color: COLORS.textDark,
    letterSpacing: -0.4,
  },
  countBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: -0.1,
  },
  placeholder: {
    width: 60,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptyMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
});
