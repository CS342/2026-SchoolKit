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
import { AuthWebWrapper } from '../components/AuthWebWrapper';
import { PrimaryButton } from '../components/onboarding/PrimaryButton';
import { useResponsive } from '../hooks/useResponsive';
import { GRADIENTS, ANIMATION, COLORS, SHARED_STYLES } from '../constants/onboarding-theme';

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const { isWeb, isMobile } = useResponsive();
  const isWebDesktop = isWeb && !isMobile;

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
      <AuthWebWrapper variant="confirm">
      <View style={styles.container}>
        <View style={[styles.content, isWebDesktop && { paddingTop: 48, maxWidth: 480, width: '100%', alignSelf: 'center' as const }]}>
          <Animated.View style={[SHARED_STYLES.pageIconCircle, isWebDesktop && { width: 96, height: 96, borderRadius: 48 }, iconStyle]}>
            <Ionicons name="mail-outline" size={isWebDesktop ? 56 : 48} color={COLORS.primary} />
          </Animated.View>

          <Animated.Text style={[SHARED_STYLES.pageTitle, titleStyle]}>
            Check your email
          </Animated.Text>

          <Animated.Text style={[SHARED_STYLES.pageSubtitle, subtitleStyle]}>
            We sent a verification link to your email.{'\n'}
            Tap the link to confirm your account, then sign in.
          </Animated.Text>
        </View>

        {isWebDesktop ? (
          <Animated.View style={[{ maxWidth: 400, width: '100%', alignSelf: 'center' as const, marginTop: 32, marginBottom: 40, gap: 4 }, buttonStyle]}>
            <PrimaryButton
              title="Go to Sign In"
              onPress={() => router.replace('/auth?mode=signin')}
            />
          </Animated.View>
        ) : (
          <Animated.View style={[SHARED_STYLES.buttonContainer, buttonStyle]}>
            <PrimaryButton
              title="Go to Sign In"
              onPress={() => router.replace('/auth?mode=signin')}
            />
            <View style={SHARED_STYLES.skipPlaceholder} />
          </Animated.View>
        )}
      </View>
      </AuthWebWrapper>
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
});
