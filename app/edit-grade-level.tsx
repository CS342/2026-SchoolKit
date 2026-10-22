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
import { ContentColumn } from '../components/ui';
import { SPACING, ANIMATION } from '../constants/onboarding-theme';
import { useTheme } from '../contexts/ThemeContext';

const ELEMENTARY_GRADES = [
  { value: 'pre-k', label: 'Pre-K/kindergarten' },
  { value: '1', label: '1st grade' },
  { value: '2', label: '2nd grade' },
  { value: '3', label: '3rd grade' },
  { value: '4', label: '4th grade' },
  { value: '5', label: '5th grade' },
];

const MIDDLE_SCHOOL_GRADES = [
  { value: '6', label: '6th grade' },
  { value: '7', label: '7th grade' },
  { value: '8', label: '8th grade' },
];

const HS_GRADES = [
  { value: '9', label: '9th grade (freshman)' },
  { value: '10', label: '10th grade (sophomore)' },
  { value: '11', label: '11th grade (junior)' },
  { value: '12', label: '12th grade (senior)' },
  { value: 'college', label: 'College / university' },
];

const PARENT_GRADES = [
  { value: 'pre-k', label: 'Pre-K/kindergarten' },
  { value: 'elementary', label: 'Elementary school (1-5)' },
  { value: 'middle-school', label: 'Middle school (6-8)' },
  { value: 'high-school', label: 'High school (9-12)' },
  { value: 'high-school-up', label: 'Beyond high school' },
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
  const { colors, appStyles } = useTheme();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(data.gradeLevel || null);

  const grades = (data.role === 'parent' || data.role === 'staff') ? PARENT_GRADES : data.role === 'student-elementary' ? ELEMENTARY_GRADES : data.role === 'student-k8' ? MIDDLE_SCHOOL_GRADES : HS_GRADES;

  const handleSave = () => {
    updateGradeLevel(selectedGrade || '');
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={appStyles.editBackButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={appStyles.editHeaderTitle}>Edit Grade Level</Text>
        <TouchableOpacity onPress={handleSave} style={appStyles.editSaveButton} accessibilityRole="button" accessibilityLabel="Save">
          <Text style={appStyles.editSaveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={appStyles.editScrollContent}>
        <ContentColumn width="reading">
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{(data.role === 'parent' || data.role === 'staff') ? "Select child's grade" : 'Select your grade level'}</Text>

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
        </ContentColumn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.screenPadding,
  },
  cardsContainer: {
    gap: 0,
  },
});
