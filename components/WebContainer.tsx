import { View, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

interface WebContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  centerContent?: boolean;
}

/**
 * Container component that centers content on web for better desktop UX
 * On mobile, it renders children directly without any wrapper
 */
export function WebContainer({
  children,
  maxWidth = 1200,
  centerContent = true
}: WebContainerProps) {
  const { isWeb, isDesktop } = useResponsive();

  // On mobile or non-web platforms, render directly
  if (!isWeb || !centerContent) {
    return <>{children}</>;
  }

  return (
    <View style={styles.webWrapper}>
      <View style={[
        styles.webContainer,
        { maxWidth },
        !isDesktop && styles.webContainerMobile
      ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F5FF',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-only style
      boxShadow: '0 0 50px rgba(123, 104, 238, 0.1)',
    }),
  },
  webContainerMobile: {
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-only style
      boxShadow: 'none',
    }),
  },
});
