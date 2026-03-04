import React from 'react';
import { useEditorStore } from '../store/editor-store';
import { useTheme } from '../../../contexts/ThemeContext';
import { createSlideChildren, createTabChildren, createSheetContentChildren } from '../utils/interactive-templates';

export function GroupTabBar() {
  const editingComponentId = useEditorStore((s) => s.editingComponentId);
  const activeGroupRole = useEditorStore((s) => s.activeGroupRole);
  const switchGroup = useEditorStore((s) => s.switchGroup);
  const exitComponent = useEditorStore((s) => s.exitComponent);
  const addGroup = useEditorStore((s) => s.addGroup);
  const removeGroup = useEditorStore((s) => s.removeGroup);
  const objects = useEditorStore((s) => s.objects);
  const { colors } = useTheme();

  if (!editingComponentId) return null;

  const component = objects.find((o) => o.id === editingComponentId);
  if (!component || component.type !== 'interactive') return null;

  const supportsAddRemove = ['carousel', 'tabs', 'bottom-sheet'].includes(component.interactionType);
  const dynamicGroups = component.interactionType === 'carousel'
    ? component.groups.filter(g => g.role.startsWith('slide-'))
    : component.interactionType === 'tabs'
    ? component.groups.filter(g => g.role.startsWith('tab-'))
    : component.interactionType === 'bottom-sheet'
    ? component.groups.filter(g => g.role.startsWith('content'))
    : [];
  const minGroups = component.interactionType === 'bottom-sheet' ? 1 : 2;
  const maxGroups = 10;

  const handleAddGroup = () => {
    const index = dynamicGroups.length;
    let role: string;
    let label: string;
    let children;

    if (component.interactionType === 'carousel') {
      role = `slide-${index}`;
      label = `Slide ${index + 1}`;
      children = createSlideChildren(index, component.width, component.height);
    } else if (component.interactionType === 'tabs') {
      role = `tab-${index}`;
      label = `Tab ${index + 1}`;
      children = createTabChildren(index, component.width, component.height, index + 1);
    } else {
      role = `content-${index}`;
      label = `Sheet ${index + 1}`;
      children = createSheetContentChildren(index, component.width);
    }

    addGroup(component.id, { role, label }, children);
    switchGroup(role);
  };

  const handleRemoveGroup = (groupRole: string) => {
    removeGroup(component.id, groupRole);
  };

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
        const isDynamic = supportsAddRemove && dynamicGroups.some(g => g.role === group.role);
        const canRemove = isDynamic && dynamicGroups.length > minGroups;
        return (
          <div
            key={group.role}
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
          >
            <button
              onClick={() => switchGroup(group.role)}
              style={{
                padding: canRemove ? '6px 24px 6px 14px' : '6px 14px',
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
            {canRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveGroup(group.role); }}
                title={`Remove ${group.label}`}
                style={{
                  position: 'absolute',
                  right: 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                  color: isActive ? '#fff' : colors.textLight,
                  cursor: 'pointer',
                  fontSize: 10,
                  lineHeight: '16px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      {/* Add group button */}
      {supportsAddRemove && dynamicGroups.length < maxGroups && (
        <button
          onClick={handleAddGroup}
          title={`Add ${component.interactionType === 'carousel' ? 'slide' : component.interactionType === 'tabs' ? 'tab' : 'sheet'}`}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: `1px dashed ${colors.borderCard}`,
            backgroundColor: 'transparent',
            color: colors.textLight,
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: '28px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
      )}
    </div>
  );
}
