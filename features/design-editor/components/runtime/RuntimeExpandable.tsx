import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, UIManager, Platform, Animated, StyleSheet } from 'react-native';
import type { InteractiveComponentObject, ExpandableConfig } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';
import { COLORS, SHADOWS, RADII, BORDERS } from '../../../../constants/onboarding-theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function RuntimeExpandable({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as ExpandableConfig;
  const [isExpanded, setIsExpanded] = useState(config.defaultExpanded);
  const chevronRotation = useRef(new Animated.Value(config.defaultExpanded ? 1 : 0)).current;

  const headerGroup = object.groups.find((g) => g.role === 'header');
  const bodyGroup = object.groups.find((g) => g.role === 'body');
  const headerChildren = object.children.filter((c) => headerGroup?.objectIds.includes(c.id));
  const bodyChildren = object.children.filter((c) => bodyGroup?.objectIds.includes(c.id));

  // Compute header height dynamically from children bounds
  let headerHeight = 52;
  for (const child of headerChildren) {
    const bottom = child.y + child.height;
    if (bottom > headerHeight) headerHeight = bottom;
  }

  // Compute body bounds
  let bodyHeight = 0;
  for (const child of bodyChildren) {
    const bottom = child.y + child.height;
    if (bottom > bodyHeight) bodyHeight = bottom;
  }

  const toggle = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        config.expandDuration,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.scaleY,
      ),
    );

    // Animate chevron rotation
    Animated.timing(chevronRotation, {
      toValue: isExpanded ? 0 : 1,
      duration: config.expandDuration,
      useNativeDriver: true,
    }).start();

    setIsExpanded(!isExpanded);
  };

  const chevronRotateStyle = {
    transform: [{
      rotate: chevronRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
      }),
    }],
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: object.x,
        top: object.y,
        width: object.width,
        // Card chrome from school-nurse accordion
        borderRadius: RADII.card,
        borderWidth: BORDERS.card,
        overflow: 'hidden',
        backgroundColor: COLORS.white,
        borderColor: isExpanded ? COLORS.primary + '50' : COLORS.borderCard,
        ...SHADOWS.card,
      }}
    >
      {/* Header */}
      <TouchableOpacity activeOpacity={0.8} onPress={toggle}>
        <View style={{ position: 'relative', width: object.width, height: headerHeight, overflow: 'hidden' }}>
          {headerChildren.map((child) => (
            <RuntimeObject key={child.id} object={child} parentWidth={object.width} />
          ))}
          {/* Animated chevron */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                right: 16,
                top: (headerHeight - 20) / 2,
              },
              chevronRotateStyle,
            ]}
          >
            <Text
              style={{
                fontSize: 14,
                color: isExpanded ? COLORS.primary : COLORS.textLight,
              }}
            >
              ▼
            </Text>
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Body */}
      {isExpanded && (
        <>
          <View
            style={{
              height: StyleSheet.hairlineWidth,
              backgroundColor: COLORS.borderCard,
              marginHorizontal: 16,
            }}
          />
          <View style={{ position: 'relative', width: object.width, height: bodyHeight + 20, overflow: 'hidden' }}>
            {bodyChildren.map((child) => (
              <RuntimeObject key={child.id} object={child} parentWidth={object.width} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}
