import React, { useRef, useEffect } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import type { DesignDocument, DesignObject, InteractiveComponentObject, StaticDesignObject } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';
import { RuntimeFlipCard } from './RuntimeFlipCard';
import { RuntimeBottomSheet } from './RuntimeBottomSheet';
import { RuntimeExpandable } from './RuntimeExpandable';
import { RuntimeEntrance } from './RuntimeEntrance';
import { RuntimeCarousel } from './RuntimeCarousel';
import { RuntimeTabs } from './RuntimeTabs';
import { RuntimeQuiz } from './RuntimeQuiz';

interface RuntimeRendererProps {
  doc: DesignDocument;
  width: number;
}

export function RuntimeRenderer({ doc, width }: RuntimeRendererProps) {
  const scale = width / doc.canvas.width;
  const scaledHeight = doc.canvas.height * scale;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: doc.canvas.background }}
      contentContainerStyle={{
        minHeight: scaledHeight,
      }}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <View
          style={{
            width: doc.canvas.width,
            height: doc.canvas.height,
            backgroundColor: doc.canvas.background,
            transform: [{ scale }],
            transformOrigin: 'top left',
          }}
        >
          {doc.objects
            .filter((o) => o.visible)
            .map((obj) => (
              <RuntimeDesignObject key={obj.id} object={obj} />
            ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function RuntimeDesignObject({ object }: { object: DesignObject }) {
  if (object.type === 'interactive') {
    return <RuntimeInteractive object={object} />;
  }
  return <RuntimeObject object={object as StaticDesignObject} parentWidth={0} />;
}

function RuntimeInteractive({ object }: { object: InteractiveComponentObject }) {
  switch (object.interactionType) {
    case 'flip-card':
      return <RuntimeFlipCard object={object} />;
    case 'bottom-sheet':
      return <RuntimeBottomSheet object={object} />;
    case 'expandable':
      return <RuntimeExpandable object={object} />;
    case 'entrance':
      return <RuntimeEntrance object={object} />;
    case 'carousel':
      return <RuntimeCarousel object={object} />;
    case 'tabs':
      return <RuntimeTabs object={object} />;
    case 'quiz':
      return <RuntimeQuiz object={object} />;
    default:
      return null;
  }
}
