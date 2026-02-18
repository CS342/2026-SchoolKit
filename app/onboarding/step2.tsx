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

import { GRADIENTS, SHADOWS, ANIMATION, COLORS, TYPOGRAPHY, SIZING, RADII, BORDERS, SHARED_STYLES } from '../../constants/onboarding-theme';

interface RoleOption {
  role: UserRole;
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  color: string;
  gradient: readonly string[];
}

const ROLES: RoleOption[] = [
  { role: 'student-k8', iconName: 'school', title: 'Student (Middle School)', color: COLORS.studentK8, gradient: GRADIENTS.roleStudentK8 },
  { role: 'student-hs', iconName: 'book', title: 'Student (High School and up)', color: COLORS.primary, gradient: GRADIENTS.roleStudentHS },
  { role: 'parent', iconName: 'people', title: 'Parent / Caregiver', color: COLORS.parent, gradient: GRADIENTS.roleParent },
  { role: 'staff', iconName: 'briefcase', title: 'School Staff', color: COLORS.staff, gradient: GRADIENTS.roleStaff },
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
          <Ionicons name={option.iconName} size={24} color={COLORS.white} />
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
      // Navigate to step2b for grade selection (all roles except none)
      router.push('/onboarding/step2b');
    }
  };

  return (
    <DecorativeBackground variant="step" gradientColors={GRADIENTS.screenBackground}>
      <View style={styles.container}>
        <OnboardingHeader currentStep={2} totalSteps={5} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={SHARED_STYLES.pageTitle}>Tell us about yourself</Text>
            <Text style={[SHARED_STYLES.pageSubtitle, { marginBottom: 28 }]}>Choose the option that best describes you</Text>

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

        <View style={SHARED_STYLES.buttonContainer}>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedRole}
          />
          <View style={SHARED_STYLES.skipPlaceholder} />
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
  options: {
    gap: 14,
  },
  roleCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    padding: 16,
    borderWidth: BORDERS.card,
    borderColor: COLORS.borderCard,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconCircle: {
    width: SIZING.circleRole,
    height: SIZING.circleRole,
    borderRadius: SIZING.circleRole / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  radioOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: BORDERS.cardSelected,
    borderColor: COLORS.indicatorInactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});
