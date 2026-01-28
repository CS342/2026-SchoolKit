import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from './ProgressBar';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  showHelper?: boolean;
}

export function OnboardingHeader({ currentStep, totalSteps, showHelper = false }: OnboardingHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color="#4A4A68" />
        </TouchableOpacity>

        <Text style={styles.stepText}>Step {currentStep} of {totalSteps}</Text>

        <View style={styles.placeholder} />
      </View>

      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

      {showHelper && (
        <Text style={styles.helperText}>
          You can change or update any of this later.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  stepText: {
    fontSize: 16,
    color: '#6B6B85',
    fontWeight: '500',
  },
  placeholder: {
    width: 40,
  },
  helperText: {
    fontSize: 13,
    color: '#8E8EA8',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
    fontStyle: 'italic',
  },
});
