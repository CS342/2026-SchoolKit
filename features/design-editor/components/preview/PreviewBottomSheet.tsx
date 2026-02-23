import React, { useState } from 'react';
import type { InteractiveComponentObject, BottomSheetConfig } from '../../types/document';
import { PreviewObject } from './PreviewObject';

export function PreviewBottomSheet({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as BottomSheetConfig;
  const [isOpen, setIsOpen] = useState(false);

  const triggerGroup = object.groups.find((g) => g.role === 'trigger');
  const contentGroup = object.groups.find((g) => g.role === 'content');
  const triggerChildren = object.children.filter((c) => triggerGroup?.objectIds.includes(c.id));
  const contentChildren = object.children.filter((c) => contentGroup?.objectIds.includes(c.id));

  const sheetHeight = (object.height * config.sheetHeightPercent) / 100;

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
      {/* Trigger */}
      <div
        style={{ position: 'relative', width: '100%', height: '100%', cursor: 'pointer' }}
        onClick={() => setIsOpen(true)}
      >
        {triggerChildren.map((child) => (
          <PreviewObject key={child.id} object={child} />
        ))}
      </div>

      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: `rgba(0,0,0,${config.backdropOpacity})`,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: `opacity ${config.slideDuration}ms ease`,
        }}
        onClick={() => {
          if (config.dismissOnBackdropTap) setIsOpen(false);
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: sheetHeight,
          transform: isOpen ? 'translateY(0)' : `translateY(${sheetHeight}px)`,
          transition: `transform ${config.slideDuration}ms ease-out`,
          overflow: 'hidden',
        }}
      >
        {contentChildren.map((child) => (
          <PreviewObject key={child.id} object={child} />
        ))}
      </div>
    </div>
  );
}
