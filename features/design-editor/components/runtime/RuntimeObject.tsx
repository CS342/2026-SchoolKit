import React from 'react';
import { View, Text, Image, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Line as SvgLine, Defs, Marker, Path } from 'react-native-svg';
import type { StaticDesignObject, ShadowConfig, GradientConfig } from '../../types/document';

// ─── Helpers ──────────────────────────────────────────────────

function getShadowStyle(shadow?: ShadowConfig | null) {
  if (!shadow) return {};
  return {
    shadowColor: shadow.color,
    shadowOffset: { width: shadow.offsetX, height: shadow.offsetY },
    shadowOpacity: 1,
    shadowRadius: shadow.blur,
    ...(Platform.OS === 'android' ? { elevation: Math.max(1, Math.round(shadow.blur / 2)) } : {}),
  };
}

function getGradientProps(gradient: GradientConfig) {
  const angle = gradient.angle ?? 0;
  const rad = ((angle - 90) * Math.PI) / 180;
  const dx = Math.cos(rad) * 0.5;
  const dy = Math.sin(rad) * 0.5;
  return {
    colors: gradient.colors as [string, string, ...string[]],
    start: { x: 0.5 - dx, y: 0.5 - dy },
    end: { x: 0.5 + dx, y: 0.5 + dy },
  };
}

function applyTextTransform(text: string, transform?: string): string {
  switch (transform) {
    case 'uppercase': return text.toUpperCase();
    case 'lowercase': return text.toLowerCase();
    case 'capitalize': return text.replace(/\b\w/g, (c) => c.toUpperCase());
    default: return text;
  }
}

function getA11yProps(object: StaticDesignObject) {
  const props: Record<string, any> = {};
  if (object.accessibilityLabel) {
    props.accessibilityLabel = object.accessibilityLabel;
    props.accessible = true;
  }
  if (object.type === 'text') props.accessibilityRole = 'text';
  if (object.type === 'image') props.accessibilityRole = 'image';
  if (object.type === 'badge') props.accessibilityRole = 'text';
  return props;
}

function getBlendStyle(blendMode?: string): Record<string, any> {
  if (!blendMode || blendMode === 'normal') return {};
  // mixBlendMode works on web; ignored on native
  return { mixBlendMode: blendMode } as any;
}

// ─── Component ────────────────────────────────────────────────

