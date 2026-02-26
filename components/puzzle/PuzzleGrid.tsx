import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ChapterDefinition, PieceDefinition } from '../../constants/accomplishments';
import { ANIMATION } from '../../constants/onboarding-theme';
import PuzzlePiece, { PIECE_SIZE } from './PuzzlePiece';

// Spacing between pieces (accounts for bump overflow)
const CELL_MARGIN = 2;

interface PuzzleGridProps {
  chapter: ChapterDefinition;
  earnedPieceIds: Set<string>;
  pieceSize?: number;
  onPiecePress?: (piece: PieceDefinition) => void;
}

export default function PuzzleGrid({
  chapter,
  earnedPieceIds,
  pieceSize = PIECE_SIZE,
  onPiecePress,
}: PuzzleGridProps) {
  const isComplete = chapter.pieces.every(p => earnedPieceIds.has(p.id));
  const scale = useSharedValue(1);

  // Celebration pulse when all pieces are earned
  useEffect(() => {
    if (isComplete) {
      scale.value = withSequence(
        withSpring(1.06, ANIMATION.springBouncy),
        withSpring(0.97, ANIMATION.springSmooth),
        withSpring(1.0, ANIMATION.springBouncy),
      );
    }
  }, [isComplete]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Build grid
  const rows: Array<Array<PieceDefinition | null>> = [];
  for (let r = 0; r < chapter.gridRows; r++) {
    const row: Array<PieceDefinition | null> = [];
    for (let c = 0; c < chapter.gridCols; c++) {
      const isActive = chapter.activeCells.some(cell => cell.row === r && cell.col === c);
      if (isActive) {
        const piece = chapter.pieces.find(
          p => p.gridPosition.row === r && p.gridPosition.col === c
        ) ?? null;
        row.push(piece);
      } else {
        row.push(null); // empty spacer
      }
    }
    rows.push(row);
  }

  const cellSize = pieceSize + CELL_MARGIN * 2;

  return (
    <Animated.View style={[styles.container, animStyle]}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((piece, colIdx) => (
            <View
              key={colIdx}
              style={[styles.cell, { width: cellSize, height: cellSize }]}
            >
              {piece ? (
                onPiecePress && earnedPieceIds.has(piece.id) ? (
                  <Pressable onPress={() => onPiecePress(piece)}>
                    <PuzzlePiece
                      piece={piece}
                      chapter={chapter}
                      isEarned={true}
                      size={pieceSize}
                    />
                  </Pressable>
                ) : (
                  <PuzzlePiece
                    piece={piece}
                    chapter={chapter}
                    isEarned={earnedPieceIds.has(piece.id)}
                    size={pieceSize}
                  />
                )
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
