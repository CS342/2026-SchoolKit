import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useTheme } from '../contexts/ThemeContext';

interface DownloadIndicatorProps {
  resourceId: string;
  size?: number;
}

export function DownloadIndicator({ resourceId, size = 20 }: DownloadIndicatorProps) {
  const { isDownloaded } = useOnboarding();
  const { colors } = useTheme();
  const downloaded = isDownloaded(resourceId);

  if (!downloaded) return null;

  return (
    <View style={styles.indicator}>
      <Ionicons name="checkmark-circle" size={size} color={colors.staff} />
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    marginRight: 4,
  },
});
