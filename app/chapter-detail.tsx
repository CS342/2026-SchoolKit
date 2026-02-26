import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CHAPTER_BY_ID, PieceDefinition } from '../constants/accomplishments';
import { useAccomplishments } from '../contexts/AccomplishmentContext';
import { COLORS, SHADOWS } from '../constants/onboarding-theme';
import PuzzleGrid from '../components/puzzle/PuzzleGrid';
import PieceDetailModal from '../components/puzzle/PieceDetailModal';

export default function ChapterDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const { earnedPieceIds, earnedAt } = useAccomplishments();
  const [inspectingPiece, setInspectingPiece] = useState<PieceDefinition | null>(null);

  const chapter = chapterId ? CHAPTER_BY_ID[chapterId] : null;
  if (!chapter) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Chapter not found.</Text>
        </View>
      </View>
    );
  }

  const earnedCount = chapter.pieces.filter(p => earnedPieceIds.has(p.id)).length;
  const isComplete = earnedCount === chapter.pieceCount;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={chapter.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
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

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro text */}
        <Text style={styles.introText}>{chapter.introText}</Text>

        {/* Hint */}
        <Text style={styles.hintText}>Tap an earned piece to inspect it.</Text>

        {/* Interactive puzzle grid */}
        <View style={styles.gridWrapper}>
          <PuzzleGrid
            chapter={chapter}
            earnedPieceIds={earnedPieceIds}
            pieceSize={72}
            onPiecePress={(piece) => {
              if (earnedPieceIds.has(piece.id)) {
                setInspectingPiece(piece);
              }
            }}
          />
        </View>
      </ScrollView>

      {/* Piece detail modal */}
      <PieceDetailModal
        piece={inspectingPiece}
        chapter={inspectingPiece ? chapter : null}
        earnedAt={inspectingPiece ? earnedAt[inspectingPiece.id] : undefined}
        onDismiss={() => setInspectingPiece(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FC',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  chapterSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
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
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  introText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textMuted,
    lineHeight: 25,
    marginBottom: 16,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textLight,
    marginBottom: 28,
  },
  gridWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    ...SHADOWS.card,
    padding: 20,
  },
});
