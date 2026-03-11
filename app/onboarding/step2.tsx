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
import { AuthWebWrapper } from '../../components/AuthWebWrapper';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';

import { useResponsive } from '../../hooks/useResponsive';
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
  const { isWeb, isMobile } = useResponsive();
  const isWebDesktop = isWeb && !isMobile;

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      updateRole(selectedRole);
      // Students skip grade selection — go straight to school journey
      if (selectedRole === 'student-k8' || selectedRole === 'student-hs') {
        router.push('/onboarding/step3');
      } else {
        router.push('/onboarding/step2b');
      }
    }
  };

  return (
    <DecorativeBackground variant="step" gradientColors={GRADIENTS.screenBackground}>
      <AuthWebWrapper variant="onboarding" step={{ current: 2, total: 5, label: 'About you' }}>
      <View style={styles.container}>
        <OnboardingHeader currentStep={2} totalSteps={5} />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, isWebDesktop && { paddingVertical: 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, isWebDesktop && { maxWidth: 800, width: '100%', alignSelf: 'center', flex: undefined, paddingTop: 48, paddingBottom: 0, alignItems: 'center' }]}>
            <View style={[SHARED_STYLES.pageIconCircle, isWebDesktop && { width: 96, height: 96, borderRadius: 48 }]}>
              <Ionicons name="people-outline" size={isWebDesktop ? 56 : 48} color={COLORS.primary} />
            </View>

            <Text style={SHARED_STYLES.pageTitle}>Tell us about yourself</Text>
            <Text style={[SHARED_STYLES.pageSubtitle, { marginBottom: 24 }]}>Choose the option that best describes you</Text>

            <View style={[styles.options, isWebDesktop && { flexDirection: 'row', flexWrap: 'wrap', gap: 16, width: '100%' }]}>
              {ROLES.map((option, index) => (
                <View key={option.role} style={isWebDesktop ? { width: '48%' } : undefined}>
                  <RoleCard
                    option={option}
                    isSelected={selectedRole === option.role}
                    onPress={() => setSelectedRole(option.role)}
                    index={index}
                  />
                </View>
              ))}
            </View>

            {isWebDesktop && (
              <View style={{ maxWidth: 400, width: '100%', alignSelf: 'center', marginTop: 32, gap: 4 }}>
                <PrimaryButton
                  title="Continue"
                  onPress={handleContinue}
                  disabled={!selectedRole}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {!isWebDesktop && (
        <View style={SHARED_STYLES.buttonContainer}>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedRole}
          />
          <View style={SHARED_STYLES.skipPlaceholder} />
        </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  options: {
    width: '100%',
    gap: 14,
  },
  roleCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    padding: 18,
    borderWidth: BORDERS.card,
    borderColor: COLORS.borderCard,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconCircle: {
    width: SIZING.circleCard,
    height: SIZING.circleCard,
    borderRadius: SIZING.circleCard / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  roleTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
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
