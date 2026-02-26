import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useOnboarding, UserRole } from './OnboardingContext';
import { useOffline, queueOfflineChange } from './OfflineContext';
import { moderateContent } from '../services/moderation';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type StoryStatus = 'pending' | 'approved' | 'rejected';

export interface Story {
  id: string;
  author_id: string;
  title: string;
  body: string;
  author_name: string;
  author_role: UserRole | null;
  created_at: string;
  updated_at: string;
  comment_count: number;
  like_count: number;
  status: StoryStatus;
  rejected_norms?: string[];
  report_count: number;
  attempt_count: number;
  looking_for?: string[];
  target_audiences?: string[];
  story_tags?: string[];
  reports?: { reason: string; details: string | null; created_at: string }[];
}

export interface StoryComment {
  id: string;
  story_id: string;
  author_id: string;
  body: string;
  author_name: string;
  author_role: UserRole | null;
  created_at: string;
  like_count: number;
}

interface StoriesContextType {
  stories: Story[];
  storiesLoading: boolean;
  refreshStories: () => Promise<void>;
  createStory: (title: string, body: string, options?: { postAnonymously?: boolean; lookingFor?: string[]; targetAudiences?: string[]; storyTags?: string[] }) => Promise<Story | null>;
  deleteStory: (storyId: string) => Promise<void>;
  fetchComments: (storyId: string) => Promise<StoryComment[]>;
  addComment: (storyId: string, body: string, postAnonymously?: boolean) => Promise<StoryComment | null>;
  deleteComment: (commentId: string, storyId: string) => Promise<void>;
  commentLikes: string[];
  isCommentLiked: (commentId: string) => boolean;
  toggleCommentLike: (commentId: string) => Promise<void>;
  storyBookmarks: string[];
  isStoryBookmarked: (storyId: string) => boolean;
  addStoryBookmark: (storyId: string) => Promise<void>;
  removeStoryBookmark: (storyId: string) => Promise<void>;
  storyLikes: string[];
  isStoryLiked: (storyId: string) => boolean;
  toggleLike: (storyId: string) => Promise<void>;
  rejectStory: (storyId: string, rejectedNorms: string[]) => Promise<void>;
  dismissReport: (storyId: string) => Promise<void>;
  approveStory: (storyId: string) => Promise<void>;
  updateStory: (storyId: string, title: string, body: string, options?: { postAnonymously?: boolean; lookingFor?: string[]; targetAudiences?: string[]; storyTags?: string[] }) => Promise<Story | null>;
  reportStory: (storyId: string, reason: string, details?: string) => Promise<void>;
  downloadedStories: Story[];
  isStoryDownloaded: (storyId: string) => boolean;
  downloadStory: (story: Story) => void;
  removeStoryDownload: (storyId: string) => void;
}

const StoriesContext = createContext<StoriesContextType | undefined>(undefined);

const STORIES_CACHE_KEY = '@schoolkit_stories_cache';
const STORY_BOOKMARKS_KEY = '@schoolkit_story_bookmarks';
const STORY_LIKES_KEY = '@schoolkit_story_likes';
const COMMENT_LIKES_KEY = '@schoolkit_comment_likes';
const STORY_DOWNLOADS_KEY = '@schoolkit_story_downloads';

