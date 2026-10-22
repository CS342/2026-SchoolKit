// New-page flow: start blank, or describe a page and let AI draft it. Generated pages
// are created as drafts and opened in the editor for review before publishing.
//
// One page is the default. "Add versions for different audiences" turns the draft into
// a topic with several versions — typically one source file per audience (drop several
// files and each becomes a version, its audience guessed from the file name). All
// versions are generated into one topic, optionally sharing the first one's layout.
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { nanoid } from 'nanoid/non-secure';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { TYPOGRAPHY, RADII, SPACING } from '../../constants/onboarding-theme';
import { pickFiles, processFile, UPLOAD_ACCEPT, Attachment } from '../../features/content/uploads';
import { audienceLabel, guessAudienceFromFilename } from '../../features/content/versions';
import type { Audience } from '../../features/content/audience';
import type { ContentDoc } from '../../features/content/types';
import { generateTopicVersions, type VersionProgress } from '../../features/content/editor/generateTopic';
import { AttachmentBar } from './AttachmentBar';
import { AudienceChips } from './AudienceChips';
import { ToggleRow } from './primitives';
import { useFileDrop } from './useFileDrop';

const EXAMPLES = [
  'A guide to coping with hair loss during treatment, for teens',
  'The top SchoolKit guides for a student just starting chemo',
  'How to talk to teachers about missing school for appointments',
];

interface VersionRow {
  key: string;
  audience?: Audience;
  attachments: Attachment[];
  state?: VersionProgress;
  error?: string;
  /** Set once generated, so a retry skips it. */
  pageId?: string;
  doc?: ContentDoc;
}

// Random ids, not a module counter: Fast Refresh re-runs the module (resetting a counter)
// while rows already in state survive, which produced duplicate keys.
const newRow = (patch: Partial<VersionRow> = {}): VersionRow => ({ key: nanoid(8), attachments: [], ...patch });

