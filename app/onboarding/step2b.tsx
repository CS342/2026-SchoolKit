import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { DecorativeBackground } from '../../components/onboarding/DecorativeBackground';
import { AuthWebWrapper, getOnboardingStep } from '../../components/AuthWebWrapper';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';

import { useResponsive } from '../../hooks/useResponsive';
import { ANIMATION, RADII, BORDERS } from '../../constants/onboarding-theme';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../constants/theme';

interface GradeOption {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const ELEMENTARY_GRADES: GradeOption[] = [
  { value: 'pre-k', label: 'Pre-K/\nkindergarten', icon: 'flower-outline', color: '#EC4899' },
  { value: '1', label: '1st grade', icon: 'star-outline', color: '#7B68EE' },
  { value: '2', label: '2nd grade', icon: 'balloon-outline', color: '#0EA5E9' },
  { value: '3', label: '3rd grade', icon: 'sunny-outline', color: '#F59E0B' },
  { value: '4', label: '4th grade', icon: 'leaf-outline', color: '#66D9A6' },
  { value: '5', label: '5th grade', icon: 'rocket-outline', color: '#EC4899' },
];

const MIDDLE_SCHOOL_GRADES: GradeOption[] = [
  { value: '6', label: '6th grade', icon: 'planet-outline', color: '#EC4899' },
  { value: '7', label: '7th grade', icon: 'compass-outline', color: '#0EA5E9' },
  { value: '8', label: '8th grade', icon: 'compass-outline', color: '#66D9A6' },
];

const HS_GRADES: GradeOption[] = [
  { value: '9', label: '9th grade\n(freshman)', icon: 'leaf-outline', color: '#66D9A6' },
  { value: '10', label: '10th grade\n(sophomore)', icon: 'flash-outline', color: '#0EA5E9' },
  { value: '11', label: '11th grade\n(junior)', icon: 'ribbon-outline', color: '#7B68EE' },
  { value: '12', label: '12th grade\n(senior)', icon: 'trophy-outline', color: '#F59E0B' },
  { value: 'college', label: 'College /\nuniversity', icon: 'school-outline', color: '#EC4899' },
];

const PARENT_GRADES: GradeOption[] = [
  { value: 'pre-k', label: 'Pre-K/\nkindergarten', icon: 'flower-outline', color: '#EC4899' },
  { value: 'elementary', label: 'Elementary\nschool (1-5)', icon: 'star-outline', color: '#7B68EE' },
  { value: 'middle-school', label: 'Middle\nschool (6-8)', icon: 'rocket-outline', color: '#0EA5E9' },
  { value: 'high-school', label: 'High\nschool (9-12)', icon: 'planet-outline', color: '#66D9A6' },
  { value: 'high-school-up', label: 'Beyond high\nschool', icon: 'school-outline', color: '#F59E0B' },
];

function GradeCell({
  grade,
  isSelected,
  onPress,
  index,
}: {
  grade: GradeOption;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(index * ANIMATION.staggerDelay, withSpring(0, ANIMATION.springBouncy));
    opacity.value = withDelay(index * ANIMATION.staggerDelay, withTiming(1, { duration: 400 }));
  }, []);

  const cellStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
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
      style={styles.gridCellWrapper}
      accessibilityRole="radio"
      accessibilityLabel={grade.label.replace(/\n/g, ' ')}
      accessibilityState={{ selected: isSelected }}
    >
      <Animated.View
        style={[
          styles.gridCell,
          isSelected && {
            borderColor: grade.color,
            backgroundColor: grade.color + '10',
            ...shadows.cardSelected,
          },
          !isSelected && shadows.card,
          cellStyle,
        ]}
      >
        <Ionicons name={grade.icon} size={24} color={grade.color} />
        <Text style={[styles.gridCellLabel, isSelected && { color: grade.color, fontWeight: '700' }]}>
          {grade.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function Step2bScreen() {
  const router = useRouter();
  const { data, updateGradeLevel } = useOnboarding();
  const { isWeb, isMobile } = useResponsive();
  const { colors, gradients, sharedStyles } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isWebDesktop = isWeb && !isMobile;

  const [selectedGrade, setSelectedGrade] = useState<string | null>(data.gradeLevel || null);

  const isParentOrStaff = data.role === 'parent' || data.role === 'staff';
  const isMiddleSchool = data.role === 'student-k8';
  const isElementary = data.role === 'student-elementary';
  // Only guardians (parents/staff) reach the grade screen; students skip it.
  const stepInfo = getOnboardingStep('grade', false);
  const grades = isParentOrStaff ? PARENT_GRADES : isElementary ? ELEMENTARY_GRADES : isMiddleSchool ? MIDDLE_SCHOOL_GRADES : HS_GRADES;



  const handleContinue = () => {
    if (selectedGrade) {
      updateGradeLevel(selectedGrade);
      router.push('/onboarding/step3');
    }
  };

  const handleSkip = () => {
    updateGradeLevel('');
    router.push('/onboarding/step3');
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
          <View style={[styles.content, isWebDesktop && { maxWidth: 800, width: '100%', alignSelf: 'center', flex: undefined, paddingTop: 48, alignItems: 'center' }]}>
            <View style={[sharedStyles.pageIconCircle, isWebDesktop && { width: 96, height: 96, borderRadius: 48 }]}>
              <Ionicons name="ribbon-outline" size={isWebDesktop ? 56 : 48} color={colors.primary} />
            </View>

            <Text style={sharedStyles.pageTitle}>{isParentOrStaff ? "Select child's grade" : 'What grade are you in?'}</Text>
            <Text style={[sharedStyles.pageSubtitle, { marginBottom: 24 }]}>
              We'll tailor resources to fit {isParentOrStaff ? "the child's needs." : 'where you are.'}
            </Text>

            <View style={styles.grid}>
              {grades.map((grade, index) => (
                <GradeCell
                  key={grade.value}
                  grade={grade}
                  isSelected={selectedGrade === grade.value}
                  onPress={() => setSelectedGrade(grade.value)}
                  index={index}
                />
              ))}
            </View>

            {isWebDesktop && (
              <View style={{ maxWidth: 400, width: '100%', alignSelf: 'center', marginTop: 32, gap: 4 }}>
                <PrimaryButton
                  title="Continue"
                  onPress={handleContinue}
                  disabled={!selectedGrade}
                />
                <Pressable style={sharedStyles.skipButton} onPress={handleSkip}>
                  <Text style={sharedStyles.skipText}>Skip for now</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>

        {!isWebDesktop && (
        <View style={sharedStyles.buttonContainer}>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedGrade}
          />
          <Pressable style={sharedStyles.skipButton} onPress={handleSkip}>
            <Text style={sharedStyles.skipText}>Skip for now</Text>
          </Pressable>
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
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  gridCellWrapper: {
    width: '46%',
  },
  gridCell: {
    backgroundColor: c.white,
    borderRadius: RADII.card,
    borderWidth: BORDERS.card,
    borderColor: c.borderCard,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  gridCellLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: c.textDark,
    textAlign: 'center',
    marginTop: 10,
  },

});
