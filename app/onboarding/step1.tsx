import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../../contexts/OnboardingContext';

export default function Step1Screen() {
  const router = useRouter();
  const { updateName } = useOnboarding();
  const [name, setName] = useState('');

  const handleContinue = () => {
    if (name.trim()) {
      updateName(name.trim());
      router.push('/onboarding/step2');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2D2D44" />
        </TouchableOpacity>
        <Text style={styles.stepText}>Step 1 of 4</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>

        <Text style={styles.title}>What's your name?</Text>
        <Text style={styles.subtitle}>Let's personalize your experience</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#A8A8B8"
            autoFocus
            onSubmitEditing={handleContinue}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, !name.trim() && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!name.trim()}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, !name.trim() && styles.buttonTextDisabled]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  },
  backButton: {
    padding: 4,
  },
  stepText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7B68EE',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 48,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8E8F0',
  },
  progressDotActive: {
    backgroundColor: '#7B68EE',
    width: 32,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#2D2D44',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8EA8',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginTop: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#E8E8F0',
    padding: 24,
    fontSize: 32,
    fontWeight: '700',
    color: '#2D2D44',
    textAlign: 'center',
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  button: {
    backgroundColor: '#7B68EE',
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#D8D8E8',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  buttonTextDisabled: {
    color: '#A8A8B8',
  },
});
