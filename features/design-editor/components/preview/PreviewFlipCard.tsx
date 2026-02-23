import React, { useState } from 'react';
import type { InteractiveComponentObject, FlipCardConfig, StaticDesignObject } from '../../types/document';
import { PreviewObject } from './PreviewObject';

export function PreviewFlipCard({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as FlipCardConfig;
  const [isFlipped, setIsFlipped] = useState(config.defaultSide === 'back');

  const frontGroup = object.groups.find((g) => g.role === 'front');
  const backGroup = object.groups.find((g) => g.role === 'back');
  const frontChildren = object.children.filter((c) => frontGroup?.objectIds.includes(c.id));
  const backChildren = object.children.filter((c) => backGroup?.objectIds.includes(c.id));

  const isHorizontal = config.flipDirection === 'horizontal';
  const rotateProperty = isHorizontal ? 'rotateY' : 'rotateX';

  return (
    <div
      style={{
        position: 'absolute',
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        perspective: 800,
        cursor: 'pointer',
      }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: `transform ${config.flipDuration}ms ease-in-out`,
          transform: isFlipped ? `${rotateProperty}(180deg)` : `${rotateProperty}(0deg)`,
        }}
      >
        {/* Front */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            overflow: 'hidden',
          }}
        >
          {frontChildren.map((child) => (
            <PreviewObject key={child.id} object={child} />
          ))}
        </div>

        {/* Back */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: `${rotateProperty}(180deg)`,
            overflow: 'hidden',
          }}
        >
          {backChildren.map((child) => (
            <PreviewObject key={child.id} object={child} />
          ))}
        </div>
      </div>
    </div>
  );
}
