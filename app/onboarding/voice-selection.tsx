
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
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAccomplishments } from '../../contexts/AccomplishmentContext';
import { DecorativeBackground } from '../../components/onboarding/DecorativeBackground';
import { AuthWebWrapper, getOnboardingStep } from '../../components/AuthWebWrapper';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';

import { VOICE_META, generateSpeech, VoiceData } from '../../services/elevenLabs';
import { useResponsive } from '../../hooks/useResponsive';
import { RADII, ANIMATION } from '../../constants/onboarding-theme';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../constants/theme';

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
  const { updateVoice, selectedVoice: initialVoice, data, completeOnboarding, preferredLanguage } = useOnboarding();
  const { isWeb, isMobile } = useResponsive();
  const { colors, gradients, shadows, sharedStyles } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isWebDesktop = isWeb && !isMobile;
  const { fireEvent } = useAccomplishments();
  const isSpanish = preferredLanguage === 'spanish';
  const defaultVoice = isSpanish ? VOICE_META['LlsiGQPTj7Tt7gsEPZl0']?.id : '21m00Tcm4TlvDq8ikWAM';
  const [selectedVoice, setSelectedVoice] = useState<string>(initialVoice || defaultVoice);

  // Audio playback state for samples
  const player = useAudioPlayer();
  const playerStatus = useAudioPlayerStatus(player);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isSampleLoading, setIsSampleLoading] = useState(false);

  const isStudent = data.role === 'student-k8' || data.role === 'student-hs';
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
      const text = isSpanish
        ? `Hola, soy ${name}. Estoy emocionado de acompañarte en este camino.`
        : `Hi, I'm ${name}. I'm excited to help you on your journey.`;
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

  // Group voices by accent, filtered by preferred language
  const voicesByAccent = useMemo(() => {
    const groups: Record<string, VoiceData[]> = {};
    Object.values(VOICE_META).forEach((voice) => {
      const isSpanishVoice = voice.accent === 'Spanish';
      if (isSpanish && !isSpanishVoice) return;
      if (!isSpanish && isSpanishVoice) return;
      const accent = voice.accent || 'Other';
      if (!groups[accent]) groups[accent] = [];
      groups[accent].push(voice);
    });
    return groups;
  }, [isSpanish]);

  const accentOrder = isSpanish ? ['Spanish'] : ['American', 'British', 'Australian'];

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
            <View style={[sharedStyles.pageIconCircle, isWebDesktop && { width: 96, height: 96, borderRadius: 48 }]}>
              <Ionicons name="mic-outline" size={isWebDesktop ? 56 : 48} color={colors.primary} />
            </View>

            <Text style={sharedStyles.pageTitle}>Choose your guide</Text>
            <Text style={[sharedStyles.pageSubtitle, { marginBottom: 24 }]}>
              Select a voice you'd like to hear. You can change this later.
            </Text>

            {(() => {
              let globalIndex = 0;
              return accentOrder.map((accent) => {
              const voices = voicesByAccent[accent];
              if (!voices || voices.length === 0) return null;
              return (
                <View key={accent} style={styles.section}>
                  <Text style={styles.accentLabel}>{accent}</Text>
                  <View style={[styles.voiceList, isWebDesktop && { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }]}>
                    {voices.map((voice) => {
                      const isSelected = selectedVoice === voice.id;
                      const isPlaying = playingVoiceId === voice.id;
                      const cardIndex = globalIndex++;

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
                          >
                            {voice.image ? (
                              <Image source={voice.image} style={styles.voiceAvatar} contentFit="cover" />
                            ) : (
                              <View style={[styles.voiceAvatarPlaceholder, { backgroundColor: voice.color }]}>
                                <Text style={styles.voiceInitial}>{voice.initial}</Text>
                              </View>
                            )}

                            <View style={styles.voiceInfo}>
                              <Text style={[styles.voiceName, isSelected && { color: colors.primary }]}>{voice.name}</Text>
                              <Text style={styles.voiceDesc}>{voice.description}</Text>
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
                </View>
              );
            });
            })()}

            {isWebDesktop && (
              <View style={{ maxWidth: 400, width: '100%', alignSelf: 'center', marginTop: 32, gap: 4 }}>
                <PrimaryButton
                  title="Continue"
                  onPress={handleContinue}
                />
                <Pressable style={sharedStyles.skipButton} onPress={handleSkip}>
                  <Text style={sharedStyles.skipText}>Skip for now</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>

        {!isWebDesktop && (
        <View style={sharedStyles.buttonContainer}>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
          />
          <Pressable style={sharedStyles.skipButton} onPress={handleSkip}>
            <Text style={sharedStyles.skipText}>Skip for now</Text>
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
  section: {
    width: '100%',
    marginBottom: 24,
  },
  accentLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: c.textLight,
    marginBottom: 12,
    marginLeft: 4,
  },
  voiceList: {
    gap: 12,
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
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

});
