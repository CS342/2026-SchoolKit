// Dashboard of content pages (web + admin, via (editor)/_layout). Search, filter,
// and sort pages; create new ones; and act on each row (open, publish/unpublish,
// view live, duplicate, copy link, delete).
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Modal, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { shadow } from '../../constants/theme';
import { TYPOGRAPHY, SPACING, RADII } from '../../constants/onboarding-theme';
import {
  listContentPages, saveContentPage, deleteContentPage, setPageStatus, duplicateContentPage,
  PageListItem, PageStatus,
} from '../../features/content/editor/crud';
import { generatePage } from '../../features/content/ai/client';
import { resolveUploadedImages, Attachment } from '../../features/content/uploads';
import { NewPageModal } from '../../components/content-editor/NewPageModal';

type StatusFilter = 'all' | PageStatus;
type SortMode = 'updated' | 'title' | 'status';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'title', label: 'Title A–Z' },
  { value: 'status', label: 'Status' },
];

function sortPages(list: PageListItem[], mode: SortMode): PageListItem[] {
  const byUpdated = (a: PageListItem, b: PageListItem) => b.updated_at.localeCompare(a.updated_at);
  const copy = [...list];
  if (mode === 'title') return copy.sort((a, b) => a.title.localeCompare(b.title));
  if (mode === 'status') return copy.sort((a, b) => (a.status === b.status ? byUpdated(a, b) : a.status === 'draft' ? -1 : 1));
  return copy.sort(byUpdated);
}

