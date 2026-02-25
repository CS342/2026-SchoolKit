
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { DecorativeBackground } from '../../components/onboarding/DecorativeBackground';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';

import { VOICE_META, generateSpeech, VoiceData } from '../../services/elevenLabs';
import { GRADIENTS, COLORS, RADII, SHARED_STYLES, SHADOWS } from '../../constants/onboarding-theme';

export default function VoiceSelectionScreen() {
  const router = useRouter();
  const { updateVoice, selectedVoice: initialVoice, data, completeOnboarding } = useOnboarding();
  const [selectedVoice, setSelectedVoice] = useState<string>(initialVoice || '21m00Tcm4TlvDq8ikWAM'); // Default to Rachel if none
  
  // Audio playback state for samples
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isSampleLoading, setIsSampleLoading] = useState(false);

  const isStudent = data.role && (data.role === 'student-k8' || data.role === 'student-hs');

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handlePlaySample = async (voiceId: string, name: string) => {
    try {
      if (playingVoiceId === voiceId) {
        // Stop if currently playing this voice
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
          setPlayingVoiceId(null);
        }
        return;
      }

      // Stop previous
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setPlayingVoiceId(null);
      }

      setIsSampleLoading(true);
      setPlayingVoiceId(voiceId);

      // Intro text for the sample
      const text = `Hi, I'm ${name}. I'm excited to help you on your journey.`;
      const uri = await generateSpeech(text, voiceId);

      if (uri) {
        const { sound: newSound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true }
        );
        setSound(newSound);
        newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                setPlayingVoiceId(null);
            }
        });
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

  // Group voices by accent
  const voicesByAccent = useMemo(() => {
    const groups: Record<string, VoiceData[]> = {};
    Object.values(VOICE_META).forEach((voice) => {
      const accent = voice.accent || 'Other';
      if (!groups[accent]) groups[accent] = [];
      groups[accent].push(voice);
    });
    return groups;
  }, []);

  const accentOrder = ['American', 'British', 'Australian'];

  return (
    <DecorativeBackground variant="step" gradientColors={GRADIENTS.screenBackground}>
      <View style={styles.container}>
        <OnboardingHeader 
          currentStep={isStudent ? 6 : 5} 
          totalSteps={isStudent ? 6 : 5} 
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={SHARED_STYLES.pageIconCircle}>
              <Ionicons name="mic-outline" size={48} color={COLORS.primary} />
            </View>

            <Text style={SHARED_STYLES.pageTitle}>Choose your guide</Text>
            <Text style={[SHARED_STYLES.pageSubtitle, { marginBottom: 24 }]}>
              Select a voice you'd like to hear. You can change this later.
            </Text>

            {accentOrder.map((accent) => {
              const voices = voicesByAccent[accent];
              if (!voices || voices.length === 0) return null;
              return (
                <View key={accent} style={styles.section}>
                  <Text style={styles.accentLabel}>{accent}</Text>
                  <View style={styles.voiceList}>
                    {voices.map((voice) => {
                      const isSelected = selectedVoice === voice.id;
                      const isPlaying = playingVoiceId === voice.id;

                      return (
                        <Pressable
                            key={voice.id}
                            style={[
                                styles.voiceCard,
                                isSelected && styles.voiceCardSelected,
                                !isSelected && SHADOWS.card,
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
                                <Text style={[styles.voiceName, isSelected && { color: COLORS.primary }]}>{voice.name}</Text>
                                <Text style={styles.voiceDesc}>{voice.description}</Text>
                            </View>

                            <Pressable
                                style={[
                                    styles.playButton,
                                    isPlaying ? { backgroundColor: COLORS.primary } : { backgroundColor: COLORS.backgroundLight }
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
                                        color={isPlaying ? '#FFFFFF' : COLORS.primary}
                                    />
                                )}
                            </Pressable>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={SHARED_STYLES.buttonContainer}>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
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
    color: COLORS.textLight,
    marginBottom: 12,
    marginLeft: 4,
  },
  voiceList: {
    gap: 12,
  },
  voiceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: RADII.card,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voiceCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundLight,
    ...SHADOWS.cardSelected,
  },
  voiceAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: COLORS.backgroundLight,
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
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 2,
  },
  voiceDesc: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

});
