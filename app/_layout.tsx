import { View } from 'react-native';
import { Stack } from 'expo-router';
import { OnboardingProvider } from '../contexts/OnboardingContext';
import { OfflineProvider } from '../contexts/OfflineContext';
import { OfflineBanner } from '../components/OfflineBanner';

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <OfflineProvider>
        <View style={{ flex: 1 }}>
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </OfflineProvider>
    </OnboardingProvider>
  );
}
