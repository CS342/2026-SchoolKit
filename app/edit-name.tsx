import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../contexts/OnboardingContext';
import { COLORS } from '../constants/onboarding-theme';

export default function EditNameScreen() {
  const router = useRouter();
  const { data, updateName } = useOnboarding();
  const [name, setName] = useState(data.name);

  const handleSave = () => {
    if (name.trim()) {
      updateName(name.trim());
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Name</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]}
          disabled={!name.trim()}
        >
          <Text style={[styles.saveText, !name.trim() && styles.saveTextDisabled]}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={COLORS.inputPlaceholder}
          autoFocus
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackgroundAlt,
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
  saveButtonDisabled: {
    backgroundColor: COLORS.disabledButton,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  saveTextDisabled: {
    color: COLORS.inputPlaceholder,
  },
  content: {
    padding: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D44',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E8E8F0',
    padding: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D44',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});
