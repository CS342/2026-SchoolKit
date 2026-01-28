import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../../contexts/OnboardingContext';

// Warm, vibrant color palette
const TOPIC_COLORS = ['#7B68EE', '#0EA5E9', '#66D9A6', '#EF4444'];

interface TopicCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

function TopicCard({ title, icon, color, onPress }: TopicCardProps) {
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
          { borderLeftColor: color, borderLeftWidth: 8, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.topicIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={42} color={color} />
        </View>
        <Text style={styles.topicTitle}>{title}</Text>
        <Ionicons name="chevron-forward" size={30} color={color} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function ForYouScreen() {
  const router = useRouter();
  const { data } = useOnboarding();

  const getRoleDisplayName = () => {
    switch (data.role) {
      case 'student-k8':
        return 'Student (K-8)';
      case 'student-hs':
        return 'Student (High School+)';
      case 'parent':
        return 'Parent/Caregiver';
      case 'staff':
        return 'School Staff';
      default:
        return 'User';
    }
  };

  const handleTopicPress = (topic: string) => {
    router.push(`/topic-detail?title=${encodeURIComponent(topic)}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{data.name}!</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.roleBadge}>
          <Ionicons name="person-circle-outline" size={20} color="#7B68EE" />
          <Text style={styles.roleText}>{getRoleDisplayName()}</Text>
        </View>

        <Text style={styles.sectionTitle}>Your Support Topics</Text>

        {data.topics.length > 0 ? (
          <View style={styles.topicsContainer}>
            {data.topics.map((topic, index) => (
              <TopicCard
                key={index}
                title={topic}
                icon="bookmarks"
                color={TOPIC_COLORS[index % TOPIC_COLORS.length]}
                onPress={() => handleTopicPress(topic)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="compass-outline" size={64} color="#C8C8D8" />
            <Text style={styles.emptyTitle}>No topics selected yet</Text>
            <Text style={styles.emptyText}>
              Visit your profile to update your interests and get personalized support.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.emptyButtonText}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#E8E8F0',
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B6B85',
    marginBottom: 6,
  },
  name: {
    fontSize: 38,
    fontWeight: '800',
    color: '#2D2D44',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F5F3FF',
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E8E0FF',
  },
  roleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7B68EE',
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D2D44',
    marginBottom: 24,
  },
  topicsContainer: {
    gap: 18,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#E8E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  topicIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topicTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D44',
    lineHeight: 28,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D2D44',
    marginTop: 24,
    marginBottom: 14,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B6B85',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  emptyButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#7B68EE',
    borderRadius: 20,
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
