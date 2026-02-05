import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { DecorativeBackground } from '../components/onboarding/DecorativeBackground';
import { GRADIENTS, SHADOWS, COLORS, TYPOGRAPHY, RADII, BORDERS, PASSWORD_STRENGTH_COLORS } from '../constants/onboarding-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/onboarding/PrimaryButton';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: 'None' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const normalized = Math.min(4, Math.floor(score / 1.5));
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return { score: normalized, label: labels[normalized] };
}

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { signUp, signInWithPassword, signInAnonymously } = useAuth();
  const [isSignUp, setIsSignUp] = useState(mode !== 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'None' });
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

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
    if (isSignUp) {
      setPasswordStrength(getPasswordStrength(text));
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    if (isSignUp) {
      if (password.length < 8) {
        Alert.alert('Weak password', 'Password must be at least 8 characters.');
        return;
      }
      if (!/[A-Z]/.test(password)) {
        Alert.alert('Weak password', 'Password must contain at least one uppercase letter.');
        return;
      }
      if (!/[a-z]/.test(password)) {
        Alert.alert('Weak password', 'Password must contain at least one lowercase letter.');
        return;
      }
      if (!/[0-9]/.test(password)) {
        Alert.alert('Weak password', 'Password must contain at least one number.');
        return;
      }
      if (!confirmPassword.trim()) {
        Alert.alert('Confirm password', 'Please confirm your password.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Passwords don't match", 'Please make sure both passwords are the same.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email.trim(), password);
        if (error) {
          Alert.alert('Sign up failed', error.message);
        } else {
          router.replace('/confirm-email');
        }
      } else {
        const { error } = await signInWithPassword(email.trim(), password);
        if (error) {
          Alert.alert('Sign in failed', error.message);
        } else {
          router.replace('/');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
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
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DecorativeBackground variant="auth" gradientColors={GRADIENTS.screenBackground}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Gradient Header Banner */}
          <LinearGradient
            colors={[...GRADIENTS.authHeader]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerBanner, { paddingTop: insets.top + 2 }]}
          >
            <View style={styles.headerDecorativeCircle} />
            <Ionicons name="school-outline" size={32} color={COLORS.white} />
            <Text style={styles.headerTitle}>SchoolKit</Text>
            <Text style={styles.headerSubtitle}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </Text>
          </LinearGradient>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                <Ionicons name="mail-outline" size={20} color={COLORS.inputPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.inputPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.inputPlaceholder} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder={isSignUp ? 'Min 8 chars, upper, lower, number' : 'Enter your password'}
                  placeholderTextColor={COLORS.inputPlaceholder}
                  value={password}
                  onChangeText={handlePasswordChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType={isSignUp ? 'newPassword' : 'password'}
                  returnKeyType={isSignUp ? 'next' : 'go'}
                  onSubmitEditing={() => {
                    if (isSignUp) confirmPasswordRef.current?.focus();
                    else handleSubmit();
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.inputPlaceholder} />
                </TouchableOpacity>
              </View>
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
                        { backgroundColor: i < passwordStrength.score ? PASSWORD_STRENGTH_COLORS[passwordStrength.score] : COLORS.borderCard },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: PASSWORD_STRENGTH_COLORS[passwordStrength.score] || COLORS.inputPlaceholder }]}>
                  {passwordStrength.label}
                </Text>
              </View>
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
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.inputWrapper, confirmFocused && styles.inputWrapperFocused]}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.inputPlaceholder} style={styles.inputIcon} />
                  <TextInput
                    ref={confirmPasswordRef}
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor={COLORS.inputPlaceholder}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton} accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}>
                    <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.inputPlaceholder} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Submit */}
            <View style={styles.submitContainer}>
              <PrimaryButton
                title={loading ? '' : (isSignUp ? 'Create Account' : 'Sign In')}
                onPress={handleSubmit}
                disabled={loading}
              />
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color={COLORS.white} />
                </View>
              )}
            </View>

            {/* Toggle */}
            <TouchableOpacity
              onPress={() => {
                setIsSignUp(!isSignUp);
                setConfirmPassword('');
                setPasswordStrength({ score: 0, label: 'None' });
              }}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleText}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={styles.toggleTextBold}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleContinueAsGuest}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={{ marginRight: 8 }} />
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
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
    color: COLORS.white,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.whiteOverlay80,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.formCard,
    padding: 24,
    marginHorizontal: 24,
    marginTop: -20,
    ...SHADOWS.card,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderWidth: BORDERS.input,
    borderColor: COLORS.border,
    borderRadius: RADII.input,
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.textDark,
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
  submitContainer: {
    marginTop: 8,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  toggleText: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  toggleTextBold: {
    fontWeight: '700',
    color: COLORS.primary,
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
    backgroundColor: COLORS.borderCard,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.inputPlaceholder,
  },
  guestButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: RADII.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: COLORS.border,
    marginHorizontal: 24,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
});
