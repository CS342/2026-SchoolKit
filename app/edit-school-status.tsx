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
import { useOnboarding, SchoolStatus } from '../contexts/OnboardingContext';
import { SelectableCard } from '../components/onboarding/SelectableCard';
import { SPACING, ANIMATION } from '../constants/onboarding-theme';
import { useTheme } from '../contexts/ThemeContext';

const SCHOOL_STATUS_OPTIONS: { value: SchoolStatus; label: string }[] = [
  { value: 'current-treatment', label: 'Currently in school' },
  { value: 'returning-after-treatment', label: 'Taking a break from school' },
  { value: 'supporting-student', label: 'Planning to return to school soon' },
  { value: 'special-needs', label: 'Home Hospital Education' },
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
        <TouchableOpacity onPress={() => router.back()} style={appStyles.editBackButton} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={appStyles.editHeaderTitle}>Edit School Status</Text>
        <TouchableOpacity onPress={handleSave} style={appStyles.editSaveButton}>
          <Text style={appStyles.editSaveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={appStyles.editScrollContent}>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Select all that apply</Text>
        <Text style={[styles.selectedCount, { color: colors.primary }]}>
          {selectedStatuses.length} status{selectedStatuses.length !== 1 ? 'es' : ''} selected
        </Text>

        <View style={styles.cardsContainer}>
          {SCHOOL_STATUS_OPTIONS.map((option, index) => (
            <AnimatedCardWrapper key={option.value} index={index}>
              <SelectableCard
                title={option.label}
                selected={selectedStatuses.includes(option.value)}
                onPress={() => toggleStatus(option.value)}
                multiSelect={true}
              />
            </AnimatedCardWrapper>
          ))}
        </View>
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
