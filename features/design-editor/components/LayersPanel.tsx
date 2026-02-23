import React from 'react';
import { useEditorStore } from '../store/editor-store';
import { useTheme } from '../../../contexts/ThemeContext';

const TYPE_ICONS: Record<string, string> = {
  rect: '▢',
  ellipse: '○',
  text: 'T',
  image: '🖼',
  line: '╱',
  interactive: '⚡',
};

export function LayersPanel() {
  const objects = useEditorStore((s) => s.objects);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setSelection = useEditorStore((s) => s.setSelection);
  const updateObject = useEditorStore((s) => s.updateObject);
  const reorderObject = useEditorStore((s) => s.reorderObject);
  const deleteObjects = useEditorStore((s) => s.deleteObjects);
  const { colors } = useTheme();

  // Display in reverse order (top layer first)
  const reversedObjects = [...objects].reverse();

  return (
    <div
      style={{
        width: 260,
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
          fontSize: 12,
          fontWeight: 600,
          color: colors.textLight,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        Layers ({objects.length})
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {reversedObjects.map((obj) => {
          const isSelected = selectedIds.includes(obj.id);
          const realIndex = objects.findIndex((o) => o.id === obj.id);

          return (
            <div
              key={obj.id}
              onClick={() => setSelection([obj.id])}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 14px',
                cursor: 'pointer',
                backgroundColor: isSelected
                  ? colors.backgroundLight
                  : 'transparent',
                borderLeft: isSelected
                  ? `3px solid ${colors.primary}`
                  : '3px solid transparent',
                gap: 8,
                fontSize: 13,
                transition: 'background-color 0.1s',
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

              {/* Name */}
              <span
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

              {/* Controls */}
              <div
                style={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                {/* Visibility toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateObject(obj.id, { visible: !obj.visible });
                  }}
                  title={obj.visible ? 'Hide' : 'Show'}
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
