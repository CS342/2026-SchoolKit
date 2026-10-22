// Dashboard of content (web + admin, via (editor)/_layout), grouped by topic. A topic
// with one version reads as a single page row; a topic with versions for different
// audiences shows its versions nested under it. Search, filter and sort; create new
// pages or multi-version topics; act on each version (open, publish/unpublish, view
// live, duplicate as a new version, copy link, delete) or a whole topic.
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Modal, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { shadow } from '../../constants/theme';
import { TYPOGRAPHY, SPACING, RADII } from '../../constants/onboarding-theme';
import {
  listTopics, deleteContentPage, deleteTopic, setPageStatus, duplicateContentPage,
  PageListItem, PageStatus, TopicListItem,
} from '../../features/content/editor/crud';
import { audienceLabel } from '../../features/content/versions';
import { NewPageModal } from '../../components/content-editor/NewPageModal';

type StatusFilter = 'all' | PageStatus;
type SortMode = 'updated' | 'title' | 'status';

const SORT_OPTIONS: { value: SortMode; tKey: string }[] = [
  { value: 'updated', tKey: 'editor.contentList.sortUpdated' },
  { value: 'title', tKey: 'editor.contentList.sortTitle' },
  { value: 'status', tKey: 'editor.contentList.sortStatus' },
];

/** What a topic is called in the list: its own name once it has versions, else its page's title. */
const topicTitle = (t: TopicListItem) => (t.versions.length > 1 ? t.name : t.versions[0]?.title ?? t.name);
const lastUpdated = (t: TopicListItem) => t.versions.reduce((m, v) => (v.updated_at > m ? v.updated_at : m), '');

function sortTopics(list: TopicListItem[], mode: SortMode): TopicListItem[] {
  const byUpdated = (a: TopicListItem, b: TopicListItem) => lastUpdated(b).localeCompare(lastUpdated(a));
  const hasDraft = (t: TopicListItem) => t.versions.some((v) => v.status === 'draft');
  const copy = [...list];
  if (mode === 'title') return copy.sort((a, b) => topicTitle(a).localeCompare(topicTitle(b)));
  if (mode === 'status') return copy.sort((a, b) => (hasDraft(a) === hasDraft(b) ? byUpdated(a, b) : hasDraft(a) ? -1 : 1));
  return copy.sort(byUpdated);
}

type DeleteTarget = { kind: 'page'; page: PageListItem } | { kind: 'topic'; topic: TopicListItem };

