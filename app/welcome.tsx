import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();
  const [showButton, setShowButton] = useState(false);

  const titleFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<any>(null);

  const skipToEnd = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    titleFadeAnim.stopAnimation();
    buttonFadeAnim.stopAnimation();
    pulseAnim.stopAnimation();
    setShowButton(true);
    titleFadeAnim.setValue(1);
    buttonFadeAnim.setValue(1);
  };

  useEffect(() => {
    // Fade in SchoolKit title quickly
    const titleAnim = Animated.sequence([
      Animated.timing(titleFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.delay(800),
    ]);

    animationRef.current = titleAnim;
    titleAnim.start(() => {
      setShowButton(true);

      // Fade in button
      const buttonAnim = Animated.timing(buttonFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      });

      animationRef.current = buttonAnim;
      buttonAnim.start(() => {
        // Start pulsing animation
        const pulse = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.08,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        );
        animationRef.current = pulse;
        pulse.start();
      });
    });
  }, []);

  return (
    <TouchableWithoutFeedback onPress={skipToEnd}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Animated.Text style={[styles.title, { opacity: titleFadeAnim }]}>
              SchoolKit
            </Animated.Text>
          </View>

          <View style={styles.buttonContainer}>
            {showButton && (
              <Animated.View style={{ opacity: buttonFadeAnim }}>
                <TouchableOpacity
                  onPress={() => router.push('/onboarding/step1')}
                  activeOpacity={0.8}
                >
                  <Animated.View style={[styles.button, { transform: [{ scale: pulseAnim }] }]}>
                    <Text style={styles.buttonText}>Get Started</Text>
                  </Animated.View>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    position: 'absolute',
    top: '35%',
    alignItems: 'center',
  },
  title: {
    fontSize: 56,
    fontWeight: '800',
    color: '#7B68EE',
    textAlign: 'center',
    letterSpacing: -1.5,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: '30%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#7B68EE',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 30,
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
