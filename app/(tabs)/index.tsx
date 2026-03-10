import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { getRoleDisplayName, getSchoolStatusText } from '../../utils/profile';
import { ResourceCard } from '../../components/ResourceCard';
import { WebResourceTile, WEB_GRID_GAP, WEB_GRID_COLS } from '../../components/WebResourceTile';
import { PrimaryButton } from '../../components/onboarding/PrimaryButton';
import { useResources } from '../../hooks/useResources';
import { useResponsive } from '../../hooks/useResponsive';
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

  const { resources } = useResources();
  const { colors, appStyles, sharedStyles } = useTheme();
  const { isWeb, isDesktop } = useResponsive();
  const isWebDesktop = isWeb && isDesktop;

  const [gridWidth, setGridWidth] = useState(0);
  const tileSize = gridWidth > 0
    ? Math.floor((gridWidth - WEB_GRID_GAP * (WEB_GRID_COLS - 1)) / WEB_GRID_COLS)
    : 0;

  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const handleTopicPress = (topic: string, route?: string) => {
    if (route) {
      router.push(route as any);
    } else {
      router.push(`/topic-detail?title=${encodeURIComponent(topic)}`);
    }
  };

  const styles = useMemo(() => makeStyles(colors, isWebDesktop), [colors, isWebDesktop]);

  return (
    <View style={styles.container}>
      <Animated.View style={[appStyles.tabHeader, { paddingTop: insets.top + 10 }, headerStyle]}>
        <View style={styles.headerRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            {data.profilePicture ? (
              <Image source={{ uri: data.profilePicture }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarInitial, { color: '#FFF' }]}>
                {data.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[appStyles.tabHeaderSubtitle, { marginBottom: 4 }]}>Welcome back,</Text>
            <Text style={[appStyles.tabHeaderTitle, { marginBottom: 12 }]}>{data.name}!</Text>
          </View>
        </View>
        <View style={styles.badgeRow}>
          <View style={[sharedStyles.badge, styles.roleBadge]}>
            <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
            <Text style={[sharedStyles.badgeText, styles.roleBadgeText]}>
              {getRoleDisplayName(data.role, 'User')}
            </Text>
          </View>
          {(() => {
            const schoolStatus = getSchoolStatusText(data.schoolStatuses);
            return schoolStatus !== 'Not set' ? (
              <View style={[sharedStyles.badge, styles.roleBadge]}>
                <Ionicons name="school-outline" size={16} color={colors.primary} />
                <Text style={[sharedStyles.badgeText, styles.roleBadgeText]}>{schoolStatus}</Text>
              </View>
            ) : null;
          })()}
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Your Support Topics</Text>

        {data.topics.length > 0 ? (
          <View
            style={styles.topicsContainer}
            onLayout={isWebDesktop ? (e) => setGridWidth(e.nativeEvent.layout.width) : undefined}
          >
            {data.topics.map((topic, index) => {
              const resource = resources.find(r => r.title.toLowerCase() === topic.toLowerCase());
              const color = resource?.color || colors.primary;
              const icon = resource?.icon || 'bookmarks';

              return isWebDesktop && tileSize > 0 ? (
                <WebResourceTile
                  key={index}
                  id={resource?.id || topic}
                  title={topic}
                  icon={icon}
                  color={color}
                  category={resource?.category}
                  onPress={() => handleTopicPress(topic, resource?.route)}
                  tileSize={tileSize}
                />
              ) : (
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

const makeStyles = (c: typeof import('../../constants/theme').COLORS_LIGHT, isWebDesktop: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 4,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0,
    },
    avatarImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    avatarInitial: {
      fontSize: 20,
      fontWeight: '700',
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap' as const,
      gap: 8,
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
    topicsContainer: isWebDesktop
      ? { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: WEB_GRID_GAP }
      : { gap: SPACING.itemGap },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 16,
    },
  });
