import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useStories } from '../../contexts/StoriesContext';
import { StoryCard } from '../../components/StoryCard';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import {
  GRADIENTS,
  SHADOWS,
  SIZING,
  SPACING,
} from '../../constants/onboarding-theme';
import { useTheme } from '../../contexts/ThemeContext';

// Exporting StoriesScreen as default component
export default function StoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAnonymous } = useAuth();
  const { stories, storiesLoading, refreshStories } = useStories();
  const { colors, appStyles, sharedStyles } = useTheme();
  const headerOpacity = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshStories();
    setRefreshing(false);
  };

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Animated.View style={[appStyles.tabHeader, { paddingTop: insets.top + 10 }, headerStyle]}>
        <View style={styles.headerTitleRow}>
          <Text style={[appStyles.tabHeaderTitle, { marginBottom: 0 }]}>Stories</Text>
          <View style={[sharedStyles.badge, styles.countBadge]}>
            <Ionicons name="chatbubbles" size={14} color={colors.primary} />
            <Text style={sharedStyles.badgeText}>
              {stories.length} {stories.length === 1 ? 'story' : 'stories'}
            </Text>
          </View>
        </View>
        <Text style={appStyles.tabHeaderSubtitle}>Share your journey</Text>
      </Animated.View>

      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <StoryCard story={item} index={index} />
        )}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          storiesLoading ? null : (
            <View style={styles.emptyContainer}>
              <View style={sharedStyles.pageIconCircle}>
                <Ionicons name="chatbubbles-outline" size={SIZING.iconPage} color={colors.primary} />
              </View>
              <Text style={sharedStyles.pageTitle}>No stories yet</Text>
              <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
                Be the first to share your experience navigating cancer and school.
              </Text>
              {!isAnonymous && (
                <PrimaryButton
                  title="Share Your Story"
                  icon="create-outline"
                  onPress={() => router.push('/create-story' as any)}
                />
              )}
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: SPACING.itemGap }} />}
      />

      {/* FAB - only for logged-in users */}
      {!isAnonymous && stories.length > 0 && (
        <Pressable
          style={[styles.fab, SHADOWS.button]}
          onPress={() => router.push('/create-story' as any)}
        >
          <LinearGradient
            colors={[...GRADIENTS.primaryButton] as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (c: typeof import('../../constants/theme').COLORS_LIGHT) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    countBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    scrollContent: {
      paddingHorizontal: SPACING.screenPadding,
      paddingTop: SPACING.sectionGap,
      paddingBottom: 100,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 16,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    fabGradient: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
