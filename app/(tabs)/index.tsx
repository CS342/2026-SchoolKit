import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { ResourceCard } from '../../components/ResourceCard';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { ALL_RESOURCES } from '../../constants/resources';
import {
  TYPOGRAPHY,
  SIZING,
  SPACING,
} from '../../constants/onboarding-theme';
import { useTheme } from '../../contexts/ThemeContext';

export default function ForYouScreen() {
  const router = useRouter();
  const { data } = useOnboarding();
  const insets = useSafeAreaInsets();
  const { colors, appStyles, sharedStyles } = useTheme();
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const getRoleDisplayName = () => {
    switch (data.role) {
      case 'student-k8':
        return 'Student (Middle School)';
      case 'student-hs':
        return 'Student (High School and up)';
      case 'parent':
        return 'Parent/Caregiver';
      case 'staff':
        return 'School Staff';
      default:
        return 'User';
    }
  };

  const handleTopicPress = (topic: string, route?: string) => {
    if (route) {
      router.push(route as any);
    } else {
      router.push(`/topic-detail?title=${encodeURIComponent(topic)}`);
    }
  };

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Animated.View style={[appStyles.tabHeader, { paddingTop: insets.top + 10 }, headerStyle]}>
        <Text style={[appStyles.tabHeaderSubtitle, { marginBottom: 4 }]}>Welcome back,</Text>
        <Text style={[appStyles.tabHeaderTitle, { marginBottom: 12 }]}>{data.name}!</Text>
        <View style={[sharedStyles.badge, styles.roleBadge]}>
          <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
          <Text style={[sharedStyles.badgeText, styles.roleBadgeText]}>
            {getRoleDisplayName()}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Your Support Topics</Text>

        {data.topics.length > 0 ? (
          <View style={styles.topicsContainer}>
            {data.topics.map((topic, index) => {
              const resource = ALL_RESOURCES.find(r => r.title === topic);
              const color = resource?.color || colors.primary;
              const icon = resource?.icon || 'bookmarks';
              return (
                <ResourceCard
                  key={index}
                  id={resource?.id || topic}
                  title={topic}
                  icon={icon}
                  color={color}
                  onPress={() => handleTopicPress(topic, resource?.route)}
                  index={index}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={sharedStyles.pageIconCircle}>
              <Ionicons name="compass-outline" size={SIZING.iconPage} color={colors.primary} />
            </View>
            <Text style={sharedStyles.pageTitle}>No topics selected yet</Text>
            <Text style={[sharedStyles.pageSubtitle, { marginBottom: 28 }]}>
              Visit your profile to update your interests and get personalized support.
            </Text>
            <PrimaryButton
              title="Update Profile"
              onPress={() => router.push('/(tabs)/profile')}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: typeof import('../../constants/theme').COLORS_LIGHT) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
    },
    roleBadgeText: {
      marginLeft: 0,
    },
    scrollContent: {
      paddingHorizontal: SPACING.screenPadding,
      paddingTop: SPACING.sectionGap,
      paddingBottom: 40,
    },
    sectionTitle: {
      ...TYPOGRAPHY.h2,
      color: c.textDark,
      marginBottom: SPACING.sectionGap,
    },
    topicsContainer: {
      gap: SPACING.itemGap,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 16,
    },
  });
