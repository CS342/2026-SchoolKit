import { Stack } from 'expo-router';
import { OnboardingProvider } from '../contexts/OnboardingContext';

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </OnboardingProvider>
  );
}
