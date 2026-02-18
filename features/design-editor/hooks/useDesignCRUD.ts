import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import type { Design } from '../../../lib/database.types';
import type { DesignDocument } from '../types/document';
import { DEFAULT_DOCUMENT } from '../types/document';

export function useDesignCRUD() {
  const { user } = useAuth();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDesigns = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('designs')
      .select('id, title, thumbnail_url, is_shared, created_at, updated_at')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setDesigns(data as unknown as Design[]);
    }
    setLoading(false);
  }, [user]);

  const createDesign = useCallback(
    async (
      title = 'Untitled Design',
      doc: DesignDocument = DEFAULT_DOCUMENT,
    ): Promise<string | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('designs')
        .insert({ owner_id: user.id, title, doc: doc as unknown as Record<string, unknown> })
        .select('id')
        .single();

      if (error) {
        console.error('Create design error:', error);
        return null;
      }
      return data.id;
    },
    [user],
  );

  const deleteDesign = useCallback(async (id: string) => {
    const { error } = await supabase.from('designs').delete().eq('id', id);
    if (!error) {
      setDesigns((prev) => prev.filter((d) => d.id !== id));
    }
  }, []);

  const duplicateDesign = useCallback(
    async (id: string) => {
      if (!user) return;
      const { data: original } = await supabase
        .from('designs')
        .select('title, doc')
        .eq('id', id)
        .single();

      if (!original) return;

      await supabase.from('designs').insert({
        owner_id: user.id,
        title: `${original.title} (Copy)`,
        doc: original.doc as unknown as Record<string, unknown>,
      });
      fetchDesigns();
    },
    [user, fetchDesigns],
  );

  const loadDesign = useCallback(
    async (id: string): Promise<Design | null> => {
      const { data, error } = await supabase
        .from('designs')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return data as unknown as Design;
    },
    [],
  );

  const saveDesign = useCallback(
    async (
      id: string,
      updates: { title?: string; doc?: DesignDocument },
    ): Promise<boolean> => {
      const { error } = await supabase
        .from('designs')
        .update({
          ...updates,
          doc: updates.doc as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      return !error;
    },
    [],
  );

  return {
    designs,
    loading,
    fetchDesigns,
    createDesign,
    deleteDesign,
    duplicateDesign,
    loadDesign,
    saveDesign,
  };
}
