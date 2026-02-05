import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { OnboardingProvider } from '../contexts/OnboardingContext';
import { OfflineProvider } from '../contexts/OfflineContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { OfflineBanner } from '../components/OfflineBanner';

function InnerLayout() {
  const { isDark } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OfflineProvider>
          <OnboardingProvider>
            <InnerLayout />
          </OnboardingProvider>
        </OfflineProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
