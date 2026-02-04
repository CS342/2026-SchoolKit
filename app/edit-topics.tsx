import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../contexts/OnboardingContext';
import { COLORS } from '../constants/onboarding-theme';

const AVAILABLE_TOPICS = [
  'What you might experience',
  'Friends and social life',
  'Dealing with feelings',
  'Keeping up with school during treatment',
  'Getting back to school after treatment',
  'Coping with stress and emotions',
  'Supporting my child during treatment',
  'Becoming a strong advocate for my child',
  'Collaborating with the school team',
  'Working with healthcare providers',
  'Easing the financial burden',
  'Caregiving through cultural or language barriers',
  'Supporting students during treatment',
  'Helping students transition back to school',
  'Fostering emotional and physical safety',
  'Working with families and medical teams',
  'Understanding What Cancer Is and Isn\'t',
];

const TOPIC_COLORS = [COLORS.primary, COLORS.studentK8, COLORS.staff, COLORS.error];

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
            <Ionicons name="checkmark" size={20} color={COLORS.white} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function EditTopicsScreen() {
  const router = useRouter();
  const { data, updateTopics } = useOnboarding();
  const [selectedTopics, setSelectedTopics] = useState<string[]>(data.topics);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleSave = () => {
    updateTopics(selectedTopics);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Topics</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Select topics you're interested in</Text>
        <Text style={styles.selectedCount}>
          {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
        </Text>

        <View style={styles.topicsContainer}>
          {AVAILABLE_TOPICS.map((topic, index) => (
            <TopicCard
              key={topic}
              topic={topic}
              color={TOPIC_COLORS[index % TOPIC_COLORS.length]}
              isSelected={selectedTopics.includes(topic)}
              onPress={() => toggleTopic(topic)}
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
  topicsContainer: {
    gap: 12,
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
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
  topicText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#2D2D44',
    lineHeight: 24,
  },
  topicTextSelected: {
    fontWeight: '700',
    color: '#2D2D44',
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
