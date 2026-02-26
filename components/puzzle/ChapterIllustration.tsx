import React from 'react';
import { G, Circle, Line, Rect, Polygon, Path } from 'react-native-svg';

/**
 * Returns SVG elements for a chapter's abstract geometric illustration.
 * The elements fill the canvas at (totalWidth × totalHeight).
 * Used in PuzzlePiece (clipped to jigsaw) and in chapter-detail header.
 */
export function getIllustrationElements(
  chapterId: string,
  totalWidth: number,
  totalHeight: number,
): React.ReactElement {
  switch (chapterId) {
    case 'chapter_1':
      return <Chapter1Illustration w={totalWidth} h={totalHeight} />;
    case 'chapter_2':
      return <Chapter2Illustration w={totalWidth} h={totalHeight} />;
    case 'chapter_3':
      return <Chapter3Illustration w={totalWidth} h={totalHeight} />;
    case 'chapter_4':
      return <Chapter4Illustration w={totalWidth} h={totalHeight} />;
    default:
      return <G />;
  }
}

// ── Chapter 1 — First Steps (Amber): concentric rings radiating from center ──
function Chapter1Illustration({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy) * 1.1;
  const rings = 9;
  const ringColors = [
    'rgba(255,255,255,0.9)',
    'rgba(251,191,36,0.7)',
    'rgba(245,158,11,0.6)',
    'rgba(255,255,255,0.5)',
    'rgba(251,191,36,0.55)',
    'rgba(245,158,11,0.45)',
    'rgba(255,255,255,0.4)',
    'rgba(251,191,36,0.35)',
    'rgba(245,158,11,0.3)',
  ];

  return (
    <G>
      {/* Background gradient-ish fill */}
      <Rect x={0} y={0} width={w} height={h} fill="#F59E0B" />
      {/* Concentric rings */}
      {Array.from({ length: rings }).map((_, i) => (
        <Circle
          key={i}
          cx={cx}
          cy={cy}
          r={(maxR / rings) * (i + 1)}
          fill="none"
          stroke={ringColors[i % ringColors.length]}
          strokeWidth={3 - i * 0.2}
        />
      ))}
      {/* Inner accent circle */}
      <Circle cx={cx} cy={cy} r={maxR / rings / 2} fill="rgba(255,255,255,0.6)" />
    </G>
  );
}

// ── Chapter 2 — Explorer (Cyan): hexagonal grid / honeycomb ──────────────────
function Chapter2Illustration({ w, h }: { w: number; h: number }) {
  const hexRadius = Math.min(w, h) / 5;
  const hexWidth = hexRadius * 2;
  const hexHeight = Math.sqrt(3) * hexRadius;
  const cols = Math.ceil(w / (hexWidth * 0.75)) + 2;
  const rows = Math.ceil(h / hexHeight) + 2;

  function hexPoints(cx: number, cy: number, r: number): string {
    return Array.from({ length: 6 })
      .map((_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      })
      .join(' ');
  }

  const hexes: React.ReactElement[] = [];
  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const cx = col * hexWidth * 0.75 + hexRadius;
      const cy = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2) + hexHeight / 2;
      const opacity = 0.15 + ((row + col) % 3) * 0.12;
      hexes.push(
        <Polygon
          key={`${row}-${col}`}
          points={hexPoints(cx, cy, hexRadius * 0.88)}
          fill={`rgba(255,255,255,${opacity})`}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1}
        />
      );
    }
  }

  return (
    <G>
      <Rect x={0} y={0} width={w} height={h} fill="#0EA5E9" />
      {hexes}
    </G>
  );
}

// ── Chapter 3 — Mind Hunter (Purple): starburst / radial lines ────────────────
function Chapter3Illustration({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  const cy = h / 2;
  const lineCount = 24;
  const maxLen = Math.sqrt(cx * cx + cy * cy) * 1.1;

  const lines: React.ReactElement[] = [];
  for (let i = 0; i < lineCount; i++) {
    const angle = (2 * Math.PI * i) / lineCount;
    const x2 = cx + Math.cos(angle) * maxLen;
    const y2 = cy + Math.sin(angle) * maxLen;
    const opacity = 0.2 + (i % 3) * 0.1;
    lines.push(
      <Line
        key={i}
        x1={cx}
        y1={cy}
        x2={x2}
        y2={y2}
        stroke={`rgba(255,255,255,${opacity})`}
        strokeWidth={i % 4 === 0 ? 2.5 : 1}
      />
    );
  }

  // Concentric rings to add depth
  const rings = [0.15, 0.3, 0.5, 0.7, 0.9];

  return (
    <G>
      <Rect x={0} y={0} width={w} height={h} fill="#7B68EE" />
      {lines}
      {rings.map((frac, i) => (
        <Circle
          key={i}
          cx={cx}
          cy={cy}
          r={maxLen * frac}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
        />
      ))}
      {/* Center dot */}
      <Circle cx={cx} cy={cy} r={maxLen * 0.04} fill="rgba(255,255,255,0.7)" />
    </G>
  );
}

// ── Chapter 4 — Story Keeper (Pink): heart-form concentric outlines ───────────
function Chapter4Illustration({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  const cy = h / 2;
  const baseScale = Math.min(w, h) / 3;

  // Heart path scaled from a unit heart centered at origin
  // Using a parametric heart shape
  function heartPath(scale: number, offsetX: number, offsetY: number): string {
    const s = scale;
    // SVG heart using cubic beziers, centered at (offsetX, offsetY)
    const x = offsetX;
    const y = offsetY;
    return (
      `M ${x} ${y + s * 0.3} ` +
      `C ${x} ${y - s * 0.1} ${x - s * 0.5} ${y - s * 0.4} ${x - s * 0.5} ${y} ` +
      `C ${x - s * 0.5} ${y + s * 0.45} ${x} ${y + s * 0.7} ${x} ${y + s * 0.9} ` +
      `C ${x} ${y + s * 0.7} ${x + s * 0.5} ${y + s * 0.45} ${x + s * 0.5} ${y} ` +
      `C ${x + s * 0.5} ${y - s * 0.4} ${x} ${y - s * 0.1} ${x} ${y + s * 0.3} Z`
    );
  }

  const hearts = [0.4, 0.6, 0.8, 1.0, 1.25];
  const heartColors = [
    'rgba(255,255,255,0.7)',
    'rgba(255,255,255,0.5)',
    'rgba(244,114,182,0.6)',
    'rgba(255,255,255,0.3)',
    'rgba(244,114,182,0.25)',
  ];

  return (
    <G>
      <Rect x={0} y={0} width={w} height={h} fill="#EC4899" />
      {hearts.map((scale, i) => (
        <Path
          key={i}
          d={heartPath(baseScale * scale, cx, cy - baseScale * scale * 0.15)}
          fill="none"
          stroke={heartColors[i]}
          strokeWidth={2}
        />
      ))}
    </G>
  );
}
