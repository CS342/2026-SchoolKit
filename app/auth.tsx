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
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { DecorativeBackground } from '../components/onboarding/DecorativeBackground';
import { AuthWebWrapper } from '../components/AuthWebWrapper';
import { TYPOGRAPHY, RADII, BORDERS, PASSWORD_STRENGTH_COLORS } from '../constants/onboarding-theme';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/onboarding/PrimaryButton';
import { useResponsive } from '../hooks/useResponsive';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, labelKey: 'none' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const normalized = Math.min(4, Math.floor(score / 1.5));
  const labelKeys = ['weak', 'fair', 'good', 'strong', 'veryStrong'];
  return { score: normalized, labelKey: labelKeys[normalized] };
}

// The individual sign-up password rules, surfaced as a live checklist so the
// user sees every requirement at once instead of one alert at a time. The label
// for each rule is resolved from i18n at render time via its `key`.
const PASSWORD_RULES: { key: string; test: (p: string) => boolean }[] = [
  { key: 'length', test: p => p.length >= 8 },
  { key: 'upper', test: p => /[A-Z]/.test(p) },
  { key: 'lower', test: p => /[a-z]/.test(p) },
  { key: 'number', test: p => /[0-9]/.test(p) },
];

function passwordMeetsAllRules(password: string) {
  return PASSWORD_RULES.every(rule => rule.test(password));
}

