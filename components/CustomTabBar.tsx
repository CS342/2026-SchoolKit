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
import { useResponsive } from '../hooks/useResponsive';

const TAB_ICONS: Record<string, {
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
}> = {
  index:     { active: 'home',         inactive: 'home-outline' },
  search:    { active: 'search',       inactive: 'search-outline' },
  stories:   { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  bookmarks: { active: 'bookmark',    inactive: 'bookmark-outline' },
  profile:   { active: 'person',      inactive: 'person-outline' },
};

// ─── Shared navigation helpers ──────────────────────────────────

function useTabNavigation(state: BottomTabBarProps['state'], navigation: BottomTabBarProps['navigation']) {
  const handlePress = (route: typeof state.routes[number], isFocused: boolean) => {
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

  const handleLongPress = (route: typeof state.routes[number]) => {
    navigation.emit({
      type: 'tabLongPress',
      target: route.key,
    });
  };

  return { handlePress, handleLongPress };
}

// ─── Mobile Bottom Tab Bar ──────────────────────────────────────

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
      style={mobileStyles.tabItem}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
    >
      <Animated.View style={animatedIconStyle}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </Animated.View>
      <Text
        style={[
          mobileStyles.tabLabel,
          { color: isFocused ? colors.primary : colors.textLight },
          isFocused && mobileStyles.tabLabelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, shadows, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorX = useSharedValue(0);
  const { handlePress, handleLongPress } = useTabNavigation(state, navigation);

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
        mobileStyles.container,
        {
          paddingBottom: Math.max(insets.bottom, 12),
          backgroundColor: isDark ? 'rgba(28,28,46,0.95)' : 'rgba(255, 255, 255, 0.92)',
          borderTopColor: colors.border,
          ...shadows.card,
        },
      ]}
    >
      <View style={mobileStyles.tabRow} onLayout={handleLayout}>
        {containerWidth > 0 && (
          <Animated.View style={[mobileStyles.indicator, { backgroundColor: colors.tabActiveBg }, indicatorStyle]} />
        )}

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const label = descriptors[route.key].options.title ?? route.name;

          return (
            <TabBarItem
              key={route.key}
              routeName={route.name}
              label={label}
              isFocused={isFocused}
              onPress={() => handlePress(route, isFocused)}
              onLongPress={() => handleLongPress(route)}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Web Sidebar Navigation ────────────────────────────────────

function SidebarNavItem({ routeName, label, isFocused, onPress }: {
  routeName: string;
  label: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  const icons = TAB_ICONS[routeName] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
  const iconName = isFocused ? icons.active : icons.inactive;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        sidebarStyles.navItem,
        isFocused && { backgroundColor: colors.tabActiveBg },
        !isFocused && hovered && { backgroundColor: colors.backgroundLight },
      ]}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
    >
      <Ionicons
        name={iconName}
        size={20}
        color={isFocused ? colors.primary : colors.textLight}
      />
      <Text
        style={[
          sidebarStyles.navLabel,
          { color: isFocused ? colors.primary : colors.textMuted },
          isFocused && sidebarStyles.navLabelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SidebarNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const { handlePress } = useTabNavigation(state, navigation);

  return (
    <View
      style={[
        sidebarStyles.container,
        {
          backgroundColor: isDark ? '#1C1C2E' : '#FFFFFF',
          borderRightColor: colors.border,
        },
      ]}
    >
      {/* App brand */}
      <View style={sidebarStyles.brand}>
        <View style={[sidebarStyles.brandIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="school" size={20} color="#FFFFFF" />
        </View>
        <Text style={[sidebarStyles.brandText, { color: colors.textDark }]}>
          SchoolKit
        </Text>
      </View>

      {/* Nav items */}
      <View style={sidebarStyles.navList}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const label = descriptors[route.key].options.title ?? route.name;

          return (
            <SidebarNavItem
              key={route.key}
              routeName={route.name}
              label={label}
              isFocused={isFocused}
              onPress={() => handlePress(route, isFocused)}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Export (platform-adaptive) ────────────────────────────

export function CustomTabBar(props: BottomTabBarProps) {
  const { isWeb, isDesktop, isTablet } = useResponsive();

  // Web desktop & tablet: sidebar navigation
  if (isWeb && (isDesktop || isTablet)) {
    return <SidebarNav {...props} />;
  }

  // Mobile (and web at mobile width): bottom tab bar
  return <BottomTabBar {...props} />;
}

// ─── Mobile Styles ──────────────────────────────────────────────

const mobileStyles = StyleSheet.create({
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

// ─── Sidebar Styles ─────────────────────────────────────────────

const sidebarStyles = {
  container: {
    width: 220,
    borderRightWidth: 1,
    paddingTop: 24,
    paddingHorizontal: 12,
  },
  brand: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 24,
    marginBottom: 8,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  navList: {
    gap: 4,
  },
  navItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  navLabelActive: {
    fontWeight: '600' as const,
  },
};