export default function ContentPagesDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();
  const [topics, setTopics] = useState<TopicListItem[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [confirmDel, setConfirmDel] = useState<DeleteTarget | null>(null);
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
    listTopics().then(setTopics).catch(() => setTopics([]));
  }, []);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  useEffect(() => { refresh(); }, [refresh]);

  const items = useMemo(() => (topics ?? []).flatMap((t) => t.versions), [topics]);
  const counts = useMemo(() => {
    const published = items.filter(p => p.status === 'published').length;
    return { topics: topics?.length ?? 0, total: items.length, published, drafts: items.length - published };
  }, [topics, items]);

  // A topic is listed when its name or any version matches the search; the status
  // filter narrows which of its versions show.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (topics ?? []).flatMap((t) => {
      const versions = t.versions.filter(v => statusFilter === 'all' || v.status === statusFilter);
      if (!versions.length) return [];
      const matchesSearch = !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
        || t.versions.some(v => v.title.toLowerCase().includes(q) || v.slug.toLowerCase().includes(q));
      return matchesSearch ? [{ ...t, versions }] : [];
    });
    return sortTopics(filtered, sortBy);
  }, [topics, search, statusFilter, sortBy]);

  const doDelete = async () => {
    if (!confirmDel || deleting) return;
    setDeleting(true); setDelError(null);
    const res = confirmDel.kind === 'topic' ? await deleteTopic(confirmDel.topic.id) : await deleteContentPage(confirmDel.page.id);
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

  /** Duplicate a version: into the same topic (to retarget it) or as a new topic. */
  const handleDuplicate = async (p: PageListItem, asVersion: boolean) => {
    if (busyId) return;
    setBusyId(p.id); setActionError(null);
    const res = await duplicateContentPage(p.id, { asVersion });
    setBusyId(null);
    if ('error' in res) { setActionError(res.error); return; }
    if (asVersion) router.push(`/(editor)/content/${res.id}`);
    else refresh();
  };

  // Links go to the topic URL (each reader gets their version); `version` pins one.
  const pathFor = (t: TopicListItem, version?: PageListItem) => `/page/${t.slug}${version ? `?v=${version.id}` : ''}`;

  const handleCopyLink = (key: string, path: string) => {
    const url = (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : '') + path;
    try { if (typeof navigator !== 'undefined') navigator.clipboard?.writeText(url); } catch {}
    setCopiedId(key);
    setTimeout(() => setCopiedId(cur => (cur === key ? null : cur)), 1500);
  };

  const handleViewLive = (path: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(path, '_blank');
    else router.push(path as any);
  };

  const hasFilter = search.trim().length > 0 || statusFilter !== 'all';

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 48, paddingVertical: 40, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 880 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ ...TYPOGRAPHY.display, fontSize: 34, color: colors.textDark, letterSpacing: -0.8 }}>{t('editor.contentList.title')}</Text>
              <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted, marginTop: 4 }}>
                {counts.total > 0
                  ? [
                      counts.topics === 1 ? t('editor.contentList.topicOne', { count: counts.topics }) : t('editor.contentList.topicOther', { count: counts.topics }),
                      ...(counts.total > counts.topics ? [t('editor.contentList.versionsCount', { count: counts.total })] : []),
                      counts.drafts === 1 ? t('editor.contentList.draftOne', { count: counts.drafts }) : t('editor.contentList.draftOther', { count: counts.drafts }),
                      t('editor.contentList.publishedCount', { count: counts.published }),
                    ].join(' · ')
                  : t('editor.contentList.summaryEmpty')}
              </Text>
            </View>
            <Pressable
              onPress={() => setShowNew(true)}
              accessibilityRole="button"
              accessibilityLabel={t('editor.contentList.newPage')}
              style={({ hovered }: any) => ([{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: RADII.button, backgroundColor: colors.primary, cursor: 'pointer' as any, opacity: hovered ? 0.92 : 1 }, shadows.button])}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: '#fff' }}>{t('editor.contentList.newPage')}</Text>
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
                  placeholder={t('editor.contentList.searchPlaceholder')}
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[ui.searchInput, { color: colors.textDark }]}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} accessibilityLabel={t('editor.common.clearSearch')}>
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
                        {s === 'all' ? t('editor.contentList.filterAll') : s === 'draft' ? t('editor.contentList.filterDrafts') : t('editor.contentList.filterPublished')}
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
                      <Text style={{ ...TYPOGRAPHY.caption, color: active ? colors.primary : colors.textMuted }}>{t(opt.tKey)}</Text>
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

          {topics === null ? (
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
              <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark, marginBottom: 6 }}>{t('editor.contentList.emptyTitle')}</Text>
              <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted, textAlign: 'center' }}>{t('editor.contentList.emptyBody')}</Text>
            </View>
          ) : visible.length === 0 ? (
            <View style={[ui.emptyCard, { borderColor: colors.borderCard, backgroundColor: colors.white }, shadows.small]}>
              <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundLighter, marginBottom: 14 }}>
                <Ionicons name="search-outline" size={26} color={colors.textLight} />
              </View>
              <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark, marginBottom: 6 }}>{t('editor.contentList.noMatchTitle')}</Text>
              <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted, textAlign: 'center', marginBottom: hasFilter ? 18 : 0 }}>{t('editor.contentList.noMatchBody')}</Text>
              {hasFilter && (
                <Pressable onPress={() => { setSearch(''); setStatusFilter('all'); }} style={ui.clearBtn}>
                  <Ionicons name="close-circle" size={15} color={colors.primary} />
                  <Text style={{ ...TYPOGRAPHY.button, fontSize: 14, color: colors.primary }}>{t('editor.contentList.clearFilters')}</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {visible.map((t) => {
                const multi = t.versions.length > 1 || (topics ?? []).find((x) => x.id === t.id)!.versions.length > 1;
                const rowFor = (p: PageListItem, nested: boolean) => (
                  <PageRow
                    key={p.id}
                    page={p}
                    path={nested ? undefined : pathFor(t)}
                    nested={nested}
                    busy={busyId === p.id}
                    copied={copiedId === p.id}
                    onOpen={() => router.push(`/(editor)/content/${p.id}`)}
                    onToggleStatus={() => handleToggleStatus(p)}
                    onViewLive={() => handleViewLive(pathFor(t, nested ? p : undefined))}
                    onDuplicateAsVersion={() => handleDuplicate(p, true)}
                    onCopyLink={() => handleCopyLink(p.id, pathFor(t, nested ? p : undefined))}
                    onDelete={() => { setDelError(null); setConfirmDel({ kind: 'page', page: p }); }}
                  />
                );
                if (!multi) return rowFor(t.versions[0], false);
                return (
                  <TopicGroup
                    key={t.id}
                    topic={t}
                    copied={copiedId === t.id}
                    onViewLive={() => handleViewLive(pathFor(t))}
                    onCopyLink={() => handleCopyLink(t.id, pathFor(t))}
                    onDuplicateTopic={() => handleDuplicate(t.versions[0], false)}
                    onDelete={() => { setDelError(null); setConfirmDel({ kind: 'topic', topic: (topics ?? []).find((x) => x.id === t.id) ?? t }); }}
                  >
                    {t.versions.map((v) => rowFor(v, true))}
                  </TopicGroup>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <NewPageModal
        visible={showNew}
        onClose={() => setShowNew(false)}
        onBlank={() => { setShowNew(false); router.push('/(editor)/content/new'); }}
        onCreated={(id) => { setShowNew(false); router.push(`/(editor)/content/${id}`); }}
      />

      <Modal visible={!!confirmDel} transparent animationType="fade" onRequestClose={() => !deleting && setConfirmDel(null)}>
        <Pressable onPress={() => !deleting && setConfirmDel(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
          <Pressable onPress={() => {}} style={[{ width: 440, maxWidth: '92%', backgroundColor: colors.white, borderRadius: RADII.xl, padding: SPACING.xxl }, st.modalShadow]}>
            <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error + '18', marginBottom: 14 }}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </View>
            {confirmDel?.kind === 'topic' ? (
              <>
                <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark, marginBottom: 6 }}>{t('editor.contentList.deleteTopicTitle')}</Text>
                <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted }}>
                  {t('editor.contentList.deleteTopicBody', {
                    name: confirmDel.topic.name,
                    count: confirmDel.topic.versions.length,
                    suffix: confirmDel.topic.versions.some((v) => v.status === 'published') ? t('editor.contentList.deleteLibrarySuffix') : '',
                  })}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark, marginBottom: 6 }}>{t('editor.contentList.deletePageTitle')}</Text>
                <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted }}>
                  {t('editor.contentList.deletePageBody', {
                    title: confirmDel?.page.title,
                    suffix: confirmDel?.page.status === 'published' ? t('editor.contentList.deleteLibrarySuffix') : '',
                  })}
                </Text>
              </>
            )}
            {delError ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12 }}>
                <Ionicons name="alert-circle" size={15} color={colors.error} style={{ marginTop: 1 }} />
                <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.error, flex: 1 }}>{delError}</Text>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <Pressable onPress={() => !deleting && setConfirmDel(null)} style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: RADII.button, cursor: 'pointer' as any }}>
                <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: colors.textMuted }}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable onPress={doDelete} disabled={deleting} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 10, paddingHorizontal: 18, borderRadius: RADII.button, backgroundColor: colors.error, cursor: (deleting ? 'default' : 'pointer') as any }}>
                {deleting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="trash" size={15} color="#fff" />}
                <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: '#fff' }}>{deleting ? t('editor.contentList.deleting') : t('common.delete')}</Text>
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

