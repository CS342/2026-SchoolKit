import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated as RNAnimated,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { useAuth } from '../contexts/AuthContext';
import { useStories, StoryComment } from '../contexts/StoriesContext';
import { useOnboarding, UserRole } from '../contexts/OnboardingContext';
import { useTheme } from '../contexts/ThemeContext';
import { generateSpeech } from '../services/elevenLabs';
import {
  COLORS,
  TYPOGRAPHY,
  RADII,
  BORDERS,
  SHADOWS,
  SPACING,
  withOpacity,
} from '../constants/onboarding-theme';

function getRoleColor(role: UserRole | null): string {
  switch (role) {
    case 'student-k8': return COLORS.studentK8;
    case 'student-hs': return COLORS.studentHS;
    case 'parent': return COLORS.parent;
    case 'staff': return COLORS.staff;
    default: return COLORS.primary;
  }
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
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function CommentItem({
  comment,
  isOwn,
  onDelete,
}: {
  comment: StoryComment;
  isOwn: boolean;
  onDelete: () => void;
}) {
  const roleColor = getRoleColor(comment.author_role);
  const roleLabel = getRoleLabel(comment.author_role);
  const initial = (comment.author_name || '?')[0].toUpperCase();

  return (
    <View style={commentStyles.container}>
      <View style={[commentStyles.avatar, { backgroundColor: roleColor }]}>
        <Text style={commentStyles.avatarText}>{initial}</Text>
      </View>
      <View style={commentStyles.content}>
        <View style={commentStyles.headerRow}>
          <Text style={commentStyles.authorName} numberOfLines={1}>{comment.author_name || 'Anonymous'}</Text>
          {roleLabel ? (
            <View style={[commentStyles.roleBadge, { backgroundColor: withOpacity(roleColor, 0.1) }]}>
              <Text style={[commentStyles.roleText, { color: roleColor }]}>{roleLabel}</Text>
            </View>
          ) : null}
          <Text style={commentStyles.time}>{getRelativeTime(comment.created_at)}</Text>
          <View style={{ flex: 1 }} />
          {isOwn && (
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={commentStyles.body}>{comment.body}</Text>
      </View>
    </View>
  );
}

const commentStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    flexShrink: 1,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  body: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textDark,
    lineHeight: 22,
  },
});