export default function AuthScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isWeb, isMobile } = useResponsive();
  const { colors, gradients, shadows, sharedStyles } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isWebDesktop = isWeb && !isMobile;
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { signUp, signInWithPassword, signInAnonymously, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(mode !== 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, labelKey: 'none' });
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const confirmAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(confirmAnim, {
      toValue: isSignUp ? 1 : 0,
      tension: 70,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [isSignUp]);

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordError(null);
    if (isSignUp) {
      setPasswordStrength(getPasswordStrength(text));
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();

    // Validate every field up front and surface all problems inline at once,
    // rather than popping one modal alert per failing rule.
    let hasError = false;

    if (!trimmedEmail) {
      setEmailError(t('auth.errors.emailRequired'));
      hasError = true;
    } else if (!isValidEmail(trimmedEmail)) {
      setEmailError(t('auth.errors.emailInvalid'));
      hasError = true;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError(t('auth.errors.passwordRequired'));
      hasError = true;
    } else if (isSignUp && !passwordMeetsAllRules(password)) {
      setPasswordError(t('auth.errors.passwordRules'));
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (isSignUp) {
      if (!confirmPassword.trim()) {
        setConfirmError(t('auth.errors.confirmRequired'));
        hasError = true;
      } else if (password !== confirmPassword) {
        setConfirmError(t('auth.errors.passwordsNoMatch'));
        hasError = true;
      } else {
        setConfirmError(null);
      }
    } else {
      setConfirmError(null);
    }

    if (hasError) return;

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email.trim(), password);
        if (error) {
          showAlert(t('auth.alerts.signUpFailed'), error.message);
        } else {
          // Email verification is disabled for now. With Supabase "Confirm email"
          // off, signUp returns an active session, so route the signed-in user
          // straight into onboarding (via index) instead of /confirm-email.
          router.replace('/');
        }
      } else {
        const { error } = await signInWithPassword(email.trim(), password);
        if (error) {
          showAlert(t('auth.alerts.signInFailed'), error.message);
        } else {
          router.replace('/');
        }
      }
    } catch (err: any) {
      showAlert(t('auth.errorTitle'), err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showAlert(t('auth.alerts.enterEmailTitle'), t('auth.alerts.enterEmailFirst'));
      return;
    }
    if (!isValidEmail(email.trim())) {
      showAlert(t('auth.alerts.invalidEmailTitle'), t('auth.errors.emailInvalid'));
      return;
    }
    setLoading(true);
    try {
      const { error } = await resetPassword(email.trim());
      if (error) {
        showAlert(t('auth.errorTitle'), error.message);
      } else {
        showAlert(t('auth.alerts.checkEmailTitle'), t('auth.alerts.resetLinkSent'));
      }
    } catch (err: any) {
      showAlert(t('auth.errorTitle'), err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    setLoading(true);
    try {
      await signInAnonymously();
      router.replace('/');
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
          contentContainerStyle={[styles.scrollContent, isWebDesktop && { paddingVertical: 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={isWebDesktop ? { maxWidth: 480, width: '100%', alignSelf: 'center' as const, paddingHorizontal: 24 } : undefined}>
          {/* Gradient Header Banner (mobile only) / Icon + Title (desktop) */}
          {isWebDesktop ? (
            <View style={{ alignItems: 'center' as const, paddingTop: 48 }}>
              <View style={[sharedStyles.pageIconCircle, { width: 96, height: 96, borderRadius: 48 }]}>
                <Ionicons name={isSignUp ? 'person-add-outline' : 'lock-closed-outline'} size={56} color={colors.primary} />
              </View>
              <Text style={sharedStyles.pageTitle}>
                {isSignUp ? t('auth.signInScreen.createTitle') : t('auth.signInScreen.welcomeBack')}
              </Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 24 }]}>
                {isSignUp ? t('auth.signInScreen.createSubtitle') : t('auth.signInScreen.signInSubtitle')}
              </Text>
            </View>
          ) : (
            <LinearGradient
              colors={[...gradients.authHeader]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.headerBanner, { paddingTop: insets.top + 2 }]}
            >
              <View style={styles.headerDecorativeCircle} />
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                {Array.from({ length: 20 }, (_, i) => {
                  const size = 30 + i * 3;
                  const opacity = 0.5 - i * 0.024;
                  return (
                    <View
                      key={i}
                      style={{
                        position: 'absolute' as const,
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: `rgba(255,255,255,${Math.max(opacity, 0.03)})`,
                      }}
                    />
                  );
                })}
                <Image
                  source={require('../assets/images/HeaderLogo.png')}
                  style={{ width: 56, height: 56, resizeMode: 'contain' }}
                />
              </View>
              <Text style={styles.headerTitle}>SchoolKit</Text>
              <Text style={styles.headerSubtitle}>
                {isSignUp ? t('auth.signInScreen.createTitle') : t('auth.signInScreen.welcomeBack')}
              </Text>
            </LinearGradient>
          )}

          {/* Form Card */}
          <View style={[styles.formCard, !isWebDesktop && shadows.card, isWebDesktop && { backgroundColor: 'transparent', borderRadius: 0, padding: 0, marginHorizontal: 0, marginTop: 0, shadowOpacity: 0, elevation: 0 }]}>
            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.labelEmail')}</Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused, !!emailError && styles.inputWrapperError]}>
                <Ionicons name="mail-outline" size={20} color={colors.inputPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.placeholderEmail')}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={email}
                  onChangeText={(text) => { setEmail(text); if (emailError) setEmailError(null); }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  accessibilityLabel={t('auth.labelEmail')}
                />
              </View>
              {!!emailError && <Text style={styles.errorText} accessibilityRole="alert">{emailError}</Text>}
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.labelPassword')}</Text>
              <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused, !!passwordError && styles.inputWrapperError]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.inputPlaceholder} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder={isSignUp ? t('auth.placeholderPasswordSignUp') : t('auth.placeholderPasswordSignIn')}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={password}
                  onChangeText={handlePasswordChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType={isSignUp ? 'none' : 'password'}
                  returnKeyType={isSignUp ? 'next' : 'go'}
                  onSubmitEditing={() => {
                    if (isSignUp) confirmPasswordRef.current?.focus();
                    else handleSubmit();
                  }}
                  accessibilityLabel={t('auth.labelPassword')}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton} accessibilityRole="button" accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.inputPlaceholder} />
                </TouchableOpacity>
              </View>
              {!!passwordError && <Text style={styles.errorText} accessibilityRole="alert">{passwordError}</Text>}
            </View>

            {/* Password Strength */}
            {isSignUp && password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarBackground}>
                  {[0, 1, 2, 3].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBarSegment,
                        { backgroundColor: i < passwordStrength.score ? PASSWORD_STRENGTH_COLORS[passwordStrength.score] : colors.borderCard },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: PASSWORD_STRENGTH_COLORS[passwordStrength.score] || colors.inputPlaceholder }]}>
                  {t(`auth.strength.${passwordStrength.labelKey}`)}
                </Text>
              </View>
            )}

            {/* Live password requirements — all shown at once, ticked as met */}
            {isSignUp && password.length > 0 && (
              <View
                style={styles.requirementsContainer}
                accessibilityLabel={t('auth.passwordRequirementsA11y', { requirements: PASSWORD_RULES.filter(r => !r.test(password)).map(r => t(`auth.passwordRules.${r.key}`)).join(', ') || t('auth.allMet') })}
              >
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

            {/* Forgot Password */}
            {!isSignUp && (
              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton} disabled={loading} accessibilityRole="button" accessibilityLabel={t('auth.signInScreen.forgotPasswordA11y')}>
                <Text style={styles.forgotText}>{t('auth.signInScreen.forgotPassword')}</Text>
              </TouchableOpacity>
            )}

            {/* Confirm Password */}
            <Animated.View
              style={{
                opacity: confirmAnim,
                maxHeight: confirmAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }),
                overflow: 'hidden',
              }}
              pointerEvents={isSignUp ? 'auto' : 'none'}
            >
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.labelConfirmPassword')}</Text>
                <View style={[styles.inputWrapper, confirmFocused && styles.inputWrapperFocused, !!confirmError && styles.inputWrapperError]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.inputPlaceholder} style={styles.inputIcon} />
                  <TextInput
                    ref={confirmPasswordRef}
                    style={styles.input}
                    placeholder={t('auth.placeholderConfirm')}
                    placeholderTextColor={colors.inputPlaceholder}
                    value={confirmPassword}
                    onChangeText={(text) => { setConfirmPassword(text); if (confirmError) setConfirmError(null); }}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="none"
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit}
                    accessibilityLabel={t('auth.confirmPasswordA11y')}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton} accessibilityRole="button" accessibilityLabel={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}>
                    <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.inputPlaceholder} />
                  </TouchableOpacity>
                </View>
                {!!confirmError && <Text style={styles.errorText} accessibilityRole="alert">{confirmError}</Text>}
              </View>
            </Animated.View>

            {/* Submit */}
            <View style={styles.submitContainer}>
              <PrimaryButton
                title={loading ? '' : (isSignUp ? t('auth.createAccount') : t('auth.signIn'))}
                onPress={handleSubmit}
                disabled={loading}
              />
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              )}
            </View>

            {/* Toggle */}
            <TouchableOpacity
              onPress={() => {
                setIsSignUp(!isSignUp);
                setConfirmPassword('');
                setPasswordStrength({ score: 0, labelKey: 'none' });
                setEmailError(null);
                setPasswordError(null);
                setConfirmError(null);
              }}
              style={styles.toggleButton}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={isSignUp ? t('auth.signInScreen.switchToSignIn') : t('auth.signInScreen.switchToSignUp')}
            >
              <Text style={styles.toggleText}>
                {isSignUp ? t('auth.signInScreen.toggleHaveAccount') : t('auth.signInScreen.toggleNoAccount')}
                <Text style={styles.toggleTextBold}>
                  {isSignUp ? t('auth.signIn') : t('auth.signUp')}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, isWebDesktop && { marginHorizontal: 0 }]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.guestButton, isWebDesktop && { marginHorizontal: 0 }, loading && { opacity: 0.6 }]}
            onPress={handleContinueAsGuest}
            activeOpacity={0.8}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={t('auth.continueAsGuestA11y')}
            accessibilityState={{ disabled: loading }}
          >
            <Ionicons name="person-outline" size={20} color={colors.textMuted} style={{ marginRight: 8 }} />
            <Text style={styles.guestButtonText}>{t('auth.continueAsGuest')}</Text>
          </TouchableOpacity>
          <Text style={[styles.guestWarningText, isWebDesktop && { marginHorizontal: 0 }]}>
            {t('auth.guestWarning')}
          </Text>
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
  headerBanner: {
    height: 240,
    paddingTop: 52,
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: RADII.headerBottom,
    borderBottomRightRadius: RADII.headerBottom,
    overflow: 'hidden',
  },
  headerDecorativeCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: '#FFFFFF',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: c.white,
    borderRadius: RADII.formCard,
    padding: 24,
    marginHorizontal: 24,
    marginTop: -20,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.inputBackground,
    borderWidth: BORDERS.input,
    borderColor: c.border,
    borderRadius: RADII.input,
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: c.primary,
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: -8,
    gap: 10,
  },
  strengthBarBackground: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '700',
    width: 80,
    textAlign: 'right',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    marginTop: -8,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.primary,
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
  toggleButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  toggleText: {
    fontSize: 15,
    color: c.textMuted,
  },
  toggleTextBold: {
    fontWeight: '700',
    color: c.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    marginHorizontal: 24,
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
    marginHorizontal: 24,
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
    marginHorizontal: 24,
    marginTop: 8,
  },
});
