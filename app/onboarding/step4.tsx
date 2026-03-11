import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { DecorativeBackground } from '../../components/onboarding/DecorativeBackground';
import { AuthWebWrapper } from '../../components/AuthWebWrapper';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { SelectableCard } from '../../components/onboarding/SelectableCard';

import { useResponsive } from '../../hooks/useResponsive';
import { GRADIENTS, ANIMATION, COLORS, RADII, SHARED_STYLES } from '../../constants/onboarding-theme';
import { PAGE_TOPICS } from '../../constants/resources';

function CounterPill({ count }: { count: number }) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(1.05, ANIMATION.springBouncy);
    setTimeout(() => {
      scale.value = withSpring(1, ANIMATION.springBouncy);
    }, 120);
  }, [count]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.counterPill,
        count > 0 ? styles.counterPillActive : styles.counterPillInactive,
        pillStyle,
      ]}
    >
      <Text style={[styles.counterText, count > 0 ? styles.counterTextActive : styles.counterTextInactive]}>
        {count} topic{count !== 1 ? 's' : ''} selected
      </Text>
    </Animated.View>
  );
}

export default function Step4Screen() {
  const router = useRouter();
  const { data, updateTopics, completeOnboarding } = useOnboarding();
  const { isWeb, isMobile } = useResponsive();
  const isWebDesktop = isWeb && !isMobile;

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const isStudent = data.role === 'student-k8' || data.role === 'student-hs';

  const availableTopics = PAGE_TOPICS;

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleFinish = () => {
    updateTopics(selectedTopics);
    router.push('/onboarding/voice-selection');
  };

  const handleSkip = () => {
    updateTopics([]);
    router.push('/onboarding/voice-selection');
  };


  return (
    <DecorativeBackground variant="step" gradientColors={GRADIENTS.screenBackground}>
      <AuthWebWrapper variant="onboarding" step={{ current: isStudent ? 5 : 4, total: isStudent ? 6 : 5, label: 'Topics' }}>
      <View style={styles.container}>
        <OnboardingHeader
          currentStep={isStudent ? 5 : 4}
          totalSteps={isStudent ? 6 : 5}
        />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, isWebDesktop && { paddingVertical: 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, isWebDesktop && { maxWidth: 800, width: '100%', alignSelf: 'center', flex: undefined, paddingTop: 48 }]}>
            <View style={[SHARED_STYLES.pageIconCircle, isWebDesktop && { width: 96, height: 96, borderRadius: 48 }]}>
              <Ionicons name="sparkles-outline" size={isWebDesktop ? 56 : 48} color={COLORS.primary} />
            </View>

            <Text style={[SHARED_STYLES.pageTitle, { lineHeight: 36 }]}>What would you like support with?</Text>
            <Text style={[SHARED_STYLES.pageSubtitle, styles.subtitleOverride]}>
              Choose what feels right - you can always explore more later.
            </Text>

            <CounterPill count={selectedTopics.length} />

            <View style={[styles.topicsContainer, isWebDesktop && { flexDirection: 'row', flexWrap: 'wrap', gap: 16 }]}>
              {availableTopics.map((topic, index) => (
                <View key={topic.label} style={isWebDesktop ? { width: '48%' } : undefined}>
                  <SelectableCard
                    title={topic.label}
                    selected={selectedTopics.includes(topic.label)}
                    onPress={() => toggleTopic(topic.label)}
                    multiSelect
                    color={topic.color}
                    icon={topic.icon as any}
                    index={index}
                  />
                </View>
              ))}
            </View>

            {isWebDesktop && (
              <View style={{ maxWidth: 400, width: '100%', alignSelf: 'center', marginTop: 32, gap: 4 }}>
                <PrimaryButton
                  title="Get Started"
                  onPress={handleFinish}
                  disabled={selectedTopics.length === 0}
                  icon="arrow-forward"
                />
                <Pressable style={SHARED_STYLES.skipButton} onPress={handleSkip}>
                  <Text style={SHARED_STYLES.skipText}>Skip for now</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>

        {!isWebDesktop && (
        <View style={SHARED_STYLES.buttonContainer}>
          <PrimaryButton
            title="Get Started"
            onPress={handleFinish}
            disabled={selectedTopics.length === 0}
            icon="arrow-forward"
          />
          <Pressable style={SHARED_STYLES.skipButton} onPress={handleSkip}>
            <Text style={SHARED_STYLES.skipText}>Skip for now</Text>
          </Pressable>
        </View>
        )}
      </View>
      </AuthWebWrapper>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    alignItems: 'center',
  },
  subtitleOverride: {
    marginBottom: 12,
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  counterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADII.badge,
    marginBottom: 20,
  },
  counterPillActive: {
    backgroundColor: COLORS.primary,
  },
  counterPillInactive: {
    backgroundColor: COLORS.border,
  },
  counterText: {
    fontSize: 15,
    fontWeight: '700',
  },
  counterTextActive: {
    color: COLORS.white,
  },
  counterTextInactive: {
    color: COLORS.textLight,
  },
  topicsContainer: {
    width: '100%',
  },
});