export default function ContentPagesDashboard() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const { user } = useAuth();
  const [items, setItems] = useState<PageListItem[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [confirmDel, setConfirmDel] = useState<PageListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);

  // Toolbar state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortMode>('updated');

  // Per-row action state
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listContentPages().then(setItems).catch(() => setItems([]));
  }, []);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  useEffect(() => { refresh(); }, [refresh]);

  const counts = useMemo(() => {
    const all = items ?? [];
    const published = all.filter(p => p.status === 'published').length;
    return { total: all.length, published, drafts: all.length - published };
  }, [items]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (items ?? []).filter(p => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
    return sortPages(filtered, sortBy);
  }, [items, search, statusFilter, sortBy]);

  const handleGenerate = async (prompt: string, attachments: Attachment[]): Promise<string | undefined> => {
    const res = await generatePage(prompt, attachments);
    if ('error' in res) return res.error;
    let doc = res.doc;
    if (user && attachments.length) {
      const resolved = await resolveUploadedImages(doc, attachments, user.id);
      doc = resolved.output;
    }
    const saved = await saveContentPage(null, doc, 'draft');
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

  const handleToggleStatus = async (p: PageListItem) => {
    if (busyId) return;
    setBusyId(p.id); setActionError(null);
    const next: PageStatus = p.status === 'published' ? 'draft' : 'published';
    const res = await setPageStatus(p.id, next);
    setBusyId(null);
    if ('error' in res) { setActionError(res.error); return; }
    refresh();
  };

  const handleDuplicate = async (p: PageListItem) => {
    if (busyId) return;
    setBusyId(p.id); setActionError(null);
    const res = await duplicateContentPage(p.id);
    setBusyId(null);
    if ('error' in res) { setActionError(res.error); return; }
    refresh();
  };

  const handleCopyLink = (p: PageListItem) => {
    const url = (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : '') + `/page/${p.slug}`;
    try { if (typeof navigator !== 'undefined') navigator.clipboard?.writeText(url); } catch {}
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(cur => (cur === p.id ? null : cur)), 1500);
  };

  const handleViewLive = (p: PageListItem) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(`/page/${p.slug}`, '_blank');
    else router.push(`/page/${p.slug}` as any);
  };

  const hasFilter = search.trim().length > 0 || statusFilter !== 'all';

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 48, paddingVertical: 40, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 880 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ ...TYPOGRAPHY.display, fontSize: 34, color: colors.textDark, letterSpacing: -0.8 }}>Content</Text>
              <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted, marginTop: 4 }}>
                {counts.total > 0
                  ? `${counts.total} ${counts.total === 1 ? 'page' : 'pages'} · ${counts.drafts} draft${counts.drafts === 1 ? '' : 's'} · ${counts.published} published`
                  : 'Write and edit the guides that appear in the app.'}
              </Text>
            </View>
            <Pressable
              onPress={() => setShowNew(true)}
              accessibilityRole="button"
              accessibilityLabel="New page"
              style={({ hovered }: any) => ([{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: RADII.button, backgroundColor: colors.primary, cursor: 'pointer' as any, opacity: hovered ? 0.92 : 1 }, shadows.button])}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: '#fff' }}>New page</Text>
            </Pressable>
          </View>

          {/* Toolbar: search + status filter + sort (only once there are pages) */}
          {items && items.length > 0 && (
            <View style={ui.toolbar}>
              <View style={[ui.search, { backgroundColor: colors.white, borderColor: colors.borderCard }]}>
                <Ionicons name="search" size={17} color={colors.textLight} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search pages…"
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[ui.searchInput, { color: colors.textDark }]}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} accessibilityLabel="Clear search">
                    <Ionicons name="close-circle" size={16} color={colors.textLight} />
                  </Pressable>
                )}
              </View>

              <View style={[ui.segment, { backgroundColor: colors.backgroundLighter }]}>
                {(['all', 'draft', 'published'] as StatusFilter[]).map(s => {
                  const active = statusFilter === s;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => setStatusFilter(s)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[ui.segmentBtn, active && { backgroundColor: colors.white, ...shadow({ shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 2 }) }]}
                    >
                      <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: active ? colors.primary : colors.textMuted }}>
                        {s === 'all' ? 'All' : s === 'draft' ? 'Drafts' : 'Published'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={ui.sortGroup}>
                <Ionicons name="swap-vertical" size={15} color={colors.textLight} />
                {SORT_OPTIONS.map(opt => {
                  const active = sortBy === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setSortBy(opt.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[ui.sortChip, active && { backgroundColor: colors.primarySoft }]}
                    >
                      <Text style={{ ...TYPOGRAPHY.caption, color: active ? colors.primary : colors.textMuted }}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {actionError ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
              <Ionicons name="alert-circle" size={15} color={colors.error} />
              <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.error, flex: 1 }}>{actionError}</Text>
            </View>
          ) : null}

          <View style={{ height: 20 }} />

          {items === null ? (
            <View style={{ gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={`sk-${i}`} style={[ui.row, { borderColor: colors.borderCard, backgroundColor: colors.white }, shadows.small]}>
                  <View style={[ui.skChip, { backgroundColor: colors.backgroundLighter }]} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <View style={[ui.skLine, { width: '55%', backgroundColor: colors.backgroundLighter }]} />
                    <View style={[ui.skLine, { width: '35%', height: 10, backgroundColor: colors.backgroundLighter }]} />
                  </View>
                </View>
              ))}
            </View>
          ) : items.length === 0 ? (
            <View style={[ui.emptyCard, { borderColor: colors.borderCard, backgroundColor: colors.white }, shadows.small]}>
              <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: 16 }}>
                <Ionicons name="documents-outline" size={30} color={colors.primary} />
              </View>
              <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark, marginBottom: 6 }}>No pages yet</Text>
              <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted, textAlign: 'center' }}>Create your first content page to get started.</Text>
            </View>
          ) : visible.length === 0 ? (
            <View style={[ui.emptyCard, { borderColor: colors.borderCard, backgroundColor: colors.white }, shadows.small]}>
              <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundLighter, marginBottom: 14 }}>
                <Ionicons name="search-outline" size={26} color={colors.textLight} />
              </View>
              <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark, marginBottom: 6 }}>No pages match</Text>
              <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted, textAlign: 'center', marginBottom: hasFilter ? 18 : 0 }}>Try a different search or filter.</Text>
              {hasFilter && (
                <Pressable onPress={() => { setSearch(''); setStatusFilter('all'); }} style={ui.clearBtn}>
                  <Ionicons name="close-circle" size={15} color={colors.primary} />
                  <Text style={{ ...TYPOGRAPHY.button, fontSize: 14, color: colors.primary }}>Clear filters</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {visible.map((p) => (
                <PageRow
                  key={p.id}
                  page={p}
                  busy={busyId === p.id}
                  copied={copiedId === p.id}
                  onOpen={() => router.push(`/(editor)/content/${p.id}`)}
                  onToggleStatus={() => handleToggleStatus(p)}
                  onViewLive={() => handleViewLive(p)}
                  onDuplicate={() => handleDuplicate(p)}
                  onCopyLink={() => handleCopyLink(p)}
                  onDelete={() => { setDelError(null); setConfirmDel(p); }}
                />
              ))}
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
          <Pressable onPress={() => {}} style={[{ width: 440, maxWidth: '92%', backgroundColor: colors.white, borderRadius: RADII.xl, padding: SPACING.xxl }, st.modalShadow]}>
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

function RowAction({ icon, label, color, onPress, disabled }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void; disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ hovered }: any) => ({
        width: 34, height: 34, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center',
        backgroundColor: hovered && !disabled ? color + '18' : 'transparent',
        opacity: disabled ? 0.4 : 1,
        cursor: (disabled ? 'default' : 'pointer') as any,
      })}
    >
      <Ionicons name={icon} size={17} color={color} />
    </Pressable>
  );
}

