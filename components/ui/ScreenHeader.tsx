import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive, CONTENT_WIDTH } from '../../hooks/useResponsive';
import { SPACING } from '../../constants/onboarding-theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Small label shown above the title (e.g. "Welcome back,"). */
  eyebrow?: string;
  /** Optional leading element, e.g. an avatar. */
  left?: React.ReactNode;
  /** Optional trailing element, e.g. action icons. */
  right?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * The one screen header. Every top-level screen uses this so titles share the
 * same Raleway weight, size, and spacing, with a light hairline divider (no
 * heavy band). On web the content aligns to the app column so headers line up
 * with the content below them.
 */
export function ScreenHeader({ title, subtitle, eyebrow, left, right, style }: ScreenHeaderProps) {
  const { colors, fontScale } = useTheme();
  const { isWeb } = useResponsive();
  const insets = useSafeAreaInsets();
  const fs = (n: number) => Math.round(n * fontScale);

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.white,
          borderBottomColor: colors.border,
          paddingTop: (isWeb ? 20 : insets.top + 12),
        },
        style,
      ]}
    >
      <View style={[styles.inner, isWeb ? { maxWidth: CONTENT_WIDTH.app, alignSelf: 'center', width: '100%' } : null]}>
        {left ? <View style={styles.left}>{left}</View> : null}
        <View style={styles.textCol}>
          {eyebrow ? (
            <Text style={[styles.eyebrow, { color: colors.textMuted }]} numberOfLines={1}>{eyebrow}</Text>
          ) : null}
          <Text style={[styles.title, { color: colors.textDark, fontSize: fs(30) }]} numberOfLines={2}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: fs(16) }]} numberOfLines={2}>{subtitle}</Text>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  left: { flexShrink: 0 },
  textCol: { flex: 1, minWidth: 0 },
  right: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  eyebrow: { fontFamily: 'Raleway_500Medium', fontSize: 15, marginBottom: 2 },
  title: { fontFamily: 'Raleway_800ExtraBold', letterSpacing: -0.5 },
  subtitle: { fontFamily: 'Raleway_400Regular', marginTop: 3, lineHeight: 22 },
});
