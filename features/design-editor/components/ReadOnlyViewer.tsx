import React, { useEffect, useState } from 'react';
import { Stage, Layer, Rect, Ellipse, Text, Image as KonvaImage, Line } from 'react-konva';
import type { DesignDocument, DesignObject } from '../types/document';

interface ReadOnlyViewerProps {
  doc: DesignDocument;
  title: string;
  author: string;
}

export function ReadOnlyObject({ object }: { object: DesignObject }) {
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
    default:
      return null;
  }
}

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
