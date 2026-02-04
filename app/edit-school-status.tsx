import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding, SchoolStatus } from '../contexts/OnboardingContext';
import { COLORS } from '../constants/onboarding-theme';

const SCHOOL_STATUS_OPTIONS: { value: SchoolStatus; label: string }[] = [
  { value: 'current-treatment', label: 'Currently in school' },
  { value: 'returning-after-treatment', label: 'Taking a break from school' },
  { value: 'supporting-student', label: 'Planning to return to school soon' },
  { value: 'special-needs', label: 'Home/hospital school' },
];

interface StatusCardProps {
  option: { value: SchoolStatus; label: string };
  isSelected: boolean;
  onPress: () => void;
}

function StatusCard({ option, isSelected, onPress }: StatusCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const color = COLORS.primary;

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
          styles.statusCard,
          isSelected && {
            borderColor: color,
            borderLeftWidth: 6,
            backgroundColor: color + '0D',
          },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={[styles.statusText, isSelected && styles.statusTextSelected]}>
          {option.label}
        </Text>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: color }]}>
            <Ionicons name="checkmark" size={22} color={COLORS.white} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function EditSchoolStatusScreen() {
  const router = useRouter();
  const { data, updateSchoolStatuses } = useOnboarding();
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit School Status</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Select all that apply</Text>
        <Text style={styles.selectedCount}>
          {selectedStatuses.length} status{selectedStatuses.length !== 1 ? 'es' : ''} selected
        </Text>

        <View style={styles.statusContainer}>
          {SCHOOL_STATUS_OPTIONS.map((option) => (
            <StatusCard
              key={option.value}
              option={option}
              isSelected={selectedStatuses.includes(option.value)}
              onPress={() => toggleStatus(option.value)}
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
    backgroundColor: '#FBF9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#E8E8F0',
    shadowColor: '#7B68EE',
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
    color: '#2D2D44',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#7B68EE',
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
    marginBottom: 12,
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7B68EE',
    marginBottom: 24,
  },
  statusContainer: {
    gap: 12,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E8E8F0',
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statusText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D44',
  },
  statusTextSelected: {
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
