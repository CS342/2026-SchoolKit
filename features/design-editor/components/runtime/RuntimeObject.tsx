import React from 'react';
import { View, Text, Image } from 'react-native';
import type { StaticDesignObject } from '../../types/document';

export function RuntimeObject({ object, parentWidth }: { object: StaticDesignObject; parentWidth: number }) {
  switch (object.type) {
    case 'rect':
      return (
        <View
          style={{
            position: 'absolute',
            left: object.x,
            top: object.y,
            width: object.width,
            height: object.height,
            backgroundColor: object.fill,
            borderRadius: object.cornerRadius,
            opacity: object.opacity,
            borderWidth: object.strokeWidth || 0,
            borderColor: object.stroke || 'transparent',
            transform: object.rotation ? [{ rotate: `${object.rotation}deg` }] : undefined,
          }}
        />
      );

    case 'ellipse':
      return (
        <View
          style={{
            position: 'absolute',
            left: object.x,
            top: object.y,
            width: object.width,
            height: object.height,
            backgroundColor: object.fill,
            borderRadius: object.width / 2,
            opacity: object.opacity,
            borderWidth: object.strokeWidth || 0,
            borderColor: object.stroke || 'transparent',
            transform: object.rotation ? [{ rotate: `${object.rotation}deg` }] : undefined,
          }}
        />
      );

    case 'text':
      return (
        <View
          style={{
            position: 'absolute',
            left: object.x,
            top: object.y,
            width: object.width,
            opacity: object.opacity,
            transform: object.rotation ? [{ rotate: `${object.rotation}deg` }] : undefined,
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

    default:
      return null;
  }
}
