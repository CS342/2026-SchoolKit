import React from 'react';
import { useEditorStore } from '../store/editor-store';
import type { DesignObject, InteractiveComponentObject, StaticDesignObject } from '../types/document';
import { PreviewObject } from './preview/PreviewObject';
import { PreviewFlipCard } from './preview/PreviewFlipCard';
import { PreviewBottomSheet } from './preview/PreviewBottomSheet';
import { PreviewExpandable } from './preview/PreviewExpandable';
import { PreviewEntrance } from './preview/PreviewEntrance';

interface PreviewOverlayProps {
  onClose: () => void;
}

export function PreviewOverlay({ onClose }: PreviewOverlayProps) {
  const canvas = useEditorStore((s) => s.canvas);
  const objects = useEditorStore((s) => s.objects);

  // Scale to fit the viewport
  const maxWidth = window.innerWidth - 80;
  const maxHeight = window.innerHeight - 120;
  const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height, 1);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Close button */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 24,
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          Press Escape to close
        </span>
        <button
          onClick={onClose}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.3)',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
        >
          Close Preview
        </button>
      </div>

      {/* Scaled canvas wrapper — sized to the visual output */}
      <div
        style={{
          width: canvas.width * scale,
          height: canvas.height * scale,
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 4px 40px rgba(0,0,0,0.4)',
          position: 'relative',
        }}
      >
        {/* Full-size canvas — objects render at original coordinates,
            then the whole thing is scaled down via CSS transform */}
        <div
          style={{
            width: canvas.width,
            height: canvas.height,
            backgroundColor: canvas.background,
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          {objects
            .filter((o) => o.visible)
            .map((obj) => (
              <PreviewDesignObject key={obj.id} object={obj} />
            ))}
        </div>
      </div>

      {/* Label */}
      <div
        style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: 12,
          marginTop: 16,
          fontWeight: 500,
        }}
      >
        Interactive Preview — Click to interact
      </div>
    </div>
  );
}

function PreviewDesignObject({ object }: { object: DesignObject }) {
  if (object.type === 'interactive') {
    return <PreviewInteractive object={object} />;
  }
  return <PreviewObject object={object as StaticDesignObject} />;
}

function PreviewInteractive({ object }: { object: InteractiveComponentObject }) {
  switch (object.interactionType) {
    case 'flip-card':
      return <PreviewFlipCard object={object} />;
    case 'bottom-sheet':
      return <PreviewBottomSheet object={object} />;
    case 'expandable':
      return <PreviewExpandable object={object} />;
    case 'entrance':
      return <PreviewEntrance object={object} />;
    default:
      return null;
  }
}
