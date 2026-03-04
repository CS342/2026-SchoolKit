import React from 'react';
import { View, Text, Image, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

// ─── Component ────────────────────────────────────────────────

export function RuntimeObject({ object, parentWidth }: { object: StaticDesignObject; parentWidth: number }) {
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
      };

      if (object.gradient) {
        const gp = getGradientProps(object.gradient);
        return (
          <View style={{ ...baseStyle, overflow: 'hidden' }}>
            <LinearGradient
              colors={gp.colors}
              start={gp.start}
              end={gp.end}
              style={StyleSheet.absoluteFill}
            />
          </View>
        );
      }

      return <View style={{ ...baseStyle, backgroundColor: object.fill }} />;
    }

    case 'ellipse': {
      const baseStyle = {
        position: 'absolute' as const,
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        borderRadius: object.width / 2,
        opacity: object.opacity,
        borderWidth: object.strokeWidth || 0,
        borderColor: object.stroke || 'transparent',
        transform: object.rotation ? [{ rotate: `${object.rotation}deg` }] : undefined,
        ...getShadowStyle(object.shadow),
      };

      if (object.gradient) {
        const gp = getGradientProps(object.gradient);
        return (
          <View style={{ ...baseStyle, overflow: 'hidden' }}>
            <LinearGradient
              colors={gp.colors}
              start={gp.start}
              end={gp.end}
              style={StyleSheet.absoluteFill}
            />
          </View>
        );
      }

      return <View style={{ ...baseStyle, backgroundColor: object.fill }} />;
    }

    case 'text':
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
          }}
        >
          <Text
            style={{
              color: object.fill,
              fontSize: object.fontSize,
              fontFamily: object.fontFamily === 'Arial' ? undefined : object.fontFamily,
              fontWeight: object.fontStyle.includes('bold') ? 'bold' : 'normal',
              fontStyle: object.fontStyle.includes('italic') ? 'italic' : 'normal',
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
            {object.text}
          </Text>
        </View>
      );

    case 'image':
      return (
        <Image
          source={{ uri: object.src }}
          style={{
            position: 'absolute',
            left: object.x,
            top: object.y,
            width: object.width,
            height: object.height,
            opacity: object.opacity,
            transform: object.rotation ? [{ rotate: `${object.rotation}deg` }] : undefined,
          }}
          resizeMode="cover"
        />
      );

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
          }}
        />
      );

    case 'badge': {
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
      };

      const textStyle = {
        color: object.textColor,
        fontSize: object.fontSize,
        fontFamily: object.fontFamily === 'Arial' ? undefined : object.fontFamily,
        fontWeight: object.fontStyle.includes('bold') ? ('bold' as const) : ('normal' as const),
        fontStyle: object.fontStyle.includes('italic') ? ('italic' as const) : ('normal' as const),
        textAlign: (object.align || 'center') as any,
        letterSpacing: object.letterSpacing || 0,
        textDecorationLine: (object.textDecoration as any) || 'none',
      };

      if (object.gradient) {
        const gp = getGradientProps(object.gradient);
        return (
          <View style={badgeStyle}>
            <LinearGradient colors={gp.colors} start={gp.start} end={gp.end} style={StyleSheet.absoluteFill} />
            <Text style={textStyle}>{object.text}</Text>
          </View>
        );
      }

      return (
        <View style={{ ...badgeStyle, backgroundColor: object.fill }}>
          <Text style={textStyle}>{object.text}</Text>
        </View>
      );
    }

    default:
      return null;
  }
}
