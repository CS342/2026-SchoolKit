// Dashboard of content pages (web + admin, via (editor)/_layout). Create a new page
// or open one in the editor.
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADII } from '../../constants/onboarding-theme';
import { listContentPages, saveContentPage, PageListItem } from '../../features/content/editor/crud';
import { generatePage } from '../../features/content/ai/client';
import { NewPageModal } from '../../components/content-editor/NewPageModal';

export default function ContentPagesDashboard() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const [items, setItems] = useState<PageListItem[] | null>(null);
  const [showNew, setShowNew] = useState(false);

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
              {items.map((p) => <PageRow key={p.id} page={p} onOpen={() => router.push(`/(editor)/content/${p.id}`)} />)}
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
    </View>
  );
}

function PageRow({ page, onOpen }: { page: PageListItem; onOpen: () => void }) {
  const { colors, shadows } = useTheme();
  const published = page.status === 'published';
  let updated = '';
  try { updated = new Date(page.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch {}
  return (
    <Pressable
      onPress={onOpen}
      style={({ hovered }: any) => ([{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: RADII.lg, borderWidth: 1, borderColor: hovered ? colors.primary : colors.borderCard, backgroundColor: colors.white, cursor: 'pointer' as any, transform: [{ translateY: hovered ? -1 : 0 }] }, shadows.small])}
    >
      <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
        <Ionicons name="reader-outline" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ ...TYPOGRAPHY.bodyStrong, color: colors.textDark }} numberOfLines={1}>{page.title}</Text>
        <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight }} numberOfLines={1}>
          /page/{page.slug}{page.category ? `  ·  ${page.category}` : ''}{updated ? `  ·  ${updated}` : ''}
        </Text>
      </View>
      <View style={{ paddingVertical: 4, paddingHorizontal: 12, borderRadius: RADII.pill, backgroundColor: published ? colors.successBg : colors.warningBg }}>
        <Text style={{ ...TYPOGRAPHY.overline, color: published ? colors.successText : colors.warningText }}>{published ? 'Published' : 'Draft'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </Pressable>
  );
}
