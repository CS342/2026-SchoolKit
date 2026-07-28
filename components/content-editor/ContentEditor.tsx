// The content-page editor: a live split view. Left = editable block list + page
// settings; right = the real ContentPage rendering live. Topbar carries the title,
// undo/redo, draft/publish, and save. Web-only (the (editor) group is web + admin).
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADII } from '../../constants/onboarding-theme';
import { useEditorStore, undo, redo, useCanUndo, useCanRedo } from '../../features/content/editor/store';
import { BlockCard } from './BlockCard';
import { AddBlockMenu } from './AddBlockMenu';
import { PageSettingsCard } from './PageSettingsCard';
import { PreviewPane } from './PreviewPane';

type Status = 'draft' | 'published';

export function ContentEditor({ onBack, onSave, saving, initialStatus }: {
  onBack: () => void;
  onSave: (status: Status) => void | Promise<void>;
  saving: boolean;
  initialStatus: Status;
}) {
  const { colors, shadows } = useTheme();
  const doc = useEditorStore((s) => s.doc);
  const dirty = useEditorStore((s) => s.dirty);
  const lastError = useEditorStore((s) => s.lastError);
  const setMeta = useEditorStore((s) => s.setMeta);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const [status, setStatus] = useState<Status>(initialStatus);

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      {/* Topbar */}
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderCard, zIndex: 10 }, shadows.header]}>
        <Pressable onPress={onBack} accessibilityLabel="Back to pages" style={{ padding: 4, cursor: 'pointer' as any }}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </Pressable>

        <TextInput
          value={doc.title}
          onChangeText={(t) => setMeta({ title: t })}
          placeholder="Page title"
          placeholderTextColor={colors.inputPlaceholder}
          style={{ flex: 1, ...TYPOGRAPHY.h3, color: colors.textDark, paddingVertical: 6, outlineStyle: 'none' as any }}
        />

        {dirty ? <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight }}>Unsaved</Text> : null}

        <View style={{ flexDirection: 'row', gap: 2 }}>
          <TopBtn icon="arrow-undo" label="Undo" disabled={!canUndo} onPress={undo} />
          <TopBtn icon="arrow-redo" label="Redo" disabled={!canRedo} onPress={redo} />
        </View>

        {/* Draft / Published segmented control */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.appBackgroundAlt, borderRadius: RADII.pill, padding: 3 }}>
          {(['draft', 'published'] as Status[]).map((s) => (
            <Pressable key={s} onPress={() => setStatus(s)} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: RADII.pill, backgroundColor: status === s ? colors.white : 'transparent', cursor: 'pointer' as any, ...(status === s ? shadows.small : {}) }}>
              <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: status === s ? (s === 'published' ? colors.success : colors.textDark) : colors.textLight }}>
                {s === 'draft' ? 'Draft' : 'Published'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => onSave(status)}
          disabled={saving}
          style={({ hovered }: any) => ({ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 9, paddingHorizontal: 18, borderRadius: RADII.button, backgroundColor: dirty || saving ? colors.primary : colors.disabledButton, opacity: hovered && !saving ? 0.92 : 1, cursor: (saving ? 'default' : 'pointer') as any })}
        >
          <Ionicons name={saving ? 'sync' : 'checkmark'} size={16} color="#fff" />
          <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: '#fff' }}>{saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}</Text>
        </Pressable>
      </View>

      {/* Split view */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Edit pane */}
        <View style={{ width: 460, borderRightWidth: 1, borderRightColor: colors.borderCard, backgroundColor: colors.appBackground }}>
          <ScrollView contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            <PageSettingsCard />
            <View style={{ height: 4 }} />
            {doc.blocks.map((b, i) => (
              <BlockCard key={b.id} block={b} index={i} count={doc.blocks.length} />
            ))}
            {doc.blocks.length === 0 ? (
              <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textLight, textAlign: 'center', paddingVertical: 20 }}>
                An empty page. Add a Title block to start.
              </Text>
            ) : null}
            <View style={{ height: 4 }} />
            <AddBlockMenu />
          </ScrollView>
        </View>

        {/* Preview pane */}
        <PreviewPane />
      </View>

      {lastError ? (
        <View style={[{ position: 'absolute', bottom: 20, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.textDark, paddingVertical: 10, paddingHorizontal: 16, borderRadius: RADII.pill }, shadows.cardLarge]}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
          <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.white }}>{lastError}</Text>
        </View>
      ) : null}
    </View>
  );
}

function TopBtn({ icon, label, onPress, disabled }: { icon: string; label: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityLabel={label}
      style={({ hovered }: any) => ({ width: 34, height: 34, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered && !disabled ? colors.primarySoft : 'transparent', opacity: disabled ? 0.3 : 1, cursor: (disabled ? 'default' : 'pointer') as any })}
    >
      <Ionicons name={icon as any} size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({});
