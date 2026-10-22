import React from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Reusable TTS button that shows play/pause/loading states.
 */
export function TTSButton({
  isSpeaking,
  isLoading,
  onPress,
  size = 24,
  color,
  activeColor,
  style,
}: {
  isSpeaking: boolean;
  isLoading: boolean;
  onPress: () => void;
  size?: number;
  color?: string;
  activeColor?: string;
  style?: any;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const idleColor = color ?? colors.textMuted;
  const onColor = activeColor ?? colors.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{ padding: 4 }, style]}
      accessibilityLabel={isSpeaking ? t('home.tts.pause') : t('home.tts.read')}
      accessibilityRole="button"
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={onColor} />
      ) : (
        <Ionicons
          name={isSpeaking ? 'pause-circle' : 'volume-high'}
          size={size}
          color={isSpeaking ? onColor : idleColor}
        />
      )}
    </TouchableOpacity>
  );
}
