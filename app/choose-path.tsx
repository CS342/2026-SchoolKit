import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DecorativeBackground } from '../components/onboarding/DecorativeBackground';
import { AuthWebWrapper } from '../components/AuthWebWrapper';
import { PrimaryButton } from '../components/onboarding/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { RADII } from '../constants/onboarding-theme';
import type { ThemeColors } from '../constants/theme';

export default function ChoosePathScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb, isMobile } = useResponsive();
  const { colors, gradients, sharedStyles } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isWebDesktop = isWeb && !isMobile;
  const { signInAnonymously } = useAuth();
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleContinueAsGuest = async () => {
    setLoading(true);
    try {
      await signInAnonymously();
      router.replace('/');
    } catch (err: any) {
      showAlert('Error', err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DecorativeBackground variant="auth" gradientColors={gradients.screenBackground}>
      <AuthWebWrapper variant="auth">
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={isWebDesktop ? styles.webColumn : undefined}>
            <View style={styles.header}>
              <View style={[sharedStyles.pageIconCircle, { width: 96, height: 96, borderRadius: 48 }]}>
                <Ionicons name="sparkles-outline" size={52} color={colors.primary} />
              </View>
              <Text style={sharedStyles.pageTitle}>Welcome to SchoolKit</Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 32 }]}>
                How would you like to continue?
              </Text>
            </View>

            <View style={styles.actions}>
              <PrimaryButton
                title="Create Account"
                icon="person-add-outline"
                onPress={() => router.push('/auth')}
                disabled={loading}
              />

              <TouchableOpacity
                style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                onPress={() => router.push('/auth?mode=signin')}
                activeOpacity={0.8}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                accessibilityState={{ disabled: loading }}
              >
                <Ionicons name="log-in-outline" size={20} color={colors.primary} style={styles.buttonIcon} />
                <Text style={styles.secondaryButtonText}>Sign In</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.guestButton, loading && styles.buttonDisabled]}
                onPress={handleContinueAsGuest}
                activeOpacity={0.8}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Continue as guest"
                accessibilityState={{ disabled: loading }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textMuted} />
                ) : (
                  <>
                    <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.buttonIcon} />
                    <Text style={styles.guestButtonText}>Continue as Guest</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.guestWarningText}>
                We won't remember your info and you have limited ability to interact with story posts.
              </Text>
            </View>
          </View>
        </ScrollView>
      </AuthWebWrapper>
    </DecorativeBackground>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  webColumn: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
  },
  actions: {
    gap: 16,
  },
  secondaryButton: {
    backgroundColor: c.white,
    paddingVertical: 16,
    borderRadius: RADII.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: c.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: c.primary,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: c.borderCard,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: c.inputPlaceholder,
  },
  guestButton: {
    backgroundColor: c.white,
    paddingVertical: 16,
    borderRadius: RADII.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: c.border,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textMuted,
  },
  guestWarningText: {
    fontSize: 12,
    color: c.textMuted,
    textAlign: 'center',
    marginTop: -4,
  },
});
