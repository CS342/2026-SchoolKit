import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useEditorStore } from '../store/editor-store';
import Konva from 'konva';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  stageRef: React.RefObject<Konva.Stage | null>;
}

export function ExportModal({ visible, onClose, stageRef }: ExportModalProps) {
  const { colors } = useTheme();
  const title = useEditorStore((s) => s.title);

  if (!visible) return null;

  const exportAs = (mimeType: string, extension: string, quality?: number) => {
    if (!stageRef.current) return;

    const dataUrl = stageRef.current.toDataURL({
      pixelRatio: 2,
      mimeType,
      quality,
    });

    const link = document.createElement('a');
    link.download = `${title || 'design'}.${extension}`;
    link.href = dataUrl;
    link.click();
    onClose();
  };

  const exportOptions = [
    {
      label: 'PNG',
      description: 'High quality, transparent background support',
      onClick: () => exportAs('image/png', 'png'),
    },
    {
      label: 'JPEG',
      description: 'Smaller file size, no transparency',
      onClick: () => exportAs('image/jpeg', 'jpg', 0.92),
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: 16,
          padding: 28,
          width: 360,
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: colors.textDark,
            margin: '0 0 4px',
          }}
        >
          Export Design
        </h3>
        <p
          style={{
            fontSize: 14,
            color: colors.textLight,
            margin: '0 0 20px',
          }}
        >
          Download your design as an image
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {exportOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={opt.onClick}
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                border: `1px solid ${colors.borderCard}`,
                backgroundColor: colors.appBackground,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.1s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  colors.primary;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  colors.borderCard;
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: colors.textDark,
                  marginBottom: 2,
                }}
              >
                {opt.label}
              </div>
              <div style={{ fontSize: 12, color: colors.textLight }}>
                {opt.description}
              </div>
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 16,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${colors.borderCard}`,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              color: colors.textDark,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
