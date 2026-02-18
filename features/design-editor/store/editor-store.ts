import { create } from 'zustand';
import { temporal } from 'zundo';
import { produce } from 'immer';
import type {
  DesignDocument,
  DesignObject,
  CanvasConfig,
} from '../types/document';

type ActiveTool = 'select' | 'text' | 'rect' | 'ellipse' | 'line' | 'image';

interface EditorState {
  // ── Document data ─────────────────────────
  designId: string | null;
  title: string;
  canvas: CanvasConfig;
  objects: DesignObject[];
  assets: Record<string, { url: string; name: string }>;

  // ── Selection ─────────────────────────────
  selectedIds: string[];

  // ── Tool ──────────────────────────────────
  activeTool: ActiveTool;

  // ── Persistence state ─────────────────────
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: number | null;

  // ── Actions ───────────────────────────────
  loadDocument: (id: string, title: string, doc: DesignDocument) => void;
  resetEditor: () => void;

  addObject: (obj: DesignObject) => void;
  updateObject: (id: string, changes: Partial<DesignObject>) => void;
  deleteObjects: (ids: string[]) => void;
  reorderObject: (id: string, newIndex: number) => void;
  duplicateObjects: (ids: string[]) => void;

  setSelection: (ids: string[]) => void;
  clearSelection: () => void;

  setCanvasSize: (width: number, height: number) => void;
  setCanvasBackground: (color: string) => void;

  setActiveTool: (tool: ActiveTool) => void;
  setTitle: (title: string) => void;

  markDirty: () => void;
  markSaved: () => void;
  setSaving: (saving: boolean) => void;

  addAsset: (assetId: string, url: string, name: string) => void;
  removeAsset: (assetId: string) => void;

  getDocument: () => DesignDocument;
  getSelectedObjects: () => DesignObject[];
}

const initialState = {
  designId: null as string | null,
  title: 'Untitled Design',
  canvas: { width: 1280, height: 720, background: '#FFFFFF' } as CanvasConfig,
  objects: [] as DesignObject[],
  assets: {} as Record<string, { url: string; name: string }>,
  selectedIds: [] as string[],
  activeTool: 'select' as ActiveTool,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null as number | null,
};

export const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      ...initialState,

      loadDocument: (id, title, doc) =>
        set({
          designId: id,
          title,
          canvas: doc.canvas,
          objects: doc.objects,
          assets: doc.assets || {},
          selectedIds: [],
          isDirty: false,
          activeTool: 'select',
          isSaving: false,
          lastSavedAt: null,
        }),

      resetEditor: () => set({ ...initialState }),

      addObject: (obj) =>
        set(
          produce((state: EditorState) => {
            state.objects.push(obj);
            state.selectedIds = [obj.id];
            state.isDirty = true;
          }),
        ),

      updateObject: (id, changes) =>
        set(
          produce((state: EditorState) => {
            const idx = state.objects.findIndex((o) => o.id === id);
            if (idx !== -1) {
              Object.assign(state.objects[idx], changes);
              state.isDirty = true;
            }
          }),
        ),

      deleteObjects: (ids) =>
        set(
          produce((state: EditorState) => {
            state.objects = state.objects.filter((o) => !ids.includes(o.id));
            state.selectedIds = state.selectedIds.filter(
              (id) => !ids.includes(id),
            );
            state.isDirty = true;
          }),
        ),

      reorderObject: (id, newIndex) =>
        set(
          produce((state: EditorState) => {
            const idx = state.objects.findIndex((o) => o.id === id);
            if (idx !== -1 && idx !== newIndex) {
              const [obj] = state.objects.splice(idx, 1);
              state.objects.splice(newIndex, 0, obj);
              state.isDirty = true;
            }
          }),
        ),

      duplicateObjects: (ids) =>
        set(
          produce((state: EditorState) => {
            const copies = state.objects
              .filter((o) => ids.includes(o.id))
              .map((o) => ({
                ...JSON.parse(JSON.stringify(o)),
                id: `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                x: o.x + 20,
                y: o.y + 20,
                name: `${o.name} copy`,
              }));
            state.objects.push(...copies);
            state.selectedIds = copies.map((c: DesignObject) => c.id);
            state.isDirty = true;
          }),
        ),

      setSelection: (ids) => set({ selectedIds: ids }),
      clearSelection: () => set({ selectedIds: [] }),

      setCanvasSize: (width, height) =>
        set(
          produce((state: EditorState) => {
            state.canvas.width = width;
            state.canvas.height = height;
            state.isDirty = true;
          }),
        ),

      setCanvasBackground: (color) =>
        set(
          produce((state: EditorState) => {
            state.canvas.background = color;
            state.isDirty = true;
          }),
        ),

      setActiveTool: (tool) => set({ activeTool: tool }),

      setTitle: (title) => set({ title, isDirty: true }),

      markDirty: () => set({ isDirty: true }),
      markSaved: () => set({ isDirty: false, lastSavedAt: Date.now() }),
      setSaving: (saving) => set({ isSaving: saving }),

      addAsset: (assetId, url, name) =>
        set(
          produce((state: EditorState) => {
            state.assets[assetId] = { url, name };
          }),
        ),

      removeAsset: (assetId) =>
        set(
          produce((state: EditorState) => {
            delete state.assets[assetId];
          }),
        ),

      getDocument: () => {
        const { canvas, objects, assets } = get();
        return { version: 1, canvas, objects, assets };
      },

      getSelectedObjects: () => {
        const { objects, selectedIds } = get();
        return objects.filter((o) => selectedIds.includes(o.id));
      },
    }),
    {
      partialize: (state) => ({
        objects: state.objects,
        canvas: state.canvas,
        title: state.title,
      }),
      limit: 50,
    },
  ),
);
