import React from 'react';
import type { InteractiveComponentObject, EntranceConfig } from '../../types/document';
import { PreviewObject } from './PreviewObject';
import { getEntranceKeyframes, getEntranceAnimationName } from '../../utils/interaction-animations';

export function PreviewEntrance({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as EntranceConfig;

  const contentGroup = object.groups.find((g) => g.role === 'content');
  const contentChildren = object.children.filter((c) => contentGroup?.objectIds.includes(c.id));

  const keyframes = getEntranceKeyframes(config.animation);
  const animName = getEntranceAnimationName(config.animation);

  return (
    <div
      style={{
        position: 'absolute',
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        overflow: 'hidden',
      }}
    >
      <style>{keyframes}</style>
      {contentChildren.map((child, index) => (
        <div
          key={child.id}
          style={{
            animation: `${animName} ${config.duration}ms ease-out ${index * config.staggerDelay}ms both`,
          }}
        >
          <PreviewObject object={child} />
        </div>
      ))}
    </div>
  );
}
