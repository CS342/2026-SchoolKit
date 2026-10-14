// Editor store: the single source of truth for the page being edited. Every mutation
// goes through `dispatch(ops)` → applyOps, so manual edits are the exact same ops the
// AI emits. zundo's `temporal` middleware tracks `doc` history for undo/redo.
import { create } from 'zustand';
import { useStore } from 'zustand';
import { temporal } from 'zundo';
import type { ContentDoc, Op } from '../types';
import { applyOps } from '../ops';

const EMPTY_DOC: ContentDoc = {
  schemaVersion: 1,
  slug: '',
  title: 'Untitled Page',
  accent: 'primary',
  tags: [],
  blocks: [],
};

interface EditorState {
  doc: ContentDoc;
  selectedId: string | null;
  dirty: boolean;
  lastError: string | null;
  /** Non-fatal warnings from the last load/generate — e.g. malformed blocks that
   *  parseContentDoc dropped, or generatePage warnings. Shown by the lint panel. */
  warnings: string[];
  /** Apply an op batch. Rejected batches (validation) surface via lastError, no-op the doc. */
  dispatch: (ops: Op[]) => void;
  /** Update doc-level metadata (title/accent/tags/category/slug) — not block content. */
  setMeta: (patch: Partial<ContentDoc>) => void;
  /** Replace the whole doc (e.g. loading from DB). Clears dirty + selection + warnings. */
  load: (doc: ContentDoc) => void;
  select: (id: string | null) => void;
  markSaved: () => void;
  /** Set the current load/generate warnings (e.g. dropped blocks). */
  setWarnings: (warnings: string[]) => void;
}

export const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      doc: EMPTY_DOC,
      selectedId: null,
      dirty: false,
      lastError: null,
      warnings: [],
      dispatch: (ops) => {
        try {
          const next = applyOps(get().doc, ops);
          set({ doc: next, dirty: true, lastError: null });
        } catch (e: any) {
          set({ lastError: e?.message ?? 'That change was not allowed.' });
        }
      },
      setMeta: (patch) => set((st) => ({ doc: { ...st.doc, ...patch }, dirty: true, lastError: null })),
      load: (doc) => set({ doc, dirty: false, selectedId: null, lastError: null, warnings: [] }),
      select: (id) => set({ selectedId: id }),
      markSaved: () => set({ dirty: false }),
      setWarnings: (warnings) => set({ warnings }),
    }),
    {
      // Only `doc` is time-travelled; UI state (selection, dirty) is not.
      limit: 200,
      partialize: (s) => ({ doc: s.doc }),
      // Coalesce rapid edits (typing) into one undo step instead of one per keystroke.
      handleSet: (handleSet) => {
        let t: ReturnType<typeof setTimeout> | undefined;
        return (state) => {
          clearTimeout(t);
          t = setTimeout(() => handleSet(state), 350);
        };
      },
    },
  ),
);

/** Load a doc and reset undo history so you can't undo past the loaded state.
 *  Pass `warnings` (e.g. blocks parseContentDoc dropped) to surface them in the lint panel. */
export function loadDoc(doc: ContentDoc, warnings: string[] = []) {
  const st = useEditorStore.getState();
  st.load(doc);
  st.setWarnings(warnings);
  useEditorStore.temporal.getState().clear();
}

/** Undo/redo helpers + reactive availability flags. */
export function undo() { useEditorStore.temporal.getState().undo(); }
export function redo() { useEditorStore.temporal.getState().redo(); }

export function useCanUndo(): boolean {
  return useStore(useEditorStore.temporal, (s) => s.pastStates.length > 0);
}
export function useCanRedo(): boolean {
  return useStore(useEditorStore.temporal, (s) => s.futureStates.length > 0);
}
