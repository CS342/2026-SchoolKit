import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BookmarkButton } from "../../components/BookmarkButton";
import { DownloadIndicator } from "../../components/DownloadIndicator";

const ALL_RESOURCES = [
  {
    id: "1",
    title: "What you might experience",
    category: "Health",
    tags: ["health", "treatment"],
    icon: "medical",
    color: "#7B68EE",
  },
  {
    id: "2",
    title: "Friends and social life",
    category: "Social",
    tags: ["social", "friends"],
    icon: "people",
    color: "#0EA5E9",
  },
  {
    id: "3",
    title: "Dealing with feelings",
    category: "Emotions",
    tags: ["emotions", "feelings"],
    icon: "heart",
    color: "#66D9A6",
  },
  {
    id: "4",
    title: "Keeping up with school during treatment",
    category: "School",
    tags: ["school", "academics"],
    icon: "school",
    color: "#EF4444",
  },
  {
    id: "5",
    title: "Getting back to school after treatment",
    category: "School",
    tags: ["school", "transition"],
    icon: "return-down-back",
    color: "#7B68EE",
  },
  {
    id: "6",
    title: "Coping with stress and emotions",
    category: "Emotions",
    tags: ["emotions", "stress"],
    icon: "sunny",
    color: "#0EA5E9",
  },
  {
    id: "7",
    title: "Supporting my child during treatment",
    category: "Family",
    tags: ["family", "support"],
    icon: "heart-circle",
    color: "#66D9A6",
  },
  {
    id: "8",
    title: "Becoming a strong advocate for my child",
    category: "Family",
    tags: ["advocacy", "family"],
    icon: "megaphone",
    color: "#EF4444",
  },
  {
    id: "9",
    title: "Collaborating with the school team",
    category: "School",
    tags: ["school", "collaboration"],
    icon: "people-circle",
    color: "#7B68EE",
  },
  {
    id: "10",
    title: "Working with healthcare providers",
    category: "Health",
    tags: ["health", "medical"],
    icon: "medical",
    color: "#0EA5E9",
  },
  {
    id: "11",
    title: "Understanding What Cancer Is and Isn't",
    category: "Health",
    tags: ["cancer", "understanding", "myths", "facts"],
    icon: "information-circle",
    color: "#3B82F6",
    route: '/understanding-cancer',
  },
];

const CATEGORIES = ["All", "Emotions", "School", "Social", "Health", "Family"];
const RECENT_SEARCHES_KEY = "@schoolkit_recent_searches";
const MAX_RECENT_SEARCHES = 5;

interface ResourceCardProps {
  id: string;
  title: string;
  category: string;
  icon: string;
  color: string;
  onPress: () => void;
}

function ResourceCard({
  id,
  title,
  category,
  icon,
  color,
  onPress,
}: ResourceCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
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
          styles.resourceCard,
          {
            borderLeftColor: color,
            borderLeftWidth: 8,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.resourceIcon, { backgroundColor: color + "20" }]}>
          <Ionicons name={icon as any} size={42} color={color} />
        </View>
        <View style={styles.resourceContent}>
          <Text style={styles.resourceTitle}>{title}</Text>
          <View
            style={[styles.categoryBadge, { backgroundColor: color + "15" }]}
          >
            <Text style={[styles.resourceCategory, { color }]}>{category}</Text>
          </View>
        </View>
        <View style={styles.resourceActions}>
          <DownloadIndicator resourceId={id} />
          <BookmarkButton resourceId={id} color={color} />
          <Ionicons name="chevron-forward" size={30} color={color} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  };

  const addRecentSearch = async (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
      setShowRecentSearches(false);
    }
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
    setShowRecentSearches(false);
    addRecentSearch(query);
  };

  const filteredResources = ALL_RESOURCES.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleResourcePress = (id: string, title: string, route?: string) => {
    if (route) {
        router.push(route as any);
    } else {
        router.push(
        `/topic-detail?title=${encodeURIComponent(title)}&id=${id}` as any
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search Resources</Text>
        <Text style={styles.headerSubtitle}>Find support and information</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={22}
            color="#8E8EA8"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics..."
            placeholderTextColor="#A8A8B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setShowRecentSearches(true)}
            onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={22} color="#8E8EA8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Recent Searches */}
        {showRecentSearches &&
          recentSearches.length > 0 &&
          searchQuery.length === 0 && (
            <View style={styles.recentSearchesContainer}>
              <View style={styles.recentSearchesHeader}>
                <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearRecentText}>Clear</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.recentSearchesScroll}
              >
                {recentSearches.map((query, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentSearchChip}
                    onPress={() => handleRecentSearchPress(query)}
                  >
                    <Ionicons name="time-outline" size={16} color="#7B68EE" />
                    <Text style={styles.recentSearchText}>{query}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                selectedCategory === category && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === category && styles.filterChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {searchQuery.length > 0 && (
          <Text style={styles.resultsText}>
            {filteredResources.length}{" "}
            {filteredResources.length === 1 ? "result" : "results"}
          </Text>
        )}

        <View style={styles.resourcesContainer}>
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              id={resource.id}
              title={resource.title}
              category={resource.category}
              icon={resource.icon}
              color={resource.color}
              onPress={() => handleResourcePress(resource.id, resource.title, (resource as any).route)}
            />
          ))}
        </View>

        {filteredResources.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={72} color="#C8C8D8" />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>
              Try searching with different keywords
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF9FF",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 2,
    borderBottomColor: "#E8E8F0",
    shadowColor: "#7B68EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: "800",
    color: "#2D2D44",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B6B85",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#E8E8F0",
    shadowColor: "#7B68EE",
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
    fontWeight: "500",
    color: "#2D2D44",
  },
  clearButton: {
    padding: 4,
  },
  recentSearchesContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  recentSearchesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recentSearchesTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B6B85",
  },
  clearRecentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7B68EE",
  },
  recentSearchesScroll: {
    flexDirection: "row",
  },
  recentSearchChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E8E0FF",
  },
  recentSearchText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7B68EE",
    marginLeft: 6,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 24,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E8E8F0",
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: "#7B68EE",
    borderColor: "#7B68EE",
  },
  filterChipText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B6B85",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#7B68EE",
    marginBottom: 20,
    marginHorizontal: 24,
  },
  resourcesContainer: {
    gap: 16,
    marginHorizontal: 24,
  },
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#E8E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  resourceIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
    shadowColor: "#000",
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
    fontWeight: "700",
    color: "#2D2D44",
    marginBottom: 8,
    lineHeight: 28,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  resourceCategory: {
    fontSize: 12,
    fontWeight: "700",
  },
  resourceActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2D2D44",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#6B6B85",
    textAlign: "center",
    lineHeight: 26,
  },
});
