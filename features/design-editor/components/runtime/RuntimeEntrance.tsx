import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Animated, LayoutChangeEvent } from 'react-native';
import type { InteractiveComponentObject, EntranceConfig } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';

interface RuntimeEntranceProps {
  object: InteractiveComponentObject;
  scrollY?: number;
  viewportHeight?: number;
}

export function RuntimeEntrance({ object, scrollY, viewportHeight }: RuntimeEntranceProps) {
  const config = object.interactionConfig as EntranceConfig;
  const [hasTriggered, setHasTriggered] = useState(config.trigger !== 'on-scroll');
  const [layoutY, setLayoutY] = useState<number | null>(null);

  const contentGroup = object.groups.find((g) => g.role === 'content');
  const contentChildren = object.children.filter((c) => contentGroup?.objectIds.includes(c.id));

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    if (config.trigger === 'on-scroll') {
      setLayoutY(e.nativeEvent.layout.y);
    }
  }, [config.trigger]);

  // Check if component is visible in viewport for on-scroll trigger
  useEffect(() => {
    if (hasTriggered || config.trigger !== 'on-scroll' || layoutY === null) return;
    const vH = viewportHeight ?? 844;
    const sY = scrollY ?? 0;
    // Trigger when element top enters the bottom 80% of viewport
    const triggerPoint = sY + vH * 0.8;
    if (layoutY <= triggerPoint) {
      setHasTriggered(true);
    }
  }, [scrollY, viewportHeight, layoutY, hasTriggered, config.trigger]);

  return (
    <View
      onLayout={handleLayout}
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
          shouldAnimate={hasTriggered}
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
  shouldAnimate,
}: {
  child: InteractiveComponentObject['children'][number];
  index: number;
  config: EntranceConfig;
  parentWidth: number;
  shouldAnimate: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(config.animation === 'slide-up' || config.animation === 'bounce' ? 30 : 0)).current;
  const scale = useRef(new Animated.Value(config.animation === 'scale-up' ? 0.8 : 1)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!shouldAnimate || hasAnimated.current) return;
    hasAnimated.current = true;

    const delay = index * config.staggerDelay;

    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(opacity, {
        toValue: 1,
        duration: config.duration,
        delay,
        useNativeDriver: true,
      }),
    ];

    if (config.animation === 'slide-up') {
      animations.push(
        Animated.timing(translateY, {
          toValue: 0,
          duration: config.duration,
          delay,
          useNativeDriver: true,
        }),
      );
    }

    if (config.animation === 'bounce') {
      // Use spring physics for bounce animation
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.spring(translateY, {
            toValue: 0,
            friction: config.springFriction ?? 8,
            tension: config.springTension ?? 40,
            useNativeDriver: true,
          }),
        ]),
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
  }, [shouldAnimate]);

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
