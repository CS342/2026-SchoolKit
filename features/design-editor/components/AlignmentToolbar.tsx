import React from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../store/editor-store';
import { useTheme } from '../../../contexts/ThemeContext';

type Alignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
type Distribution = 'horizontal' | 'vertical';

const ALIGN_BUTTONS: { align: Alignment; icon: string; titleKey: string }[] = [
  { align: 'left', icon: '⫷', titleKey: 'left' },
  { align: 'center', icon: '⫿', titleKey: 'center' },
  { align: 'right', icon: '⫸', titleKey: 'right' },
  { align: 'top', icon: '⊤', titleKey: 'top' },
  { align: 'middle', icon: '⊝', titleKey: 'middle' },
  { align: 'bottom', icon: '⊥', titleKey: 'bottom' },
];

const DISTRIBUTE_BUTTONS: { dir: Distribution; icon: string; titleKey: string }[] = [
  { dir: 'horizontal', icon: '⇔', titleKey: 'horizontal' },
  { dir: 'vertical', icon: '⇕', titleKey: 'vertical' },
];

export function AlignmentToolbar() {
  const { t } = useTranslation();
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const alignObjects = useEditorStore((s) => s.alignObjects);
  const distributeObjects = useEditorStore((s) => s.distributeObjects);
  const { colors } = useTheme();

  const count = selectedIds.length;
  if (count === 0) return null;

  const label = count === 1 ? t('design.editor.alignToCanvas') : t('design.editor.alignObjects');

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
            title={t(`design.editor.align.${btn.titleKey}`)}
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
            title={t(`design.editor.distribute.${btn.titleKey}`)}
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
