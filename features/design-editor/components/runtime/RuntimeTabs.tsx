import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import type { InteractiveComponentObject, TabsConfig } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';
import { COLORS_LIGHT, COLORS_DARK } from '../../../../constants/theme';

export function RuntimeTabs({ object, isDark = false }: { object: InteractiveComponentObject; isDark?: boolean }) {
  const config = object.interactionConfig as TabsConfig;
  const tabGroups = object.groups.filter((g) => g.role.startsWith('tab-'));
  const [activeTab, setActiveTab] = useState(config.defaultTab);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const palette = isDark ? COLORS_DARK : COLORS_LIGHT;

  const switchTab = (i: number) => {
    if (i === activeTab) return;
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setActiveTab(i);
      Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }).start();
    });
  };

  const currentGroup = tabGroups[activeTab];
  const visibleChildren = currentGroup
    ? object.children.filter((c) => currentGroup.objectIds.includes(c.id))
    : [];

  const tabBar = (
    <View
      style={{
        flexDirection: 'row',
        borderBottomWidth: config.tabStyle === 'underline' ? 1 : 0,
        borderBottomColor: palette.borderCard,
        gap: config.tabStyle === 'pill' ? 6 : 0,
        padding: config.tabStyle === 'pill' ? 4 : 0,
      }}
    >
      {tabGroups.map((group, i) => {
        const isActive = i === activeTab;
        return (
          <TouchableOpacity
            key={group.role}
            onPress={() => switchTab(i)}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              alignItems: 'center',
              borderBottomWidth: config.tabStyle === 'underline' ? 2 : 0,
              borderBottomColor: config.tabStyle === 'underline' && isActive ? palette.primary : 'transparent',
              borderRadius: config.tabStyle === 'pill' ? 8 : config.tabStyle === 'boxed' ? 0 : 0,
              backgroundColor:
                config.tabStyle === 'pill'
                  ? isActive ? palette.primaryFill : palette.appBackgroundAlt
                  : config.tabStyle === 'boxed' && isActive ? palette.primarySoft : 'transparent',
              borderWidth: config.tabStyle === 'boxed' ? 1 : 0,
              borderColor: config.tabStyle === 'boxed' && isActive ? palette.primary : palette.borderCard,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color:
                  config.tabStyle === 'pill' && isActive ? '#fff'
                  : isActive ? palette.primary : palette.textLight,
              }}
            >
              {group.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

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
      {config.tabPosition === 'top' && tabBar}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {visibleChildren.map((child) => (
          <RuntimeObject key={child.id} object={child} parentWidth={object.width} isDark={isDark} />
        ))}
      </Animated.View>
      {config.tabPosition === 'bottom' && tabBar}
    </View>
  );
}
