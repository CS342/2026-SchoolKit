// Versions of the topic being edited, under the editor's topbar: the topic name, one tab
// per version (its audience + draft/published), the current version's audience, "Add
// version", and "Who sees what" (which version each kind of reader gets). The page being
// edited is shown with its live, possibly unsaved, audience. Web-only editor.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, RADII } from '../../constants/onboarding-theme';
import { useEditorStore } from '../../features/content/editor/store';
import { audienceLabel, coverage, viewerCellLabel } from '../../features/content/versions';
import type { Audience } from '../../features/content/audience';
import type { PageStatus } from '../../features/content/editor/crud';
import { AudienceChips } from './AudienceChips';

export type AddVersionKind = 'copy' | 'file' | 'blank';

type Tab = { id: string | null; audience?: Audience; status: PageStatus; current: boolean };

export function VersionBar({ onSwitch, onAdd, onRenameTopic }: {
  onSwitch: (pageId: string) => void;
  onAdd: (kind: AddVersionKind) => void;
  onRenameTopic: (name: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const doc = useEditorStore((s) => s.doc);
  const setMeta = useEditorStore((s) => s.setMeta);
  const { topic, versions, currentId } = useEditorStore((s) => s.topicCtx);
  const [menu, setMenu] = useState<'add' | 'coverage' | null>(null);
  const [editingAudience, setEditingAudience] = useState(false);
  const [name, setName] = useState(topic?.name ?? '');
  useEffect(() => { setName(topic?.name ?? ''); }, [topic?.id, topic?.name]);

  const tabs = useMemo<Tab[]>(() => {
    const saved: Tab[] = versions.map((v) => (v.id === currentId
      ? { id: v.id, audience: doc.audience, status: v.status, current: true }
      : { id: v.id, audience: v.audience, status: v.status, current: false }));
    // A new, unsaved version of an existing topic.
    if (!currentId) saved.push({ id: null, audience: doc.audience, status: 'draft', current: true });
    return saved;
  }, [versions, currentId, doc.audience]);

  const rows = useMemo(() => coverage(tabs), [tabs]);
  // Adding a version needs a saved topic to add it to.
  const canAdd = !!topic && !!currentId;

  const commitName = () => {
    const n = name.trim();
    if (topic && n && n !== topic.name) onRenameTopic(n);
    else setName(topic?.name ?? '');
  };

  return (
    <View style={{ zIndex: 9, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderCard }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 8 }}>
        <Ionicons name="layers-outline" size={17} color={colors.textMuted} />
        {topic ? (
          <TextInput
            value={name}
            onChangeText={setName}
            onBlur={commitName}
            onSubmitEditing={commitName}
            placeholder={t('editor.versionBar.topicName')}
            placeholderTextColor={colors.inputPlaceholder}
            accessibilityLabel={t('editor.versionBar.topicName')}
            style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: colors.textDark, width: 200, paddingVertical: 4, outlineStyle: 'none' as any }}
          />
        ) : (
          <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: colors.textMuted, width: 200 }}>{t('editor.versionBar.newTopic')}</Text>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: 'center' }} style={{ flex: 1 }}>
          {tabs.map((tab) => {
            const dot = tab.status === 'published' ? colors.success : colors.warningText;
            return (
              <Pressable
                key={tab.id ?? 'new'}
                onPress={() => (tab.current ? setEditingAudience((e) => !e) : tab.id && onSwitch(tab.id))}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab.current }}
                accessibilityLabel={t('editor.versionBar.tabLabel', {
                  audience: audienceLabel(tab.audience),
                  status: t(`editor.status.${tab.status}`),
                  editing: tab.current ? t('editor.versionBar.editingSuffix') : '',
                })}
                style={({ hovered }: any) => ({
                  flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 11, borderRadius: RADII.pill,
                  borderWidth: 1.5, borderColor: tab.current ? colors.primary : colors.borderCard,
                  backgroundColor: tab.current ? colors.primarySoft : hovered ? colors.appBackgroundAlt : colors.white,
                  cursor: 'pointer' as any,
                })}
              >
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot }} />
                <Text style={{ ...TYPOGRAPHY.caption, fontFamily: tab.current ? 'Raleway_700Bold' : undefined, color: tab.current ? colors.primary : colors.textDark }}>
                  {audienceLabel(tab.audience)}{tab.id ? '' : t('editor.versionBar.unsavedSuffix')}
                </Text>
                {tab.current ? <Ionicons name={editingAudience ? 'chevron-up' : 'create-outline'} size={13} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <View>
          <BarButton icon="add" label={t('editor.versionBar.addVersion')} onPress={() => setMenu(menu === 'add' ? null : 'add')} active={menu === 'add'} />
          {menu === 'add' ? (
            <Dropdown width={270}>
              {canAdd ? (
                <>
                  <MenuItem icon="copy-outline" title={t('editor.versionBar.addCopyTitle')} detail={t('editor.versionBar.addCopyDetail')} onPress={() => { setMenu(null); onAdd('copy'); }} />
                  <MenuItem icon="document-attach-outline" title={t('editor.versionBar.addFileTitle')} detail={t('editor.versionBar.addFileDetail')} onPress={() => { setMenu(null); onAdd('file'); }} />
                  <MenuItem icon="document-outline" title={t('editor.versionBar.addBlankTitle')} detail={t('editor.versionBar.addBlankDetail')} onPress={() => { setMenu(null); onAdd('blank'); }} />
                </>
              ) : (
                <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted, padding: 10 }}>{t('editor.versionBar.addNeedsSave')}</Text>
              )}
            </Dropdown>
          ) : null}
        </View>

        <View>
          <BarButton icon="people-outline" label={t('editor.versionBar.whoSeesWhat')} onPress={() => setMenu(menu === 'coverage' ? null : 'coverage')} active={menu === 'coverage'} />
          {menu === 'coverage' ? (
            <Dropdown width={340}>
              <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight, paddingHorizontal: 10, paddingTop: 6, paddingBottom: 4 }}>
                {t('editor.versionBar.coverageIntro')}
              </Text>
              {rows.map((r) => (
                <View key={r.cell.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, paddingHorizontal: 10 }}>
                  <Text style={{ ...TYPOGRAPHY.caption, color: colors.textDark, flex: 1 }} numberOfLines={1}>{viewerCellLabel(r.cell)}</Text>
                  {r.tie ? <Ionicons name="warning-outline" size={13} color={colors.warning} accessibilityLabel={t('editor.versionBar.coverageTie')} /> : null}
                  <Text style={{ ...TYPOGRAPHY.caption, fontFamily: r.version ? 'Raleway_700Bold' : undefined, color: r.version ? (r.version.current ? colors.primary : colors.textDark) : colors.textLight }} numberOfLines={1}>
                    {r.version ? audienceLabel(r.version.audience) : t('editor.versionBar.coverageHidden')}
                  </Text>
                </View>
              ))}
            </Dropdown>
          ) : null}
        </View>
      </View>

      {editingAudience ? (
        <View style={[{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 6, borderTopWidth: 1, borderTopColor: colors.appBackgroundAlt }]}>
          <AudienceChips value={doc.audience} onChange={(audience) => setMeta({ audience })} />
        </View>
      ) : null}
    </View>
  );
}

