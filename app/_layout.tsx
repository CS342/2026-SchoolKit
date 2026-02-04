import { View } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { OnboardingProvider } from '../contexts/OnboardingContext';
import { OfflineProvider } from '../contexts/OfflineContext';
import { OfflineBanner } from '../components/OfflineBanner';

export default function RootLayout() {
  return (
    <AuthProvider>
      <OfflineProvider>
        <OnboardingProvider>
          <View style={{ flex: 1 }}>
            <OfflineBanner />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth" />
            </Stack>
          </View>
        </OnboardingProvider>
      </OfflineProvider>
    </AuthProvider>
  );
}
