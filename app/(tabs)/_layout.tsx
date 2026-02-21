import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../components/CustomTabBar';
import { useResponsive } from '../../hooks/useResponsive';

export default function TabLayout() {
  const { isWeb, isDesktop, isTablet } = useResponsive();
  const useSidebar = isWeb && (isDesktop || isTablet);

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: useSidebar ? 'left' : 'bottom',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'For You' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="stories" options={{ title: 'Stories' }} />
      <Tabs.Screen name="bookmarks" options={{ title: 'Saved' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
