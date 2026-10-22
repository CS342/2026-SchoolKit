import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { ALL_RESOURCES, type Resource } from '../constants/resources';
import { parseAudience, parseLanguage, type AudienceViewer } from '../features/content/audience';
import { resolveTopics, type TopicGroup } from '../features/content/versions';
import { useAudienceFilter, useAudienceViewer, isListable } from './useAudienceFilter';

const CATEGORY_COLORS: Record<string, string> = {
  Emotions: '#66D9A6',
  School: '#EF4444',
  Social: '#0EA5E9',
  Health: '#7B68EE',
  Family: '#66D9A6',
};

const DEFAULT_COLOR = '#7B68EE';

// Block-model content pages (content_pages table) → library resources. Icon/color/
// description are derived from the page's own doc so cards look intentional.
const ACCENT_HEX: Record<string, string> = { primary: '#6B5AD6', teal: '#3C9A8D', coral: '#DC6A50', amber: '#DE9A2E', indigo: '#6C7CE0', sky: '#4F9FCB' };
// Topic icons use AppIcon names: Ionicons, or `mci:` for Material Community Icons.
const CATEGORY_ICONS: Record<string, string> = { School: 'mci:account-school', Health: 'mci:heart-pulse', Social: 'mci:forum', Family: 'mci:home-heart', Emotions: 'mci:emoticon-happy' };

