import { useState, useEffect, useRef, useCallback } from 'react';
import { useEventListener } from 'expo';
import { useAudioPlayer, useAudioPlayerStatus, type AudioStatus } from 'expo-audio';
import { generateSpeech, type VoiceLang } from '../services/elevenLabs';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useAccomplishments } from '../contexts/AccomplishmentContext';
import type { SpeechSegment } from '../features/content/speech';

const RATES = [1.0, 1.25, 1.5, 2.0];

/**
 * Plays a page's read-aloud segments in order ("Listen"), one TTS clip per segment.
 * The next segment is generated while the current one plays, so playback is gapless
 * after the first clip. Changing the spoken text (e.g. a different doc) stops playback.
 *
 * Usage:
 *   const reader = usePageReader(docSpeechSegments(doc));
 *   <Pressable onPress={reader.toggle}>
 */
export function usePageReader(segments: SpeechSegment[], language?: VoiceLang) {
  const { selectedVoice: appVoice, voiceFor } = useOnboarding();
  // Read the page in its own language: a Spanish reader may be shown an English page.
  const selectedVoice = language ? voiceFor(language) : appVoice;
  const { fireEvent } = useAccomplishments();
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  /** Index of the current segment; null when the reader is closed. */
  const [index, setIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  /** The current segment's audio couldn't be generated (offline, server error). */
  const [error, setError] = useState(false);
  const [rate, setRate] = useState(1.0);

  // Bumped on every play/stop so a slow fetch for a superseded segment is ignored.
  const playToken = useRef(0);
  const clips = useRef(new Map<string, Promise<string | null>>());
  /** Key of the segment loaded into the player; cleared when its finish is handled. */
  const playingKey = useRef<string | null>(null);

  const clip = useCallback(
    (seg: SpeechSegment) => {
      const cacheKey = `${selectedVoice}|${seg.text}`;
      let p = clips.current.get(cacheKey);
      if (!p) {
        p = generateSpeech(seg.text, selectedVoice).catch(() => null);
        p.then((uri) => { if (!uri) clips.current.delete(cacheKey); });
        clips.current.set(cacheKey, p);
      }
      return p;
    },
    [selectedVoice],
  );

  const stop = useCallback(() => {
    playToken.current++;
    playingKey.current = null;
    try { player.pause(); } catch {} // the player may already be released on unmount
    setIndex(null);
    setIsPlaying(false);
    setIsLoading(false);
  }, [player]);

  const playAt = useCallback(
    async (i: number) => {
      const seg = segments[i];
      if (!seg) { stop(); return; }
      const token = ++playToken.current;
      player.pause();
      setIndex(i);
      setError(false);
      setIsPlaying(true);
      setIsLoading(true);
      const uri = await clip(seg);
      if (token !== playToken.current) return;
      setIsLoading(false);
      if (!uri) {
        setIsPlaying(false);
        setError(true);
        return;
      }
      playingKey.current = seg.key;
      player.replace(uri);
      player.play();
      if (i === 0) fireEvent('tts_played');
      // Warm the next clip while this one plays.
      if (segments[i + 1]) clip(segments[i + 1]);
    },
    [segments, clip, player, stop, fireEvent],
  );

  // Advance when a clip ends; close after the last one. Listens to the finish event
  // itself — the derived `status` can still report the previous clip's didJustFinish
  // right after a replace, which would skip a segment.
  const onFinish = useRef(() => {});
  useEffect(() => {
    onFinish.current = () => {
      if (index === null || playingKey.current !== segments[index]?.key) return;
      playingKey.current = null;
      if (index + 1 < segments.length) playAt(index + 1);
      else stop();
    };
  });
  // expo-audio's AudioPlayer typing doesn't satisfy useEventListener's EventEmitter
  // param under this TS version, though it is one at runtime (useAudioPlayerStatus
  // subscribes the same way).
  useEventListener(player as any, 'playbackStatusUpdate', (s: AudioStatus) => {
    if (s.didJustFinish) onFinish.current();
  });

  // A new clip loads at 1x — re-apply the chosen speed whenever one loads.
  useEffect(() => {
    if (status.isLoaded) player.setPlaybackRate(rate);
  }, [status.isLoaded, rate, player]);

  // A different script (or voice) invalidates the queue. Keyed by the spoken text, not
  // array identity, so a refetch of the same page doesn't interrupt Listen.
  const script = segments.map((s) => `${s.key}\u0000${s.text}`).join('\u0001');
  useEffect(() => stop, [script, selectedVoice, stop]);

  const pause = useCallback(() => {
    player.pause();
    setIsPlaying(false);
  }, [player]);

  const toggle = useCallback(() => {
    if (index === null || error) { playAt(index ?? 0); return; }
    if (isPlaying) { pause(); return; }
    if (status.isLoaded) { player.play(); setIsPlaying(true); }
    else playAt(index);
  }, [index, error, isPlaying, status.isLoaded, player, pause, playAt]);

  const next = useCallback(() => {
    if (index !== null && index + 1 < segments.length) playAt(index + 1);
  }, [index, segments.length, playAt]);

  const prev = useCallback(() => {
    if (index !== null) playAt(Math.max(0, index - 1));
  }, [index, playAt]);

  const cycleRate = useCallback(() => {
    setRate((r) => RATES[(RATES.indexOf(r) + 1) % RATES.length]);
  }, []);

  return {
    isOpen: index !== null,
    index,
    total: segments.length,
    current: index !== null ? segments[index] : null,
    isPlaying,
    isLoading,
    error,
    rate,
    toggle,
    pause,
    stop,
    next,
    prev,
    cycleRate,
  };
}

export type PageReader = ReturnType<typeof usePageReader>;
