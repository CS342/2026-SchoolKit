import { Platform } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function EditorLayout() {
  const { user, loading: authLoading } = useAuth();

  // Hard gate: web only
  if (Platform.OS !== 'web') {
    return <Redirect href="/(tabs)" />;
  }

  if (authLoading) return null;

  // Hard gate: authenticated only
  if (!user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="designs" />
      <Stack.Screen name="design/[id]" />
    </Stack>
  );
}
