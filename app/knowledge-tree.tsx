import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccomplishments } from '../contexts/AccomplishmentContext';
import { useTheme } from '../contexts/ThemeContext';
import { useResources } from '../hooks/useResources';
import { ANIMATION, COLORS, SHADOWS, TYPOGRAPHY } from '../constants/onboarding-theme';
import KnowledgeTree from '../components/tree/KnowledgeTree';

export default function KnowledgeTreeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isResourceFullyViewed } = useAccomplishments();
  const { isDark, colors } = useTheme();
  const { resources } = useResources();

  const litCount = resources.filter(r => isResourceFullyViewed(r.id)).length;

  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-12);

  useEffect(() => {
    headerOpacity.value = withDelay(
      ANIMATION.entranceDelay,
      withTiming(1, { duration: 300 }),
    );
    headerY.value = withDelay(
      ANIMATION.entranceDelay,
      withSpring(0, ANIMATION.springSmooth),
    );
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.appBackground }]}>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.white, borderColor: colors.border }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textDark }]}>Knowledge Tree</Text>
        <Text style={[styles.countBadge, { color: colors.textMuted }]}>
          {litCount} / {resources.length}
        </Text>
      </Animated.View>

      {/* Tree in a scroll view in case screen is short */}
      <ScrollView
        contentContainerStyle={styles.treeScroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <KnowledgeTree isResourceFullyViewed={isResourceFullyViewed} isDark={isDark} resources={resources} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    ...SHADOWS.small,
  },
  title: {
    flex: 1,
    ...TYPOGRAPHY.h2,
    letterSpacing: -0.4,
  },
  countBadge: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  treeScroll: {
    alignItems: 'center',
    paddingBottom: 24,
  },
});
