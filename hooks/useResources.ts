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
        setResources(ALL_RESOURCES);
        return;
      }

      // Deduplicate by title — hardcoded resources take priority
      const hardcodedTitles = new Set(
        ALL_RESOURCES.map((r) => r.title.toLowerCase()),
      );

      const dbResources: Resource[] = data
        .filter((r) => !hardcodedTitles.has(r.title.toLowerCase()))
        .map((r) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          tags: [r.category.toLowerCase()],
          icon: r.icon,
          color: CATEGORY_COLORS[r.category] || DEFAULT_COLOR,
          route: r.design_id ? `/design-view/${r.design_id}` : undefined,
        }));

      setResources([...ALL_RESOURCES, ...dbResources]);
    } catch {
      setResources(ALL_RESOURCES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return { resources, loading, refetch: fetchResources };
}
