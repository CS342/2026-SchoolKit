import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useEditorStore } from '../store/editor-store';
import Konva from 'konva';

const AUTOSAVE_DELAY_MS = 2000;

export function useAutoSave(stageRef: React.RefObject<Konva.Stage | null>) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNow = useCallback(async () => {
    const { designId, isDirty, title, getDocument, setSaving, markSaved } =
      useEditorStore.getState();

    if (!designId || !isDirty) return;

    setSaving(true);
    try {
      const doc = getDocument();
      const { error } = await supabase
        .from('designs')
        .update({
          title,
          doc: doc as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        })
        .eq('id', designId);

      if (!error) {
        markSaved();

        // Generate thumbnail after save (non-blocking)
        generateThumbnail(stageRef, designId);
      } else {
        console.error('Autosave failed:', error);
      }
    } catch (err) {
      console.error('Autosave error:', err);
    } finally {
      useEditorStore.getState().setSaving(false);
    }
  }, [stageRef]);

  // Watch dirty flag and debounce
  useEffect(() => {
    let prevDirty = useEditorStore.getState().isDirty;

    const unsub = useEditorStore.subscribe((state) => {
      if (state.isDirty && !prevDirty) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(saveNow, AUTOSAVE_DELAY_MS);
      }
      prevDirty = state.isDirty;
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [saveNow]);

  // Warn user on page unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const { isDirty, designId } = useEditorStore.getState();
      if (isDirty && designId) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return { saveNow };
}

async function generateThumbnail(
  stageRef: React.RefObject<Konva.Stage | null>,
  designId: string,
) {
  try {
    if (!stageRef.current) return;

    const dataUrl = stageRef.current.toDataURL({
      pixelRatio: 300 / stageRef.current.width(),
      mimeType: 'image/png',
    });

    const response = await fetch(dataUrl);
    const blob = await response.blob();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const path = `${user.id}/thumbnails/${designId}.png`;
    const { error: uploadError } = await supabase.storage
      .from('design-assets')
      .upload(path, blob, { upsert: true, contentType: 'image/png' });

    if (uploadError) return;

    const { data: urlData } = supabase.storage
      .from('design-assets')
      .getPublicUrl(path);

    await supabase
      .from('designs')
      .update({ thumbnail_url: urlData.publicUrl })
      .eq('id', designId);
  } catch {
    // Thumbnail generation is non-critical
  }
}
