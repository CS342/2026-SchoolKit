import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../contexts/AuthContext';
import { DecorativeBackground } from '../components/onboarding/DecorativeBackground';
import { GRADIENTS, ANIMATION } from '../constants/onboarding-theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { signInAnonymously } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [animDone, setAnimDone] = useState(false);

  const iconScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(40);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

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
    return () => clearTimeout(timer);
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
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

  const handleGetStarted = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await signInAnonymously();
      router.push('/onboarding/step1');
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={!animDone ? skipToEnd : undefined}>
      <View style={styles.flex}>
        <DecorativeBackground variant="welcome" gradientColors={GRADIENTS.welcomeHero}>
          <View style={styles.content}>
            <View style={styles.centerContent}>
              <Animated.View style={iconStyle}>
                <Ionicons name="school" size={80} color="#FFFFFF" />
              </Animated.View>

              <View style={styles.gap20} />

              <Animated.Text style={[styles.title, titleStyle]}>
                SchoolKit
              </Animated.Text>

              <View style={styles.gap8} />

              <Animated.Text style={[styles.tagline, taglineStyle]}>
                Support for every school journey
              </Animated.Text>
            </View>

            <Animated.View style={[styles.buttonContainer, buttonAnimStyle]}>
              <Pressable
                onPress={handleGetStarted}
                onPressIn={() => {
                  buttonScale.value = withSpring(0.96, ANIMATION.springBouncy);
                }}
                onPressOut={() => {
                  buttonScale.value = withSpring(1, ANIMATION.springBouncy);
                }}
                disabled={isLoading}
              >
                <View style={styles.button}>
                  <Text style={styles.buttonText}>Get Started</Text>
                </View>
              </Pressable>
            </Animated.View>
          </View>
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
    position: 'absolute',
    top: '32%',
  },
  gap20: {
    height: 20,
  },
  gap8: {
    height: 8,
  },
  title: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: '15%',
    left: 32,
    right: 32,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#7B68EE',
  },
});
