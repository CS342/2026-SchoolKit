import React from 'react';
import { useEditorStore } from '../store/editor-store';
import { useTheme } from '../../../contexts/ThemeContext';

export function GroupTabBar() {
  const editingComponentId = useEditorStore((s) => s.editingComponentId);
  const activeGroupRole = useEditorStore((s) => s.activeGroupRole);
  const switchGroup = useEditorStore((s) => s.switchGroup);
  const exitComponent = useEditorStore((s) => s.exitComponent);
  const objects = useEditorStore((s) => s.objects);
  const { colors } = useTheme();

  if (!editingComponentId) return null;

  const component = objects.find((o) => o.id === editingComponentId);
  if (!component || component.type !== 'interactive') return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 10,
        padding: '4px 6px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Exit button */}
      <button
        onClick={exitComponent}
        title="Exit component (Escape)"
        style={{
          padding: '6px 10px',
          borderRadius: 6,
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          fontSize: 14,
          color: colors.textDark,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span style={{ fontSize: 16 }}>←</span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{component.name}</span>
      </button>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 20,
          backgroundColor: colors.borderCard,
        }}
      />

      {/* Group tabs */}
      {component.groups.map((group) => {
        const isActive = activeGroupRole === group.role;
        return (
          <button
            key={group.role}
            onClick={() => switchGroup(group.role)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: isActive ? colors.primary : 'transparent',
              color: isActive ? '#fff' : colors.textDark,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            {group.label}
          </button>
        );
      })}
    </div>
  );
}
