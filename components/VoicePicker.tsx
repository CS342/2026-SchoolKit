// The guide (TTS voice) picker shared by onboarding and Settings: region filter chips,
// guides grouped by region, and fixed-height cards so rows line up. Only guides who
// read `lang` natively are offered (see voiceSections in services/elevenLabs).
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { RADII, ANIMATION, TYPOGRAPHY, SIZING } from '../constants/onboarding-theme';
import type { ThemeColors } from '../constants/theme';
import { voiceSections, voiceDescription, SHOW_VOICE_AVATARS, type VoiceData, type VoiceLang, type VoiceRegion } from '../services/elevenLabs';
import type { VoiceSample } from '../hooks/useVoiceSample';

const IS_WEB = Platform.OS === 'web';
const CARD_HEIGHT = 76;
/** Only the first cards stagger in, so a long list doesn't keep animating. */
const MAX_STAGGERED = 9;

export function VoicePicker({ lang, selectedVoice, onSelect, sample, columns = 1, animate = false }: {
  lang: VoiceLang;
  selectedVoice: string;
  onSelect: (voiceId: string) => void;
  sample: VoiceSample;
  columns?: 1 | 2 | 3;
  /** Stagger the cards in (onboarding). */
  animate?: boolean;
}) {
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();
  const st = useMemo(() => makeStyles(colors), [colors]);
  const sections = useMemo(() => voiceSections(lang), [lang]);
  const [filter, setFilter] = useState<VoiceRegion | 'all'>('all');
  const shown = filter === 'all' ? sections : sections.filter((s) => s.region === filter);
  const total = sections.reduce((n, s) => n + s.voices.length, 0);

  const chips = (
    <>
      <Chip label={t('auth.voice.regions.all')} count={total} active={filter === 'all'} onPress={() => setFilter('all')} colors={colors} st={st} />
      {sections.map((s) => (
        <Chip
          key={s.region}
          label={t(`auth.voice.regions.${s.region}`)}
          count={s.voices.length}
          active={filter === s.region}
          onPress={() => setFilter(s.region)}
          colors={colors}
          st={st}
        />
      ))}
    </>
  );

  let cardIndex = 0;
  return (
    <View style={st.root}>
      {/* Wide layouts wrap the chips; one column (phones, Settings) swipes them sideways. */}
      {columns > 1 ? (
        <View style={[st.chips, st.chipsWrap]}>
          {chips}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chips} style={st.chipScroll}>
          {chips}
        </ScrollView>
      )}

      {shown.map((section) => (
        <View key={section.region} style={st.section} accessibilityRole="radiogroup" accessibilityLabel={t(`auth.voice.regions.${section.region}`)}>
          <Text style={st.sectionLabel}>{t(`auth.voice.regions.${section.region}`)}</Text>
          <View style={st.grid}>
            {section.voices.map((voice) => {
              const index = cardIndex++;
              return (
                <View key={voice.id} style={[st.cell, { width: `${100 / columns}%` }]}>
                  <Entrance index={index} animate={animate && index < MAX_STAGGERED}>
                    <VoiceCard
                      voice={voice}
                      lang={lang}
                      selected={voice.id === selectedVoice}
                      playing={sample.playingVoiceId === voice.id}
                      loading={sample.isLoading && sample.playingVoiceId === voice.id}
                      onSelect={() => onSelect(voice.id)}
                      onPlay={() => sample.toggle(voice.id)}
                      colors={colors}
                      shadow={voice.id === selectedVoice ? shadows.cardSelected : shadows.card}
                      st={st}
                    />
                  </Entrance>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

function VoiceCard({ voice, lang, selected, playing, loading, onSelect, onPlay, colors, shadow, st }: {
  voice: VoiceData;
  lang: VoiceLang;
  selected: boolean;
  playing: boolean;
  loading: boolean;
  onSelect: () => void;
  onPlay: () => void;
  colors: ThemeColors;
  shadow: object;
  st: ReturnType<typeof makeStyles>;
}) {
  const { t } = useTranslation();
  const place = t(`auth.voice.accents.${voice.accent}`);
  return (
    <Pressable
      onPress={onSelect}
      style={({ hovered }: any) => [st.card, shadow, selected && st.cardSelected, hovered && !selected && st.cardHover, IS_WEB && ({ cursor: 'pointer' } as any)]}
      accessibilityRole="radio"
      accessibilityLabel={`${voice.name}, ${voiceDescription(voice, lang)}, ${place}`}
      accessibilityState={{ selected }}
    >
      <View>
        {SHOW_VOICE_AVATARS && voice.image ? (
          <Image source={voice.image} style={st.avatar} contentFit="cover" />
        ) : (
          <View style={[st.avatar, { backgroundColor: voice.color + '2E' }]}>
            <Text style={[st.initial, { color: voice.color }]}>{voice.initial}</Text>
          </View>
        )}
        {selected ? (
          <View style={[st.check, { borderColor: colors.white }]}>
            <Ionicons name="checkmark" size={11} color="#fff" />
          </View>
        ) : null}
      </View>

      <View style={st.info}>
        <Text style={[st.name, selected && { color: colors.primary }]} numberOfLines={1}>{voice.name}</Text>
        <Text style={st.desc} numberOfLines={1}>{voiceDescription(voice, lang)}</Text>
        <View style={st.placeRow}>
          <Ionicons name="location-outline" size={11} color={colors.textLight} />
          <Text style={st.place} numberOfLines={1}>{place}</Text>
        </View>
      </View>

      <Pressable
        onPress={(e) => { e.stopPropagation(); onPlay(); }}
        hitSlop={8}
        style={[st.play, { backgroundColor: playing ? colors.primaryFill : colors.primarySoft }, IS_WEB && ({ cursor: 'pointer' } as any)]}
        accessibilityRole="button"
        accessibilityLabel={playing ? t('auth.voice.stopSample') : t('auth.voice.playSample', { name: voice.name })}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name={playing ? 'stop' : 'play'} size={14} color={playing ? '#fff' : colors.primary} style={playing ? undefined : { marginLeft: 2 }} />
        )}
      </Pressable>
    </Pressable>
  );
}

function Chip({ label, count, active, onPress, colors, st }: {
  label: string; count: number; active: boolean; onPress: () => void; colors: ThemeColors; st: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[st.chip, active ? { backgroundColor: colors.primaryFill, borderColor: colors.primaryFill } : null, IS_WEB && ({ cursor: 'pointer' } as any)]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[st.chipText, active && { color: '#fff' }]}>{label}</Text>
      <Text style={[st.chipCount, active && { color: 'rgba(255,255,255,0.8)' }]}>{count}</Text>
    </Pressable>
  );
}

function Entrance({ index, animate, children }: { index: number; animate: boolean; children: React.ReactNode }) {
  const translateY = useSharedValue(animate ? 24 : 0);
  const opacity = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (!animate) return;
    translateY.value = withDelay(index * ANIMATION.staggerDelay, withSpring(0, ANIMATION.springBouncy));
    opacity.value = withDelay(index * ANIMATION.staggerDelay, withTiming(1, { duration: 350 }));
  }, [animate, index, opacity, translateY]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }], opacity: opacity.value }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  root: { width: '100%' },
  chipScroll: { flexGrow: 0, marginBottom: 8 },
  chips: { gap: 8, paddingVertical: 4, paddingHorizontal: 2 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: c.borderCard, backgroundColor: c.white },
  chipText: { ...TYPOGRAPHY.caption, fontFamily: 'Raleway_600SemiBold', color: c.textDark },
  chipCount: { ...TYPOGRAPHY.caption, color: c.textLight },
  section: { marginTop: 16 },
  sectionLabel: { ...TYPOGRAPHY.overline, color: c.textLight, marginBottom: 10, marginLeft: 2 },
  // Negative margin + cell padding gives equal-width columns with even gutters.
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  cell: { paddingHorizontal: 6, paddingBottom: 12 },
  card: { height: CARD_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderRadius: RADII.card, backgroundColor: c.white, borderWidth: 1.5, borderColor: c.borderCard },
  cardHover: { borderColor: c.borderPurple },
  cardSelected: { borderColor: c.primary, backgroundColor: c.primarySoft },
  avatar: { width: SIZING.circleCard, height: SIZING.circleCard, borderRadius: SIZING.circleCard / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: c.backgroundLight },
  initial: { fontSize: 18, fontFamily: 'Raleway_800ExtraBold' },
  check: { position: 'absolute', right: -3, bottom: -3, width: 18, height: 18, borderRadius: 9, borderWidth: 2, backgroundColor: c.primaryFill, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 0 },
  name: { ...TYPOGRAPHY.bodyStrong, fontFamily: 'Raleway_700Bold', lineHeight: 20, color: c.textDark },
  desc: { ...TYPOGRAPHY.caption, fontFamily: 'Raleway_400Regular', color: c.textMuted },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  place: { ...TYPOGRAPHY.caption, fontSize: 12, lineHeight: 16, color: c.textLight, flexShrink: 1 },
  play: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
