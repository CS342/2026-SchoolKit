import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../contexts/OnboardingContext';

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
          <Ionicons name="arrow-back" size={28} color="#2D2D44" />
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
          placeholderTextColor="#A8A8B8"
          autoFocus
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
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
  saveButtonDisabled: {
    backgroundColor: '#D8D8E8',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveTextDisabled: {
    color: '#A8A8B8',
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
