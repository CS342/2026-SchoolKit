import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ANIMATION } from '../constants/onboarding-theme';
import { useTheme } from '../contexts/ThemeContext';

const TAB_ICONS: Record<string, {
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
}> = {
  index:     { active: 'home',     inactive: 'home-outline' },
  search:    { active: 'search',   inactive: 'search-outline' },
  bookmarks: { active: 'bookmark', inactive: 'bookmark-outline' },
  profile:   { active: 'person',   inactive: 'person-outline' },
};

interface TabBarItemProps {
  routeName: string;
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function TabBarItem({ routeName, label, isFocused, onPress, onLongPress }: TabBarItemProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(isFocused ? 1.15 : 1);
  const icons = TAB_ICONS[routeName] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
  const iconName = isFocused ? icons.active : icons.inactive;
  const iconColor = isFocused ? colors.primary : colors.textLight;

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.15 : 1, ANIMATION.springBouncy);
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
    >
      <Animated.View style={animatedIconStyle}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? colors.primary : colors.textLight },
          isFocused && styles.tabLabelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, shadows, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorX = useSharedValue(0);

  const tabCount = state.routes.length;
  const tabWidth = containerWidth / tabCount;
  const indicatorWidth = Math.max(tabWidth - 16, 0);

  useEffect(() => {
    if (containerWidth > 0) {
      indicatorX.value = withSpring(
        state.index * tabWidth,
        { damping: 38, stiffness: 400 },
      );
    }
  }, [state.index, containerWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth,
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setContainerWidth(width);
    indicatorX.value = state.index * (width / tabCount);
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 12),
          backgroundColor: isDark ? 'rgba(28,28,46,0.95)' : 'rgba(255, 255, 255, 0.92)',
          borderTopColor: colors.border,
          ...shadows.card,
        },
      ]}
    >
      <View style={styles.tabRow} onLayout={handleLayout}>
        {containerWidth > 0 && (
          <Animated.View style={[styles.indicator, { backgroundColor: colors.tabActiveBg }, indicatorStyle]} />
        )}

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const label = descriptors[route.key].options.title ?? route.name;

          const onPress = () => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.dispatch({
                ...CommonActions.navigate(route.name, route.params),
                target: state.key,
              });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabBarItem
              key={route.key}
              routeName={route.name}
              label={label}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  tabRow: {
    flexDirection: 'row',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 8,
    height: 52,
    borderRadius: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});
