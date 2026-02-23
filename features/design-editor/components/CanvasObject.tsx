import React, { useEffect, useRef, useState } from 'react';
import { Rect, Ellipse, Text, Image as KonvaImage, Line, Group } from 'react-konva';
import Konva from 'konva';
import type { DesignObject, InteractiveComponentObject, StaticDesignObject } from '../types/document';
import { useEditorStore } from '../store/editor-store';

interface CanvasObjectProps {
  object: DesignObject;
  isSelected: boolean;
}

export function CanvasObject({ object, isSelected }: CanvasObjectProps) {
  const updateObject = useEditorStore((s) => s.updateObject);
  const setSelection = useEditorStore((s) => s.setSelection);
  const activeTool = useEditorStore((s) => s.activeTool);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const enterComponent = useEditorStore((s) => s.enterComponent);

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

  const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (object.type === 'interactive') {
      e.cancelBubble = true;
      const firstGroup = object.groups[0];
      if (firstGroup) {
        enterComponent(object.id, firstGroup.role);
      }
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    updateObject(object.id, {
      x: Math.round(e.target.x()),
      y: Math.round(e.target.y()),
    });
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    if (object.type === 'line') {
      // Scale the points array instead of width/height for lines
      const scaledPoints = object.points.map((val, i) =>
        Math.round(val * (i % 2 === 0 ? scaleX : scaleY)),
      );
      updateObject(object.id, {
        x: Math.round(node.x()),
        y: Math.round(node.y()),
        points: scaledPoints,
        rotation: Math.round(node.rotation() * 10) / 10,
      } as Partial<DesignObject>);
    } else {
      updateObject(object.id, {
        x: Math.round(node.x()),
        y: Math.round(node.y()),
        width: Math.max(5, Math.round(node.width() * scaleX)),
        height: Math.max(5, Math.round(node.height() * scaleY)),
        rotation: Math.round(node.rotation() * 10) / 10,
      });
    }
  };

  const commonProps = {
    id: object.id,
    x: object.x,
    y: object.y,
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
          offsetX={0}
          offsetY={0}
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
          onDblClick={(e) => {
            // Enable inline editing on double-click
            const textNode = e.target as Konva.Text;
            const stage = textNode.getStage();
            if (!stage) return;

            const textPosition = textNode.absolutePosition();
            const stageContainer = stage.container();
            const areaPosition = {
              x: stageContainer.getBoundingClientRect().left + textPosition.x,
              y: stageContainer.getBoundingClientRect().top + textPosition.y,
            };

            const textarea = document.createElement('textarea');
            document.body.appendChild(textarea);

            textarea.value = object.text;
            textarea.style.position = 'fixed';
            textarea.style.top = `${areaPosition.y}px`;
            textarea.style.left = `${areaPosition.x}px`;
            textarea.style.width = `${object.width}px`;
            textarea.style.height = `${object.height + 20}px`;
            textarea.style.fontSize = `${object.fontSize}px`;
            textarea.style.fontFamily = object.fontFamily;
            textarea.style.border = '2px solid #7B68EE';
            textarea.style.borderRadius = '4px';
            textarea.style.padding = '4px';
            textarea.style.margin = '0';
            textarea.style.overflow = 'hidden';
            textarea.style.background = 'white';
            textarea.style.outline = 'none';
            textarea.style.resize = 'none';
            textarea.style.lineHeight = String(object.lineHeight);
            textarea.style.color = object.fill;
            textarea.style.zIndex = '10000';

            textarea.focus();

            const handleBlur = () => {
              updateObject(object.id, { text: textarea.value });
              document.body.removeChild(textarea);
            };

            textarea.addEventListener('blur', handleBlur);
            textarea.addEventListener('keydown', (ev) => {
              if (ev.key === 'Escape') {
                textarea.blur();
              }
            });
          }}
        />
      );

    case 'image':
      return <CanvasImageObject object={object} commonProps={commonProps} />;

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

    case 'interactive':
      return (
        <InteractiveCanvasObject
          object={object}
          commonProps={commonProps}
          onDblClick={handleDblClick}
        />
      );

    default:
      return null;
  }
}

