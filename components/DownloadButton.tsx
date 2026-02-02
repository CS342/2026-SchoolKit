import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../contexts/OnboardingContext';

interface DownloadButtonProps {
  resourceId: string;
  size?: number;
  color?: string;
}

export function DownloadButton({ resourceId, size = 24, color = '#7B68EE' }: DownloadButtonProps) {
  const { isDownloaded, downloadResource, removeDownload } = useOnboarding();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const downloaded = isDownloaded(resourceId);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (downloaded) {
      removeDownload(resourceId);
    } else {
      downloadResource(resourceId);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.button} activeOpacity={0.7}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={downloaded ? 'checkmark-circle' : 'download-outline'}
          size={size}
          color={downloaded ? '#66D9A6' : '#8E8EA8'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