export function NewPageModal({ visible, onClose, onBlank, onCreated }: {
  visible: boolean;
  onClose: () => void;
  onBlank: () => void;
  /** Called with the first generated page once every version is created. */
  onCreated: (pageId: string) => void;
}) {
  const { colors, shadows } = useTheme();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  // null = a single page; otherwise one row per version of the topic.
  const [rows, setRows] = useState<VersionRow[] | null>(null);
  const [topicName, setTopicName] = useState('');
  const [matchLayout, setMatchLayout] = useState(true);
  const [topicId, setTopicId] = useState<string | undefined>(undefined);

  // The dashboard keeps this modal mounted; start every opening with a fresh form so
  // rows (and created pages) from a previous run don't carry over.
  useEffect(() => {
    if (!visible) return;
    setPrompt(''); setBusy(false); setProcessing(false); setAttachments([]); setError(null);
    setRows(null); setTopicName(''); setMatchLayout(true); setTopicId(undefined);
  }, [visible]);

  const process =async (files: File[]): Promise<{ added: Attachment[]; errs: string[] }> => {
    const added: Attachment[] = [];
    const errs: string[] = [];
    for (const f of files) {
      const res = await processFile(f);
      if ('error' in res) errs.push(res.error);
      else added.push(res);
    }
    return { added, errs };
  };

  /** Single page: attach to the page. Versions: each file becomes its own version. */
  const addFiles = async (files: File[]) => {
    if (!files.length) return;
    setProcessing(true); setError(null);
    if (rows) {
      const made: VersionRow[] = [];
      const errs: string[] = [];
      for (const f of files) {
        const res = await process([f]);
        errs.push(...res.errs);
        if (res.added.length) made.push(newRow({ attachments: res.added, audience: guessAudienceFromFilename(f.name) }));
      }
      // Fill a trailing empty row before adding new ones. (No mutation of `made`: React
      // may run this updater twice.)
      setRows((prev) => {
        const list = [...(prev ?? [])];
        const last = list[list.length - 1];
        if (made.length && last && !last.attachments.length && !last.pageId) {
          list[list.length - 1] = { ...made[0], key: last.key };
          return [...list, ...made.slice(1)];
        }
        return [...list, ...made];
      });
      if (errs.length) setError(errs.join(' '));
    } else {
      const { added, errs } = await process(files);
      if (added.length) setAttachments((prev) => [...prev, ...added]);
      if (errs.length) setError(errs.join(' '));
    }
    setProcessing(false);
  };

  const attachToRow = async (key: string) => {
    const files = await pickFiles(UPLOAD_ACCEPT);
    if (!files.length) return;
    setProcessing(true); setError(null);
    const { added, errs } = await process(files);
    setRows((prev) => prev?.map((r) => (r.key === key
      ? { ...r, attachments: [...r.attachments, ...added], audience: r.attachments.length || r.audience ? r.audience : guessAudienceFromFilename(files[0].name) }
      : r)) ?? null);
    if (errs.length) setError(errs.join(' '));
    setProcessing(false);
  };

  const updateRow = (key: string, patch: Partial<VersionRow>) =>
    setRows((prev) => prev?.map((r) => (r.key === key ? { ...r, ...patch } : r)) ?? null);

  /** Switch to versions: each file attached so far becomes a version (one file → the
   *  first version, plus an empty one to fill). */
  const startVersions = () => {
    const fromFiles = attachments.length > 1
      ? attachments.map((a) => newRow({ attachments: [a], audience: guessAudienceFromFilename(a.name) }))
      : [newRow({ attachments, audience: attachments[0] ? guessAudienceFromFilename(attachments[0].name) : undefined })];
    setRows(fromFiles.length > 1 ? fromFiles : [...fromFiles, newRow()]);
    setAttachments([]);
  };

  const pendingRows = rows?.filter((r) => !r.pageId) ?? [];
  const hasInput = rows
    ? pendingRows.length > 0 && pendingRows.every((r) => r.attachments.length > 0 || !!prompt.trim())
    : !!prompt.trim() || attachments.length > 0;
  const canGenerate = hasInput && !busy && !processing;
  const drop = useFileDrop(addFiles, visible && !busy && !processing);

  const generate = async () => {
    if (!canGenerate) return;
    setBusy(true); setError(null);
    const p = prompt.trim();

    if (!rows) {
      const { results } = await generateTopicVersions({ prompt: p, versions: [{ attachments }], matchLayout: false, userId: user?.id });
      const [res] = results;
      if (res.ok) { onCreated(res.pageId); return; } // navigates; leave busy until unmount
      setError(res.error); setBusy(false);
      return;
    }

    // Versions: generate what hasn't been created yet (all of them, or a retry of the
    // failed ones into the topic the first run made).
    const todo = rows.filter((r) => !r.pageId);
    const reference = rows.find((r) => r.doc)?.doc;
    const { topicId: madeTopic, results } = await generateTopicVersions({
      prompt: p,
      versions: todo.map((r) => ({ audience: r.audience, attachments: r.attachments })),
      topicId,
      topicName: topicId ? undefined : topicName,
      matchLayout,
      layoutFrom: reference,
      userId: user?.id,
      onProgress: (i, state) => updateRow(todo[i].key, { state, ...(state === 'generating' ? { error: undefined } : {}) }),
    });
    if (madeTopic) setTopicId(madeTopic);
    const byKey = new Map(todo.map((r, i) => [r.key, results[i]]));
    const next = rows.map((r) => {
      const res = byKey.get(r.key);
      if (!res) return r;
      return res.ok ? { ...r, state: 'done' as const, pageId: res.pageId, doc: res.doc } : { ...r, state: 'failed' as const, error: res.error };
    });
    setRows(next);
    setBusy(false);
    const first = next.find((r) => r.pageId);
    if (first && next.every((r) => r.pageId)) onCreated(first.pageId!);
  };

  const failedCount = rows?.filter((r) => r.state === 'failed').length ?? 0;
  const firstDone = rows?.find((r) => r.pageId);
  const generateLabel = !rows
    ? 'Generate page'
    : failedCount
      ? `Retry ${failedCount} failed`
      : `Generate ${pendingRows.length} version${pendingRows.length === 1 ? '' : 's'}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? undefined : onClose}>
      <Pressable onPress={busy ? undefined : onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
        <Pressable ref={drop.ref as any} onPress={() => {}} style={[{ width: rows ? 640 : 560, maxWidth: '92%', maxHeight: '90%', backgroundColor: colors.white, borderRadius: RADII.xl }, st.shadow]}>
          {drop.dragging ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, zIndex: 10, borderRadius: RADII.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="cloud-upload-outline" size={30} color={colors.primary} />
              <Text style={{ ...TYPOGRAPHY.bodyStrong, color: colors.primary }}>{rows ? 'Drop files — one version each' : 'Drop files to attach'}</Text>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={{ padding: SPACING.xxl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
                <Ionicons name={rows ? 'layers-outline' : 'sparkles'} size={19} color={colors.primary} />
              </View>
              <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark }}>{rows ? 'Create a topic with versions' : 'Create a page'}</Text>
            </View>
            <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted, marginBottom: 16 }}>
              {rows
                ? 'One version per audience. Attach each audience’s document — AI converts each into a draft, keeping your wording. Readers automatically get the version for their role and grade.'
                : 'Describe the page you want. AI drafts it — you review and edit before publishing.'}
            </Text>

            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              editable={!busy}
              multiline
              placeholder={rows
                ? 'Optional instructions for every version, e.g. “Keep each section short.”'
                : 'e.g. A guide to returning to school after treatment — what feels different, a plan, and who can help.'}
              placeholderTextColor={colors.inputPlaceholder}
              style={{ ...TYPOGRAPHY.body, color: colors.textDark, backgroundColor: colors.inputBackground, borderWidth: 1.5, borderColor: colors.border, borderRadius: RADII.md, padding: 14, minHeight: rows ? 64 : 100, textAlignVertical: 'top', outlineStyle: 'none' as any }}
            />

            {!rows ? (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {EXAMPLES.map((ex) => (
                    <Pressable key={ex} onPress={() => !busy && setPrompt(ex)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: RADII.pill, backgroundColor: colors.appBackgroundAlt, cursor: 'pointer' as any }}>
                      <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted }} numberOfLines={1}>{ex}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={{ marginTop: 14 }}>
                  <AttachmentBar
                    attachments={attachments}
                    onAttach={async () => addFiles(await pickFiles(UPLOAD_ACCEPT))}
                    onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
                    processing={processing}
                    disabled={busy}
                  />
                  <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight, marginTop: 6 }}>
                    Attach or drag in images, PDFs, or text to inform the draft. Images are only saved if placed on the page.
                  </Text>
                </View>

                <Pressable onPress={busy ? undefined : startVersions} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, alignSelf: 'flex-start', cursor: 'pointer' as any }}>
                  <Ionicons name="layers-outline" size={15} color={colors.primary} />
                  <Text style={{ ...TYPOGRAPHY.bodySmall, fontFamily: 'Raleway_700Bold', color: colors.primary }}>Add versions for different audiences</Text>
                </Pressable>
              </>
            ) : (
              <>
                <TextInput
                  value={topicName}
                  onChangeText={setTopicName}
                  editable={!busy && !topicId}
                  placeholder="Topic name (optional — defaults to the first version's title)"
                  placeholderTextColor={colors.inputPlaceholder}
                  style={{ ...TYPOGRAPHY.bodySmall, color: colors.textDark, backgroundColor: colors.inputBackground, borderWidth: 1.5, borderColor: colors.border, borderRadius: RADII.md, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12, outlineStyle: 'none' as any }}
                />

                <View style={{ gap: 10, marginTop: 14 }}>
                  {rows.map((r, i) => (
                    <View key={r.key} style={{ borderWidth: 1, borderColor: r.state === 'failed' ? colors.error : colors.borderCard, borderRadius: RADII.lg, padding: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <RowStatus state={r.state} />
                        <Text style={{ ...TYPOGRAPHY.bodySmall, fontFamily: 'Raleway_700Bold', color: colors.textDark, flex: 1 }} numberOfLines={1}>
                          Version {i + 1} · {audienceLabel(r.audience)}
                        </Text>
                        {!r.pageId && !busy && rows.length > 1 ? (
                          <Pressable onPress={() => setRows((prev) => prev?.filter((x) => x.key !== r.key) ?? null)} accessibilityLabel={`Remove version ${i + 1}`} style={{ padding: 2, cursor: 'pointer' as any }}>
                            <Ionicons name="close" size={16} color={colors.textMuted} />
                          </Pressable>
                        ) : null}
                      </View>
                      {r.pageId ? (
                        <Text style={{ ...TYPOGRAPHY.caption, color: colors.successText }}>Created as a draft.</Text>
                      ) : (
                        <>
                          <AudienceChips value={r.audience} onChange={(audience) => updateRow(r.key, { audience })} compact />
                          <AttachmentBar
                            attachments={r.attachments}
                            onAttach={() => attachToRow(r.key)}
                            onRemove={(id) => updateRow(r.key, { attachments: r.attachments.filter((a) => a.id !== id) })}
                            processing={processing}
                            disabled={busy}
                          />
                          {r.error ? <Text style={{ ...TYPOGRAPHY.caption, color: colors.error, marginTop: 6 }}>{r.error}</Text> : null}
                        </>
                      )}
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <Pressable onPress={busy ? undefined : () => setRows((prev) => [...(prev ?? []), newRow()])} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, cursor: 'pointer' as any }}>
                    <Ionicons name="add" size={16} color={colors.primary} />
                    <Text style={{ ...TYPOGRAPHY.bodySmall, fontFamily: 'Raleway_700Bold', color: colors.primary }}>Add a version</Text>
                  </Pressable>
                  <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight }}>Leave a version's chips empty to make it the one for everyone else.</Text>
                </View>

                <View style={{ marginTop: 14 }}>
                  <ToggleRow label="Keep versions consistent (use the first version's layout)" value={matchLayout} onValueChange={setMatchLayout} />
                </View>
              </>
            )}

            {error ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12 }}>
                <Ionicons name="alert-circle" size={15} color={colors.error} style={{ marginTop: 1 }} />
                <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.error, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, gap: 12 }}>
              {firstDone && !busy ? (
                <Pressable onPress={() => onCreated(firstDone.pageId!)} style={{ cursor: 'pointer' as any }}>
                  <Text style={{ ...TYPOGRAPHY.bodySmall, fontFamily: 'Raleway_700Bold', color: colors.primary }}>Open what was created</Text>
                </Pressable>
              ) : rows ? (
                <Pressable onPress={busy || topicId ? undefined : () => { setAttachments(rows.flatMap((r) => r.attachments)); setRows(null); }} style={{ cursor: (busy || topicId ? 'default' : 'pointer') as any }}>
                  <Text style={{ ...TYPOGRAPHY.bodySmall, fontFamily: 'Raleway_700Bold', color: busy || topicId ? colors.textLight : colors.textMuted }}>Just one page</Text>
                </Pressable>
              ) : (
                <Pressable onPress={busy ? undefined : onBlank} style={{ cursor: 'pointer' as any }}>
                  <Text style={{ ...TYPOGRAPHY.bodySmall, fontFamily: 'Raleway_700Bold', color: colors.textMuted }}>Start from blank</Text>
                </Pressable>
              )}
              <Pressable
                onPress={generate}
                disabled={!canGenerate}
                style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 20, borderRadius: RADII.button, backgroundColor: canGenerate ? colors.primary : colors.disabledButton, cursor: (canGenerate ? 'pointer' : 'default') as any }, canGenerate ? shadows.button : null]}
              >
                {busy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="sparkles" size={16} color="#fff" />}
                <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: '#fff' }}>{busy ? 'Drafting…' : generateLabel}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function RowStatus({ state }: { state?: VersionProgress }) {
  const { colors } = useTheme();
  if (state === 'generating') return <ActivityIndicator size="small" color={colors.primary} />;
  const icon = state === 'done' ? 'checkmark-circle' : state === 'failed' ? 'alert-circle' : state === 'waiting' ? 'time-outline' : 'document-text-outline';
  const color = state === 'done' ? colors.success : state === 'failed' ? colors.error : colors.textMuted;
  return <Ionicons name={icon as any} size={16} color={color} />;
}

const st = StyleSheet.create({
  shadow: { shadowColor: '#2C2A3A', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.22, shadowRadius: 40, elevation: 16 },
});
