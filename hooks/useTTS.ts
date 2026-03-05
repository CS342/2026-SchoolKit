import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { generateSpeech } from '../services/elevenLabs';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useAccomplishments } from '../contexts/AccomplishmentContext';

/**
 * Reusable TTS hook. Handles audio generation, playback, pause/resume, and cleanup.
 *
 * Usage:
 *   const { isSpeaking, isLoading, speak } = useTTS();
 *   <Pressable onPress={() => speak("Hello world")}>
 */
export function useTTS() {
  const { selectedVoice } = useOnboarding();
  const { fireEvent } = useAccomplishments();
  const player = useAudioPlayer();
  const playerStatus = useAudioPlayerStatus(player);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentTextRef = useRef<string | null>(null);
  const currentVoiceRef = useRef<string | null>(null);

  useEffect(() => {
    if (playerStatus.isLoaded && playerStatus.didJustFinish) {
      setIsSpeaking(false);
      player.seekTo(0);
    }
  }, [playerStatus.isLoaded, playerStatus.didJustFinish, player]);

  const stop = useCallback(() => {
    player.pause();
    currentTextRef.current = null;
    currentVoiceRef.current = null;
    setIsSpeaking(false);
  }, [player]);

  const speak = useCallback(
    async (text: string) => {
      if (isSpeaking && currentTextRef.current === text) {
        player.pause();
        setIsSpeaking(false);
        return;
      }

      if (!isSpeaking && currentTextRef.current === text && currentVoiceRef.current === selectedVoice) {
        player.play();
        setIsSpeaking(true);
        return;
      }

      setIsSpeaking(true);

      try {
        setIsLoading(true);
        let audioUri = null;
        try {
          audioUri = await generateSpeech(text, selectedVoice);
        } catch (e) {
          console.warn("Speech generation skipped:", e);
        }

        if (audioUri) {
          player.replace(audioUri);
          player.play();

          currentTextRef.current = text;
          fireEvent('tts_played');
          currentVoiceRef.current = selectedVoice;
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
    [isSpeaking, selectedVoice, player],
  );

  return { isSpeaking, isLoading, speak, stop };
}
