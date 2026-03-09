import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Animated, Text, PanResponder } from 'react-native';
import type { InteractiveComponentObject, CarouselConfig } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';
import { SHADOWS } from '../../../../constants/onboarding-theme';

export function RuntimeCarousel({ object }: { object: InteractiveComponentObject }) {
  const config = object.interactionConfig as CarouselConfig;
  const slideGroups = object.groups.filter((g) => g.role.startsWith('slide-'));
  const [activeSlide, setActiveSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSlideRef = useRef(activeSlide);
  activeSlideRef.current = activeSlide;

  const pauseAutoPlay = useCallback(() => {
    if (config.pauseOnInteraction !== false) {
      setIsPaused(true);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => {
        setIsPaused(false);
      }, config.resumeDelay ?? 3000);
    }
  }, [config.pauseOnInteraction, config.resumeDelay]);

  const goToSlide = useCallback((index: number) => {
    const current = activeSlideRef.current;
    const direction = index > current ? 1 : -1;
    const slideOffset = object.width * 0.3;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: config.transitionDuration / 2, useNativeDriver: true }),
      Animated.timing(translateAnim, { toValue: -direction * slideOffset, duration: config.transitionDuration / 2, useNativeDriver: true }),
    ]).start(() => {
      setActiveSlide(index);
      translateAnim.setValue(direction * slideOffset);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: config.transitionDuration / 2, useNativeDriver: true }),
        Animated.timing(translateAnim, { toValue: 0, duration: config.transitionDuration / 2, useNativeDriver: true }),
      ]).start();
    });
  }, [object.width, config.transitionDuration, fadeAnim, translateAnim]);

  useEffect(() => {
    if (config.autoPlay && slideGroups.length > 1 && !isPaused) {
      const timer = setInterval(() => {
        goToSlide((activeSlideRef.current + 1) % slideGroups.length);
      }, config.autoPlayInterval);
      return () => clearInterval(timer);
    }
  }, [config.autoPlay, config.autoPlayInterval, slideGroups.length, isPaused, goToSlide]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderRelease: (_, gestureState) => {
        const threshold = object.width * 0.15;
        if (gestureState.dx < -threshold && activeSlideRef.current < slideGroups.length - 1) {
          pauseAutoPlay();
          goToSlide(activeSlideRef.current + 1);
        } else if (gestureState.dx > threshold && activeSlideRef.current > 0) {
          pauseAutoPlay();
          goToSlide(activeSlideRef.current - 1);
        }
      },
    }),
  ).current;

  const currentGroup = slideGroups[activeSlide];
  const visibleChildren = currentGroup
    ? object.children.filter((c) => currentGroup.objectIds.includes(c.id))
    : [];

  return (
    <View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        overflow: 'hidden',
      }}
    >
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateX: translateAnim }] }}>
        {visibleChildren.map((child) => (
          <RuntimeObject key={child.id} object={child} parentWidth={object.width} />
        ))}
      </Animated.View>

      {config.showArrows && slideGroups.length > 1 && (
        <>
          <TouchableOpacity
            onPress={() => goToSlide((activeSlideRef.current - 1 + slideGroups.length) % slideGroups.length)}
            style={{
              position: 'absolute', left: 8, top: '45%',
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: config.arrowBgColor ?? 'rgba(255,255,255,0.9)',
              alignItems: 'center', justifyContent: 'center',
              ...SHADOWS.iconCircle,
            }}
          >
            <Text style={{ color: config.arrowColor ?? '#374151', fontSize: 16, fontWeight: '600' }}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => goToSlide((activeSlideRef.current + 1) % slideGroups.length)}
            style={{
              position: 'absolute', right: 8, top: '45%',
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: config.arrowBgColor ?? 'rgba(255,255,255,0.9)',
              alignItems: 'center', justifyContent: 'center',
              ...SHADOWS.iconCircle,
            }}
          >
            <Text style={{ color: config.arrowColor ?? '#374151', fontSize: 16, fontWeight: '600' }}>›</Text>
          </TouchableOpacity>
        </>
      )}

      {config.showDots && slideGroups.length > 1 && (
        <View
          style={{
            position: 'absolute',
            ...(config.dotPosition === 'top' ? { top: 8 } : { bottom: 8 }),
            left: 0, right: 0,
            flexDirection: 'row', justifyContent: 'center', gap: 6,
          }}
        >
          {slideGroups.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goToSlide(i)}
              style={{
                width: i === activeSlide ? 16 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === activeSlide
                  ? (config.dotActiveColor ?? '#fff')
                  : (config.dotInactiveColor ?? 'rgba(255,255,255,0.4)'),
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
