import { Platform } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function EditorLayout() {
  const { user, loading: authLoading, isAdmin, rolesLoading } = useAuth();

  // Hard gate: web only
  if (Platform.OS !== 'web') {
    return <Redirect href="/(tabs)" />;
  }

  // Wait for both auth and role resolution before deciding, so an admin
  // isn't bounced out during the async role fetch.
  if (authLoading || rolesLoading) return null;

  // Hard gate: authenticated admins only
  if (!user || !isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="designs" />
      <Stack.Screen name="design/[id]" />
    </Stack>
  );
}
