import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../contexts/OfflineContext';
import { COLORS } from '../constants/onboarding-theme';

export function OfflineBanner() {
  const { isOnline, isLoading, hasPendingChanges } = useOffline();

  // Don't show anything while loading or when online with no pending changes
  if (isLoading || (isOnline && !hasPendingChanges)) {
    return null;
  }

  // Show syncing message when back online with pending changes
  if (isOnline && hasPendingChanges) {
    return (
      <View style={[styles.container, styles.syncing]}>
        <Ionicons name="sync-outline" size={18} color={COLORS.successText} />
        <Text style={[styles.text, styles.syncingText]}>Syncing your changes...</Text>
      </View>
    );
  }

  // Show offline message
  return (
    <View style={[styles.container, styles.offline]}>
      <Ionicons name="cloud-offline-outline" size={18} color={COLORS.offlineText} />
      <Text style={[styles.text, styles.offlineText]}>
        You're offline. Changes will sync when you reconnect.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  offline: {
    backgroundColor: COLORS.warningBg,
  },
  syncing: {
    backgroundColor: COLORS.successBg,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  offlineText: {
    color: COLORS.offlineText,
  },
  syncingText: {
    color: COLORS.successText,
  },
});
