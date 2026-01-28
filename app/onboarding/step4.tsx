import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../../contexts/OnboardingContext';

const STUDENT_TOPICS = [
  'What you might experience',
  'Friends and social life',
  'Dealing with feelings',
  'Keeping up with school during treatment',
  'Getting back to school after treatment',
  'Coping with stress and emotions',
];

const PARENT_TOPICS = [
  'Supporting my child during treatment',
  'Becoming a strong advocate for my child',
  'Collaborating with the school team',
  'Working with healthcare providers',
  'Easing the financial burden',
  'Caregiving through cultural or language barriers',
  'Coping with stress and emotions',
  'Helping my child with friendships',
];

const STAFF_TOPICS = [
  'Supporting students during treatment',
  'Helping students transition back to school',
  'Fostering emotional and physical safety',
  'Working with families and medical teams',
  'Collaborating with healthcare providers',
  'Understanding treatment side effects',
];

const TOPIC_COLORS = ['#7B68EE', '#7B68EE', '#7B68EE', '#7B68EE', '#7B68EE', '#7B68EE'];

interface TopicCardProps {
  topic: string;
  color: string;
  isSelected: boolean;
  onPress: () => void;
}

function TopicCard({ topic, color, isSelected, onPress }: TopicCardProps) {
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
            borderColor: color,
            borderLeftWidth: 6,
            backgroundColor: color + '0D',
          },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={[styles.topicText, isSelected && styles.topicTextSelected]}>
          {topic}
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

export default function Step4Screen() {
  const router = useRouter();
  const { data, updateTopics, completeOnboarding } = useOnboarding();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

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
        <Text style={styles.stepText}>Step 4 of 4</Text>
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
          </View>

          <Text style={styles.title}>What would you like support with right now?</Text>
          <Text style={styles.subtitle}>
            Pick anything that feels helpful - you don't need to know what you need yet, exploring is okay
          </Text>
          <Text style={styles.count}>
            {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
          </Text>

          <View style={styles.topicsContainer}>
            {availableTopics.map((topic, index) => (
              <TopicCard
                key={topic}
                topic={topic}
                color={TOPIC_COLORS[index % TOPIC_COLORS.length]}
                isSelected={selectedTopics.includes(topic)}
                onPress={() => toggleTopic(topic)}
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
    marginBottom: 32,
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
    fontSize: 36,
    fontWeight: '800',
    color: '#2D2D44',
    marginBottom: 14,
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
    fontSize: 16,
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
  topicText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D44',
    lineHeight: 25,
  },
  topicTextSelected: {
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
