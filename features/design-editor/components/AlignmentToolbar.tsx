import React from 'react';
import { useEditorStore } from '../store/editor-store';
import { useTheme } from '../../../contexts/ThemeContext';

type Alignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
type Distribution = 'horizontal' | 'vertical';

const ALIGN_BUTTONS: { align: Alignment; icon: string; title: string }[] = [
  { align: 'left', icon: '⫷', title: 'Align Left' },
  { align: 'center', icon: '⫿', title: 'Align Center' },
  { align: 'right', icon: '⫸', title: 'Align Right' },
  { align: 'top', icon: '⊤', title: 'Align Top' },
  { align: 'middle', icon: '⊝', title: 'Align Middle' },
  { align: 'bottom', icon: '⊥', title: 'Align Bottom' },
];

const DISTRIBUTE_BUTTONS: { dir: Distribution; icon: string; title: string }[] = [
  { dir: 'horizontal', icon: '⇔', title: 'Distribute Horizontally' },
  { dir: 'vertical', icon: '⇕', title: 'Distribute Vertically' },
];

export function AlignmentToolbar() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const alignObjects = useEditorStore((s) => s.alignObjects);
  const distributeObjects = useEditorStore((s) => s.distributeObjects);
  const { colors } = useTheme();

  const count = selectedIds.length;
  if (count === 0) return null;

  const label = count === 1 ? 'Align to Canvas' : 'Align Objects';

  const btnStyle: React.CSSProperties = {
    width: 30,
    height: 28,
    borderRadius: 6,
    border: `1px solid ${colors.borderCard}`,
    backgroundColor: colors.appBackground,
    color: colors.textDark,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    padding: 0,
  };

  const disabledStyle: React.CSSProperties = {
    ...btnStyle,
    opacity: 0.35,
    cursor: 'not-allowed',
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: colors.textLight,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 8,
        }}
      >
        {label}
      </div>

      {/* Alignment row */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        {ALIGN_BUTTONS.map((btn) => (
          <button
            key={btn.align}
            title={btn.title}
            style={btnStyle}
            onClick={() => alignObjects(selectedIds, btn.align)}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* Distribute row */}
      <div style={{ display: 'flex', gap: 4 }}>
        {DISTRIBUTE_BUTTONS.map((btn) => (
          <button
            key={btn.dir}
            title={btn.title}
            style={count >= 3 ? btnStyle : disabledStyle}
            disabled={count < 3}
            onClick={() => distributeObjects(selectedIds, btn.dir)}
          >
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