function contentPageToResource(row: any): Resource {
  const doc = row.doc || {};
  const blocks = Array.isArray(doc.blocks) ? doc.blocks : [];
  const hero = blocks.find((b: any) => b.type === 'hero');
  const callout = blocks.find((b: any) => b.type === 'callout');
  const rich = blocks.find((b: any) => b.type === 'richText');
  const desc = String(callout?.text || hero?.subtitle || rich?.markdown || '')
    .replace(/[#*_>`-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
  const words = String(row.title || 'Page').split(' ');
  return {
    id: `cp_${row.id}`,
    title: row.title,
    abbr: words.slice(0, 2).join(' '),
    shortDescription: desc,
    category: row.category || 'Health',
    tags: Array.isArray(row.tags) ? row.tags : [],
    icon: hero?.eyebrowIcon || CATEGORY_ICONS[row.category] || 'document-text-outline',
    color: ACCENT_HEX[doc.accent] || CATEGORY_COLORS[row.category] || DEFAULT_COLOR,
    route: `/page/${row.slug}`,
    designOnly: false,
    audience: parseAudience(doc.audience),
    language: parseLanguage(doc.language),
  };
}

// DB/design-editor pages with these titles appear in the main library.
// All other DB pages are still fetched but shown only in the Design Generated tab.
const APPROVED_DB_TITLES = new Set([
  'feeling sick? here\'s what to do',
]);

// Override icon/color for specific approved pages (overrides whatever is stored in the DB).
const APPROVED_DB_OVERRIDES: Record<string, { icon?: string; color?: string }> = {
  'feeling sick? here\'s what to do': { icon: 'mci:thermometer', color: '#0EA5E9' },
};

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();

/**
 * One library card per published topic, showing the version picked for this viewer.
 * Its id is `cp_<topicId>`, so bookmarks/downloads/progress follow the topic across
 * versions, and its route is the topic URL, which opens the viewer's version. A topic
 * with no version for this viewer keeps its card in allResources (for bookmark lookups)
 * with the fallback version's audience, which the list filter then hides.
 */
function topicResource(g: TopicGroup<any>): Resource {
  const r = contentPageToResource(g.shown);
  const topicSlug = g.shown.topic?.slug;
  return { ...r, id: `cp_${g.topicId}`, route: topicSlug ? `/page/${topicSlug}` : r.route };
}

/** The built-in guide a topic replaces: one a version links (doc.resourceId, set on
 *  pages seeded from built-in guides), else one with a version's title. */
export function replacedBuiltInId(versions: { title?: string; doc?: any }[]): string | undefined {
  const linked = versions.map((v) => v.doc?.resourceId).find((id) => ALL_RESOURCES.some((r) => r.id === id));
  if (linked) return linked;
  return ALL_RESOURCES.find((r) => versions.some((v) => norm(v.title) === norm(r.title)))?.id;
}

function buildLibrary(resourceRows: any[], pageRows: any[], viewer: AudienceViewer): Resource[] {
  const topics = resolveTopics(
    pageRows.map((p) => ({ ...p, topic_id: p.topic_id ?? p.id, audience: parseAudience(p.doc?.audience), language: parseLanguage(p.doc?.language) })),
    viewer,
  );

  // A published topic REPLACES a built-in guide when linked to it or titled the same.
  // The replacement keeps the guide's id (bookmarks/downloads/topics keep working) and
  // curated icon/color, takes everything else from the topic, and stays listed even
  // while built-ins are hidden.
  const replacement = new Map<string, TopicGroup<any>>(); // built-in id → topic
  for (const g of topics) {
    const target = replacedBuiltInId(g.versions);
    if (target && !replacement.has(target)) replacement.set(target, g);
  }
  const replacingTopicIds = new Set([...replacement.values()].map((g) => g.topicId));
  const builtIns: Resource[] = ALL_RESOURCES.map((r) => {
    const g = replacement.get(r.id);
    if (!g) return r;
    return { ...topicResource(g), id: r.id, icon: r.icon, color: r.color, fromContentPage: true } as Resource;
  });

  // Deduplicate by title — hardcoded resources take priority
  const hardcodedTitles = new Set(
    ALL_RESOURCES.map((r) => r.title.toLowerCase()),
  );

  const DESIGN_CUTOFF = '2026-03-10T00:00:00Z';

  const dbResources: Resource[] = resourceRows
    .filter((r) => !hardcodedTitles.has(r.title.toLowerCase()))
    .filter((r) => r.created_at && r.created_at >= DESIGN_CUTOFF)
    .map((r) => {
      // Generate an abbreviation from the first two words of the title
      const words = r.title.split(' ');
      const abbr = words.slice(0, 2).join(' ');

      const override = APPROVED_DB_OVERRIDES[r.title.toLowerCase()] ?? {};
      return {
        id: r.id,
        title: r.title,
        abbr,
        shortDescription: r.description || '',
        category: r.category,
        tags: [r.category.toLowerCase()],
        icon: override.icon ?? r.icon ?? 'document-text-outline',
        color: override.color ?? CATEGORY_COLORS[r.category] ?? DEFAULT_COLOR,
        route: r.design_id ? `/design-view/${r.design_id}?resourceId=${r.id}` : undefined,
        // Pages not in the approved list only appear in the Design Generated tab
        designOnly: !APPROVED_DB_TITLES.has(r.title.toLowerCase()),
        audience: parseAudience({ roles: r.target_roles }),
      };
    });

  // Every other published topic (editor / AI generated) gets its own card, unless an
  // older DB resource already has that title.
  const seen = new Set(dbResources.map((r) => r.title.toLowerCase()));
  const pageResources: Resource[] = topics
    .filter((g) => !replacingTopicIds.has(g.topicId) && !seen.has(norm(g.shown.title)))
    .map(topicResource);

  return [...builtIns, ...dbResources, ...pageResources];
}

const PAGE_COLUMNS = 'id, topic_id, slug, title, category, tags, doc, status, created_at, topic:content_topics(slug, name)';
// Before the content_topics migration is applied: each page is its own topic.
const LEGACY_PAGE_COLUMNS = 'id, slug, title, category, tags, doc, status, created_at';

type LibraryRows = { resourceRows: any[]; pageRows: any[] };

async function fetchLibraryRows(): Promise<LibraryRows> {
  const publishedPages = (columns: string) => supabase
    .from('content_pages')
    .select(columns)
    .eq('status', 'published')
    .order('created_at', { ascending: true });
  // The two sources load independently: a failure in one must not hide the other.
  const [resourcesRes, firstPagesRes] = await Promise.all([
    supabase
      .from('resources')
      .select('id, title, description, category, icon, target_roles, design_id, created_at'),
    publishedPages(PAGE_COLUMNS),
  ]);
  const pagesRes = firstPagesRes.error ? await publishedPages(LEGACY_PAGE_COLUMNS) : firstPagesRes;
  if (resourcesRes.error) console.error('useResources error fetching resources:', resourcesRes.error);
  if (pagesRes.error) console.error('useResources error fetching content pages:', pagesRes.error);
  return {
    resourceRows: resourcesRes.data ?? [],
    pageRows: ((pagesRes.data ?? []) as any[]).filter((p) => p.slug),
  };
}

/**
 * Every guide that can appear in lists, for any audience: what the editor's guide picker
 * and the AI may link to (resourceRefList). Same ids and cards as the Library.
 */
export async function loadGuideIndex(): Promise<Resource[]> {
  let rows: LibraryRows;
  try { rows = await fetchLibraryRows(); } catch { rows = { resourceRows: [], pageRows: [] }; }
  return buildLibrary(rows.resourceRows, rows.pageRows, { role: null, gradeLevel: '' })
    .filter((r) => !r.designOnly && isListable(r));
}

/**
 * Fetches resources from Supabase and merges with the hardcoded resource list.
 * Hardcoded resources take priority (they have custom routes and colors).
 * DB-only resources (e.g. published designs) are appended with derived colors.
 * Published designs automatically route to the design viewer via design_id.
 *
 * `resources` is limited to what the viewer's audience (role + grade) should see in
 * lists. `allResources` is the full set — use it for id lookups (bookmarks, downloads)
 * that must keep working after the viewer's role or grade changes.
 */
export function useResources() {
  const [raw, setRaw] = useState<LibraryRows | null>(null);
  const viewer = useAudienceViewer();
  const isVisible = useAudienceFilter();
  const allResources = useMemo(
    () => (raw ? buildLibrary(raw.resourceRows, raw.pageRows, viewer) : ALL_RESOURCES),
    [raw, viewer],
  );
  const resources = useMemo(() => allResources.filter(isVisible), [allResources, isVisible]);
  const [loading, setLoading] = useState(true);

  const fetchResources = useCallback(async () => {
    try {
      setRaw(await fetchLibraryRows());
    } catch {
      setRaw(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();

    // Subscribe to realtime changes on 'resources' table
    const channel = supabase
      .channel('public:resources')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'resources' },
        (_payload) => {
          fetchResources(); // simple refetch on any change
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'content_pages' },
        (_payload) => {
          fetchResources();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchResources]);

  return { resources, allResources, loading, refetch: fetchResources };
}

/**
 * Whether a saved profile topic refers to this resource. Topics are saved by resource id
 * (a topic's id is stable across its versions and title edits); older profiles saved
 * titles, which still match.
 */
export function matchesSavedTopic(saved: string, r: { id: string; title: string }): boolean {
  return saved === r.id || saved.trim().toLowerCase() === r.title.trim().toLowerCase();
}

/** Saved topics rewritten as ids where they match a known topic (others kept as-is). */
export function normalizeSavedTopics(saved: string[], topics: { id: string; label: string }[]): string[] {
  const out = saved.map((s) => topics.find((t) => matchesSavedTopic(s, { id: t.id, title: t.label }))?.id ?? s);
  return [...new Set(out)];
}

/**
 * Topics for onboarding (step 4) and the Profile Topics editor: one per topic this viewer
 * can see in lists, so a topic is only offered when it has a version meant for their
 * role/grade. `label` is the title of their version.
 */
export function useVisibleTopics(): { id: string; label: string; icon: string; color: string }[] {
  const { resources } = useResources();
  return useMemo(
    () => resources.filter((r) => !r.designOnly).map((r) => ({ id: r.id, label: r.title, icon: r.icon, color: r.color })),
    [resources],
  );
}

/**
 * Picker state for onboarding step 4 and Edit Topics. Toggling stores topic ids;
 * entries an older profile saved by title count as selected and become ids on save.
 * Saved topics that aren't offered right now (hidden for this viewer) are kept.
 */
export function useTopicPicker(initial: string[]) {
  const topics = useVisibleTopics();
  const [selected, setSelected] = useState<string[]>(initial);
  type T = { id: string; label: string };
  const matches = (s: string, t: T) => matchesSavedTopic(s, { id: t.id, title: t.label });
  const isSelected = (t: T) => selected.some((s) => matches(s, t));
  const toggle = (t: T) => setSelected((prev) => (
    prev.some((s) => matches(s, t)) ? prev.filter((s) => !matches(s, t)) : [...prev, t.id]
  ));
  return {
    topics,
    isSelected,
    toggle,
    /** Selected topics among those offered. */
    count: topics.filter(isSelected).length,
    toSave: () => normalizeSavedTopics(selected, topics),
  };
}
