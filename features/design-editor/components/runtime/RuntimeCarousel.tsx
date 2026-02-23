import React, { useRef, useState, useEffect } from 'react';
import { View, TouchableOpacity, Animated, Text } from 'react-native';
import type { InteractiveComponentObject, CarouselConfig } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';

export function RuntimeCarousel({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as CarouselConfig;
  const slideGroups = object.groups.filter((g) => g.role.startsWith('slide-'));
  const [activeSlide, setActiveSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (config.autoPlay && slideGroups.length > 1) {
      const timer = setInterval(() => {
        goToSlide((activeSlide + 1) % slideGroups.length);
      }, config.autoPlayInterval);
      return () => clearInterval(timer);
    }
  }, [config.autoPlay, config.autoPlayInterval, activeSlide, slideGroups.length]);

  const goToSlide = (index: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: config.transitionDuration / 2, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: config.transitionDuration / 2, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setActiveSlide(index), config.transitionDuration / 2);
  };

  const currentGroup = slideGroups[activeSlide];
  const visibleChildren = currentGroup
    ? object.children.filter((c) => currentGroup.objectIds.includes(c.id))
    : [];

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
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {visibleChildren.map((child) => (
          <RuntimeObject key={child.id} object={child} parentWidth={object.width} />
        ))}
      </Animated.View>

      {config.showArrows && slideGroups.length > 1 && (
        <>
          <TouchableOpacity
            onPress={() => goToSlide((activeSlide - 1 + slideGroups.length) % slideGroups.length)}
            style={{
              position: 'absolute', left: 8, top: '50%',
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: 'rgba(0,0,0,0.3)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16 }}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => goToSlide((activeSlide + 1) % slideGroups.length)}
            style={{
              position: 'absolute', right: 8, top: '50%',
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: 'rgba(0,0,0,0.3)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16 }}>›</Text>
          </TouchableOpacity>
        </>
      )}

      {config.showDots && slideGroups.length > 1 && (
        <View
          style={{
            position: 'absolute', bottom: 8, left: 0, right: 0,
            flexDirection: 'row', justifyContent: 'center', gap: 6,
          }}
        >
          {slideGroups.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goToSlide(i)}
              style={{
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: i === activeSlide ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
