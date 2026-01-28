import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding, UserRole } from '../../contexts/OnboardingContext';

interface RoleCardProps {
  role: UserRole;
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  color: string;
  selectedRole: UserRole | null;
  onPress: () => void;
}

function RoleCard({ role, iconName, title, color, selectedRole, onPress }: RoleCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isSelected = selectedRole === role;

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
          isSelected && { borderColor: color, borderLeftWidth: 6 },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={iconName} size={56} color="#FFFFFF" />
        </View>
        <Text style={styles.roleTitle}>{title}</Text>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: color }]}>
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function Step2Screen() {
  const router = useRouter();
  const { updateRole } = useOnboarding();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      updateRole(selectedRole);
      router.push('/onboarding/step3');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2D2D44" />
        </TouchableOpacity>
        <Text style={styles.stepText}>Step 2 of 4</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
          </View>

          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>Choose the option that best describes you</Text>

          <View style={styles.options}>
            <RoleCard
              role="student-k8"
              iconName="school"
              title="Student (K-8)"
              color="#0EA5E9"
              selectedRole={selectedRole}
              onPress={() => setSelectedRole('student-k8')}
            />

            <RoleCard
              role="student-hs"
              iconName="book"
              title="Student (High School+)"
              color="#7B68EE"
              selectedRole={selectedRole}
              onPress={() => setSelectedRole('student-hs')}
            />

            <RoleCard
              role="parent"
              iconName="people"
              title="Parent / Caregiver"
              color="#EC4899"
              selectedRole={selectedRole}
              onPress={() => setSelectedRole('parent')}
            />

            <RoleCard
              role="staff"
              iconName="briefcase"
              title="School Staff"
              color="#66D9A6"
              selectedRole={selectedRole}
              onPress={() => setSelectedRole('staff')}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, !selectedRole && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedRole}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, !selectedRole && styles.buttonTextDisabled]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
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
  },
  backButton: {
    padding: 4,
  },
  stepText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7B68EE',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
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
    marginBottom: 36,
  },
  options: {
    gap: 18,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E8E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    position: 'relative',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D2D44',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#F8F7FF',
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
