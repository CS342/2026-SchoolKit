import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { DecorativeBackground } from '../components/onboarding/DecorativeBackground';
import { PrimaryButton } from '../components/onboarding/PrimaryButton';
import { GRADIENTS, ANIMATION, COLORS, SHARED_STYLES } from '../constants/onboarding-theme';

export default function ConfirmEmailScreen() {
  const router = useRouter();

  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    const d = ANIMATION.entranceDelay;
    iconOpacity.value = withDelay(d * 0, withTiming(1, { duration: 400 }));
    iconScale.value = withDelay(d * 0, withSpring(1, ANIMATION.springBouncy));
    titleOpacity.value = withDelay(d * 1, withTiming(1, { duration: 400 }));
    subtitleOpacity.value = withDelay(d * 2, withTiming(1, { duration: 400 }));
    buttonOpacity.value = withDelay(d * 4, withTiming(1, { duration: 400 }));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));
  const buttonStyle = useAnimatedStyle(() => ({ opacity: buttonOpacity.value }));

  return (
    <DecorativeBackground variant="confirm" gradientColors={GRADIENTS.screenBackground}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Animated.View style={[styles.iconCircle, iconStyle]}>
            <Ionicons name="mail-outline" size={48} color={COLORS.primary} />
          </Animated.View>

          <Animated.Text style={[styles.title, titleStyle]}>
            Check your email
          </Animated.Text>

          <Animated.Text style={[styles.subtitle, subtitleStyle]}>
            We sent a verification link to your email.{'\n'}
            Tap the link to confirm your account, then sign in.
          </Animated.Text>
        </View>

        <Animated.View style={[SHARED_STYLES.buttonContainer, buttonStyle]}>
          <PrimaryButton
            title="Go to Sign In"
            onPress={() => router.replace('/auth?mode=signin')}
          />
          <View style={SHARED_STYLES.skipPlaceholder} />
        </Animated.View>
      </View>
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
    paddingTop: 120,
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
});
