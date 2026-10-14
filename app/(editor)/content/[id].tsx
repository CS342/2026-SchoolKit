// Content-page editor route. Loads a content_pages row by id (or 'new'), wires the
// editor store, and persists on save. Web + admin only (enforced by (editor)/_layout).
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { TYPOGRAPHY, RADII } from '../../../constants/onboarding-theme';
import { ContentEditor } from '../../../components/content-editor';
import { useEditorStore, loadDoc } from '../../../features/content/editor/store';
import { newPageDoc } from '../../../features/content/editor/templates';
import { loadContentPage, saveContentPage, PageStatus } from '../../../features/content/editor/crud';

export default function ContentEditorRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const [ready, setReady] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [pageId, setPageId] = useState<string | null>(id && id !== 'new' ? id : null);
  const [initialStatus, setInitialStatus] = useState<PageStatus>('draft');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setReady(false);
      if (!id || id === 'new') {
        loadDoc(newPageDoc());
        if (!cancelled) { setInitialStatus('draft'); setReady(true); }
        return;
      }
      const res = await loadContentPage(id);
      if (cancelled) return;
      if (!res) { setNotFound(true); setReady(true); return; }
      loadDoc(res.doc);
      setPageId(id);
      setInitialStatus(res.status);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleSave = async (status: PageStatus) => {
    const doc = useEditorStore.getState().doc;
    if (!doc.title.trim()) { flash('error', 'Give the page a title before saving.'); return; }
    setSaving(true);
    const res = await saveContentPage(pageId, doc, status);
    setSaving(false);
    if ('error' in res) { flash('error', res.error); return; }
    setPageId(res.id);
    useEditorStore.getState().markSaved();
    flash('ok', status === 'published' ? 'Published.' : 'Saved as draft.');
  };

  const flash = (kind: 'ok' | 'error', text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 3200);
  };

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.appBackground }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.appBackground, padding: 24 }}>
        <Ionicons name="document-outline" size={48} color={colors.textLight} />
        <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark, marginTop: 12 }}>This page doesn't exist</Text>
        <Pressable onPress={() => router.push('/(editor)/content-pages')} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.primary }}>Back to pages</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <ContentEditor onBack={() => router.push('/(editor)/content-pages')} onSave={handleSave} saving={saving} initialStatus={initialStatus} />
      {notice ? (
        <View style={[{ position: 'absolute', bottom: 24, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 18, borderRadius: RADII.pill, backgroundColor: notice.kind === 'ok' ? colors.success : colors.error }, shadows.cardLarge]}>
          <Ionicons name={notice.kind === 'ok' ? 'checkmark-circle' : 'alert-circle'} size={17} color="#fff" />
          <Text style={{ ...TYPOGRAPHY.bodySmall, fontFamily: 'Raleway_700Bold', color: '#fff' }}>{notice.text}</Text>
        </View>
      ) : null}
    </>
  );
}
