import React, { useState, useEffect, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useOnboarding, UserRole } from '../../contexts/OnboardingContext';
import { DecorativeBackground } from '../../components/onboarding/DecorativeBackground';
import { AuthWebWrapper, getOnboardingStep } from '../../components/AuthWebWrapper';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';

import { useResponsive } from '../../hooks/useResponsive';
import { GRADIENTS, ANIMATION, COLORS, SIZING, RADII, BORDERS } from '../../constants/onboarding-theme';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../constants/theme';
import { isStudentRole } from '../../utils/profile';

interface RoleOption {
  role: UserRole;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  gradient: readonly string[];
}

const ROLES: RoleOption[] = [
  { role: 'student-elementary', iconName: 'color-palette', color: COLORS.studentElementary, gradient: GRADIENTS.roleStudentElementary },
  { role: 'student-k8', iconName: 'school', color: COLORS.studentK8, gradient: GRADIENTS.roleStudentK8 },
  { role: 'student-hs', iconName: 'book', color: COLORS.primary, gradient: GRADIENTS.roleStudentHS },
  { role: 'parent', iconName: 'people', color: COLORS.parent, gradient: GRADIENTS.roleParent },
  { role: 'staff', iconName: 'briefcase', color: COLORS.staff, gradient: GRADIENTS.roleStaff },
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
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();
  const title = t(`onboarding.role.options.${option.role}`);
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
    <Pressable
      onPress={handlePress}
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityState={{ selected: isSelected }}
    >
      <Animated.View
        style={[
          styles.roleCard,
          isSelected && {
            borderColor: option.color,
            backgroundColor: option.color + '08',
            ...shadows.cardSelected,
          },
          !isSelected && shadows.card,
          cardStyle,
        ]}
      >
        <LinearGradient
          colors={[...option.gradient] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.roleIconCircle}
        >
          <Ionicons name={option.iconName} size={24} color="#FFFFFF" />
        </LinearGradient>

        <Text style={styles.roleTitle}>{title}</Text>

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
  const { t } = useTranslation();
  const { data, updateRole } = useOnboarding();
  const { isWeb, isMobile } = useResponsive();
  const { colors, gradients, sharedStyles } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isWebDesktop = isWeb && !isMobile;
  const stepInfo = getOnboardingStep('role');

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(data.role);

  const handleContinue = () => {
    if (selectedRole) {
      updateRole(selectedRole);
      // Students skip grade selection — go straight to school journey
      if (isStudentRole(selectedRole)) {
        router.push('/onboarding/step3');
      } else {
        router.push('/onboarding/step2b');
      }
    }
  };

  return (
    <DecorativeBackground variant="step" gradientColors={gradients.screenBackground}>
      <AuthWebWrapper variant="onboarding" step={stepInfo}>
      <View style={styles.container}>
        <OnboardingHeader currentStep={stepInfo.current} totalSteps={stepInfo.total} />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, isWebDesktop && { paddingVertical: 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, isWebDesktop && { maxWidth: 800, width: '100%', alignSelf: 'center', flex: undefined, paddingTop: 48, paddingBottom: 0, alignItems: 'center' }]}>
            <View style={[sharedStyles.pageIconCircle, isWebDesktop && { width: 96, height: 96, borderRadius: 48 }]}>
              <Ionicons name="people-outline" size={isWebDesktop ? 56 : 48} color={colors.primary} />
            </View>

            <Text style={sharedStyles.pageTitle}>{t('onboarding.role.title')}</Text>
            <Text style={[sharedStyles.pageSubtitle, { marginBottom: 24 }]}>{t('onboarding.role.subtitle')}</Text>

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
                  title={t('common.continue')}
                  onPress={handleContinue}
                  disabled={!selectedRole}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {!isWebDesktop && (
        <View style={sharedStyles.buttonContainer}>
          <PrimaryButton
            title={t('common.continue')}
            onPress={handleContinue}
            disabled={!selectedRole}
          />
          <View style={sharedStyles.skipPlaceholder} />
        </View>
        )}
      </View>
      </AuthWebWrapper>
    </DecorativeBackground>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
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
    backgroundColor: c.white,
    borderRadius: RADII.card,
    padding: 18,
    borderWidth: BORDERS.card,
    borderColor: c.borderCard,
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
    color: c.textDark,
  },
  radioOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: BORDERS.cardSelected,
    borderColor: c.indicatorInactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});
