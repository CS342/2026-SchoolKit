// Supabase CRUD for content pages. Reads use the published-or-own RLS; writes are
// moderator-gated (admins qualify). The editor route calls these.
import { supabase } from '../../../lib/supabase';
import { nanoid } from 'nanoid/non-secure';
import type { ContentDoc } from '../types';
import { parseContentDoc } from '../validate';

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

export async function loadContentPage(id: string): Promise<{ doc: ContentDoc; status: PageStatus } | null> {
  const { data, error } = await supabase.from('content_pages').select('doc,status').eq('id', id).maybeSingle();
  if (error || !data) return null;
  const parsed = parseContentDoc((data as any).doc);
  if (!parsed.doc) return null;
  return { doc: parsed.doc, status: (data as any).status as PageStatus };
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
  const { error } = await supabase.from('content_pages').delete().eq('id', id);
  return error ? { error: friendly(error.message) } : { ok: true };
}

function friendly(msg: string): string {
  if (/duplicate key|unique/i.test(msg)) return 'That URL slug is already taken — change it in Page settings.';
  if (/row-level security|permission/i.test(msg)) return 'You need moderator access to save pages.';
  return msg;
}
