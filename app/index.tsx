import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

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

    // Onboarding completed — check if anonymous user should see auth screen
    const isAnonymous = user.is_anonymous === true;
    if (isAnonymous) {
      router.replace('/auth');
      return;
    }

    router.replace('/(tabs)');
  }, [authLoading, onboardingLoading, user, data.isCompleted]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7B68EE" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
