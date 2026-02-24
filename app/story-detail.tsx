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
import { COLORS, TYPOGRAPHY } from '../constants/onboarding-theme';

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
  const roleLabel = getRoleLabel(comment.author_role);
  const metaParts = [comment.author_name || 'Anonymous'];
  if (roleLabel) metaParts.push(roleLabel);
  metaParts.push(getRelativeTime(comment.created_at));
  const metaLine = metaParts.join(' · ');

  return (
    <View style={commentStyles.container}>
      <View style={commentStyles.headerRow}>
        <Text style={commentStyles.meta} numberOfLines={1}>{metaLine}</Text>
        {isOwn && (
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={15} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={commentStyles.body}>{comment.body}</Text>
    </View>
  );
}

const commentStyles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textLight,
    flex: 1,
    marginRight: 8,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.textDark,
    lineHeight: 22,
  },
});

export default function StoryDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAnonymous } = useAuth();
  const { selectedVoice, data: onboardingData } = useOnboarding();
  const { stories, deleteStory, fetchComments, addComment, deleteComment, isStoryBookmarked, addStoryBookmark, removeStoryBookmark, isStoryLiked, toggleLike } = useStories();
  const { colors, appStyles } = useTheme();

  const [comments, setComments] = useState<StoryComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const bookmarkScale = useRef(new RNAnimated.Value(1)).current;
  const likeScale = useRef(new RNAnimated.Value(1)).current;

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const story = stories.find(s => s.id === id);
  const isOwnStory = story && user?.id === story.author_id;
  const bookmarked = id ? isStoryBookmarked(id) : false;
  const liked = id ? isStoryLiked(id) : false;

  const canViewStory = useMemo(() => {
    if (!story) return false;
    if (story.author_id === user?.id) return true; // Author can always view
    const audiences = story.target_audiences || [];
    // Default to all if none specified
    if (audiences.length === 0) return true;
    
    let userGroup = 'Students';
    if (onboardingData?.role === 'student-k8' || onboardingData?.role === 'student-hs') userGroup = 'Students';
    else if (onboardingData?.role === 'parent') userGroup = 'Parents';
    else if (onboardingData?.role === 'staff') userGroup = 'School Staff';
    
    // Strict enforcement: only users matching the chosen audience can view
    return audiences.includes(userGroup) || audiences.includes(onboardingData?.role || '');
  }, [story, user?.id, onboardingData?.role]);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  useEffect(() => {
    if (id) loadComments();
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
    try {
      const newComment = await addComment(id, commentText.trim());
      if (newComment) {
        setComments(prev => [...prev, newComment]);
        setCommentText('');
      } else {
        Alert.alert('Error', 'Failed to post comment. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Comment Rejected', error.message || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
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

  const handleLike = () => {
    if (!id) return;
    RNAnimated.sequence([
      RNAnimated.timing(likeScale, { toValue: 1.4, duration: 100, useNativeDriver: true }),
      RNAnimated.spring(likeScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();
    toggleLike(id);
  };

  const handleBookmark = () => {
    if (!id) return;
    RNAnimated.sequence([
      RNAnimated.timing(bookmarkScale, { toValue: 1.35, duration: 100, useNativeDriver: true }),
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
      if (sound) await sound.pauseAsync();
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
          { shouldPlay: true, rate: playbackRate, shouldCorrectPitch: true }
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

  const togglePlaybackRate = async () => {
    let nextRate = 1.0;
    if (playbackRate === 1.0) nextRate = 1.25;
    else if (playbackRate === 1.25) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2.0;
    else nextRate = 1.0;
    
    setPlaybackRate(nextRate);
    if (sound) {
      await sound.setRateAsync(nextRate, true);
    }
  };

  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!story || !canViewStory) {
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
          <Text style={styles.notFoundText}>{!story ? 'Story not found' : "You don't have permission to view this story"}</Text>
        </View>
      </View>
    );
  }

  const roleLabel = getRoleLabel(story.author_role);
  const metaParts = [story.author_name || 'Anonymous'];
  if (roleLabel) metaParts.push(roleLabel);
  metaParts.push(getRelativeTime(story.created_at));
  const metaLine = metaParts.join(' · ');

  return (
    <View style={styles.container}>
      {/* Header */}
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
          {/* Meta line */}
          <Text style={styles.meta}>{metaLine}</Text>

          {/* Title */}
          <Text style={styles.storyTitle}>{story.title}</Text>

          {/* Tags */}
          {story.looking_for && story.looking_for.length > 0 && (
            <View style={styles.tagsRow}>
              {story.looking_for.map((need, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{need}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Audio Player Container */}
          <View style={styles.audioControlsRow}>
            <TouchableOpacity 
              style={[styles.listenBtn, isSpeaking && styles.listenBtnPlaying]} 
              onPress={handleSpeak}
              disabled={isLoadingAudio}
            >
              {isLoadingAudio ? (
                <ActivityIndicator size="small" color={isSpeaking ? COLORS.white : colors.primary} style={{ marginRight: 6 }} />
              ) : (
                <Ionicons 
                  name={isSpeaking ? 'pause' : 'play'} 
                  size={16} 
                  color={isSpeaking ? COLORS.white : colors.primary} 
                  style={{ marginRight: 6 }}
                />
              )}
              <Text style={[styles.listenBtnText, isSpeaking && { color: COLORS.white }]}>
                {isLoadingAudio ? 'Loading...' : isSpeaking ? 'Pause' : 'Listen'}
              </Text>
            </TouchableOpacity>
            
            {(sound !== null) && (
              <TouchableOpacity style={styles.speedBtn} onPress={togglePlaybackRate}>
                <Text style={styles.speedBtnText}>{playbackRate}x</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Body */}
          <Text style={styles.storyBody}>{story.body}</Text>

          {/* Action bar */}
          <View style={styles.actionBar}>
            <View style={styles.actionLeft}>
              {/* Like */}
              <TouchableOpacity
                onPress={handleLike}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.actionItem}
              >
                <RNAnimated.View style={{ transform: [{ scale: likeScale }] }}>
                  <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={24}
                    color={liked ? '#E53935' : COLORS.textLight}
                  />
                </RNAnimated.View>
                <Text style={[styles.actionText, liked && { color: '#E53935' }]}>
                  {story.like_count}
                </Text>
              </TouchableOpacity>

              {/* Comments count */}
              <View style={styles.actionItem}>
                <Ionicons name="chatbubble-outline" size={22} color={COLORS.textLight} />
                <Text style={styles.actionText}>{comments.length}</Text>
              </View>
            </View>

            <View style={styles.actionRight}>
              <TouchableOpacity
                onPress={handleBookmark}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <RNAnimated.View style={{ transform: [{ scale: bookmarkScale }] }}>
                  <Ionicons
                    name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={24}
                    color={bookmarked ? colors.primary : COLORS.textLight}
                  />
                </RNAnimated.View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments section */}
          <Text style={styles.commentsTitle}>
            Comments ({comments.length})
          </Text>

          {commentsLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
          ) : comments.length === 0 ? (
            <Text style={styles.noComments}>
              No comments yet.{isAnonymous ? '' : ' Be the first to comment!'}
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
        </ScrollView>

        {/* Comment input */}
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
      backgroundColor: c.white,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
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
    meta: {
      fontSize: 12,
      color: COLORS.textLight,
      fontWeight: '400',
      marginBottom: 10,
    },
    storyTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: c.textDark,
      lineHeight: 29,
      letterSpacing: -0.3,
      marginBottom: 14,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 14,
    },
    tag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 100,
      backgroundColor: COLORS.primary + '15',
    },
    tagText: {
      fontSize: 12,
      fontWeight: '600',
      color: COLORS.primary,
    },
    storyBody: {
      fontSize: 16,
      fontWeight: '400',
      color: c.textDark,
      lineHeight: 26,
    },
    audioControlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 10,
    },
    listenBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.primary + '15',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 100,
    },
    listenBtnPlaying: {
      backgroundColor: c.primary,
    },
    listenBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: c.primary,
    },
    speedBtn: {
      backgroundColor: c.appBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: c.borderCard,
    },
    speedBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
    },
    actionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      marginTop: 18,
      marginBottom: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: '#E5E5EA',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E5E5EA',
    },
    actionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    actionRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '500',
      color: COLORS.textLight,
    },
    commentsTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: c.textDark,
      marginBottom: 4,
    },
    noComments: {
      fontSize: 14,
      color: c.textLight,
      paddingVertical: 20,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: c.white,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: '#E5E5EA',
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
      fontWeight: '400',
      color: c.textDark,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: '#E5E5EA',
    },
    sendButton: {
      padding: 8,
      marginBottom: 2,
    },
  });
