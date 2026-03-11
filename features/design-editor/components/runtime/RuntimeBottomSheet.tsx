import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Animated, Text } from 'react-native';
import type { InteractiveComponentObject, BottomSheetConfig } from '../../types/document';
import { RuntimeObject } from './RuntimeObject';
import { COLORS, SHADOWS } from '../../../../constants/onboarding-theme';

export function RuntimeBottomSheet({ object, isDark = false }: { object: InteractiveComponentObject; isDark?: boolean }) {
  const config = object.interactionConfig as BottomSheetConfig;
  const [openSheetIndex, setOpenSheetIndex] = useState<number | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const triggerGroup = object.groups.find((g) => g.role === 'trigger');
  const contentGroups = object.groups
    .filter((g) => g.role.startsWith('content'))
    .sort((a, b) => a.role.localeCompare(b.role));

  const triggerChildren = object.children.filter((c) => triggerGroup?.objectIds.includes(c.id));

  const sheetHeight = (object.height * config.sheetHeightPercent) / 100;

  const openSheet = (index: number) => {
    setOpenSheetIndex(index);
    slideAnim.setValue(0);
    backdropAnim.setValue(0);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: config.slideDuration,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: config.slideDuration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const close = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: config.slideDuration,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: config.slideDuration,
        useNativeDriver: true,
      }),
    ]).start(() => setOpenSheetIndex(null));
  };

  const goToNextSheet = () => {
    if (openSheetIndex !== null && openSheetIndex < contentGroups.length - 1) {
      // Animate out then in for the next sheet
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: config.slideDuration / 2,
        useNativeDriver: true,
      }).start(() => {
        setOpenSheetIndex(openSheetIndex + 1);
        slideAnim.setValue(0);
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: config.slideDuration / 2,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  // Translate by full sheet height to fully hide below the container bottom
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [object.height, 0],
  });

  const isOpen = openSheetIndex !== null;
  const activeContentGroup = isOpen ? contentGroups[openSheetIndex] : null;
  const activeContentChildren = activeContentGroup
    ? object.children.filter((c) => activeContentGroup.objectIds.includes(c.id))
    : [];
  const hasNextSheet = isOpen && openSheetIndex < contentGroups.length - 1;

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
      {/* Trigger */}
      <TouchableOpacity activeOpacity={0.8} onPress={() => openSheet(0)} style={{ flex: 1 }}>
        <View style={{ position: 'relative', width: object.width, height: object.height }}>
          {triggerChildren.map((child) => (
            <RuntimeObject key={child.id} object={child} parentWidth={object.width} isDark={isDark} />
          ))}
        </View>
      </TouchableOpacity>

      {/* Backdrop */}
      {isOpen && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000',
            opacity: backdropAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, config.backdropOpacity],
            }),
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={config.dismissOnBackdropTap ? close : undefined}
          />
        </Animated.View>
      )}

      {/* Sheet */}
      {isOpen && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: object.width,
            height: sheetHeight,
            transform: [{ translateY }],
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: isDark ? '#1C1C2E' : COLORS.white,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 10,
            elevation: 8,
            overflow: 'hidden',
          }}
        >
          {/* Drag handle */}
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? '#3A3A52' : COLORS.borderCard,
              }}
            />
          </View>

          {/* Sheet page indicator for stacked sheets */}
          {contentGroups.length > 1 && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 4,
                marginBottom: 8,
              }}
            >
              {contentGroups.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === openSheetIndex ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === openSheetIndex ? '#7B68EE' : '#E5E7EB',
                  }}
                />
              ))}
            </View>
          )}

          {activeContentChildren.map((child) => (
            <RuntimeObject key={child.id} object={child} parentWidth={object.width} isDark={isDark} />
          ))}

          {/* Next sheet button */}
          {hasNextSheet && (
            <TouchableOpacity
              onPress={goToNextSheet}
              style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: '#7B68EE',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                Next
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </View>
  );
}
