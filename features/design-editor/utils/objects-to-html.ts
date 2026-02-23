import type { StaticDesignObject } from '../types/document';

/** Convert a static design object's properties into React inline CSS styles. */
export function objectToStyle(obj: StaticDesignObject): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: obj.x,
    top: obj.y,
    width: obj.width,
    height: obj.height,
    opacity: obj.opacity,
    transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
    boxSizing: 'border-box',
  };

  switch (obj.type) {
    case 'rect':
      return {
        ...base,
        backgroundColor: obj.fill,
        border: obj.stroke && obj.strokeWidth
          ? `${obj.strokeWidth}px solid ${obj.stroke}`
          : undefined,
        borderRadius: obj.cornerRadius,
      };

    case 'ellipse':
      return {
        ...base,
        backgroundColor: obj.fill,
        borderRadius: '50%',
        border: obj.stroke && obj.strokeWidth
          ? `${obj.strokeWidth}px solid ${obj.stroke}`
          : undefined,
      };

    case 'text':
      return {
        ...base,
        color: obj.fill,
        fontSize: obj.fontSize,
        fontFamily: obj.fontFamily,
        fontStyle: obj.fontStyle.includes('italic') ? 'italic' : 'normal',
        fontWeight: obj.fontStyle.includes('bold') ? 'bold' : 'normal',
        textAlign: obj.align as any,
        lineHeight: obj.lineHeight,
        whiteSpace: 'pre-wrap',
        overflow: 'hidden',
      };

    case 'image':
      return {
        ...base,
        backgroundImage: `url(${obj.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };

    case 'line':
      // Lines are tricky in HTML; approximate with a div
      return {
        ...base,
        height: obj.strokeWidth || 2,
        backgroundColor: obj.stroke,
        transformOrigin: '0 0',
      };

    default:
      return base;
  }
}

/** Get the text content for text objects. */
export function getTextContent(obj: StaticDesignObject): string | null {
  if (obj.type === 'text') return obj.text;
  return null;
}
