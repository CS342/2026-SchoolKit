import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { BookmarkButton } from '../../components/BookmarkButton';
import { DownloadIndicator } from '../../components/DownloadIndicator';
import { useOffline } from '../../contexts/OfflineContext';

// Resource data - same as search.tsx for consistency
const ALL_RESOURCES = [
  { id: '1', title: 'What you might experience', category: 'Health', icon: 'medical', color: '#7B68EE' },
  { id: '2', title: 'Friends and social life', category: 'Social', icon: 'people', color: '#0EA5E9' },
  { id: '3', title: 'Dealing with feelings', category: 'Emotions', icon: 'heart', color: '#66D9A6' },
  { id: '4', title: 'Keeping up with school during treatment', category: 'School', icon: 'school', color: '#EF4444' },
  { id: '5', title: 'Getting back to school after treatment', category: 'School', icon: 'return-down-back', color: '#7B68EE' },
  { id: '6', title: 'Coping with stress and emotions', category: 'Emotions', icon: 'sunny', color: '#0EA5E9' },
  { id: '7', title: 'Supporting my child during treatment', category: 'Family', icon: 'heart-circle', color: '#66D9A6' },
  { id: '8', title: 'Becoming a strong advocate for my child', category: 'Family', icon: 'megaphone', color: '#EF4444' },
  { id: '9', title: 'Collaborating with the school team', category: 'School', icon: 'people-circle', color: '#7B68EE' },
  { id: '10', title: 'Working with healthcare providers', category: 'Health', icon: 'medical', color: '#0EA5E9' },
];

interface ResourceCardProps {
  id: string;
  title: string;
  category: string;
  icon: string;
  color: string;
  onPress: () => void;
  showBookmark?: boolean;
}

function ResourceCard({ id, title, category, icon, color, onPress, showBookmark = true }: ResourceCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <Animated.View
        style={[
          styles.resourceCard,
          { borderLeftColor: color, borderLeftWidth: 8, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.resourceIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={42} color={color} />
        </View>
        <View style={styles.resourceContent}>
          <Text style={styles.resourceTitle}>{title}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: color + '15' }]}>
            <Text style={[styles.resourceCategory, { color }]}>{category}</Text>
          </View>
        </View>
        <View style={styles.resourceActions}>
          <DownloadIndicator resourceId={id} />
          {showBookmark && <BookmarkButton resourceId={id} color={color} />}
          <Ionicons name="chevron-forward" size={30} color={color} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

type TabType = 'saved' | 'downloaded';

export default function BookmarksScreen() {
  const router = useRouter();
  const { bookmarksWithTimestamps, downloads } = useOnboarding();
  const { isOnline } = useOffline();
  const [activeTab, setActiveTab] = useState<TabType>('saved');

  // When offline, force Downloaded tab
  useEffect(() => {
    if (!isOnline) {
      setActiveTab('downloaded');
    }
  }, [isOnline]);

  // Get bookmarked resources sorted by most recently saved
  const bookmarkedResources = bookmarksWithTimestamps
    .map(b => {
      const resource = ALL_RESOURCES.find(r => r.id === b.resourceId);
      return resource ? { ...resource, savedAt: b.savedAt } : null;
    })
    .filter((r): r is typeof ALL_RESOURCES[0] & { savedAt: number } => r !== null);

  // Get downloaded resources
  const downloadedResources = downloads
    .map(id => ALL_RESOURCES.find(r => r.id === id))
    .filter((r): r is typeof ALL_RESOURCES[0] => r !== undefined);

  const handleResourcePress = (id: string, title: string) => {
    router.push(`/topic-detail?title=${encodeURIComponent(title)}&id=${id}` as any);
  };

  const currentResources = activeTab === 'saved' ? bookmarkedResources : downloadedResources;
  const emptyIcon = activeTab === 'saved' ? 'bookmark-outline' : 'cloud-download-outline';
  const emptyTitle = activeTab === 'saved' ? 'No saved resources yet' : 'No downloaded resources';
  const emptyText = activeTab === 'saved'
    ? 'Tap the bookmark icon on any resource to save it here for quick access.'
    : 'Download resources from topic pages to access them offline.';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Resources</Text>
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <Ionicons name="cloud-offline" size={14} color="#F59E0B" />
            <Text style={styles.offlineBadgeText}>Offline</Text>
          </View>
        )}
      </View>

      {/* Tab Selector - hidden when offline */}
      {isOnline && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons
              name={activeTab === 'saved' ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={activeTab === 'saved' ? '#7B68EE' : '#8E8EA8'}
            />
            <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
              Saved ({bookmarkedResources.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'downloaded' && styles.tabActive]}
            onPress={() => setActiveTab('downloaded')}
          >
            <Ionicons
              name={activeTab === 'downloaded' ? 'cloud-done' : 'cloud-download-outline'}
              size={20}
              color={activeTab === 'downloaded' ? '#7B68EE' : '#8E8EA8'}
            />
            <Text style={[styles.tabText, activeTab === 'downloaded' && styles.tabTextActive]}>
              Downloaded ({downloadedResources.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {currentResources.length > 0 ? (
          <View style={styles.resourcesContainer}>
            {currentResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                id={resource.id}
                title={resource.title}
                category={resource.category}
                icon={resource.icon}
                color={resource.color}
                onPress={() => handleResourcePress(resource.id, resource.title)}
                showBookmark={activeTab === 'saved'}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name={emptyIcon as any} size={80} color="#C8C8D8" />
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyText}>{emptyText}</Text>
            {isOnline && (
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push('/(tabs)/search')}
                activeOpacity={0.8}
              >
                <Ionicons name="search" size={20} color="#FFFFFF" />
                <Text style={styles.browseButtonText}>Browse Resources</Text>
              </TouchableOpacity>
            )}
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
  headerTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#2D2D44',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  offlineBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#7B68EE',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8EA8',
  },
  tabTextActive: {
    color: '#7B68EE',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  resourcesContainer: {
    gap: 16,
  },
  resourceCard: {
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
  resourceIcon: {
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
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D44',
    marginBottom: 8,
    lineHeight: 28,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  resourceCategory: {
    fontSize: 12,
    fontWeight: '700',
  },
  resourceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D2D44',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#6B6B85',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B68EE',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 24,
    gap: 10,
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  browseButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
