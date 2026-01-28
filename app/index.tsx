import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../contexts/OnboardingContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const router = useRouter();
  const { data } = useOnboarding();

  useEffect(() => {
    // Small delay to ensure context is loaded
    const timer = setTimeout(() => {
      if (data.isCompleted) {
        router.replace('/(tabs)');
      } else {
        router.replace('/welcome');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [data.isCompleted]);

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
