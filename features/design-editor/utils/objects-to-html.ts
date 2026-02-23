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

  // Add gradient CSS if applicable
  const gradientStyle = getGradientCSS(obj);
  // Add shadow CSS if applicable
  const shadowStyle = getShadowCSS(obj);
  // Add blur CSS if applicable
  const blurStyle = getBlurCSS(obj);

  switch (obj.type) {
    case 'rect':
      return {
        ...base,
        backgroundColor: obj.gradient ? undefined : obj.fill,
        ...gradientStyle,
        border: obj.stroke && obj.strokeWidth
          ? `${obj.strokeWidth}px solid ${obj.stroke}`
          : undefined,
        borderRadius: obj.cornerRadius,
        ...shadowStyle,
        ...blurStyle,
      };

    case 'ellipse':
      return {
        ...base,
        backgroundColor: obj.gradient ? undefined : obj.fill,
        ...gradientStyle,
        borderRadius: '50%',
        border: obj.stroke && obj.strokeWidth
          ? `${obj.strokeWidth}px solid ${obj.stroke}`
          : undefined,
        ...shadowStyle,
        ...blurStyle,
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
        ...shadowStyle,
      };

    case 'image':
      return {
        ...base,
        backgroundImage: `url(${obj.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };

    case 'line':
      return {
        ...base,
        height: obj.strokeWidth || 2,
        backgroundColor: obj.stroke,
        transformOrigin: '0 0',
      };

    case 'star':
      return {
        ...base,
        backgroundColor: obj.fill,
        // Star approximation via clip-path isn't perfect, but good enough for preview
        clipPath: getStarClipPath(obj.points, obj.innerRadius),
        ...shadowStyle,
      };

    case 'triangle':
      return {
        ...base,
        backgroundColor: obj.gradient ? undefined : obj.fill,
        ...gradientStyle,
        clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
        ...shadowStyle,
      };

    case 'arrow':
      return {
        ...base,
        height: obj.strokeWidth || 2,
        backgroundColor: obj.stroke,
        transformOrigin: '0 0',
      };

    case 'badge':
      return {
        ...base,
        backgroundColor: obj.gradient ? undefined : obj.fill,
        ...gradientStyle,
        borderRadius: obj.cornerRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...shadowStyle,
      };

    default:
      return base;
  }
}

/** Get the text content for text objects. */
export function getTextContent(obj: StaticDesignObject): string | null {
  if (obj.type === 'text') return obj.text;
  if (obj.type === 'badge') return obj.text;
  return null;
}

function getGradientCSS(obj: StaticDesignObject): React.CSSProperties {
  const gradient = (obj as any).gradient;
  if (!gradient) return {};
  const colors = gradient.colors?.join(', ') || '#7B68EE, #0EA5E9';
  if (gradient.type === 'radial') {
    return { background: `radial-gradient(circle, ${colors})` };
  }
  const angle = gradient.angle ?? 0;
  return { background: `linear-gradient(${angle}deg, ${colors})` };
}

function getShadowCSS(obj: StaticDesignObject): React.CSSProperties {
  const shadow = (obj as any).shadow;
  if (!shadow) return {};
  if (obj.type === 'text') {
    return { textShadow: `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}` };
  }
  return { boxShadow: `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}` };
}

function getBlurCSS(obj: StaticDesignObject): React.CSSProperties {
  const blur = (obj as any).blur;
  if (!blur || blur <= 0) return {};
  return { filter: `blur(${blur}px)` };
}

function getStarClipPath(numPoints: number, innerRadius: number): string {
  const points: string[] = [];
  const totalPoints = numPoints * 2;
  for (let i = 0; i < totalPoints; i++) {
    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
    const radius = i % 2 === 0 ? 50 : 50 * innerRadius;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    points.push(`${x}% ${y}%`);
  }
  return `polygon(${points.join(', ')})`;
}
