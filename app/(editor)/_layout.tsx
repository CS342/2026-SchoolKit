import { Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function EditorLayout() {
  const { user, loading: authLoading, isAdmin, rolesLoading } = useAuth();

  // Once auth + roles have resolved at least once, stay resolved. Switching
  // tabs/windows fires Supabase's onAuthStateChange (TOKEN_REFRESHED on
  // refocus), which re-runs loadRoles and flips rolesLoading back to true. If
  // we returned null on that, this Stack would unmount and remount on its first
  // screen (designs) — so an admin sitting on Content Pages would snap back to
  // My Designs. Gating only the first resolution keeps the Stack mounted
  // through background refreshes, preserving the current route.
  const resolving = authLoading || rolesLoading;
  const [resolvedOnce, setResolvedOnce] = useState(false);
  useEffect(() => {
    if (!resolving) setResolvedOnce(true);
  }, [resolving]);

  // Hard gate: web only
  if (Platform.OS !== 'web') {
    return <Redirect href="/(tabs)" />;
  }

  // Wait for the first auth + role resolution before deciding, so an admin
  // isn't bounced out during the initial async role fetch.
  if (resolving && !resolvedOnce) return null;

  // Hard gate: authenticated admins only
  if (!user || !isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="designs" />
      <Stack.Screen name="design/[id]" />
      <Stack.Screen name="content-pages" />
      <Stack.Screen name="content/[id]" />
    </Stack>
  );
}
