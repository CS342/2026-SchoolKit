// Supabase CRUD for content pages and the topics that group them. Reads use the
// published-or-own RLS; writes are moderator-gated (admins qualify). The editor route
// and dashboard call these.
//
// Every page is a version of a topic (content_topics). A universal page is a topic with
// one version; creating a page without a topic creates its topic.
import { supabase } from '../../../lib/supabase';
import { nanoid } from 'nanoid/non-secure';
import type { ContentDoc } from '../types';
import { parseContentDoc } from '../validate';
import { parseAudience, type Audience } from '../audience';
import { collectContentImagePaths, deleteContentImages } from '../uploads';

export type PageStatus = 'draft' | 'published';

export interface PageListItem {
  id: string;
  topic_id: string;
  slug: string;
  title: string;
  status: PageStatus;
  category: string | null;
  audience?: Audience;
  created_at: string;
  updated_at: string;
}

export interface TopicInfo {
  id: string;
  slug: string;
  name: string;
}

export interface TopicListItem extends TopicInfo {
  /** Versions in creation order — the order version picking breaks ties by. */
  versions: PageListItem[];
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

const PAGE_LIST_COLUMNS = 'id,topic_id,slug,title,status,category,created_at,updated_at,audience:doc->audience';
const toListItem = (row: any): PageListItem => ({ ...row, audience: parseAudience(row.audience) });

export async function listContentPages(): Promise<PageListItem[]> {
  const { data, error } = await supabase
    .from('content_pages')
    .select(PAGE_LIST_COLUMNS)
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return (data as any[]).map(toListItem);
}

/** All topics with their versions (topics without a version are skipped). */
export async function listTopics(): Promise<TopicListItem[]> {
  const [{ data: topics }, pages] = await Promise.all([
    supabase.from('content_topics').select('id,slug,name'),
    listContentPages(),
  ]);
  const byTopic = new Map<string, PageListItem[]>();
  for (const p of pages) byTopic.set(p.topic_id, [...(byTopic.get(p.topic_id) ?? []), p]);
  return ((topics ?? []) as TopicInfo[])
    .filter((t) => byTopic.has(t.id))
    .map((t) => ({ ...t, versions: byTopic.get(t.id)!.sort((a, b) => a.created_at.localeCompare(b.created_at)) }));
}

export async function getTopic(id: string): Promise<TopicInfo | null> {
  const { data } = await supabase.from('content_topics').select('id,slug,name').eq('id', id).maybeSingle();
  return (data as TopicInfo | null) ?? null;
}

/** A topic's versions in creation order. */
export async function listTopicVersions(topicId: string): Promise<PageListItem[]> {
  const { data, error } = await supabase
    .from('content_pages')
    .select(PAGE_LIST_COLUMNS)
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as any[]).map(toListItem);
}

/** Create a topic with a unique slug derived from its name. */
export async function createTopic(name: string): Promise<TopicInfo | { error: string }> {
  const base = slugify(name) || 'topic';
  let slug = base;
  for (let attempt = 0; ; attempt++) {
    const { data, error } = await supabase.from('content_topics').insert({ slug, name: name.trim() || 'Untitled topic' }).select('id,slug,name').single();
    if (!error && data) return data as TopicInfo;
    if (attempt >= 4 || !isUniqueViolation(error?.message)) {
      return { error: friendly(error?.message ?? 'Could not create the topic.') };
    }
    slug = `${base.slice(0, 54)}-${nanoid(5).toLowerCase()}`;
  }
}

/** Rename a topic. Its slug (the reader-facing URL) stays the same. */
export async function renameTopic(id: string, name: string): Promise<{ ok: true } | { error: string }> {
  const { error } = await supabase.from('content_topics').update({ name: name.trim() }).eq('id', id);
  return error ? { error: friendly(error.message) } : { ok: true };
}

/** Delete a topic and all of its versions (with their unshared images). */
export async function deleteTopic(id: string): Promise<{ ok: true } | { error: string }> {
  for (const v of await listTopicVersions(id)) {
    const res = await deleteContentPage(v.id);
    if ('error' in res) return res;
  }
  const { error } = await supabase.from('content_topics').delete().eq('id', id);
  return error ? { error: friendly(error.message) } : { ok: true };
}

export async function loadContentPage(id: string): Promise<{ doc: ContentDoc; status: PageStatus; topicId: string; warnings: string[] } | null> {
  const { data, error } = await supabase.from('content_pages').select('doc,status,topic_id').eq('id', id).maybeSingle();
  if (error || !data) return null;
  const parsed = parseContentDoc((data as any).doc);
  if (!parsed.doc) return null;
  // Surface blocks that parseContentDoc dropped (malformed/unknown) so the editor's
  // lint panel can show them — otherwise the drop is silent.
  return { doc: parsed.doc, status: (data as any).status as PageStatus, topicId: (data as any).topic_id, warnings: parsed.warnings };
}

/**
 * Save a page. Updates when `id` is given. A new page joins `topicId`, or, without one,
 * gets its own new topic named after the page.
 */
