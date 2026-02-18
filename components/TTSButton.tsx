import React from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/onboarding-theme';

/**
 * Reusable TTS button that shows play/pause/loading states.
 */
export function TTSButton({
  isSpeaking,
  isLoading,
  onPress,
  size = 24,
  color = COLORS.textMuted,
  activeColor = COLORS.primary,
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
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{ padding: 4 }, style]}
      accessibilityLabel={isSpeaking ? 'Pause reading' : 'Read aloud'}
      accessibilityRole="button"
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={activeColor} />
      ) : (
        <Ionicons
          name={isSpeaking ? 'pause-circle' : 'volume-high'}
          size={size}
          color={isSpeaking ? activeColor : color}
        />
      )}
    </TouchableOpacity>
  );
}
