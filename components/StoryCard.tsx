import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Animated as RNAnimated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Story, useStories } from '../contexts/StoriesContext';
import { UserRole } from '../contexts/OnboardingContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, ANIMATION, SHADOWS } from '../constants/onboarding-theme';
import { AppTheme } from '../constants/theme';
import { CommunityNormsModal } from './CommunityNormsModal';

interface StoryCardProps {
  story: Story;
  index: number;
  allowModeration?: boolean;
  showAuthorStatus?: boolean;
  showRejectedNorms?: boolean;
}

const ALL_AUDIENCES = ['Students', 'Parents', 'School Staff'];

function getAudienceHint(targetAudiences?: string[]): string {
  if (!targetAudiences || !Array.isArray(targetAudiences) || targetAudiences.length === 0) return '';
  const tags = targetAudiences.filter(a => ALL_AUDIENCES.includes(a));
  const hasAll = ALL_AUDIENCES.every(a => tags.includes(a));
  if (hasAll || tags.length === 0) return '';
  if (tags.length === 1) return `For ${tags[0]}`;
  if (tags.length === 2) return `For ${tags[0]} & ${tags[1]}`;
  return `For ${tags.slice(0, -1).join(', ')} & ${tags[tags.length - 1]}`;
}

function getRoleLabel(role: UserRole | null): string {
  switch (role) {
    case 'student-k8': return 'Student';
    case 'student-hs': return 'Student';
    case 'parent': return 'Parent';
    case 'staff': return 'Staff';
    default: return '';
  }
}

// Exported so story-detail and create-story can share the same colors.
// Each tag has its own unique hue cycling through the full color wheel.
export const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  // School Stage (Peaches -> Oranges)
  'Back to School':           { bg: '#FFF1F2', text: '#E11D48' },  // rose-50, rose-600
  'In School Now':            { bg: '#FFF7ED', text: '#C2410C' },  // orange-50, orange-700
  'In School':                { bg: '#FFF7ED', text: '#C2410C' },  // orange-50, orange-700
  'Taking a Break':           { bg: '#FFEDD5', text: '#9A3412' },  // orange-100, orange-800
  'Home / Hospital Learning': { bg: '#FED7AA', text: '#7C2D12' },  // orange-200, orange-900

  // Treatment Stage - Distinct (Teals / Slate)
  'Before Treatment':         { bg: '#F1F5F9', text: '#334155' },  // slate
  'During Treatment':         { bg: '#CFFAFE', text: '#0E7490' },  // cyan
  'After Treatment':          { bg: '#CCFBF1', text: '#0F766E' },  // teal

  // Academics (Yellows / Greens)
  'Catching Up':        { bg: '#FEF3C7', text: '#B45309' },  // amber
  'School Support':     { bg: '#FEF9C3', text: '#A16207' },  // yellow
  'Attendance':         { bg: '#ECFCCB', text: '#4D7C0F' },  // lime
  'Activities':         { bg: '#D9F99D', text: '#3F6212' },  // lime-deep
  'Workload':           { bg: '#D1FAE5', text: '#047857' },  // emerald
  'Test Stress':        { bg: '#A7F3D0', text: '#065F46' },  // emerald-deep
  'School Environment': { bg: '#DCFCE7', text: '#15803D' },  // green
  'Teachers & Staff':   { bg: '#BBF7D0', text: '#166534' },  // green-deep

  // Social & Emotional (Blues)
  'Friendships':         { bg: '#E0F2FE', text: '#0369A1' },  // sky
  'Relationships':       { bg: '#BAE6FD', text: '#075985' },  // sky-deep
  'Mental Health':       { bg: '#DBEAFE', text: '#1D4ED8' },  // blue
  'Confidence':          { bg: '#BFDBFE', text: '#1E40AF' },  // blue-deep
  'Feeling Different':   { bg: '#E0E7FF', text: '#4338CA' },  // indigo
  'Emotional Wellbeing': { bg: '#C7D2FE', text: '#3730A3' },  // indigo-deep

  // Symptoms (Purples)
  'Fatigue':             { bg: '#EDE9FE', text: '#6D28D9' },  // violet
  'Anxiety':             { bg: '#DDD6FE', text: '#5B21B6' },  // violet-deep
  'Depression':          { bg: '#F5F3FF', text: '#4C1D95' },  // purple-deep
  'Sleep':               { bg: '#F3E8FF', text: '#7E22CE' },  // purple

  // Practical (Pinks / Fuchsia)
  'Financial Support': { bg: '#FAE8FF', text: '#A21CAF' },  // fuchsia
  'Logistics':         { bg: '#FCE7F3', text: '#BE185D' },  // pink
  'College Planning':  { bg: '#FBCFE8', text: '#9D174D' },  // pink-deep

  // Others
  'Question':          { bg: '#FEF08A', text: '#854D0E' },  // yellow-deep
  'My Experience':     { bg: '#E9D5FF', text: '#7E22CE' },  // purple
};

