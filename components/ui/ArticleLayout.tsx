import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { Breadcrumb, Crumb } from './Breadcrumb';
import { TYPOGRAPHY, SPACING } from '../../constants/onboarding-theme';

export interface ArticleSection {
  /** DOM id — put the same value as `nativeID` on the matching section View. */
  id: string;
  label: string;
}

interface ArticleLayoutProps {
  breadcrumb: Crumb[];
  /** Title node (may contain accent-colored spans). Shares a row with actions. */
  title?: React.ReactNode;
  /** Action buttons (share / download / bookmark), right side of the title row. */
  actions?: React.ReactNode;
  /** Section outline for the sticky "On this page" rail — shown when 3+. */
  sections?: ArticleSection[];
  /** Right-rail content (e.g. related resources). Sits in the rail on wide
   *  screens, or drops below the article on narrower ones. */
  aside?: React.ReactNode;
  /** For grid-heavy pages: a wider reading column (900 vs 720), no right rail. */
  wide?: boolean;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
  /** Forwarded to the article ScrollView so callers can detect read-to-end. */
  onScroll?: (e: any) => void;
}

function scrollToSection(id: string) {
  if (Platform.OS === 'web') {
    (globalThis as any).document?.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

const STICKY = Platform.OS === 'web' ? ({ position: 'sticky', top: 20 } as any) : null;

/**
 * Web article frame (desktop-first), responsive:
 *  - wide (≥1240): 3 columns — sticky outline · reading column · right rail — centered.
 *  - medium (≥920): outline + reading column, related content drops below.
 *  - narrow: a single centered reading column.
 * Title and actions share one row. Web-only; native screens keep their own layout.
 */
export function ArticleLayout({ breadcrumb, title, actions, sections, aside, wide, children, contentStyle, onScroll }: ArticleLayoutProps) {
  const { colors } = useTheme();
  const { width } = useResponsive();
  const showToc = !!sections && sections.length >= 3 && width >= 920;
  const showRail = !wide && !!aside && width >= 1240;
  const readingMax = wide ? 900 : 720;
  const outerMax = showRail ? 1300 : showToc ? (wide ? 1180 : 980) : (wide ? 940 : 800);

  const titleRow = title || actions ? (
    <View style={styles.titleRow}>
      <View style={{ flex: 1, minWidth: 0 }}>{title}</View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 48, paddingTop: SPACING.xl, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Breadcrumb anchors to the left content edge, above the centered article. */}
        <Breadcrumb items={breadcrumb} />
        <View style={{ width: '100%', maxWidth: outerMax, alignSelf: 'center' }}>
          <View style={styles.row}>
            {showToc ? (
              <View style={[styles.tocCol, STICKY]}>
                <Text style={[styles.tocLabel, { color: colors.textLight }]}>On this page</Text>
                {sections!.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => scrollToSection(s.id)}
                    style={(({ hovered }: any) => [
                      styles.tocItem,
                      { borderLeftColor: hovered ? colors.primary : colors.border },
                      Platform.OS === 'web' ? { cursor: 'pointer' } : null,
                    ]) as any}
                  >
                    <Text style={[styles.tocText, { color: colors.textMuted }]}>{s.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={[styles.reading, { maxWidth: readingMax }, contentStyle]}>
              {titleRow}
              {children}
              {!showRail && aside ? <View style={{ marginTop: SPACING.xxl }}>{aside}</View> : null}
            </View>

            {showRail ? (
              <View style={[styles.railCol, STICKY]}>{aside}</View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 44, alignItems: 'flex-start', marginTop: SPACING.md },
  tocCol: { width: 200, flexShrink: 0 },
  tocLabel: { ...TYPOGRAPHY.overline, marginBottom: 10 },
  tocItem: { paddingVertical: 5, borderLeftWidth: 2, paddingLeft: 12 },
  tocText: { ...TYPOGRAPHY.caption },
  reading: { flex: 1, minWidth: 0, maxWidth: 720 },
  railCol: { width: 300, flexShrink: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: SPACING.lg },
  actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexShrink: 0, paddingTop: 6 },
});
