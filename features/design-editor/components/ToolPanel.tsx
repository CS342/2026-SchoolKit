import React, { useRef } from 'react';
import { useEditorStore } from '../store/editor-store';
import { createImage } from '../utils/defaults';
import {
  createFlipCard,
  createBottomSheet,
  createExpandable,
  createEntrance,
} from '../utils/interactive-templates';
import { useTheme } from '../../../contexts/ThemeContext';

interface ToolPanelProps {
  onImageUpload: (file: File) => Promise<{ assetId: string; url: string } | null>;
}

const TOOLS = [
  { id: 'select' as const, icon: '↖', label: 'Select (V)', shortcut: 'V' },
  { id: 'rect' as const, icon: '▢', label: 'Rectangle (R)', shortcut: 'R' },
  { id: 'ellipse' as const, icon: '○', label: 'Ellipse (E)', shortcut: 'E' },
  { id: 'text' as const, icon: 'T', label: 'Text (T)', shortcut: 'T' },
  { id: 'line' as const, icon: '╱', label: 'Line (L)', shortcut: 'L' },
  { id: 'image' as const, icon: '🖼', label: 'Image (I)', shortcut: 'I' },
] as const;

const INTERACTIVE_PRESETS = [
  { id: 'flip-card' as const, icon: '🔄', label: 'Flip Card' },
  { id: 'bottom-sheet' as const, icon: '📋', label: 'Bottom Sheet' },
  { id: 'expandable' as const, icon: '📐', label: 'Expandable' },
  { id: 'entrance' as const, icon: '✨', label: 'Entrance' },
] as const;

export function ToolPanel({ onImageUpload }: ToolPanelProps) {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const addObject = useEditorStore((s) => s.addObject);
  const addInteractiveComponent = useEditorStore((s) => s.addInteractiveComponent);
  const canvas = useEditorStore((s) => s.canvas);
  const editingComponentId = useEditorStore((s) => s.editingComponentId);
  const showGrid = useEditorStore((s) => s.showGrid);
  const setShowGrid = useEditorStore((s) => s.setShowGrid);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const setSnapToGrid = useEditorStore((s) => s.setSnapToGrid);
  const snapToObjects = useEditorStore((s) => s.snapToObjects);
  const setSnapToObjects = useEditorStore((s) => s.setSnapToObjects);
  const { colors } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (toolId: typeof TOOLS[number]['id']) => {
    if (toolId === 'image') {
      fileInputRef.current?.click();
      return;
    }
    setActiveTool(toolId);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await onImageUpload(file);
    if (result) {
      addObject(
        createImage(result.assetId, result.url, file.name),
      );
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleAddPreset = (presetId: typeof INTERACTIVE_PRESETS[number]['id']) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    switch (presetId) {
      case 'flip-card':
        addInteractiveComponent(createFlipCard(cx, cy));
        break;
      case 'bottom-sheet':
        addInteractiveComponent(createBottomSheet(cx, cy));
        break;
      case 'expandable':
        addInteractiveComponent(createExpandable(cx, cy));
        break;
      case 'entrance':
        addInteractiveComponent(createEntrance(cx, cy));
        break;
    }
  };

  return (
    <div
      style={{
        width: 56,
        backgroundColor: colors.white,
        borderRight: `1px solid ${colors.borderCard}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 12,
        gap: 4,
      }}
    >
      {TOOLS.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            title={tool.label}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: 'none',
              backgroundColor: isActive ? colors.primary : 'transparent',
              color: isActive ? '#fff' : colors.textDark,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              transition: 'background-color 0.1s',
            }}
          >
            {tool.icon}
          </button>
        );
      })}

      {/* Divider */}
      {!editingComponentId && (
        <>
          <div
            style={{
              width: 28,
              height: 1,
              backgroundColor: colors.borderCard,
              margin: '6px 0',
            }}
          />

          {/* Interactive presets */}
          {INTERACTIVE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleAddPreset(preset.id)}
              title={preset.label}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: 'none',
                backgroundColor: 'transparent',
                color: colors.textDark,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                transition: 'background-color 0.1s',
              }}
            >
              {preset.icon}
            </button>
          ))}
        </>
      )}

      {/* Divider before view/snap toggles */}
      <div
        style={{
          width: 28,
          height: 1,
          backgroundColor: colors.borderCard,
          margin: '6px 0',
        }}
      />

      {/* Grid toggle */}
      <button
        onClick={() => setShowGrid(!showGrid)}
        title={showGrid ? 'Hide Grid' : 'Show Grid'}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: 'none',
          backgroundColor: showGrid ? colors.primary : 'transparent',
          color: showGrid ? '#fff' : colors.textDark,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          transition: 'background-color 0.1s',
        }}
      >
        #
      </button>

      {/* Grid snap toggle */}
      <button
        onClick={() => setSnapToGrid(!snapToGrid)}
        title={snapToGrid ? 'Disable Grid Snap' : 'Enable Grid Snap'}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: 'none',
          backgroundColor: snapToGrid ? '#6366F1' : 'transparent',
          color: snapToGrid ? '#fff' : colors.textDark,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 600,
          transition: 'background-color 0.1s',
        }}
      >
        ⊞
      </button>

      {/* Magnetic snap toggle */}
      <button
        onClick={() => setSnapToObjects(!snapToObjects)}
        title={snapToObjects ? 'Disable Magnetic Snap' : 'Enable Magnetic Snap'}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: 'none',
          backgroundColor: snapToObjects ? '#7B68EE' : 'transparent',
          color: snapToObjects ? '#fff' : colors.textDark,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          transition: 'background-color 0.1s',
        }}
      >
        🧲
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
