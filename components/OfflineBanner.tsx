import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useOffline } from '../contexts/OfflineContext';
import { useTheme } from '../contexts/ThemeContext';

export function OfflineBanner() {
  const { t } = useTranslation();
  const { isOnline, isLoading, hasPendingChanges } = useOffline();
  const { colors } = useTheme();

  // Don't show anything while loading or when online with no pending changes
  if (isLoading || (isOnline && !hasPendingChanges)) {
    return null;
  }

  // Show syncing message when back online with pending changes
  if (isOnline && hasPendingChanges) {
    return (
      <View style={[styles.container, { backgroundColor: colors.successBg }]}>
        <Ionicons name="sync-outline" size={18} color={colors.successText} />
        <Text style={[styles.text, { color: colors.successText }]}>{t('auth.offline.syncing')}</Text>
      </View>
    );
  }

  // Show offline message
  return (
    <View style={[styles.container, { backgroundColor: colors.warningBg }]}>
      <Ionicons name="cloud-offline-outline" size={18} color={colors.offlineText} />
      <Text style={[styles.text, { color: colors.offlineText }]}>
        {t('auth.offline.message')}
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
