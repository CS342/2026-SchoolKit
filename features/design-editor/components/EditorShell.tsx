import React, { useRef, useEffect, useState, useCallback } from 'react';
import Konva from 'konva';
import { useEditorStore } from '../store/editor-store';
import { EditorToolbar } from './EditorToolbar';
import { ToolPanel } from './ToolPanel';
import { EditorCanvas } from './EditorCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { LayersPanel } from './LayersPanel';
import { ShareModal } from './ShareModal';
import { ExportModal } from './ExportModal';
import { PublishModal } from './PublishModal';
import { GroupTabBar } from './GroupTabBar';
import { PreviewOverlay } from './PreviewOverlay';
import { AIGenerateModal } from './AIGenerateModal';
import { useAutoSave } from '../hooks/useAutoSave';
import { useDesignAssets } from '../hooks/useDesignAssets';
import { useTheme } from '../../../contexts/ThemeContext';
import type { DesignDocument } from '../types/document';
import {
  copyToClipboard,
  getClipboard,
  incrementPasteCount,
  hasClipboardContent,
} from '../utils/clipboard';

interface EditorShellProps {
  isShared: boolean;
  shareToken: string | null;
  onShareChange: (isShared: boolean, token: string | null) => void;
}

export function EditorShell({
  isShared,
  shareToken,
  onShareChange,
}: EditorShellProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const { colors } = useTheme();
  const [showShare, setShowShare] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [rightPanel, setRightPanel] = useState<'properties' | 'layers'>(
    'properties',
  );

  const selectedIds = useEditorStore((s) => s.selectedIds);
  const deleteObjects = useEditorStore((s) => s.deleteObjects);
  const duplicateObjects = useEditorStore((s) => s.duplicateObjects);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const setSelection = useEditorStore((s) => s.setSelection);
  const objects = useEditorStore((s) => s.objects);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const editingComponentId = useEditorStore((s) => s.editingComponentId);
  const exitComponent = useEditorStore((s) => s.exitComponent);
  const enterComponent = useEditorStore((s) => s.enterComponent);
  const deleteChildObjects = useEditorStore((s) => s.deleteChildObjects);
  const pasteObjects = useEditorStore((s) => s.pasteObjects);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);
  const canvas = useEditorStore((s) => s.canvas);
  const designId = useEditorStore((s) => s.designId);
  const loadDocument = useEditorStore((s) => s.loadDocument);
  const markDirty = useEditorStore((s) => s.markDirty);
  const titleState = useEditorStore((s) => s.title);

  const { saveNow } = useAutoSave(stageRef);
  const { uploadImage } = useDesignAssets();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const isMeta = e.metaKey || e.ctrlKey;

      // Preview toggle
      if (e.key === 'Escape' && isPreviewMode) {
        e.preventDefault();
        setPreviewMode(false);
        return;
      }

      // Delete — route to child or top-level
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedIds.length > 0
      ) {
        e.preventDefault();
        if (editingComponentId) {
          deleteChildObjects(selectedIds);
        } else {
          deleteObjects(selectedIds);
        }
        return;
      }

      // Undo
      if (isMeta && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        useEditorStore.temporal.getState().undo();
        return;
      }

      // Redo
      if (isMeta && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        useEditorStore.temporal.getState().redo();
        return;
      }

      // Duplicate
      if (isMeta && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (selectedIds.length > 0) duplicateObjects(selectedIds);
        return;
      }

      // Select all
      if (isMeta && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setSelection(objects.map((o) => o.id));
        return;
      }

      // Save
      if (isMeta && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        saveNow();
        return;
      }

      // Copy
      if (isMeta && (e.key === 'c' || e.key === 'C') && !e.shiftKey) {
        if (selectedIds.length > 0) {
          e.preventDefault();
          const selectedObjs = objects.filter((o) => selectedIds.includes(o.id));
          copyToClipboard(selectedObjs);
        }
        return;
      }

      // Cut
      if (isMeta && (e.key === 'x' || e.key === 'X')) {
        if (selectedIds.length > 0) {
          e.preventDefault();
          const selectedObjs = objects.filter((o) => selectedIds.includes(o.id));
          copyToClipboard(selectedObjs);
          if (editingComponentId) {
            deleteChildObjects(selectedIds);
          } else {
            deleteObjects(selectedIds);
          }
        }
        return;
      }

      // Paste
      if (isMeta && (e.key === 'v' || e.key === 'V') && !e.shiftKey) {
        if (hasClipboardContent()) {
          e.preventDefault();
          const { objects: clipObjs, pasteCount } = getClipboard();
          const offset = (pasteCount + 1) * 20;
          const offsetObjs = clipObjs.map((o) => ({
            ...o,
            x: o.x + offset,
            y: o.y + offset,
            name: pasteCount === 0 ? `${o.name} copy` : `${o.name} copy ${pasteCount + 1}`,
          }));
          incrementPasteCount();
          pasteObjects(offsetObjs);
        }
        return;
      }

      // Escape — exit component or clear selection
      if (e.key === 'Escape') {
        if (editingComponentId) {
          exitComponent();
        } else {
          clearSelection();
          setActiveTool('select');
        }
        return;
      }

      // Enter — enter selected component
      if (e.key === 'Enter' && !editingComponentId && selectedIds.length === 1) {
        const sel = objects.find((o) => o.id === selectedIds[0]);
        if (sel && sel.type === 'interactive') {
          e.preventDefault();
          enterComponent(sel.id, sel.groups[0]?.role || '');
          return;
        }
      }

      // Tool shortcuts
      if (!isMeta) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setActiveTool('select');
            break;
          case 'r':
            setActiveTool('rect');
            break;
          case 'e':
            setActiveTool('ellipse');
            break;
          case 't':
            setActiveTool('text');
            break;
          case 'l':
            setActiveTool('line');
            break;
          case 'p':
            setPreviewMode(!isPreviewMode);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedIds,
    deleteObjects,
    duplicateObjects,
    clearSelection,
    setSelection,
    setActiveTool,
    objects,
    saveNow,
    editingComponentId,
    exitComponent,
    enterComponent,
    deleteChildObjects,
    pasteObjects,
    isPreviewMode,
    setPreviewMode,
  ]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      return uploadImage(file);
    },
    [uploadImage],
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: colors.appBackground,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <EditorToolbar
        onSave={saveNow}
        onShare={() => setShowShare(true)}
        onExport={() => setShowExport(true)}
        onPublish={() => setShowPublish(true)}
        onPreview={() => setPreviewMode(true)}
        onAIGenerate={() => setShowAIGenerate(true)}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <ToolPanel onImageUpload={handleImageUpload} />

        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <EditorCanvas stageRef={stageRef} />
          <GroupTabBar />
        </div>

        {/* Right panel tabs */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Tab switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: colors.white,
              borderLeft: `1px solid ${colors.borderCard}`,
              borderBottom: `1px solid ${colors.borderCard}`,
            }}
          >
            {(['properties', 'layers'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightPanel(tab)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: 11,
                  fontWeight: 600,
                  color:
                    rightPanel === tab ? colors.primary : colors.textLight,
                  borderBottom:
                    rightPanel === tab
                      ? `2px solid ${colors.primary}`
                      : '2px solid transparent',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {rightPanel === 'properties' ? (
            <PropertiesPanel />
          ) : (
            <LayersPanel />
          )}
        </div>
      </div>

      <ShareModal
        visible={showShare}
        onClose={() => setShowShare(false)}
        isShared={isShared}
        shareToken={shareToken}
        onShareChange={onShareChange}
      />

      <ExportModal
        visible={showExport}
        onClose={() => setShowExport(false)}
        stageRef={stageRef}
      />

      <PublishModal
        visible={showPublish}
        onClose={() => setShowPublish(false)}
      />

      <AIGenerateModal
        visible={showAIGenerate}
        onClose={() => setShowAIGenerate(false)}
        canvasSize={{ width: canvas.width, height: canvas.height }}
        onDesignGenerated={(doc: DesignDocument, genTitle: string) => {
          if (objects.length > 0) {
            const ok = window.confirm(
              'This will replace your current design. Continue?',
            );
            if (!ok) return;
          }
          if (designId) {
            loadDocument(designId, genTitle || titleState, {
              ...doc,
              canvas: { ...doc.canvas, width: canvas.width, height: canvas.height },
            });
            markDirty();
          }
        }}
      />

      {isPreviewMode && (
        <PreviewOverlay onClose={() => setPreviewMode(false)} />
      )}

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
