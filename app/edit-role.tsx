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
import { useOnboarding, UserRole } from '../contexts/OnboardingContext';
import { SelectableCard } from '../components/onboarding/SelectableCard';
import { COLORS, SPACING, ANIMATION, APP_STYLES } from '../constants/onboarding-theme';

interface RoleOption {
  value: UserRole;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'student-k8', label: 'Student (Middle School)', icon: 'school', color: '#0EA5E9' },
  { value: 'student-hs', label: 'Student (High School and up)', icon: 'book', color: '#7B68EE' },
  { value: 'parent', label: 'Parent / Caregiver', icon: 'people', color: '#EC4899' },
  { value: 'staff', label: 'School Staff', icon: 'briefcase', color: '#66D9A6' },
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

export default function EditRoleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, updateRole } = useOnboarding();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(data.role);

  const handleSave = () => {
    if (selectedRole) {
      updateRole(selectedRole);
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={[APP_STYLES.editHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={APP_STYLES.editBackButton} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={APP_STYLES.editHeaderTitle}>Edit Role</Text>
        <TouchableOpacity onPress={handleSave} style={APP_STYLES.editSaveButton}>
          <Text style={APP_STYLES.editSaveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={APP_STYLES.editScrollContent}>
        <Text style={styles.subtitle}>Select your role</Text>

        <View style={styles.cardsContainer}>
          {ROLE_OPTIONS.map((option, index) => (
            <AnimatedCardWrapper key={option.value} index={index}>
              <SelectableCard
                title={option.label}
                icon={option.icon}
                color={option.color}
                selected={selectedRole === option.value}
                onPress={() => setSelectedRole(option.value)}
                multiSelect={false}
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
    backgroundColor: COLORS.appBackground,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: SPACING.screenPadding,
  },
  cardsContainer: {
    gap: 0,
  },
});
