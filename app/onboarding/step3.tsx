import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding, SchoolStatus } from '../../contexts/OnboardingContext';

const SCHOOL_STATUS_OPTIONS: { value: SchoolStatus; label: string; color: string }[] = [
  { value: 'current-treatment', label: 'Currently in school', color: '#7B68EE' },
  { value: 'returning-after-treatment', label: 'Taking a break from school', color: '#7B68EE' },
  { value: 'supporting-student', label: 'Planning to return to school soon', color: '#7B68EE' },
  { value: 'special-needs', label: 'Home/hospital school', color: '#7B68EE' },
];

interface OptionCardProps {
  option: { value: SchoolStatus; label: string; color: string };
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
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
          {option.label}
        </Text>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: option.color }]}>
            <Ionicons name="checkmark" size={22} color="#FFFFFF" />
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
  const title = isStudent ? 'Your school journey' : "Your child's school journey";

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
        <Text style={styles.stepText}>Step 3 of 4</Text>
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
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>
            School can look different during treatment - all of these are okay.
          </Text>
          <Text style={styles.subtitle}>
            Select all that apply{'\n'}(you can update this easily as things change!)
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
    marginBottom: 40,
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
    marginBottom: 14,
    textAlign: 'center',
    lineHeight: 46,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8EA8',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8EA8',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  options: {
    gap: 14,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 3,
    borderColor: '#E8E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  optionText: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    color: '#2D2D44',
    lineHeight: 26,
  },
  optionTextSelected: {
    color: '#2D2D44',
  },
  checkmark: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
