import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { DecorativeBackground } from '../components/onboarding/DecorativeBackground';
import { AuthWebWrapper } from '../components/AuthWebWrapper';
import { RADII, BORDERS } from '../constants/onboarding-theme';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/onboarding/PrimaryButton';
import { useResponsive } from '../hooks/useResponsive';

// Same requirements enforced at sign-up, so a reset can't set a weaker password.
const PASSWORD_RULES: { key: string; label: string; test: (p: string) => boolean }[] = [
  { key: 'length', label: 'At least 8 characters', test: p => p.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: p => /[A-Z]/.test(p) },
  { key: 'lower', label: 'One lowercase letter', test: p => /[a-z]/.test(p) },
  { key: 'number', label: 'One number', test: p => /[0-9]/.test(p) },
];

function passwordMeetsAllRules(password: string) {
  return PASSWORD_RULES.every(rule => rule.test(password));
}

/** Reads an auth error the email link may have appended to the URL (e.g. an
 *  expired or already-used recovery link) so we can show a friendly message. */
function getUrlAuthError(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const parse = (s: string) => new URLSearchParams(s.replace(/^[#?]/, ''));
  const hash = parse(window.location.hash);
  const query = parse(window.location.search);
  const desc = hash.get('error_description') || query.get('error_description');
  return desc ? desc.replace(/\+/g, ' ') : null;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isWeb, isMobile } = useResponsive();
  const { colors, gradients, shadows, sharedStyles } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isWebDesktop = isWeb && !isMobile;

  const { user, loading: authLoading, updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [urlError] = useState<string | null>(() => getUrlAuthError());

  const confirmPasswordRef = useRef<TextInput>(null);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // While the recovery session is still being established from the URL, wait.
  const establishing = authLoading;
  // The link failed (expired/used) or no recovery session exists.
  const linkInvalid = !establishing && (!!urlError || !user);

  const handleSubmit = async () => {
    let hasError = false;

    if (!password) {
      setPasswordError('Please enter a new password.');
      hasError = true;
    } else if (!passwordMeetsAllRules(password)) {
      setPasswordError('Your password doesn’t meet all the requirements below.');
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (!confirmPassword.trim()) {
      setConfirmError('Please confirm your password.');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmError('Passwords don’t match.');
      hasError = true;
    } else {
      setConfirmError(null);
    }

    if (hasError) return;

    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        showAlert('Could not update password', error.message);
      } else {
        showAlert('Password updated', 'Your password has been changed. You are now signed in.');
        router.replace('/');
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DecorativeBackground variant="auth" gradientColors={gradients.screenBackground}>
      <AuthWebWrapper variant="auth">
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={isWebDesktop ? { maxWidth: 480, width: '100%', alignSelf: 'center', paddingHorizontal: 24 } : { paddingHorizontal: 24 }}>
              <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <View style={[sharedStyles.pageIconCircle, { width: 96, height: 96, borderRadius: 48 }]}>
                  <Ionicons name="lock-closed-outline" size={56} color={colors.primary} />
                </View>
                <Text style={sharedStyles.pageTitle}>Set a new password</Text>
                <Text style={[sharedStyles.pageSubtitle, { marginBottom: 24 }]}>
                  Choose a new password for your account.
                </Text>
              </View>

              {establishing ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.helperText, { marginTop: 16 }]}>Verifying your reset link…</Text>
                </View>
              ) : linkInvalid ? (
                <View style={[styles.formCard, !isWebDesktop && shadows.card, isWebDesktop && styles.formCardWeb]}>
                  <View style={{ alignItems: 'center', gap: 12 }}>
                    <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
                    <Text style={[styles.label, { textAlign: 'center' }]}>This reset link isn’t valid</Text>
                    <Text style={[styles.helperText, { textAlign: 'center' }]}>
                      {urlError || 'The link may have expired or already been used. Request a new password reset email and try again.'}
                    </Text>
                    <PrimaryButton title="Back to Sign In" onPress={() => router.replace('/auth?mode=signin')} />
                  </View>
                </View>
              ) : (
                <View style={[styles.formCard, !isWebDesktop && shadows.card, isWebDesktop && styles.formCardWeb]}>
                  {/* New password */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={[styles.inputWrapper, !!passwordError && styles.inputWrapperError]}>
                      <Ionicons name="lock-closed-outline" size={20} color={colors.inputPlaceholder} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Min 8 chars, upper, lower, number"
                        placeholderTextColor={colors.inputPlaceholder}
                        value={password}
                        onChangeText={(text) => { setPassword(text); if (passwordError) setPasswordError(null); }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="newPassword"
                        returnKeyType="next"
                        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                        accessibilityLabel="New password"
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton} accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                        <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.inputPlaceholder} />
                      </TouchableOpacity>
                    </View>
                    {!!passwordError && <Text style={styles.errorText} accessibilityRole="alert">{passwordError}</Text>}
                  </View>

                  {/* Live requirements checklist */}
                  {password.length > 0 && (
                    <View style={styles.requirementsContainer}>
                      {PASSWORD_RULES.map(rule => {
                        const met = rule.test(password);
                        return (
                          <View key={rule.key} style={styles.requirementRow}>
                            <Ionicons
                              name={met ? 'checkmark-circle' : 'ellipse-outline'}
                              size={16}
                              color={met ? colors.success : colors.inputPlaceholder}
                            />
                            <Text style={[styles.requirementText, { color: met ? colors.success : colors.textMuted }]}>
                              {rule.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Confirm password */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={[styles.inputWrapper, !!confirmError && styles.inputWrapperError]}>
                      <Ionicons name="lock-closed-outline" size={20} color={colors.inputPlaceholder} style={styles.inputIcon} />
                      <TextInput
                        ref={confirmPasswordRef}
                        style={styles.input}
                        placeholder="Re-enter your new password"
                        placeholderTextColor={colors.inputPlaceholder}
                        value={confirmPassword}
                        onChangeText={(text) => { setConfirmPassword(text); if (confirmError) setConfirmError(null); }}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="newPassword"
                        returnKeyType="go"
                        onSubmitEditing={handleSubmit}
                        accessibilityLabel="Confirm new password"
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton} accessibilityRole="button" accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}>
                        <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.inputPlaceholder} />
                      </TouchableOpacity>
                    </View>
                    {!!confirmError && <Text style={styles.errorText} accessibilityRole="alert">{confirmError}</Text>}
                  </View>

                  {/* Submit */}
                  <View style={styles.submitContainer}>
                    <PrimaryButton
                      title={loading ? '' : 'Update Password'}
                      onPress={handleSubmit}
                      disabled={loading}
                    />
                    {loading && (
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </AuthWebWrapper>
    </DecorativeBackground>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: c.white,
    borderRadius: RADII.formCard,
    padding: 24,
    marginTop: 8,
  },
  formCardWeb: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginTop: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textDark,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: c.textMuted,
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.inputBackground,
    borderWidth: BORDERS.input,
    borderColor: c.border,
    borderRadius: RADII.input,
    paddingHorizontal: 16,
  },
  inputWrapperError: {
    borderColor: c.error,
  },
  errorText: {
    fontSize: 13,
    color: c.error,
    marginTop: 6,
    marginLeft: 4,
  },
  requirementsContainer: {
    marginTop: -8,
    marginBottom: 16,
    gap: 6,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: c.textDark,
  },
  eyeButton: {
    padding: 4,
  },
  submitContainer: {
    marginTop: 8,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
