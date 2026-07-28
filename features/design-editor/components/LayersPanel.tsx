import React, { useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import { useTheme } from '../../../contexts/ThemeContext';

const TYPE_ICONS: Record<string, string> = {
  rect: '▢',
  ellipse: '○',
  text: 'T',
  image: '🖼',
  line: '╱',
  star: '★',
  triangle: '△',
  arrow: '→',
  badge: '⬭',
  icon: '✦',
  interactive: '⚡',
};

export function LayersPanel() {
  const objects = useEditorStore((s) => s.objects);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setSelection = useEditorStore((s) => s.setSelection);
  const updateObject = useEditorStore((s) => s.updateObject);
  const reorderObject = useEditorStore((s) => s.reorderObject);
  const { colors } = useTheme();

  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Display in reverse order (top layer first)
  const reversedObjects = [...objects].reverse();

  const handleLayerClick = (e: React.MouseEvent, id: string) => {
    const isAdditive = e.shiftKey || e.metaKey || e.ctrlKey;
    if (isAdditive) {
      setSelection(
        selectedIds.includes(id)
          ? selectedIds.filter((x) => x !== id)
          : [...selectedIds, id],
      );
    } else {
      setSelection([id]);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Required for Firefox
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragId && dragId !== id) setDropTargetId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTargetId(null);
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    // Reverse-display order: the dropped-on row corresponds to objects[N - displayIndex - 1].
    // reorderObject expects the new absolute index in the objects array.
    const targetIdx = objects.findIndex((o) => o.id === targetId);
    if (targetIdx >= 0) reorderObject(dragId, targetIdx);
    setDragId(null);
  };

  const startRename = (id: string, currentName: string) => {
    setRenameId(id);
    setRenameValue(currentName);
  };

  const commitRename = () => {
    if (renameId && renameValue.trim()) {
      updateObject(renameId, { name: renameValue.trim() });
    }
    setRenameId(null);
    setRenameValue('');
  };

  return (
    <div
      style={{
        width: 240,
        backgroundColor: colors.white,
        borderLeft: `1px solid ${colors.borderCard}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${colors.borderCard}`,
          fontSize: 11,
          fontWeight: 600,
          color: colors.textDark,
          letterSpacing: 0.3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>Layers</span>
        <span
          style={{
            fontSize: 10,
            color: colors.textLight,
            backgroundColor: colors.appBackground,
            padding: '1px 6px',
            borderRadius: 8,
            fontWeight: 500,
          }}
        >
          {objects.length}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {reversedObjects.map((obj) => {
          const isSelected = selectedIds.includes(obj.id);
          const realIndex = objects.findIndex((o) => o.id === obj.id);
          const isDropTarget = dropTargetId === obj.id;
          const isBeingDragged = dragId === obj.id;

          return (
            <div
              key={obj.id}
              draggable={renameId !== obj.id}
              onDragStart={(e) => handleDragStart(e, obj.id)}
              onDragOver={(e) => handleDragOver(e, obj.id)}
              onDrop={(e) => handleDrop(e, obj.id)}
              onDragEnd={() => {
                setDragId(null);
                setDropTargetId(null);
              }}
              onClick={(e) => handleLayerClick(e, obj.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 14px',
                cursor: 'pointer',
                backgroundColor: isSelected
                  ? colors.backgroundLight
                  : isDropTarget
                    ? `${colors.primary}11`
                    : 'transparent',
                borderLeft: isSelected
                  ? `3px solid ${colors.primary}`
                  : '3px solid transparent',
                borderTop: isDropTarget ? `2px solid ${colors.primary}` : '2px solid transparent',
                gap: 8,
                fontSize: 13,
                transition: 'background-color 0.1s',
                opacity: isBeingDragged ? 0.4 : 1,
              }}
            >
              {/* Type icon */}
              <span
                style={{
                  width: 20,
                  textAlign: 'center',
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {TYPE_ICONS[obj.type] || '?'}
              </span>

              {/* Name (rename via double-click) */}
              {renameId === obj.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') {
                      setRenameId(null);
                      setRenameValue('');
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '2px 6px',
                    borderRadius: 4,
                    border: `1px solid ${colors.primary}`,
                    fontSize: 13,
                    color: colors.textDark,
                    backgroundColor: colors.white,
                    outline: 'none',
                  }}
                />
              ) : (
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startRename(obj.id, obj.name);
                  }}
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: obj.visible ? colors.textDark : colors.textLight,
                    opacity: obj.visible ? 1 : 0.5,
                  }}
                >
                  {obj.name}
                </span>
              )}

              {/* Controls */}
              <div
                style={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                {/* Lock toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateObject(obj.id, { locked: !obj.locked });
                  }}
                  title={obj.locked ? 'Unlock' : 'Lock'}
                  aria-label={obj.locked ? 'Unlock layer' : 'Lock layer'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: '2px 4px',
                    opacity: obj.locked ? 0.8 : 0.3,
                    color: obj.locked ? colors.primary : colors.textDark,
                  }}
                >
                  {obj.locked ? '🔒' : '🔓'}
                </button>

                {/* Visibility toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateObject(obj.id, { visible: !obj.visible });
                  }}
                  title={obj.visible ? 'Hide' : 'Show'}
                  aria-label={obj.visible ? 'Hide layer' : 'Show layer'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: '2px 4px',
                    opacity: obj.visible ? 0.6 : 0.3,
                    color: colors.textDark,
                  }}
                >
                  {obj.visible ? '👁' : '👁‍🗨'}
                </button>

                {/* Move up */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (realIndex < objects.length - 1) {
                      reorderObject(obj.id, realIndex + 1);
                    }
                  }}
                  disabled={realIndex >= objects.length - 1}
                  title="Move up"
                  aria-label="Move layer up"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 10,
                    padding: '2px 3px',
                    opacity: realIndex >= objects.length - 1 ? 0.2 : 0.6,
                    color: colors.textDark,
                  }}
                >
                  ▲
                </button>

                {/* Move down */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (realIndex > 0) {
                      reorderObject(obj.id, realIndex - 1);
                    }
                  }}
                  disabled={realIndex <= 0}
                  title="Move down"
                  aria-label="Move layer down"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 10,
                    padding: '2px 3px',
                    opacity: realIndex <= 0 ? 0.2 : 0.6,
                    color: colors.textDark,
                  }}
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}

        {objects.length === 0 && (
          <div
            style={{
              padding: 20,
              textAlign: 'center',
              fontSize: 13,
              color: colors.textLight,
            }}
          >
            No objects yet
          </div>
        )}
      </div>
    </div>
  );
}
