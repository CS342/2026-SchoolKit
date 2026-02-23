import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
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
import { snapToGrid, magneticSnap } from '../utils/snap';
import type { GuideLine, ObjectBounds } from '../utils/snap';
import type { StaticDesignObject } from '../types/document';

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
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);
  const showGrid = useEditorStore((s) => s.showGrid);
  const gridSize = useEditorStore((s) => s.gridSize);
  const snapToGridEnabled = useEditorStore((s) => s.snapToGrid);
  const snapToObjectsEnabled = useEditorStore((s) => s.snapToObjects);

  const [zoom, setZoom] = useState(1);
  const [snapGuides, setSnapGuides] = useState<GuideLine[]>([]);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
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

  // ── Wheel: scroll the container or zoom ──
  // Konva registers its own wheel listener with { passive: false } on its
  // content div which blocks native scroll. We intercept in the capture phase,
  // kill Konva's handler, and manually scroll the container for normal wheel
  // events or zoom for Cmd/Ctrl + wheel.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const content = (stage as any).content as HTMLDivElement;
    if (!content) return;
    const container = containerRef.current;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      if (e.metaKey || e.ctrlKey) {
        // Cmd/Ctrl + wheel → zoom
        const scaleBy = 1.05;
        setZoom((prev) =>
          e.deltaY > 0
            ? Math.max(0.25, prev / scaleBy)
            : Math.min(3, prev * scaleBy),
        );
      } else if (container) {
        // Normal wheel → scroll the container
        container.scrollTop += e.deltaY;
        container.scrollLeft += e.deltaX;
      }
    };

    content.addEventListener('wheel', handler, { capture: true, passive: false });
    return () => content.removeEventListener('wheel', handler, { capture: true });
  }, []);

  // ── Zoom via Cmd+/- keyboard shortcuts ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      // Cmd + "=" / "+" → zoom in
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setZoom((prev) => Math.min(3, prev + 0.1));
        return;
      }
      // Cmd + "-" → zoom out
      if (e.key === '-') {
        e.preventDefault();
        setZoom((prev) => Math.max(0.25, prev - 0.1));
        return;
      }
      // Cmd + "0" → reset zoom
      if (e.key === '0') {
        e.preventDefault();
        setZoom(1);
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // ── Drag handle for extending canvas height ──
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingHandle(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = canvas.height;
  }, [canvas.height]);

  useEffect(() => {
    if (!isDraggingHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = (e.clientY - dragStartY.current) / zoom;
      const newHeight = Math.max(200, Math.round(dragStartHeight.current + deltaY));
      setCanvasSize(canvas.width, newHeight);
    };

    const handleMouseUp = () => {
      setIsDraggingHandle(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHandle, zoom, canvas.width, setCanvasSize]);

  // Clear snap guides when snap mode toggles change
  useEffect(() => {
    setSnapGuides([]);
  }, [snapToGridEnabled, snapToObjectsEnabled]);

  const handleSnapGuidesChange = useCallback((guides: GuideLine[]) => {
    setSnapGuides(guides);
  }, []);

  const handleSnapGuidesEnd = useCallback(() => {
    setSnapGuides([]);
  }, []);

  // Container allows scrolling so tall canvases can be navigated.
  // min-height: 0 is critical — without it a flex child defaults to
  // min-height: auto which prevents overflow from activating.
  const containerStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    backgroundColor: '#E8E8E8',
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
          position: 'sticky',
          top: 0,
          left: 0,
          width: '100%',
          height: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 'auto',
            top: 12,
            right: 12,
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
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
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 0',
          minHeight: '100%',
        }}
      >
        <Stage
          ref={stageRef}
          width={canvas.width * zoom}
          height={canvas.height * zoom}
          scaleX={zoom}
          scaleY={zoom}
          onClick={handleStageClick}
          onTap={handleStageClick}
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

          {/* Grid overlay */}
          {showGrid && (
            <GridOverlay
              width={canvas.width}
              height={canvas.height}
              gridSize={gridSize}
            />
          )}

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

              {/* Snap guides */}
              <SnapGuides guides={snapGuides} canvasWidth={canvas.width} canvasHeight={canvas.height} />
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
                    onSnapGuidesChange={handleSnapGuidesChange}
                    onSnapGuidesEnd={handleSnapGuidesEnd}
                  />
                ))}

              {/* Transformer for selected objects */}
              <SelectionTransformer stageRef={stageRef} />

              {/* Snap guides */}
              <SnapGuides guides={snapGuides} canvasWidth={canvas.width} canvasHeight={canvas.height} />
            </>
          )}
        </Layer>
        </Stage>

        {/* Drag handle to extend canvas height */}
        {!editingComponentId && (
          <div
            onMouseDown={handleDragStart}
            style={{
              width: canvas.width * zoom,
              height: 18,
              cursor: 'ns-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDraggingHandle ? 'rgba(99,102,241,0.15)' : 'transparent',
              borderBottomLeftRadius: 6,
              borderBottomRightRadius: 6,
              transition: isDraggingHandle ? 'none' : 'background-color 0.15s',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isDraggingHandle) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)';
            }}
            onMouseLeave={(e) => {
              if (!isDraggingHandle) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Grip dots */}
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDraggingHandle ? '#6366F1' : '#AAA',
                transition: isDraggingHandle ? 'none' : 'background-color 0.15s',
              }}
            />
          </div>
        )}

        {/* Canvas dimensions label */}
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: '#999',
            userSelect: 'none',
          }}
        >
          {canvas.width} x {canvas.height}
        </div>
      </div>
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
  const snapToGridEnabled = useEditorStore((s) => s.snapToGrid);
  const gridSize = useEditorStore((s) => s.gridSize);

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

  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (snapToGridEnabled) {
      const node = e.target;
      const snapped = snapToGrid(node.x() - parentX, node.y() - parentY, gridSize);
      node.x(snapped.x + parentX);
      node.y(snapped.y + parentY);
    }
  }, [snapToGridEnabled, gridSize, parentX, parentY]);

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

    let newX = Math.round(node.x() - parentX);
    let newY = Math.round(node.y() - parentY);
    if (snapToGridEnabled) {
      const snapped = snapToGrid(newX, newY, gridSize);
      newX = snapped.x;
      newY = snapped.y;
    }

    if (object.type === 'line') {
      const scaledPoints = object.points.map((val, i) =>
        Math.round(val * (i % 2 === 0 ? scaleX : scaleY)),
      );
      updateChildObject(object.id, {
        x: newX,
        y: newY,
        points: scaledPoints,
        rotation: Math.round(node.rotation() * 10) / 10,
      } as Partial<StaticDesignObject>);
    } else {
      updateChildObject(object.id, {
        x: newX,
        y: newY,
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
    onDragMove: handleDragMove,
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

// ─── Grid Overlay ─────────────────────────────────────────────

function GridOverlay({
  width,
  height,
  gridSize,
}: {
  width: number;
  height: number;
  gridSize: number;
}) {
  const lines = useMemo(() => {
    const result: React.ReactElement[] = [];
    // Vertical lines
    for (let x = gridSize; x < width; x += gridSize) {
      const isMajor = x % (gridSize * 5) === 0;
      result.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, height]}
          stroke={isMajor ? '#BBBBBB' : '#DDDDDD'}
          strokeWidth={isMajor ? 0.5 : 0.25}
          listening={false}
        />,
      );
    }
    // Horizontal lines
    for (let y = gridSize; y < height; y += gridSize) {
      const isMajor = y % (gridSize * 5) === 0;
      result.push(
        <Line
          key={`h-${y}`}
          points={[0, y, width, y]}
          stroke={isMajor ? '#BBBBBB' : '#DDDDDD'}
          strokeWidth={isMajor ? 0.5 : 0.25}
          listening={false}
        />,
      );
    }
    return result;
  }, [width, height, gridSize]);

  return <>{lines}</>;
}

// ─── Snap Guide Lines ─────────────────────────────────────────

function SnapGuides({
  guides,
  canvasWidth,
  canvasHeight,
}: {
  guides: GuideLine[];
  canvasWidth: number;
  canvasHeight: number;
}) {
  if (guides.length === 0) return null;
  return (
    <>
      {guides.map((guide, i) =>
        guide.orientation === 'vertical' ? (
          <Line
            key={`sg-v-${i}`}
            points={[guide.position, 0, guide.position, canvasHeight]}
            stroke="#7B68EE"
            strokeWidth={1}
            dash={[4, 4]}
            listening={false}
          />
        ) : (
          <Line
            key={`sg-h-${i}`}
            points={[0, guide.position, canvasWidth, guide.position]}
            stroke="#7B68EE"
            strokeWidth={1}
            dash={[4, 4]}
            listening={false}
          />
        ),
      )}
    </>
  );
}
