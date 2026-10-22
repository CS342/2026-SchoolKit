// Versions of the topic being edited, under the editor's topbar: the topic name, one tab
// per version (its audience + draft/published), the current version's audience, "Add
// version", and "Who sees what" (which version each kind of reader gets). The page being
// edited is shown with its live, possibly unsaved, audience. Web-only editor.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, RADII } from '../../constants/onboarding-theme';
import { useEditorStore } from '../../features/content/editor/store';
import { audienceLabel, coverage } from '../../features/content/versions';
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
            placeholder="Topic name"
            placeholderTextColor={colors.inputPlaceholder}
            accessibilityLabel="Topic name"
            style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: colors.textDark, width: 200, paddingVertical: 4, outlineStyle: 'none' as any }}
          />
        ) : (
          <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: colors.textMuted, width: 200 }}>New topic</Text>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: 'center' }} style={{ flex: 1 }}>
          {tabs.map((t) => {
            const dot = t.status === 'published' ? colors.success : colors.warningText;
            return (
              <Pressable
                key={t.id ?? 'new'}
                onPress={() => (t.current ? setEditingAudience((e) => !e) : t.id && onSwitch(t.id))}
                accessibilityRole="tab"
                accessibilityState={{ selected: t.current }}
                accessibilityLabel={`${audienceLabel(t.audience)} version, ${t.status}${t.current ? ', editing — change audience' : ''}`}
                style={({ hovered }: any) => ({
                  flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 11, borderRadius: RADII.pill,
                  borderWidth: 1.5, borderColor: t.current ? colors.primary : colors.borderCard,
                  backgroundColor: t.current ? colors.primarySoft : hovered ? colors.appBackgroundAlt : colors.white,
                  cursor: 'pointer' as any,
                })}
              >
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot }} />
                <Text style={{ ...TYPOGRAPHY.caption, fontFamily: t.current ? 'Raleway_700Bold' : undefined, color: t.current ? colors.primary : colors.textDark }}>
                  {audienceLabel(t.audience)}{t.id ? '' : ' (unsaved)'}
                </Text>
                {t.current ? <Ionicons name={editingAudience ? 'chevron-up' : 'create-outline'} size={13} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <View>
          <BarButton icon="add" label="Add version" onPress={() => setMenu(menu === 'add' ? null : 'add')} active={menu === 'add'} />
          {menu === 'add' ? (
            <Dropdown width={270}>
              {canAdd ? (
                <>
                  <MenuItem icon="copy-outline" title="Copy of this version" detail="Same content — then retarget and adapt it." onPress={() => { setMenu(null); onAdd('copy'); }} />
                  <MenuItem icon="document-attach-outline" title="From file(s)…" detail="Convert your document for another audience." onPress={() => { setMenu(null); onAdd('file'); }} />
                  <MenuItem icon="document-outline" title="Blank" detail="Start an empty version of this topic." onPress={() => { setMenu(null); onAdd('blank'); }} />
                </>
              ) : (
                <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted, padding: 10 }}>Save this page first, then add versions of it for other audiences.</Text>
              )}
            </Dropdown>
          ) : null}
        </View>

        <View>
          <BarButton icon="people-outline" label="Who sees what" onPress={() => setMenu(menu === 'coverage' ? null : 'coverage')} active={menu === 'coverage'} />
          {menu === 'coverage' ? (
            <Dropdown width={340}>
              <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight, paddingHorizontal: 10, paddingTop: 6, paddingBottom: 4 }}>
                The version each kind of reader gets (drafts included).
              </Text>
              {rows.map((r) => (
                <View key={r.cell.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, paddingHorizontal: 10 }}>
                  <Text style={{ ...TYPOGRAPHY.caption, color: colors.textDark, flex: 1 }} numberOfLines={1}>{r.cell.label}</Text>
                  {r.tie ? <Ionicons name="warning-outline" size={13} color={colors.warning} accessibilityLabel="Two versions match equally" /> : null}
                  <Text style={{ ...TYPOGRAPHY.caption, fontFamily: r.version ? 'Raleway_700Bold' : undefined, color: r.version ? (r.version.current ? colors.primary : colors.textDark) : colors.textLight }} numberOfLines={1}>
                    {r.version ? audienceLabel(r.version.audience) : 'Hidden'}
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
