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
import { useTranslation } from 'react-i18next';
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
// Each rule's label is resolved from i18n at render time via its `key`.
const PASSWORD_RULES: { key: string; test: (p: string) => boolean }[] = [
  { key: 'length', test: p => p.length >= 8 },
  { key: 'upper', test: p => /[A-Z]/.test(p) },
  { key: 'lower', test: p => /[a-z]/.test(p) },
  { key: 'number', test: p => /[0-9]/.test(p) },
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
  const { t } = useTranslation();
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
      setPasswordError(t('auth.errors.newPasswordRequired'));
      hasError = true;
    } else if (!passwordMeetsAllRules(password)) {
      setPasswordError(t('auth.errors.passwordRules'));
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (!confirmPassword.trim()) {
      setConfirmError(t('auth.errors.confirmRequired'));
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmError(t('auth.errors.passwordsNoMatch'));
      hasError = true;
    } else {
      setConfirmError(null);
    }

    if (hasError) return;

    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        showAlert(t('auth.reset.couldNotUpdate'), error.message);
      } else {
        showAlert(t('auth.reset.updatedTitle'), t('auth.reset.updatedBody'));
        router.replace('/');
      }
    } catch (err: any) {
      showAlert(t('auth.errorTitle'), err.message || t('common.error'));
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
                <Text style={sharedStyles.pageTitle}>{t('auth.reset.title')}</Text>
                <Text style={[sharedStyles.pageSubtitle, { marginBottom: 24 }]}>
                  {t('auth.reset.subtitle')}
                </Text>
              </View>

              {establishing ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.helperText, { marginTop: 16 }]}>{t('auth.reset.verifying')}</Text>
                </View>
              ) : linkInvalid ? (
                <View style={[styles.formCard, !isWebDesktop && shadows.card, isWebDesktop && styles.formCardWeb]}>
                  <View style={{ alignItems: 'center', gap: 12 }}>
                    <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
                    <Text style={[styles.label, { textAlign: 'center' }]}>{t('auth.reset.linkInvalidTitle')}</Text>
                    <Text style={[styles.helperText, { textAlign: 'center' }]}>
                      {urlError || t('auth.reset.linkInvalidBody')}
                    </Text>
                    <PrimaryButton title={t('auth.reset.backToSignIn')} onPress={() => router.replace('/auth?mode=signin')} />
                  </View>
                </View>
              ) : (
                <View style={[styles.formCard, !isWebDesktop && shadows.card, isWebDesktop && styles.formCardWeb]}>
                  {/* New password */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('auth.reset.labelNewPassword')}</Text>
                    <View style={[styles.inputWrapper, !!passwordError && styles.inputWrapperError]}>
                      <Ionicons name="lock-closed-outline" size={20} color={colors.inputPlaceholder} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder={t('auth.placeholderPasswordSignUp')}
                        placeholderTextColor={colors.inputPlaceholder}
                        value={password}
                        onChangeText={(text) => { setPassword(text); if (passwordError) setPasswordError(null); }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="newPassword"
                        returnKeyType="next"
                        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                        accessibilityLabel={t('auth.reset.newPasswordA11y')}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton} accessibilityRole="button" accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}>
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
                              {t(`auth.passwordRules.${rule.key}`)}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Confirm password */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('auth.labelConfirmPassword')}</Text>
                    <View style={[styles.inputWrapper, !!confirmError && styles.inputWrapperError]}>
                      <Ionicons name="lock-closed-outline" size={20} color={colors.inputPlaceholder} style={styles.inputIcon} />
                      <TextInput
                        ref={confirmPasswordRef}
                        style={styles.input}
                        placeholder={t('auth.reset.placeholderConfirmNew')}
                        placeholderTextColor={colors.inputPlaceholder}
                        value={confirmPassword}
                        onChangeText={(text) => { setConfirmPassword(text); if (confirmError) setConfirmError(null); }}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="newPassword"
                        returnKeyType="go"
                        onSubmitEditing={handleSubmit}
                        accessibilityLabel={t('auth.reset.confirmNewPasswordA11y')}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton} accessibilityRole="button" accessibilityLabel={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}>
                        <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.inputPlaceholder} />
                      </TouchableOpacity>
                    </View>
                    {!!confirmError && <Text style={styles.errorText} accessibilityRole="alert">{confirmError}</Text>}
                  </View>

                  {/* Submit */}
                  <View style={styles.submitContainer}>
                    <PrimaryButton
                      title={loading ? '' : t('auth.reset.update')}
                      onPress={handleSubmit}
                      disabled={loading}
                    />
                    {loading && (
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator color={colors.primary} />
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
