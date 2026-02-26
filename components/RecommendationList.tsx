import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useStories, Story } from '../contexts/StoriesContext';
import { ALL_RESOURCES, Resource } from '../constants/resources';
import { COLORS, TYPOGRAPHY, SHADOWS, RADII, withOpacity } from '../constants/onboarding-theme';
import { Ionicons } from '@expo/vector-icons';

interface RecommendationListProps {
  currentId: string;
  currentTags: string[];
}

type RecommendedItem = 
  | { type: 'story'; item: Story; score: number }
  | { type: 'resource'; item: Resource; score: number };

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

export function RecommendationList({ currentId, currentTags }: RecommendationListProps) {
  const router = useRouter();
  const { stories } = useStories();

  const recommendations = useMemo(() => {
    const lowercaseCurrentTags = (currentTags || []).map(t => t.toLowerCase());

    const items: RecommendedItem[] = [];

    // Calculate score for stories
    stories.forEach(story => {
      if (story.id === currentId || story.status !== 'approved') return;
      const storyTags = story.story_tags || [];
      const lowerStoryTags = storyTags.map(t => t.toLowerCase());
      const intersection = lowercaseCurrentTags.filter(t => lowerStoryTags.includes(t));
      
      if (intersection.length > 0) {
        items.push({ type: 'story', item: story, score: intersection.length });
      }
    });

    // Calculate score for resources
    ALL_RESOURCES.forEach(resource => {
      if (resource.id === currentId || resource.designOnly) return;
      const resourceTags = resource.tags || [];
      const lowerResourceTags = resourceTags.map(t => t.toLowerCase());
      const intersection = lowercaseCurrentTags.filter(t => lowerResourceTags.includes(t));

      if (intersection.length > 0) {
        items.push({ type: 'resource', item: resource, score: intersection.length });
      }
    });

    // Sort by score descending
    items.sort((a, b) => b.score - a.score);

    // Backfill with other resources if we have fewer than 4
    if (items.length < 4) {
      const existingIds = new Set(items.map(i => i.item.id));
      existingIds.add(currentId);

      for (const resource of ALL_RESOURCES) {
        if (!existingIds.has(resource.id) && !resource.designOnly) {
          items.push({ type: 'resource', item: resource, score: 0 });
          existingIds.add(resource.id);
        }
        if (items.length >= 4) break;
      }
    }

    return items.slice(0, 4);
  }, [currentId, currentTags, stories]);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>You may also find helpful:</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + 14}
        decelerationRate="fast"
      >
        {recommendations.map((rec, index) => {
          if (rec.type === 'story') {
            const story = rec.item as Story;
            return (
              <Pressable 
                key={`story-${story.id}`} 
                style={styles.card}
                onPress={() => router.push(`/story-detail?id=${story.id}` as any)}
              >
                <View style={styles.cardHeader}>
                  <Ionicons name="book-outline" size={16} color={COLORS.primary} style={styles.icon} />
                  <Text style={styles.cardType}>Story</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{story.title}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>{story.body}</Text>
                {story.story_tags && story.story_tags.length > 0 && (
                  <View style={styles.tagRow}>
                    <Text style={styles.tagText}>#{story.story_tags[0]}</Text>
                  </View>
                )}
              </Pressable>
            );
          } else {
            const resource = rec.item as Resource;
            return (
              <Pressable 
                key={`resource-${resource.id}`} 
                style={styles.card}
                onPress={() => router.push(resource.route as any)}
              >
                <View style={styles.cardHeader}>
                  <Ionicons name={resource.icon as any} size={16} color={resource.color} style={styles.icon} />
                  <Text style={[styles.cardType, { color: resource.color }]}>{resource.category}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{resource.title}</Text>
              </Pressable>
            );
          }
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
    backgroundColor: '#F8F8FA',
    paddingTop: 24,
    paddingBottom: 24,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: '#1A1A2E',
    marginBottom: 16,
    paddingHorizontal: 20,
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 6,
  },
  cardType: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: COLORS.textDark,
    marginBottom: 6,
    lineHeight: 22,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagRow: {
    marginTop: 'auto',
  },
  tagText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.badgeSmall,
    marginTop: 'auto',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
