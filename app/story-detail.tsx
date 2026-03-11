import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
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
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useAuth } from "../contexts/AuthContext";
import { useStories, StoryComment } from "../contexts/StoriesContext";
import { useOnboarding, UserRole } from "../contexts/OnboardingContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAccomplishments } from '../contexts/AccomplishmentContext';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { generateSpeech } from "../services/elevenLabs";
import { COLORS, TYPOGRAPHY } from "../constants/onboarding-theme";
import { TAG_COLORS, DEFAULT_TAG_COLOR } from "../components/StoryCard";
import { ReportStoryModal } from "../components/ReportStoryModal";
import { ReportCommentModal } from "../components/ReportCommentModal";
import { RecommendationList } from "../components/RecommendationList";
import { diffWords } from "diff";
import { FeedbackBanner } from "../components/FeedbackBanner";
import { useResponsive } from "../hooks/useResponsive";

const ALL_AUDIENCES = ['Students', 'Parents', 'School Staff'];
const AUDIENCE_DISPLAY: Record<string, string> = {
  'student-k8': 'Students', 'student-hs': 'Students',
  'parent': 'Parents', 'staff': 'School Staff',
  'Students': 'Students', 'Parents': 'Parents', 'School Staff': 'School Staff',
};
const COMMENT_REMINDERS = [
  "Remember: Lead with empathy.",
  "Thank you for supporting this author.",
  "A kind word goes a long way.",
];

function getLookingForText(lookingFor: string[]): string {
  const lower = lookingFor.map(s => s.charAt(0).toLowerCase() + s.slice(1));
  if (lower.length === 1) return lower[0] === 'just sharing' ? 'Just sharing' : `Looking for ${lower[0]}`;
  const onlyJustSharing = lower.every(s => s === 'just sharing');
  if (onlyJustSharing) return 'Just sharing';
  return `Looking for ${lower.slice(0, -1).join(', ')} and ${lower[lower.length - 1]}`;
}

function getAudienceHint(targetAudiences?: string[]): string {
  if (!targetAudiences || !Array.isArray(targetAudiences) || targetAudiences.length === 0) return '';
  const tags = [...new Set(targetAudiences.map(a => AUDIENCE_DISPLAY[a]).filter(Boolean))];
  const hasAll = ALL_AUDIENCES.every(a => tags.includes(a));
  if (hasAll || tags.length === 0) return '';
  if (tags.length === 1) return `For ${tags[0]}`;
  if (tags.length === 2) return `For ${tags[0]} & ${tags[1]}`;
  return `For ${tags.slice(0, -1).join(', ')} & ${tags[tags.length - 1]}`;
}

