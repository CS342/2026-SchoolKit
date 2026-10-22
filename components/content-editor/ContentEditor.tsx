// The content-page editor: a live split view. Left = editable block list + page
// settings; right = the real ContentPage rendering live. Topbar carries the title,
// undo/redo, draft/publish, and save; under it, the version bar switches between and
// adds versions of the page's topic. Web-only (the (editor) group is web + admin).
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADII } from '../../constants/onboarding-theme';
import { useEditorStore, undo, redo, useCanUndo, useCanRedo } from '../../features/content/editor/store';
import { BlockCard } from './BlockCard';
import { AddBlockMenu } from './AddBlockMenu';
import { PageSettingsCard } from './PageSettingsCard';
import { PreviewPane } from './PreviewPane';
import { AIBar } from './AIBar';
import { LintPanel } from './LintPanel';
import { VersionBar, type AddVersionKind } from './VersionBar';

type Status = 'draft' | 'published';

export function ContentEditor({ onBack, onSave, saving, initialStatus, onSwitchVersion, onAddVersion, onRenameTopic }: {
  onBack: () => void;
  /** Resolves false when the save failed. */
  onSave: (status: Status) => void | boolean | Promise<void | boolean>;
  saving: boolean;
  initialStatus: Status;
  onSwitchVersion: (pageId: string) => void;
  onAddVersion: (kind: AddVersionKind) => void;
  onRenameTopic: (name: string) => void;
}) {
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();
  const doc = useEditorStore((s) => s.doc);
  const dirty = useEditorStore((s) => s.dirty);
  const lastError = useEditorStore((s) => s.lastError);
  const setMeta = useEditorStore((s) => s.setMeta);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const [status, setStatus] = useState<Status>(initialStatus);
  // An action that leaves this version (switch / add), waiting on the unsaved-changes prompt.
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [savingForLeave, setSavingForLeave] = useState(false);

  const whenSaved = (action: () => void) => {
    if (!dirty) action();
    else setPending(() => action);
  };
  const saveThenLeave = async () => {
    if (!pending) return;
    setSavingForLeave(true);
    const ok = await onSave(status);
    setSavingForLeave(false);
    if (ok === false) return; // the route shows the error; stay here
    const action = pending;
    setPending(null);
    action();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      {/* Topbar */}
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderCard, zIndex: 10 }, shadows.header]}>
        <Pressable onPress={onBack} accessibilityLabel={t('editor.topbar.backToPages')} style={{ padding: 4, cursor: 'pointer' as any }}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </Pressable>

        <TextInput
          value={doc.title}
          onChangeText={(val) => setMeta({ title: val })}
          placeholder={t('editor.topbar.pageTitlePlaceholder')}
          placeholderTextColor={colors.inputPlaceholder}
          style={{ flex: 1, ...TYPOGRAPHY.h3, color: colors.textDark, paddingVertical: 6, outlineStyle: 'none' as any }}
        />

        {dirty ? <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight }}>{t('editor.topbar.unsaved')}</Text> : null}

        <View style={{ flexDirection: 'row', gap: 2 }}>
          <TopBtn icon="arrow-undo" label={t('editor.topbar.undo')} disabled={!canUndo} onPress={undo} />
          <TopBtn icon="arrow-redo" label={t('editor.topbar.redo')} disabled={!canRedo} onPress={redo} />
        </View>

        {/* Draft / Published segmented control */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.appBackgroundAlt, borderRadius: RADII.pill, padding: 3 }}>
          {(['draft', 'published'] as Status[]).map((s) => (
            <Pressable key={s} onPress={() => setStatus(s)} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: RADII.pill, backgroundColor: status === s ? colors.white : 'transparent', cursor: 'pointer' as any, ...(status === s ? shadows.small : {}) }}>
              <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: status === s ? (s === 'published' ? colors.success : colors.textDark) : colors.textLight }}>
                {s === 'draft' ? t('editor.status.draft') : t('editor.status.published')}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => onSave(status)}
          disabled={saving}
          style={({ hovered }: any) => ({ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 9, paddingHorizontal: 18, borderRadius: RADII.button, backgroundColor: dirty || saving ? colors.primaryFill : colors.disabledButton, opacity: hovered && !saving ? 0.92 : 1, cursor: (saving ? 'default' : 'pointer') as any })}
        >
          <Ionicons name={saving ? 'sync' : 'checkmark'} size={16} color="#fff" />
          <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: '#fff' }}>{saving ? t('editor.topbar.saving') : dirty ? t('common.save') : t('editor.topbar.saved')}</Text>
        </Pressable>
      </View>

      <VersionBar
        onSwitch={(id) => whenSaved(() => onSwitchVersion(id))}
        onAdd={(kind) => whenSaved(() => onAddVersion(kind))}
        onRenameTopic={onRenameTopic}
      />

      {/* Split view */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Edit pane */}
        <View style={{ width: 460, borderRightWidth: 1, borderRightColor: colors.borderCard, backgroundColor: colors.appBackground }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <PageSettingsCard />
            <LintPanel />
            <View style={{ height: 4 }} />
            {doc.blocks.map((b, i) => (
              <BlockCard key={b.id} block={b} index={i} count={doc.blocks.length} />
            ))}
            {doc.blocks.length === 0 ? (
              <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textLight, textAlign: 'center', paddingVertical: 20 }}>
                {t('editor.topbar.emptyPage')}
              </Text>
            ) : null}
            <View style={{ height: 4 }} />
            <AddBlockMenu />
          </ScrollView>
          <AIBar />
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

      <Modal visible={!!pending} transparent animationType="fade" onRequestClose={() => !savingForLeave && setPending(null)}>
        <Pressable onPress={() => !savingForLeave && setPending(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
          <Pressable onPress={() => {}} style={[{ width: 440, maxWidth: '92%', backgroundColor: colors.white, borderRadius: RADII.xl, padding: SPACING.xxl }, shadows.cardLarge]}>
            <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark, marginBottom: 6 }}>{t('editor.leavePrompt.title')}</Text>
            <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted }}>
              {t('editor.leavePrompt.body', { status: status === 'published' ? t('editor.leavePrompt.statusPublished') : t('editor.leavePrompt.statusDraft') })}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 22 }}>
              <Pressable onPress={() => !savingForLeave && setPending(null)} style={{ paddingVertical: 10, paddingHorizontal: 14, cursor: 'pointer' as any }}>
                <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: colors.textMuted }}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={() => { if (savingForLeave || !pending) return; const action = pending; setPending(null); action(); }}
                style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: RADII.button, cursor: 'pointer' as any }}
              >
                <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: colors.error }}>{t('editor.leavePrompt.discard')}</Text>
              </Pressable>
              <Pressable onPress={saveThenLeave} disabled={savingForLeave} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 10, paddingHorizontal: 18, borderRadius: RADII.button, backgroundColor: colors.primaryFill, cursor: (savingForLeave ? 'default' : 'pointer') as any }}>
                {savingForLeave ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={16} color="#fff" />}
                <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: '#fff' }}>{savingForLeave ? t('editor.topbar.saving') : t('editor.leavePrompt.saveContinue')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
