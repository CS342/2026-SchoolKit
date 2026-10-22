import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useOnboarding, SchoolStatus } from '../contexts/OnboardingContext';
import { SelectableCard } from '../components/onboarding/SelectableCard';
import { ContentColumn } from '../components/ui';
import { SPACING, ANIMATION } from '../constants/onboarding-theme';
import { useTheme } from '../contexts/ThemeContext';

const SCHOOL_STATUS_OPTIONS: { value: SchoolStatus }[] = [
  { value: 'current-treatment' },
  { value: 'returning-after-treatment' },
  { value: 'supporting-student' },
  { value: 'special-needs' },
];

function AnimatedCardWrapper({ children, index }: { children: React.ReactNode; index: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const delay = 200 + index * ANIMATION.staggerDelay;
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    translateY.value = withDelay(delay, withSpring(0, ANIMATION.springSmooth));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

export default function EditSchoolStatusScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data, updateSchoolStatuses } = useOnboarding();
  const { colors, appStyles } = useTheme();
  const [selectedStatuses, setSelectedStatuses] = useState<SchoolStatus[]>(data.schoolStatuses);

  const toggleStatus = (status: SchoolStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleSave = () => {
    updateSchoolStatuses(selectedStatuses);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={appStyles.editBackButton} accessibilityRole="button" accessibilityLabel={t('common.goBack')}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={appStyles.editHeaderTitle}>{t('profile.editSchoolStatus')}</Text>
        <TouchableOpacity onPress={handleSave} style={appStyles.editSaveButton} accessibilityRole="button" accessibilityLabel={t('common.save')}>
          <Text style={appStyles.editSaveText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={appStyles.editScrollContent}>
        <ContentColumn width="reading">
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('profile.selectAllApply')}</Text>
          <Text style={[styles.selectedCount, { color: colors.primary }]}>
            {selectedStatuses.length === 1
              ? t('profile.statusCountOne', { count: selectedStatuses.length })
              : t('profile.statusCountOther', { count: selectedStatuses.length })}
          </Text>

          <View style={styles.cardsContainer}>
            {SCHOOL_STATUS_OPTIONS.map((option, index) => (
              <AnimatedCardWrapper key={option.value} index={index}>
                <SelectableCard
                  title={t(`profile.statusOptions.${option.value}`)}
                  selected={selectedStatuses.includes(option.value)}
                  onPress={() => toggleStatus(option.value)}
                  multiSelect={true}
                />
              </AnimatedCardWrapper>
            ))}
          </View>
        </ContentColumn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.screenPadding,
  },
  cardsContainer: {
    gap: 0,
  },
});
