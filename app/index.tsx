import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants/onboarding-theme';

export default function Index() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data, loading: onboardingLoading } = useOnboarding();

  useEffect(() => {
    if (authLoading || onboardingLoading) return;

    if (!user) {
      router.replace('/welcome');
      return;
    }

    if (!data.isCompleted) {
      router.replace('/onboarding/step1');
      return;
    }

    router.replace('/(tabs)');
  }, [authLoading, onboardingLoading, user, data.isCompleted]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
