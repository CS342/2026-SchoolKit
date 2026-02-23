import React, { useState, useEffect, useRef } from 'react';
import type { InteractiveComponentObject, CarouselConfig } from '../../types/document';
import { PreviewObject } from './PreviewObject';

export function PreviewCarousel({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as CarouselConfig;
  const slideGroups = object.groups.filter((g) => g.role.startsWith('slide-'));
  const [activeSlide, setActiveSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (config.autoPlay && slideGroups.length > 1) {
      timerRef.current = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % slideGroups.length);
      }, config.autoPlayInterval);
      return () => { if (timerRef.current != null) clearInterval(timerRef.current); };
    }
  }, [config.autoPlay, config.autoPlayInterval, slideGroups.length]);

  const currentGroup = slideGroups[activeSlide];
  const visibleChildren = currentGroup
    ? object.children.filter((c) => currentGroup.objectIds.includes(c.id))
    : [];

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
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transition: `opacity ${config.transitionDuration}ms ease`,
        }}
      >
        {visibleChildren.map((child) => (
          <PreviewObject key={child.id} object={child} />
        ))}
      </div>

      {config.showArrows && slideGroups.length > 1 && (
        <>
          <button
            onClick={() => setActiveSlide((activeSlide - 1 + slideGroups.length) % slideGroups.length)}
            style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 28, borderRadius: 14, border: 'none',
              backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', cursor: 'pointer',
              fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ‹
          </button>
          <button
            onClick={() => setActiveSlide((activeSlide + 1) % slideGroups.length)}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 28, borderRadius: 14, border: 'none',
              backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', cursor: 'pointer',
              fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ›
          </button>
        </>
      )}

      {config.showDots && slideGroups.length > 1 && (
        <div
          style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 6,
          }}
        >
          {slideGroups.map((_, i) => (
            <div
              key={i}
              onClick={() => setActiveSlide(i)}
              style={{
                width: 8, height: 8, borderRadius: 4, cursor: 'pointer',
                backgroundColor: i === activeSlide ? '#fff' : 'rgba(255,255,255,0.4)',
                transition: 'background-color 200ms',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
