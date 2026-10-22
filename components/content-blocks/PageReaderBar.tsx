// The floating "Listen" mini-player for a content page. Hosted by ContentPage while the
// page reader is open: play/pause, previous/next section, speed, and close, plus which
// section is being read.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import type { PageReader } from '../../hooks/usePageReader';

const IS_WEB = Platform.OS === 'web';

export function PageReaderBar({ reader }: { reader: PageReader }) {
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  if (!reader.isOpen) return null;

  const { index, total, current, isPlaying, isLoading, error, rate } = reader;
  const atStart = !index;
  const atEnd = index === total - 1;

  return (
    <View
      pointerEvents="box-none"
      style={[st.wrap, { bottom: insets.bottom + 16 }, IS_WEB && ({ position: 'fixed' } as any)]}
    >
      <View
        style={[st.bar, shadows.card, { backgroundColor: colors.white, borderColor: colors.borderCard }]}
        accessibilityRole="toolbar"
        accessibilityLabel={t('editor.blocksUi.audioPlayer')}
      >
        <View style={st.info}>
          <Text style={[st.eyebrow, { color: error ? colors.error : colors.primary }]} numberOfLines={1}>
            {error ? t('editor.blocksUi.audioUnavailable') : t('editor.blocksUi.listeningCounter', { current: (index ?? 0) + 1, total })}
          </Text>
          <Text style={[st.label, { color: colors.textDark }]} numberOfLines={1}>
            {error ? t('editor.blocksUi.audioLoadFailed') : current?.label ?? ''}
          </Text>
        </View>

        <Btn icon="play-skip-back" label={t('editor.blocksUi.prevSection')} disabled={atStart || isLoading} onPress={reader.prev} color={colors.textDark} />
        <TouchableOpacity
          onPress={reader.toggle}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? t('editor.blocksUi.pause') : error ? t('common.retry') : t('editor.blocksUi.play')}
          style={[st.playBtn, { backgroundColor: colors.primary }, IS_WEB && ({ cursor: 'pointer' } as any)]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name={isPlaying ? 'pause' : error ? 'refresh' : 'play'} size={20} color="#fff" />
          )}
        </TouchableOpacity>
        <Btn icon="play-skip-forward" label={t('editor.blocksUi.nextSection')} disabled={atEnd || isLoading} onPress={reader.next} color={colors.textDark} />

        <TouchableOpacity
          onPress={reader.cycleRate}
          accessibilityRole="button"
          accessibilityLabel={t('editor.blocksUi.playbackSpeed', { rate })}
          style={[st.rateBtn, IS_WEB && ({ cursor: 'pointer' } as any)]}
        >
          <Text style={[st.rate, { color: colors.primary }]}>{rate}x</Text>
        </TouchableOpacity>
        <Btn icon="close" label={t('editor.blocksUi.stopListening')} onPress={reader.stop} color={colors.textLight} />
      </View>
    </View>
  );
}

function Btn({ icon, label, disabled, onPress, color }: { icon: string; label: string; disabled?: boolean; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[st.iconBtn, { opacity: disabled ? 0.35 : 1 }, IS_WEB && !disabled && ({ cursor: 'pointer' } as any)]}
    >
      <Ionicons name={icon as any} size={20} color={color} />
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 50 },
  bar: { width: '100%', maxWidth: 560, flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 10, paddingLeft: 16, paddingRight: 8, borderRadius: 20, borderWidth: 1 },
  info: { flex: 1, minWidth: 0, marginRight: 4 },
  eyebrow: { fontSize: 11, fontFamily: 'Raleway_700Bold', letterSpacing: 0.3, textTransform: 'uppercase' },
  label: { fontSize: 14, fontFamily: 'Raleway_600SemiBold', marginTop: 2 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginHorizontal: 2 },
  rateBtn: { minWidth: 40, height: 36, alignItems: 'center', justifyContent: 'center' },
  rate: { fontSize: 13, fontFamily: 'Raleway_700Bold' },
});
