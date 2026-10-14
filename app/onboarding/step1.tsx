import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { DecorativeBackground } from '../../components/onboarding/DecorativeBackground';
import { AuthWebWrapper, getOnboardingStep } from '../../components/AuthWebWrapper';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';

import { useResponsive } from '../../hooks/useResponsive';
import { ANIMATION, TYPOGRAPHY } from '../../constants/onboarding-theme';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../constants/theme';

export default function Step1Screen() {
  const router = useRouter();
  const { updateName } = useOnboarding();
  const { isAnonymous, signOut } = useAuth();
  const { isWeb, isMobile } = useResponsive();
  const { colors, gradients, sharedStyles } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isWebDesktop = isWeb && !isMobile;
  const stepInfo = getOnboardingStep('name');

  const [name, setName] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const inputOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    const d = ANIMATION.entranceDelay;
    iconOpacity.value = withDelay(d * 0, withTiming(1, { duration: 400 }));
    iconScale.value = withDelay(d * 0, withSpring(1, ANIMATION.springBouncy));
    titleOpacity.value = withDelay(d * 1, withTiming(1, { duration: 400 }));
    subtitleOpacity.value = withDelay(d * 2, withTiming(1, { duration: 400 }));
    inputOpacity.value = withDelay(d * 3, withTiming(1, { duration: 400 }));
    buttonOpacity.value = withDelay(d * 4, withTiming(1, { duration: 400 }));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));
  const inputStyle = useAnimatedStyle(() => ({ opacity: inputOpacity.value }));
  const buttonStyle = useAnimatedStyle(() => ({ opacity: buttonOpacity.value }));

  const handleContinue = () => {
    if (name.trim()) {
      updateName(name.trim());
      router.push('/onboarding/step-language');
    }
  };

  const handleBack = async () => {
    if (isAnonymous) {
      await signOut();
      router.replace('/welcome');
    } else {
      router.back();
    }
  };

  return (
    <DecorativeBackground variant="step" gradientColors={gradients.screenBackground}>
      <AuthWebWrapper variant="onboarding" step={stepInfo}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <OnboardingHeader
            currentStep={stepInfo.current}
            totalSteps={stepInfo.total}
            showBackOnFirstStep={isAnonymous}
            onBack={handleBack}
          />

          <View style={[styles.content, isWebDesktop && { maxWidth: 800, width: '100%', alignSelf: 'center', flex: undefined, paddingTop: 48, alignItems: 'center' }]}>
            <Animated.View style={[sharedStyles.pageIconCircle, isWebDesktop && { width: 96, height: 96, borderRadius: 48 }, iconStyle]}>
              <Ionicons name="person-circle-outline" size={isWebDesktop ? 56 : 48} color={colors.primary} />
            </Animated.View>

            <Animated.Text style={[sharedStyles.pageTitle, titleStyle]}>
              What's your name?
            </Animated.Text>

            <Animated.Text style={[sharedStyles.pageSubtitle, { marginBottom: 24 }, subtitleStyle]}>
              Let's personalize your experience
            </Animated.Text>

            <Animated.View style={[styles.inputContainer, isWebDesktop && { maxWidth: 480 }, inputStyle]}>
              <TextInput
                style={[styles.input, inputFocused && styles.inputFocused]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.inputPlaceholder}
                autoFocus
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onSubmitEditing={handleContinue}
              />
            </Animated.View>

            {isWebDesktop && (
              <Animated.View style={[{ maxWidth: 400, width: '100%', alignSelf: 'center', marginTop: 32, gap: 4 }, buttonStyle]}>
                <PrimaryButton
                  title="Continue"
                  onPress={handleContinue}
                  disabled={!name.trim()}
                />
              </Animated.View>
            )}
          </View>
        </KeyboardAvoidingView>

        {!isWebDesktop && (
        <Animated.View style={[sharedStyles.buttonContainer, buttonStyle]}>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={!name.trim()}
          />
          <View style={sharedStyles.skipPlaceholder} />
        </Animated.View>
        )}
      </View>
      </AuthWebWrapper>
    </DecorativeBackground>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: c.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: c.border,
    padding: 20,
    ...TYPOGRAPHY.input,
    color: c.textDark,
    textAlign: 'center',
  },
  inputFocused: {
    borderColor: c.primary,
  },
});
