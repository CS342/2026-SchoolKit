// Live preview — renders the real ContentPage (what readers get) from the store's
// doc, in a web or mobile viewport. Navigations that would leave the editor are
// disabled via ContentPage's `preview` flag.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, RADII } from '../../constants/onboarding-theme';
import { ContentPage } from '../content-blocks';
import { useEditorStore } from '../../features/content/editor/store';

function SegBtn({ active, icon, label, onPress }: { active: boolean; icon: string; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADII.pill, backgroundColor: active ? colors.primary : 'transparent', cursor: 'pointer' as any }}>
      <Ionicons name={icon as any} size={15} color={active ? '#fff' : colors.textMuted} />
      <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: active ? '#fff' : colors.textMuted }}>{label}</Text>
    </Pressable>
  );
}

export function PreviewPane() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const doc = useEditorStore((s) => s.doc);
  const [mode, setMode] = useState<'web' | 'mobile'>('web');

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? colors.appBackground : colors.appBackgroundAlt }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderCard }}>
        <SegBtn active={mode === 'web'} icon="desktop-outline" label={t('editor.preview.web')} onPress={() => setMode('web')} />
        <SegBtn active={mode === 'mobile'} icon="phone-portrait-outline" label={t('editor.preview.mobile')} onPress={() => setMode('mobile')} />
      </View>

      {mode === 'web' ? (
        <View style={{ flex: 1 }}>
          <ContentPage doc={doc} forceLayout="web" preview />
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', paddingVertical: 20 }}>
          <View style={[{ width: 402, maxWidth: '96%', flex: 1, borderRadius: 34, borderWidth: 10, borderColor: isDark ? '#000' : '#1C1A26', overflow: 'hidden', backgroundColor: colors.appBackground }, st.deviceShadow]}>
            <ContentPage doc={doc} forceLayout="mobile" preview />
          </View>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  deviceShadow: { shadowColor: '#2C2A3A', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.22, shadowRadius: 40, elevation: 16 },
});
