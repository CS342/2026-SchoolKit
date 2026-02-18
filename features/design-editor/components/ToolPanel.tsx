import React, { useRef } from 'react';
import { useEditorStore } from '../store/editor-store';
import { createImage } from '../utils/defaults';
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

export function ToolPanel({ onImageUpload }: ToolPanelProps) {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const addObject = useEditorStore((s) => s.addObject);
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
