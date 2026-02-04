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
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// --- Validation helpers ---

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

const STRENGTH_COLORS = ['#EF4444', '#F59E0B', '#EAB308', '#22C55E', '#16A34A'];

// --- Component ---

export default function AuthScreen() {
  const router = useRouter();
  const { signUp, signInWithPassword, linkEmailPassword, isAnonymous } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'None' });

  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const confirmAnim = useRef(new Animated.Value(1)).current; // start as sign-up

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
        if (isAnonymous) {
          const { error } = await linkEmailPassword(email.trim(), password);
          if (error) {
            const msg = error.message.toLowerCase();
            if (msg.includes('already') || msg.includes('exists') || msg.includes('duplicate')) {
              Alert.alert(
                'Email already in use',
                'An account with this email already exists. Would you like to sign in instead?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Switch to Sign In', onPress: () => {
                    setIsSignUp(false);
                    setConfirmPassword('');
                    setPasswordStrength({ score: 0, label: 'None' });
                  }},
                ],
              );
            } else {
              Alert.alert('Sign up failed', error.message);
            }
          } else {
            Alert.alert(
              'Account created!',
              'Your profile data has been saved.',
              [{ text: 'Great', onPress: () => router.replace('/(tabs)') }],
            );
          }
        } else {
          const { error } = await signUp(email.trim(), password);
          if (error) {
            Alert.alert('Sign up failed', error.message);
          } else {
            Alert.alert(
              'Account created!',
              'Check your email to verify your account, then sign in.',
              [{ text: 'Got it', onPress: () => {
                setIsSignUp(false);
                setConfirmPassword('');
                setPasswordStrength({ score: 0, label: 'None' });
              }}],
            );
            // Auto-switch to sign-in after 3 seconds
            setTimeout(() => {
              setIsSignUp(false);
              setConfirmPassword('');
            }, 3000);
          }
        }
      } else {
        const { error } = await signInWithPassword(email.trim(), password);
        if (error) {
          Alert.alert('Sign in failed', error.message);
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>SchoolKit</Text>
          <Text style={styles.subtitle}>
            {isSignUp
              ? (isAnonymous ? 'Save your progress with an account' : 'Create your account')
              : 'Welcome back'}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#A8A8B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#A8A8B8"
                value={email}
                onChangeText={setEmail}
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
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#A8A8B8" style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder={isSignUp ? 'Min 8 chars, upper, lower, number' : 'Enter your password'}
                placeholderTextColor="#A8A8B8"
                value={password}
                onChangeText={handlePasswordChange}
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
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#A8A8B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Strength (sign-up only) */}
          {isSignUp && password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBarBackground}>
                {[0, 1, 2, 3].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBarSegment,
                      { backgroundColor: i < passwordStrength.score ? STRENGTH_COLORS[passwordStrength.score] : '#E8E8F0' },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[passwordStrength.score] || '#A8A8B8' }]}>
                {passwordStrength.label}
              </Text>
            </View>
          )}

          {/* Confirm Password (sign-up only) */}
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
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#A8A8B8" style={styles.inputIcon} />
                <TextInput
                  ref={confirmPasswordRef}
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#A8A8B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                  <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#A8A8B8" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

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

        {!isAnonymous && (
          <>
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
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#7B68EE',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B6B85',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D44',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E8E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2D2D44',
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
  submitButton: {
    backgroundColor: '#7B68EE',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  toggleText: {
    fontSize: 15,
    color: '#6B6B85',
  },
  toggleTextBold: {
    fontWeight: '700',
    color: '#7B68EE',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#A8A8B8',
  },
  guestButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E8F0',
  },
  guestButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B6B85',
  },
});