/** A topic with versions for different audiences: its name, topic-wide actions, and its
 *  versions (PageRows) nested underneath. */
function TopicGroup({ topic, copied, onViewLive, onCopyLink, onDuplicateTopic, onDelete, children }: {
  topic: TopicListItem; copied: boolean;
  onViewLive: () => void; onCopyLink: () => void; onDuplicateTopic: () => void; onDelete: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();
  const anyPublished = topic.versions.some((v) => v.status === 'published');
  return (
    <View style={[{ borderRadius: RADII.lg, borderWidth: 1, borderColor: colors.borderCard, backgroundColor: colors.white, overflow: 'hidden' }, shadows.small]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 18, paddingRight: 10, paddingVertical: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
          <Ionicons name="layers-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...TYPOGRAPHY.bodyStrong, color: colors.textDark }} numberOfLines={1}>{topic.name}</Text>
          <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight, marginTop: 3 }} numberOfLines={1}>
            {t('editor.contentList.topicMeta', { count: topic.versions.length, slug: topic.slug })}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          {anyPublished && <RowAction icon="open-outline" label={t('editor.contentList.viewLiveAsYou')} color={colors.textLight} onPress={onViewLive} />}
          <RowAction icon={copied ? 'checkmark' : 'link-outline'} label={copied ? t('editor.contentList.linkCopied') : t('editor.contentList.copyTopicLink')} color={copied ? colors.success : colors.textLight} onPress={onCopyLink} />
          <RowAction icon="copy-outline" label={t('editor.contentList.duplicateTopic')} color={colors.textLight} onPress={onDuplicateTopic} />
          <RowAction icon="trash-outline" label={t('editor.contentList.deleteTopicAll')} color={colors.error} onPress={onDelete} />
        </View>
      </View>
      <View style={{ gap: 8, paddingHorizontal: 12, paddingBottom: 12 }}>{children}</View>
    </View>
  );
}

