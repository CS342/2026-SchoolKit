import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { generateSpeech } from '../services/elevenLabs';
import { useOnboarding } from '../contexts/OnboardingContext';

/**
 * Reusable TTS hook. Handles audio generation, playback, pause/resume, and cleanup.
 *
 * Usage:
 *   const { isSpeaking, isLoading, speak } = useTTS();
 *   <Pressable onPress={() => speak("Hello world")}>
 */
export function useTTS() {
  const { selectedVoice } = useOnboarding();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Track the text and voice used to generate the current cached sound
  const currentTextRef = useRef<string | null>(null);
  const currentVoiceRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      currentTextRef.current = null;
      currentVoiceRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      // If already speaking the same text, pause
      if (isSpeaking && currentTextRef.current === text) {
        if (soundRef.current) await soundRef.current.pauseAsync();
        setIsSpeaking(false);
        return;
      }

      // If paused on the same text with the same voice, resume
      if (!isSpeaking && soundRef.current && currentTextRef.current === text && currentVoiceRef.current === selectedVoice) {
        await soundRef.current.playAsync();
        setIsSpeaking(true);
        return;
      }

      // New text or different text — stop old, generate new
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setIsSpeaking(true);

      try {
        setIsLoading(true);
        const audioUri = await generateSpeech(text, selectedVoice);

        if (audioUri) {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true },
          );
          soundRef.current = newSound;
          currentTextRef.current = text;
          currentVoiceRef.current = selectedVoice;

          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsSpeaking(false);
              newSound.setPositionAsync(0);
            }
          });
        } else {
          setIsSpeaking(false);
        }
      } catch (error) {
        console.error('TTS playback error:', error);
        setIsSpeaking(false);
      } finally {
        setIsLoading(false);
      }
    },
    [isSpeaking, selectedVoice],
  );

  return { isSpeaking, isLoading, speak, stop };
}
