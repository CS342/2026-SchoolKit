import React, { useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Group, Text, Ellipse, Image as KonvaImage, Line } from 'react-konva';
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
import type { StaticDesignObject } from '../types/document';
import { CANVAS_EXTEND_INCREMENT } from '../types/document';

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
  const editingComponentId = useEditorStore((s) => s.editingComponentId);
  const activeGroupRole = useEditorStore((s) => s.activeGroupRole);
  const addChildObject = useEditorStore((s) => s.addChildObject);
  const updateChildObject = useEditorStore((s) => s.updateChildObject);
  const setSelection = useEditorStore((s) => s.setSelection);

  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get the editing component and active group's children
  const editingComponent = editingComponentId
    ? objects.find((o) => o.id === editingComponentId && o.type === 'interactive')
    : null;
  const activeGroup = editingComponent && editingComponent.type === 'interactive' && activeGroupRole
    ? editingComponent.groups.find((g) => g.role === activeGroupRole)
    : null;
  const groupChildren = editingComponent && editingComponent.type === 'interactive' && activeGroup
    ? editingComponent.children.filter((c) => activeGroup.objectIds.includes(c.id))
    : [];

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const clickedOnEmpty =
        e.target === e.target.getStage() ||
        e.target.attrs.id === 'canvas-background' ||
        e.target.attrs.id === 'dimming-overlay';

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

        // If in component editing mode, add child objects
        if (editingComponentId && activeGroupRole) {
          const compObj = objects.find((o) => o.id === editingComponentId);
          const offsetX = compObj ? compObj.x : 0;
          const offsetY = compObj ? compObj.y : 0;
          const localX = x - offsetX;
          const localY = y - offsetY;

          let newChild: StaticDesignObject | null = null;
          switch (activeTool) {
            case 'rect':
              newChild = createRect({ x: localX, y: localY });
              break;
            case 'ellipse':
              newChild = createEllipse({ x: localX, y: localY });
              break;
            case 'text':
              newChild = createText({ x: localX, y: localY });
              break;
            case 'line':
              newChild = createLine({ points: [localX, localY, localX + 200, localY] });
              break;
          }
          if (newChild) {
            addChildObject(newChild);
          }
        } else {
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
        }
        setActiveTool('select');
      }
    },
    [activeTool, clearSelection, addObject, setActiveTool, zoom, editingComponentId, activeGroupRole, addChildObject, objects],
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

          {editingComponentId && editingComponent ? (
            <>
              {/* Dimmed top-level objects */}
              {objects
                .filter((o) => o.visible && o.id !== editingComponentId)
                .map((obj) => (
                  <CanvasObject
                    key={obj.id}
                    object={obj}
                    isSelected={false}
                  />
                ))}

              {/* Dimming overlay */}
              <Rect
                id="dimming-overlay"
                x={0}
                y={0}
                width={canvas.width}
                height={canvas.height}
                fill="rgba(0,0,0,0.3)"
              />

              {/* Active group children — rendered as editable objects */}
              {groupChildren.filter((c) => c.visible).map((child) => (
                <EditableChildObject
                  key={child.id}
                  object={child}
                  parentX={editingComponent.x}
                  parentY={editingComponent.y}
                  isSelected={selectedIds.includes(child.id)}
                />
              ))}

              <SelectionTransformer stageRef={stageRef} />
            </>
          ) : (
            <>
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
            </>
          )}
        </Layer>
      </Stage>
    </div>
  );
}

/** Renders a child object inside component editing mode — positioned relative to parent. */
function EditableChildObject({
  object,
  parentX,
  parentY,
  isSelected,
}: {
  object: StaticDesignObject;
  parentX: number;
  parentY: number;
  isSelected: boolean;
}) {
  const updateChildObject = useEditorStore((s) => s.updateChildObject);
  const setSelection = useEditorStore((s) => s.setSelection);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const activeTool = useEditorStore((s) => s.activeTool);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== 'select') return;
    e.cancelBubble = true;
    const isShift = e.evt.shiftKey;
    if (isShift) {
      setSelection(
        selectedIds.includes(object.id)
          ? selectedIds.filter((id) => id !== object.id)
          : [...selectedIds, object.id],
      );
    } else {
      setSelection([object.id]);
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    updateChildObject(object.id, {
      x: Math.round(e.target.x() - parentX),
      y: Math.round(e.target.y() - parentY),
    });
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    if (object.type === 'line') {
      const scaledPoints = object.points.map((val, i) =>
        Math.round(val * (i % 2 === 0 ? scaleX : scaleY)),
      );
      updateChildObject(object.id, {
        x: Math.round(node.x() - parentX),
        y: Math.round(node.y() - parentY),
        points: scaledPoints,
        rotation: Math.round(node.rotation() * 10) / 10,
      } as Partial<StaticDesignObject>);
    } else {
      updateChildObject(object.id, {
        x: Math.round(node.x() - parentX),
        y: Math.round(node.y() - parentY),
        width: Math.max(5, Math.round(node.width() * scaleX)),
        height: Math.max(5, Math.round(node.height() * scaleY)),
        rotation: Math.round(node.rotation() * 10) / 10,
      });
    }
  };

  const commonProps = {
    id: object.id,
    x: parentX + object.x,
    y: parentY + object.y,
    rotation: object.rotation,
    opacity: object.opacity,
    draggable: !object.locked && activeTool === 'select',
    onClick: handleClick,
    onTap: handleClick,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
  };

  switch (object.type) {
    case 'rect':
      return (
        <Rect
          {...commonProps}
          width={object.width}
          height={object.height}
          fill={object.fill}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth}
          cornerRadius={object.cornerRadius}
        />
      );
    case 'ellipse':
      return (
        <Ellipse
          {...commonProps}
          radiusX={object.width / 2}
          radiusY={object.height / 2}
          fill={object.fill}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth}
        />
      );
    case 'text':
      return (
        <Text
          {...commonProps}
          text={object.text}
          fontSize={object.fontSize}
          fontFamily={object.fontFamily}
          fontStyle={object.fontStyle}
          fill={object.fill}
          align={object.align}
          width={object.width}
          lineHeight={object.lineHeight}
        />
      );
    case 'image':
      return <EditableChildImage object={object} commonProps={commonProps} />;
    case 'line':
      return (
        <Line
          {...commonProps}
          points={object.points}
          stroke={object.stroke}
          strokeWidth={object.strokeWidth}
          hitStrokeWidth={Math.max(20, object.strokeWidth + 10)}
          lineCap={object.lineCap}
          lineJoin={object.lineJoin}
        />
      );
    default:
      return null;
  }
}

function EditableChildImage({
  object,
  commonProps,
}: {
  object: StaticDesignObject & { type: 'image' };
  commonProps: Record<string, unknown>;
}) {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    const img = new window.Image();
    const isLocal = object.src.startsWith('blob:') || object.src.startsWith('data:');
    if (!isLocal) img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.src = object.src;
  }, [object.src]);

  if (!image) {
    return (
      <Rect
        {...commonProps}
        width={object.width}
        height={object.height}
        fill="#F0F0F0"
        stroke="#CCCCCC"
        strokeWidth={1}
        dash={[4, 4]}
      />
    );
  }

  return (
    <KonvaImage
      {...commonProps}
      image={image}
      width={object.width}
      height={object.height}
    />
  );
}
