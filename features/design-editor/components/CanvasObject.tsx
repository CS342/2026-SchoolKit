import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Rect, Ellipse, Text, Image as KonvaImage, Line, Group, Star, Arrow } from 'react-konva';
import Konva from 'konva';
import type { DesignObject, InteractiveComponentObject, StaticDesignObject, GradientConfig } from '../types/document';
import { useEditorStore } from '../store/editor-store';
import { getDashArray } from '../utils/defaults';
import { snapToGrid, magneticSnap } from '../utils/snap';
import type { GuideLine, ObjectBounds } from '../utils/snap';

interface CanvasObjectProps {
  object: DesignObject;
  isSelected: boolean;
  onSnapGuidesChange?: (guides: GuideLine[]) => void;
  onSnapGuidesEnd?: () => void;
}

// ─── Gradient helpers ──────────────────────────────────────────

function getLinearGradientProps(gradient: GradientConfig, w: number, h: number) {
  const angle = (gradient.angle ?? 0) * (Math.PI / 180);
  const cx = w / 2;
  const cy = h / 2;
  const len = Math.max(w, h);
  const dx = Math.cos(angle) * len / 2;
  const dy = Math.sin(angle) * len / 2;
  const colors = gradient.colors;
  const stops: (number | string)[] = [];
  for (let i = 0; i < colors.length; i++) {
    stops.push(i / (colors.length - 1), colors[i]);
  }
  return {
    fillLinearGradientStartPoint: { x: cx - dx, y: cy - dy },
    fillLinearGradientEndPoint: { x: cx + dx, y: cy + dy },
    fillLinearGradientColorStops: stops,
  };
}

function getRadialGradientProps(gradient: GradientConfig, w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.max(w, h) / 2;
  const colors = gradient.colors;
  const stops: (number | string)[] = [];
  for (let i = 0; i < colors.length; i++) {
    stops.push(i / (colors.length - 1), colors[i]);
  }
  return {
    fillRadialGradientStartPoint: { x: cx, y: cy },
    fillRadialGradientEndPoint: { x: cx, y: cy },
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndRadius: r,
    fillRadialGradientColorStops: stops,
  };
}

function getGradientProps(gradient: GradientConfig | null | undefined, w: number, h: number) {
  if (!gradient) return {};
  if (gradient.type === 'radial') return getRadialGradientProps(gradient, w, h);
  return getLinearGradientProps(gradient, w, h);
}

function getShadowProps(shadow: { color: string; offsetX: number; offsetY: number; blur: number } | null | undefined) {
  if (!shadow) return {};
  return {
    shadowColor: shadow.color,
    shadowOffsetX: shadow.offsetX,
    shadowOffsetY: shadow.offsetY,
    shadowBlur: shadow.blur,
    shadowEnabled: true,
  };
}

// ─── Blur component wrapper ───────────────────────────────────

function BlurredRect({ blurRadius, ...props }: any) {
  const ref = useRef<Konva.Rect>(null);
  useEffect(() => {
    if (ref.current && blurRadius > 0) {
      ref.current.cache();
    }
  }, [blurRadius, props.width, props.height, props.fill]);
  if (blurRadius > 0) {
    return <Rect ref={ref} {...props} filters={[Konva.Filters.Blur]} blurRadius={blurRadius} />;
  }
  return <Rect {...props} />;
}

function BlurredEllipse({ blurRadius, ...props }: any) {
  const ref = useRef<Konva.Ellipse>(null);
  useEffect(() => {
    if (ref.current && blurRadius > 0) {
      ref.current.cache();
    }
  }, [blurRadius, props.radiusX, props.radiusY, props.fill]);
  if (blurRadius > 0) {
    return <Ellipse ref={ref} {...props} filters={[Konva.Filters.Blur]} blurRadius={blurRadius} />;
  }
  return <Ellipse {...props} />;
}

// ─── Main CanvasObject ────────────────────────────────────────

