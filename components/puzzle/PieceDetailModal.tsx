import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ChapterDefinition, PieceDefinition } from '../../constants/accomplishments';
import PuzzlePiece from './PuzzlePiece';

interface PieceDetailModalProps {
  piece: PieceDefinition | null;
  chapter: ChapterDefinition | null;
  earnedAt: number | undefined;
  onDismiss: () => void;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function PieceDetailModal({
  piece,
  chapter,
  earnedAt,
  onDismiss,
}: PieceDetailModalProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  const visible = piece !== null && chapter !== null;

  useEffect(() => {
    if (visible) {
      scale.value = 0;
      opacity.value = 0;
      glowOpacity.value = 0.3;

      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 12, stiffness: 200, mass: 0.7 });

      // Glow pulse
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 }),
        ),
        -1,
        true,
      );
    }
  }, [visible, piece?.id]);

  function handleDismiss() {
    scale.value = withTiming(0.85, { duration: 180 });
    opacity.value = withTiming(0, { duration: 180 }, (finished) => {
      if (finished) runOnJS(onDismiss)();
    });
  }

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!piece || !chapter) return null;

  const chapterColor = chapter.gradientColors[0];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.darkOverlay]} />
      </Pressable>

      <View style={styles.centerContainer} pointerEvents="box-none">
        <Animated.View style={[styles.card, containerStyle]}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* Glow ring behind piece */}
          <View style={styles.glowContainer}>
            <Animated.View
              style={[
                styles.glowRing,
                { borderColor: chapterColor },
                glowStyle,
              ]}
            />
            <PuzzlePiece
              piece={piece}
              chapter={chapter}
              isEarned={true}
              size={160}
            />
          </View>

          {/* Name */}
          <Text style={styles.pieceName}>{piece.name}</Text>

          {/* Description */}
          <Text style={styles.description}>{piece.description}</Text>

          {/* Earn date */}
          {earnedAt !== undefined && (
            <Text style={[styles.earnDate, { color: chapterColor }]}>
              Found on {formatDate(earnedAt)}
            </Text>
          )}

          {/* Chapter label */}
          <View style={[styles.chapterBadge, { borderColor: chapterColor }]}>
            <Text style={[styles.chapterBadgeText, { color: chapterColor }]}>
              {chapter.title}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  darkOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: 'rgba(20,18,36,0.92)',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  glowRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
  },
  pieceName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  earnDate: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 20,
    letterSpacing: 0.1,
  },
  chapterBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  chapterBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
