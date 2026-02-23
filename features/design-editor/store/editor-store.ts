import { create } from 'zustand';
import { temporal } from 'zundo';
import { produce } from 'immer';
import type {
  DesignDocument,
  DesignObject,
  CanvasConfig,
  InteractiveComponentObject,
  InteractionConfig,
  StaticDesignObject,
} from '../types/document';
import { MOBILE_CANVAS, CANVAS_EXTEND_INCREMENT } from '../types/document';

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

  // ── Interactive component editing ─────────
  editingComponentId: string | null;
  activeGroupRole: string | null;
  isPreviewMode: boolean;

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
  extendCanvas: () => void;

  setActiveTool: (tool: ActiveTool) => void;
  setTitle: (title: string) => void;

  markDirty: () => void;
  markSaved: () => void;
  setSaving: (saving: boolean) => void;

  addAsset: (assetId: string, url: string, name: string) => void;
  removeAsset: (assetId: string) => void;

  getDocument: () => DesignDocument;
  getSelectedObjects: () => DesignObject[];

  // ── Interactive component actions ─────────
  addInteractiveComponent: (component: InteractiveComponentObject) => void;
  updateInteractionConfig: (componentId: string, config: Partial<InteractionConfig>) => void;
  enterComponent: (componentId: string, groupRole: string) => void;
  exitComponent: () => void;
  switchGroup: (groupRole: string) => void;
  addChildObject: (obj: StaticDesignObject) => void;
  updateChildObject: (childId: string, changes: Partial<StaticDesignObject>) => void;
  deleteChildObjects: (childIds: string[]) => void;
  setPreviewMode: (on: boolean) => void;
  getEditingComponent: () => InteractiveComponentObject | null;
}

const initialState = {
  designId: null as string | null,
  title: 'Untitled Design',
  canvas: { width: MOBILE_CANVAS.width, height: MOBILE_CANVAS.height, background: '#FFFFFF' } as CanvasConfig,
  objects: [] as DesignObject[],
  assets: {} as Record<string, { url: string; name: string }>,
  selectedIds: [] as string[],
  activeTool: 'select' as ActiveTool,
  editingComponentId: null as string | null,
  activeGroupRole: null as string | null,
  isPreviewMode: false,
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
          editingComponentId: null,
          activeGroupRole: null,
          isPreviewMode: false,
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

      extendCanvas: () =>
        set(
          produce((state: EditorState) => {
            state.canvas.height += CANVAS_EXTEND_INCREMENT;
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
        const hasInteractive = objects.some((o) => o.type === 'interactive');
        return { version: hasInteractive ? 2 : 1, canvas, objects, assets };
      },

      getSelectedObjects: () => {
        const { objects, selectedIds } = get();
        return objects.filter((o) => selectedIds.includes(o.id));
      },

      // ── Interactive component actions ─────────

      addInteractiveComponent: (component) =>
        set(
          produce((state: EditorState) => {
            state.objects.push(component);
            state.selectedIds = [component.id];
            state.isDirty = true;
          }),
        ),

      updateInteractionConfig: (componentId, config) =>
        set(
          produce((state: EditorState) => {
            const obj = state.objects.find((o) => o.id === componentId);
            if (obj && obj.type === 'interactive') {
              Object.assign(obj.interactionConfig, config);
              state.isDirty = true;
            }
          }),
        ),

      enterComponent: (componentId, groupRole) =>
        set({
          editingComponentId: componentId,
          activeGroupRole: groupRole,
          selectedIds: [],
        }),

      exitComponent: () =>
        set((state) => ({
          editingComponentId: null,
          activeGroupRole: null,
          selectedIds: state.editingComponentId ? [state.editingComponentId] : [],
        })),

      switchGroup: (groupRole) =>
        set({
          activeGroupRole: groupRole,
          selectedIds: [],
        }),

      addChildObject: (obj) =>
        set(
          produce((state: EditorState) => {
            const comp = state.objects.find(
              (o) => o.id === state.editingComponentId,
            );
            if (!comp || comp.type !== 'interactive' || !state.activeGroupRole) return;
            comp.children.push(obj);
            comp.childIds.push(obj.id);
            const group = comp.groups.find((g) => g.role === state.activeGroupRole);
            if (group) group.objectIds.push(obj.id);
            state.selectedIds = [obj.id];
            state.isDirty = true;
          }),
        ),

      updateChildObject: (childId, changes) =>
        set(
          produce((state: EditorState) => {
            const comp = state.objects.find(
              (o) => o.id === state.editingComponentId,
            );
            if (!comp || comp.type !== 'interactive') return;
            const child = comp.children.find((c) => c.id === childId);
            if (child) {
              Object.assign(child, changes);
              state.isDirty = true;
            }
          }),
        ),

      deleteChildObjects: (childIds) =>
        set(
          produce((state: EditorState) => {
            const comp = state.objects.find(
              (o) => o.id === state.editingComponentId,
            );
            if (!comp || comp.type !== 'interactive') return;
            comp.children = comp.children.filter((c) => !childIds.includes(c.id));
            comp.childIds = comp.childIds.filter((id) => !childIds.includes(id));
            for (const group of comp.groups) {
              group.objectIds = group.objectIds.filter((id) => !childIds.includes(id));
            }
            state.selectedIds = state.selectedIds.filter(
              (id) => !childIds.includes(id),
            );
            state.isDirty = true;
          }),
        ),

      setPreviewMode: (on) => set({ isPreviewMode: on, selectedIds: [] }),

      getEditingComponent: () => {
        const { objects, editingComponentId } = get();
        if (!editingComponentId) return null;
        const obj = objects.find((o) => o.id === editingComponentId);
        return obj && obj.type === 'interactive' ? obj : null;
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
