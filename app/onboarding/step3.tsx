import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding, SchoolStatus } from '../../contexts/OnboardingContext';
import { DecorativeBackground } from '../../components/onboarding/DecorativeBackground';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { SelectableCard } from '../../components/onboarding/SelectableCard';
import { GRADIENTS } from '../../constants/onboarding-theme';

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

export default function Step3Screen() {
  const router = useRouter();
  const { data, updateSchoolStatuses } = useOnboarding();
  const [selectedStatuses, setSelectedStatuses] = useState<SchoolStatus[]>([]);

  const isStudent = data.role === 'student-k8' || data.role === 'student-hs';
  const isSchoolStaff = data.role === 'staff';
  const title = isStudent ? 'Your school journey' : isSchoolStaff ? "Your student's school journey" : "Your child's school journey";

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
    <DecorativeBackground variant="step" gradientColors={GRADIENTS.screenBackground}>
      <View style={styles.container}>
        <OnboardingHeader
          currentStep={isStudent ? 4 : 3}
          totalSteps={isStudent ? 5 : 4}
          showHelper
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Ionicons name="compass-outline" size={56} color="#7B68EE" />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              Every path is valid - we're here to support yours.
            </Text>

            <View style={styles.selectBadge}>
              <Text style={styles.selectBadgeText}>Select all that apply</Text>
            </View>

            <View style={styles.options}>
              {SCHOOL_STATUS_OPTIONS.map((option) => (
                <SelectableCard
                  key={option.value}
                  title={option.label}
                  selected={selectedStatuses.includes(option.value)}
                  onPress={() => toggleStatus(option.value)}
                  multiSelect
                  color={option.color}
                  icon={option.icon}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={selectedStatuses.length === 0}
          />
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0EBFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2D2D44',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8E8EA8',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  selectBadge: {
    backgroundColor: '#F0EBFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  selectBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7B68EE',
  },
  options: {
    width: '100%',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 4,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#7B68EE',
  },
});
