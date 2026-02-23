import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Animated, Dimensions } from 'react-native';
import type { InteractiveComponentObject, BottomSheetConfig } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';

export function RuntimeBottomSheet({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as BottomSheetConfig;
  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const triggerGroup = object.groups.find((g) => g.role === 'trigger');
  const contentGroup = object.groups.find((g) => g.role === 'content');
  const triggerChildren = object.children.filter((c) => triggerGroup?.objectIds.includes(c.id));
  const contentChildren = object.children.filter((c) => contentGroup?.objectIds.includes(c.id));

  const sheetHeight = (object.height * config.sheetHeightPercent) / 100;

  const open = () => {
    setIsOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: config.slideDuration,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: config.slideDuration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const close = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: config.slideDuration,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: config.slideDuration,
        useNativeDriver: true,
      }),
    ]).start(() => setIsOpen(false));
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight, 0],
  });

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
      {/* Trigger */}
      <TouchableOpacity activeOpacity={0.8} onPress={open} style={{ flex: 1 }}>
        <View style={{ position: 'relative', width: object.width, height: object.height }}>
          {triggerChildren.map((child) => (
            <RuntimeObject key={child.id} object={child} parentWidth={object.width} />
          ))}
        </View>
      </TouchableOpacity>

      {/* Backdrop */}
      {isOpen && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000',
            opacity: backdropAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, config.backdropOpacity],
            }),
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={config.dismissOnBackdropTap ? close : undefined}
          />
        </Animated.View>
      )}

      {/* Sheet */}
      {isOpen && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: object.width,
            height: sheetHeight,
            transform: [{ translateY }],
          }}
        >
          {contentChildren.map((child) => (
            <RuntimeObject key={child.id} object={child} parentWidth={object.width} />
          ))}
        </Animated.View>
      )}
    </View>
  );
}
