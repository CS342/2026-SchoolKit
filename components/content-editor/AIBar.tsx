// "Ask AI" — the editor's edit-by-instruction bar. The AI returns ops; instead of
// applying them straight away we show a diff of the affected blocks and apply through
// the store only on confirm (so an AI edit stays undoable). If a block is selected, the
// edit is scoped to that block.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { diffJson } from 'diff';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, RADII } from '../../constants/onboarding-theme';
import { useAuth } from '../../contexts/AuthContext';
import { useEditorStore } from '../../features/content/editor/store';
import { applyOps } from '../../features/content/ops';
import { editPage } from '../../features/content/ai/client';
import { pickFiles, processFile, resolveUploadedImages, UPLOAD_ACCEPT, Attachment } from '../../features/content/uploads';
import type { ContentDoc, Op } from '../../features/content/types';
import { AttachmentBar } from './AttachmentBar';
import { useFileDrop } from './useFileDrop';

interface Pending {
  ops: Op[];
  summary: string;
  beforeDoc: ContentDoc;
  afterDoc: ContentDoc;
  attachments: Attachment[];
}

/** Block ids the ops touch, plus any inserted/removed between before/after — used to
 *  keep the diff focused on what actually changed. */
function affectedBlockIds(beforeDoc: ContentDoc, afterDoc: ContentDoc, ops: Op[]): Set<string> {
  const affected = new Set<string>();
  for (const op of ops) {
    if (op.op === 'updateBlock' || op.op === 'removeBlock' || op.op === 'moveBlock') affected.add(op.id);
    else if ('block' in op && typeof (op as any).block === 'string') affected.add((op as any).block);
  }
  const beforeIds = new Set(beforeDoc.blocks.map((b) => b.id));
  const afterIds = new Set(afterDoc.blocks.map((b) => b.id));
  for (const id of afterIds) if (!beforeIds.has(id)) affected.add(id);
  for (const id of beforeIds) if (!afterIds.has(id)) affected.add(id);
  return affected;
}

