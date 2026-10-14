// "Ask AI" — the editor's edit-by-instruction bar. The instruction becomes validated
// ops applied through the store, so an AI edit is undoable like any other change.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, RADII } from '../../constants/onboarding-theme';
import { useAuth } from '../../contexts/AuthContext';
import { useEditorStore } from '../../features/content/editor/store';
import { editPage } from '../../features/content/ai/client';
import { pickFiles, processFile, resolveUploadedImages, UPLOAD_ACCEPT, Attachment } from '../../features/content/uploads';
import { AttachmentBar } from './AttachmentBar';

export function AIBar() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const dispatch = useEditorStore((s) => s.dispatch);
  const select = useEditorStore((s) => s.select);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [result, setResult] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const attach = async () => {
    const files = await pickFiles(UPLOAD_ACCEPT);
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
    if ((!instruction && !attachments.length) || busy || processing) return;
    setBusy(true); setResult(null);
    const res = await editPage(useEditorStore.getState().doc, instruction, attachments);
    if ('error' in res) {
      setResult({ kind: 'error', text: res.error });
    } else {
      const resolved = user
        ? await resolveUploadedImages(res.ops, attachments, user.id)
        : { output: res.ops, errors: [] };
      dispatch(resolved.output);
      select(null);
      const note = resolved.errors.length ? `  ·  ${resolved.errors.join(' ')}` : '';
      setResult({ kind: resolved.errors.length ? 'error' : 'ok', text: (res.summary || 'Change applied.') + note });
      setText('');
      setAttachments([]);
    }
    setBusy(false);
  };

  const canSend = (!!text.trim() || attachments.length > 0) && !busy && !processing;

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.borderCard, backgroundColor: colors.white, padding: 12, gap: 8 }}>
      {result ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingHorizontal: 4 }}>
          <Ionicons name={result.kind === 'ok' ? 'checkmark-circle' : 'alert-circle'} size={14} color={result.kind === 'ok' ? colors.success : colors.error} style={{ marginTop: 1 }} />
          <Text style={{ ...TYPOGRAPHY.caption, color: result.kind === 'ok' ? colors.textMuted : colors.error, flex: 1 }}>
            {result.kind === 'ok' ? `${result.text}  ·  Undo above if it's not right.` : result.text}
          </Text>
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
          accessibilityLabel="Attach files"
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
          placeholder="Ask AI to change this page…"
          placeholderTextColor={colors.inputPlaceholder}
          style={{ flex: 1, ...TYPOGRAPHY.bodySmall, color: colors.textDark, paddingVertical: 8, outlineStyle: 'none' as any }}
        />
        <Pressable
          onPress={run}
          disabled={!canSend}
          accessibilityLabel="Send to AI"
          style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: canSend ? colors.primary : colors.disabledButton, cursor: (canSend ? 'pointer' : 'default') as any }}
        >
          {busy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="arrow-up" size={18} color="#fff" />}
        </Pressable>
      </View>
    </View>
  );
}
