// Pre-publish lint panel. Shows, live, the structural/content problems in the current
// doc (lintDoc) plus any warnings captured at load/generate time (dropped malformed
// blocks). Clicking an issue selects the offending block. Read-only — it reports, the
// moderator decides.
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, RADII } from '../../constants/onboarding-theme';
import { useEditorStore } from '../../features/content/editor/store';
import { lintDoc, type LintIssue } from '../../features/content/lint';
import { tieNotices } from '../../features/content/versions';
import type { Audience } from '../../features/content/audience';

export function LintPanel() {
  const { colors } = useTheme();
  const doc = useEditorStore((s) => s.doc);
  const warnings = useEditorStore((s) => s.warnings);
  const select = useEditorStore((s) => s.select);
  const [open, setOpen] = useState(true);

  const structural = useMemo(() => lintDoc(doc), [doc]);
  // Load/generate notices (content that was left out) — once their block is gone or the
  // author deleted it, a notice pointing at it can no longer be jumped to.
  const dropped = useMemo<LintIssue[]>(
    () => warnings.map((w) => ({
      level: 'warning' as const,
      ...w,
      blockId: w.blockId && doc.blocks.some((b) => b.id === w.blockId) ? w.blockId : undefined,
    })),
    [warnings, doc.blocks],
  );
  // Other versions of this topic competing for the same readers. The page being edited
  // counts with its live (possibly unsaved) audience.
  const topicCtx = useEditorStore((s) => s.topicCtx);
  const ties = useMemo<LintIssue[]>(() => {
    const versions: { id: string; audience?: Audience }[] = topicCtx.versions
      .map((v) => (v.id === topicCtx.currentId ? { ...v, audience: doc.audience } : v));
    if (!topicCtx.currentId && topicCtx.topic) versions.push({ id: '__current', audience: doc.audience });
    return versions.length > 1 ? tieNotices(versions).map((n) => ({ level: 'warning' as const, ...n })) : [];
  }, [topicCtx, doc.audience]);
  // Errors first, then "content was left out" notices, then the rest of the suggestions.
  const all = useMemo(() => [
    ...structural.filter((i) => i.level === 'error'),
    ...dropped,
    ...ties,
    ...structural.filter((i) => i.level !== 'error'),
  ], [structural, dropped, ties]);

  const errorCount = all.filter((i) => i.level === 'error').length;
  const warnCount = all.length - errorCount;

  if (all.length === 0) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: RADII.md, backgroundColor: colors.successBg }}>
        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.successText }}>No problems found — ready to publish.</Text>
      </View>
    );
  }

  const parts: string[] = [];
  if (errorCount) parts.push(`${errorCount} ${errorCount === 1 ? 'problem' : 'problems'}`);
  if (warnCount) parts.push(`${warnCount} ${warnCount === 1 ? 'suggestion' : 'suggestions'}`);

  return (
    <View style={{ borderRadius: RADII.md, borderWidth: 1, borderColor: errorCount ? colors.error : colors.borderCard, backgroundColor: colors.white, overflow: 'hidden' }}>
      <Pressable onPress={() => setOpen((o) => !o)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, cursor: 'pointer' as any }}>
        <Ionicons name="shield-checkmark-outline" size={18} color={errorCount ? colors.error : colors.warning} />
        <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: colors.textDark, flex: 1 }}>Checks · {parts.join(' · ')}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textLight} />
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: 8, paddingBottom: 8, gap: 2 }}>
          {all.map((issue, i) => {
            const clickable = !!issue.blockId;
            const tint = issue.level === 'error' ? colors.error : colors.warning;
            return (
              <Pressable
                key={i}
                onPress={clickable ? () => select(issue.blockId!) : undefined}
                style={({ hovered }: any) => ({ flexDirection: 'row', gap: 8, padding: 8, borderRadius: RADII.sm, alignItems: 'flex-start', backgroundColor: hovered && clickable ? colors.appBackgroundAlt : 'transparent', cursor: (clickable ? 'pointer' : 'default') as any })}
                accessibilityRole={clickable ? 'button' : undefined}
                accessibilityLabel={clickable ? `${issue.message} — go to block` : issue.message}
              >
                <Ionicons name={issue.level === 'error' ? 'close-circle' : 'warning-outline'} size={15} color={tint} style={{ marginTop: 1 }} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textDark }}>{issue.message}</Text>
                  {issue.fix ? (
                    <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted }}>
                      <Text style={{ fontFamily: 'Raleway_700Bold', color: colors.textMuted }}>How to fix: </Text>
                      {issue.fix}
                    </Text>
                  ) : null}
                  {clickable ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                      <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: colors.primary }}>Go to block</Text>
                      <Ionicons name="arrow-forward" size={12} color={colors.primary} />
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