export function AIBar() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const dispatch = useEditorStore((s) => s.dispatch);
  const select = useEditorStore((s) => s.select);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectedType = useEditorStore((s) => s.doc.blocks.find((b) => b.id === s.selectedId)?.type ?? null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [result, setResult] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const attach = async () => addFiles(await pickFiles(UPLOAD_ACCEPT));

  const addFiles = async (files: File[]) => {
    if (!files.length) return;
    setProcessing(true); setResult(null);
    const added: Attachment[] = [];
    const errors: string[] = [];
    for (const f of files) {
      const res = await processFile(f);
      if ('error' in res) errors.push(res.error);
      else added.push(res);
    }
    if (added.length) setAttachments((prev) => [...prev, ...added]);
    if (errors.length) setResult({ kind: 'error', text: errors.join(' ') });
    setProcessing(false);
  };

  const run = async () => {
    const instruction = text.trim();
    if ((!instruction && !attachments.length) || busy || processing || pending) return;
    setBusy(true); setResult(null);
    const beforeDoc = useEditorStore.getState().doc;
    const focusBlockId = useEditorStore.getState().selectedId ?? undefined;
    const res = await editPage(beforeDoc, instruction, attachments, [], focusBlockId);
    if ('error' in res) {
      setResult({ kind: 'error', text: res.error });
      setBusy(false);
      return;
    }
    // Compute a what-if doc (applyOps is pure — this does NOT mutate the store).
    let afterDoc: ContentDoc;
    try {
      afterDoc = applyOps(beforeDoc, res.ops);
    } catch {
      setResult({ kind: 'error', text: t('editor.ai.applyError') });
      setBusy(false);
      return;
    }
    setPending({ ops: res.ops, summary: res.summary, beforeDoc, afterDoc, attachments });
    setBusy(false);
  };

  const confirm = async () => {
    if (!pending || busy) return;
    setBusy(true);
    // Resolve image uploads here (not before preview) so a cancelled edit never uploads.
    const resolved = user
      ? await resolveUploadedImages(pending.ops, pending.attachments, user.id)
      : { output: pending.ops, errors: [] as string[] };
    dispatch(resolved.output);
    select(null);
    const note = resolved.errors.length ? `  ·  ${resolved.errors.join(' ')}` : '';
    setResult({ kind: resolved.errors.length ? 'error' : 'ok', text: (pending.summary || t('editor.ai.changeApplied')) + note });
    setText('');
    setAttachments([]);
    setPending(null);
    setBusy(false);
  };

  const cancel = () => { if (!busy) setPending(null); }; // keep text + attachments to adjust and retry

  const canSend = (!!text.trim() || attachments.length > 0) && !busy && !processing;
  const drop = useFileDrop(addFiles, !busy && !processing && !pending);

  // ── Diff preview + confirm ──
  if (pending) {
    const affected = affectedBlockIds(pending.beforeDoc, pending.afterDoc, pending.ops);
    const parts = diffJson(
      pending.beforeDoc.blocks.filter((b) => affected.has(b.id)),
      pending.afterDoc.blocks.filter((b) => affected.has(b.id)),
    );
    const changed = parts.some((p) => p.added || p.removed);
    return (
      <View style={{ borderTopWidth: 1, borderTopColor: colors.borderCard, backgroundColor: colors.white, padding: 12, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
          <Ionicons name="sparkles" size={14} color={colors.primary} style={{ marginTop: 2 }} />
          <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textDark, flex: 1 }}>{pending.summary || t('editor.ai.proposedChange')}</Text>
        </View>
        <ScrollView
          style={{ maxHeight: 220, backgroundColor: colors.inputBackground, borderRadius: RADII.md, borderWidth: 1, borderColor: colors.border }}
          contentContainerStyle={{ padding: 10 }}
        >
          <Text style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 16 }}>
            {changed
              ? parts.map((p, i) => (
                  <Text
                    key={i}
                    style={{
                      color: p.added ? colors.success : p.removed ? colors.error : colors.textMuted,
                      textDecorationLine: p.removed ? 'line-through' : 'none',
                    }}
                  >
                    {p.value}
                  </Text>
                ))
              : <Text style={{ color: colors.textMuted }}>{t('editor.ai.noFieldChanges')}</Text>}
          </Text>
        </ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <Pressable onPress={cancel} disabled={busy} style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADII.button, cursor: (busy ? 'default' : 'pointer') as any }}>
            <Text style={{ ...TYPOGRAPHY.button, fontSize: 14, color: colors.textMuted }}>{t('common.cancel')}</Text>
          </Pressable>
          <Pressable
            onPress={confirm}
            disabled={busy}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADII.button, backgroundColor: colors.primaryFill, cursor: (busy ? 'default' : 'pointer') as any }}
          >
            {busy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={15} color="#fff" />}
            <Text style={{ ...TYPOGRAPHY.button, fontSize: 14, color: '#fff' }}>{t('editor.ai.applyChange')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Input ──
  return (
    <View ref={drop.ref as any} style={{ borderTopWidth: 1, borderTopColor: colors.borderCard, backgroundColor: colors.white, padding: 12, gap: 8 }}>
      {drop.dragging ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, zIndex: 10, borderRadius: RADII.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
          <Text style={{ ...TYPOGRAPHY.bodySmall, fontFamily: 'Raleway_700Bold', color: colors.primary }}>Drop files to attach</Text>
        </View>
      ) : null}
      {result ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingHorizontal: 4 }}>
          <Ionicons name={result.kind === 'ok' ? 'checkmark-circle' : 'alert-circle'} size={14} color={result.kind === 'ok' ? colors.success : colors.error} style={{ marginTop: 1 }} />
          <Text style={{ ...TYPOGRAPHY.caption, color: result.kind === 'ok' ? colors.textMuted : colors.error, flex: 1 }}>
            {result.kind === 'ok' ? t('editor.ai.undoHint', { text: result.text }) : result.text}
          </Text>
        </View>
      ) : null}
      {selectedId ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4, paddingLeft: 10, paddingRight: 6, borderRadius: RADII.pill, backgroundColor: colors.primarySoft }}>
          <Ionicons name="locate" size={12} color={colors.primary} />
          <Text style={{ ...TYPOGRAPHY.caption, color: colors.primary }}>{t('editor.ai.editingSelected', { type: selectedType ? ` ${selectedType}` : '' })}</Text>
          <Pressable onPress={() => select(null)} accessibilityLabel={t('editor.ai.editWholePage')} style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' as any }}>
            <Ionicons name="close" size={12} color={colors.primary} />
          </Pressable>
        </View>
      ) : null}
      {attachments.length > 0 ? (
        <AttachmentBar
          attachments={attachments}
          onAttach={attach}
          onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
          processing={processing}
          disabled={busy}
          showAttachButton={false}
        />
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.inputBackground, borderRadius: RADII.pill, borderWidth: 1.5, borderColor: colors.border, paddingLeft: 10, paddingRight: 5, paddingVertical: 4 }}>
        <Pressable
          onPress={busy || processing ? undefined : attach}
          disabled={busy || processing}
          accessibilityLabel={t('editor.attach.filesLabel')}
          style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', cursor: (busy || processing ? 'default' : 'pointer') as any }}
        >
          {processing ? <ActivityIndicator size="small" color={colors.textMuted} /> : <Ionicons name="attach" size={18} color={colors.textMuted} />}
        </Pressable>
        <Ionicons name="sparkles" size={16} color={colors.primary} />
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={run}
          editable={!busy}
          placeholder={selectedId ? t('editor.ai.placeholderBlock') : t('editor.ai.placeholderPage')}
          placeholderTextColor={colors.inputPlaceholder}
          style={{ flex: 1, ...TYPOGRAPHY.bodySmall, color: colors.textDark, paddingVertical: 8, outlineStyle: 'none' as any }}
        />
        <Pressable
          onPress={run}
          disabled={!canSend}
          accessibilityLabel={t('editor.ai.send')}
          style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: canSend ? colors.primaryFill : colors.disabledButton, cursor: (canSend ? 'pointer' : 'default') as any }}
        >
          {busy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="arrow-up" size={18} color="#fff" />}
        </Pressable>
      </View>
    </View>
  );
}
