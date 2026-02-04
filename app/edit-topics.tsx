import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useOnboarding } from '../contexts/OnboardingContext';
import { SelectableCard } from '../components/onboarding/SelectableCard';
import { COLORS, SPACING, ANIMATION, APP_STYLES } from '../constants/onboarding-theme';

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

function AnimatedCardWrapper({ children, index }: { children: React.ReactNode; index: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const delay = 200 + index * ANIMATION.fastStaggerDelay;
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    translateY.value = withDelay(delay, withSpring(0, ANIMATION.springSmooth));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
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
      <View style={APP_STYLES.editHeader}>
        <TouchableOpacity onPress={() => router.back()} style={APP_STYLES.editBackButton}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={APP_STYLES.editHeaderTitle}>Edit Topics</Text>
        <TouchableOpacity onPress={handleSave} style={APP_STYLES.editSaveButton}>
          <Text style={APP_STYLES.editSaveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={APP_STYLES.editScrollContent}>
        <Text style={styles.subtitle}>Select topics you're interested in</Text>
        <Text style={styles.selectedCount}>
          {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
        </Text>

        <View style={styles.cardsContainer}>
          {AVAILABLE_TOPICS.map((topic, index) => (
            <AnimatedCardWrapper key={topic} index={index}>
              <SelectableCard
                title={topic}
                color={TOPIC_COLORS[index % TOPIC_COLORS.length]}
                selected={selectedTopics.includes(topic)}
                onPress={() => toggleTopic(topic)}
                multiSelect={true}
              />
            </AnimatedCardWrapper>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.screenPadding,
  },
  cardsContainer: {
    gap: 0,
  },
});