export default function StoryDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAnonymous } = useAuth();
  const { selectedVoice } = useOnboarding();
  const { stories, deleteStory, fetchComments, addComment, deleteComment, isStoryBookmarked, addStoryBookmark, removeStoryBookmark } = useStories();
  const { colors, appStyles } = useTheme();

  const [comments, setComments] = useState<StoryComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const bookmarkScale = useRef(new RNAnimated.Value(1)).current;

  // TTS state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const story = stories.find(s => s.id === id);
  const isOwnStory = story && user?.id === story.author_id;
  const bookmarked = id ? isStoryBookmarked(id) : false;

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    if (id) {
      loadComments();
    }
  }, [id]);

  const loadComments = async () => {
    if (!id) return;
    setCommentsLoading(true);
    const data = await fetchComments(id);
    setComments(data);
    setCommentsLoading(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await deleteStory(id);
              router.back();
            }
          },
        },
      ],
    );
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !id || submitting) return;
    setSubmitting(true);
    const newComment = await addComment(id, commentText.trim());
    if (newComment) {
      setComments(prev => [...prev, newComment]);
      setCommentText('');
    }
    setSubmitting(false);
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('Delete Comment', 'Delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (id) {
            await deleteComment(commentId, id);
            setComments(prev => prev.filter(c => c.id !== commentId));
          }
        },
      },
    ]);
  };

  const handleBookmark = () => {
    if (!id) return;
    RNAnimated.sequence([
      RNAnimated.timing(bookmarkScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      RNAnimated.spring(bookmarkScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();

    if (bookmarked) {
      removeStoryBookmark(id);
    } else {
      addStoryBookmark(id);
    }
  };

  const handleSpeak = async () => {
    if (!story) return;

    if (isSpeaking) {
      if (sound) {
        await sound.pauseAsync();
      }
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);

    if (sound) {
      await sound.playAsync();
      return;
    }

    try {
      setIsLoadingAudio(true);
      const textToSpeak = `${story.title}. ${story.body}`;
      const audioUri = await generateSpeech(textToSpeak, selectedVoice);

      if (audioUri) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        setSound(newSound);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsSpeaking(false);
            newSound.setPositionAsync(0);
          }
        });
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsSpeaking(false);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!story) {
    return (
      <View style={styles.container}>
        <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
          <Pressable style={appStyles.editBackButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.textDark} />
          </Pressable>
          <Text style={appStyles.editHeaderTitle}>Story</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Story not found</Text>
        </View>
      </View>
    );
  }

  const roleColor = getRoleColor(story.author_role);
  const roleLabel = getRoleLabel(story.author_role);
  const initial = (story.author_name || '?')[0].toUpperCase();

  return (
    <View style={styles.container}>
      <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
        <Pressable style={appStyles.editBackButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={appStyles.editHeaderTitle}>Story</Text>
        {isOwnStory ? (
          <Pressable onPress={handleDelete} style={{ padding: 8 }}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Story content */}
          <View style={styles.storyCard}>
            {/* Author row */}
            <View style={styles.authorRow}>
              <View style={[styles.avatarCircle, { backgroundColor: roleColor }]}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
              <View style={styles.authorInfo}>
                <View style={styles.authorNameRow}>
                  <Text style={styles.authorName}>{story.author_name || 'Anonymous'}</Text>
                  {roleLabel ? (
                    <View style={[styles.roleBadge, { backgroundColor: withOpacity(roleColor, 0.1) }]}>
                      <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.timeText}>{getRelativeTime(story.created_at)}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <TouchableOpacity
                  onPress={handleSpeak}
                  disabled={isLoadingAudio}
                  style={{ padding: 4 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {isLoadingAudio ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons
                      name={isSpeaking ? 'stop-circle-outline' : 'volume-high-outline'}
                      size={22}
                      color={isSpeaking ? COLORS.error : COLORS.textLight}
                    />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleBookmark} style={{ padding: 4 }}>
                  <RNAnimated.View style={{ transform: [{ scale: bookmarkScale }] }}>
                    <Ionicons
                      name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                      size={22}
                      color={bookmarked ? colors.primary : COLORS.textLight}
                    />
                  </RNAnimated.View>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.storyTitle}>{story.title}</Text>
            <Text style={styles.storyBody}>{story.body}</Text>
          </View>

          {/* Comments section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments ({comments.length})
            </Text>

            {commentsLoading ? (
              <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
            ) : comments.length === 0 ? (
              <Text style={styles.noComments}>
                No comments yet. {isAnonymous ? '' : 'Be the first to comment!'}
              </Text>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isOwn={user?.id === comment.author_id}
                  onDelete={() => handleDeleteComment(comment.id)}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* Comment input bar */}
        {!isAnonymous && (
          <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={COLORS.inputPlaceholder}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || submitting}
              style={styles.sendButton}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name="send"
                  size={22}
                  color={commentText.trim() ? colors.primary : COLORS.textLight}
                />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
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
      paddingHorizontal: SPACING.screenPadding,
      paddingTop: SPACING.sectionGap,
      paddingBottom: 40,
    },
    notFound: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notFoundText: {
      ...TYPOGRAPHY.body,
      color: c.textMuted,
    },
    storyCard: {
      backgroundColor: c.white,
      borderRadius: RADII.card,
      padding: 20,
      borderWidth: BORDERS.card,
      borderColor: c.borderCard,
      ...SHADOWS.card,
      marginBottom: SPACING.sectionGap,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarInitial: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    authorInfo: {
      flex: 1,
    },
    authorNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    authorName: {
      fontSize: 16,
      fontWeight: '700',
      color: c.textDark,
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: RADII.badgeSmall,
    },
    roleText: {
      fontSize: 12,
      fontWeight: '600',
    },
    timeText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textLight,
      marginTop: 2,
    },
    storyTitle: {
      ...TYPOGRAPHY.h2,
      color: c.textDark,
      marginBottom: 12,
      lineHeight: 32,
    },
    storyBody: {
      ...TYPOGRAPHY.bodyDescription,
      color: c.textMuted,
      lineHeight: 26,
    },
    commentsSection: {
      marginTop: 4,
    },
    commentsTitle: {
      ...TYPOGRAPHY.h3,
      color: c.textDark,
      marginBottom: 12,
    },
    noComments: {
      ...TYPOGRAPHY.bodyDescription,
      color: c.textLight,
      textAlign: 'center',
      paddingVertical: 24,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: c.white,
      borderTopWidth: 1,
      borderTopColor: c.borderCard,
      gap: 10,
    },
    commentInput: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      backgroundColor: c.appBackground,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      fontWeight: '500',
      color: c.textDark,
      borderWidth: 1,
      borderColor: c.borderCard,
    },
    sendButton: {
      padding: 8,
      marginBottom: 2,
    },
  });
