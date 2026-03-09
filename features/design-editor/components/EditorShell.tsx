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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

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
  const moveToFront = useEditorStore((s) => s.moveToFront);
  const moveToBack = useEditorStore((s) => s.moveToBack);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);
  const canvas = useEditorStore((s) => s.canvas);
  const designId = useEditorStore((s) => s.designId);
  const loadDocument = useEditorStore((s) => s.loadDocument);
  const markDirty = useEditorStore((s) => s.markDirty);
  const titleState = useEditorStore((s) => s.title);
  const getDocument = useEditorStore((s) => s.getDocument);

  const { saveNow } = useAutoSave(stageRef);
  const { uploadImage } = useDesignAssets();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 1500);
  }, []);

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
        if (selectedIds.length > 0) {
          duplicateObjects(selectedIds);
          showToast(`Duplicated ${selectedIds.length} object${selectedIds.length > 1 ? 's' : ''}`);
        }
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

      // Bring to front (Cmd+])
      if (isMeta && e.key === ']' && selectedIds.length > 0) {
        e.preventDefault();
        moveToFront(selectedIds);
        showToast('Moved to front');
        return;
      }

      // Send to back (Cmd+[)
      if (isMeta && e.key === '[' && selectedIds.length > 0) {
        e.preventDefault();
        moveToBack(selectedIds);
        showToast('Moved to back');
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
        switch (e.key) {
          case 'v': case 'V': setActiveTool('select'); break;
          case 'r': case 'R': setActiveTool('rect'); break;
          case 'e': case 'E': setActiveTool('ellipse'); break;
          case 't': case 'T': setActiveTool('text'); break;
          case 'l': case 'L': setActiveTool('line'); break;
          case 'p': case 'P': setPreviewMode(!isPreviewMode); break;
          case '?': setShowShortcuts(true); break;
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
    moveToFront,
    moveToBack,
    isPreviewMode,
    setPreviewMode,
    showToast,
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
        onShowShortcuts={() => setShowShortcuts(true)}
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
        existingDocument={objects.length > 0 ? getDocument() : null}
        onDesignGenerated={(doc: DesignDocument, genTitle: string) => {
          if (designId) {
            loadDocument(designId, genTitle || titleState, {
              ...doc,
              canvas: {
                ...doc.canvas,
                width: canvas.width,
                height: Math.max(canvas.height, doc.canvas.height),
              },
            });
            markDirty();
          }
        }}
      />

      {isPreviewMode && (
        <PreviewOverlay onClose={() => setPreviewMode(false)} />
      )}

      {/* Toast notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '8px 20px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 9999,
            animation: 'fade-in-up 0.2s ease-out',
            pointerEvents: 'none',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
          }}
          onClick={() => setShowShortcuts(false)}
        >
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: 16,
              padding: 24,
              width: 420,
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.textDark }}>Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: colors.textLight }}
              >
                ×
              </button>
            </div>
            {[
              ['Tools', [
                ['V', 'Select tool'],
                ['R', 'Rectangle tool'],
                ['E', 'Ellipse tool'],
                ['T', 'Text tool'],
                ['L', 'Line tool'],
                ['P', 'Toggle preview'],
              ]],
              ['Edit', [
                ['⌘ Z', 'Undo'],
                ['⌘ ⇧ Z', 'Redo'],
                ['⌘ D', 'Duplicate'],
                ['⌘ A', 'Select all'],
                ['⌘ C', 'Copy'],
                ['⌘ X', 'Cut'],
                ['⌘ V', 'Paste'],
                ['⌘ S', 'Save'],
                ['Delete', 'Delete selected'],
              ]],
              ['Layers', [
                ['⌘ ]', 'Bring to front'],
                ['⌘ [', 'Send to back'],
              ]],
              ['Navigation', [
                ['Enter', 'Edit component'],
                ['Escape', 'Exit / deselect'],
                ['?', 'Show shortcuts'],
              ]],
            ].map(([section, shortcuts]) => (
              <div key={section as string} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.textLight, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                  {section as string}
                </div>
                {(shortcuts as string[][]).map(([key, desc]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                    <span style={{ color: colors.textDark }}>{desc}</span>
                    <kbd style={{
                      backgroundColor: colors.backgroundLight,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: colors.textDark,
                      border: `1px solid ${colors.borderCard}`,
                      fontFamily: 'monospace',
                    }}>
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSS for spinner + generation progress animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