function PageRow({ page, path, nested, busy, copied, onOpen, onToggleStatus, onViewLive, onDuplicateAsVersion, onCopyLink, onDelete }: {
  /** The reader URL to show (omitted for nested versions — the topic shows it). */
  page: PageListItem; path?: string; nested: boolean; busy: boolean; copied: boolean;
  onOpen: () => void; onToggleStatus: () => void; onViewLive: () => void;
  onDuplicateAsVersion: () => void; onCopyLink: () => void; onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();
  const published = page.status === 'published';
  let updated = '';
  try { updated = new Date(page.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch {}
  // Versions always show who they're for; a lone page only when it's targeted.
  const showAudience = nested || !!page.audience;

  return (
    <View style={[ui.row, { borderColor: colors.borderCard, backgroundColor: nested ? colors.appBackground : colors.white }, nested ? null : shadows.small]}>
      {/* Draft accent bar — makes unpublished work scannable at a glance. */}
      {!published && <View style={[ui.accent, { backgroundColor: colors.warningText }]} />}

      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={t('editor.contentList.editPage', { title: page.title })}
        style={({ hovered }: any) => ({ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1, minWidth: 0, cursor: 'pointer' as any, opacity: hovered ? 0.72 : 1 })}
      >
        <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
          <Ionicons name="reader-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...TYPOGRAPHY.bodyStrong, color: colors.textDark }} numberOfLines={1}>{page.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            {showAudience ? (
              <View style={[ui.catPill, { backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <Ionicons name="people-outline" size={11} color={colors.primary} />
                <Text style={{ ...TYPOGRAPHY.caption, fontSize: 11, fontFamily: 'Raleway_700Bold', color: colors.primary }} numberOfLines={1}>{audienceLabel(page.audience)}</Text>
              </View>
            ) : null}
            {page.category ? (
              <View style={[ui.catPill, { backgroundColor: colors.backgroundLighter }]}>
                <Text style={{ ...TYPOGRAPHY.caption, fontSize: 11, color: colors.textMuted }} numberOfLines={1}>{page.category}</Text>
              </View>
            ) : null}
            <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight }} numberOfLines={1}>
              {[path, updated ? t('editor.contentList.updatedOn', { date: updated }) : ''].filter(Boolean).join('  ·  ')}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={[ui.statusPill, { backgroundColor: published ? colors.successBg : colors.warningBg }]}>
        <Text style={{ ...TYPOGRAPHY.overline, color: published ? colors.successText : colors.warningText }}>{published ? t('editor.status.published') : t('editor.status.draft')}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        {busy ? (
          <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="small" color={colors.primary} /></View>
        ) : (
          <RowAction
            icon={published ? 'cloud-offline-outline' : 'cloud-upload-outline'}
            label={published ? t('editor.contentList.unpublish') : t('editor.contentList.publish')}
            color={published ? colors.textLight : colors.success}
            onPress={onToggleStatus}
          />
        )}
        {published && <RowAction icon="open-outline" label={t('editor.contentList.viewLivePage')} color={colors.textLight} onPress={onViewLive} />}
        <RowAction icon={copied ? 'checkmark' : 'link-outline'} label={copied ? t('editor.contentList.linkCopied') : t('editor.contentList.copyLink')} color={copied ? colors.success : colors.textLight} onPress={onCopyLink} />
        <RowAction icon="git-branch-outline" label={t('editor.contentList.duplicateVersion')} color={colors.textLight} onPress={onDuplicateAsVersion} disabled={busy} />
        <RowAction icon="trash-outline" label={t('editor.contentList.deletePage')} color={colors.error} onPress={onDelete} disabled={busy} />
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