function getRoleLabel(role: UserRole | null): string {
  switch (role) {
    case "student-k8":
      return "Student";
    case "student-hs":
      return "Student";
    case "parent":
      return "Parent";
    case "staff":
      return "Staff";
    default:
      return "";
  }
}

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
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
  isLiked,
  isReported,
  onDelete,
  onLike,
  onReport,
  onDismissReport,
  isModerator,
  fontSizeStep = 0,
}: {
  comment: StoryComment;
  isOwn: boolean;
  isLiked: boolean;
  isReported: boolean;
  onDelete: () => void;
  onLike: () => void;
  onReport: () => void;
  onDismissReport: () => void;
  isModerator: boolean;
  fontSizeStep?: number;
}) {
  const { colors, isDark, fontScale } = useTheme();
  const styles = React.useMemo(() => makeCommentStyles(colors, isDark, fontScale), [colors, isDark, fontScale]);
  const FONT_STEPS = [1.0, 1.2, 1.45];

  const roleLabel = getRoleLabel(comment.author_role);
  const metaParts = [comment.author_name || "Anonymous"];
  if (roleLabel) metaParts.push(roleLabel);
  metaParts.push(getRelativeTime(comment.created_at));
  const metaLine = metaParts.join(" · ");

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.meta} numberOfLines={1}>
            {metaLine}
          </Text>
          {isModerator && comment.report_count > 0 && (
            <View style={{ marginTop: 8, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: 6,
                  backgroundColor: colors.error + '12', 
                  paddingHorizontal: 8, 
                  paddingVertical: 4, 
                  borderRadius: 6, 
                  alignSelf: 'flex-start',
                  borderWidth: 1,
                  borderColor: colors.error + '25'
                }}>
                  <Ionicons name="alert-circle" size={14} color={colors.error} />
                  <Text style={{ fontSize: 11, color: colors.error, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Reported ({comment.report_count})
                  </Text>
                </View>

                {/* Dismiss Button for Moderators */}
                <TouchableOpacity 
                  onPress={onDismissReport}
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    gap: 4,
                    backgroundColor: colors.primary + '12',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.primary + '25'
                  }}
                >
                  <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700', textTransform: 'uppercase' }}>Dismiss</Text>
                </TouchableOpacity>
              </View>

              {comment.reports && comment.reports.length > 0 && (
                <View style={{ 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', 
                  padding: 10, 
                  borderRadius: 8,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.error + '60'
                }}>
                  {comment.reports.map((r, idx) => (
                    <View key={idx} style={{ marginBottom: idx < (comment.reports?.length || 0) - 1 ? 8 : 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Ionicons name="flag" size={12} color={colors.error} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.error }}>{r.reason}</Text>
                      </View>
                      {r.details ? (
                        <Text style={{ 
                          fontSize: 12, 
                          color: colors.textDark, 
                          fontStyle: 'italic', 
                          marginLeft: 18,
                          lineHeight: 16
                        }}>
                          "{r.details}"
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
        {isOwn || isModerator ? (
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={15} color={colors.error} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onReport}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            disabled={isReported}
          >
            <Ionicons name={isReported ? "flag" : "flag-outline"} size={16} color={isReported ? colors.primary : colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.body, fontSizeStep > 0 && { fontSize: Math.round(15 * FONT_STEPS[fontSizeStep]), lineHeight: Math.round(22 * FONT_STEPS[fontSizeStep]) }]}>
        {comment.body}
      </Text>
      <TouchableOpacity onPress={onLike} style={styles.likeRow} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Ionicons
          name={isLiked ? "heart" : "heart-outline"}
          size={14}
          color={isLiked ? "#E53935" : colors.textLight}
        />
        {comment.like_count > 0 && (
          <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>
            {comment.like_count}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const makeCommentStyles = (c: typeof import("../constants/theme").COLORS_LIGHT, isDark: boolean, fontScale = 1) => {
  const fs = (size: number) => Math.round(size * fontScale);
  return StyleSheet.create({
    container: {
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? c.borderCard : "#E5E5EA",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    meta: {
      fontSize: fs(12),
      color: c.textLight,
      flex: 1,
      marginRight: 8,
    },
    body: {
      fontSize: fs(15),
      fontWeight: "400",
      color: c.textDark,
      lineHeight: fs(22),
    },
    likeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 8,
      alignSelf: "flex-start",
    },
    likeCount: {
      fontSize: fs(12),
      fontWeight: "500",
      color: c.textLight,
    },
    likeCountActive: {
      color: "#E53935",
    },
  });
};

export default function StoryDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, openComments } = useLocalSearchParams<{ id: string, openComments?: string }>();
  const { user, isAnonymous } = useAuth();
  const { selectedVoice, data: onboardingData, preferredLanguage } = useOnboarding();
  const {
    stories,
    deleteStory,
    fetchComments,
    addComment,
    deleteComment,
    isStoryBookmarked,
    addStoryBookmark,
    removeStoryBookmark,
    isStoryLiked,
    toggleLike,
    dismissReport,
    dismissCommentReports,
    approveStory,
    updateStory,
    reportStory,
    isCommentLiked,
    toggleCommentLike,
    downloadedStories,
    isStoryDownloaded,
    downloadStory,
    removeStoryDownload,
    isStoryReported,
    isCommentReported,
    reportComment,
  } = useStories();
  const { colors, appStyles, isDark, fontScale } = useTheme();
  const { fireEvent } = useAccomplishments();
  const { isWeb, isDesktop, isTablet } = useResponsive();
  const isLargeWeb = isWeb && (isDesktop || isTablet);

  const MODERATOR_EMAILS = ['janinatroper@gmail.com', 'lvalsote@stanford.edu', 'ngounder@stanford.edu'];
  const isModeratorMode = Boolean(user?.email && MODERATOR_EMAILS.includes(user.email));

  useEffect(() => {
    const timer = setTimeout(() => {
      if (id) fireEvent('story_read_10s');
    }, 10_000);
    return () => clearTimeout(timer);
  }, [id]);

  const [comments, setComments] = useState<StoryComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);

  useEffect(() => {
    if (openComments === 'true') {
      setIsCommentsModalVisible(true);
    }
  }, [openComments]);
  const [postAnonymously, setPostAnonymously] = useState(false);
  const bookmarkScale = useRef(new RNAnimated.Value(1)).current;
  const likeScale = useRef(new RNAnimated.Value(1)).current;
  const downloadScale = useRef(new RNAnimated.Value(1)).current;
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCommentReportModal, setShowCommentReportModal] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [showOriginalVersion, setShowOriginalVersion] = useState(false);
  const [fontSizeStep, setFontSizeStep] = useState(0);
  const FONT_STEPS = [1.0, 1.2, 1.45];
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedBody, setTranslatedBody] = useState<string | null>(null);
  const [showReportBanner, setShowReportBanner] = useState(false);

  const reminderText = useMemo(() => COMMENT_REMINDERS[Math.floor(Math.random() * COMMENT_REMINDERS.length)], []);

  const player = useAudioPlayer();
  const playerStatus = useAudioPlayerStatus(player);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const loadedStoryIdRef = useRef<string | null>(null);
  const loadedIsTranslatedRef = useRef<boolean>(false);

  // Reset audio state when the story changes (component reuses across navigation)
  useEffect(() => {
    player.pause();
    setIsSpeaking(false);
    setIsLoadingAudio(false);
    loadedStoryIdRef.current = null;
    loadedIsTranslatedRef.current = false;
  }, [id]);

  const story = stories.find((s) => s.id === id) ?? downloadedStories.find((s) => s.id === id);
  const isOwnStory = story && user?.id === story.author_id;
  const bookmarked = id ? isStoryBookmarked(id) : false;
  const liked = id ? isStoryLiked(id) : false;
  const downloaded = id ? isStoryDownloaded(id) : false;

  const canViewStory = useMemo(() => {
    if (!story) return false;
    if (story.author_id === user?.id) return true; // Author can always view
    const audiences = story.target_audiences || [];
    // Default to all if none specified
    if (audiences.length === 0) return true;

    let userGroup = "Students";
    if (
      onboardingData?.role === "student-k8" ||
      onboardingData?.role === "student-hs"
    )
      userGroup = "Students";
    else if (onboardingData?.role === "parent") userGroup = "Parents";
    else if (onboardingData?.role === "staff") userGroup = "School Staff";

    // Strict enforcement: only users matching the chosen audience can view
    return (
      audiences.includes(userGroup) ||
      audiences.includes(onboardingData?.role || "")
    );
  }, [story, user?.id, onboardingData?.role]);

  useEffect(() => {
    if (playerStatus.isLoaded && playerStatus.didJustFinish) {
      setIsSpeaking(false);
      player.seekTo(0);
    }
  }, [playerStatus.isLoaded, playerStatus.didJustFinish, player]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    setCommentsLoading(true);
    const data = await fetchComments(id);
    setComments(data);
    setCommentsLoading(false);
  }, [id, fetchComments]);

  useEffect(() => {
    if (id) loadComments();
  }, [id, loadComments]);

  const handleDelete = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete this story? This cannot be undone.")) {
        if (id) {
          deleteStory(id).then(() => {
            router.back();
          });
        }
      }
    } else {
      Alert.alert(
        "Delete Story",
        "Are you sure you want to delete this story? This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              if (id) {
                await deleteStory(id);
                router.back();
              }
            },
          },
        ]
      );
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !id || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await addComment(id, commentText.trim(), postAnonymously);
      if (newComment) {
        setComments((prev) => [...prev, newComment]);
        setCommentText("");
        fireEvent('story_commented');
      } else {
        Alert.alert("Error", "Failed to post comment. Please try again.");
      }
    } catch (error: any) {
      Alert.alert(
        "Comment Rejected",
        error.message || "Failed to post comment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = (commentId: string) => {
    if (isAnonymous) return;
    const liked = isCommentLiked(commentId);
    toggleCommentLike(commentId);
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, like_count: liked ? Math.max(0, c.like_count - 1) : c.like_count + 1 }
          : c
      )
    );
  };

  const handleDeleteComment = (commentId: string) => {
    if (Platform.OS === "web") {
      if (window.confirm("Delete this comment?")) {
        if (id) {
          deleteComment(commentId, id).then(() => {
            setComments((prev) => prev.filter((c) => c.id !== commentId));
          });
        }
      }
    } else {
      Alert.alert("Delete Comment", "Delete this comment?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (id) {
              await deleteComment(commentId, id);
              setComments((prev) => prev.filter((c) => c.id !== commentId));
            }
          },
        },
      ]);
    }
  };

  const handleDismissCommentReports = async (commentId: string) => {
    try {
      // Optimistic UI update for comments
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, report_count: 0, reports: [] } : c
      ));
      
      await dismissCommentReports(commentId, id || "");
    } catch (error) {
      if (id) {
        const fresh = await fetchComments(id);
        setComments(fresh);
      }
    }
  };

  const handleDismissStoryReport = async () => {
    if (!id) return;
    try {
      await dismissReport(id);
      Alert.alert("Success", "Story reports dismissed.");
    } catch (error) {
      Alert.alert("Error", "Failed to dismiss story reports.");
    }
  };

  const handleLike = () => {
    if (!id || isAnonymous) return;
    RNAnimated.sequence([
      RNAnimated.timing(likeScale, {
        toValue: 1.4,
        duration: 100,
        useNativeDriver: true,
      }),
      RNAnimated.spring(likeScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    toggleLike(id);
  };

  const handleBookmark = () => {
    if (!id) return;
    RNAnimated.sequence([
      RNAnimated.timing(bookmarkScale, {
        toValue: 1.35,
        duration: 100,
        useNativeDriver: true,
      }),
      RNAnimated.spring(bookmarkScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (bookmarked) {
      removeStoryBookmark(id);
    } else {
      addStoryBookmark(id);
    }
  };

  const handleDownload = () => {
    if (!story) return;
    RNAnimated.sequence([
      RNAnimated.timing(downloadScale, { toValue: 1.35, duration: 100, useNativeDriver: true }),
      RNAnimated.spring(downloadScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();
    if (downloaded) {
      removeStoryDownload(story.id);
    } else {
      downloadStory(story);
    }
  };

  const handleSpeak = async () => {
    if (!story) return;

    if (isSpeaking) {
      player.pause();
      setIsSpeaking(false);
      return;
    }

    // We track the last spoken text to know if we need to regenerate
    const titleToSpeak = isTranslated && translatedTitle ? translatedTitle : story.title;
    const bodyToSpeak = isTranslated && translatedBody ? translatedBody : story.body;
    const textToSpeak = `${titleToSpeak}. ${bodyToSpeak}`;
    const voiceToUse = isTranslated && preferredLanguage !== 'spanish' ? 'dNjJKg63Fr5AXwIdkATa' : selectedVoice;

    setIsSpeaking(true);

    // If this exact story's audio is already loaded in the same language, just resume
    if (playerStatus.isLoaded && loadedStoryIdRef.current === id && loadedIsTranslatedRef.current === isTranslated) {
      player.play();
      return;
    }

    try {
      setIsLoadingAudio(true);
      // Truncate to 4000 chars to stay within ElevenLabs API limits
      const truncated = textToSpeak.length > 4000 ? textToSpeak.substring(0, 4000) + '...' : textToSpeak;
      console.log('[TTS] Generating story speech, chars:', truncated.length, 'voice:', voiceToUse);
      const audioUri = await generateSpeech(truncated, voiceToUse);
      console.log('Speech generated, URI:', audioUri ? 'exists' : 'null');

      if (audioUri) {
        player.replace(audioUri);
        player.play();
        loadedStoryIdRef.current = id ?? null;
        loadedIsTranslatedRef.current = isTranslated;
      } else {
        setIsSpeaking(false);
      }
    } catch (e: any) {
      console.error('[TTS] Story audio error:', e);
      let msg = 'Could not generate speech. Please try again.';
      if (e instanceof Error) {
        msg = e.message;
      } else if (typeof e === 'object' && e !== null && (e.error || e.message)) {
        msg = e.error || e.message;
      }

      if (Platform.OS === 'web') {
        window.alert(`Audio failed: ${msg}`);
      } else {
        Alert.alert('Audio failed', msg);
      }
      setIsSpeaking(false);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleTranslate = async () => {
    if (!story) return;
    if (isTranslated) {
      setIsTranslated(false);
      if (isSpeaking) { player.pause(); setIsSpeaking(false); }
      return;
    }
    if (translatedTitle && translatedBody) { setIsTranslated(true); return; }
    setIsTranslating(true);
    try {
      // Use the anon key for authorization to ensure consistency and avoid session token issues
      const token = supabaseAnonKey;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/translate-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ title: story.title, body: story.body }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        console.error('Translation server error:', errorJson);
        throw new Error(errorJson.message || errorJson.error || `Server returned ${response.status}`);
      }

      const data = await response.json();

      if (data?.title && data?.body) {
        setTranslatedTitle(data.title);
        setTranslatedBody(data.body);
        setIsTranslated(true);
      } else {
        throw new Error('Received incomplete translation from server');
      }
      setIsTranslated(true);
    } catch (e: any) {
      console.error('Translation error:', e);
      let msg = 'Could not translate the story. Please try again.';
      if (e instanceof Error) {
        msg = e.message;
      } else if (typeof e === 'object' && e !== null && e.error) {
        msg = e.error;
      }
      
      if (Platform.OS === 'web') {
        window.alert(`Translation failed: ${msg}`);
      } else {
        Alert.alert('Translation failed', msg);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const togglePlaybackRate = async () => {
    let nextRate = 1.0;
    if (playbackRate === 1.0) nextRate = 1.25;
    else if (playbackRate === 1.25) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2.0;
    else nextRate = 1.0;

    setPlaybackRate(nextRate);
    if (playerStatus.isLoaded) player.setPlaybackRate(nextRate);
  };

  const styles = useMemo(() => makeStyles(colors, isDark, fontScale), [colors, isDark, fontScale]);

  if (!story || !canViewStory) {
    return (
      <View style={styles.container}>
        <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
          <Pressable
            style={appStyles.editBackButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textDark} />
          </Pressable>
          <Text style={appStyles.editHeaderTitle}>Story</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>
            {!story
              ? "Story not found"
              : "You don't have permission to view this story"}
          </Text>
        </View>
      </View>
    );
  }

  const roleLabel = getRoleLabel(story.author_role);
  const metaParts = [story.author_name || "Anonymous"];
  if (roleLabel) metaParts.push(roleLabel);
  metaParts.push(getRelativeTime(story.created_at));
  const audienceHint = getAudienceHint(story.target_audiences);
  if (audienceHint) metaParts.push(audienceHint);
  const metaLine = metaParts.join(" · ");
  const renderCommentInput = () => {
    if ((isModeratorMode && story.status === 'pending')) return null;

    if (isAnonymous) {
      return (
        <View style={[styles.guestCommentWrapper, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Text style={styles.guestCommentText}>Sign in to comment</Text>
        </View>
      );
    }
    
    return (
      <View style={[styles.commentInputWrapper, Platform.OS === 'web' && styles.webMaxWidth]}>
        <Text style={styles.reminderText}>{reminderText}</Text>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.commentInput}
            placeholder="Offer support or share your thoughts..."
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
        <View style={[styles.anonRow, { paddingBottom: Math.max(insets.bottom + 4, 12) }]}>
          <Pressable
            onPress={() => setPostAnonymously((v) => !v)}
            style={[styles.anonToggle, postAnonymously && styles.anonToggleActive]}
          >
            <Ionicons
              name={postAnonymously ? "eye-off" : "eye-off-outline"}
              size={13}
              color={postAnonymously ? colors.primary : COLORS.textLight}
            />
            <Text style={[styles.anonToggleText, postAnonymously && { color: colors.primary }]}>
              {postAnonymously ? "Posting anonymously" : "Post anonymously"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderCommentsContent = () => (
    <View style={[
      styles.modalContent, 
      { paddingBottom: 0, flex: 1 }, 
      Platform.OS === "web" && !isLargeWeb && { width: '90%', maxWidth: 800, borderRadius: 24, height: '85%', overflow: 'hidden', alignSelf: 'center' },
      isLargeWeb && { borderTopLeftRadius: 0, borderTopRightRadius: 0, height: '100%', borderLeftWidth: 1, borderLeftColor: colors.borderCard }
    ]}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Responses</Text>
        <TouchableOpacity onPress={() => setIsCommentsModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={colors.textDark || "#1E1E24"} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
        {commentsLoading ? (
          <ActivityIndicator
            style={{ marginTop: 20 }}
            color={colors.primary}
          />
        ) : comments.length === 0 ? (
          <Text style={styles.noComments}>
            {isAnonymous ? "No responses yet." : "No responses yet — be the first to offer support."}
          </Text>
        ) : (
          comments.map((comment) => {
            const isOwn = user?.id === comment.author_id;
            const isLiked = isCommentLiked(comment.id);
            const isReported = isCommentReported(comment.id);
            return (
              <CommentItem
                key={comment.id}
                comment={comment}
                isOwn={isOwn}
                isLiked={isLiked}
                isReported={isReported}
                isModerator={isModeratorMode}
                onDelete={() => handleDeleteComment(comment.id)}
                onLike={() => handleLikeComment(comment.id)}
                onReport={() => {
                  if (!isReported) {
                    setSelectedCommentId(comment.id);
                    setShowCommentReportModal(true);
                  }
                }}
                onDismissReport={() => handleDismissCommentReports(comment.id)}
                fontSizeStep={fontSizeStep}
              />
            );
          })
        )}
      </ScrollView>
      {renderCommentInput()}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }, Platform.OS === "web" && { justifyContent: "center", paddingHorizontal: 0 }]}>
        <View style={Platform.OS === "web" ? styles.webHeaderInner : { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable
            style={appStyles.editBackButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textDark} />
          </Pressable>
          <Text style={appStyles.editHeaderTitle}>Story</Text>
          {isOwnStory ? (
            <Pressable onPress={handleDelete} style={{ padding: 8 }}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </Pressable>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[
          Platform.OS === "web" ? styles.webContainer : { flex: 1 },
          isLargeWeb && isCommentsModalVisible && { flexDirection: 'row', maxWidth: 1200, alignItems: 'stretch' }
        ]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FeedbackBanner 
            visible={showReportBanner}
            message="Report submitted and a moderator is looking at it."
            onDismiss={() => setShowReportBanner(false)}
            type="success"
            style={{ marginHorizontal: 0, marginBottom: 20, marginTop: 0 }}
          />
          {/* Meta line */}
          <Text style={styles.meta}>{metaLine}</Text>

          {/* Title */}
          {isModeratorMode && story.status === 'pending' && story.previous_title ? (
            <Text style={[styles.storyTitle, fontSizeStep > 0 && { fontSize: Math.round(22 * FONT_STEPS[fontSizeStep]), lineHeight: Math.round(29 * FONT_STEPS[fontSizeStep]) }]}>
              {diffWords(story.previous_title, story.title).map((part, i) => {
                if (part.removed) return null;
                return (
                  <Text key={i} style={part.added ? { color: colors.primary, fontWeight: '800', backgroundColor: colors.primary + '20' } : undefined}>
                    {part.value}
                  </Text>
                );
              })}
            </Text>
          ) : (
            <Text style={[styles.storyTitle, fontSizeStep > 0 && { fontSize: Math.round(22 * FONT_STEPS[fontSizeStep]), lineHeight: Math.round(29 * FONT_STEPS[fontSizeStep]) }]}>{isTranslated && translatedTitle ? translatedTitle : story.title}</Text>
          )}

          {/* Audio Player Container */}
          {!(isModeratorMode && story.status === 'pending') && (
            <View style={styles.audioControlsRow}>
              <TouchableOpacity
                style={[styles.listenBtn, isSpeaking && styles.listenBtnPlaying]}
                onPress={handleSpeak}
                disabled={isLoadingAudio}
              >
                {isLoadingAudio ? (
                  <ActivityIndicator
                    size="small"
                    color={isSpeaking ? COLORS.white : colors.primary}
                    style={{ marginRight: 6 }}
                  />
                ) : (
                  <Ionicons
                    name={isSpeaking ? "pause" : "play"}
                    size={16}
                    color={isSpeaking ? COLORS.white : colors.primary}
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text
                  style={[
                    styles.listenBtnText,
                    isSpeaking && { color: COLORS.white },
                  ]}
                >
                  {isLoadingAudio
                    ? "Loading..."
                    : isSpeaking
                      ? "Pause"
                      : "Listen"}
                </Text>
              </TouchableOpacity>

              {playerStatus.isLoaded && (
                <TouchableOpacity
                  style={styles.speedBtn}
                  onPress={togglePlaybackRate}
                >
                  <Text style={styles.speedBtnText}>{playbackRate}x</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.speedBtn, fontSizeStep > 0 && { borderColor: colors.primary }]}
                onPress={() => setFontSizeStep(s => (s + 1) % FONT_STEPS.length)}
              >
                <Text style={[styles.speedBtnText, fontSizeStep > 0 && { color: colors.primary }]}>Aa</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.speedBtn, isTranslated && { borderColor: colors.primary }]}
                onPress={handleTranslate}
                disabled={isTranslating}
              >
                {isTranslating
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Text style={[styles.speedBtnText, isTranslated && { color: colors.primary }]}>ES</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {/* Body */}
          {isModeratorMode && story.status === 'pending' && story.previous_body ? (
            <Text style={[styles.storyBody, fontSizeStep > 0 && { fontSize: Math.round(16 * FONT_STEPS[fontSizeStep]), lineHeight: Math.round(26 * FONT_STEPS[fontSizeStep]) }]}>
              {diffWords(story.previous_body, story.body).map((part, i) => {
                if (part.removed) return null;
                return (
                  <Text key={i} style={part.added ? { color: colors.primary, fontWeight: '600', backgroundColor: colors.primary + '20' } : undefined}>
                    {part.value}
                  </Text>
                );
              })}
            </Text>
          ) : (
            <Text style={[styles.storyBody, fontSizeStep > 0 && { fontSize: Math.round(16 * FONT_STEPS[fontSizeStep]), lineHeight: Math.round(26 * FONT_STEPS[fontSizeStep]) }]}>{isTranslated && translatedBody ? translatedBody : story.body}</Text>
          )}

          {/* Show Original Toggle (Moderator Only) */}
          {isModeratorMode && story.status === 'pending' && (story.previous_body || story.previous_title) && (
            <View style={{ marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => setShowOriginalVersion(!showOriginalVersion)}
                style={styles.showOriginalBtn}
              >
                <Ionicons name={showOriginalVersion ? "eye-off-outline" : "eye-outline"} size={16} color={colors.primary} />
                <Text style={[styles.showOriginalBtnText, { color: colors.primary }]}>
                  {showOriginalVersion ? "Hide original version" : "View entire original version"}
                </Text>
              </TouchableOpacity>

              {showOriginalVersion && (
                <View style={[styles.previousVersionContainer, { backgroundColor: isDark ? colors.borderCard : '#F9F9FB', borderColor: colors.borderCard }]}>
                  <Text style={styles.previousVersionTitleText}>Original Submitted Version</Text>
                  {story.previous_title && (
                    <Text style={[styles.storyTitle, { fontSize: 18, color: COLORS.textLight, marginBottom: 8 }]}>
                      {story.previous_title}
                    </Text>
                  )}
                  {story.previous_body && (
                    <Text style={[styles.storyBody, { color: COLORS.textMuted }]}>
                      {story.previous_body}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

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

          {/* Looking for */}
          {Array.isArray(story.looking_for) && story.looking_for.length > 0 && (
            <Text style={styles.lookingForText}>
              {getLookingForText(story.looking_for)}
            </Text>
          )}

          {/* Extraneous stuff hidden for moderators */}
          {!(isModeratorMode && story.status === 'pending') && (
            <>
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
                        name={liked ? "heart" : "heart-outline"}
                        size={24}
                        color={liked ? "#E53935" : COLORS.textLight}
                      />
                    </RNAnimated.View>
                    <Text
                      style={[styles.actionText, liked && { color: "#E53935" }]}
                    >
                      {story.like_count}
                    </Text>
                  </TouchableOpacity>

                  {/* Comments count */}
                  <TouchableOpacity
                    style={styles.actionItem}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => setIsCommentsModalVisible(true)}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={22}
                      color={COLORS.textLight}
                    />
                    <Text style={styles.actionText}>{comments.length}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.actionRight}>
                  {!isOwnStory && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity
                        onPress={() => {
                          if (!isStoryReported(id || "")) {
                            setShowReportModal(true);
                          }
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name={isStoryReported(id || "") ? "flag" : "flag-outline"}
                          size={22}
                          color={isStoryReported(id || "") ? colors.error : COLORS.textLight}
                        />
                      </TouchableOpacity>
                      {isModeratorMode && isStoryReported(id || "") && (
                        <TouchableOpacity
                          onPress={handleDismissStoryReport}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={{
                            backgroundColor: colors.primary + '12',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: colors.primary + '25',
                          }}
                        >
                          <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700', textTransform: 'uppercase' }}>Dismiss</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={handleDownload}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <RNAnimated.View style={{ transform: [{ scale: downloadScale }] }}>
                      <Ionicons
                        name={downloaded ? "checkmark-circle" : "download-outline"}
                        size={24}
                        color={downloaded ? colors.primary : COLORS.textLight}
                      />
                    </RNAnimated.View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleBookmark}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <RNAnimated.View
                      style={{ transform: [{ scale: bookmarkScale }] }}
                    >
                      <Ionicons
                        name={bookmarked ? "bookmark" : "bookmark-outline"}
                        size={24}
                        color={bookmarked ? colors.primary : COLORS.textLight}
                      />
                    </RNAnimated.View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Recommendations */}
              {story && (
                <RecommendationList
                  currentId={story.id}
                  currentTags={story.story_tags || []}
                />
              )}
            </>
          )}
        </ScrollView>

        {/* Comment input - only on mobile/native when sidebar is NOT used */}
        {!isLargeWeb && renderCommentInput()}
        {/* Web Sidebar Comments */}
        {isLargeWeb && isCommentsModalVisible && (
          <View style={styles.webSidebar}>
            {renderCommentsContent()}
          </View>
        )}
        </View>
      </KeyboardAvoidingView>

      {/* Comments Bottom Sheet Modal - Only for mobile/native */}
      {!isLargeWeb && (
        <Modal
          visible={isCommentsModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsCommentsModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={[
              styles.modalOverlay, 
              Platform.OS === 'web' && { 
                alignItems: 'center', 
                justifyContent: 'center', 
                position: 'fixed' as any,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
                backgroundColor: 'rgba(0,0,0,0.5)'
              }
            ]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
          >
            <Pressable 
              style={[
                styles.modalBgDismiss, 
                Platform.OS === 'web' && { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }
              ]} 
              onPress={() => setIsCommentsModalVisible(false)} 
            />
            {renderCommentsContent()}
          </KeyboardAvoidingView>
        </Modal>
      )}

      <ReportCommentModal
        visible={showCommentReportModal}
        onClose={() => setShowCommentReportModal(false)}
        onSubmit={async (reason, details) => {
          if (selectedCommentId) {
            await reportComment(selectedCommentId, reason, details);
            if (Platform.OS === 'web') {
              window.alert("Report received. Our moderators will review this comment shortly.");
            } else {
              Alert.alert("Report Received", "Our moderators will review this comment shortly.");
            }
            setSelectedCommentId(null);
          }
        }}
      />

      <ReportStoryModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={async (reason, details) => {
          if (!story) return;
          try {
            await reportStory(story.id, reason, details);
            if (Platform.OS === 'web') {
              window.alert("Story reported. Our moderators will review it shortly.");
            } else {
              Alert.alert("Report Received", "Our moderators will review this story shortly.");
            }
          } catch (error) {
            if (Platform.OS === 'web') {
              window.alert("Failed to submit report. Please try again.");
            } else {
              Alert.alert("Error", "Failed to submit report. Please try again.");
            }
          }
        }}
      />


    </View>
  );
}

const makeStyles = (c: typeof import("../constants/theme").COLORS_LIGHT, _isDark: boolean, fontScale = 1) => {
  const fs = (size: number) => Math.round(size * fontScale);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.white,
    },
    webHeaderInner: {
      width: "100%" as any,
      maxWidth: 800 as any,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: 20,
    },
    webContainer: {
      width: "100%" as any,
      maxWidth: 800 as any,
      alignSelf: "center" as any,
      flex: 1,
    },
    webSidebar: {
      width: 400,
      height: '100%',
      backgroundColor: c.white,
    },
    webMaxWidth: {
      width: "100%" as any,
      maxWidth: 800 as any,
      alignSelf: "center" as any,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },
    notFound: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    notFoundText: {
      ...TYPOGRAPHY.body,
      color: c.textMuted,
    },
    meta: {
      fontSize: fs(12),
      color: COLORS.textLight,
      fontWeight: "400",
      marginBottom: 10,
    },
    storyTitle: {
      fontSize: fs(22),
      fontWeight: "700",
      color: c.textDark,
      lineHeight: fs(29),
      letterSpacing: -0.3,
      marginBottom: 14,
    },
    previousVersionContainer: {
      padding: 16,
      borderRadius: 12,
      marginTop: 12,
      borderWidth: 1,
    },
    previousVersionTitleText: {
      fontSize: fs(12),
      fontWeight: '600',
      color: COLORS.textLight,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    showOriginalBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      gap: 6,
    },
    showOriginalBtnText: {
      fontSize: fs(14),
      fontWeight: '600',
    },
    lookingForText: {
      fontSize: fs(12),
      fontStyle: "italic",
      color: c.textLight,
      marginTop: 12,
    },
    storyBody: {
      fontSize: fs(16),
      fontWeight: "400",
      color: c.textDark,
      lineHeight: fs(26),
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 16,
    },
    tagBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 100,
    },
    tagText: {
      fontSize: fs(12),
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    audioControlsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
      gap: 10,
    },
    listenBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.primary + "15",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 100,
    },
    listenBtnPlaying: {
      backgroundColor: c.primary,
    },
    listenBtnText: {
      fontSize: fs(14),
      fontWeight: "700",
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
      fontSize: fs(13),
      fontWeight: "600",
      color: c.textMuted,
    },
    actionBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      marginTop: 18,
      marginBottom: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "#E5E5EA",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#E5E5EA",
    },
    actionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    actionItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    actionRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 20,
    },
    actionText: {
      fontSize: fs(14),
      fontWeight: "500",
      color: COLORS.textLight,
    },
    commentsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 28,
      marginBottom: 8,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    commentsTitle: {
      fontSize: fs(16),
      fontWeight: "700",
      color: c.textDark,
    },
    commentsListContainer: {
      paddingHorizontal: 4,
      paddingBottom: 20,
    },
    noComments: {
      fontSize: fs(14),
      color: c.textLight,
      paddingVertical: 20,
    },
    commentInputWrapper: {
      backgroundColor: c.white,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "#E5E5EA",
      paddingTop: 8,
    },
    reminderText: {
      fontSize: fs(12),
      fontStyle: 'italic',
      color: c.textLight,
      textAlign: 'center',
      marginBottom: 8,
    },
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 16,
      backgroundColor: c.white,
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
      fontSize: fs(15),
      fontWeight: "400",
      color: c.textDark,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "#E5E5EA",
    },
    sendButton: {
      padding: 8,
      marginBottom: 2,
    },
    anonRow: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
    },
    anonToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 100,
      backgroundColor: COLORS.appBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "#E5E5EA",
    },
    anonToggleActive: {
      backgroundColor: COLORS.primary + "12",
      borderColor: COLORS.primary + "40",
    },
    anonToggleText: {
      fontSize: fs(12),
      fontWeight: "500",
      color: COLORS.textLight,
    },
    guestCommentWrapper: {
      backgroundColor: c.white,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "#E5E5EA",
      paddingTop: 16,
      alignItems: 'center',
    },
    guestCommentText: {
      fontSize: fs(14),
      color: c.textMuted,
      fontWeight: '500',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalBgDismiss: {
      flex: 1,
      width: '100%',
    },
    modalContent: {
      backgroundColor: c.white,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      height: '80%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E5E5EA',
    },
    modalTitle: {
      fontSize: fs(18),
      fontWeight: '700',
      color: c.textDark,
    },
    modalScroll: {
      flex: 1,
    },
    modalScrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingTop: 10,
    },
  });
};
