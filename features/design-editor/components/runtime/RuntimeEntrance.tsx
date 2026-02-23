import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import type { InteractiveComponentObject, EntranceConfig } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';

export function RuntimeEntrance({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as EntranceConfig;

  const contentGroup = object.groups.find((g) => g.role === 'content');
  const contentChildren = object.children.filter((c) => contentGroup?.objectIds.includes(c.id));

  return (
    <View
      style={{
        position: 'absolute',
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        overflow: 'hidden',
      }}
    >
      {contentChildren.map((child, index) => (
        <EntranceChild
          key={child.id}
          child={child}
          index={index}
          config={config}
          parentWidth={object.width}
        />
      ))}
    </View>
  );
}

function EntranceChild({
  child,
  index,
  config,
  parentWidth,
}: {
  child: InteractiveComponentObject['children'][number];
  index: number;
  config: EntranceConfig;
  parentWidth: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(config.animation === 'slide-up' || config.animation === 'bounce' ? 30 : 0)).current;
  const scale = useRef(new Animated.Value(config.animation === 'scale-up' ? 0.8 : 1)).current;

  useEffect(() => {
    const delay = index * config.staggerDelay;

    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(opacity, {
        toValue: 1,
        duration: config.duration,
        delay,
        useNativeDriver: true,
      }),
    ];

    if (config.animation === 'slide-up' || config.animation === 'bounce') {
      animations.push(
        Animated.timing(translateY, {
          toValue: 0,
          duration: config.duration,
          delay,
          useNativeDriver: true,
        }),
      );
    }

    if (config.animation === 'scale-up') {
      animations.push(
        Animated.timing(scale, {
          toValue: 1,
          duration: config.duration,
          delay,
          useNativeDriver: true,
        }),
      );
    }

    Animated.parallel(animations).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    >
      <RuntimeObject object={child} parentWidth={parentWidth} />
    </Animated.View>
  );
}
