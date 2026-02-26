import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, ClipPath, G } from 'react-native-svg';
import { ChapterDefinition, EdgeType, PieceDefinition } from '../../constants/accomplishments';
import { getIllustrationElements } from './ChapterIllustration';

export const PIECE_SIZE = 76;
const BUMP_DEPTH = 14;    // protrusion depth
const BUMP_HALF = 12;     // half-width of bump base

/**
 * Builds an SVG path for a jigsaw piece. The piece occupies a PIECE_SIZE×PIECE_SIZE
 * bounding box, with tabs (protrusions) or blanks (indentations) on each edge.
 * The path traces clockwise: TL → top → TR → right → BR → bottom → BL → left → Z
 */
function buildJigsawPath(
  w: number,
  h: number,
  top: EdgeType,
  right: EdgeType,
  bottom: EdgeType,
  left: EdgeType,
): string {
  const BD = BUMP_DEPTH;
  const BW = BUMP_HALF;

  /**
   * Horizontal edge bump. Traversal can be left→right (dir=+1) or right→left (dir=-1).
   * sign: outward direction (+1=down for bottom, -1=up for top)
   */
  function hEdge(x1: number, x2: number, y: number, type: EdgeType, outSign: number): string {
    if (type === 'flat') return `L ${x2} ${y}`;
    const s = type === 'tab' ? outSign : -outSign;
    const dir = x1 < x2 ? 1 : -1;
    const mid = (x1 + x2) / 2;
    const aX = mid - BW * dir; // approach x (first contact with bump)
    const dX = mid + BW * dir; // depart x (last contact with bump)
    return (
      `L ${aX} ${y} ` +
      `C ${aX} ${y + s * BD * 0.55} ${mid - BW * dir * 0.35} ${y + s * BD} ${mid} ${y + s * BD} ` +
      `C ${mid + BW * dir * 0.35} ${y + s * BD} ${dX} ${y + s * BD * 0.55} ${dX} ${y} ` +
      `L ${x2} ${y}`
    );
  }

  /**
   * Vertical edge bump. Traversal can be top→bottom (dir=+1) or bottom→top (dir=-1).
   * sign: outward direction (+1=right for right edge, -1=left for left edge)
   */
  function vEdge(x: number, y1: number, y2: number, type: EdgeType, outSign: number): string {
    if (type === 'flat') return `L ${x} ${y2}`;
    const s = type === 'tab' ? outSign : -outSign;
    const dir = y1 < y2 ? 1 : -1;
    const mid = (y1 + y2) / 2;
    const aY = mid - BW * dir;
    const dY = mid + BW * dir;
    return (
      `L ${x} ${aY} ` +
      `C ${x + s * BD * 0.55} ${aY} ${x + s * BD} ${mid - BW * dir * 0.35} ${x + s * BD} ${mid} ` +
      `C ${x + s * BD} ${mid + BW * dir * 0.35} ${x + s * BD * 0.55} ${dY} ${x} ${dY} ` +
      `L ${x} ${y2}`
    );
  }

  return (
    `M 0 0 ` +
    hEdge(0, w, 0, top, -1) + ' ' +   // top: outward = up = -y
    vEdge(w, 0, h, right, +1) + ' ' + // right: outward = right = +x
    hEdge(w, 0, h, bottom, +1) + ' ' +// bottom: outward = down = +y (reverse traversal)
    vEdge(0, h, 0, left, -1) + ' ' +  // left: outward = left = -x (reverse traversal)
    'Z'
  );
}

interface PuzzlePieceProps {
  piece: PieceDefinition;
  chapter: ChapterDefinition;
  isEarned: boolean;
  size?: number;
}

export default function PuzzlePiece({
  piece,
  chapter,
  isEarned,
  size = PIECE_SIZE,
}: PuzzlePieceProps) {
  const scale = size / PIECE_SIZE;
  const scaledBD = BUMP_DEPTH * scale;
  const svgSize = size + scaledBD * 2;

  const gradId = `grad_${piece.id}`;
  const clipId = `clip_${piece.id}`;
  const pathD = buildJigsawPath(size, size, piece.edges.top, piece.edges.right, piece.edges.bottom, piece.edges.left);

  // Illustration dimensions: the full grid canvas
  const illustrationWidth = size * chapter.gridCols;
  const illustrationHeight = size * chapter.gridRows;
  const offsetX = piece.gridPosition.col * size;
  const offsetY = piece.gridPosition.row * size;

  return (
    <Svg
      width={svgSize}
      height={svgSize}
      viewBox={`${-scaledBD} ${-scaledBD} ${svgSize} ${svgSize}`}
    >
      <Defs>
        <LinearGradient
          id={gradId}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor={chapter.gradientColors[0]} stopOpacity={1} />
          <Stop offset="1" stopColor={chapter.gradientColors[1]} stopOpacity={1} />
        </LinearGradient>
        {isEarned && (
          <ClipPath id={clipId}>
            <Path d={pathD} />
          </ClipPath>
        )}
      </Defs>

      {isEarned ? (
        <G clipPath={`url(#${clipId})`}>
          {/* Subtle gradient tint underneath */}
          <Path
            d={pathD}
            fill={`url(#${gradId})`}
            opacity={0.35}
          />
          {/* Chapter illustration translated to show the correct cell */}
          <G transform={`translate(${-offsetX} ${-offsetY})`}>
            {getIllustrationElements(chapter.id, illustrationWidth, illustrationHeight)}
          </G>
        </G>
      ) : (
        <Path
          d={pathD}
          fill="rgba(210, 210, 225, 0.5)"
          stroke="rgba(190,185,210,0.4)"
          strokeWidth={1.5}
        />
      )}

      {/* Stroke overlay for earned pieces */}
      {isEarned && (
        <Path
          d={pathD}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={1.5}
        />
      )}
    </Svg>
  );
}
