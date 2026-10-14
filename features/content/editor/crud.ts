// Supabase CRUD for content pages. Reads use the published-or-own RLS; writes are
// moderator-gated (admins qualify). The editor route calls these.
import { supabase } from '../../../lib/supabase';
import { nanoid } from 'nanoid/non-secure';
import type { ContentDoc } from '../types';
import { parseContentDoc } from '../validate';
import { collectContentImagePaths, deleteContentImages } from '../uploads';

export type PageStatus = 'draft' | 'published';

export interface PageListItem {
  id: string;
  slug: string;
  title: string;
  status: PageStatus;
  category: string | null;
  updated_at: string;
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

export async function listContentPages(): Promise<PageListItem[]> {
  const { data, error } = await supabase
    .from('content_pages')
    .select('id,slug,title,status,category,updated_at')
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data as unknown as PageListItem[];
}

export async function loadContentPage(id: string): Promise<{ doc: ContentDoc; status: PageStatus; warnings: string[] } | null> {
  const { data, error } = await supabase.from('content_pages').select('doc,status').eq('id', id).maybeSingle();
  if (error || !data) return null;
  const parsed = parseContentDoc((data as any).doc);
  if (!parsed.doc) return null;
  // Surface blocks that parseContentDoc dropped (malformed/unknown) so the editor's
  // lint panel can show them — otherwise the drop is silent.
  return { doc: parsed.doc, status: (data as any).status as PageStatus, warnings: parsed.warnings };
}

export async function saveContentPage(
  id: string | null,
  doc: ContentDoc,
  status: PageStatus,
): Promise<{ id: string; slug: string } | { error: string }> {
  const slug = doc.slug?.trim() || `${slugify(doc.title) || 'page'}-${nanoid(5)}`;
  const payload = {
    slug,
    title: doc.title,
    category: doc.category || null,
    tags: doc.tags,
    doc: { ...doc, slug },
    status,
    published_at: status === 'published' ? new Date().toISOString() : null,
  };

  if (id) {
    const { error } = await supabase.from('content_pages').update(payload).eq('id', id);
    return error ? { error: friendly(error.message) } : { id, slug };
  }
  const { data, error } = await supabase.from('content_pages').insert(payload).select('id').single();
  if (error || !data) return { error: friendly(error?.message ?? 'Could not create the page.') };
  return { id: (data as any).id, slug };
}

export async function deleteContentPage(id: string): Promise<{ ok: true } | { error: string }> {
  // Collect this page's content-images (from the raw doc) before deleting the row.
  const { data: row } = await supabase.from('content_pages').select('doc').eq('id', id).maybeSingle();
  const imagePaths = row ? collectContentImagePaths((row as any).doc) : [];

  const { error } = await supabase.from('content_pages').delete().eq('id', id);
  if (error) return { error: friendly(error.message) };

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

/** Deep-copy a page's doc into a new draft ("… (copy)"), returning the new id. */
export async function duplicateContentPage(
  id: string,
): Promise<{ id: string; slug: string } | { error: string }> {
  const loaded = await loadContentPage(id);
  if (!loaded) return { error: 'Could not load the page to duplicate.' };
  // Clear the slug so saveContentPage regenerates a unique one from the new title.
  const copy: ContentDoc = { ...loaded.doc, title: `${loaded.doc.title} (copy)`, slug: '' };
  return saveContentPage(null, copy, 'draft');
}

function friendly(msg: string): string {
  if (/duplicate key|unique/i.test(msg)) return 'That URL slug is already taken — change it in Page settings.';
  if (/row-level security|permission/i.test(msg)) return 'You need moderator access to save pages.';
  return msg;
}
