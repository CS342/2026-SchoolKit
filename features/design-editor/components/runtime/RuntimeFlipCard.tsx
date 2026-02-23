import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import type { InteractiveComponentObject, FlipCardConfig } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';

export function RuntimeFlipCard({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as FlipCardConfig;
  const [isFlipped, setIsFlipped] = useState(config.defaultSide === 'back');
  const animValue = useRef(new Animated.Value(config.defaultSide === 'back' ? 180 : 0)).current;

  const frontGroup = object.groups.find((g) => g.role === 'front');
  const backGroup = object.groups.find((g) => g.role === 'back');
  const frontChildren = object.children.filter((c) => frontGroup?.objectIds.includes(c.id));
  const backChildren = object.children.filter((c) => backGroup?.objectIds.includes(c.id));

  const handleFlip = () => {
    const toValue = isFlipped ? 0 : 180;
    Animated.timing(animValue, {
      toValue,
      duration: config.flipDuration,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = animValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = animValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const isHorizontal = config.flipDirection === 'horizontal';
  const frontTransform = isHorizontal
    ? [{ rotateY: frontInterpolate }]
    : [{ rotateX: frontInterpolate }];
  const backTransform = isHorizontal
    ? [{ rotateY: backInterpolate }]
    : [{ rotateX: backInterpolate }];

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={handleFlip}
      style={{
        position: 'absolute',
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
      }}
    >
      {/* Front */}
      <Animated.View
        style={{
          position: 'absolute',
          width: object.width,
          height: object.height,
          backfaceVisibility: 'hidden',
          transform: frontTransform,
        }}
      >
        {frontChildren.map((child) => (
          <RuntimeObject key={child.id} object={child} parentWidth={object.width} />
        ))}
      </Animated.View>

      {/* Back */}
      <Animated.View
        style={{
          position: 'absolute',
          width: object.width,
          height: object.height,
          backfaceVisibility: 'hidden',
          transform: backTransform,
        }}
      >
        {backChildren.map((child) => (
          <RuntimeObject key={child.id} object={child} parentWidth={object.width} />
        ))}
      </Animated.View>
    </TouchableOpacity>
  );
}
