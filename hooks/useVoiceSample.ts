import { useState, useEffect, useCallback, useRef } from 'react';
import { useEventListener } from 'expo';
import { useAudioPlayer, type AudioStatus } from 'expo-audio';
import { useTranslation } from 'react-i18next';
import { generateSpeech, VOICE_META } from '../services/elevenLabs';

/**
 * Plays a short "Hi, I'm …" sample for a guide in the voice pickers. Tapping the
 * playing guide again stops it; tapping another switches. Stops when unmounted.
 *
 * Usage:
 *   const sample = useVoiceSample();
 *   <Pressable onPress={() => sample.toggle(voiceId)}>
 */
export function useVoiceSample() {
  const { t } = useTranslation();
  const player = useAudioPlayer();
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // The latest requested guide, so a slow sample for a guide tapped earlier is dropped.
  const requested = useRef<string | null>(null);

  // expo-audio's AudioPlayer typing doesn't satisfy useEventListener's EventEmitter param
  // under this TS version, though it is one at runtime (see usePageReader).
  useEventListener(player as any, 'playbackStatusUpdate', (s: AudioStatus) => {
    if (s.didJustFinish) setPlayingVoiceId(null);
  });

  useEffect(() => () => { try { player.pause(); } catch {} }, [player]);

  const toggle = useCallback(async (voiceId: string) => {
    player.pause();
    if (playingVoiceId === voiceId) { requested.current = null; setPlayingVoiceId(null); setIsLoading(false); return; }
    requested.current = voiceId;
    setPlayingVoiceId(voiceId);
    setIsLoading(true);
    try {
      const uri = await generateSpeech(t('auth.voice.sampleIntro', { name: VOICE_META[voiceId]?.name ?? '' }), voiceId);
      if (requested.current !== voiceId) return;
      if (uri) { player.replace(uri); player.play(); }
      else setPlayingVoiceId(null);
    } catch (e) {
      console.error('Error playing sample', e);
      if (requested.current === voiceId) setPlayingVoiceId(null);
    } finally {
      if (requested.current === voiceId) setIsLoading(false);
    }
  }, [player, playingVoiceId, t]);

  return { playingVoiceId, isLoading, toggle };
}

export type VoiceSample = ReturnType<typeof useVoiceSample>;
