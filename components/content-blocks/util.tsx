// Render helpers shared by block components: safe icon names, a staggered entrance
// wrapper (ports the finances fade+slide), and a minimal markdown renderer.
import React, { useRef, useEffect } from 'react';
import { Animated, Text, View, TextStyle, ViewStyle } from 'react-native';
import { isValidIconName } from '../ui/AppIcon';

/** Return the icon name if valid, else a neutral fallback — the AI can't crash a page with a bad icon. */
export function safeIcon(name?: string): any {
  if (isValidIconName(name)) return name;
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
// Supports: # / ## / ### headings, paragraphs (blank-line separated; single newlines
// soft-wrap), "- " / "* " bullet lists, "1. " numbered lists, **bold**, *italic*,
// [text](url). Parsed line by line, so a heading or list can sit directly above a
// paragraph without a blank line between (common in pasted/verbatim source text).
// No raw HTML. Renders to native <Text>.
type Run = { text: string; bold?: boolean; italic?: boolean; href?: string };

type MdNode =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'para'; text: string }
  | { kind: 'list'; ordered: boolean; items: { marker: string; text: string }[] };

const HEADING_RE = /^(#{1,6})\s+(.*?)\s*#*$/;
const BULLET_RE = /^[-*•]\s+(.*)$/;
const ORDERED_RE = /^(\d{1,3})[.)]\s+(.*)$/;

function parseMarkdown(md: string): MdNode[] {
  const nodes: MdNode[] = [];
  let para: string[] = [];
  let list: Extract<MdNode, { kind: 'list' }> | null = null;
  const flushPara = () => { if (para.length) { nodes.push({ kind: 'para', text: para.join(' ') }); para = []; } };
  const flushList = () => { if (list) { nodes.push(list); list = null; } };

  for (const raw of md.split('\n')) {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); continue; }
    let m: RegExpExecArray | null;
    if ((m = HEADING_RE.exec(line))) {
      flushPara(); flushList();
      nodes.push({ kind: 'heading', level: m[1].length, text: m[2] });
      continue;
    }
    const bullet = BULLET_RE.exec(line);
    const ordered = bullet ? null : ORDERED_RE.exec(line);
    if (bullet || ordered) {
      flushPara();
      const isOrdered = !!ordered;
      if (list && list.ordered !== isOrdered) flushList();
      if (!list) list = { kind: 'list', ordered: isOrdered, items: [] };
      list.items.push(ordered ? { marker: `${ordered[1]}.`, text: ordered[2] } : { marker: '•', text: bullet![1] });
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara(); flushList();
  return nodes;
}

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
  const nodes = parseMarkdown(markdown ?? '');
  const baseSize = paraStyle.fontSize ?? 16;
  return (
    <>
      {nodes.map((node, bi) => {
        if (node.kind === 'heading') {
          const fontSize = baseSize + (node.level <= 2 ? 4 : 2);
          return (
            <Text
              key={bi}
              accessibilityRole="header"
              style={[paraStyle, { fontFamily: 'Raleway_700Bold', fontSize, lineHeight: Math.round(fontSize * 1.3), marginTop: bi === 0 ? 0 : 8, marginBottom: 6 }]}
            >
              {renderRuns(parseInline(node.text), linkColor, onLink)}
            </Text>
          );
        }
        if (node.kind === 'list') {
          return (
            <View key={bi} style={{ marginBottom: 4 }}>
              {node.items.map((item, li) => (
                <View key={li} style={bulletRowStyle}>
                  <Text style={[bulletDotStyle, node.ordered && { minWidth: 20 }]}>{item.marker}</Text>
                  <Text style={[paraStyle, { marginBottom: 0, flex: 1 }]}>
                    {renderRuns(parseInline(item.text), linkColor, onLink)}
                  </Text>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text key={bi} style={paraStyle}>
            {renderRuns(parseInline(node.text), linkColor, onLink)}
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
