import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Pressable, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { DecorativeBackground } from '../components/onboarding/DecorativeBackground';
import { AuthWebWrapper } from '../components/AuthWebWrapper';
import { useResponsive } from '../hooks/useResponsive';

import { GRADIENTS, ANIMATION, COLORS, TYPOGRAPHY, SHADOWS, SHARED_STYLES } from '../constants/onboarding-theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isWeb, isMobile } = useResponsive();
  const isWebDesktop = isWeb && !isMobile;

  const [animDone, setAnimDone] = useState(false);

  const iconScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(40);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const glowScale = useSharedValue(1);

  const skipToEnd = () => {
    iconScale.value = withSpring(1, ANIMATION.springBouncy);
    titleOpacity.value = withTiming(1, { duration: 200 });
    taglineOpacity.value = withTiming(1, { duration: 200 });
    buttonOpacity.value = withTiming(1, { duration: 200 });
    buttonTranslateY.value = withSpring(0, ANIMATION.springBouncy);
    setAnimDone(true);
  };

  useEffect(() => {
    iconScale.value = withDelay(200, withSpring(1, ANIMATION.springBouncy));
    titleOpacity.value = withDelay(700, withTiming(1, { duration: 600 }));
    taglineOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }));
    buttonTranslateY.value = withDelay(1200, withSpring(0, ANIMATION.springBouncy));
    const timer = setTimeout(() => setAnimDone(true), 1800);

    // Start glow breathing animation
    glowScale.value = withDelay(800, withRepeat(
      withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite
      true // reverse
    ));

    return () => clearTimeout(timer);
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }, { scale: buttonScale.value }],
  }));

  const handleGetStarted = () => {
    router.push('/auth');
  };

  return (
    <TouchableWithoutFeedback onPress={!animDone ? skipToEnd : undefined}>
      <View style={styles.flex}>
        <DecorativeBackground variant="welcome" gradientColors={GRADIENTS.welcomeHero}>
          <AuthWebWrapper variant="welcome">
          <View style={styles.content}>
            <View style={styles.centerContent}>
              <Animated.View style={[iconStyle, styles.logoContainer]}>
                {/* Smooth layered glow */}
                {Array.from({ length: 40 }, (_, i) => {
                  const size = 110 + i * 3.5;
                  const opacity = 0.5 - i * 0.012;
                  return (
                    <Animated.View
                      key={i}
                      style={[
                        {
                          position: 'absolute' as const,
                          width: size,
                          height: size,
                          borderRadius: size / 2,
                          backgroundColor: `rgba(255,255,255,${Math.max(opacity, 0.03)})`,
                        },
                        glowStyle,
                      ]}
                    />
                  );
                })}
                <Image
                  source={require('../assets/images/SchoolKit-transparent.png')}
                  style={{ width: isWebDesktop ? 220 : 180, height: isWebDesktop ? 220 : 180, resizeMode: 'contain' }}
                />
              </Animated.View>

              <View style={{ height: 40 }} />

              <Animated.Text style={[styles.title, isWebDesktop && { fontSize: 56, letterSpacing: -1.5 }, titleStyle]}>
                SchoolKit
              </Animated.Text>

              <View style={styles.gap8} />

              <Animated.Text style={[styles.tagline, isWebDesktop && { fontSize: 22 }, taglineStyle]}>
                Support for every school journey
              </Animated.Text>
            </View>
          </View>

          <Animated.View style={[SHARED_STYLES.buttonContainer, isWebDesktop && { maxWidth: 400, alignSelf: 'center', width: '100%' }, buttonAnimStyle]}>
            <Pressable
              onPress={handleGetStarted}
              onPressIn={() => {
                buttonScale.value = withSpring(0.96, ANIMATION.springBouncy);
              }}
              onPressOut={() => {
                buttonScale.value = withSpring(1, ANIMATION.springBouncy);
              }}
            >
              <View style={[styles.button, isWebDesktop && styles.buttonWeb]}>
                <Text style={[styles.buttonText, isWebDesktop && { fontSize: 22 }]}>Get Started</Text>
                {isWebDesktop && <Ionicons name="arrow-forward" size={20} color={COLORS.primary} style={{ marginLeft: 8 }} />}
              </View>
            </Pressable>
            <View style={SHARED_STYLES.skipPlaceholder} />
          </Animated.View>

          {isWebDesktop && (
            <Text style={styles.webFooter}>Stanford Byers Center for Biodesign</Text>
          )}
          </AuthWebWrapper>
        </DecorativeBackground>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gap8: {
    height: 8,
  },
  title: {
    ...TYPOGRAPHY.display,
    color: COLORS.white,
    textAlign: 'center',
  },
  tagline: {
    ...TYPOGRAPHY.body,
    color: COLORS.whiteOverlay75,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonWeb: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(123,104,238,0.1)',
      },
    }),
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  webFooter: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
});
