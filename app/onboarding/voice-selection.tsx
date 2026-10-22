import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { DecorativeBackground } from '../../components/onboarding/DecorativeBackground';
import { AuthWebWrapper, getOnboardingStep } from '../../components/AuthWebWrapper';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { VoicePicker } from '../../components/VoicePicker';
import { VOICE_META, toVoiceLang } from '../../services/elevenLabs';
import { useVoiceSample } from '../../hooks/useVoiceSample';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../constants/theme';
import { isStudentRole } from '../../utils/profile';

export default function VoiceSelectionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { updateVoice, selectedVoice: initialVoice, data, completeOnboarding, preferredLanguage } = useOnboarding();
  const { isWeb, isMobile } = useResponsive();
  const { colors, gradients, sharedStyles } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isWebDesktop = isWeb && !isMobile;
  const lang = toVoiceLang(preferredLanguage);
  // Until the user picks, follow the context's guide — it resolves to one who reads `lang`,
  // and the saved language/voice load asynchronously after this screen mounts.
  const [pickedVoice, setSelectedVoice] = useState<string | null>(null);
  const selectedVoice = pickedVoice ?? initialVoice;
  const selectedMeta = VOICE_META[selectedVoice];
  const sample = useVoiceSample();
  const selectedPlaying = sample.playingVoiceId === selectedVoice;

  const isStudent = isStudentRole(data.role);
  const stepInfo = getOnboardingStep('voice', isStudent);

  const handleContinue = () => {
    updateVoice(selectedVoice);
    completeOnboarding();
    router.replace('/loading');
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/loading');
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
          <View style={[styles.content, isWebDesktop && { maxWidth: 760, width: '100%', alignSelf: 'center', flex: undefined, paddingTop: 48 }]}>
            {/* Plays the selected guide — testers tapped the old decorative mic expecting audio. */}
            <Pressable
              onPress={() => selectedMeta && sample.toggle(selectedMeta.id)}
              accessibilityRole="button"
              accessibilityLabel={t('auth.voice.playSelected', { name: selectedMeta?.name ?? '' })}
              style={[sharedStyles.pageIconCircle, isWebDesktop && { width: 96, height: 96, borderRadius: 48 }]}
            >
              {sample.isLoading && selectedPlaying ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <Ionicons
                  name={selectedPlaying ? 'stop' : 'headset-outline'}
                  size={isWebDesktop ? 56 : 48}
                  color={colors.primary}
                />
              )}
            </Pressable>

            <Text style={sharedStyles.pageTitle}>{t('auth.voice.title')}</Text>
            <Text style={[sharedStyles.pageSubtitle, { marginBottom: 8 }]}>
              {t('auth.voice.subtitle')}
            </Text>
            <Text style={[styles.hint, { marginBottom: 24 }]}>{t('auth.voice.hint')}</Text>

            <View style={styles.picker}>
              <VoicePicker
                lang={lang}
                selectedVoice={selectedVoice}
                onSelect={setSelectedVoice}
                sample={sample}
                columns={isWebDesktop ? 2 : 1}
                animate
              />
            </View>

            {isWebDesktop && (
              <View style={{ maxWidth: 400, width: '100%', alignSelf: 'center', marginTop: 32, gap: 4 }}>
                <PrimaryButton
                  title={t('common.continue')}
                  onPress={handleContinue}
                />
                <Pressable style={sharedStyles.skipButton} onPress={handleSkip}>
                  <Text style={sharedStyles.skipText}>{t('auth.skipForNow')}</Text>
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
          />
          <Pressable style={sharedStyles.skipButton} onPress={handleSkip}>
            <Text style={sharedStyles.skipText}>{t('auth.skipForNow')}</Text>
          </Pressable>
        </View>
        )}
      </View>
      </AuthWebWrapper>
    </DecorativeBackground>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
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
  picker: {
    width: '100%',
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    color: c.textLight,
    textAlign: "center",
  },
});
