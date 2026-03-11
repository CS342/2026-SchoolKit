import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BookmarkButton } from '../components/BookmarkButton';
import { DownloadButton } from '../components/DownloadButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, RADII, TYPOGRAPHY, withOpacity } from '../constants/onboarding-theme';
import { useAccomplishments } from '../contexts/AccomplishmentContext';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const TOPIC_COLORS = [COLORS.primary, COLORS.studentK8, COLORS.staff, COLORS.error];

export default function TopicDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { title, id } = useLocalSearchParams<{ title: string; id: string }>();
  const { colors, isDark, fontScale } = useTheme();
  const { fireResourceOpened, fireResourceScrolledToEnd, fireEvent } = useAccomplishments();
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [checkingDesign, setCheckingDesign] = useState(true);
  const styles = useMemo(() => makeStyles(colors, isDark, fontScale), [colors, isDark, fontScale]);

  // Check if this topic has a published custom design and redirect to the design viewer
  useEffect(() => {
    async function checkForDesign() {
      try {
        // Strategy 1: If we have a resource ID, check resources table for design_id
        if (id) {
          const { data: resource } = await supabase
            .from('resources')
            .select('design_id')
            .eq('id', id)
            .single();

          if (resource?.design_id) {
            router.replace(`/design-view/${resource.design_id}?resourceId=${id}` as any);
            return;
          }
        }

        // Strategy 2: Search designs table by title for a published design
        if (title) {
          const { data: designs } = await supabase
            .from('designs')
            .select('id, published_resource_id')
            .eq('title', title)
            .not('published_resource_id', 'is', null)
            .limit(1);

          if (designs && designs.length > 0) {
            router.replace(`/design-view/${designs[0].id}?resourceId=${id}` as any);
            return;
          }

          // Strategy 3: Search designs by title even if not formally published
          // (covers case where design exists but publish to resources table failed)
          const { data: anyDesigns } = await supabase
            .from('designs')
            .select('id')
            .eq('title', title)
            .order('updated_at', { ascending: false })
            .limit(1);

          if (anyDesigns && anyDesigns.length > 0) {
            router.replace(`/design-view/${anyDesigns[0].id}?resourceId=${id}` as any);
            return;
          }
        }
      } catch {
        // Fall through to default template
      }
      setCheckingDesign(false);
    }

    checkForDesign();
  }, [id, title]);

  const resourceId = id || '';
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (!resourceId || scrolledToEnd || layoutHeight === 0 || contentHeight === 0) return;
    if (layoutHeight >= contentHeight - 40) {
      setScrolledToEnd(true);
      fireResourceScrolledToEnd(resourceId);
    }
  }, [layoutHeight, contentHeight, resourceId, scrolledToEnd, fireResourceScrolledToEnd]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (resourceId) fireResourceOpened(resourceId);
    }, 10_000);
    return () => clearTimeout(timer);
  }, [resourceId]);

  const handleScroll = ({ nativeEvent }: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    if (!scrolledToEnd && layoutMeasurement.height + contentOffset.y >= contentSize.height - 40) {
      setScrolledToEnd(true);
      if (resourceId) fireResourceScrolledToEnd(resourceId);
    }
  };

  const colorIndex = Math.abs(title?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0);
  const color = TOPIC_COLORS[colorIndex % TOPIC_COLORS.length];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${title}" on SchoolKit — a resource to help students and families navigate school during cancer treatment.`,
      });
      fireEvent('resource_shared');
    } catch { }
  };

  if (checkingDesign) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: withOpacity(color, 0.03) }]}>
      <View style={[styles.header, { borderBottomColor: color, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={28} color={COLORS.textDark} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton} accessibilityLabel="Share">
            <Ionicons name="share-outline" size={24} color={colors.textMuted} />
          </TouchableOpacity>
          <DownloadButton resourceId={resourceId} size={24} />
          <BookmarkButton resourceId={resourceId} color={color} size={26} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        onLayout={(e) => setLayoutHeight(e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => setContentHeight(h)}
      >
        <View style={[styles.titleCard, { borderLeftColor: color, borderLeftWidth: 6 }]}>
          <View style={[styles.iconContainer, { backgroundColor: withOpacity(color, 0.125) }]}>
            <Ionicons name="book" size={40} color={color} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this topic</Text>
          <Text style={styles.description}>
            This is a comprehensive resource about "{title}". Here you'll find helpful information,
            strategies, and support for navigating this aspect of your school journey.
          </Text>
        </View>

        <View style={[styles.section, { alignItems: 'center', paddingVertical: 32 }]}>
          <View style={[styles.resourceIcon, { backgroundColor: withOpacity(color, 0.082), width: 64, height: 64, borderRadius: 32, marginBottom: 16 }]}>
            <Ionicons name="construct-outline" size={32} color={color} />
          </View>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Content Coming Soon</Text>
          <Text style={[styles.description, { textAlign: 'center' }]}>
            We're working on creating detailed resources for this topic. Check back soon!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: any, isDark: boolean, fontScale = 1) => {
  const fs = (size: number) => Math.round(size * fontScale);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: isDark ? c.backgroundLight : c.white,
      borderBottomWidth: 3,
      shadowColor: isDark ? '#000' : COLORS.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    backButton: {
      padding: 4,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    shareButton: {
      padding: 8,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 40,
    },
    titleCard: {
      backgroundColor: isDark ? c.backgroundLight : c.white,
      borderRadius: RADII.cardLarge,
      padding: 28,
      marginBottom: 24,
      borderWidth: 2,
      borderColor: isDark ? c.borderCard : COLORS.borderCard,
      alignItems: 'center',
      shadowColor: isDark ? '#000' : COLORS.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.4 : 0.08,
      shadowRadius: 20,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: fs(26),
      fontWeight: '800',
      color: c.textDark,
      textAlign: 'center',
      lineHeight: fs(34),
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: fs(22),
      fontWeight: '800',
      color: c.textDark,
      marginBottom: 16,
    },
    description: {
      ...TYPOGRAPHY.bodyDescription,
      fontSize: fs(TYPOGRAPHY.bodyDescription.fontSize ?? 17),
      color: c.textMuted,
      lineHeight: fs(26),
    },
    resourceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? c.backgroundLight : c.white,
      padding: 20,
      borderRadius: 20,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: isDark ? c.borderCard : COLORS.borderCard,
      shadowColor: isDark ? '#000' : COLORS.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 8,
    },
    resourceIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    resourceContent: {
      flex: 1,
    },
    resourceTitle: {
      fontSize: fs(18),
      fontWeight: '700',
      color: c.textDark,
      marginBottom: 4,
    },
    resourceSubtitle: {
      ...TYPOGRAPHY.labelSmall,
      fontSize: fs(TYPOGRAPHY.labelSmall.fontSize ?? 15),
      color: c.textLight,
    },
  });
};
