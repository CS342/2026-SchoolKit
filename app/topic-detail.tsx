import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const TOPIC_COLORS = ['#7B68EE', '#0EA5E9', '#66D9A6', '#EF4444'];

export default function TopicDetailScreen() {
  const router = useRouter();
  const { title } = useLocalSearchParams<{ title: string }>();
  const colorIndex = Math.abs(title?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0);
  const color = TOPIC_COLORS[colorIndex % TOPIC_COLORS.length];

  return (
    <View style={[styles.container, { backgroundColor: color + '08' }]}>
      <View style={[styles.header, { borderBottomColor: color }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2D2D44" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Topic Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.titleCard, { borderLeftColor: color, borderLeftWidth: 6 }]}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
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
            <View style={[styles.resourceIcon, { backgroundColor: color + '15' }]}>
              <Ionicons name="document-text" size={24} color={color} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Getting Started Guide</Text>
              <Text style={styles.resourceSubtitle}>Learn the basics</Text>
            </View>
          </View>
          <View style={styles.resourceItem}>
            <View style={[styles.resourceIcon, { backgroundColor: color + '15' }]}>
              <Ionicons name="people" size={24} color={color} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Community Support</Text>
              <Text style={styles.resourceSubtitle}>Connect with others</Text>
            </View>
          </View>
          <View style={styles.resourceItem}>
            <View style={[styles.resourceIcon, { backgroundColor: color + '15' }]}>
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
    backgroundColor: '#F8F7FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D2D44',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  titleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E8E8F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
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
    color: '#2D2D44',
    textAlign: 'center',
    lineHeight: 34,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D2D44',
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    fontWeight: '500',
    color: '#6B6B85',
    lineHeight: 26,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E8E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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
    color: '#2D2D44',
    marginBottom: 4,
  },
  resourceSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8EA8',
  },
});
