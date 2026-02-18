import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { AuthProvider } from '../contexts/AuthContext';
import { OnboardingProvider } from '../contexts/OnboardingContext';
import { OfflineProvider } from '../contexts/OfflineContext';
import { StoriesProvider } from '../contexts/StoriesContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { OfflineBanner } from '../components/OfflineBanner';

function InnerLayout() {
  const { isDark, colors } = useTheme();

  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.appBackground,
          card: colors.white,
          text: colors.textDark,
          primary: colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.appBackground,
          card: colors.white,
          text: colors.textDark,
          primary: colors.primary,
        },
      };

  return (
    <NavThemeProvider value={navigationTheme}>
      <View style={{ flex: 1 }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <OfflineBanner />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(editor)" />
          <Stack.Screen name="share/[token]" />
          <Stack.Screen name="design-view/[id]" />
          <Stack.Screen name="auth" />
        </Stack>
      </View>
    </NavThemeProvider>
  );
}

// Exporting RootLayout as default component
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OfflineProvider>
          <OnboardingProvider>
            <StoriesProvider>
              <InnerLayout />
            </StoriesProvider>
          </OnboardingProvider>
        </OfflineProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
