import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

export interface ContextMenuItem {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const { colors } = useTheme();

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9990,
        }}
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      {/* Menu */}
      <div
        style={{
          position: 'fixed',
          left: x,
          top: y,
          zIndex: 9991,
          backgroundColor: colors.white,
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)',
          padding: '4px 0',
          minWidth: 180,
          animation: 'fade-in-up 0.12s ease-out',
        }}
      >
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {item.divider && i > 0 && (
              <div
                style={{
                  height: 1,
                  backgroundColor: colors.borderCard,
                  margin: '4px 8px',
                }}
              />
            )}
            <button
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  onClose();
                }
              }}
              disabled={item.disabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '6px 12px',
                border: 'none',
                background: 'none',
                cursor: item.disabled ? 'default' : 'pointer',
                fontSize: 12,
                color: item.disabled
                  ? colors.textLight
                  : item.danger
                    ? '#EF4444'
                    : colors.textDark,
                opacity: item.disabled ? 0.5 : 1,
                textAlign: 'left',
                transition: 'background-color 0.1s',
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = colors.backgroundLight;
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <span
                  style={{
                    fontSize: 10,
                    color: colors.textLight,
                    fontFamily: 'monospace',
                    marginLeft: 16,
                  }}
                >
                  {item.shortcut}
                </span>
              )}
            </button>
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
