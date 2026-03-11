import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

const NAV_ITEMS = [
  { label: 'For You',  path: '/',           activeIcon: 'home'        as const, inactiveIcon: 'home-outline'        as const },
  { label: 'Library',  path: '/bookmarks',  activeIcon: 'layers'      as const, inactiveIcon: 'layers-outline'      as const },
  { label: 'Stories',  path: '/stories',    activeIcon: 'chatbubbles' as const, inactiveIcon: 'chatbubbles-outline' as const },
  { label: 'Profile',  path: '/profile',    activeIcon: 'person'      as const, inactiveIcon: 'person-outline'      as const },
];

function NavItem({ label, path, activeIcon, inactiveIcon, isFocused }: {
  label: string; path: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  isFocused: boolean;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={() => router.push(path as any)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.navItem,
        isFocused && { backgroundColor: colors.tabActiveBg },
        !isFocused && hovered && { backgroundColor: colors.backgroundLight },
      ]}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
    >
      <Ionicons
        name={isFocused ? activeIcon : inactiveIcon}
        size={24}
        color={isFocused ? colors.primary : colors.textLight}
      />
      <Text
        style={[
          styles.navLabel,
          { color: isFocused ? colors.primary : colors.textMuted },
          isFocused && styles.navLabelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function PersistentSidebar() {
  const { colors, isDark } = useTheme();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(path);
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.white,
        borderRightColor: colors.border,
      },
    ]}>
      {/* Brand */}
      <View style={styles.brand}>
        <Image
          source={require('../assets/images/HeaderLogo.png')}
          style={styles.brandIcon}
          resizeMode="contain"
        />
        <Text style={[styles.brandText, { color: colors.textDark }]}>SchoolKit</Text>
      </View>

      {/* Nav */}
      <View style={styles.navList}>
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.path}
            {...item}
            isFocused={isActive(item.path)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 240,
    borderRightWidth: 1,
    paddingTop: 24,
    paddingHorizontal: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 24,
    marginBottom: 8,
  },
  brandIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '700',
  },
  navList: {
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  navLabel: {
    fontSize: 18,
    fontWeight: '500',
  },
  navLabelActive: {
    fontWeight: '600',
  },
});