export function CanvasObject({ object, isSelected, onSnapGuidesChange, onSnapGuidesEnd }: CanvasObjectProps) {
  const updateObject = useEditorStore((s) => s.updateObject);
  const setSelection = useEditorStore((s) => s.setSelection);
  const activeTool = useEditorStore((s) => s.activeTool);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const enterComponent = useEditorStore((s) => s.enterComponent);
  const snapToGridEnabled = useEditorStore((s) => s.snapToGrid);
  const gridSize = useEditorStore((s) => s.gridSize);
  const snapToObjectsEnabled = useEditorStore((s) => s.snapToObjects);
  const objects = useEditorStore((s) => s.objects);
  const canvas = useEditorStore((s) => s.canvas);

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

  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    if (snapToGridEnabled) {
      const snapped = snapToGrid(node.x(), node.y(), gridSize);
      node.x(snapped.x);
      node.y(snapped.y);
      onSnapGuidesChange?.([]);
    } else if (snapToObjectsEnabled) {
      const dragged: ObjectBounds = {
        x: node.x(),
        y: node.y(),
        width: object.width,
        height: object.height,
      };
      const others: ObjectBounds[] = objects
        .filter((o) => o.id !== object.id && o.visible)
        .map((o) => ({ x: o.x, y: o.y, width: o.width, height: o.height }));
      const result = magneticSnap(dragged, others, canvas.width, canvas.height);
      node.x(result.x);
      node.y(result.y);
      onSnapGuidesChange?.(result.guides);
    }
  }, [snapToGridEnabled, gridSize, snapToObjectsEnabled, objects, canvas, object.id, object.width, object.height, onSnapGuidesChange]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onSnapGuidesEnd?.();
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

    let newX = Math.round(node.x());
    let newY = Math.round(node.y());
    if (snapToGridEnabled) {
      const snapped = snapToGrid(newX, newY, gridSize);
      newX = snapped.x;
      newY = snapped.y;
    }

    if (object.type === 'line' || object.type === 'arrow') {
      const pts = (object as any).points as number[];
      const scaledPoints = pts.map((val: number, i: number) =>
        Math.round(val * (i % 2 === 0 ? scaleX : scaleY)),
      );
      updateObject(object.id, {
        x: newX,
        y: newY,
        points: scaledPoints,
        rotation: Math.round(node.rotation() * 10) / 10,
      } as Partial<DesignObject>);
    } else {
      updateObject(object.id, {
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
    x: object.x,
    y: object.y,
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
    case 'rect': {
      const gradientProps = object.gradient ? getGradientProps(object.gradient, object.width, object.height) : {};
      const shadowProps = getShadowProps(object.shadow);
      const fillProp = object.gradient ? {} : { fill: object.fill };
      return (
        <BlurredRect
          {...commonProps}
          width={object.width}
          height={object.height}
          {...fillProp}
          {...gradientProps}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth}
          cornerRadius={object.cornerRadius}
          dash={getDashArray(object.dash, object.strokeWidth)}
          lineCap={object.lineCap}
          lineJoin={object.lineJoin}
          {...shadowProps}
          blurRadius={object.blur || 0}
        />
      );
    }

    case 'ellipse': {
      const gradientProps = object.gradient ? getGradientProps(object.gradient, object.width, object.height) : {};
      const shadowProps = getShadowProps(object.shadow);
      const fillProp = object.gradient ? {} : { fill: object.fill };
      return (
        <BlurredEllipse
          {...commonProps}
          radiusX={object.width / 2}
          radiusY={object.height / 2}
          offsetX={0}
          offsetY={0}
          {...fillProp}
          {...gradientProps}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth}
          dash={getDashArray(object.dash, object.strokeWidth)}
          lineCap={object.lineCap}
          lineJoin={object.lineJoin}
          {...shadowProps}
          blurRadius={object.blur || 0}
        />
      );
    }

    case 'text': {
      const shadowProps = getShadowProps(object.shadow);
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
          height={object.height}
          lineHeight={object.lineHeight}
          letterSpacing={object.letterSpacing ?? 0}
          textDecoration={object.textDecoration || ''}
          verticalAlign={object.verticalAlign ?? 'top'}
          padding={object.padding ?? 0}
          fontVariant={object.fontVariant ?? 'normal'}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth ?? 0}
          {...shadowProps}
          onDblClick={(e) => {
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
            textarea.style.padding = `${object.padding ?? 0}px`;
            textarea.style.margin = '0';
            textarea.style.overflow = 'hidden';
            textarea.style.background = 'white';
            textarea.style.outline = 'none';
            textarea.style.resize = 'none';
            textarea.style.lineHeight = String(object.lineHeight);
            textarea.style.color = object.fill;
            textarea.style.letterSpacing = `${object.letterSpacing ?? 0}px`;
            textarea.style.textDecoration = object.textDecoration || 'none';
            textarea.style.fontVariant = object.fontVariant ?? 'normal';
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
    }

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
          dash={getDashArray(object.dash, object.strokeWidth)}
        />
      );

    case 'star': {
      const outerRadius = Math.min(object.width, object.height) / 2;
      const gradientProps = object.gradient ? getGradientProps(object.gradient, object.width, object.height) : {};
      const shadowProps = getShadowProps(object.shadow);
      const fillProp = object.gradient ? {} : { fill: object.fill };
      return (
        <Star
          {...commonProps}
          numPoints={object.points}
          innerRadius={outerRadius * object.innerRadius}
          outerRadius={outerRadius}
          {...fillProp}
          {...gradientProps}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth}
          dash={getDashArray(object.dash, object.strokeWidth)}
          lineCap={object.lineCap}
          lineJoin={object.lineJoin}
          {...shadowProps}
        />
      );
    }

    case 'triangle': {
      const w = object.width;
      const h = object.height;
      const triPoints = [w / 2, 0, w, h, 0, h];
      const gradientProps = object.gradient ? getGradientProps(object.gradient, w, h) : {};
      const shadowProps = getShadowProps(object.shadow);
      const fillProp = object.gradient ? {} : { fill: object.fill };
      return (
        <Line
          {...commonProps}
          points={triPoints}
          closed
          {...fillProp}
          {...gradientProps}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth}
          dash={getDashArray(object.dash, object.strokeWidth)}
          lineCap={object.lineCap}
          lineJoin={object.lineJoin}
          {...shadowProps}
        />
      );
    }

    case 'arrow':
      return (
        <Arrow
          {...commonProps}
          points={object.points}
          stroke={object.stroke}
          strokeWidth={object.strokeWidth}
          pointerLength={object.pointerLength}
          pointerWidth={object.pointerWidth}
          fill={object.fill}
          hitStrokeWidth={Math.max(20, object.strokeWidth + 10)}
          dash={getDashArray(object.dash, object.strokeWidth)}
          lineCap={object.lineCap}
          lineJoin={object.lineJoin}
        />
      );

    case 'badge': {
      const gradientProps = object.gradient ? getGradientProps(object.gradient, object.width, object.height) : {};
      const shadowProps = getShadowProps(object.shadow);
      const fillProp = object.gradient ? {} : { fill: object.fill };
      return (
        <Group {...commonProps} width={object.width} height={object.height}>
          <Rect
            width={object.width}
            height={object.height}
            {...fillProp}
            {...gradientProps}
            cornerRadius={object.cornerRadius}
            {...shadowProps}
          />
          <Text
            x={object.paddingX}
            y={object.paddingY}
            width={object.width - object.paddingX * 2}
            height={object.height - object.paddingY * 2}
            text={object.text}
            fontSize={object.fontSize}
            fontFamily={object.fontFamily}
            fontStyle={object.fontStyle}
            fill={object.textColor}
            align={object.align ?? 'center'}
            verticalAlign={object.verticalAlign ?? 'middle'}
            letterSpacing={object.letterSpacing ?? 0}
            textDecoration={object.textDecoration || ''}
          />
        </Group>
      );
    }

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

      {visibleChildren.map((child) => (
        <StaticChildObject key={child.id} object={child} />
      ))}

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
    case 'carousel': return 62;
    case 'tabs': return 40;
    case 'quiz': return 40;
    default: return 70;
  }
}

