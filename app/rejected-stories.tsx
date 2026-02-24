import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStories, Story } from '../contexts/StoriesContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { StoryCard } from '../components/StoryCard';
import { COLORS, RADII, BORDERS, SPACING, TYPOGRAPHY } from '../constants/onboarding-theme';

export default function RejectedStoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stories, deleteStory } = useStories();
  const { user } = useAuth();
  const { colors, appStyles, sharedStyles } = useTheme();

  const rejectedStories = useMemo(() => {
    if (!user) return [];
    return stories.filter(s => s.author_id === user.id && s.status === 'rejected');
  }, [stories, user]);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
        <Pressable style={appStyles.editBackButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={appStyles.editHeaderTitle}>Rejected Stories</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={rejectedStories}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <StoryCard story={item} index={index} showAuthorStatus={true} showRejectedNorms={true} />
        )}
        contentContainerStyle={styles.scrollContent}
        ItemSeparatorComponent={null}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.successText} />
            <Text style={[sharedStyles.pageTitle, { marginTop: 16 }]}>All Clear!</Text>
            <Text style={sharedStyles.pageSubtitle}>You have no rejected stories.</Text>
          </View>
        }
      />
    </View>
  );
}

const makeStyles = (c: typeof import('../constants/theme').COLORS_LIGHT) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    scrollContent: {
      padding: SPACING.screenPadding,
      paddingBottom: 40,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 60,
    },
  });
