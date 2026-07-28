// Doc-level settings: accent (the title-highlight + spine color), category (breadcrumb),
// and tags (drive recommendations + search). Collapsible so it stays out of the way.
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, RADII } from '../../constants/onboarding-theme';
import { useEditorStore } from '../../features/content/editor/store';
import type { ColorToken } from '../../features/content/types';
import { TextField, ColorSwatches } from './primitives';

export function PageSettingsCard() {
  const { colors, shadows } = useTheme();
  const doc = useEditorStore((s) => s.doc);
  const setMeta = useEditorStore((s) => s.setMeta);
  const [open, setOpen] = useState(false);
  const [tagStr, setTagStr] = useState(doc.tags.join(', '));

  return (
    <View style={[{ backgroundColor: colors.white, borderRadius: RADII.lg, borderWidth: 1, borderColor: colors.borderCard }, shadows.small]}>
      <Pressable onPress={() => setOpen((o) => !o)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, cursor: 'pointer' as any }}>
        <Ionicons name="options-outline" size={17} color={colors.textMuted} />
        <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: colors.textMuted, flex: 1 }}>PAGE SETTINGS</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color={colors.textLight} />
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: colors.appBackgroundAlt, paddingTop: 12 }}>
          <ColorSwatches value={doc.accent as ColorToken} onChange={(v) => setMeta({ accent: v })} />
          <TextField label="URL slug" placeholder="e.g. returning-to-school" value={doc.slug ?? ''} onChangeText={(t) => setMeta({ slug: t.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
          <TextField label="Category" placeholder="e.g. School, Health, Family" value={doc.category ?? ''} onChangeText={(t) => setMeta({ category: t })} />
          <TextField label="Tags (comma separated)" placeholder="school, support, back to school" value={tagStr} onChangeText={(t) => { setTagStr(t); setMeta({ tags: t.split(',').map((x) => x.trim()).filter(Boolean) }); }} />
        </View>
      ) : null}
    </View>
  );
}
