import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Animated, NativeSyntheticEvent, NativeScrollEvent, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { DesignDocument, DesignObject, InteractiveComponentObject, StaticDesignObject, GradientConfig } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';
import { RuntimeFlipCard } from './RuntimeFlipCard';
import { RuntimeBottomSheet } from './RuntimeBottomSheet';
import { RuntimeExpandable } from './RuntimeExpandable';
import { RuntimeEntrance } from './RuntimeEntrance';
import { RuntimeCarousel } from './RuntimeCarousel';
import { RuntimeTabs } from './RuntimeTabs';
import { RuntimeQuiz } from './RuntimeQuiz';
import { getThemeAwareColor } from '../../utils/theme-mapper';

interface RuntimeRendererProps {
  doc: DesignDocument;
  width: number;
  onScroll?: (e: any) => void;
  scrollEventThrottle?: number;
  onLayout?: (e: any) => void;
  onContentSizeChange?: (w: number, h: number) => void;
  isDark?: boolean;
}

export function RuntimeRenderer({ doc, width, onScroll, scrollEventThrottle, onLayout, onContentSizeChange, isDark = false }: RuntimeRendererProps) {
  const scale = width / doc.canvas.width;
  const scaledHeight = doc.canvas.height * scale;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(844);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    // Convert from scaled coords back to canvas coords
    setScrollY(y / scale);
    setViewportHeight(e.nativeEvent.layoutMeasurement.height / scale);
    onScroll?.(e);
  }, [scale, onScroll]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: getThemeAwareColor(doc.canvas.background, isDark) }}
      contentContainerStyle={{
        minHeight: scaledHeight,
      }}
      onScroll={handleScroll}
      scrollEventThrottle={scrollEventThrottle ?? 16}
      onLayout={onLayout}
      onContentSizeChange={onContentSizeChange}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <View
          style={{
            width: doc.canvas.width,
            height: doc.canvas.height,
            backgroundColor: getThemeAwareColor(doc.canvas.background, isDark),
            transform: [{ scale }],
            ...(Platform.OS === 'web' ? { transformOrigin: 'top left' } as any : {}),
          }}
        >
          {doc.canvas.backgroundGradient && (
            <CanvasGradientBG gradient={doc.canvas.backgroundGradient} isDark={isDark} />
          )}
          {doc.objects
            .filter((o) => o.visible)
            .map((obj) => (
              <RuntimeDesignObject key={obj.id} object={obj} scrollY={scrollY} viewportHeight={viewportHeight} isDark={isDark} />
            ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function RuntimeDesignObject({ object, scrollY, viewportHeight, isDark }: { object: DesignObject; scrollY?: number; viewportHeight?: number; isDark: boolean }) {
  if (object.type === 'interactive') {
    return <RuntimeInteractive object={object} scrollY={scrollY} viewportHeight={viewportHeight} isDark={isDark} />;
  }
  return <RuntimeObject object={object as StaticDesignObject} parentWidth={0} isDark={isDark} />;
}

function RuntimeInteractive({ object, scrollY, viewportHeight, isDark }: { object: InteractiveComponentObject; scrollY?: number; viewportHeight?: number; isDark: boolean }) {
  switch (object.interactionType) {
    case 'flip-card':
      return <RuntimeFlipCard object={object} isDark={isDark} />;
    case 'bottom-sheet':
      return <RuntimeBottomSheet object={object} isDark={isDark} />;
    case 'expandable':
      return <RuntimeExpandable object={object} isDark={isDark} />;
    case 'entrance':
      return <RuntimeEntrance object={object} scrollY={scrollY} viewportHeight={viewportHeight} isDark={isDark} />;
    case 'carousel':
      return <RuntimeCarousel object={object} isDark={isDark} />;
    case 'tabs':
      return <RuntimeTabs object={object} isDark={isDark} />;
    case 'quiz':
      return <RuntimeQuiz object={object} isDark={isDark} />;
    default:
      return null;
  }
}

function CanvasGradientBG({ gradient, isDark }: { gradient: GradientConfig, isDark: boolean }) {
  const angle = gradient.angle ?? 0;
  const rad = ((angle - 90) * Math.PI) / 180;
  const dx = Math.cos(rad) * 0.5;
  const dy = Math.sin(rad) * 0.5;
  return (
    <LinearGradient
      colors={gradient.colors.map(c => getThemeAwareColor(c, isDark)) as [string, string, ...string[]]}
      start={gradient.type === 'radial' ? { x: 0.5, y: 0.5 } : { x: 0.5 - dx, y: 0.5 - dy }}
      end={gradient.type === 'radial' ? { x: 1, y: 1 } : { x: 0.5 + dx, y: 0.5 + dy }}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
}
