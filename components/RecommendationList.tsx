import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useStories, Story } from '../contexts/StoriesContext';
import { useTheme } from '../contexts/ThemeContext';
import type { Resource } from '../constants/resources';
import { useResources } from '../hooks/useResources';
import { COLORS, TYPOGRAPHY, RADII } from '../constants/onboarding-theme';
import { AppTheme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface RecommendationListProps {
  currentId: string;
  currentTags: string[];
  /** Resources not to recommend — e.g. guides the page already links. */
  excludeIds?: string[];
  /** 'rail' = compact vertical list for a web sidebar rail. */
  variant?: 'default' | 'rail';
}

type RecommendedItem = 
  | { type: 'story'; item: Story; score: number }
  | { type: 'resource'; item: Resource; score: number };

const { width } = Dimensions.get('window');
// Capped so cards stay phone-sized in wide windows (e.g. the editor's mobile preview).
const CARD_WIDTH = Math.min(width * 0.75, 300);

export function RecommendationList({ currentId, currentTags, excludeIds, variant = 'default' }: RecommendationListProps) {
  const router = useRouter();
  const { stories } = useStories();
  const { colors, isDark } = useTheme();
  // The Library's cards for this viewer: published pages included (and in place of the
  // built-in guides they replace), already filtered to the viewer's audience.
  const { resources } = useResources();

  const styles = React.useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const recommendations = useMemo(() => {
    const lowercaseCurrentTags = (currentTags || []).map(t => t.toLowerCase());

    const items: RecommendedItem[] = [];
    const excluded = new Set(excludeIds ?? []);

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
    resources.forEach(resource => {
      if (resource.id === currentId || resource.designOnly || excluded.has(resource.id)) return;
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
      const existingIds = new Set([...items.map(i => i.item.id), ...excluded]);
      existingIds.add(currentId);

      for (const resource of resources) {
        if (!existingIds.has(resource.id) && !resource.designOnly) {
          items.push({ type: 'resource', item: resource, score: 0 });
          existingIds.add(resource.id);
        }
        if (items.length >= 4) break;
      }
    }

    return items.slice(0, 4);
  }, [currentId, currentTags, excludeIds, stories, resources]);

  if (recommendations.length === 0) {
    return null;
  }

  // Compact vertical list for a web rail.
  if (variant === 'rail') {
    return (
      <View>
        <Text style={[styles.railHeader, { color: colors.textLight }]}>You may also find helpful</Text>
        <View style={{ gap: 10 }}>
          {recommendations.map((rec) => {
            const isStory = rec.type === 'story';
            const story = isStory ? (rec.item as Story) : null;
            const resource = !isStory ? (rec.item as Resource) : null;
            const label = isStory ? 'Story' : resource!.category;
            const tint = isStory ? colors.primary : resource!.color;
            const icon = isStory ? 'book-outline' : (resource!.icon as any);
            const title = isStory ? story!.title : resource!.title;
            return (
              <Pressable
                key={`${rec.type}-${rec.item.id}`}
                style={[styles.railCard, { backgroundColor: colors.white, borderColor: colors.borderCard }]}
                onPress={() => router.push((isStory ? `/story-detail?id=${story!.id}` : resource!.route) as any)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${title}`}
              >
                <View style={styles.cardHeader}>
                  <Ionicons name={icon} size={14} color={tint} style={styles.icon} />
                  <Text style={[styles.cardType, { color: tint }]}>{label}</Text>
                </View>
                <Text style={[styles.railTitle, { color: colors.textDark }]} numberOfLines={2}>{title}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, '#E150F4', '#FF7A9F', '#FFAE73', '#FFE770']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBar}
      />
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
                accessibilityRole="button"
                accessibilityLabel={`Read story: ${story.title}`}
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
                accessibilityRole="button"
                accessibilityLabel={`Open resource: ${resource.title}`}
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

function makeStyles(c: AppTheme['colors'], isDark: boolean) {
  return StyleSheet.create({
  container: {
    marginVertical: 24,
    backgroundColor: isDark ? c.backgroundLight : '#F8F8FA',
    paddingTop: 24,
    paddingBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  gradientBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: c.textDark,
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
    backgroundColor: c.white,
    borderRadius: RADII.card,
    padding: 16,
    borderWidth: 1.5,
    borderColor: isDark ? c.borderCard : '#E5E5EA',
    shadowColor: isDark ? '#000' : '#2D2D44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.03,
    shadowRadius: 10,
    elevation: 4,
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
    color: c.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: c.textDark,
    marginBottom: 6,
    lineHeight: 22,
  },
  cardSubtitle: {
    fontSize: 14,
    color: c.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagRow: {
    marginTop: 'auto',
  },
  tagText: {
    fontSize: 12,
    color: c.textLight,
    fontWeight: '500',
  },
  railHeader: {
    ...TYPOGRAPHY.overline,
    marginBottom: 10,
  },
  railCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  railTitle: {
    ...TYPOGRAPHY.caption,
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
});
}
