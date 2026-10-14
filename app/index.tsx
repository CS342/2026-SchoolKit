import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getResumeRoute } from '../components/AuthWebWrapper';

export default function Index() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const { data, loading: onboardingLoading } = useOnboarding();

  useEffect(() => {
    if (authLoading || onboardingLoading) return;

    if (!user) {
      router.replace('/welcome');
      return;
    }

    if (!data.isCompleted) {
      router.replace(getResumeRoute(data));
      return;
    }

    router.replace('/(tabs)');
  }, [authLoading, onboardingLoading, user, data]);

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackgroundAlt }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
