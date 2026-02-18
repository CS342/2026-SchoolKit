import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useEditorStore } from '../store/editor-store';
import { useTheme } from '../../../contexts/ThemeContext';

interface EditorToolbarProps {
  onSave: () => void;
  onShare: () => void;
  onExport: () => void;
  onPublish: () => void;
}

export function EditorToolbar({ onSave, onShare, onExport, onPublish }: EditorToolbarProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const title = useEditorStore((s) => s.title);
  const setTitle = useEditorStore((s) => s.setTitle);
  const isDirty = useEditorStore((s) => s.isDirty);
  const isSaving = useEditorStore((s) => s.isSaving);
  const lastSavedAt = useEditorStore((s) => s.lastSavedAt);

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
