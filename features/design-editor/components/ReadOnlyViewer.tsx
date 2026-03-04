import React, { useEffect, useState } from 'react';
import { Stage, Layer, Rect, Ellipse, Text, Image as KonvaImage, Line, Star, Arrow, Group } from 'react-konva';
import type { DesignDocument, DesignObject, GradientConfig, ShadowConfig, InteractiveComponentObject, StaticDesignObject } from '../types/document';

interface ReadOnlyViewerProps {
  doc: DesignDocument;
  title: string;
  author: string;
}

// ─── Konva Gradient Helpers ────────────────────────────────────

function getLinearGradientProps(gradient: GradientConfig, width: number, height: number) {
  const angle = gradient.angle ?? 0;
  const rad = ((angle - 90) * Math.PI) / 180;
  const dx = Math.cos(rad) * 0.5;
  const dy = Math.sin(rad) * 0.5;
  return {
    fillLinearGradientStartPoint: { x: (0.5 - dx) * width, y: (0.5 - dy) * height },
    fillLinearGradientEndPoint: { x: (0.5 + dx) * width, y: (0.5 + dy) * height },
    fillLinearGradientColorStops: gradient.colors.flatMap((c, i) => [i / (gradient.colors.length - 1), c]),
  };
}

function getRadialGradientProps(gradient: GradientConfig, width: number, height: number) {
  const r = Math.max(width, height) / 2;
  return {
    fillRadialGradientStartPoint: { x: width / 2, y: height / 2 },
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndPoint: { x: width / 2, y: height / 2 },
    fillRadialGradientEndRadius: r,
    fillRadialGradientColorStops: gradient.colors.flatMap((c, i) => [i / (gradient.colors.length - 1), c]),
  };
}

function getGradientFillProps(gradient: GradientConfig | null | undefined, width: number, height: number) {
  if (!gradient) return {};
  if (gradient.type === 'radial') return getRadialGradientProps(gradient, width, height);
  return getLinearGradientProps(gradient, width, height);
}

// ─── Konva Shadow Helpers ──────────────────────────────────────

