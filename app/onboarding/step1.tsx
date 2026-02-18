import React, { useState, useEffect } from 'react';
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
import { useOnboarding } from '../../contexts/OnboardingContext';
import { DecorativeBackground } from '../../components/onboarding/DecorativeBackground';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';

import { GRADIENTS, ANIMATION, COLORS, TYPOGRAPHY, SHARED_STYLES } from '../../constants/onboarding-theme';

export default function Step1Screen() {
  const router = useRouter();
  const { updateName } = useOnboarding();

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
      router.push('/onboarding/step2');
    }
  };

  return (
    <DecorativeBackground variant="step" gradientColors={GRADIENTS.screenBackground}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <OnboardingHeader currentStep={1} totalSteps={5} />

        <View style={styles.content}>
          <Animated.View style={[SHARED_STYLES.pageIconCircle, iconStyle]}>
            <Ionicons name="person-circle-outline" size={48} color={COLORS.primary} />
          </Animated.View>

          <Animated.Text style={[SHARED_STYLES.pageTitle, titleStyle]}>
            What's your name?
          </Animated.Text>

          <Animated.Text style={[SHARED_STYLES.pageSubtitle, { marginBottom: 32 }, subtitleStyle]}>
            Let's personalize your experience
          </Animated.Text>

          <Animated.View style={[styles.inputContainer, inputStyle]}>
            <TextInput
              style={[styles.input, inputFocused && styles.inputFocused]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.inputPlaceholder}
              autoFocus
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onSubmitEditing={handleContinue}
            />
          </Animated.View>
        </View>

        <Animated.View style={[SHARED_STYLES.buttonContainer, buttonStyle]}>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={!name.trim()}
          />
          <View style={SHARED_STYLES.skipPlaceholder} />
        </Animated.View>
      </KeyboardAvoidingView>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 20,
    ...TYPOGRAPHY.input,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
});
