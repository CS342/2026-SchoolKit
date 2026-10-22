import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Pressable, NativeSyntheticEvent, NativeScrollEvent, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, TYPOGRAPHY } from '../constants/onboarding-theme';
import { useTheme } from '../contexts/ThemeContext';
import { AppTheme } from '../constants/theme';
import { PrimaryButton } from './onboarding/PrimaryButton';

interface CommunityNormsModalProps {
  visible: boolean;
  onClose: () => void;
  mode: 'view' | 'submit' | 'select';
  onAgree?: (selected: string[]) => void;
}

// `id` is the stable value stored/selected (and persisted to the DB as a
// rejected-norm), so it must stay in English. `key` selects the translated
// title/desc for display only.
const NORMS = [
  { id: 'School Stories Only', key: 'schoolStoriesOnly' },
  { id: 'Be Kind and Supportive', key: 'beKind' },
  { id: 'No Medical Advice', key: 'noMedicalAdvice' },
  { id: "Protect Your Privacy (and Others')", key: 'protectPrivacy' },
  { id: "Respect Everyone's Journey", key: 'respectJourney' },
  { id: 'Zero Tolerance for Bullying or Hate', key: 'zeroTolerance' },
  { id: 'Safe Language and Tone', key: 'safeLanguage' }
];

export function CommunityNormsModal({ visible, onClose, mode, onAgree }: CommunityNormsModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [selected, setSelected] = useState<string[]>([]);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(Platform.OS === 'web');
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  useEffect(() => {
    if (visible) {
      setHasScrolledToBottom(Platform.OS === 'web');
      setSelected([]);
    }
  }, [visible, mode]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (mode !== 'submit' || hasScrolledToBottom) return;
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 50) {
      setHasScrolledToBottom(true);
    }
  };

  const toggleNorm = (id: string) => {
    if (mode !== 'select') return;
    setSelected(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('stories.communityNorms')}</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
          onContentSizeChange={(w, h) => {
            if (mode === 'submit' && scrollViewHeight > 0 && h <= scrollViewHeight + 50) {
              setHasScrolledToBottom(true);
            }
          }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.schoolBanner}>
            <Ionicons name="school-outline" size={18} color={isDark ? colors.textMuted : "#5C5C8A"} style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.schoolBannerText}>{t('stories.schoolBanner')}</Text>
          </View>

          {mode === 'select' && (
            <Text style={styles.selectHint}>{t('stories.selectViolationsHint')}</Text>
          )}

          {NORMS.map(norm => {
            const isSelected = selected.includes(norm.id);
            return (
              <Pressable 
                key={norm.id} 
                style={[styles.normBlock, mode === 'select' && styles.normBlockSelectable, isSelected && styles.normBlockSelected]}
                onPress={() => toggleNorm(norm.id)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {mode === 'select' && (
                    <Ionicons 
                        name={isSelected ? "checkbox" : "square-outline"} 
                        size={22} 
                        color={isSelected ? colors.primary : colors.textLight} 
                        style={{ marginRight: 12, marginTop: -2 }}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.normTitle, isSelected && { color: colors.primary }]}>{t(`stories.norms.${norm.key}.title`)}</Text>
                    <Text style={styles.normText}>{t(`stories.norms.${norm.key}.desc`)}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}

          {mode === 'submit' && (
            <View style={styles.ackBox}>
              <Text style={styles.ackTitle}>{t('stories.disclaimerTitle')}</Text>
              <Text style={styles.ackText}>{t('stories.disclaimerText')}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {mode === 'submit' ? (
            <PrimaryButton
              title={hasScrolledToBottom ? t('stories.submitBtnAgreed') : t('stories.submitBtnRead')}
              onPress={() => onAgree?.([])}
              disabled={!hasScrolledToBottom}
            />
          ) : mode === 'select' ? (
            <PrimaryButton
              title={t('stories.rejectStoryCount', { count: selected.length })}
              onPress={() => onAgree?.(selected)}
              disabled={selected.length === 0}
            />
          ) : (
            <PrimaryButton title={t('stories.gotIt')} onPress={onClose} />
          )}
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: AppTheme['colors'], isDark: boolean) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? c.backgroundLight : c.appBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: c.borderCard,
    backgroundColor: isDark ? c.backgroundLight : c.white,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: c.textDark,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  schoolBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: isDark ? c.borderCard : '#EEEEF6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  schoolBannerText: {
    flex: 1,
    fontSize: 13,
    color: isDark ? c.textMuted : '#5C5C8A',
    lineHeight: 19,
    fontWeight: '500',
  },
  selectHint: {
    fontSize: 14,
    color: c.textMuted,
    marginBottom: 20,
    lineHeight: 20,
  },
  normBlock: {
    marginBottom: 20,
    borderRadius: RADII.card,
    padding: 12,
    marginHorizontal: -12,
  },
  normBlockSelectable: {
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  normBlockSelected: {
    backgroundColor: isDark ? c.primary + '15' : c.primary + '10',
    borderColor: isDark ? c.primary + '50' : c.primary + '30',
  },
  normTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textDark,
    marginBottom: 6,
  },
  normText: {
    fontSize: 15,
    color: c.textMuted,
    lineHeight: 22,
  },
  ackBox: {
    backgroundColor: isDark ? c.primary + '15' : c.primary + '10',
    padding: 16,
    borderRadius: RADII.card,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: isDark ? c.primary + '30' : c.primary + '30',
  },
  ackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: c.primary,
    marginBottom: 8,
  },
  ackText: {
    fontSize: 14,
    color: c.textDark,
    lineHeight: 20,
  },
  footer: {
    paddingTop: 16,
    paddingHorizontal: 20,
    backgroundColor: isDark ? c.backgroundLight : c.white,
    borderTopWidth: 1.5,
    borderTopColor: c.borderCard,
  },
});
}
