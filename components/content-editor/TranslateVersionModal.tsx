// "Add version → Translation from file": attach a translator's file for the version being
// edited and get a Spanish version with the same layout (features/content/editor/
// translateVersion.ts). Web/admin editor only.
import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, RADII, SPACING } from '../../constants/onboarding-theme';
import { pickFiles, processFile, type Attachment, type TextAttachment } from '../../features/content/uploads';
import { createTranslatedVersion } from '../../features/content/editor/translateVersion';
import type { ContentLanguage } from '../../features/content/audience';
import { AttachmentBar } from './AttachmentBar';
import { useFileDrop } from './useFileDrop';

/** Documents a translation can come in (no images — the text is what's matched). */
const TRANSLATION_ACCEPT = '.docx,.pdf,.odt,.txt,.md,.markdown,.html,.htm';

export function TranslateVersionModal({ visible, onClose, sourcePageId, sourceLabel, blockedReason, language = 'es', onCreated }: {
  visible: boolean;
  onClose: () => void;
  /** The saved version to translate. */
  sourcePageId: string;
  /** Its audience label, to say which version is being translated. */
  sourceLabel: string;
  /** Why a translation can't be made right now (unsaved changes, not English). */
  blockedReason?: string;
  language?: ContentLanguage;
  onCreated: (pageId: string) => void;
}) {
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();
  const [files, setFiles] = useState<Attachment[]>([]);
  const [processing, setProcessing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const texts = files.filter((f): f is TextAttachment => f.kind === 'text' && !!f.text.trim());

  const addFiles = async (picked: File[]) => {
    if (!picked.length) return;
    setProcessing(true); setError(null);
    const added: Attachment[] = [];
    const errs: string[] = [];
    for (const f of picked) {
      const res = await processFile(f);
      if ('error' in res) errs.push(res.error);
      else if (res.kind === 'text') added.push(res);
    }
    if (added.length) setFiles((prev) => [...prev, ...added]);
    else if (!errs.length) errs.push(t('editor.translate.needsText'));
    if (errs.length) setError(errs.join(' '));
    setProcessing(false);
  };

  const canCreate = !blockedReason && texts.length > 0 && !busy && !processing;
  const drop = useFileDrop(addFiles, visible && !busy && !processing && !blockedReason);

  const create = async () => {
    if (!canCreate) return;
    setBusy(true); setError(null);
    const res = await createTranslatedVersion({ sourcePageId, files: texts, language });
    if ('error' in res) { setError(res.error); setBusy(false); return; }
    onCreated(res.pageId); // navigates away; leave busy until unmount
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? undefined : onClose}>
      <Pressable onPress={busy ? undefined : onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
        <Pressable ref={drop.ref as any} onPress={() => {}} style={[{ width: 560, maxWidth: '92%', maxHeight: '90%', backgroundColor: colors.white, borderRadius: RADII.xl }, st.shadow]}>
          {drop.dragging ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, zIndex: 10, borderRadius: RADII.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="cloud-upload-outline" size={30} color={colors.primary} />
              <Text style={{ ...TYPOGRAPHY.bodyStrong, color: colors.primary }}>{t('editor.common.dropAttach')}</Text>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={{ padding: SPACING.xxl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
                <Ionicons name="language-outline" size={19} color={colors.primary} />
              </View>
              <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark }}>{t('editor.translate.title')}</Text>
            </View>
            <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted, marginBottom: 16 }}>
              {t('editor.translate.subtitle', { label: sourceLabel })}
            </Text>

            {blockedReason ? (
              <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderRadius: RADII.md, backgroundColor: colors.warningBg, marginBottom: 8 }}>
                <Ionicons name="information-circle" size={17} color={colors.warningText} style={{ marginTop: 1 }} />
                <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textDark, flex: 1 }}>{blockedReason}</Text>
              </View>
            ) : (
              <>
                <AttachmentBar
                  attachments={files}
                  onAttach={async () => addFiles(await pickFiles(TRANSLATION_ACCEPT))}
                  onRemove={(id) => setFiles((prev) => prev.filter((a) => a.id !== id))}
                  processing={processing}
                  disabled={busy}
                />
                <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight, marginTop: 6 }}>
                  {t('editor.translate.attachHint')}
                </Text>
              </>
            )}

            {error ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12 }}>
                <Ionicons name="alert-circle" size={15} color={colors.error} style={{ marginTop: 1 }} />
                <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.error, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 14, marginTop: 20 }}>
              <Pressable onPress={busy ? undefined : onClose} style={{ cursor: 'pointer' as any }}>
                <Text style={{ ...TYPOGRAPHY.bodySmall, fontFamily: 'Raleway_700Bold', color: colors.textMuted }}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={create}
                disabled={!canCreate}
                style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 20, borderRadius: RADII.button, backgroundColor: canCreate ? colors.primaryFill : colors.disabledButton, cursor: (canCreate ? 'pointer' : 'default') as any }, canCreate ? shadows.button : null]}
              >
                {busy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="language" size={16} color={canCreate ? '#fff' : colors.disabledText} />}
                <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: canCreate ? '#fff' : colors.disabledText }}>{busy ? t('editor.translate.working') : t('editor.translate.create')}</Text>
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