function getShadowProps(shadow: ShadowConfig | null | undefined) {
  if (!shadow) return {};
  // Parse rgba color to extract opacity
  let color = shadow.color;
  let opacity = 1;
  const rgbaMatch = shadow.color.match(/rgba?\([\d\s,]+,\s*([\d.]+)\)/);
  if (rgbaMatch) {
    opacity = parseFloat(rgbaMatch[1]);
    // Extract just the RGB part for Konva shadowColor
    const rgbMatch = shadow.color.match(/rgba?\(([\d\s,]+)/);
    if (rgbMatch) {
      const parts = rgbMatch[1].split(',').map(s => s.trim());
      color = `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
    }
  }
  return {
    shadowColor: color,
    shadowBlur: shadow.blur,
    shadowOffsetX: shadow.offsetX,
    shadowOffsetY: shadow.offsetY,
    shadowOpacity: opacity,
    shadowEnabled: true,
  };
}

// ─── Component ────────────────────────────────────────────────

export function ReadOnlyObject({ object }: { object: DesignObject }) {
  const commonProps = {
    x: object.x,
    y: object.y,
    rotation: object.rotation,
    opacity: object.opacity,
    listening: false,
  };

  switch (object.type) {
    case 'rect': {
      const gradientProps = object.gradient
        ? { ...getGradientFillProps(object.gradient, object.width, object.height) }
        : { fill: object.fill };
      return (
        <Rect
          {...commonProps}
          width={object.width}
          height={object.height}
          {...gradientProps}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth}
          cornerRadius={object.cornerRadius}
          {...getShadowProps(object.shadow)}
        />
      );
    }
    case 'ellipse': {
      const gradientProps = object.gradient
        ? { ...getGradientFillProps(object.gradient, object.width, object.height) }
        : { fill: object.fill };
      return (
        <Ellipse
          {...commonProps}
          radiusX={object.width / 2}
          radiusY={object.height / 2}
          {...gradientProps}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth}
          {...getShadowProps(object.shadow)}
        />
      );
    }
    case 'text': {
      const shadowTextProps = object.shadow ? getShadowProps(object.shadow) : {};
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
          {...shadowTextProps}
        />
      );
    }
    case 'image':
      return <ReadOnlyImage object={object} commonProps={commonProps} />;
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
    case 'star': {
      const outerRadius = Math.min(object.width, object.height) / 2;
      const gradientProps = object.gradient
        ? { ...getGradientFillProps(object.gradient, object.width, object.height) }
        : { fill: object.fill };
      return (
        <Star
          {...commonProps}
          numPoints={object.points}
          innerRadius={outerRadius * object.innerRadius}
          outerRadius={outerRadius}
          {...gradientProps}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth}
          {...getShadowProps(object.shadow)}
        />
      );
    }
    case 'triangle': {
      const triPoints = [object.width / 2, 0, object.width, object.height, 0, object.height];
      const gradientProps = object.gradient
        ? { ...getGradientFillProps(object.gradient, object.width, object.height) }
        : { fill: object.fill };
      return (
        <Line
          {...commonProps}
          points={triPoints}
          closed
          {...gradientProps}
          stroke={object.stroke || undefined}
          strokeWidth={object.strokeWidth}
          {...getShadowProps(object.shadow)}
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
        />
      );
    case 'badge': {
      const gradientProps = object.gradient
        ? { ...getGradientFillProps(object.gradient, object.width, object.height) }
        : { fill: object.fill };
      return (
        <Group {...commonProps} width={object.width} height={object.height}>
          <Rect
            width={object.width}
            height={object.height}
            {...gradientProps}
            cornerRadius={object.cornerRadius}
            {...getShadowProps(object.shadow)}
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
            align="center"
            verticalAlign="middle"
          />
        </Group>
      );
    }
    case 'interactive':
      return <ReadOnlyInteractive object={object} />;
    default:
      return null;
  }
}

// ─── Interactive: render children statically ───────────────────

function ReadOnlyInteractive({ object }: { object: InteractiveComponentObject }) {
  // For read-only view, render visible children as static objects.
  // For flip-cards, show "front" group only. For others, show all children.
  const children = object.children ?? [];
  if (children.length === 0) return null;

  let visibleIds: Set<string> | null = null;

  if (object.interactionType === 'flip-card') {
    const frontGroup = object.groups?.find(g => g.role === 'front');
    if (frontGroup) {
      visibleIds = new Set(frontGroup.objectIds);
    }
  } else if (object.interactionType === 'carousel' || object.interactionType === 'tabs') {
    // Show first slide/tab only
    const firstGroup = object.groups?.find(g =>
      g.role === 'slide-0' || g.role === 'tab-0'
    );
    if (firstGroup) {
      visibleIds = new Set(firstGroup.objectIds);
    }
  }

  const filteredChildren = visibleIds
    ? children.filter(c => visibleIds!.has(c.id))
    : children;

  return (
    <Group x={object.x} y={object.y} opacity={object.opacity} listening={false}>
      {filteredChildren
        .filter(c => c.visible !== false)
        .map(child => (
          <ReadOnlyObject key={child.id} object={child as DesignObject} />
        ))}
    </Group>
  );
}

// ─── Image ─────────────────────────────────────────────────────

function ReadOnlyImage({
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

  if (!image) return null;

  return (
    <KonvaImage
      {...commonProps}
      image={image}
      width={object.width}
      height={object.height}
    />
  );
}

// ─── Main Viewer ──────────────────────────────────────────────

export function ReadOnlyViewer({ doc, title, author }: ReadOnlyViewerProps) {
  const [zoom, setZoom] = useState(1);

  // Auto-fit zoom to viewport
  useEffect(() => {
    const maxWidth = window.innerWidth - 80;
    const maxHeight = window.innerHeight - 120;
    const scaleX = maxWidth / doc.canvas.width;
    const scaleY = maxHeight / doc.canvas.height;
    setZoom(Math.min(scaleX, scaleY, 1));
  }, [doc.canvas.width, doc.canvas.height]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F3F4F6',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 32px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: '#7B68EE',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 2,
            }}
          >
            SchoolKit
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>
            {title}
          </div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>by {author}</div>
        </div>
        <div
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            backgroundColor: '#F3F4F6',
            fontSize: 12,
            color: '#6B7280',
            fontWeight: 500,
          }}
        >
          View only
        </div>
      </div>

      {/* Canvas */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        }}
      >
        <Stage
          width={doc.canvas.width * zoom}
          height={doc.canvas.height * zoom}
          scaleX={zoom}
          scaleY={zoom}
          style={{
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            borderRadius: 4,
          }}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={doc.canvas.width}
              height={doc.canvas.height}
              fill={doc.canvas.background}
            />
            {doc.objects
              .filter((o) => o.visible)
              .map((obj) => (
                <ReadOnlyObject key={obj.id} object={obj} />
              ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
