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

      const dbResources: Resource[] = data
        .filter((r) => !hardcodedTitles.has(r.title.toLowerCase()))
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
            route: r.design_id ? `/design-view/${r.design_id}` : undefined,
            // Pages not in the approved list only appear in the Design Generated tab
            designOnly: !APPROVED_DB_TITLES.has(r.title.toLowerCase()),
          };
        });

      console.log('useResources: Successfully fetched', dbResources.length, 'resources from DB. Merging with ALL_RESOURCES...');
      setResources([...ALL_RESOURCES, ...dbResources]);
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchResources]);

  return { resources, loading, refetch: fetchResources };
}