export const DEFAULT_TAG_COLOR = { bg: '#EEEEF6', text: '#5C5C8A' };

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;

  const months = Math.floor(days / 30);
  return `${months}mo`;
}

export function StoryCard({ story, index, allowModeration = false, showAuthorStatus = false, showRejectedNorms = false }: StoryCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark, fontScale } = useTheme();
  const { isStoryBookmarked, addStoryBookmark, removeStoryBookmark, rejectStory, approveStory, dismissReport, isStoryLiked, toggleLike } = useStories();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);
  const bookmarkScale = useRef(new RNAnimated.Value(1)).current;
  const likeScale = useRef(new RNAnimated.Value(1)).current;
  const [showRejectModal, setShowRejectModal] = React.useState(false);

  const styles = React.useMemo(() => makeCardStyles(colors, isDark, fontScale), [colors, isDark, fontScale]);

  const roleLabel = getRoleLabel(story.author_role);
  const bookmarked = isStoryBookmarked(story.id);
  const liked = isStoryLiked(story.id);
  const isMyStory = user?.id === story.author_id;

  const metaParts = [story.author_name || 'Anonymous'];
  if (roleLabel) metaParts.push(roleLabel);
  metaParts.push(getRelativeTime(story.created_at));
  const audienceHint = getAudienceHint(story.target_audiences);
  if (audienceHint) metaParts.push(audienceHint);
  const metaLine = metaParts.join(' · ');

  useEffect(() => {
    const delay = index * ANIMATION.staggerDelay;
    translateY.value = withDelay(delay, withSpring(0, ANIMATION.springBouncy));
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.98, { duration: 70 }),
      withSpring(1, ANIMATION.springBouncy),
    );
    if (showAuthorStatus && story.status === 'rejected') {
      router.push(`/create-story?edit=true&id=${story.id}` as any);
    } else {
      router.push(`/story-detail?id=${story.id}` as any);
    }
  };

  const handleLike = (e: any) => {
    e.stopPropagation?.();
    RNAnimated.sequence([
      RNAnimated.timing(likeScale, { toValue: 1.4, duration: 100, useNativeDriver: true }),
      RNAnimated.spring(likeScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();
    toggleLike(story.id);
  };

  const handleBookmark = () => {
    RNAnimated.sequence([
      RNAnimated.timing(bookmarkScale, { toValue: 1.35, duration: 100, useNativeDriver: true }),
      RNAnimated.spring(bookmarkScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();

    if (bookmarked) {
      removeStoryBookmark(story.id);
    } else {
      addStoryBookmark(story.id);
    }
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.card, (isMyStory && story.status === 'approved' && !showAuthorStatus) && styles.myStoryCard, cardStyle]}>
        {/* Moderator banners */}
        {story.status === 'pending' && allowModeration && (
          <View style={styles.modBanner}>
            <Text style={styles.modBannerText}>
              Pending Review · Attempt {story.attempt_count || 1}
            </Text>
          </View>
        )}
        {story.status === 'approved' && allowModeration && story.report_count > 0 && (
          <View style={[styles.modBanner, { backgroundColor: colors.error + '15', alignSelf: 'stretch' }]}>
            <Text style={[styles.modBannerText, { color: colors.error }]}>
              Reported {story.report_count} time(s)
            </Text>
            {story.reports && story.reports.length > 0 && (
              <View style={styles.reportsList}>
                {story.reports.map((report: any, idx: number) => (
                  <View key={`report-${idx}`} style={styles.reportItem}>
                    <Text style={styles.reportReason}>• {report.reason}</Text>
                    {report.details ? (
                      <Text style={styles.reportDetails}>"{report.details}"</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Author status banner (In Review / Rejected) */}
        {showAuthorStatus && story.status === 'pending' && (
          <View style={styles.authorPendingBanner}>
            <Ionicons name="time" size={12} color={isDark ? '#FCA5A5' : '#F57C00'} style={{ marginRight: 4 }} />
            <Text style={styles.authorPendingText}>In Review</Text>
          </View>
        )}
        {showAuthorStatus && story.status === 'rejected' && (
          <View style={styles.authorRejectedBanner}>
            <Ionicons name="alert-circle" size={12} color={colors.error} style={{ marginRight: 4 }} />
            <Text style={styles.authorRejectedText}>Action Required</Text>
          </View>
        )}

        {/* Your Story Badge */}
        {isMyStory && story.status === 'approved' && !showAuthorStatus && (
          <View style={styles.myStoryIcon}>
            <Ionicons name="person" size={14} color={isDark ? '#E9D5FF' : colors.primary} />
          </View>
        )}

        {/* Compact meta line */}
        <Text style={styles.meta} numberOfLines={1}>{metaLine}</Text>

        {/* Title — the hero element */}
        <Text style={styles.title} numberOfLines={2}>{story.title}</Text>

        {/* Body preview */}
        {story.body ? (
          <Text style={styles.bodyPreview} numberOfLines={3}>{story.body}</Text>
        ) : null}

        {/* Content Tags */}
        {story.story_tags && story.story_tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {story.story_tags.map(tag => {
              const color = TAG_COLORS[tag] ?? DEFAULT_TAG_COLOR;
              return (
                <View key={tag} style={[styles.tagBadge, { backgroundColor: isDark ? color.text + '30' : color.bg }]}>
                  <Text style={[styles.tagText, { color: isDark ? color.bg : color.text }]}>{tag}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Rejected Norms List */}
        {showRejectedNorms && story.status === 'rejected' && story.rejected_norms && story.rejected_norms.length > 0 && (
          <View style={styles.normsContainer}>
            <Text style={styles.normsLabel}>Please edit your story to follow these norms:</Text>
            {story.rejected_norms.map((norm, idx) => (
              <View key={idx} style={styles.normItem}>
                <Ionicons name="close-circle" size={16} color={colors.error} />
                <Text style={styles.normText}>{norm}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom Action Row (Like & Commment) — Only if approved */}
        {story.status === 'approved' && (
        <View style={styles.actionRow}>
          <View style={styles.actionLeft}>
            <TouchableOpacity style={styles.actionItem} onPress={handleLike} hitSlop={10} activeOpacity={0.7}>
              <RNAnimated.View style={{ transform: [{ scale: likeScale }] }}>
                <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? '#E53935' : colors.textLight} />
              </RNAnimated.View>
              <Text style={[styles.actionText, liked && styles.actionTextLiked]}>
                {story.like_count || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => router.push(`/story-detail?id=${story.id}#comments` as any)} hitSlop={10}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.textLight} style={{ transform: [{ scaleX: -1 }] }} />
              <Text style={styles.actionText}>Discuss</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={handleBookmark} hitSlop={10} activeOpacity={0.7}>
            <RNAnimated.View style={{ transform: [{ scale: bookmarkScale }] }}>
              <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={19} color={bookmarked ? colors.primary : colors.textLight} />
            </RNAnimated.View>
          </TouchableOpacity>
        </View>
      )}

      {/* Internal Mod Controls */}
      {allowModeration && story.status === 'pending' && (
        <View style={styles.modActions}>
          <TouchableOpacity style={[styles.modButton, styles.modReject]} onPress={(e) => { e.stopPropagation(); setShowRejectModal(true); }}>
            <Ionicons name="close-circle-outline" size={16} color={colors.error} />
            <Text style={styles.modRejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modButton, styles.modApprove]} onPress={(e) => { e.stopPropagation(); approveStory(story.id); }}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />
            <Text style={styles.modApproveText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {allowModeration && story.status === 'approved' && story.report_count > 0 && (
        <View style={styles.modActions}>
          <TouchableOpacity style={[styles.modButton, styles.modReject]} onPress={(e) => { e.stopPropagation(); /* Reject completely here or unpublish */ rejectStory(story.id, []); }}>
            <Ionicons name="close-circle-outline" size={16} color={colors.error} />
            <Text style={styles.modRejectText}>Take Down</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modButton, { borderColor: colors.border, backgroundColor: 'transparent' }]} onPress={(e) => { e.stopPropagation(); dismissReport(story.id); }}>
            <Ionicons name="checkmark-done-outline" size={16} color={colors.textLight} />
            <Text style={[styles.actionText, { color: colors.textLight }]}>Dismiss Flags</Text>
          </TouchableOpacity>
        </View>
      )}

      {showRejectModal && (
        <CommunityNormsModal visible={true} onClose={() => setShowRejectModal(false)} onAgree={(norms) => { rejectStory(story.id, norms); setShowRejectModal(false); }} mode="select" />
      )}
    </Animated.View>
    </Pressable>
  );
}

function makeCardStyles(c: AppTheme['colors'], isDark: boolean, fontScale = 1) {
  const fs = (size: number) => Math.round(size * fontScale);
  return StyleSheet.create({
  card: {
    backgroundColor: isDark ? c.backgroundLight : c.white,
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: isDark ? c.borderCard : '#E8E8F0',
    shadowColor: isDark ? '#000' : '#2D2D44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  myStoryCard: {
    backgroundColor: isDark ? '#322447' : '#F4F0FC',
  },
  modBanner: {
    backgroundColor: isDark ? '#3A2000' : '#FFF3E0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  modBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#FCA5A5' : '#E65100',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reportsList: {
    marginTop: 8,
    gap: 6,
  },
  reportItem: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
    padding: 8,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.error + '25',
  },
  reportReason: {
    fontSize: 12,
    fontWeight: '700',
    color: c.error,
  },
  reportDetails: {
    fontSize: 12,
    color: c.textDark,
    marginTop: 2,
    fontStyle: 'italic',
    paddingLeft: 8,
  },
  authorPendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#3A2000' : '#FFF8E1',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  authorPendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: isDark ? '#FCA5A5' : '#F57C00',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  authorRejectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.error + '15',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  authorRejectedText: {
    fontSize: 11,
    fontWeight: '700',
    color: c.error,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  myStoryIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: isDark ? c.primary + '30' : c.primary + '15',
    padding: 6,
    borderRadius: 100,
  },
  meta: {
    fontSize: 12,
    color: c.textLight,
    fontWeight: '400',
    marginBottom: 7,
  },
  title: {
    fontSize: fs(18),
    fontWeight: '700',
    color: c.textDark,
    lineHeight: fs(24),
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  bodyPreview: {
      fontSize: fs(14),
      fontWeight: '400',
      color: c.textMuted,
      lineHeight: fs(21),
      marginBottom: 14,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 14,
    },
    tagBadge: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 100,
    },
    tagText: {
      fontSize: 12,
      fontWeight: '600',
    },
    normsContainer: {
    backgroundColor: c.error + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: c.error + '30',
  },
  normsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: c.error,
    marginBottom: 8,
  },
  normItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  normText: {
    flex: 1,
    fontSize: 14,
    color: c.textDark,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: isDark ? c.borderCard : '#E5E5EA',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: c.textLight,
  },
  actionTextLiked: {
    color: '#E53935',
  },
  modActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: isDark ? c.borderCard : '#E5E5EA',
  },
  modButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 100,
    alignItems: 'center',
    borderWidth: 1,
  },
  modReject: {
    borderColor: c.error + '30',
    backgroundColor: c.error + '10',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  modRejectText: {
    color: c.error,
    fontWeight: '600',
    fontSize: 13,
  },
  modApprove: {
    borderColor: c.primary,
    backgroundColor: c.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  modApproveText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
}
