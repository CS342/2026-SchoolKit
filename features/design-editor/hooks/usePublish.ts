import { useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useEditorStore } from '../store/editor-store';

interface PublishOptions {
  title: string;
  description: string;
  category: string;
  icon: string;
  targetRoles: string[];
}

export function usePublish() {
  const designId = useEditorStore((s) => s.designId);

  const publish = useCallback(
    async (opts: PublishOptions): Promise<string | null> => {
      if (!designId) return null;

      // Check if already published
      const { data: design } = await supabase
        .from('designs')
        .select('published_resource_id')
        .eq('id', designId)
        .single();

      if (!design) return null;

      let resourceId: string;

      if (design.published_resource_id) {
        // Update existing resource
        const { error } = await supabase
          .from('resources')
          .update({
            title: opts.title,
            description: opts.description,
            category: opts.category,
            icon: opts.icon,
            target_roles: opts.targetRoles,
          })
          .eq('id', design.published_resource_id);

        if (error) {
          console.error('Update resource error:', error);
          return null;
        }
        resourceId = design.published_resource_id;
      } else {
        // Insert new resource
        const { data: newResource, error } = await supabase
          .from('resources')
          .insert({
            title: opts.title,
            description: opts.description,
            category: opts.category,
            icon: opts.icon,
            target_roles: opts.targetRoles,
          })
          .select('id')
          .single();

        if (error || !newResource) {
          console.error('Create resource error:', error);
          return null;
        }
        resourceId = newResource.id;

        // Link the design to the resource
        await supabase
          .from('designs')
          .update({ published_resource_id: resourceId })
          .eq('id', designId);
      }

      return resourceId;
    },
    [designId],
  );

  const unpublish = useCallback(async () => {
    if (!designId) return;

    const { data: design } = await supabase
      .from('designs')
      .select('published_resource_id')
      .eq('id', designId)
      .single();

    if (design?.published_resource_id) {
      await supabase
        .from('resources')
        .delete()
        .eq('id', design.published_resource_id);

      await supabase
        .from('designs')
        .update({ published_resource_id: null })
        .eq('id', designId);
    }
  }, [designId]);

  const getPublishedResourceId = useCallback(async (): Promise<string | null> => {
    if (!designId) return null;

    const { data } = await supabase
      .from('designs')
      .select('published_resource_id')
      .eq('id', designId)
      .single();

    return data?.published_resource_id ?? null;
  }, [designId]);

  const getPublishedResource = useCallback(async (): Promise<PublishOptions | null> => {
    if (!designId) return null;

    const { data: design } = await supabase
      .from('designs')
      .select('published_resource_id')
      .eq('id', designId)
      .single();

    if (!design?.published_resource_id) return null;

    const { data: resource } = await supabase
      .from('resources')
      .select('title, description, category, icon, target_roles')
      .eq('id', design.published_resource_id)
      .single();

    if (!resource) return null;

    return {
      title: resource.title ?? '',
      description: resource.description ?? '',
      category: resource.category ?? '',
      icon: resource.icon ?? 'color-palette-outline',
      targetRoles: (resource.target_roles as string[]) ?? [],
    };
  }, [designId]);

  return { publish, unpublish, getPublishedResourceId, getPublishedResource };
}
