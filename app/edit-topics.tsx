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
import { useOnboarding } from '../contexts/OnboardingContext';
import { SelectableCard } from '../components/onboarding/SelectableCard';
import { ContentColumn } from '../components/ui';
import { SPACING, ANIMATION } from '../constants/onboarding-theme';
import { useTheme } from '../contexts/ThemeContext';
import { useTopicPicker } from '../hooks/useResources';

function AnimatedCardWrapper({ children, index }: { children: React.ReactNode; index: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const delay = 200 + index * ANIMATION.fastStaggerDelay;
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    translateY.value = withDelay(delay, withSpring(0, ANIMATION.springSmooth));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

export default function EditTopicsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data, updateTopics } = useOnboarding();
  const { colors, appStyles } = useTheme();
  const picker = useTopicPicker(data.topics);

  const handleSave = () => {
    updateTopics(picker.toSave());
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={appStyles.editBackButton} accessibilityRole="button" accessibilityLabel={t('common.goBack')}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={appStyles.editHeaderTitle}>{t('profile.editTopics')}</Text>
        <TouchableOpacity onPress={handleSave} style={appStyles.editSaveButton} accessibilityRole="button" accessibilityLabel={t('common.save')}>
          <Text style={appStyles.editSaveText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={appStyles.editScrollContent}>
        <ContentColumn width="reading">
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('profile.selectTopics')}</Text>
          <Text style={[styles.selectedCount, { color: colors.primary }]}>
            {picker.count === 1
              ? t('profile.topicCountOne', { count: picker.count })
              : t('profile.topicCountOther', { count: picker.count })}
          </Text>

          <View style={styles.cardsContainer}>
            {picker.topics.map((topic, index) => (
              <AnimatedCardWrapper key={topic.id} index={index}>
                <SelectableCard
                  title={topic.label}
                  color={topic.color}
                  icon={topic.icon as any}
                  selected={picker.isSelected(topic)}
                  onPress={() => picker.toggle(topic)}
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
