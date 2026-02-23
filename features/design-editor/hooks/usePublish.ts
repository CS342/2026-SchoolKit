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
            design_id: designId,
          })
          .eq('id', design.published_resource_id);

        if (error) {
          console.error('Update resource error:', error);
          return null;
        }
        resourceId = design.published_resource_id;
      } else {
        // Insert new resource with a direct link back to the design
        const { data: newResource, error } = await supabase
          .from('resources')
          .insert({
            title: opts.title,
            description: opts.description,
            category: opts.category,
            icon: opts.icon,
            target_roles: opts.targetRoles,
            design_id: designId,
          })
          .select('id')
          .single();

        if (error || !newResource) {
          console.error('Create resource error:', error);
          return null;
        }
        resourceId = newResource.id;

        // Link the design to the resource and mark as shared
        await supabase
          .from('designs')
          .update({ published_resource_id: resourceId, is_shared: true })
          .eq('id', designId);
      }

      // Ensure design is shared when published (covers update path too)
      await supabase
        .from('designs')
        .update({ is_shared: true })
        .eq('id', designId);

      return resourceId;
    },
    [designId],
  );

  const unpublish = useCallback(async () => {
    if (!designId) return;

    const { data: design } = await supabase
      .from('designs')
      .select('published_resource_id, share_token')
      .eq('id', designId)
      .single();

    if (design?.published_resource_id) {
      await supabase
        .from('resources')
        .delete()
        .eq('id', design.published_resource_id);

      // Only unshare if there's no active share link
      const updates: Record<string, unknown> = { published_resource_id: null };
      if (!design.share_token) {
        updates.is_shared = false;
      }

      await supabase
        .from('designs')
        .update(updates)
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
