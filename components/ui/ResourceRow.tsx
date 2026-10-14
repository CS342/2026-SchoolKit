import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING } from '../../constants/onboarding-theme';

interface ResourceRowProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Per-item data color for the icon chip (intentionally not themed). */
  color: string;
  category?: string;
  description?: string;
  onPress: () => void;
  /** Optional trailing control, e.g. a bookmark button. */
  right?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Compact, left-aligned resource card for web dashboards and catalogs — icon
 * chip, title, category, and an optional one-line description. Denser and more
 * scannable than the big centered mobile tiles.
 */
export function ResourceRow({ title, icon, color, category, description, onPress, right, style }: ResourceRowProps) {
  const { colors } = useTheme();
  // The outer Card is a plain (non-pressable) container so the trailing `right`
  // control can sit as a *sibling* of the pressable region. Nesting an
  // interactive `right` (e.g. a bookmark button) inside a pressable Card renders
  // a <button> inside a <button> on web, which is invalid DOM.
  return (
    <Card padded={false} style={style}>
      <View style={styles.row}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={title}
          style={({ hovered }: any) => [
            styles.pressArea,
            Platform.OS === 'web' ? { cursor: 'pointer' } : null,
            Platform.OS === 'web' && hovered ? { opacity: 0.85 } : null,
          ]}
        >
          <View style={[styles.iconChip, { backgroundColor: color }]}>
            <Ionicons name={icon} size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.title, { color: colors.textDark }]} numberOfLines={2}>{title}</Text>
            {category ? <Text style={[styles.cat, { color: colors.textLight }]} numberOfLines={1}>{category}</Text> : null}
            {description ? <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>{description}</Text> : null}
          </View>
        </Pressable>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, padding: SPACING.lg },
  pressArea: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, flex: 1, minWidth: 0 },
  iconChip: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { ...TYPOGRAPHY.bodyStrong, fontFamily: 'Raleway_700Bold', lineHeight: 20 },
  cat: { ...TYPOGRAPHY.caption, marginTop: 3 },
  desc: { ...TYPOGRAPHY.caption, fontFamily: 'Raleway_400Regular', marginTop: 6, lineHeight: 18 },
  right: { flexShrink: 0 },
});
