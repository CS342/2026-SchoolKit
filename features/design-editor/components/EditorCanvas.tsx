import React, { useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '../store/editor-store';
import { CanvasObject } from './CanvasObject';
import { SelectionTransformer } from './SelectionTransformer';
import {
  createRect,
  createEllipse,
  createText,
  createLine,
} from '../utils/defaults';

interface EditorCanvasProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export function EditorCanvas({ stageRef }: EditorCanvasProps) {
  const canvas = useEditorStore((s) => s.canvas);
  const objects = useEditorStore((s) => s.objects);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const activeTool = useEditorStore((s) => s.activeTool);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const addObject = useEditorStore((s) => s.addObject);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);

  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const clickedOnEmpty =
        e.target === e.target.getStage() ||
        e.target.attrs.id === 'canvas-background';

      if (clickedOnEmpty) {
        if (activeTool === 'select') {
          clearSelection();
          return;
        }

        // Get click position relative to stage
        const stage = e.target.getStage();
        if (!stage) return;
        const pos = stage.getPointerPosition();
        if (!pos) return;

        // Create object at click position
        const x = pos.x / zoom;
        const y = pos.y / zoom;

        switch (activeTool) {
          case 'rect':
            addObject(createRect({ x, y }));
            break;
          case 'ellipse':
            addObject(createEllipse({ x, y }));
            break;
          case 'text':
            addObject(createText({ x, y }));
            break;
          case 'line':
            addObject(createLine({ points: [x, y, x + 200, y] }));
            break;
        }
        setActiveTool('select');
      }
    },
    [activeTool, clearSelection, addObject, setActiveTool, zoom],
  );

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const newZoom = e.evt.deltaY > 0
      ? Math.max(0.25, zoom / scaleBy)
      : Math.min(3, zoom * scaleBy);
    setZoom(newZoom);
  }, [zoom]);

  // Compute canvas position centered in container
  const containerStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor:
      activeTool === 'select'
        ? 'default'
        : 'crosshair',
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      {/* Zoom indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: '#fff',
          padding: '4px 10px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            padding: '0 4px',
          }}
        >
          -
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(Math.min(3, zoom + 0.1))}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            padding: '0 4px',
          }}
        >
          +
        </button>
        <button
          onClick={() => setZoom(1)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 11,
            padding: '0 4px',
            opacity: 0.7,
          }}
        >
          Reset
        </button>
      </div>

      <Stage
        ref={stageRef}
        width={canvas.width * zoom}
        height={canvas.height * zoom}
        scaleX={zoom}
        scaleY={zoom}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onWheel={handleWheel}
        style={{
          boxShadow: '0 2px 20px rgba(0,0,0,0.15)',
          borderRadius: 2,
        }}
      >
        <Layer>
          {/* Canvas background */}
          <Rect
            id="canvas-background"
            x={0}
            y={0}
            width={canvas.width}
            height={canvas.height}
            fill={canvas.background}
          />

          {/* Render all visible objects in order (index = z-order) */}
          {objects
            .filter((o) => o.visible)
            .map((obj) => (
              <CanvasObject
                key={obj.id}
                object={obj}
                isSelected={selectedIds.includes(obj.id)}
              />
            ))}

          {/* Transformer for selected objects */}
          <SelectionTransformer stageRef={stageRef} />
        </Layer>
      </Stage>
    </div>
  );
}
