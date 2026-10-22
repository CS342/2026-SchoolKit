import { View, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../contexts/ThemeContext';

interface WebContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  centerContent?: boolean;
}

/**
 * Container component that provides appropriate layout for web.
 * - Desktop/tablet with sidebar: content fills the remaining space
 * - Small web window (no sidebar): centers content with max-width
 * - Mobile native: renders children directly
 */
export function WebContainer({
  children,
  maxWidth = 1200,
  centerContent = true
}: WebContainerProps) {
  const { isWeb, isDesktop, isTablet } = useResponsive();
  const { colors } = useTheme();

  // On native mobile, render directly
  if (!isWeb || !centerContent) {
    return <>{children}</>;
  }

  const hasSidebar = isDesktop || isTablet;

  // With sidebar: content just fills remaining space, no centering needed
  if (hasSidebar) {
    return (
      <View style={[styles.sidebarContent, {
        backgroundColor: colors.appBackground,
      }]}>
        {children}
      </View>
    );
  }

  // Web at mobile width (no sidebar): center with max-width
  return (
    <View style={[styles.webWrapper, {
      backgroundColor: colors.appBackground,
    }]}>
      <View style={[
        styles.webContainer,
        { maxWidth },
        { backgroundColor: colors.white },
      ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarContent: {
    flex: 1,
  },
  webWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-only style
      boxShadow: '0 0 50px rgba(123, 104, 238, 0.1)',
    }),
  },
});
