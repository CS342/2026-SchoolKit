import { Tabs, usePathname } from 'expo-router';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomTabBar } from '../../components/CustomTabBar';
import { SettingsSheet } from '../../components/SettingsSheet';
import { SettingsProvider, useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';

function GearButton() {
  const { t } = useTranslation();
  const { open } = useSettings();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const pathname = usePathname();

  if (pathname !== '/profile') return null;

  return (
    <View style={{ position: 'absolute', top: insets.top + 14, right: 20, zIndex: 1000 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.a11y.settings')} onPress={open} hitSlop={12}>
        <Ionicons name="settings-outline" size={24} color={colors.textDark} />
      </Pressable>
    </View>
  );
}

function TabLayoutInner() {
  const { t } = useTranslation();
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
        <Tabs.Screen name="index" options={{ title: t('home.tabs.forYou') }} />
        <Tabs.Screen name="bookmarks" options={{ title: t('home.tabs.library') }} />
        <Tabs.Screen name="stories" options={{ title: t('home.tabs.stories') }} />
        <Tabs.Screen name="profile" options={{ title: t('home.tabs.profile') }} />
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
