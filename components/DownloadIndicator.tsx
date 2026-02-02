import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../contexts/OnboardingContext';

interface DownloadIndicatorProps {
  resourceId: string;
  size?: number;
}

export function DownloadIndicator({ resourceId, size = 20 }: DownloadIndicatorProps) {
  const { isDownloaded } = useOnboarding();
  const downloaded = isDownloaded(resourceId);

  if (!downloaded) return null;

  return (
    <View style={styles.indicator}>
      <Ionicons name="checkmark-circle" size={size} color="#66D9A6" />
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    marginRight: 4,
  },
});
