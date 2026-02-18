import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding, SchoolStatus } from '../../contexts/OnboardingContext';
import { DecorativeBackground } from '../../components/onboarding/DecorativeBackground';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { SelectableCard } from '../../components/onboarding/SelectableCard';

import { GRADIENTS, COLORS, SHARED_STYLES } from '../../constants/onboarding-theme';

const SCHOOL_STATUS_OPTIONS: {
  value: SchoolStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { value: 'current-treatment', label: 'Currently in school', icon: 'school-outline', color: COLORS.primary },
  { value: 'returning-after-treatment', label: 'Taking a break from school', icon: 'home-outline', color: COLORS.studentK8 },
  { value: 'supporting-student', label: 'Planning to return to school soon', icon: 'arrow-forward-circle-outline', color: COLORS.staff },
  { value: 'special-needs', label: 'Home Hospital Education', icon: 'laptop-outline', color: COLORS.parent },
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
          totalSteps={isStudent ? 6 : 5}
          showHelper
          rightAction={null}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={SHARED_STYLES.pageIconCircle}>
              <Ionicons name="compass-outline" size={48} color={COLORS.primary} />
            </View>

            <Text style={SHARED_STYLES.pageTitle}>{title}</Text>
            <Text style={[SHARED_STYLES.pageSubtitle, styles.subtitleOverride]}>
              Every path is valid - we're here to support yours.
            </Text>

            <View style={[SHARED_STYLES.badge, { paddingHorizontal: 16, marginBottom: 24 }]}>
              <Text style={SHARED_STYLES.badgeText}>Select all that apply</Text>
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

        <View style={SHARED_STYLES.buttonContainer}>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={selectedStatuses.length === 0}
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: 'center',
  },
  subtitleOverride: {
    marginBottom: 12,
    lineHeight: 26,
  },
  options: {
    width: '100%',
  },
});
