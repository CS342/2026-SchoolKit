import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../../contexts/OnboardingContext';

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
  { value: '9', label: '9th Grade (Freshman)', icon: 'leaf-outline', color: '#66D9A6' },
  { value: '10', label: '10th Grade (Sophomore)', icon: 'flash-outline', color: '#0EA5E9' },
  { value: '11', label: '11th Grade (Junior)', icon: 'ribbon-outline', color: '#7B68EE' },
  { value: '12', label: '12th Grade (Senior)', icon: 'trophy-outline', color: '#F59E0B' },
  { value: 'college', label: 'College / University', icon: 'school-outline', color: '#EC4899' },
];

interface GradeCardProps {
  grade: GradeOption;
  isSelected: boolean;
  onPress: () => void;
}

function GradeCard({ grade, isSelected, onPress }: GradeCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <Animated.View
        style={[
          styles.gradeCard,
          isSelected && {
            borderColor: grade.color,
            borderLeftWidth: 6,
            backgroundColor: grade.color + '0D',
          },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: grade.color + '20' }]}>
          <Ionicons name={grade.icon} size={24} color={grade.color} />
        </View>
        <Text style={[styles.gradeText, isSelected && styles.gradeTextSelected]}>
          {grade.label}
        </Text>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: grade.color }]}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function Step2bScreen() {
  const router = useRouter();
  const { data, updateGradeLevel } = useOnboarding();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(data.gradeLevel || null);

  const grades = data.role === 'student-k8' ? K8_GRADES : HS_GRADES;

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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2D2D44" />
        </TouchableOpacity>
        <Text style={styles.stepText}>Step 3 of 5</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
          </View>

          <Text style={styles.title}>What grade are you in?</Text>
          <Text style={styles.subtitle}>
            We'll tailor resources to fit where you are.
          </Text>

          <View style={styles.gradesContainer}>
            {grades.map((grade) => (
              <GradeCard
                key={grade.value}
                grade={grade}
                isSelected={selectedGrade === grade.value}
                onPress={() => setSelectedGrade(grade.value)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !selectedGrade && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedGrade}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, !selectedGrade && styles.buttonTextDisabled]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  stepText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7B68EE',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 48,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8E8F0',
  },
  progressDotActive: {
    backgroundColor: '#7B68EE',
    width: 32,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#2D2D44',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8EA8',
    textAlign: 'center',
    marginBottom: 28,
  },
  gradesContainer: {
    gap: 10,
  },
  gradeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#E8E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  gradeText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#2D2D44',
  },
  gradeTextSelected: {
    fontWeight: '700',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#7B68EE',
  },
  button: {
    backgroundColor: '#7B68EE',
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#D8D8E8',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  buttonTextDisabled: {
    color: '#A8A8B8',
  },
});
