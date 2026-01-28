import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ALL_RESOURCES = [
  { id: 1, title: 'What you might experience', category: 'Student Support', icon: 'medical', color: '#7B68EE' },
  { id: 2, title: 'Friends and social life', category: 'Student Support', icon: 'people', color: '#0EA5E9' },
  { id: 3, title: 'Dealing with feelings', category: 'Student Support', icon: 'heart', color: '#66D9A6' },
  { id: 4, title: 'Keeping up with school during treatment', category: 'Student Support', icon: 'school', color: '#EF4444' },
  { id: 5, title: 'Getting back to school after treatment', category: 'Student Support', icon: 'return-down-back', color: '#7B68EE' },
  { id: 6, title: 'Coping with stress and emotions', category: 'Student Support', icon: 'sunny', color: '#0EA5E9' },
  { id: 7, title: 'Supporting my child during treatment', category: 'Parent Support', icon: 'heart-circle', color: '#66D9A6' },
  { id: 8, title: 'Becoming a strong advocate for my child', category: 'Parent Support', icon: 'megaphone', color: '#EF4444' },
  { id: 9, title: 'Collaborating with the school team', category: 'Parent Support', icon: 'people-circle', color: '#7B68EE' },
  { id: 10, title: 'Working with healthcare providers', category: 'Parent Support', icon: 'medical', color: '#0EA5E9' },
];

interface ResourceCardProps {
  title: string;
  category: string;
  icon: string;
  color: string;
  onPress: () => void;
}

function ResourceCard({ title, category, icon, color, onPress }: ResourceCardProps) {
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
          <Ionicons name={icon as any} size={32} color={color} />
        </View>
        <View style={styles.resourceContent}>
          <Text style={styles.resourceTitle}>{title}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: color + '15' }]}>
            <Text style={[styles.resourceCategory, { color }]}>{category}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={28} color={color} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = ALL_RESOURCES.filter(resource =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleResourcePress = (title: string) => {
    router.push(`/topic-detail?title=${encodeURIComponent(title)}` as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search Resources</Text>
        <Text style={styles.headerSubtitle}>Find support and information</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={22} color="#8E8EA8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search topics..."
          placeholderTextColor="#A8A8B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={22} color="#8E8EA8" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {searchQuery.length > 0 && (
          <Text style={styles.resultsText}>
            {filteredResources.length} {filteredResources.length === 1 ? 'result' : 'results'}
          </Text>
        )}

        <View style={styles.resourcesContainer}>
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              title={resource.title}
              category={resource.category}
              icon={resource.icon}
              color={resource.color}
              onPress={() => handleResourcePress(resource.title)}
            />
          ))}
        </View>

        {filteredResources.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={72} color="#C8C8D8" />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>Try searching with different keywords</Text>
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
    paddingBottom: 24,
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
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B6B85',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#E8E8F0',
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 18,
    fontWeight: '500',
    color: '#2D2D44',
  },
  clearButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7B68EE',
    marginBottom: 20,
  },
  resourcesContainer: {
    gap: 16,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
    fontSize: 19,
    fontWeight: '700',
    color: '#2D2D44',
    marginBottom: 8,
    lineHeight: 26,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  resourceCategory: {
    fontSize: 14,
    fontWeight: '700',
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
    fontSize: 18,
    fontWeight: '500',
    color: '#6B6B85',
    textAlign: 'center',
    lineHeight: 26,
  },
});
