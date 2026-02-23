import React, { useState } from 'react';
import { View, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';
import type { InteractiveComponentObject, ExpandableConfig } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function RuntimeExpandable({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as ExpandableConfig;
  const [isExpanded, setIsExpanded] = useState(config.defaultExpanded);

  const headerGroup = object.groups.find((g) => g.role === 'header');
  const bodyGroup = object.groups.find((g) => g.role === 'body');
  const headerChildren = object.children.filter((c) => headerGroup?.objectIds.includes(c.id));
  const bodyChildren = object.children.filter((c) => bodyGroup?.objectIds.includes(c.id));

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
    setIsExpanded(!isExpanded);
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: object.x,
        top: object.y,
        width: object.width,
      }}
    >
      {/* Header */}
      <TouchableOpacity activeOpacity={0.8} onPress={toggle}>
        <View style={{ position: 'relative', width: object.width, height: 52, overflow: 'hidden' }}>
          {headerChildren.map((child) => (
            <RuntimeObject key={child.id} object={child} parentWidth={object.width} />
          ))}
        </View>
      </TouchableOpacity>

      {/* Body */}
      {isExpanded && (
        <View style={{ position: 'relative', width: object.width, height: bodyHeight + 20, overflow: 'hidden' }}>
          {bodyChildren.map((child) => (
            <RuntimeObject key={child.id} object={child} parentWidth={object.width} />
          ))}
        </View>
      )}
    </View>
  );
}
