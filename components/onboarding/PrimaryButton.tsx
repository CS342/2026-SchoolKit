import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GRADIENTS, SHADOWS, ANIMATION } from '../../constants/onboarding-theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function PrimaryButton({ title, onPress, disabled = false, icon }: PrimaryButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, ANIMATION.springBouncy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, ANIMATION.springBouncy);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[animatedStyle, !disabled && SHADOWS.button]}>
        <LinearGradient
          colors={disabled ? [...GRADIENTS.disabledButton] : [...GRADIENTS.primaryButton]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.innerGlow}>
            <View style={styles.content}>
              <Text style={[styles.text, disabled && styles.textDisabled]}>
                {title}
              </Text>
              {icon && (
                <Ionicons
                  name={icon}
                  size={20}
                  color={disabled ? '#B0A8C8' : '#FFFFFF'}
                  style={styles.icon}
                />
              )}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  innerGlow: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  textDisabled: {
    color: '#B0A8C8',
  },
  icon: {
    marginLeft: 8,
  },
});
