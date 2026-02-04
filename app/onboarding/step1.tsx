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
import { GRADIENTS, ANIMATION } from '../../constants/onboarding-theme';

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
        <OnboardingHeader currentStep={1} totalSteps={4} />

        <View style={styles.content}>
          <Animated.View style={[styles.iconCircle, iconStyle]}>
            <Ionicons name="person-circle-outline" size={64} color="#7B68EE" />
          </Animated.View>

          <Animated.Text style={[styles.title, titleStyle]}>
            What's your name?
          </Animated.Text>

          <Animated.Text style={[styles.subtitle, subtitleStyle]}>
            Let's personalize your experience
          </Animated.Text>

          <Animated.View style={[styles.inputContainer, inputStyle]}>
            <TextInput
              style={[styles.input, inputFocused && styles.inputFocused]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#A8A8B8"
              autoFocus
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onSubmitEditing={handleContinue}
            />
          </Animated.View>
        </View>

        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={!name.trim()}
          />
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
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0EBFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2D2D44',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8E8EA8',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E8E0F0',
    padding: 20,
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D44',
    textAlign: 'center',
  },
  inputFocused: {
    borderColor: '#7B68EE',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
});