function PageRow({ page, busy, copied, onOpen, onToggleStatus, onViewLive, onDuplicate, onCopyLink, onDelete }: {
  page: PageListItem; busy: boolean; copied: boolean;
  onOpen: () => void; onToggleStatus: () => void; onViewLive: () => void;
  onDuplicate: () => void; onCopyLink: () => void; onDelete: () => void;
}) {
  const { colors, shadows } = useTheme();
  const published = page.status === 'published';
  let updated = '';
  try { updated = new Date(page.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch {}

  return (
    <View style={[ui.row, { borderColor: colors.borderCard, backgroundColor: colors.white }, shadows.small]}>
      {/* Draft accent bar — makes unpublished work scannable at a glance. */}
      {!published && <View style={[ui.accent, { backgroundColor: colors.warningText }]} />}

      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${page.title}`}
        style={({ hovered }: any) => ({ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1, minWidth: 0, cursor: 'pointer' as any, opacity: hovered ? 0.72 : 1 })}
      >
        <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
          <Ionicons name="reader-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...TYPOGRAPHY.bodyStrong, color: colors.textDark }} numberOfLines={1}>{page.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            {page.category ? (
              <View style={[ui.catPill, { backgroundColor: colors.backgroundLighter }]}>
                <Text style={{ ...TYPOGRAPHY.caption, fontSize: 11, color: colors.textMuted }} numberOfLines={1}>{page.category}</Text>
              </View>
            ) : null}
            <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight }} numberOfLines={1}>
              /page/{page.slug}{updated ? `  ·  Updated ${updated}` : ''}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={[ui.statusPill, { backgroundColor: published ? colors.successBg : colors.warningBg }]}>
        <Text style={{ ...TYPOGRAPHY.overline, color: published ? colors.successText : colors.warningText }}>{published ? 'Published' : 'Draft'}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        {busy ? (
          <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="small" color={colors.primary} /></View>
        ) : (
          <RowAction
            icon={published ? 'cloud-offline-outline' : 'cloud-upload-outline'}
            label={published ? 'Unpublish' : 'Publish'}
            color={published ? colors.textLight : colors.success}
            onPress={onToggleStatus}
          />
        )}
        {published && <RowAction icon="open-outline" label="View live page" color={colors.textLight} onPress={onViewLive} />}
        <RowAction icon={copied ? 'checkmark' : 'link-outline'} label={copied ? 'Link copied' : 'Copy link'} color={copied ? colors.success : colors.textLight} onPress={onCopyLink} />
        <RowAction icon="copy-outline" label="Duplicate" color={colors.textLight} onPress={onDuplicate} disabled={busy} />
        <RowAction icon="trash-outline" label="Delete page" color={colors.error} onPress={onDelete} disabled={busy} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  modalShadow: shadow({ shadowColor: '#2C2A3A', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.22, shadowRadius: 40, elevation: 16 }),
});

const ui = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 18,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexGrow: 1,
    flexBasis: 240,
    minWidth: 200,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADII.button,
    borderWidth: 1,
  },
  searchInput: { flex: 1, ...TYPOGRAPHY.bodySmall, paddingVertical: 2, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : null) },
  segment: { flexDirection: 'row', borderRadius: RADII.button, padding: 3, gap: 2 },
  segmentBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADII.sm },
  sortGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADII.pill },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 18,
    paddingRight: 10,
    paddingVertical: 14,
    borderRadius: RADII.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  catPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADII.pill },
  statusPill: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: RADII.pill },
  emptyCard: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32, borderRadius: RADII.xl, borderWidth: 1 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  skChip: { width: 44, height: 44, borderRadius: 12 },
  skLine: { height: 14, borderRadius: 7 },
});
