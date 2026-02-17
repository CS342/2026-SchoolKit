import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../contexts/OnboardingContext';
import { SelectableCard } from '../components/onboarding/SelectableCard';
import { COLORS, SPACING, ANIMATION, APP_STYLES } from '../constants/onboarding-theme';

const MIDDLE_SCHOOL_GRADES = [
  { value: '6', label: '6th Grade' },
  { value: '7', label: '7th Grade' },
  { value: '8', label: '8th Grade' },
];

const HS_GRADES = [
  { value: '9', label: '9th Grade (Freshman)' },
  { value: '10', label: '10th Grade (Sophomore)' },
  { value: '11', label: '11th Grade (Junior)' },
  { value: '12', label: '12th Grade (Senior)' },
  { value: 'college', label: 'College / University' },
];

const PARENT_GRADES = [
  { value: 'pre-k', label: 'Pre-K' },
  { value: 'elementary', label: 'Elementary School (K-5)' },
  { value: 'middle-school', label: 'Middle School (6-8)' },
  { value: 'high-school', label: 'High School (9-12)' },
  { value: 'high-school-up', label: 'High School and up' },
];

function AnimatedCardWrapper({ children, index }: { children: React.ReactNode; index: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const delay = 200 + index * ANIMATION.staggerDelay;
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    translateY.value = withDelay(delay, withSpring(0, ANIMATION.springSmooth));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

export default function EditGradeLevelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, updateGradeLevel } = useOnboarding();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(data.gradeLevel || null);

  const grades = (data.role === 'parent' || data.role === 'staff') ? PARENT_GRADES : data.role === 'student-k8' ? MIDDLE_SCHOOL_GRADES : HS_GRADES;

  const handleSave = () => {
    updateGradeLevel(selectedGrade || '');
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={[APP_STYLES.editHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={APP_STYLES.editBackButton} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={APP_STYLES.editHeaderTitle}>Edit Grade Level</Text>
        <TouchableOpacity onPress={handleSave} style={APP_STYLES.editSaveButton}>
          <Text style={APP_STYLES.editSaveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={APP_STYLES.editScrollContent}>
        <Text style={styles.subtitle}>{(data.role === 'parent' || data.role === 'staff') ? "Select child's grade" : 'Select your grade level'}</Text>

        <View style={styles.cardsContainer}>
          {grades.map((grade, index) => (
            <AnimatedCardWrapper key={grade.value} index={index}>
              <SelectableCard
                title={grade.label}
                selected={selectedGrade === grade.value}
                onPress={() => setSelectedGrade(grade.value)}
                multiSelect={false}
              />
            </AnimatedCardWrapper>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: SPACING.screenPadding,
  },
  cardsContainer: {
    gap: 0,
  },
});
