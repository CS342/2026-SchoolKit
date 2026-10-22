import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppIcon } from './AppIcon';
import { Card } from './Card';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADII } from '../../constants/onboarding-theme';

interface ResourceRowProps {
  title: string;
  /** Ionicons name or `mci:<name>` (see AppIcon). */
  icon: string;
  /** Per-item data color for the icon chip (intentionally not themed). */
  color: string;
  category?: string;
  description?: string;
  onPress: () => void;
  /** Optional trailing control, e.g. a bookmark button. */
  right?: React.ReactNode;
  /** Shows a small "Downloaded" indicator inline with the category. */
  downloaded?: boolean;
  /** Stretch the card to fill its container's height (equal-height grids). */
  fillHeight?: boolean;
  style?: ViewStyle;
}

/**
 * Compact, left-aligned resource card for web dashboards and catalogs — icon
 * chip, title, category, and an optional one-line description. Denser and more
 * scannable than the big centered mobile tiles.
 */
export function ResourceRow({ title, icon, color, category, description, onPress, right, downloaded, fillHeight, style }: ResourceRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);

  // The outer Card is a plain (non-pressable) container so the trailing `right`
  // control can sit as a *sibling* of the pressable region. Nesting an
  // interactive `right` (e.g. a bookmark button) inside a pressable Card renders
  // a <button> inside a <button> on web, which is invalid DOM.
  const cardStyle: ViewStyle = {
    ...(fillHeight ? { flex: 1 } : null),
    ...(Platform.OS === 'web' && hovered ? { borderColor: colors.primary } : null),
    ...(style as object),
  };

  return (
    <Card padded={false} style={cardStyle}>
      <View style={styles.row}>
        <Pressable
          onPress={onPress}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          accessibilityRole="button"
          accessibilityLabel={title}
          style={[
            styles.pressArea,
            Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : null,
          ]}
        >
          <View style={[styles.iconChip, { backgroundColor: color }]}>
            <AppIcon name={icon} size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.title, { color: colors.textDark }]} numberOfLines={3}>{title}</Text>
            {(category || downloaded) ? (
              <View style={styles.metaRow}>
                {category ? (
                  <View style={[styles.catPill, { backgroundColor: color + '2E' }]}>
                    <Text style={[styles.catText, { color }]} numberOfLines={1}>{category}</Text>
                  </View>
                ) : null}
                {downloaded ? (
                  <View style={styles.dlBadge}>
                    <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                    <Text style={[styles.dlText, { color: colors.success }]}>{t('design.ui.downloaded')}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
            {description ? <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>{description}</Text> : null}
          </View>
        </Pressable>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, padding: SPACING.lg, flex: 1 },
  pressArea: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, flex: 1, minWidth: 0 },
  iconChip: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { ...TYPOGRAPHY.bodyStrong, fontFamily: 'Raleway_700Bold', lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' },
  catPill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 2, borderRadius: RADII.pill },
  catText: { ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', fontSize: 11, letterSpacing: 0.3 },
  dlBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dlText: { ...TYPOGRAPHY.caption, fontSize: 11, fontFamily: 'Raleway_700Bold' },
  desc: { ...TYPOGRAPHY.caption, fontFamily: 'Raleway_400Regular', marginTop: 6, lineHeight: 18 },
  right: { flexShrink: 0, alignSelf: 'center' },
});