function InteractiveCanvasObject({
  object,
  commonProps,
  onDblClick,
}: {
  object: InteractiveComponentObject;
  commonProps: Record<string, unknown>;
  onDblClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}) {
  // Show the default-visible group's children as a preview
  const defaultGroup = object.groups[0];
  const visibleChildIds = defaultGroup ? defaultGroup.objectIds : [];
  const visibleChildren = object.children.filter((c) =>
    visibleChildIds.includes(c.id),
  );

  return (
    <Group
      {...commonProps}
      width={object.width}
      height={object.height}
      onDblClick={onDblClick}
      onDblTap={onDblClick}
    >
      {/* Component bounding box — hitFunc ensures the entire area is
          clickable/draggable even though fill is transparent */}
      <Rect
        width={object.width}
        height={object.height}
        stroke="#7B68EE"
        strokeWidth={1}
        dash={[6, 3]}
        fill="transparent"
        cornerRadius={8}
        hitFunc={(context: any, shape: any) => {
          context.beginPath();
          context.rect(0, 0, shape.width(), shape.height());
          context.closePath();
          context.fillStrokeShape(shape);
        }}
      />

      {/* Render default group children */}
      {visibleChildren.map((child) => (
        <StaticChildObject key={child.id} object={child} />
      ))}

      {/* Type badge */}
      <Rect
        x={4}
        y={-22}
        width={getBadgeWidth(object.interactionType)}
        height={18}
        fill="#7B68EE"
        cornerRadius={4}
        listening={false}
      />
      <Text
        x={8}
        y={-20}
        text={getInteractionLabel(object.interactionType)}
        fontSize={10}
        fontStyle="bold"
        fill="#FFFFFF"
        listening={false}
      />
    </Group>
  );
}

function getBadgeWidth(type: string): number {
  switch (type) {
    case 'flip-card': return 60;
    case 'bottom-sheet': return 80;
    case 'expandable': return 72;
    case 'entrance': return 62;
    default: return 70;
  }
}

function getInteractionLabel(type: string): string {
  switch (type) {
    case 'flip-card': return 'Flip Card';
    case 'bottom-sheet': return 'Bottom Sheet';
    case 'expandable': return 'Expandable';
    case 'entrance': return 'Entrance';
    default: return 'Interactive';
  }
}

/** Renders a static child object inside a Group (no interaction handling). */
function StaticChildObject({ object }: { object: StaticDesignObject }) {
  const commonProps = {
    x: object.x,
    y: object.y,
    rotation: object.rotation,
    opacity: object.opacity,
    listening: false,
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
      return <StaticChildImage object={object} commonProps={commonProps} />;
    case 'line':
      return (
        <Line
          {...commonProps}
          points={object.points}
          stroke={object.stroke}
          strokeWidth={object.strokeWidth}
          lineCap={object.lineCap}
          lineJoin={object.lineJoin}
        />
      );
    default:
      return null;
  }
}

function StaticChildImage({
  object,
  commonProps,
}: {
  object: StaticDesignObject & { type: 'image' };
  commonProps: Record<string, unknown>;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    const isLocal = object.src.startsWith('blob:') || object.src.startsWith('data:');
    if (!isLocal) img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.src = object.src;
  }, [object.src]);

  if (!image) return null;
  return <KonvaImage {...commonProps} image={image} width={object.width} height={object.height} />;
}

function CanvasImageObject({
  object,
  commonProps,
}: {
  object: DesignObject & { type: 'image' };
  commonProps: Record<string, unknown>;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    // Only set crossOrigin for remote URLs (not blob: or data: URLs)
    const isLocal = object.src.startsWith('blob:') || object.src.startsWith('data:');
    if (!isLocal) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => setImage(img);
    img.onerror = () => {
      // Retry without crossOrigin if CORS fails
      const fallback = new window.Image();
      fallback.onload = () => setImage(fallback);
      fallback.src = object.src;
    };
    img.src = object.src;
  }, [object.src]);

  if (!image) {
    // Render a placeholder rect so the object stays selectable/draggable while loading
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
