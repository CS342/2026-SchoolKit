import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useOnboarding, UserRole } from '../../contexts/OnboardingContext';
import { DecorativeBackground } from '../../components/onboarding/DecorativeBackground';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { GRADIENTS, SHADOWS, ANIMATION } from '../../constants/onboarding-theme';

interface RoleOption {
  role: UserRole;
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  color: string;
  gradient: readonly string[];
}

const ROLES: RoleOption[] = [
  { role: 'student-k8', iconName: 'school', title: 'Student (K-8)', color: '#0EA5E9', gradient: GRADIENTS.roleStudentK8 },
  { role: 'student-hs', iconName: 'book', title: 'Student (High School+)', color: '#7B68EE', gradient: GRADIENTS.roleStudentHS },
  { role: 'parent', iconName: 'people', title: 'Parent / Caregiver', color: '#EC4899', gradient: GRADIENTS.roleParent },
  { role: 'staff', iconName: 'briefcase', title: 'School Staff', color: '#66D9A6', gradient: GRADIENTS.roleStaff },
];

function RoleCard({
  option,
  isSelected,
  onPress,
  index,
}: {
  option: RoleOption;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(index * ANIMATION.staggerDelay, withSpring(0, ANIMATION.springBouncy));
    opacity.value = withDelay(index * ANIMATION.staggerDelay, withTiming(1, { duration: 400 }));
  }, []);

  useEffect(() => {
    badgeScale.value = withSpring(isSelected ? 1 : 0, ANIMATION.springBouncy);
  }, [isSelected]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withSpring(1, ANIMATION.springBouncy)
    );
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.roleCard,
          isSelected && {
            borderColor: option.color,
            backgroundColor: option.color + '08',
            ...SHADOWS.cardSelected,
          },
          !isSelected && SHADOWS.card,
          cardStyle,
        ]}
      >
        <LinearGradient
          colors={[...option.gradient] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.roleIconCircle}
        >
          <Ionicons name={option.iconName} size={28} color="#FFFFFF" />
        </LinearGradient>

        <Text style={styles.roleTitle}>{option.title}</Text>

        <View style={[styles.radioOuter, isSelected && { borderColor: option.color }]}>
          {isSelected && (
            <Animated.View style={[styles.radioInner, { backgroundColor: option.color }, badgeStyle]} />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function Step2Screen() {
  const router = useRouter();
  const { updateRole } = useOnboarding();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      updateRole(selectedRole);
      // Fix: navigate to step2b for students, step3 for others
      if (selectedRole === 'student-k8' || selectedRole === 'student-hs') {
        router.push('/onboarding/step2b');
      } else {
        router.push('/onboarding/step3');
      }
    }
  };

  return (
    <DecorativeBackground variant="step" gradientColors={GRADIENTS.screenBackground}>
      <View style={styles.container}>
        <OnboardingHeader currentStep={2} totalSteps={4} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>Choose the option that best describes you</Text>

            <View style={styles.options}>
              {ROLES.map((option, index) => (
                <RoleCard
                  key={option.role}
                  option={option}
                  isSelected={selectedRole === option.role}
                  onPress={() => setSelectedRole(option.role)}
                  index={index}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedRole}
          />
        </View>
      </View>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
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
    marginBottom: 28,
  },
  options: {
    gap: 14,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E8E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D44',
  },
  radioOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    borderColor: '#C8C8D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
});
