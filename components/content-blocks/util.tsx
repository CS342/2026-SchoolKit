// Render helpers shared by block components: safe icon names, a staggered entrance
// wrapper (ports the finances fade+slide), and a minimal markdown renderer.
import React, { useRef, useEffect } from 'react';
import { Animated, Text, View, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GLYPHS = (Ionicons as any).glyphMap as Record<string, number>;

/** Return the icon name if valid, else a neutral fallback — the AI can't crash a page with a bad icon. */
export function safeIcon(name?: string): any {
  if (name && GLYPHS && name in GLYPHS) return name;
  return 'ellipse-outline';
}

/** Staggered fade + slide-up entrance (matches the finances page). */
export function BlockEntrance({
  delay = 0,
  style,
  nativeID,
  animate = true,
  children,
}: {
  delay?: number;
  style?: ViewStyle;
  nativeID?: string;
  /** Set false to render immediately (e.g. the editor's live preview). */
  animate?: boolean;
  children: React.ReactNode;
}) {
  const fade = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const slide = useRef(new Animated.Value(animate ? 20 : 0)).current;
  useEffect(() => {
    if (!animate) return;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slide, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);
  return (
    <Animated.View nativeID={nativeID} style={[style, { opacity: fade, transform: [{ translateY: slide }] }]}>
      {children}
    </Animated.View>
  );
}

// ─── minimal markdown ──────────────────────────────────────────────────────────
// Supports: paragraphs (blank-line separated), - bullet lists, **bold**, *italic*,
// [text](url). No raw HTML. Renders to native <Text>.
type Run = { text: string; bold?: boolean; italic?: boolean; href?: string };

function parseInline(s: string): Run[] {
  const runs: Run[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) runs.push({ text: s.slice(last, m.index) });
    if (m[2] !== undefined) runs.push({ text: m[2], bold: true });
    else if (m[4] !== undefined) runs.push({ text: m[4], italic: true });
    else if (m[6] !== undefined) runs.push({ text: m[6], href: m[7] });
    last = re.lastIndex;
  }
  if (last < s.length) runs.push({ text: s.slice(last) });
  return runs;
}

export function Markdown({
  markdown,
  paraStyle,
  bulletRowStyle,
  bulletDotStyle,
  linkColor,
  onLink,
}: {
  markdown: string;
  paraStyle: TextStyle;
  bulletRowStyle: ViewStyle;
  bulletDotStyle: TextStyle;
  linkColor: string;
  onLink?: (href: string) => void;
}) {
  const blocks = markdown.split(/\n\s*\n/);
  return (
    <>
      {blocks.map((blk, bi) => {
        const lines = blk.split('\n');
        const isList = lines.every((l) => l.trim().startsWith('- '));
        if (isList) {
          return (
            <View key={bi}>
              {lines.map((l, li) => (
                <View key={li} style={bulletRowStyle}>
                  <Text style={bulletDotStyle}>{'•'}</Text>
                  <Text style={[paraStyle, { marginBottom: 0, flex: 1 }]}>
                    {renderRuns(parseInline(l.trim().slice(2)), linkColor, onLink)}
                  </Text>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text key={bi} style={paraStyle}>
            {renderRuns(parseInline(blk.replace(/\n/g, ' ')), linkColor, onLink)}
          </Text>
        );
      })}
    </>
  );
}

function renderRuns(runs: Run[], linkColor: string, onLink?: (href: string) => void) {
  return runs.map((r, i) => (
    <Text
      key={i}
      onPress={r.href && onLink ? () => onLink(r.href!) : undefined}
      style={{
        fontFamily: r.bold ? 'Raleway_700Bold' : r.italic ? 'Raleway_400Regular' : undefined,
        fontStyle: r.italic ? 'italic' : 'normal',
        color: r.href ? linkColor : undefined,
        textDecorationLine: r.href ? 'underline' : 'none',
      }}
    >
      {r.text}
    </Text>
  ));
}
