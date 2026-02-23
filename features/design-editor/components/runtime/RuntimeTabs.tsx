import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import type { InteractiveComponentObject, TabsConfig } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';

export function RuntimeTabs({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as TabsConfig;
  const tabGroups = object.groups.filter((g) => g.role.startsWith('tab-'));
  const [activeTab, setActiveTab] = useState(config.defaultTab);

  const currentGroup = tabGroups[activeTab];
  const visibleChildren = currentGroup
    ? object.children.filter((c) => currentGroup.objectIds.includes(c.id))
    : [];

  const tabBar = (
    <View
      style={{
        flexDirection: 'row',
        borderBottomWidth: config.tabStyle === 'underline' ? 1 : 0,
        borderBottomColor: '#E8E8F0',
        gap: config.tabStyle === 'pill' ? 6 : 0,
        padding: config.tabStyle === 'pill' ? 4 : 0,
      }}
    >
      {tabGroups.map((group, i) => {
        const isActive = i === activeTab;
        return (
          <TouchableOpacity
            key={group.role}
            onPress={() => setActiveTab(i)}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              alignItems: 'center',
              borderBottomWidth: config.tabStyle === 'underline' ? 2 : 0,
              borderBottomColor: config.tabStyle === 'underline' && isActive ? '#7B68EE' : 'transparent',
              borderRadius: config.tabStyle === 'pill' ? 8 : config.tabStyle === 'boxed' ? 0 : 0,
              backgroundColor:
                config.tabStyle === 'pill'
                  ? isActive ? '#7B68EE' : '#F3F4F6'
                  : config.tabStyle === 'boxed' && isActive ? '#F0EBFF' : 'transparent',
              borderWidth: config.tabStyle === 'boxed' ? 1 : 0,
              borderColor: config.tabStyle === 'boxed' && isActive ? '#7B68EE' : '#E8E8F0',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color:
                  config.tabStyle === 'pill' && isActive ? '#fff'
                  : isActive ? '#7B68EE' : '#8E8EA8',
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
      <View style={{ flex: 1 }}>
        {visibleChildren.map((child) => (
          <RuntimeObject key={child.id} object={child} parentWidth={object.width} />
        ))}
      </View>
      {config.tabPosition === 'bottom' && tabBar}
    </View>
  );
}
