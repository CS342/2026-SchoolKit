// Editor store: the single source of truth for the page being edited. Every mutation
// goes through `dispatch(ops)` → applyOps, so manual edits are the exact same ops the
// AI emits. zundo's `temporal` middleware tracks `doc` history for undo/redo.
import { create } from 'zustand';
import { useStore } from 'zustand';
import { temporal } from 'zundo';
import type { ContentDoc, Op } from '../types';
import { applyOps } from '../ops';
import type { Notice } from '../lint';
import type { PageListItem, TopicInfo } from './crud';

/** The topic the page being edited is a version of, and its saved versions in creation
 *  order. Set by the editor route; read by the version bar and the checks panel. */
export interface TopicContext {
  topic: TopicInfo | null;
  versions: PageListItem[];
  /** The page being edited, or null while it's unsaved. */
  currentId: string | null;
}

const NO_TOPIC: TopicContext = { topic: null, versions: [], currentId: null };

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
  /** Non-fatal notices from the last load/generate — e.g. malformed blocks that
   *  parseContentDoc dropped, or what generation had to leave out. Shown by the lint panel. */
  warnings: Notice[];
  /** Apply an op batch. Rejected batches (validation) surface via lastError, no-op the doc. */
  dispatch: (ops: Op[]) => void;
  /** Update doc-level metadata (title/accent/tags/category/slug) — not block content. */
  setMeta: (patch: Partial<ContentDoc>) => void;
  /** Replace the whole doc (e.g. loading from DB). Clears dirty + selection + warnings. */
  load: (doc: ContentDoc) => void;
  select: (id: string | null) => void;
  markSaved: () => void;
  /** Set the current load/generate warnings (e.g. dropped blocks). */
  setWarnings: (warnings: Notice[]) => void;
  topicCtx: TopicContext;
  setTopicContext: (ctx: TopicContext) => void;
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
      topicCtx: NO_TOPIC,
      setTopicContext: (topicCtx) => set({ topicCtx }),
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
export function loadDoc(doc: ContentDoc, warnings: (string | Notice)[] = []) {
  const st = useEditorStore.getState();
  st.load(doc);
  st.setWarnings(warnings.map((w) => (typeof w === 'string'
    ? { message: `A saved section couldn’t be shown and was left out (${w}).`, fix: 'Re-add that section; saving now will remove it from the stored page.' }
    : w)));
  useEditorStore.temporal.getState().clear();
}

// Generate → editor hand-off. The generate flow saves the page and navigates to the
// editor; what generation had to leave out isn't in the saved doc, so its notices are
// parked here by page id and picked up once when the editor loads that page.
const pendingNotices = new Map<string, Notice[]>();
export function stashGenerationNotices(pageId: string, notices: Notice[]) {
  if (notices.length) pendingNotices.set(pageId, notices);
}
export function takeGenerationNotices(pageId: string): Notice[] {
  const n = pendingNotices.get(pageId) ?? [];
  pendingNotices.delete(pageId);
  return n;
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
