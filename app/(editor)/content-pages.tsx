// Dashboard of content pages (web + admin, via (editor)/_layout). Create a new page
// or open one in the editor.
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADII } from '../../constants/onboarding-theme';
import { listContentPages, saveContentPage, deleteContentPage, PageListItem } from '../../features/content/editor/crud';
import { generatePage } from '../../features/content/ai/client';
import { NewPageModal } from '../../components/content-editor/NewPageModal';

export default function ContentPagesDashboard() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const [items, setItems] = useState<PageListItem[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [confirmDel, setConfirmDel] = useState<PageListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listContentPages().then(setItems).catch(() => setItems([]));
  }, []);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  useEffect(() => { refresh(); }, [refresh]);

  const handleGenerate = async (prompt: string): Promise<string | undefined> => {
    const res = await generatePage(prompt);
    if ('error' in res) return res.error;
    const saved = await saveContentPage(null, res.doc, 'draft');
    if ('error' in saved) return saved.error;
    setShowNew(false);
    router.push(`/(editor)/content/${saved.id}`);
    return undefined;
  };

  const doDelete = async () => {
    if (!confirmDel || deleting) return;
    setDeleting(true); setDelError(null);
    const res = await deleteContentPage(confirmDel.id);
    setDeleting(false);
    if ('error' in res) { setDelError(res.error); return; }
    setConfirmDel(null);
    refresh();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 48, paddingVertical: 40, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 880 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6 }}>
            <View>
              <Pressable onPress={() => router.push('/(editor)/designs')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10, cursor: 'pointer' as any }}>
                <Ionicons name="chevron-back" size={15} color={colors.textLight} />
                <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight }}>Editor</Text>
              </Pressable>
              <Text style={{ ...TYPOGRAPHY.display, fontSize: 34, color: colors.textDark, letterSpacing: -0.8 }}>Content pages</Text>
              <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted, marginTop: 4 }}>Write and edit the guides that appear in the app.</Text>
            </View>
            <Pressable
              onPress={() => setShowNew(true)}
              style={({ hovered }: any) => ([{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: RADII.button, backgroundColor: colors.primary, cursor: 'pointer' as any, opacity: hovered ? 0.92 : 1 }, shadows.button])}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: '#fff' }}>New page</Text>
            </Pressable>
          </View>

          <View style={{ height: 24 }} />

          {items === null ? (
            <View style={{ paddingVertical: 80, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : items.length === 0 ? (
            <View style={[{ alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32, borderRadius: RADII.xl, borderWidth: 1, borderColor: colors.borderCard, backgroundColor: colors.white }, shadows.small]}>
              <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: 16 }}>
                <Ionicons name="documents-outline" size={30} color={colors.primary} />
              </View>
              <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark, marginBottom: 6 }}>No pages yet</Text>
              <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted, textAlign: 'center' }}>Create your first content page to get started.</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {items.map((p) => <PageRow key={p.id} page={p} onOpen={() => router.push(`/(editor)/content/${p.id}`)} onDelete={() => { setDelError(null); setConfirmDel(p); }} />)}
            </View>
          )}
        </View>
      </ScrollView>

      <NewPageModal
        visible={showNew}
        onClose={() => setShowNew(false)}
        onBlank={() => { setShowNew(false); router.push('/(editor)/content/new'); }}
        onGenerate={handleGenerate}
      />

      <Modal visible={!!confirmDel} transparent animationType="fade" onRequestClose={() => !deleting && setConfirmDel(null)}>
        <Pressable onPress={() => !deleting && setConfirmDel(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
          <Pressable onPress={() => {}} style={[{ width: 440, maxWidth: '92%', backgroundColor: colors.white, borderRadius: RADII.xl, padding: SPACING.xxl }, st.shadow]}>
            <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error + '18', marginBottom: 14 }}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </View>
            <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark, marginBottom: 6 }}>Delete this page?</Text>
            <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted }}>
              “{confirmDel?.title}” will be permanently removed{confirmDel?.status === 'published' ? ' and will disappear from the library' : ''}. This can’t be undone.
            </Text>
            {delError ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12 }}>
                <Ionicons name="alert-circle" size={15} color={colors.error} style={{ marginTop: 1 }} />
                <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.error, flex: 1 }}>{delError}</Text>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <Pressable onPress={() => !deleting && setConfirmDel(null)} style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: RADII.button, cursor: 'pointer' as any }}>
                <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: colors.textMuted }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={doDelete} disabled={deleting} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 10, paddingHorizontal: 18, borderRadius: RADII.button, backgroundColor: colors.error, cursor: (deleting ? 'default' : 'pointer') as any }}>
                {deleting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="trash" size={15} color="#fff" />}
                <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: '#fff' }}>{deleting ? 'Deleting…' : 'Delete'}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  shadow: { shadowColor: '#2C2A3A', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.22, shadowRadius: 40, elevation: 16 },
});

function PageRow({ page, onOpen, onDelete }: { page: PageListItem; onOpen: () => void; onDelete: () => void }) {
  const { colors, shadows } = useTheme();
  const published = page.status === 'published';
  let updated = '';
  try { updated = new Date(page.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch {}
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 18, paddingRight: 12, paddingVertical: 14, borderRadius: RADII.lg, borderWidth: 1, borderColor: colors.borderCard, backgroundColor: colors.white }, shadows.small]}>
      <Pressable onPress={onOpen} style={({ hovered }: any) => ({ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1, minWidth: 0, cursor: 'pointer' as any, opacity: hovered ? 0.65 : 1 })}>
        <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
          <Ionicons name="reader-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...TYPOGRAPHY.bodyStrong, color: colors.textDark }} numberOfLines={1}>{page.title}</Text>
          <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight }} numberOfLines={1}>
            /page/{page.slug}{page.category ? `  ·  ${page.category}` : ''}{updated ? `  ·  ${updated}` : ''}
          </Text>
        </View>
      </Pressable>
      <View style={{ paddingVertical: 4, paddingHorizontal: 12, borderRadius: RADII.pill, backgroundColor: published ? colors.successBg : colors.warningBg }}>
        <Text style={{ ...TYPOGRAPHY.overline, color: published ? colors.successText : colors.warningText }}>{published ? 'Published' : 'Draft'}</Text>
      </View>
      <Pressable onPress={onDelete} accessibilityLabel="Delete page" style={({ hovered }: any) => ({ width: 34, height: 34, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? colors.error + '18' : 'transparent', cursor: 'pointer' as any })}>
        <Ionicons name="trash-outline" size={17} color={colors.textLight} />
      </Pressable>
    </View>
  );
}
