import { useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useEditorStore } from '../store/editor-store';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useDesignAssets() {
  const { user } = useAuth();
  const designId = useEditorStore((s) => s.designId);
  const addAsset = useEditorStore((s) => s.addAsset);
  const updateObject = useEditorStore((s) => s.updateObject);

  const uploadImage = useCallback(
    async (
      file: File,
    ): Promise<{ assetId: string; url: string }> => {
      const assetId = crypto.randomUUID();

      // Convert to a data URL so the image persists across page reloads
      // (blob: URLs are session-scoped and break after reload)
      const dataUrl = await fileToDataUrl(file);

      // Add to store assets map right away
      addAsset(assetId, dataUrl, file.name);

      // Upload to Supabase in the background (non-blocking)
      // Once complete, swap the data URL for a remote URL to save space
      if (user && designId) {
        const ext = file.name.split('.').pop() || 'png';
        const storagePath = `${user.id}/assets/${designId}/${assetId}.${ext}`;

        supabase.storage
          .from('design-assets')
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
          })
          .then(({ error: uploadError }) => {
            if (uploadError) {
              console.warn('Supabase upload failed, using data URL:', uploadError.message);
              return;
            }

            const { data: urlData } = supabase.storage
              .from('design-assets')
              .getPublicUrl(storagePath);

            const remoteUrl = urlData.publicUrl;

            // Swap data URL for persistent remote URL (saves DB space)
            addAsset(assetId, remoteUrl, file.name);
            const currentObjects = useEditorStore.getState().objects;
            for (const obj of currentObjects) {
              if (obj.type === 'image' && obj.assetId === assetId) {
                updateObject(obj.id, { src: remoteUrl });
              }
            }

            // Track in design_assets table
            supabase.from('design_assets').insert({
              design_id: designId,
              owner_id: user.id,
              file_name: file.name,
              storage_path: storagePath,
              mime_type: file.type,
              file_size: file.size,
            });
          })
          .catch((err) => {
            console.warn('Supabase upload failed, using data URL:', err);
          });
      }

      return { assetId, url: dataUrl };
    },
    [user, designId, addAsset, updateObject],
  );

  return { uploadImage };
}
