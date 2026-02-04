import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding, SchoolStatus } from '../../contexts/OnboardingContext';

const SCHOOL_STATUS_OPTIONS: {
  value: SchoolStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { value: 'current-treatment', label: 'Currently in school', icon: 'school-outline', color: '#7B68EE' },
  { value: 'returning-after-treatment', label: 'Taking a break from school', icon: 'home-outline', color: '#0EA5E9' },
  { value: 'supporting-student', label: 'Planning to return to school soon', icon: 'arrow-forward-circle-outline', color: '#66D9A6' },
  { value: 'special-needs', label: 'Home Hospital Education', icon: 'laptop-outline', color: '#EC4899' },
];

interface OptionCardProps {
  option: { value: SchoolStatus; label: string; icon: keyof typeof Ionicons.glyphMap; color: string };
  isSelected: boolean;
  onPress: () => void;
}

function OptionCard({ option, isSelected, onPress }: OptionCardProps) {
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
          styles.optionCard,
          isSelected && {
            borderColor: option.color,
            borderLeftWidth: 6,
            backgroundColor: option.color + '0D',
          },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
          <Ionicons name={option.icon} size={28} color={option.color} />
        </View>
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
          {option.label}
        </Text>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: option.color }]}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function Step3Screen() {
  const router = useRouter();
  const { data, updateSchoolStatuses } = useOnboarding();
  const [selectedStatuses, setSelectedStatuses] = useState<SchoolStatus[]>([]);

  const isStudent = data.role === 'student-k8' || data.role === 'student-hs';
  const isSchoolStaff = data.role === 'staff';
  const title = isStudent ? 'Your school journey' : isSchoolStaff ? "Your student's school journey" : "Your child's school journey";
  const stepText = isStudent ? 'Step 4 of 5' : 'Step 3 of 4';

  const toggleStatus = (status: SchoolStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleContinue = () => {
    updateSchoolStatuses(selectedStatuses);
    router.push('/onboarding/step4');
  };

  const handleSkip = () => {
    updateSchoolStatuses([]);
    router.push('/onboarding/step4');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2D2D44" />
        </TouchableOpacity>
        <Text style={styles.stepText}>{stepText}</Text>
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
            <View style={[styles.progressDot, isStudent && styles.progressDotActive]} />
            {isStudent && <View style={styles.progressDot} />}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            Every path is valid - we're here to support yours.
          </Text>
          <Text style={styles.selectHint}>
            Select all that apply
          </Text>

          <View style={styles.options}>
            {SCHOOL_STATUS_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                option={option}
                isSelected={selectedStatuses.includes(option.value)}
                onPress={() => toggleStatus(option.value)}
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
          style={[styles.button, selectedStatuses.length === 0 && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={selectedStatuses.length === 0}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.buttonText,
              selectedStatuses.length === 0 && styles.buttonTextDisabled,
            ]}
          >
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
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
    marginBottom: 8,
    lineHeight: 22,
  },
  selectHint: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B68EE',
    textAlign: 'center',
    marginBottom: 28,
  },
  options: {
    gap: 14,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E8E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionText: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    color: '#2D2D44',
    lineHeight: 28,
  },
  optionTextSelected: {
    fontWeight: '700',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
