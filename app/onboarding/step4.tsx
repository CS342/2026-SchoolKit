import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../../contexts/OnboardingContext';

interface TopicOption {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const STUDENT_TOPICS: TopicOption[] = [
  { label: 'What you might experience', icon: 'leaf-outline', color: '#7B68EE' },
  { label: 'Friends and social life', icon: 'people-outline', color: '#0EA5E9' },
  { label: 'Dealing with feelings', icon: 'heart-outline', color: '#EC4899' },
  { label: 'Keeping up with school during treatment', icon: 'book-outline', color: '#66D9A6' },
  { label: 'Getting back to school after treatment', icon: 'arrow-forward-circle-outline', color: '#F59E0B' },
  { label: 'Coping with stress and emotions', icon: 'sunny-outline', color: '#7B68EE' },
  { label: 'Understanding What Cancer Is and Isn\'t', icon: 'information-circle-outline', color: '#3B82F6' },
];

const PARENT_TOPICS: TopicOption[] = [
  { label: 'Supporting my child during treatment', icon: 'heart-outline', color: '#EC4899' },
  { label: 'Becoming a strong advocate for my child', icon: 'megaphone-outline', color: '#7B68EE' },
  { label: 'Collaborating with the school team', icon: 'people-outline', color: '#0EA5E9' },
  { label: 'Working with healthcare providers', icon: 'medical-outline', color: '#66D9A6' },
  { label: 'Easing the financial burden', icon: 'wallet-outline', color: '#F59E0B' },
  { label: 'Caregiving through cultural or language barriers', icon: 'globe-outline', color: '#7B68EE' },
  { label: 'Coping with stress and emotions', icon: 'sunny-outline', color: '#EC4899' },
  { label: 'Helping my child with friendships', icon: 'chatbubbles-outline', color: '#0EA5E9' },
  { label: 'Understanding What Cancer Is and Isn\'t', icon: 'information-circle-outline', color: '#3B82F6' },
];

const STAFF_TOPICS: TopicOption[] = [
  { label: 'Supporting students during treatment', icon: 'heart-outline', color: '#EC4899' },
  { label: 'Helping students transition back to school', icon: 'arrow-forward-circle-outline', color: '#7B68EE' },
  { label: 'Fostering emotional and physical safety', icon: 'shield-outline', color: '#66D9A6' },
  { label: 'Working with families and medical teams', icon: 'people-outline', color: '#0EA5E9' },
  { label: 'Collaborating with healthcare providers', icon: 'medical-outline', color: '#F59E0B' },
  { label: 'Understanding treatment side effects', icon: 'information-circle-outline', color: '#7B68EE' },
  { label: 'Understanding What Cancer Is and Isn\'t', icon: 'information-circle-outline', color: '#3B82F6' },
];

interface TopicCardProps {
  topic: TopicOption;
  isSelected: boolean;
  onPress: () => void;
}

function TopicCard({ topic, isSelected, onPress }: TopicCardProps) {
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
          styles.topicCard,
          isSelected && {
            borderColor: topic.color,
            borderLeftWidth: 6,
            backgroundColor: topic.color + '0D',
          },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: topic.color + '20' }]}>
          <Ionicons name={topic.icon} size={26} color={topic.color} />
        </View>
        <Text style={[styles.topicText, isSelected && styles.topicTextSelected]}>
          {topic.label}
        </Text>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: topic.color }]}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function Step4Screen() {
  const router = useRouter();
  const { data, updateTopics, completeOnboarding } = useOnboarding();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const isStudent = data.role === 'student-k8' || data.role === 'student-hs';
  const stepText = isStudent ? 'Step 5 of 5' : 'Step 4 of 4';

  const availableTopics = useMemo(() => {
    switch (data.role) {
      case 'student-k8':
      case 'student-hs':
        return STUDENT_TOPICS;
      case 'parent':
        return PARENT_TOPICS;
      case 'staff':
        return STAFF_TOPICS;
      default:
        return STUDENT_TOPICS;
    }
  }, [data.role]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleFinish = () => {
    updateTopics(selectedTopics);
    completeOnboarding();
    router.replace('/loading');
  };

  const handleSkip = () => {
    updateTopics([]);
    completeOnboarding();
    router.replace('/loading');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2D2D44" />
        </TouchableOpacity>
        <Text style={styles.stepText}>{stepText}</Text>
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
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            {isStudent && <View style={[styles.progressDot, styles.progressDotActive]} />}
          </View>

          <Text style={styles.title}>What would you like support with?</Text>
          <Text style={styles.subtitle}>
            Choose what feels right - you can always explore more later.
          </Text>
          <Text style={styles.count}>
            {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
          </Text>

          <View style={styles.topicsContainer}>
            {availableTopics.map((topic) => (
              <TopicCard
                key={topic.label}
                topic={topic}
                isSelected={selectedTopics.includes(topic.label)}
                onPress={() => toggleTopic(topic.label)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, selectedTopics.length === 0 && styles.buttonDisabled]}
          onPress={handleFinish}
          disabled={selectedTopics.length === 0}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, selectedTopics.length === 0 && styles.buttonTextDisabled]}>
            Get Started
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
    paddingBottom: 20,
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
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8EA8',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  count: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7B68EE',
    textAlign: 'center',
    marginBottom: 24,
  },
  topicsContainer: {
    gap: 12,
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E8E8F0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  topicText: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    color: '#2D2D44',
    lineHeight: 28,
  },
  topicTextSelected: {
    fontWeight: '700',
  },
  checkmark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#7B68EE',
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
