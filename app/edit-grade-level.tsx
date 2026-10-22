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

const ELEMENTARY_GRADES = [
  { value: 'pre-k' },
  { value: '1' },
  { value: '2' },
  { value: '3' },
  { value: '4' },
  { value: '5' },
];

const MIDDLE_SCHOOL_GRADES = [
  { value: '6' },
  { value: '7' },
  { value: '8' },
];

const HS_GRADES = [
  { value: '9' },
  { value: '10' },
  { value: '11' },
  { value: '12' },
  { value: 'college' },
];

const PARENT_GRADES = [
  { value: 'pre-k' },
  { value: 'elementary' },
  { value: 'middle-school' },
  { value: 'high-school' },
  { value: 'high-school-up' },
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

export default function EditGradeLevelScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data, updateGradeLevel } = useOnboarding();
  const { colors, appStyles } = useTheme();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(data.gradeLevel || null);

  const grades = (data.role === 'parent' || data.role === 'staff') ? PARENT_GRADES : data.role === 'student-elementary' ? ELEMENTARY_GRADES : data.role === 'student-k8' ? MIDDLE_SCHOOL_GRADES : HS_GRADES;

  const handleSave = () => {
    updateGradeLevel(selectedGrade || '');
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={appStyles.editBackButton} accessibilityRole="button" accessibilityLabel={t('common.goBack')}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={appStyles.editHeaderTitle}>{t('profile.editGradeLevel')}</Text>
        <TouchableOpacity onPress={handleSave} style={appStyles.editSaveButton} accessibilityRole="button" accessibilityLabel={t('common.save')}>
          <Text style={appStyles.editSaveText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={appStyles.editScrollContent}>
        <ContentColumn width="reading">
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{(data.role === 'parent' || data.role === 'staff') ? t('profile.selectChildGrade') : t('profile.selectYourGrade')}</Text>

          <View style={styles.cardsContainer}>
            {grades.map((grade, index) => (
              <AnimatedCardWrapper key={grade.value} index={index}>
                <SelectableCard
                  title={t(`profile.gradeOptions.${grade.value}`)}
                  selected={selectedGrade === grade.value}
                  onPress={() => setSelectedGrade(grade.value)}
                  multiSelect={false}
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
    marginBottom: SPACING.screenPadding,
  },
  cardsContainer: {
    gap: 0,
  },
});
