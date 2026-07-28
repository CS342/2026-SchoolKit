import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { RADII, SPACING, TYPOGRAPHY } from '../../constants/onboarding-theme';

export type BadgeTone = 'primary' | 'teal' | 'coral' | 'amber' | 'neutral';
export type StoryStatusTone = 'approved' | 'pending' | 'rejected';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
}

/** A soft pill badge/chip. One radius, one shape, tone-driven color. */
export function Badge({ label, tone = 'primary', style }: BadgeProps) {
  const { colors } = useTheme();
  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    primary: { bg: colors.primarySoft, fg: colors.primary },
    teal: { bg: colors.tealSoft, fg: colors.teal },
    coral: { bg: colors.coralSoft, fg: colors.coral },
    amber: { bg: colors.amberSoft, fg: colors.warningText },
    neutral: { bg: colors.appBackgroundAlt, fg: colors.textMuted },
  };
  const c = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, style]}>
      <Text style={[styles.text, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

/** Moderation status label — pending/approved/rejected in one consistent shape. */
export function StatusLabel({ status }: { status: StoryStatusTone }) {
  const { colors } = useTheme();
  const map: Record<StoryStatusTone, { bg: string; fg: string; label: string }> = {
    approved: { bg: colors.successBg, fg: colors.success, label: 'Approved' },
    pending: { bg: colors.warningBg, fg: colors.warningText, label: 'Pending review' },
    rejected: { bg: colors.error + '22', fg: colors.error, label: 'Needs edits' },
  };
  const c = map[status];
  return (
    <View style={[styles.status, { backgroundColor: c.bg }]}>
      <Text style={[styles.statusText, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: RADII.pill, paddingHorizontal: SPACING.md, paddingVertical: 4, alignSelf: 'flex-start' },
  text: { ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold' },
  status: { borderRadius: RADII.pill, paddingHorizontal: SPACING.md, paddingVertical: 3, alignSelf: 'flex-start' },
  statusText: { ...TYPOGRAPHY.overline },
});