export async function saveContentPage(
  id: string | null,
  doc: ContentDoc,
  status: PageStatus,
  topicId?: string,
): Promise<{ id: string; slug: string; topicId?: string } | { error: string }> {
  let slug = doc.slug?.trim() || `${slugify(doc.title) || 'page'}-${nanoid(5)}`;
  const payloadFor = (s: string) => ({
    slug: s,
    title: doc.title,
    category: doc.category || null,
    tags: doc.tags,
    doc: { ...doc, slug: s },
    status,
    published_at: status === 'published' ? new Date().toISOString() : null,
  });

  if (id) {
    const { error } = await supabase.from('content_pages').update(payloadFor(slug)).eq('id', id);
    return error ? { error: friendly(error.message) } : { id, slug };
  }
  let topic = topicId;
  let createdTopic = false;
  if (!topic) {
    const t = await createTopic(doc.title);
    if ('error' in t) return t;
    topic = t.id;
    createdTopic = true;
  }
  // New pages: AI generation picks the same slug for the same input, so on a
  // collision append a short suffix and retry rather than failing the create.
  const base = slugify(slug) || 'page';
  for (let attempt = 0; ; attempt++) {
    const { data, error } = await supabase.from('content_pages').insert({ ...payloadFor(slug), topic_id: topic }).select('id').single();
    if (!error && data) return { id: (data as any).id, slug, topicId: topic };
    if (attempt >= 4 || !isUniqueViolation(error?.message)) {
      // Don't leave behind the empty topic made for this page.
      if (createdTopic) await supabase.from('content_topics').delete().eq('id', topic);
      return { error: friendly(error?.message ?? 'Could not create the page.') };
    }
    slug = `${base.slice(0, 54)}-${nanoid(5).toLowerCase()}`;
  }
}

function isUniqueViolation(msg?: string): boolean {
  return !!msg && /duplicate key|unique/i.test(msg);
}

export async function deleteContentPage(id: string): Promise<{ ok: true } | { error: string }> {
  // Collect this page's content-images (from the raw doc) before deleting the row.
  const { data: row } = await supabase.from('content_pages').select('doc,topic_id').eq('id', id).maybeSingle();
  const imagePaths = row ? collectContentImagePaths((row as any).doc) : [];
  const topicId: string | undefined = (row as any)?.topic_id;

  const { error } = await supabase.from('content_pages').delete().eq('id', id);
  if (error) return { error: friendly(error.message) };

  // A topic exists only through its versions: remove it with its last one.
  if (topicId) {
    const { count } = await supabase.from('content_pages').select('id', { count: 'exact', head: true }).eq('topic_id', topicId);
    if (count === 0) await supabase.from('content_topics').delete().eq('id', topicId);
  }

  // Best-effort storage cleanup: remove only images no OTHER page still references
  // (duplicated pages share image URLs). Never block the delete on a storage error.
  if (imagePaths.length) {
    try {
      const orphaned = await unreferencedImagePaths(imagePaths);
      if (orphaned.length) await deleteContentImages(orphaned);
    } catch {
      /* ignore — the page row is already gone; orphaned images are harmless */
    }
  }
  return { ok: true };
}

/** Of the given content-images paths, return those not referenced by any remaining page. */
async function unreferencedImagePaths(paths: string[]): Promise<string[]> {
  const { data } = await supabase.from('content_pages').select('doc');
  const referenced = new Set<string>();
  for (const r of data ?? []) {
    for (const p of collectContentImagePaths((r as any).doc)) referenced.add(p);
  }
  return paths.filter((p) => !referenced.has(p));
}

/** Flip a page's publish state without loading/round-tripping its whole doc. */
export async function setPageStatus(
  id: string,
  status: PageStatus,
): Promise<{ ok: true } | { error: string }> {
  const { error } = await supabase
    .from('content_pages')
    .update({ status, published_at: status === 'published' ? new Date().toISOString() : null })
    .eq('id', id);
  return error ? { error: friendly(error.message) } : { ok: true };
}

/**
 * Deep-copy a page's doc into a new draft, returning the new id. By default the copy is
 * a new topic ("… (copy)"). With `asVersion` it becomes another version of the same
 * topic with its audience cleared, ready to be retargeted.
 */
export async function duplicateContentPage(
  id: string,
  opts: { asVersion?: boolean } = {},
): Promise<{ id: string; slug: string; topicId?: string } | { error: string }> {
  const loaded = await loadContentPage(id);
  if (!loaded) return { error: 'Could not load the page to duplicate.' };
  // Clear the slug so saveContentPage regenerates a unique one from the title.
  if (opts.asVersion) {
    const copy: ContentDoc = { ...loaded.doc, slug: '', audience: undefined, resourceId: undefined };
    return saveContentPage(null, copy, 'draft', loaded.topicId);
  }
  const copy: ContentDoc = { ...loaded.doc, title: `${loaded.doc.title} (copy)`, slug: '' };
  return saveContentPage(null, copy, 'draft');
}

function friendly(msg: string): string {
  if (isUniqueViolation(msg)) return 'That URL slug is already taken — change it in Page settings.';
  if (/row-level security|permission/i.test(msg)) return 'You need moderator access to save pages.';
  return msg;
}
