// Content-page editor route. Loads a content_pages row by id (or 'new' — optionally
// `?topic=<id>` for a new version of an existing topic), wires the editor store and the
// topic's versions, and persists on save. Web + admin only (enforced by (editor)/_layout).
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { TYPOGRAPHY, RADII } from '../../../constants/onboarding-theme';
import { ContentEditor } from '../../../components/content-editor';
import { AddVersionModal } from '../../../components/content-editor/AddVersionModal';
import type { AddVersionKind } from '../../../components/content-editor/VersionBar';
import { useEditorStore, loadDoc, takeGenerationNotices } from '../../../features/content/editor/store';
import { newPageDoc } from '../../../features/content/editor/templates';
import {
  loadContentPage, saveContentPage, duplicateContentPage, getTopic, listTopicVersions, renameTopic, PageStatus,
} from '../../../features/content/editor/crud';
import { audienceLabel } from '../../../features/content/versions';

/** Load a topic and its versions into the editor store (for the version bar + checks). */
async function loadTopicContext(topicId: string | null, currentId: string | null) {
  const setCtx = useEditorStore.getState().setTopicContext;
  if (!topicId) { setCtx({ topic: null, versions: [], currentId }); return; }
  const [topic, versions] = await Promise.all([getTopic(topicId), listTopicVersions(topicId)]);
  setCtx({ topic, versions, currentId });
}

export default function ContentEditorRoute() {
  const { id, topic: topicParam } = useLocalSearchParams<{ id: string; topic?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();
  const [ready, setReady] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [pageId, setPageId] = useState<string | null>(id && id !== 'new' ? id : null);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [initialStatus, setInitialStatus] = useState<PageStatus>('draft');
  const [saving, setSaving] = useState(false);
  const [showAddFromFile, setShowAddFromFile] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setReady(false);
      setShowAddFromFile(false);
      if (!id || id === 'new') {
        loadDoc(newPageDoc());
        const t = topicParam ?? null;
        await loadTopicContext(t, null);
        if (!cancelled) { setPageId(null); setTopicId(t); setInitialStatus('draft'); setReady(true); }
        return;
      }
      const res = await loadContentPage(id);
      if (cancelled) return;
      if (!res) { setNotFound(true); setReady(true); return; }
      // What generation had to leave out isn't in the saved doc; the generate flow
      // stashes those notices for this page — fold them into the checks panel.
      loadDoc(res.doc, [...res.warnings, ...takeGenerationNotices(id)]);
      await loadTopicContext(res.topicId ?? null, id);
      if (cancelled) return;
      setPageId(id);
      setTopicId(res.topicId ?? null);
      setInitialStatus(res.status);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [id, topicParam]);

  const handleSave = async (status: PageStatus): Promise<boolean> => {
    const doc = useEditorStore.getState().doc;
    if (!doc.title.trim()) { flash('error', t('editor.toasts.saveNeedsTitle')); return false; }
    setSaving(true);
    const res = await saveContentPage(pageId, doc, status, topicId ?? undefined);
    if ('error' in res) { setSaving(false); flash('error', res.error); return false; }
    const savedTopic = res.topicId ?? topicId;
    setPageId(res.id);
    setTopicId(savedTopic);
    useEditorStore.getState().markSaved();
    await loadTopicContext(savedTopic, res.id);
    // A one-version topic is just this page: keep the topic's name in step with its title.
    const { topic, versions } = useEditorStore.getState().topicCtx;
    if (topic && versions.length <= 1 && topic.name !== doc.title.trim()) {
      const renamed = await renameTopic(topic.id, doc.title);
      if (!('error' in renamed)) await loadTopicContext(savedTopic, res.id);
    }
    setSaving(false);
    flash('ok', status === 'published' ? t('editor.toasts.published') : t('editor.toasts.savedDraft'));
    return true;
  };

  const handleAddVersion = async (kind: AddVersionKind) => {
    if (!topicId || !pageId) return;
    if (kind === 'blank') { router.push(`/(editor)/content/new?topic=${topicId}`); return; }
    if (kind === 'file') { setShowAddFromFile(true); return; }
    const res = await duplicateContentPage(pageId, { asVersion: true });
    if ('error' in res) { flash('error', res.error); return; }
    router.push(`/(editor)/content/${res.id}`);
  };

  const handleRenameTopic = async (name: string) => {
    if (!topicId) return;
    const res = await renameTopic(topicId, name);
    if ('error' in res) { flash('error', res.error); return; }
    await loadTopicContext(topicId, pageId);
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
        <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark, marginTop: 12 }}>{t('editor.notFound.title')}</Text>
        <Pressable onPress={() => router.push('/(editor)/content-pages')} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.primary }}>{t('editor.notFound.back')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <ContentEditor
        key={id}
        onBack={() => router.push('/(editor)/content-pages')}
        onSave={handleSave}
        saving={saving}
        initialStatus={initialStatus}
        onSwitchVersion={(vid) => router.push(`/(editor)/content/${vid}`)}
        onAddVersion={handleAddVersion}
        onRenameTopic={handleRenameTopic}
      />
      {topicId && showAddFromFile ? (
        <AddVersionModal
          visible
          onClose={() => setShowAddFromFile(false)}
          topicId={topicId}
          layoutDoc={useEditorStore.getState().doc}
          layoutLabel={audienceLabel(useEditorStore.getState().doc.audience)}
          onCreated={(vid) => { setShowAddFromFile(false); router.push(`/(editor)/content/${vid}`); }}
        />
      ) : null}
      {notice ? (
        <View style={[{ position: 'absolute', bottom: 24, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 18, borderRadius: RADII.pill, backgroundColor: notice.kind === 'ok' ? colors.successFill : colors.destructiveFill }, shadows.cardLarge]}>
          <Ionicons name={notice.kind === 'ok' ? 'checkmark-circle' : 'alert-circle'} size={17} color="#fff" />
          <Text style={{ ...TYPOGRAPHY.bodySmall, fontFamily: 'Raleway_700Bold', color: '#fff' }}>{notice.text}</Text>
        </View>
      ) : null}
    </>
  );
}
