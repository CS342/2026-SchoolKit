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
import { COLORS, ANIMATION, SHADOWS } from '../constants/onboarding-theme';
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
  const { isStoryBookmarked, addStoryBookmark, removeStoryBookmark, rejectStory, approveStory, dismissReport, isStoryLiked, toggleLike } = useStories();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);
  const bookmarkScale = useRef(new RNAnimated.Value(1)).current;
  const likeScale = useRef(new RNAnimated.Value(1)).current;
  const [showRejectModal, setShowRejectModal] = React.useState(false);

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
          <View style={[styles.modBanner, { backgroundColor: COLORS.error + '15', alignSelf: 'stretch' }]}>
            <Text style={[styles.modBannerText, { color: COLORS.error }]}>
              Reported {story.report_count} time(s)
            </Text>
            {story.reports && story.reports.length > 0 && (
              <View style={styles.reportsList}>
                {story.reports.map((report, idx) => (
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
            <Ionicons name="time" size={12} color="#F57C00" style={{ marginRight: 4 }} />
            <Text style={styles.authorPendingText}>In Review</Text>
          </View>
        )}
        {showAuthorStatus && story.status === 'rejected' && (
          <View style={styles.authorRejectedBanner}>
            <Ionicons name="alert-circle" size={12} color={COLORS.error} style={{ marginRight: 4 }} />
            <Text style={styles.authorRejectedText}>Action Required</Text>
          </View>
        )}

        {/* Your Story Badge */}
        {isMyStory && story.status === 'approved' && !showAuthorStatus && (
          <View style={styles.myStoryIcon}>
            <Ionicons name="person" size={14} color={COLORS.primary} />
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
            {story.story_tags.map(tag => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Rejected Norms List */}
        {showRejectedNorms && story.status === 'rejected' && story.rejected_norms && story.rejected_norms.length > 0 && (
          <View style={styles.normsContainer}>
            <Text style={styles.normsLabel}>Broken Community Norms:</Text>
            {story.rejected_norms.map((norm, idx) => (
              <View key={idx} style={styles.normItem}>
                <Ionicons name="close-circle" size={16} color={COLORS.error} />
                <Text style={styles.normText}>{norm}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action row */}
        {!allowModeration && (
          <View style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <TouchableOpacity
                onPress={handleLike}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
                style={styles.actionItem}
              >
                <RNAnimated.View style={{ transform: [{ scale: likeScale }] }}>
                  <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={20}
                    color={liked ? '#E53935' : COLORS.textLight}
                  />
                </RNAnimated.View>
                <Text style={[styles.actionText, liked && styles.actionTextLiked]}>
                  {story.like_count}
                </Text>
              </TouchableOpacity>

              <View style={styles.actionItem}>
                <Ionicons name="chatbubble-outline" size={20} color={COLORS.textLight} />
                <Text style={styles.actionText}>
                  {story.comment_count}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleBookmark}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <RNAnimated.View style={{ transform: [{ scale: bookmarkScale }] }}>
                <Ionicons
                  name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={bookmarked ? COLORS.primary : COLORS.textLight}
                />
              </RNAnimated.View>
            </TouchableOpacity>
          </View>
        )}

        {/* Moderation actions */}
        {allowModeration && (story.status === 'pending' || (story.status === 'approved' && story.report_count > 0)) && (
          <View style={styles.modActions}>
            <Pressable
              style={[styles.modButton, styles.modReject]}
              onPress={() => setShowRejectModal(true)}
            >
              <Text style={[styles.modButtonText, { color: COLORS.error }]}>
                {story.status === 'approved' ? 'Revoke' : 'Reject'}
              </Text>
            </Pressable>
            {story.status === 'pending' && (
              <Pressable
                style={[styles.modButton, styles.modApprove]}
                onPress={() => approveStory(story.id)}
              >
                <Text style={[styles.modButtonText, { color: COLORS.successText }]}>Approve</Text>
              </Pressable>
            )}
            {story.status === 'approved' && story.report_count > 0 && (
              <Pressable
                style={[styles.modButton, styles.modApprove]}
                onPress={() => dismissReport(story.id)}
              >
                <Text style={[styles.modButtonText, { color: COLORS.successText }]}>Dismiss Report</Text>
              </Pressable>
            )}
          </View>
        )}
      </Animated.View>

      <CommunityNormsModal
        visible={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        mode="select"
        onAgree={(selectedNorms) => {
          rejectStory(story.id, selectedNorms);
          setShowRejectModal(false);
        }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    marginBottom: 12,
    borderRadius: 16,
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  myStoryCard: {
    borderColor: COLORS.primary + '80',
    borderWidth: 1.5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  modBanner: {
    backgroundColor: COLORS.primary + '15',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  modBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  reportsList: {
    marginTop: 8,
    gap: 6,
  },
  reportItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 8,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.error + '25',
  },
  reportReason: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
  },
  reportDetails: {
    fontSize: 12,
    color: COLORS.textDark,
    marginTop: 2,
    fontStyle: 'italic',
    paddingLeft: 8,
  },
  authorPendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  authorPendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F57C00',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  authorRejectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '15',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  authorRejectedText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.error,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  myStoryIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: COLORS.primary + '15',
    padding: 6,
    borderRadius: 100,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '400',
    marginBottom: 7,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    lineHeight: 24,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  bodyPreview: {
      fontSize: 14,
      fontWeight: '400',
      color: '#555',
      lineHeight: 21,
      marginBottom: 14,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 14,
    },
    tagBadge: {
      backgroundColor: COLORS.appBackground,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: '#E5E5EA',
    },
    tagText: {
      fontSize: 11,
      fontWeight: '600',
      color: COLORS.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    normsContainer: {
    backgroundColor: COLORS.error + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  normsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.error,
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
    color: COLORS.textDark,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
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
    color: COLORS.textLight,
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
    borderTopColor: '#E5E5EA',
  },
  modButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 100,
    alignItems: 'center',
    borderWidth: 1,
  },
  modReject: {
    backgroundColor: COLORS.error + '10',
    borderColor: COLORS.error + '30',
  },
  modApprove: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary + '30',
  },
  modButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
