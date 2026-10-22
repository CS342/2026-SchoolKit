// "Add version → From file(s)": convert the author's document for another audience into
// a new draft version of the current topic. Optionally mirrors the current version's
// layout so the versions look alike. Web/admin editor only.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { TYPOGRAPHY, RADII, SPACING } from '../../constants/onboarding-theme';
import { pickFiles, processFile, UPLOAD_ACCEPT, type Attachment } from '../../features/content/uploads';
import { guessAudienceFromFilename } from '../../features/content/versions';
import type { Audience } from '../../features/content/audience';
import type { ContentDoc } from '../../features/content/types';
import { generateTopicVersions } from '../../features/content/editor/generateTopic';
import { AttachmentBar } from './AttachmentBar';
import { AudienceChips } from './AudienceChips';
import { ToggleRow } from './primitives';
import { useFileDrop } from './useFileDrop';

export function AddVersionModal({ visible, onClose, topicId, layoutDoc, layoutLabel, onCreated }: {
  visible: boolean;
  onClose: () => void;
  topicId: string;
  /** The version being edited — the layout the new one can mirror. */
  layoutDoc: ContentDoc;
  layoutLabel: string;
  onCreated: (pageId: string) => void;
}) {
  const { colors, shadows } = useTheme();
  const { user } = useAuth();
  const [audience, setAudience] = useState<Audience | undefined>(undefined);
  const [audienceTouched, setAudienceTouched] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [instructions, setInstructions] = useState('');
  const [matchLayout, setMatchLayout] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = async (files: File[]) => {
    if (!files.length) return;
    setProcessing(true); setError(null);
    // Prefill the audience from the first file's name until the author picks one.
    if (!audienceTouched && !attachments.length) setAudience(guessAudienceFromFilename(files[0].name));
    const added: Attachment[] = [];
    const errs: string[] = [];
    for (const f of files) {
      const res = await processFile(f);
      if ('error' in res) errs.push(res.error);
      else added.push(res);
    }
    if (added.length) setAttachments((prev) => [...prev, ...added]);
    if (errs.length) setError(errs.join(' '));
    setProcessing(false);
  };

  const canGenerate = (attachments.length > 0 || !!instructions.trim()) && !busy && !processing;
  const drop = useFileDrop(addFiles, visible && !busy && !processing);

  const generate = async () => {
    if (!canGenerate) return;
    setBusy(true); setError(null);
    const { results } = await generateTopicVersions({
      prompt: instructions.trim(),
      versions: [{ audience, attachments }],
      topicId,
      matchLayout,
      layoutFrom: layoutDoc,
      userId: user?.id,
    });
    const [res] = results;
    if (!res.ok) { setError(res.error); setBusy(false); return; }
    onCreated(res.pageId); // navigates away; leave busy until unmount
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? undefined : onClose}>
      <Pressable onPress={busy ? undefined : onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
        <Pressable ref={drop.ref as any} onPress={() => {}} style={[{ width: 560, maxWidth: '92%', maxHeight: '90%', backgroundColor: colors.white, borderRadius: RADII.xl }, st.shadow]}>
          {drop.dragging ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, zIndex: 10, borderRadius: RADII.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="cloud-upload-outline" size={30} color={colors.primary} />
              <Text style={{ ...TYPOGRAPHY.bodyStrong, color: colors.primary }}>Drop files to attach</Text>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={{ padding: SPACING.xxl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
                <Ionicons name="layers-outline" size={19} color={colors.primary} />
              </View>
              <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark }}>Add a version from a file</Text>
            </View>
            <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted, marginBottom: 16 }}>
              Attach the document for this audience. AI converts it into a draft version of this topic, keeping your wording.
            </Text>

            <AttachmentBar
              attachments={attachments}
              onAttach={async () => addFiles(await pickFiles(UPLOAD_ACCEPT))}
              onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
              processing={processing}
              disabled={busy}
            />
            <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight, marginTop: 6, marginBottom: 16 }}>
              Attach or drag in PDFs, Word documents, text or images.
            </Text>

            <AudienceChips value={audience} onChange={(a) => { setAudience(a); setAudienceTouched(true); }} />

            <ToggleRow label={`Match the layout of “${layoutLabel}”`} value={matchLayout} onValueChange={setMatchLayout} />

            <TextInput
              value={instructions}
              onChangeText={setInstructions}
              editable={!busy}
              multiline
              placeholder="Optional instructions, e.g. “Keep it short — this is for younger students.”"
              placeholderTextColor={colors.inputPlaceholder}
              style={{ ...TYPOGRAPHY.bodySmall, color: colors.textDark, backgroundColor: colors.inputBackground, borderWidth: 1.5, borderColor: colors.border, borderRadius: RADII.md, padding: 12, minHeight: 64, textAlignVertical: 'top', outlineStyle: 'none' as any }}
            />

            {error ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12 }}>
                <Ionicons name="alert-circle" size={15} color={colors.error} style={{ marginTop: 1 }} />
                <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.error, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 14, marginTop: 20 }}>
              <Pressable onPress={busy ? undefined : onClose} style={{ cursor: 'pointer' as any }}>
                <Text style={{ ...TYPOGRAPHY.bodySmall, fontFamily: 'Raleway_700Bold', color: colors.textMuted }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={generate}
                disabled={!canGenerate}
                style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 20, borderRadius: RADII.button, backgroundColor: canGenerate ? colors.primary : colors.disabledButton, cursor: (canGenerate ? 'pointer' : 'default') as any }, canGenerate ? shadows.button : null]}
              >
                {busy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="sparkles" size={16} color="#fff" />}
                <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: '#fff' }}>{busy ? 'Converting…' : 'Create version'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  shadow: { shadowColor: '#2C2A3A', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.22, shadowRadius: 40, elevation: 16 },
});
