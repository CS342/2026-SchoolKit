import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ALL_RESOURCES, type Resource } from '../constants/resources';

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
const CATEGORY_ICONS: Record<string, string> = { School: 'school-outline', Health: 'medkit-outline', Social: 'people-outline', Family: 'home-outline', Emotions: 'happy-outline' };

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
  };
}

// DB/design-editor pages with these titles appear in the main library.
// All other DB pages are still fetched but shown only in the Design Generated tab.
const APPROVED_DB_TITLES = new Set([
  'feeling sick? here\'s what to do',
]);

// Override icon/color for specific approved pages (overrides whatever is stored in the DB).
const APPROVED_DB_OVERRIDES: Record<string, { icon?: string; color?: string }> = {
  'feeling sick? here\'s what to do': { icon: 'thermometer-outline', color: '#0EA5E9' },
};

/**
 * Fetches resources from Supabase and merges with the hardcoded resource list.
 * Hardcoded resources take priority (they have custom routes and colors).
 * DB-only resources (e.g. published designs) are appended with derived colors.
 * Published designs automatically route to the design viewer via design_id.
 */
export function useResources() {
  const [resources, setResources] = useState<Resource[]>(ALL_RESOURCES);
  const [loading, setLoading] = useState(true);

  const fetchResources = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('id, title, description, category, icon, target_roles, design_id, created_at');

      if (error || !data) {
        console.error('useResources error fetching data:', error);
        setResources(ALL_RESOURCES);
        return;
      }

      // Deduplicate by title — hardcoded resources take priority
      const hardcodedTitles = new Set(
        ALL_RESOURCES.map((r) => r.title.toLowerCase()),
      );

      const DESIGN_CUTOFF = '2026-03-10T00:00:00Z';

      const dbResources: Resource[] = data
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
          };
        });

      // Published block-model content pages (editor / AI generated).
      const { data: pages } = await supabase
        .from('content_pages')
        .select('id, slug, title, category, tags, doc, status')
        .eq('status', 'published');

      const seen = new Set([...hardcodedTitles, ...dbResources.map((r) => r.title.toLowerCase())]);
      const pageResources: Resource[] = (pages ?? [])
        .filter((p: any) => p.slug && !seen.has(String(p.title).toLowerCase()))
        .map(contentPageToResource);

      setResources([...ALL_RESOURCES, ...dbResources, ...pageResources]);
    } catch {
      setResources(ALL_RESOURCES);
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

  return { resources, loading, refetch: fetchResources };
}
