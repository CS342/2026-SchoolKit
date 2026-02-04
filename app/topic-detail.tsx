import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BookmarkButton } from '../components/BookmarkButton';
import { DownloadButton } from '../components/DownloadButton';
import { COLORS, SHADOWS, RADII, TYPOGRAPHY, withOpacity } from '../constants/onboarding-theme';

const TOPIC_COLORS = [COLORS.primary, COLORS.studentK8, COLORS.staff, COLORS.error];

export default function TopicDetailScreen() {
  const router = useRouter();
  const { title, id } = useLocalSearchParams<{ title: string; id: string }>();

  const resourceId = id || title || '';

  const colorIndex = Math.abs(title?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0);
  const color = TOPIC_COLORS[colorIndex % TOPIC_COLORS.length];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${title}" on SchoolKit — a resource to help students and families navigate school during cancer treatment.`,
      });
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: withOpacity(color, 0.03) }]}>
      <View style={[styles.header, { borderBottomColor: color }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.textDark} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color={COLORS.textMuted} />
          </TouchableOpacity>
          <DownloadButton resourceId={resourceId} size={24} />
          <BookmarkButton resourceId={resourceId} color={color} size={26} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Resources</Text>
          <View style={styles.resourceItem}>
            <View style={[styles.resourceIcon, { backgroundColor: withOpacity(color, 0.082) }]}>
              <Ionicons name="document-text" size={24} color={color} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Getting Started Guide</Text>
              <Text style={styles.resourceSubtitle}>Learn the basics</Text>
            </View>
          </View>
          <View style={styles.resourceItem}>
            <View style={[styles.resourceIcon, { backgroundColor: withOpacity(color, 0.082) }]}>
              <Ionicons name="people" size={24} color={color} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Community Support</Text>
              <Text style={styles.resourceSubtitle}>Connect with others</Text>
            </View>
          </View>
          <View style={styles.resourceItem}>
            <View style={[styles.resourceIcon, { backgroundColor: withOpacity(color, 0.082) }]}>
              <Ionicons name="bulb" size={24} color={color} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Tips & Strategies</Text>
              <Text style={styles.resourceSubtitle}>Practical advice</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackgroundAlt,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
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
    backgroundColor: COLORS.white,
    borderRadius: RADII.cardLarge,
    padding: 28,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.borderCard,
    alignItems: 'center',
    ...SHADOWS.cardLarge,
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
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
    lineHeight: 34,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  description: {
    ...TYPOGRAPHY.bodyDescription,
    color: COLORS.textMuted,
    lineHeight: 26,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.borderCard,
    ...SHADOWS.card,
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  resourceSubtitle: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textLight,
  },
});
