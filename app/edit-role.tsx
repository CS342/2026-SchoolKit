import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding, UserRole } from '../contexts/OnboardingContext';
import { COLORS } from '../constants/onboarding-theme';

interface RoleOption {
  value: UserRole;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'student-k8', label: 'Student (K-8)', icon: 'school', color: '#0EA5E9' },
  { value: 'student-hs', label: 'Student (High School+)', icon: 'book', color: '#7B68EE' },
  { value: 'parent', label: 'Parent / Caregiver', icon: 'people', color: '#EC4899' },
  { value: 'staff', label: 'School Staff', icon: 'briefcase', color: '#66D9A6' },
];

interface RoleCardProps {
  option: RoleOption;
  isSelected: boolean;
  onPress: () => void;
}

function RoleCard({ option, isSelected, onPress }: RoleCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <Animated.View
        style={[
          styles.roleCard,
          isSelected && {
            borderColor: option.color,
            borderLeftWidth: 6,
            backgroundColor: option.color + '0D',
          },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
          <Ionicons name={option.icon} size={32} color={option.color} />
        </View>
        <Text style={[styles.roleText, isSelected && styles.roleTextSelected]}>
          {option.label}
        </Text>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: option.color }]}>
            <Ionicons name="checkmark" size={22} color={COLORS.white} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function EditRoleScreen() {
  const router = useRouter();
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Role</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Select your role</Text>

        <View style={styles.rolesContainer}>
          {ROLE_OPTIONS.map((option) => (
            <RoleCard
              key={option.value}
              option={option}
              isSelected={selectedRole === option.value}
              onPress={() => setSelectedRole(option.value)}
            />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.borderCard,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B6B85',
    marginBottom: 24,
  },
  rolesContainer: {
    gap: 14,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E8E8F0',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D44',
  },
  roleTextSelected: {
    fontWeight: '700',
  },
  checkmark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
