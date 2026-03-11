import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import type { InteractiveComponentObject, FlipCardConfig } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';

export function RuntimeFlipCard({ object, isDark = false }: { object: InteractiveComponentObject; isDark?: boolean }) {
  const config = object.interactionConfig as FlipCardConfig;
  const [isFlipped, setIsFlipped] = useState(config.defaultSide === 'back');
  const animValue = useRef(new Animated.Value(config.defaultSide === 'back' ? 180 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const frontGroup = object.groups.find((g) => g.role === 'front');
  const backGroup = object.groups.find((g) => g.role === 'back');
  const frontChildren = object.children.filter((c) => frontGroup?.objectIds.includes(c.id));
  const backChildren = object.children.filter((c) => backGroup?.objectIds.includes(c.id));

  const handleFlip = () => {
    // Press bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
    ]).start();

    // Flip animation
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
        // Card shadow (SHADOWS.card pattern from onboarding-theme)
        shadowColor: '#2D2D44',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }], width: object.width, height: object.height }}>
        {/* Front */}
        <Animated.View
          style={{
            position: 'absolute',
            width: object.width,
            height: object.height,
            backfaceVisibility: 'hidden',
            transform: frontTransform,
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          {frontChildren.map((child) => (
            <RuntimeObject key={child.id} object={child} parentWidth={object.width} isDark={isDark} />
          ))}
          {/* Tap to flip hint */}
          {!isFlipped && (
            <View
              style={{
                position: 'absolute',
                bottom: 12,
                left: 0,
                right: 0,
                alignItems: 'center',
              }}
              pointerEvents="none"
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: 'rgba(255,255,255,0.55)',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                Tap to flip
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Back */}
        <Animated.View
          style={{
            position: 'absolute',
            width: object.width,
            height: object.height,
            backfaceVisibility: 'hidden',
            transform: backTransform,
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          {backChildren.map((child) => (
            <RuntimeObject key={child.id} object={child} parentWidth={object.width} isDark={isDark} />
          ))}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}