function getInteractionLabel(type: string): string {
  switch (type) {
    case 'flip-card': return 'Flip Card';
    case 'bottom-sheet': return 'Bottom Sheet';
    case 'expandable': return 'Expandable';
    case 'entrance': return 'Entrance';
    case 'carousel': return 'Carousel';
    case 'tabs': return 'Tabs';
    case 'quiz': return 'Quiz';
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
    case 'rect': {
      const gradientProps = object.gradient ? getGradientProps(object.gradient, object.width, object.height) : {};
      const shadowProps = getShadowProps(object.shadow);
      const fillProp = object.gradient ? {} : { fill: object.fill };
      const blurRadius = object.blur || 0;
      return (
        <BlurredRect
          {...commonProps}
          width={object.width}
          height={object.height}
          {...fillProp}
          {...gradientProps}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth}
          cornerRadius={object.cornerRadius}
          dash={getDashArray(object.dash, object.strokeWidth)}
          lineCap={object.lineCap}
          lineJoin={object.lineJoin}
          {...shadowProps}
          blurRadius={blurRadius}
        />
      );
    }
    case 'ellipse': {
      const gradientProps = object.gradient ? getGradientProps(object.gradient, object.width, object.height) : {};
      const shadowProps = getShadowProps(object.shadow);
      const fillProp = object.gradient ? {} : { fill: object.fill };
      const blurRadius = object.blur || 0;
      return (
        <BlurredEllipse
          {...commonProps}
          radiusX={object.width / 2}
          radiusY={object.height / 2}
          {...fillProp}
          {...gradientProps}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth}
          dash={getDashArray(object.dash, object.strokeWidth)}
          lineCap={object.lineCap}
          lineJoin={object.lineJoin}
          {...shadowProps}
          blurRadius={blurRadius}
        />
      );
    }
    case 'text': {
      const shadowProps = getShadowProps(object.shadow);
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
          height={object.height}
          lineHeight={object.lineHeight}
          letterSpacing={object.letterSpacing ?? 0}
          textDecoration={object.textDecoration || ''}
          verticalAlign={object.verticalAlign ?? 'top'}
          padding={object.padding ?? 0}
          fontVariant={object.fontVariant ?? 'normal'}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth ?? 0}
          {...shadowProps}
        />
      );
    }
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
          dash={getDashArray(object.dash, object.strokeWidth)}
        />
      );
    case 'star': {
      const outerRadius = Math.min(object.width, object.height) / 2;
      const gradientProps = object.gradient ? getGradientProps(object.gradient, object.width, object.height) : {};
      const shadowProps = getShadowProps(object.shadow);
      const fillProp = object.gradient ? {} : { fill: object.fill };
      return (
        <Star
          {...commonProps}
          numPoints={object.points}
          innerRadius={outerRadius * object.innerRadius}
          outerRadius={outerRadius}
          {...fillProp}
          {...gradientProps}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth}
          dash={getDashArray(object.dash, object.strokeWidth)}
          lineCap={object.lineCap}
          lineJoin={object.lineJoin}
          {...shadowProps}
        />
      );
    }
    case 'triangle': {
      const w = object.width;
      const h = object.height;
      const triPoints = [w / 2, 0, w, h, 0, h];
      const gradientProps = object.gradient ? getGradientProps(object.gradient, w, h) : {};
      const shadowProps = getShadowProps(object.shadow);
      const fillProp = object.gradient ? {} : { fill: object.fill };
      return (
        <Line
          {...commonProps}
          points={triPoints}
          closed
          {...fillProp}
          {...gradientProps}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth}
          dash={getDashArray(object.dash, object.strokeWidth)}
          lineCap={object.lineCap}
          lineJoin={object.lineJoin}
          {...shadowProps}
        />
      );
    }
    case 'arrow':
      return (
        <Arrow
          {...commonProps}
          points={object.points}
          stroke={object.stroke}
          strokeWidth={object.strokeWidth}
          pointerLength={object.pointerLength}
          pointerWidth={object.pointerWidth}
          fill={object.fill}
          dash={getDashArray(object.dash, object.strokeWidth)}
          lineCap={object.lineCap}
          lineJoin={object.lineJoin}
        />
      );
    case 'badge': {
      const gradientProps = object.gradient ? getGradientProps(object.gradient, object.width, object.height) : {};
      const shadowProps = getShadowProps(object.shadow);
      const fillProp = object.gradient ? {} : { fill: object.fill };
      return (
        <Group {...commonProps} width={object.width} height={object.height}>
          <Rect
            width={object.width}
            height={object.height}
            {...fillProp}
            {...gradientProps}
            cornerRadius={object.cornerRadius}
            {...shadowProps}
          />
          <Text
            x={object.paddingX}
            y={object.paddingY}
            width={object.width - object.paddingX * 2}
            height={object.height - object.paddingY * 2}
            text={object.text}
            fontSize={object.fontSize}
            fontFamily={object.fontFamily}
            fontStyle={object.fontStyle}
            fill={object.textColor}
            align={object.align ?? 'center'}
            verticalAlign={object.verticalAlign ?? 'middle'}
            letterSpacing={object.letterSpacing ?? 0}
            textDecoration={object.textDecoration || ''}
          />
        </Group>
      );
    }
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
    const isLocal = object.src.startsWith('blob:') || object.src.startsWith('data:');
    if (!isLocal) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => setImage(img);
    img.onerror = () => {
      const fallback = new window.Image();
      fallback.onload = () => setImage(fallback);
      fallback.src = object.src;
    };
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
