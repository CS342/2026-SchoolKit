import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../contexts/OnboardingContext';

const K8_GRADES = [
  { value: 'K', label: 'Kindergarten' },
  { value: '1', label: '1st Grade' },
  { value: '2', label: '2nd Grade' },
  { value: '3', label: '3rd Grade' },
  { value: '4', label: '4th Grade' },
  { value: '5', label: '5th Grade' },
  { value: '6', label: '6th Grade' },
  { value: '7', label: '7th Grade' },
  { value: '8', label: '8th Grade' },
];

const HS_GRADES = [
  { value: '9', label: '9th Grade (Freshman)' },
  { value: '10', label: '10th Grade (Sophomore)' },
  { value: '11', label: '11th Grade (Junior)' },
  { value: '12', label: '12th Grade (Senior)' },
  { value: 'college', label: 'College / University' },
];

interface GradeCardProps {
  grade: { value: string; label: string };
  isSelected: boolean;
  onPress: () => void;
}

function GradeCard({ grade, isSelected, onPress }: GradeCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const color = '#7B68EE';

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
          styles.gradeCard,
          isSelected && {
            borderColor: color,
            borderLeftWidth: 6,
            backgroundColor: color + '0D',
          },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={[styles.gradeText, isSelected && styles.gradeTextSelected]}>
          {grade.label}
        </Text>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: color }]}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function EditGradeLevelScreen() {
  const router = useRouter();
  const { data, updateGradeLevel } = useOnboarding();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(data.gradeLevel || null);

  const grades = data.role === 'student-k8' ? K8_GRADES : HS_GRADES;

  const handleSave = () => {
    updateGradeLevel(selectedGrade || '');
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2D2D44" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Grade Level</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Select your grade level</Text>

        <View style={styles.gradesContainer}>
          {grades.map((grade) => (
            <GradeCard
              key={grade.value}
              grade={grade}
              isSelected={selectedGrade === grade.value}
              onPress={() => setSelectedGrade(grade.value)}
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
    marginBottom: 24,
  },
  gradesContainer: {
    gap: 12,
  },
  gradeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E8E8F0',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  gradeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D44',
  },
  gradeTextSelected: {
    fontWeight: '700',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
