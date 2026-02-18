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
 * Published designs automatically route to the design viewer.
 */
export function useResources() {
  const [resources, setResources] = useState<Resource[]>(ALL_RESOURCES);
  const [loading, setLoading] = useState(true);

  const fetchResources = useCallback(async () => {
    try {
      // Fetch resources and published designs in parallel
      const [resourcesResult, designsResult] = await Promise.all([
        supabase
          .from('resources')
          .select('id, title, description, category, icon, target_roles, created_at'),
        supabase
          .from('designs')
          .select('id, published_resource_id')
          .not('published_resource_id', 'is', null),
      ]);

      if (resourcesResult.error || !resourcesResult.data) {
        setResources(ALL_RESOURCES);
        return;
      }

      // Build a map: resource ID -> design ID for published designs
      const resourceToDesignMap = new Map<string, string>();
      if (designsResult.data) {
        for (const d of designsResult.data) {
          if (d.published_resource_id) {
            resourceToDesignMap.set(d.published_resource_id, d.id);
          }
        }
      }

      // Deduplicate by title — hardcoded resources take priority
      const hardcodedTitles = new Set(
        ALL_RESOURCES.map((r) => r.title.toLowerCase()),
      );

      const dbResources: Resource[] = resourcesResult.data
        .filter((r) => !hardcodedTitles.has(r.title.toLowerCase()))
        .map((r) => {
          const designId = resourceToDesignMap.get(r.id);
          return {
            id: r.id,
            title: r.title,
            category: r.category,
            tags: [r.category.toLowerCase()],
            icon: r.icon,
            color: CATEGORY_COLORS[r.category] || DEFAULT_COLOR,
            route: designId ? `/design-view/${designId}` : undefined,
          };
        });

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