export function RuntimeObject({ object, parentWidth }: { object: StaticDesignObject; parentWidth: number }) {
  const a11y = getA11yProps(object);
  const blend = getBlendStyle(object.blendMode);

  switch (object.type) {
    case 'rect': {
      const baseStyle = {
        position: 'absolute' as const,
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        borderRadius: object.cornerRadius,
        opacity: object.opacity,
        borderWidth: object.strokeWidth || 0,
        borderColor: object.stroke || 'transparent',
        transform: object.rotation ? [{ rotate: `${object.rotation}deg` }] : undefined,
        ...getShadowStyle(object.shadow),
        ...blend,
      };

      if (object.gradient) {
        const gp = getGradientProps(object.gradient);
        return (
          <View style={{ ...baseStyle, overflow: 'hidden' }} {...a11y}>
            <LinearGradient
              colors={gp.colors}
              start={gp.start}
              end={gp.end}
              style={StyleSheet.absoluteFill}
            />
          </View>
        );
      }

      return <View style={{ ...baseStyle, backgroundColor: object.fill }} {...a11y} />;
    }

    case 'ellipse': {
      const baseStyle = {
        position: 'absolute' as const,
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        borderRadius: 9999,
        opacity: object.opacity,
        borderWidth: object.strokeWidth || 0,
        borderColor: object.stroke || 'transparent',
        transform: object.rotation ? [{ rotate: `${object.rotation}deg` }] : undefined,
        ...getShadowStyle(object.shadow),
        ...blend,
      };

      if (object.gradient) {
        const gp = getGradientProps(object.gradient);
        return (
          <View style={{ ...baseStyle, overflow: 'hidden' }} {...a11y}>
            <LinearGradient
              colors={gp.colors}
              start={gp.start}
              end={gp.end}
              style={StyleSheet.absoluteFill}
            />
          </View>
        );
      }

      return <View style={{ ...baseStyle, backgroundColor: object.fill }} {...a11y} />;
    }

    case 'text': {
      const resolvedWeight = object.fontWeight ?? (object.fontStyle.includes('bold') ? '700' : '400');
      const displayText = applyTextTransform(object.text, object.textTransform);
      return (
        <View
          style={{
            position: 'absolute',
            left: object.x,
            top: object.y,
            width: object.width,
            height: object.height,
            opacity: object.opacity,
            transform: object.rotation ? [{ rotate: `${object.rotation}deg` }] : undefined,
            justifyContent:
              object.verticalAlign === 'middle' ? 'center' :
              object.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
            padding: object.padding || 0,
            ...blend,
          }}
          {...a11y}
        >
          <Text
            style={{
              color: object.fill,
              fontSize: object.fontSize,
              fontFamily: object.fontFamily === 'Arial' ? undefined : object.fontFamily,
              fontWeight: resolvedWeight,
              fontStyle: object.fontStyle.includes('italic') ? 'italic' : 'normal',
              fontVariant: object.fontVariant === 'small-caps' ? ['small-caps'] : undefined,
              textAlign: object.align,
              lineHeight: object.fontSize * object.lineHeight,
              letterSpacing: object.letterSpacing || 0,
              textDecorationLine: (object.textDecoration as any) || 'none',
              textShadowColor: object.shadow?.color,
              textShadowOffset: object.shadow
                ? { width: object.shadow.offsetX, height: object.shadow.offsetY }
                : undefined,
              textShadowRadius: object.shadow?.blur,
            }}
          >
            {displayText}
          </Text>
        </View>
      );
    }

    case 'image': {
      const imgCornerRadius = (object as any).cornerRadius ?? 0;
      const imgObjectFit = (object as any).objectFit ?? 'cover';
      const imgStroke = (object as any).stroke;
      const imgStrokeWidth = (object as any).strokeWidth ?? 0;
      const imgShadow = (object as any).shadow;
      const resizeMode = imgObjectFit === 'contain' ? 'contain' : imgObjectFit === 'fill' ? 'stretch' : 'cover';
      return (
        <View
          style={{
            position: 'absolute',
            left: object.x,
            top: object.y,
            width: object.width,
            height: object.height,
            opacity: object.opacity,
            borderRadius: imgCornerRadius,
            overflow: 'hidden',
            borderWidth: imgStrokeWidth || 0,
            borderColor: imgStroke || 'transparent',
            transform: object.rotation ? [{ rotate: `${object.rotation}deg` }] : undefined,
            ...getShadowStyle(imgShadow),
            ...blend,
          }}
          {...a11y}
        >
          <Image
            source={{ uri: object.src }}
            style={{ width: '100%', height: '100%' }}
            resizeMode={resizeMode as any}
            accessibilityLabel={object.accessibilityLabel}
          />
        </View>
      );
    }

    case 'line':
      return (
        <View
          style={{
            position: 'absolute',
            left: object.x,
            top: object.y,
            width: object.width || 200,
            height: object.strokeWidth || 2,
            backgroundColor: object.stroke,
            opacity: object.opacity,
            transform: object.rotation ? [{ rotate: `${object.rotation}deg` }] : undefined,
            ...blend,
          }}
          {...a11y}
        />
      );

    case 'badge': {
      const badgeWeight = object.fontWeight ?? (object.fontStyle.includes('bold') ? '700' : '400');
      const badgeText = applyTextTransform(object.text, object.textTransform);
      const badgeStyle = {
        position: 'absolute' as const,
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        borderRadius: object.cornerRadius,
        opacity: object.opacity,
        overflow: 'hidden' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingHorizontal: object.paddingX,
        paddingVertical: object.paddingY,
        transform: object.rotation ? [{ rotate: `${object.rotation}deg` }] : undefined,
        ...getShadowStyle(object.shadow),
        ...blend,
      };

      const textStyle = {
        color: object.textColor,
        fontSize: object.fontSize,
        fontFamily: object.fontFamily === 'Arial' ? undefined : object.fontFamily,
        fontWeight: badgeWeight as any,
        fontStyle: object.fontStyle.includes('italic') ? ('italic' as const) : ('normal' as const),
        textAlign: (object.align || 'center') as any,
        letterSpacing: object.letterSpacing || 0,
        textDecorationLine: (object.textDecoration as any) || 'none',
      };

      if (object.gradient) {
        const gp = getGradientProps(object.gradient);
        return (
          <View style={badgeStyle} {...a11y}>
            <LinearGradient colors={gp.colors} start={gp.start} end={gp.end} style={StyleSheet.absoluteFill} />
            <Text style={textStyle}>{badgeText}</Text>
          </View>
        );
      }

      return (
        <View style={{ ...badgeStyle, backgroundColor: object.fill }} {...a11y}>
          <Text style={textStyle}>{badgeText}</Text>
        </View>
      );
    }

    case 'star': {
      const cx = object.width / 2;
      const cy = object.height / 2;
      const outerR = Math.min(object.width, object.height) / 2;
      const innerR = outerR * (object.innerRadius ?? 0.5);
      const numPoints = object.points ?? 5;
      const pts: string[] = [];
      for (let i = 0; i < numPoints * 2; i++) {
        const angle = (Math.PI / numPoints) * i - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return (
        <View
          style={{
            position: 'absolute',
            left: object.x,
            top: object.y,
            width: object.width,
            height: object.height,
            opacity: object.opacity,
            transform: object.rotation ? [{ rotate: `${object.rotation}deg` }] : undefined,
            ...getShadowStyle(object.shadow),
          }}
        >
          <Svg width={object.width} height={object.height}>
            <Polygon
              points={pts.join(' ')}
              fill={object.fill}
              stroke={object.stroke || 'none'}
              strokeWidth={object.strokeWidth || 0}
            />
          </Svg>
        </View>
      );
    }

    case 'triangle': {
      const triPts = `${object.width / 2},0 ${object.width},${object.height} 0,${object.height}`;
      return (
        <View
          style={{
            position: 'absolute',
            left: object.x,
            top: object.y,
            width: object.width,
            height: object.height,
            opacity: object.opacity,
            transform: object.rotation ? [{ rotate: `${object.rotation}deg` }] : undefined,
            ...getShadowStyle(object.shadow),
          }}
        >
          <Svg width={object.width} height={object.height}>
            <Polygon
              points={triPts}
              fill={object.fill}
              stroke={object.stroke || 'none'}
              strokeWidth={object.strokeWidth || 0}
            />
          </Svg>
        </View>
      );
    }

    case 'arrow': {
      const points = object.points ?? [0, 0, 100, 0];
      const x1 = points[0], y1 = points[1], x2 = points[2], y2 = points[3];
      const svgW = Math.max(Math.abs(x2 - x1), 1) + (object.pointerLength ?? 15) * 2;
      const svgH = Math.max(Math.abs(y2 - y1), 1) + (object.pointerWidth ?? 12) * 2;
      const padX = object.pointerLength ?? 15;
      const padY = object.pointerWidth ?? 12;
      const markerId = `arrow_${object.id || 'head'}`;
      return (
        <View
          style={{
            position: 'absolute',
            left: object.x,
            top: object.y,
            width: svgW,
            height: svgH,
            opacity: object.opacity,
            transform: object.rotation ? [{ rotate: `${object.rotation}deg` }] : undefined,
          }}
        >
          <Svg width={svgW} height={svgH}>
            <Defs>
              <Marker
                id={markerId}
                markerWidth={String(object.pointerLength ?? 15)}
                markerHeight={String(object.pointerWidth ?? 12)}
                refX={String(object.pointerLength ?? 15)}
                refY={String((object.pointerWidth ?? 12) / 2)}
                orient="auto"
              >
                <Path
                  d={`M0,0 L${object.pointerLength ?? 15},${(object.pointerWidth ?? 12) / 2} L0,${object.pointerWidth ?? 12} Z`}
                  fill={object.fill || object.stroke}
                />
              </Marker>
            </Defs>
            <SvgLine
              x1={Math.min(x1, x2) === x1 ? padX : svgW - padX}
              y1={Math.min(y1, y2) === y1 ? padY : svgH - padY}
              x2={Math.min(x1, x2) === x1 ? svgW - padX : padX}
              y2={Math.min(y1, y2) === y1 ? svgH - padY : padY}
              stroke={object.stroke}
              strokeWidth={object.strokeWidth || 2}
              markerEnd={`url(#${markerId})`}
            />
          </Svg>
        </View>
      );
    }

    default:
      return null;
  }
}
