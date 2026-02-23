import React, { useState } from 'react';
import type { InteractiveComponentObject, TabsConfig } from '../../types/document';
import { PreviewObject } from './PreviewObject';

export function PreviewTabs({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as TabsConfig;
  const tabGroups = object.groups.filter((g) => g.role.startsWith('tab-'));
  const [activeTab, setActiveTab] = useState(config.defaultTab);

  const currentGroup = tabGroups[activeTab];
  const visibleChildren = currentGroup
    ? object.children.filter((c) => currentGroup.objectIds.includes(c.id))
    : [];

  const tabBar = (
    <div
      style={{
        display: 'flex',
        borderBottom: config.tabStyle === 'underline' ? '1px solid #E8E8F0' : undefined,
        gap: config.tabStyle === 'pill' ? 6 : 0,
        padding: config.tabStyle === 'pill' ? '4px' : 0,
      }}
    >
      {tabGroups.map((group, i) => {
        const isActive = i === activeTab;
        let tabStyle: React.CSSProperties = {
          flex: 1,
          padding: '8px 12px',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          transition: 'all 150ms',
          backgroundColor: 'transparent',
          color: isActive ? '#7B68EE' : '#8E8EA8',
        };

        if (config.tabStyle === 'underline') {
          tabStyle.borderBottom = isActive ? '2px solid #7B68EE' : '2px solid transparent';
        } else if (config.tabStyle === 'pill') {
          tabStyle.borderRadius = 8;
          tabStyle.backgroundColor = isActive ? '#7B68EE' : '#F3F4F6';
          tabStyle.color = isActive ? '#fff' : '#8E8EA8';
        } else if (config.tabStyle === 'boxed') {
          tabStyle.border = isActive ? '1px solid #7B68EE' : '1px solid #E8E8F0';
          tabStyle.backgroundColor = isActive ? '#F0EBFF' : 'transparent';
        }

        return (
          <button key={group.role} style={tabStyle} onClick={() => setActiveTab(i)}>
            {group.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {config.tabPosition === 'top' && tabBar}
      <div style={{ position: 'relative', flex: 1 }}>
        {visibleChildren.map((child) => (
          <PreviewObject key={child.id} object={child} />
        ))}
      </div>
      {config.tabPosition === 'bottom' && tabBar}
    </div>
  );
}
