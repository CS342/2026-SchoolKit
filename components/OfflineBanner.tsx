import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../contexts/OfflineContext';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS } from '../constants/onboarding-theme';

export function OfflineBanner() {
  const { isOnline, isLoading, hasPendingChanges } = useOffline();
  const { isDark } = useTheme();

  // Don't show anything while loading or when online with no pending changes
  if (isLoading || (isOnline && !hasPendingChanges)) {
    return null;
  }

  // Show syncing message when back online with pending changes
  if (isOnline && hasPendingChanges) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a332a' : COLORS.successBg }]}>
        <Ionicons name="sync-outline" size={18} color={isDark ? '#6ee7a0' : COLORS.successText} />
        <Text style={[styles.text, { color: isDark ? '#6ee7a0' : COLORS.successText }]}>Syncing your changes...</Text>
      </View>
    );
  }

  // Show offline message
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#332a1a' : COLORS.warningBg }]}>
      <Ionicons name="cloud-offline-outline" size={18} color={isDark ? '#f5c862' : COLORS.offlineText} />
      <Text style={[styles.text, { color: isDark ? '#f5c862' : COLORS.offlineText }]}>
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
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
