
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAccomplishments } from '../../contexts/AccomplishmentContext';
import { DecorativeBackground } from '../../components/onboarding/DecorativeBackground';
import { AuthWebWrapper, getOnboardingStep } from '../../components/AuthWebWrapper';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';

import { VOICE_META, generateSpeech, voicesFor, voiceDescription, toVoiceLang, SHOW_VOICE_AVATARS } from '../../services/elevenLabs';
import { useResponsive } from '../../hooks/useResponsive';
import { RADII, ANIMATION } from '../../constants/onboarding-theme';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../constants/theme';
import { isStudentRole } from '../../utils/profile';

function AnimatedVoiceCard({ children, index }: { children: React.ReactNode; index: number }) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(index * ANIMATION.staggerDelay, withSpring(0, ANIMATION.springBouncy));
    opacity.value = withDelay(index * ANIMATION.staggerDelay, withTiming(1, { duration: 400 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withSpring(1, ANIMATION.springBouncy)
    );
  };

  return (
    <Animated.View style={animatedStyle} onTouchStart={handlePressIn}>
      {children}
    </Animated.View>
  );
}

export default function VoiceSelectionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { updateVoice, selectedVoice: initialVoice, data, completeOnboarding, preferredLanguage } = useOnboarding();
  const { isWeb, isMobile } = useResponsive();
  const { colors, gradients, shadows, sharedStyles } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isWebDesktop = isWeb && !isMobile;
  const { fireEvent } = useAccomplishments();
  const lang = toVoiceLang(preferredLanguage);
  // Until the user picks, follow the context's guide — it resolves to one who reads `lang`,
  // and the saved language/voice load asynchronously after this screen mounts.
  const [pickedVoice, setSelectedVoice] = useState<string | null>(null);
  const selectedVoice = pickedVoice ?? initialVoice;
  const selectedMeta = VOICE_META[selectedVoice];

  // Audio playback state for samples
  const player = useAudioPlayer();
  const playerStatus = useAudioPlayerStatus(player);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isSampleLoading, setIsSampleLoading] = useState(false);

  const isStudent = isStudentRole(data.role);
  const stepInfo = getOnboardingStep('voice', isStudent);

  useEffect(() => {
    if (playerStatus.isLoaded && playerStatus.didJustFinish) {
      setPlayingVoiceId(null);
    }
  }, [playerStatus.isLoaded, playerStatus.didJustFinish]);

  const handlePlaySample = async (voiceId: string, name: string) => {
    try {
      if (playingVoiceId === voiceId) {
        // Stop if currently playing this voice
        player.pause();
        setPlayingVoiceId(null);
        return;
      }

      // Stop previous
      player.pause();
      setPlayingVoiceId(null);

      setIsSampleLoading(true);
      setPlayingVoiceId(voiceId);

      // Intro text for the sample
      const text = t('auth.voice.sampleIntro', { name });
      const uri = await generateSpeech(text, voiceId);

      if (uri) {
        player.replace(uri);
        player.play();
      } else {
        setPlayingVoiceId(null);
      }
    } catch (e) {
      console.error("Error playing sample", e);
      setPlayingVoiceId(null);
    } finally {
      setIsSampleLoading(false);
    }
  };

  const handleContinue = () => {
    updateVoice(selectedVoice);
    completeOnboarding();
    router.replace('/loading');
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/loading');
  };

  // Guides who read the user's language natively (bilingual guides appear in both).
  const voices = useMemo(() => voicesFor(lang), [lang]);

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
          <View style={[styles.content, isWebDesktop && { maxWidth: 800, width: '100%', alignSelf: 'center', flex: undefined, paddingTop: 48 }]}>
            {/* Plays the selected guide — testers tapped the old decorative mic expecting audio. */}
            <Pressable
              onPress={() => selectedMeta && handlePlaySample(selectedMeta.id, selectedMeta.name)}
              accessibilityRole="button"
              accessibilityLabel={t('auth.voice.playSelected', { name: selectedMeta?.name ?? '' })}
              style={[sharedStyles.pageIconCircle, isWebDesktop && { width: 96, height: 96, borderRadius: 48 }]}
            >
              {isSampleLoading && playingVoiceId === selectedVoice ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <Ionicons
                  name={playingVoiceId === selectedVoice ? 'stop' : 'headset-outline'}
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

            <View style={[styles.voiceList, isWebDesktop && { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }]}>
              {voices.map((voice, cardIndex) => {
                const isSelected = selectedVoice === voice.id;
                const isPlaying = playingVoiceId === voice.id;

                return (
                  <View key={voice.id} style={isWebDesktop ? { width: '31%' } : undefined}>
                    <AnimatedVoiceCard index={cardIndex}>
                    <Pressable
                      style={[
                        styles.voiceCard,
                        isSelected && styles.voiceCardSelected,
                        isSelected && shadows.cardSelected,
                        !isSelected && shadows.card,
                      ]}
                      onPress={() => setSelectedVoice(voice.id)}
                      accessibilityRole="radio"
                      accessibilityLabel={`${voice.name}, ${t(`auth.voice.accents.${voice.accent}`)}`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      {SHOW_VOICE_AVATARS && voice.image ? (
                        <Image source={voice.image} style={styles.voiceAvatar} contentFit="cover" />
                      ) : (
                        <View style={[styles.voiceAvatarPlaceholder, { backgroundColor: voice.color }]}>
                          <Text style={styles.voiceInitial}>{voice.initial}</Text>
                        </View>
                      )}

                      <View style={styles.voiceInfo}>
                        <Text style={[styles.voiceName, isSelected && { color: colors.primary }]}>{voice.name}</Text>
                        <Text style={styles.voiceDesc}>{voiceDescription(voice, lang)}</Text>
                        <Text style={styles.voiceAccent}>{t(`auth.voice.accents.${voice.accent}`)}</Text>
                      </View>

                      <Pressable
                        style={[
                          styles.playButton,
                          isPlaying ? { backgroundColor: colors.primary } : { backgroundColor: colors.backgroundLight }
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handlePlaySample(voice.id, voice.name);
                        }}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={isPlaying ? t('auth.voice.stopSample') : t('auth.voice.playSample', { name: voice.name })}
                      >
                        {isSampleLoading && isPlaying ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Ionicons
                            name={isPlaying ? "stop" : "play"}
                            size={16}
                            color={isPlaying ? '#FFFFFF' : colors.primary}
                          />
                        )}
                      </Pressable>
                    </Pressable>
                    </AnimatedVoiceCard>
                  </View>
                );
              })}
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
  voiceList: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  voiceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: RADII.card,
    backgroundColor: c.white,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voiceCardSelected: {
    borderColor: c.primary,
    backgroundColor: c.backgroundLight,
  },
  voiceAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: c.backgroundLight,
  },
  voiceAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: 18,
    fontWeight: "600",
    color: c.textDark,
    marginBottom: 2,
  },
  voiceDesc: {
    fontSize: 13,
    color: c.textLight,
  },
  voiceAccent: {
    fontSize: 12,
    color: c.textLight,
    marginTop: 2,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
    color: c.textLight,
    textAlign: "center",
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

});
