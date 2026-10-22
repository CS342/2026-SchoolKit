import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useOnboarding, SchoolStatus } from '../../contexts/OnboardingContext';
import { DecorativeBackground } from '../../components/onboarding/DecorativeBackground';
import { AuthWebWrapper, getOnboardingStep } from '../../components/AuthWebWrapper';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { SelectableCard } from '../../components/onboarding/SelectableCard';

import { useResponsive } from '../../hooks/useResponsive';
import { COLORS } from '../../constants/onboarding-theme';
import { useTheme } from '../../contexts/ThemeContext';
import { isStudentRole } from '../../utils/profile';

const SCHOOL_STATUS_OPTIONS: {
  value: SchoolStatus;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { value: 'current-treatment', icon: 'school-outline', color: COLORS.primary },
  { value: 'returning-after-treatment', icon: 'home-outline', color: COLORS.studentK8 },
  { value: 'supporting-student', icon: 'arrow-forward-circle-outline', color: COLORS.staff },
  { value: 'special-needs', icon: 'laptop-outline', color: COLORS.parent },
];

export default function Step3Screen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data, updateSchoolStatuses } = useOnboarding();
  const { isWeb, isMobile } = useResponsive();
  const { colors, gradients, sharedStyles } = useTheme();
  const isWebDesktop = isWeb && !isMobile;

  const [selectedStatuses, setSelectedStatuses] = useState<SchoolStatus[]>(data.schoolStatuses ?? []);

  const isStudent = isStudentRole(data.role);
  const isSchoolStaff = data.role === 'staff';
  const title = isStudent ? t('onboarding.journey.titleStudent') : isSchoolStaff ? t('onboarding.journey.titleStaff') : t('onboarding.journey.titleGuardian');
  const stepInfo = getOnboardingStep('journey', isStudent);



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
    <DecorativeBackground variant="step" gradientColors={gradients.screenBackground}>
      <AuthWebWrapper variant="onboarding" step={stepInfo}>
      <View style={styles.container}>
        <OnboardingHeader
          currentStep={stepInfo.current}
          totalSteps={stepInfo.total}
        />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, isWebDesktop && { paddingVertical: 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, isWebDesktop && { maxWidth: 800, width: '100%', alignSelf: 'center', flex: undefined, paddingTop: 48, paddingBottom: 0 }]}>
            <View style={[sharedStyles.pageIconCircle, isWebDesktop && { width: 96, height: 96, borderRadius: 48 }]}>
              <Ionicons name="compass-outline" size={isWebDesktop ? 56 : 48} color={colors.primary} />
            </View>

            <Text style={sharedStyles.pageTitle}>{title}</Text>
            <Text style={[sharedStyles.pageSubtitle, styles.subtitleOverride]}>
              {t('onboarding.journey.subtitle')}
            </Text>

            <View style={[sharedStyles.badge, { paddingHorizontal: 16, marginBottom: 24 }]}>
              <Text style={sharedStyles.badgeText}>{t('onboarding.journey.selectAll')}</Text>
            </View>

            <View style={[styles.options, isWebDesktop && { flexDirection: 'row', flexWrap: 'wrap', gap: 16 }]}>
              {SCHOOL_STATUS_OPTIONS.map((option, index) => (
                <View key={option.value} style={isWebDesktop ? { width: '48%' } : undefined}>
                  <SelectableCard
                    title={t(`onboarding.journey.options.${option.value}`)}
                    selected={selectedStatuses.includes(option.value)}
                    onPress={() => toggleStatus(option.value)}
                    multiSelect
                    color={option.color}
                    icon={option.icon}
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
                  disabled={selectedStatuses.length === 0}
                />
                <Pressable style={sharedStyles.skipButton} onPress={handleSkip}>
                  <Text style={sharedStyles.skipText}>{t('common.skipForNow')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>

        {!isWebDesktop && (
        <View style={sharedStyles.buttonContainer}>
          <PrimaryButton
            title={t('common.continue')}
            onPress={handleContinue}
            disabled={selectedStatuses.length === 0}
          />
          <Pressable style={sharedStyles.skipButton} onPress={handleSkip}>
            <Text style={sharedStyles.skipText}>{t('common.skipForNow')}</Text>
          </Pressable>
        </View>
        )}
      </View>
      </AuthWebWrapper>
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
