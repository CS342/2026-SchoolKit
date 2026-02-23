import React, { useState } from 'react';
import type { InteractiveComponentObject, ExpandableConfig } from '../../types/document';
import { PreviewObject } from './PreviewObject';

export function PreviewExpandable({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as ExpandableConfig;
  const [isExpanded, setIsExpanded] = useState(config.defaultExpanded);

  const headerGroup = object.groups.find((g) => g.role === 'header');
  const bodyGroup = object.groups.find((g) => g.role === 'body');
  const headerChildren = object.children.filter((c) => headerGroup?.objectIds.includes(c.id));
  const bodyChildren = object.children.filter((c) => bodyGroup?.objectIds.includes(c.id));

  // Compute header bounds from children
  let headerHeight = 52;
  for (const child of headerChildren) {
    const bottom = child.y + child.height;
    if (bottom > headerHeight) headerHeight = bottom;
  }

  // Compute body bounds from children
  let bodyHeight = 0;
  for (const child of bodyChildren) {
    const bottom = child.y + child.height;
    if (bottom > bodyHeight) bodyHeight = bottom;
  }
  bodyHeight += 10; // padding

  return (
    <div
      style={{
        position: 'absolute',
        left: object.x,
        top: object.y,
        width: object.width,
      }}
    >
      {/* Header — clickable */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: headerHeight,
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {headerChildren.map((child) => (
          <PreviewObject key={child.id} object={child} />
        ))}
      </div>

      {/* Body — explicit height so absolutely-positioned children are visible
          when expanded. maxHeight alone doesn't work because absolute children
          don't contribute to parent's intrinsic content height. */}
      <div
        style={{
          position: 'relative',
          height: isExpanded ? bodyHeight : 0,
          overflow: 'hidden',
          transition: `height ${config.expandDuration}ms ${config.easing}`,
        }}
      >
        {bodyChildren.map((child) => (
          <PreviewObject key={child.id} object={child} />
        ))}
      </div>
    </div>
  );
}
