import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useEditorStore } from '../store/editor-store';
import { useTheme } from '../../../contexts/ThemeContext';

interface EditorToolbarProps {
  onSave: () => void;
  onShare: () => void;
  onExport: () => void;
  onPublish: () => void;
  onPreview: () => void;
  onAIGenerate: () => void;
}

export function EditorToolbar({ onSave, onShare, onExport, onPublish, onPreview, onAIGenerate }: EditorToolbarProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const title = useEditorStore((s) => s.title);
  const setTitle = useEditorStore((s) => s.setTitle);
  const isDirty = useEditorStore((s) => s.isDirty);
  const isSaving = useEditorStore((s) => s.isSaving);
  const lastSavedAt = useEditorStore((s) => s.lastSavedAt);
  const editingComponentId = useEditorStore((s) => s.editingComponentId);
  const activeGroupRole = useEditorStore((s) => s.activeGroupRole);
  const exitComponent = useEditorStore((s) => s.exitComponent);
  const objects = useEditorStore((s) => s.objects);

  const editingComponent = editingComponentId
    ? objects.find((o) => o.id === editingComponentId)
    : null;
  const editingName = editingComponent ? editingComponent.name : '';
  const groupLabel = editingComponent && editingComponent.type === 'interactive' && activeGroupRole
    ? editingComponent.groups.find((g) => g.role === activeGroupRole)?.label || ''
    : '';

  // Undo/redo from temporal store
  const temporalStore = useEditorStore.temporal;
  const handleUndo = () => temporalStore.getState().undo();
  const handleRedo = () => temporalStore.getState().redo();

  const saveStatus = isSaving
    ? 'Saving...'
    : isDirty
      ? 'Unsaved'
      : lastSavedAt
        ? 'Saved'
        : '';

  const saveColor = isSaving
    ? colors.textLight
    : isDirty
      ? '#F59E0B'
      : '#22C55E';

  return (
    <div
      style={{
        height: 52,
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.borderCard}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        flexShrink: 0,
      }}
    >
      {/* Back button */}
      <button
        onClick={() => router.push('/(editor)/designs')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          color: colors.textDark,
          padding: '4px 8px',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
        }}
        title="Back to designs"
      >
        ←
      </button>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: colors.textDark,
          border: 'none',
          background: 'none',
          outline: 'none',
          padding: '4px 8px',
          borderRadius: 6,
          minWidth: 120,
          maxWidth: 300,
        }}
        onFocus={(e) => {
          (e.target as HTMLInputElement).style.backgroundColor =
            colors.backgroundLight;
        }}
        onBlur={(e) => {
          (e.target as HTMLInputElement).style.backgroundColor = 'transparent';
        }}
      />

      {/* Breadcrumb when editing component */}
      {editingComponentId && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            color: colors.textLight,
          }}
        >
          <button
            onClick={exitComponent}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: colors.primary,
              fontWeight: 500,
              padding: 0,
            }}
          >
            Canvas
          </button>
          <span>/</span>
          <span style={{ fontWeight: 600, color: colors.textDark }}>
            {editingName}
          </span>
          {groupLabel && (
            <>
              <span>/</span>
              <span style={{ fontWeight: 500 }}>{groupLabel}</span>
            </>
          )}
        </div>
      )}

      {/* Save status */}
      <div
        style={{
          fontSize: 12,
          color: saveColor,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {isSaving && (
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              border: '2px solid',
              borderColor: `${saveColor} transparent transparent transparent`,
              animation: 'spin 1s linear infinite',
            }}
          />
        )}
        {!isSaving && isDirty && (
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: saveColor,
            }}
          />
        )}
        {!isSaving && !isDirty && lastSavedAt && (
          <span style={{ fontSize: 12 }}>✓</span>
        )}
        {saveStatus}
      </div>

      <div style={{ flex: 1 }} />

      {/* Undo / Redo */}
      <div style={{ display: 'flex', gap: 2 }}>
        <button
          onClick={handleUndo}
          title="Undo (Cmd+Z)"
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: 16,
            color: colors.textDark,
          }}
        >
          ↩
        </button>
        <button
          onClick={handleRedo}
          title="Redo (Cmd+Shift+Z)"
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: 16,
            color: colors.textDark,
          }}
        >
          ↪
        </button>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 24,
          backgroundColor: colors.borderCard,
        }}
      />

      {/* AI Generate */}
      <button
        onClick={onAIGenerate}
        title="Generate with AI"
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          border: 'none',
          background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <span style={{ fontSize: 14 }}>&#9733;</span>
        AI Generate
      </button>

      {/* Save */}
      <button
        onClick={onSave}
        title="Save (Cmd+S)"
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          border: `1px solid ${colors.borderCard}`,
          backgroundColor: 'transparent',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          color: colors.textDark,
        }}
      >
        Save
      </button>

      {/* Share */}
      <button
        onClick={onShare}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          border: `1px solid ${colors.borderCard}`,
          backgroundColor: 'transparent',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          color: colors.textDark,
        }}
      >
        Share
      </button>

      {/* Publish */}
      <button
        onClick={onPublish}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          border: `1px solid ${colors.borderCard}`,
          backgroundColor: 'transparent',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          color: colors.textDark,
        }}
      >
        Publish
      </button>

      {/* Preview */}
      <button
        onClick={onPreview}
        title="Preview (P)"
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          border: `1px solid ${colors.borderCard}`,
          backgroundColor: 'transparent',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          color: colors.textDark,
        }}
      >
        Preview
      </button>

      {/* Export */}
      <button
        onClick={onExport}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          backgroundColor: colors.primary,
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          color: '#fff',
        }}
      >
        Export
      </button>
    </div>
  );
}
