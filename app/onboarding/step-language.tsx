import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { DecorativeBackground } from '../../components/onboarding/DecorativeBackground';
import { AuthWebWrapper } from '../../components/AuthWebWrapper';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { useResponsive } from '../../hooks/useResponsive';
import { GRADIENTS, COLORS, RADII, SHADOWS, SHARED_STYLES } from '../../constants/onboarding-theme';

const LANGUAGES = [
  { id: 'english' as const, label: 'English', flag: '🇺🇸', subtitle: 'Continue in English' },
  { id: 'spanish' as const, label: 'Español', flag: '🇪🇸', subtitle: 'Continuar en español' },
];

export default function StepLanguageScreen() {
  const router = useRouter();
  const { updatePreferredLanguage, preferredLanguage } = useOnboarding();
  const { isWeb, isMobile } = useResponsive();
  const isWebDesktop = isWeb && !isMobile;

  const [selected, setSelected] = useState<'english' | 'spanish'>(preferredLanguage || 'english');

  const handleContinue = async () => {
    await updatePreferredLanguage(selected);
    router.push('/onboarding/step2');
  };

  return (
    <DecorativeBackground variant="step" gradientColors={GRADIENTS.screenBackground}>
      <AuthWebWrapper variant="onboarding" step={{ current: 2, total: 6, label: 'Language' }}>
        <View style={styles.container}>
          <OnboardingHeader currentStep={2} totalSteps={6} />

          <View style={[styles.content, isWebDesktop && { maxWidth: 800, width: '100%', alignSelf: 'center', paddingTop: 48, alignItems: 'center' }]}>
            <View style={SHARED_STYLES.pageIconCircle}>
              <Text style={styles.globeEmoji}>🌐</Text>
            </View>

            <Text style={SHARED_STYLES.pageTitle}>Preferred language</Text>
            <Text style={[SHARED_STYLES.pageSubtitle, { marginBottom: 32 }]}>
              Choose the language you'd like to use the app in.
            </Text>

            <View style={[styles.optionList, isWebDesktop && { maxWidth: 480, width: '100%' }]}>
              {LANGUAGES.map((lang) => {
                const isSelected = selected === lang.id;
                return (
                  <Pressable
                    key={lang.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected, !isSelected && SHADOWS.card]}
                    onPress={() => setSelected(lang.id)}
                  >
                    <Text style={styles.flag}>{lang.flag}</Text>
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, isSelected && { color: COLORS.primary }]}>{lang.label}</Text>
                      <Text style={styles.optionSubtitle}>{lang.subtitle}</Text>
                    </View>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {isWebDesktop && (
              <View style={{ maxWidth: 400, width: '100%', alignSelf: 'center', marginTop: 32 }}>
                <PrimaryButton title="Continue" onPress={handleContinue} />
              </View>
            )}
          </View>

          {!isWebDesktop && (
            <View style={SHARED_STYLES.buttonContainer}>
              <PrimaryButton title="Continue" onPress={handleContinue} />
              <View style={SHARED_STYLES.skipPlaceholder} />
            </View>
          )}
        </View>
      </AuthWebWrapper>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
  },
  globeEmoji: {
    fontSize: 44,
  },
  optionList: {
    width: '100%',
    gap: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: RADII.card,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundLight,
    ...SHADOWS.cardSelected,
  },
  flag: {
    fontSize: 36,
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
});