export function StoriesProvider({ children }: { children: ReactNode }) {
  const { user, isAnonymous } = useAuth();
  const { data: onboardingData } = useOnboarding();
  const { isOnline } = useOffline();
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storyBookmarks, setStoryBookmarks] = useState<string[]>([]);
  const [storyLikes, setStoryLikes] = useState<string[]>([]);
  const [commentLikes, setCommentLikes] = useState<string[]>([]);
  const [downloadedStories, setDownloadedStories] = useState<Story[]>([]);

  // Load downloads once on mount — available offline regardless of auth state
  useEffect(() => {
    AsyncStorage.getItem(STORY_DOWNLOADS_KEY).then(stored => {
      if (stored) setDownloadedStories(JSON.parse(stored));
    }).catch(() => {});
  }, []);

  const isStoryDownloaded = (storyId: string) => downloadedStories.some(s => s.id === storyId);

  const downloadStory = (story: Story) => {
    setDownloadedStories(prev => {
      if (prev.some(s => s.id === story.id)) return prev;
      const updated = [story, ...prev];
      AsyncStorage.setItem(STORY_DOWNLOADS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeStoryDownload = (storyId: string) => {
    setDownloadedStories(prev => {
      const updated = prev.filter(s => s.id !== storyId);
      AsyncStorage.setItem(STORY_DOWNLOADS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (user) {
      fetchStories();
      fetchStoryBookmarks();
      fetchStoryLikes();
      fetchCommentLikes();
    } else {
      setStories([]);
      setStoryBookmarks([]);
      setStoryLikes([]);
      setCommentLikes([]);
      setStoriesLoading(false);
    }
  }, [user?.id]);

  const fetchCommentLikes = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id);
      if (error) throw error;
      if (data) {
        const ids = data.map((l: { comment_id: string }) => l.comment_id);
        setCommentLikes(ids);
        AsyncStorage.setItem(COMMENT_LIKES_KEY, JSON.stringify(ids));
      }
    } catch {
      try {
        const cached = await AsyncStorage.getItem(COMMENT_LIKES_KEY);
        if (cached) setCommentLikes(JSON.parse(cached));
      } catch {}
    }
  };

  const fetchStories = async () => {
    try {
      setStoriesLoading(true);

      const { data: storiesData, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (storiesData) {
        const storyIds = storiesData.map(s => s.id);
        let commentCounts: Record<string, number> = {};

        if (storyIds.length > 0) {
          const { data: comments, error: countError } = await supabase
            .from('story_comments')
            .select('story_id')
            .in('story_id', storyIds);

          if (!countError && comments) {
            commentCounts = comments.reduce((acc: Record<string, number>, c) => {
              acc[c.story_id] = (acc[c.story_id] || 0) + 1;
              return acc;
            }, {});
          }
        }

        const enriched: Story[] = storiesData.map((s: any) => {
          let parsedLookingFor: string[] = [];
          if (Array.isArray(s.looking_for)) {
            parsedLookingFor = s.looking_for;
          } else if (typeof s.looking_for === 'string') {
            try {
              parsedLookingFor = JSON.parse(s.looking_for);
            } catch (e) {
              parsedLookingFor = s.looking_for.split(',').map((x: string) => x.trim()).filter((x: string) => x);
            }
          }
          let parsedTargetAudiences: string[] = ['student-k8', 'student-hs', 'parent', 'staff'];
          if (Array.isArray(s.target_audiences)) {
            parsedTargetAudiences = s.target_audiences;
          } else if (typeof s.target_audiences === 'string') {
            try {
              parsedTargetAudiences = JSON.parse(s.target_audiences);
            } catch (e) {
              parsedTargetAudiences = s.target_audiences.split(',').map((x: string) => x.trim()).filter((x: string) => x);
            }
          }

          let parsedStoryTags: string[] = [];
          if (Array.isArray(s.story_tags)) {
            parsedStoryTags = s.story_tags;
          } else if (typeof s.story_tags === 'string') {
            try {
              parsedStoryTags = JSON.parse(s.story_tags);
            } catch (e) {
              parsedStoryTags = s.story_tags.split(',').map((x: string) => x.trim()).filter((x: string) => x);
            }
          }
          
          return {
            id: s.id,
            author_id: s.author_id,
            title: s.title,
            body: s.body,
            author_name: s.author_name,
            author_role: s.author_role as UserRole | null,
            created_at: s.created_at,
            updated_at: s.updated_at,
            comment_count: commentCounts[s.id] || 0,
            like_count: s.likes_count || 0,
            status: s.status || 'approved',
            rejected_norms: s.rejected_norms || [],
            report_count: s.report_count || 0,
            attempt_count: s.attempt_count || 1,
            looking_for: parsedLookingFor,
            target_audiences: parsedTargetAudiences,
            story_tags: parsedStoryTags,
            reports: [],
          };
        });

        // Batch fetch reports for stories that actually have reports or are pending
        const storiesToFetchReports = enriched.filter(s => s.report_count > 0 || s.status === 'pending');
        if (storiesToFetchReports.length > 0) {
          const { data: reportsData } = await supabase
            .from('story_reports')
            .select('story_id, reason, details, created_at')
            .in('story_id', storiesToFetchReports.map(s => s.id));
            
          if (reportsData) {
            const reportsByStoryId = reportsData.reduce((acc: Record<string, any[]>, r) => {
              if (!acc[r.story_id]) acc[r.story_id] = [];
              acc[r.story_id].push({ reason: r.reason, details: r.details, created_at: r.created_at });
              return acc;
            }, {});
            
            for (const s of enriched) {
              if (reportsByStoryId[s.id]) {
                s.reports = reportsByStoryId[s.id];
              }
            }
          }
        }

        setStories(enriched);
        AsyncStorage.setItem(STORIES_CACHE_KEY, JSON.stringify(enriched));
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      try {
        const cached = await AsyncStorage.getItem(STORIES_CACHE_KEY);
        if (cached) setStories(JSON.parse(cached));
      } catch {}
    } finally {
      setStoriesLoading(false);
    }
  };

  const fetchStoryBookmarks = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('story_bookmarks')
        .select('story_id')
        .eq('user_id', user.id);

      if (error) throw error;
      if (data) {
        const ids = data.map(b => b.story_id);
        setStoryBookmarks(ids);
        AsyncStorage.setItem(STORY_BOOKMARKS_KEY, JSON.stringify(ids));
      }
    } catch (error) {
      console.error('Error fetching story bookmarks:', error);
      try {
        const cached = await AsyncStorage.getItem(STORY_BOOKMARKS_KEY);
        if (cached) setStoryBookmarks(JSON.parse(cached));
      } catch {}
    }
  };

  const fetchStoryLikes = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('story_likes')
        .select('story_id')
        .eq('user_id', user.id);

      if (error) throw error;
      if (data) {
        const ids = data.map(l => l.story_id);
        setStoryLikes(ids);
        AsyncStorage.setItem(STORY_LIKES_KEY, JSON.stringify(ids));
      }
    } catch (error) {
      console.error('Error fetching story likes:', error);
      try {
        const cached = await AsyncStorage.getItem(STORY_LIKES_KEY);
        if (cached) setStoryLikes(JSON.parse(cached));
      } catch {}
    }
  };

  const refreshStories = async () => {
    await fetchStories();
  };

  const createStory = async (title: string, body: string, options?: { postAnonymously?: boolean; lookingFor?: string[]; targetAudiences?: string[]; storyTags?: string[] }): Promise<Story | null> => {
    if (!user?.id || isAnonymous) return null;

    const { postAnonymously = false, lookingFor = [], targetAudiences = ['student-k8', 'student-hs', 'parent', 'staff'], storyTags = [] } = options || {};

    const displayName = postAnonymously ? 'Anonymous' : (onboardingData.name || 'Anonymous');
    const displayRole = postAnonymously ? null : onboardingData.role;

    const optimisticStory: Story = {
      id: `temp-${Date.now()}`,
      author_id: user.id,
      title,
      body,
      author_name: displayName,
      author_role: displayRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      comment_count: 0,
      like_count: 0,
      report_count: 0,
      status: 'pending',
      attempt_count: 1,
      looking_for: lookingFor,
      target_audiences: targetAudiences,
      story_tags: storyTags,
    };

    setStories(prev => [optimisticStory, ...prev]);

    try {
      const { data, error } = await supabase
        .from('stories')
        .insert({
          author_id: user.id,
          title,
          body,
          author_name: displayName,
          author_role: displayRole,
          status: 'pending',
          attempt_count: 1,
          looking_for: lookingFor,
          target_audiences: targetAudiences,
          story_tags: storyTags,
        })
        .select()
        .single();

      if (error) throw error;

      const newStory: Story = {
        ...data,
        author_role: data.author_role as UserRole | null,
        comment_count: 0,
        like_count: 0,
        report_count: data.report_count || 0,
        status: data.status,
        attempt_count: data.attempt_count,
        rejected_norms: data.rejected_norms,
      };

      setStories(prev => {
        const updated = prev.map(s => s.id === optimisticStory.id ? newStory : s);
        AsyncStorage.setItem(STORIES_CACHE_KEY, JSON.stringify(updated));
        return updated;
      });

      return newStory;
    } catch (error) {
      console.error('Error creating story:', error);
      setStories(prev => prev.filter(s => s.id !== optimisticStory.id));
      return null;
    }
  };

  const deleteStory = async (storyId: string) => {
    const removed = stories.find(s => s.id === storyId);
    if (!removed) return;

    setStories(prev => {
      const updated = prev.filter(s => s.id !== storyId);
      AsyncStorage.setItem(STORIES_CACHE_KEY, JSON.stringify(updated));
      return updated;
    });

    try {
      const { error } = await supabase.from('stories').delete().eq('id', storyId);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting story:', error);
      setStories(prev => {
        const updated = [removed, ...prev];
        AsyncStorage.setItem(STORIES_CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  };

  const rejectStory = async (storyId: string, rejectedNorms: string[]) => {
    setStories(prev => prev.map(s =>
      s.id === storyId ? { ...s, status: 'rejected', rejected_norms: rejectedNorms } : s
    ));

    try {
      const { error } = await supabase
        .from('stories')
        .update({ status: 'rejected', rejected_norms: rejectedNorms })
        .eq('id', storyId);
      if (error) throw error;
    } catch (error) {
      console.error('Error rejecting story:', error);
      setStories(prev => prev.map(s =>
        s.id === storyId ? { ...s, status: 'pending', rejected_norms: [] } : s
      ));
    }
  };

  const approveStory = async (storyId: string) => {
    setStories(prev => prev.map(s =>
      s.id === storyId ? { ...s, status: 'approved' } : s
    ));

    try {
      const { error } = await supabase
        .from('stories')
        .update({ status: 'approved' })
        .eq('id', storyId);
      if (error) throw error;
    } catch (error) {
      console.error('Error approving story:', error);
      setStories(prev => prev.map(s =>
        s.id === storyId ? { ...s, status: 'pending' } : s
      ));
    }
  };

  const dismissReport = async (storyId: string) => {
    // Optimistically UI update
    setStories(prev => prev.map(s =>
      s.id === storyId ? { ...s, report_count: 0, reports: [] } : s
    ));

    try {
      // Delete the actual reports and the trigger will handle the count
      const { error } = await supabase
        .from('story_reports')
        .delete()
        .eq('story_id', storyId);
      if (error) throw error;
      
      // Also manually reset report_count to 0 on the story, just in case
      await supabase
        .from('stories')
        .update({ report_count: 0 })
        .eq('id', storyId);
    } catch (error) {
      console.error('Error dismissing reports:', error);
      fetchStories(); // Refresh if failed
    }
  };

  const updateStory = async (storyId: string, title: string, body: string, options?: { postAnonymously?: boolean; lookingFor?: string[]; targetAudiences?: string[]; storyTags?: string[] }): Promise<Story | null> => {
    if (!user?.id || isAnonymous) return null;

    const { lookingFor = [], targetAudiences = ['student-k8', 'student-hs', 'parent', 'staff'], storyTags = [] } = options || {};

    try {
      const originalStory = stories.find(s => s.id === storyId);
      const isResubmitting = originalStory?.status === 'rejected';
      const newAttemptCount = isResubmitting ? (originalStory?.attempt_count || 1) + 1 : (originalStory?.attempt_count || 1);
      const newStatus = isResubmitting ? 'pending' : (originalStory?.status || 'pending');

      const updates: any = {
        title,
        body,
        status: newStatus,
        attempt_count: newAttemptCount,
        looking_for: lookingFor,
        target_audiences: targetAudiences,
        story_tags: storyTags,
      };

      if (isResubmitting) {
        updates.rejected_norms = [];
      }

      const { data, error } = await supabase
        .from('stories')
        .update(updates)
        .eq('id', storyId)
        .select()
        .single();

      if (error) throw error;

      const updatedStory: Story = {
        ...data,
        author_role: data.author_role as UserRole | null,
        comment_count: originalStory?.comment_count || 0,
        like_count: originalStory?.like_count || 0,
        report_count: data.report_count || originalStory?.report_count || 0,
        status: data.status,
        attempt_count: data.attempt_count,
        rejected_norms: data.rejected_norms || [],
      };

      setStories(prev => {
        const updated = prev.map(s => s.id === storyId ? updatedStory : s);
        AsyncStorage.setItem(STORIES_CACHE_KEY, JSON.stringify(updated));
        return updated;
      });

      return updatedStory;
    } catch (error) {
      console.error('Error updating story:', error);
      return null;
    }
  };

  const fetchComments = async (storyId: string): Promise<StoryComment[]> => {
    try {
      const { data, error } = await supabase
        .from('story_comments')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const commentData = data || [];

      // Fetch like counts for these comments
      let likeCounts: Record<string, number> = {};
      if (commentData.length > 0) {
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .in('comment_id', commentData.map(c => c.id));
        if (likes) {
          likeCounts = likes.reduce((acc: Record<string, number>, l) => {
            acc[l.comment_id] = (acc[l.comment_id] || 0) + 1;
            return acc;
          }, {});
        }
      }

      return commentData.map(c => ({
        id: c.id,
        story_id: c.story_id,
        author_id: c.author_id,
        body: c.body,
        author_name: c.author_name,
        author_role: c.author_role as UserRole | null,
        created_at: c.created_at,
        like_count: likeCounts[c.id] || 0,
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };

  const addComment = async (storyId: string, body: string, postAnonymously = false): Promise<StoryComment | null> => {
    if (!user?.id || isAnonymous) return null;

    try {
      const moderationResult = await moderateContent(body);
      if (!moderationResult.safe) {
        throw new Error(moderationResult.reason || "Content flagged as inappropriate.");
      }

      const displayName = postAnonymously ? 'Anonymous' : (onboardingData.name || 'Anonymous');
      const displayRole = postAnonymously ? null : onboardingData.role;

      const { data, error } = await supabase
        .from('story_comments')
        .insert({
          story_id: storyId,
          author_id: user.id,
          body,
          author_name: displayName,
          author_role: displayRole,
        })
        .select()
        .single();

      if (error) throw error;

      setStories(prev => {
        const updated = prev.map(s =>
          s.id === storyId ? { ...s, comment_count: s.comment_count + 1 } : s
        );
        AsyncStorage.setItem(STORIES_CACHE_KEY, JSON.stringify(updated));
        return updated;
      });

      return {
        id: data.id,
        story_id: data.story_id,
        author_id: data.author_id,
        body: data.body,
        author_name: data.author_name,
        author_role: data.author_role as UserRole | null,
        created_at: data.created_at,
        like_count: 0,
      };
    } catch (error) {
      throw error;
    }
  };

  const deleteComment = async (commentId: string, storyId: string) => {
    try {
      const { error } = await supabase.from('story_comments').delete().eq('id', commentId);
      if (error) throw error;

      setStories(prev => {
        const updated = prev.map(s =>
          s.id === storyId ? { ...s, comment_count: Math.max(0, s.comment_count - 1) } : s
        );
        AsyncStorage.setItem(STORIES_CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const isCommentLiked = (commentId: string) => commentLikes.includes(commentId);

  const toggleCommentLike = async (commentId: string) => {
    if (!user?.id) return;
    const liked = commentLikes.includes(commentId);
    if (liked) {
      setCommentLikes(prev => {
        const updated = prev.filter(id => id !== commentId);
        AsyncStorage.setItem(COMMENT_LIKES_KEY, JSON.stringify(updated));
        return updated;
      });
    } else {
      setCommentLikes(prev => {
        const updated = [commentId, ...prev];
        AsyncStorage.setItem(COMMENT_LIKES_KEY, JSON.stringify(updated));
        return updated;
      });
    }
    try {
      if (liked) {
        const { error } = await supabase.from('comment_likes').delete().eq('user_id', user.id).eq('comment_id', commentId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('comment_likes').insert({ user_id: user.id, comment_id: commentId });
        if (error && error.code !== '23505') throw error;
      }
    } catch {
      // Revert
      if (liked) {
        setCommentLikes(prev => { const u = [commentId, ...prev]; AsyncStorage.setItem(COMMENT_LIKES_KEY, JSON.stringify(u)); return u; });
      } else {
        setCommentLikes(prev => { const u = prev.filter(id => id !== commentId); AsyncStorage.setItem(COMMENT_LIKES_KEY, JSON.stringify(u)); return u; });
      }
    }
  };

  const isStoryBookmarked = (storyId: string) => storyBookmarks.includes(storyId);

  const addStoryBookmark = async (storyId: string) => {
    setStoryBookmarks(prev => {
      const updated = [storyId, ...prev];
      AsyncStorage.setItem(STORY_BOOKMARKS_KEY, JSON.stringify(updated));
      return updated;
    });

    if (!user?.id) return;

    if (!isOnline) {
      await queueOfflineChange({ type: 'story_bookmark_add', payload: { user_id: user.id, story_id: storyId } });
      return;
    }

    const { error } = await supabase.from('story_bookmarks').insert({ user_id: user.id, story_id: storyId });
    if (error) {
      if (error.code === '23505') return;
      console.error('Error adding story bookmark:', error);
      setStoryBookmarks(prev => {
        const updated = prev.filter(id => id !== storyId);
        AsyncStorage.setItem(STORY_BOOKMARKS_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  };

  const removeStoryBookmark = async (storyId: string) => {
    setStoryBookmarks(prev => {
      const updated = prev.filter(id => id !== storyId);
      AsyncStorage.setItem(STORY_BOOKMARKS_KEY, JSON.stringify(updated));
      return updated;
    });

    if (!user?.id) return;

    if (!isOnline) {
      await queueOfflineChange({ type: 'story_bookmark_remove', payload: { user_id: user.id, story_id: storyId } });
      return;
    }

    const { error } = await supabase
      .from('story_bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('story_id', storyId);

    if (error) {
      console.error('Error removing story bookmark:', error);
      setStoryBookmarks(prev => {
        const updated = [storyId, ...prev];
        AsyncStorage.setItem(STORY_BOOKMARKS_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  };

  const isStoryLiked = (storyId: string) => storyLikes.includes(storyId);

  const toggleLike = async (storyId: string) => {
    if (!user?.id) return;

    const liked = storyLikes.includes(storyId);
    const currentCount = stories.find(s => s.id === storyId)?.like_count || 0;
    const newCount = liked ? Math.max(0, currentCount - 1) : currentCount + 1;

    // Optimistic update
    if (liked) {
      setStoryLikes(prev => prev.filter(id => id !== storyId));
    } else {
      setStoryLikes(prev => [storyId, ...prev]);
    }
    setStories(prev => prev.map(s =>
      s.id === storyId ? { ...s, like_count: newCount } : s
    ));

    try {
      if (liked) {
        const { error } = await supabase
          .from('story_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('story_id', storyId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('story_likes')
          .insert({ user_id: user.id, story_id: storyId });
        if (error && error.code !== '23505') throw error;
      }
      // Sync likes_count back to stories table
      await supabase.from('stories').update({ likes_count: newCount }).eq('id', storyId);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert
      if (liked) {
        setStoryLikes(prev => [storyId, ...prev]);
      } else {
        setStoryLikes(prev => prev.filter(id => id !== storyId));
      }
      setStories(prev => prev.map(s =>
        s.id === storyId ? { ...s, like_count: currentCount } : s
      ));
    }
  };

  const reportStory = async (storyId: string, reason: string, details?: string) => {
    if (!user?.id) return;

    const newReport = { reason, details: details || null, created_at: new Date().toISOString() };

    // Optimistically update the UI to show increased report count and append the report details
    setStories(prev => prev.map(s =>
      s.id === storyId 
        ? { 
            ...s, 
            report_count: s.report_count + 1, 
            reports: [...(s.reports || []), newReport] 
          } 
        : s
    ));

    try {
      const { error } = await supabase
        .from('story_reports')
        .insert({
          story_id: storyId,
          user_id: user.id,
          reason,
          details: details || null
        });

      if (error && error.code !== '23505') throw error; // Ignore constraint violations (duplicate reports)
    } catch (error) {
      console.error('Error reporting story:', error);
      // Revert optimistic update
      setStories(prev => prev.map(s =>
        s.id === storyId 
          ? { 
              ...s, 
              report_count: Math.max(0, s.report_count - 1),
              reports: (s.reports || []).filter(r => r.created_at !== newReport.created_at)
            } 
          : s
      ));
    }
  };

  return (
    <StoriesContext.Provider
      value={{
        stories,
        storiesLoading,
        refreshStories,
        createStory,
        deleteStory,
        fetchComments,
        addComment,
        deleteComment,
        storyBookmarks,
        isStoryBookmarked,
        addStoryBookmark,
        removeStoryBookmark,
        storyLikes,
        isStoryLiked,
        toggleLike,
        rejectStory,
        dismissReport,
        approveStory,
        updateStory,
        reportStory,
        commentLikes,
        isCommentLiked,
        toggleCommentLike,
        downloadedStories,
        isStoryDownloaded,
        downloadStory,
        removeStoryDownload,
      }}
    >
      {children}
    </StoriesContext.Provider>
  );
}

export function useStories() {
  const context = useContext(StoriesContext);
  if (context === undefined) {
    throw new Error('useStories must be used within a StoriesProvider');
  }
  return context;
}