function BarButton({ icon, label, onPress, active }: { icon: string; label: string; onPress: () => void; active: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ hovered }: any) => ({ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: RADII.sm, backgroundColor: active || hovered ? colors.primarySoft : 'transparent', cursor: 'pointer' as any })}
    >
      <Ionicons name={icon as any} size={15} color={colors.primary} />
      <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: colors.primary }}>{label}</Text>
    </Pressable>
  );
}

function Dropdown({ children, width }: { children: React.ReactNode; width: number }) {
  const { colors, shadows } = useTheme();
  return (
    <View style={[{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width, padding: 4, borderRadius: RADII.md, borderWidth: 1, borderColor: colors.borderCard, backgroundColor: colors.white, zIndex: 20 }, shadows.cardLarge]}>
      {children}
    </View>
  );
}

function MenuItem({ icon, title, detail, onPress }: { icon: string; title: string; detail: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }: any) => ({ flexDirection: 'row', gap: 10, padding: 10, borderRadius: RADII.sm, backgroundColor: hovered ? colors.appBackgroundAlt : 'transparent', cursor: 'pointer' as any })}
    >
      <Ionicons name={icon as any} size={17} color={colors.primary} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ ...TYPOGRAPHY.bodySmall, fontFamily: 'Raleway_700Bold', color: colors.textDark }}>{title}</Text>
        <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted }}>{detail}</Text>
      </View>
    </Pressable>
  );
}
