import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { useAccomplishments } from '../../contexts/AccomplishmentContext';
import { CHAPTER_BY_ID } from '../../constants/accomplishments';
import PuzzlePiece from './PuzzlePiece';

const PIECE_DISPLAY_SIZE = 160;
const AUTO_DISMISS_MS = 5000;

export default function PieceRevealOverlay() {
  const { revealingPiece, dismissReveal } = useAccomplishments();

  // Animation values
  const bgOpacity = useSharedValue(0);
  const pieceScale = useSharedValue(0);
  const pieceOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const exitScale = useSharedValue(1);
  const exitOpacity = useSharedValue(1);

  const chapter = revealingPiece ? CHAPTER_BY_ID[revealingPiece.chapterId] : null;

  useEffect(() => {
    if (!revealingPiece) return;

    // Reset for next reveal
    bgOpacity.value = 0;
    pieceScale.value = 0;
    pieceOpacity.value = 0;
    exitScale.value = 1;
    exitOpacity.value = 1;
    glowScale.value = 1;

    // Entrance: background fades in
    bgOpacity.value = withTiming(1, { duration: 300 });

    // Piece springs in with bounce
    pieceOpacity.value = withTiming(1, { duration: 200 });
    pieceScale.value = withSpring(1, {
      damping: 10,
      stiffness: 180,
      mass: 0.8,
    });

    // Glow pulse loop
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900 }),
        withTiming(1.0, { duration: 900 }),
      ),
      -1,
      true,
    );

    // Auto-dismiss after 5s
    const timer = setTimeout(() => {
      handleDismiss();
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [revealingPiece?.id]);

  function handleDismiss() {
    // Exit animation: scale down + fade out
    exitScale.value = withTiming(0.85, { duration: 200 });
    exitOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(dismissReveal)();
      }
    });
  }

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const pieceStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pieceScale.value * exitScale.value },
    ],
    opacity: pieceOpacity.value * exitOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  if (!revealingPiece || !chapter) return null;

  const chapterColor = chapter.gradientColors[0];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss}>
        <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
          <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.darkOverlay]} />
        </Animated.View>
      </Pressable>

      <View style={styles.centerColumn} pointerEvents="none">
        {/* Glow rings */}
        <Animated.View style={[styles.glowOuter, { borderColor: chapterColor }, glowStyle]}>
          <View style={[styles.glowMiddle, { borderColor: chapterColor }]}>
            <View style={[styles.glowInner, { borderColor: chapterColor }]} />
          </View>
        </Animated.View>

        {/* Piece */}
        <Animated.View style={[styles.pieceContainer, pieceStyle]}>
          <PuzzlePiece
            piece={revealingPiece}
            chapter={chapter}
            isEarned={true}
            size={PIECE_DISPLAY_SIZE}
          />
        </Animated.View>

        {/* Text */}
        <Animated.View style={[styles.textArea, pieceStyle]}>
          <Text style={styles.foundText}>A piece found</Text>
          <Text style={styles.pieceName}>{revealingPiece.name}</Text>
          <Text style={[styles.chapterName, { color: chapterColor }]}>
            {chapter.title}
          </Text>
          <Text style={styles.tapHint}>Tap anywhere to continue</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  darkOverlay: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  centerColumn: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    opacity: 0.08,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowMiddle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    opacity: 1.5, // stacks with outer
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    opacity: 2.25,
  },
  pieceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  textArea: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  foundText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  pieceName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  chapterName: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 20,
  },
  tapHint: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.1,
  },
});
