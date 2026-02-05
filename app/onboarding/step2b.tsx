import React, { useState, useEffect } from 'react';
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
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { GRADIENTS, SHADOWS, ANIMATION, COLORS, RADII, BORDERS, SHARED_STYLES } from '../../constants/onboarding-theme';

interface GradeOption {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const K8_GRADES: GradeOption[] = [
  { value: 'K', label: 'Kindergarten', icon: 'flower-outline', color: '#EC4899' },
  { value: '1', label: '1st Grade', icon: 'star-outline', color: '#7B68EE' },
  { value: '2', label: '2nd Grade', icon: 'star-outline', color: '#0EA5E9' },
  { value: '3', label: '3rd Grade', icon: 'rocket-outline', color: '#66D9A6' },
  { value: '4', label: '4th Grade', icon: 'rocket-outline', color: '#F59E0B' },
  { value: '5', label: '5th Grade', icon: 'planet-outline', color: '#7B68EE' },
  { value: '6', label: '6th Grade', icon: 'planet-outline', color: '#EC4899' },
  { value: '7', label: '7th Grade', icon: 'compass-outline', color: '#0EA5E9' },
  { value: '8', label: '8th Grade', icon: 'compass-outline', color: '#66D9A6' },
];

const HS_GRADES: GradeOption[] = [
  { value: '9', label: '9th Grade\n(Freshman)', icon: 'leaf-outline', color: '#66D9A6' },
  { value: '10', label: '10th Grade\n(Sophomore)', icon: 'flash-outline', color: '#0EA5E9' },
  { value: '11', label: '11th Grade\n(Junior)', icon: 'ribbon-outline', color: '#7B68EE' },
  { value: '12', label: '12th Grade\n(Senior)', icon: 'trophy-outline', color: '#F59E0B' },
  { value: 'college', label: 'College /\nUniversity', icon: 'school-outline', color: '#EC4899' },
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
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 300 }));
  }, []);

  const cellStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.93, { duration: 80 }),
      withSpring(1, ANIMATION.springBouncy)
    );
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={styles.gridCellWrapper}>
      <Animated.View
        style={[
          styles.gridCell,
          isSelected && {
            borderColor: grade.color,
            backgroundColor: grade.color + '10',
            ...SHADOWS.cardSelected,
          },
          !isSelected && SHADOWS.card,
          cellStyle,
        ]}
      >
        <Ionicons name={grade.icon} size={22} color={grade.color} />
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
  const [selectedGrade, setSelectedGrade] = useState<string | null>(data.gradeLevel || null);

  const isK8 = data.role === 'student-k8';
  const grades = isK8 ? K8_GRADES : HS_GRADES;

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
    <DecorativeBackground variant="step" gradientColors={GRADIENTS.screenBackground}>
      <View style={styles.container}>
        <OnboardingHeader currentStep={3} totalSteps={5} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={SHARED_STYLES.pageIconCircle}>
              <Ionicons name="ribbon-outline" size={48} color={COLORS.primary} />
            </View>

            <Text style={SHARED_STYLES.pageTitle}>What grade are you in?</Text>
            <Text style={[SHARED_STYLES.pageSubtitle, { marginBottom: 24 }]}>
              We'll tailor resources to fit where you are.
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
          </View>
        </ScrollView>

        <View style={SHARED_STYLES.buttonContainer}>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedGrade}
          />
          <Pressable style={SHARED_STYLES.skipButton} onPress={handleSkip}>
            <Text style={SHARED_STYLES.skipText}>Skip for now</Text>
          </Pressable>
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
    width: '30%',
  },
  gridCell: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.grid,
    borderWidth: BORDERS.card,
    borderColor: COLORS.borderCard,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  gridCellLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
    marginTop: 6,
  },
  gridCellLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
    marginTop: 6,
  },
});
