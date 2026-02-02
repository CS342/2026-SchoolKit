import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressStatus } from '../contexts/OnboardingContext';

interface ProgressIndicatorProps {
  status: ProgressStatus | null;
  size?: 'small' | 'large';
}

export function ProgressIndicator({ status, size = 'small' }: ProgressIndicatorProps) {
  if (!status) return null;

  const iconSize = size === 'small' ? 16 : 22;
  const containerSize = size === 'small' ? 26 : 34;

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        },
        status === 'completed' && styles.completed,
        status === 'started' && styles.started,
      ]}
    >
      <Ionicons
        name={status === 'completed' ? 'checkmark' : 'time-outline'}
        size={iconSize}
        color={status === 'completed' ? '#FFFFFF' : '#7B68EE'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completed: {
    backgroundColor: '#66D9A6',
  },
  started: {
    backgroundColor: '#F5F3FF',
    borderWidth: 2,
    borderColor: '#7B68EE',
  },
});
