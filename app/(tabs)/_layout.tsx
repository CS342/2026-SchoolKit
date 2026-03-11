import { Tabs, usePathname } from 'expo-router';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomTabBar } from '../../components/CustomTabBar';
import { SettingsSheet } from '../../components/SettingsSheet';
import { SettingsProvider, useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';

function GearButton() {
  const { open } = useSettings();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const pathname = usePathname();

  if (pathname !== '/profile') return null;

  return (
    <View style={{ position: 'absolute', top: insets.top + 14, right: 20, zIndex: 1000 }}>
      <Pressable onPress={open} hitSlop={12}>
        <Ionicons name="settings-outline" size={24} color={colors.textDark} />
      </Pressable>
    </View>
  );
}

function TabLayoutInner() {
  const { isWeb, isDesktop, isTablet } = useResponsive();
  const useSidebar = isWeb && (isDesktop || isTablet);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => useSidebar ? null : <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarPosition: 'bottom',
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'For You' }} />
        <Tabs.Screen name="bookmarks" options={{ title: 'Library' }} />
        <Tabs.Screen name="stories" options={{ title: 'Stories' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
      <GearButton />
      <SettingsSheet />
    </View>
  );
}

export default function TabLayout() {
  return (
    <SettingsProvider>
      <TabLayoutInner />
    </SettingsProvider>
  );
}
