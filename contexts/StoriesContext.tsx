import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useOnboarding, UserRole } from './OnboardingContext';
import { useOffline, queueOfflineChange } from './OfflineContext';
import { moderateContent } from '../services/moderation';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

export interface StoryComment {
  id: string;
  story_id: string;
  author_id: string;
  body: string;
  author_name: string;
  author_role: UserRole | null;
  created_at: string;
}

interface StoriesContextType {
  stories: Story[];
  storiesLoading: boolean;
  refreshStories: () => Promise<void>;
  createStory: (title: string, body: string, postAnonymously?: boolean) => Promise<Story | null>;
  deleteStory: (storyId: string) => Promise<void>;
  fetchComments: (storyId: string) => Promise<StoryComment[]>;
  addComment: (storyId: string, body: string) => Promise<StoryComment | null>;
  deleteComment: (commentId: string, storyId: string) => Promise<void>;
  storyBookmarks: string[];
  isStoryBookmarked: (storyId: string) => boolean;
  addStoryBookmark: (storyId: string) => Promise<void>;
  removeStoryBookmark: (storyId: string) => Promise<void>;
}

const StoriesContext = createContext<StoriesContextType | undefined>(undefined);

const STORIES_CACHE_KEY = '@schoolkit_stories_cache';
const STORY_BOOKMARKS_KEY = '@schoolkit_story_bookmarks';

export function StoriesProvider({ children }: { children: ReactNode }) {
  const { user, isAnonymous } = useAuth();
  const { data: onboardingData } = useOnboarding();
  const { isOnline } = useOffline();
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storyBookmarks, setStoryBookmarks] = useState<string[]>([]);

  // Load stories and bookmarks when user is available
  useEffect(() => {
    if (user) {
      fetchStories();
      fetchStoryBookmarks();
    } else {
      setStories([]);
      setStoryBookmarks([]);
      setStoriesLoading(false);
    }
  }, [user?.id]);

  const fetchStories = async () => {
    try {
      setStoriesLoading(true);

      // Fetch stories
      const { data: storiesData, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (storiesData) {
        // Fetch comment counts for all stories
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

        const enriched: Story[] = storiesData.map(s => ({
          id: s.id,
          author_id: s.author_id,
          title: s.title,
          body: s.body,
          author_name: s.author_name,
          author_role: s.author_role as UserRole | null,
          created_at: s.created_at,
          updated_at: s.updated_at,
          comment_count: commentCounts[s.id] || 0,
        }));

        setStories(enriched);
        AsyncStorage.setItem(STORIES_CACHE_KEY, JSON.stringify(enriched));
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      // Fall back to cache
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

  const refreshStories = async () => {
    await fetchStories();
  };

  const createStory = async (title: string, body: string, postAnonymously: boolean = false): Promise<Story | null> => {
    if (!user?.id || isAnonymous) return null;

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
    };

    // Optimistic update
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
        })
        .select()
        .single();

      if (error) throw error;

      const newStory: Story = {
        ...data,
        author_role: data.author_role as UserRole | null,
        comment_count: 0,
      };

      // Replace optimistic entry with real one
      setStories(prev => {
        const updated = prev.map(s => s.id === optimisticStory.id ? newStory : s);
        AsyncStorage.setItem(STORIES_CACHE_KEY, JSON.stringify(updated));
        return updated;
      });

      return newStory;
    } catch (error) {
      console.error('Error creating story:', error);
      // Revert optimistic update
      setStories(prev => prev.filter(s => s.id !== optimisticStory.id));
      return null;
    }
  };

  const deleteStory = async (storyId: string) => {
    const removed = stories.find(s => s.id === storyId);
    if (!removed) return;

    // Optimistic update
    setStories(prev => {
      const updated = prev.filter(s => s.id !== storyId);
      AsyncStorage.setItem(STORIES_CACHE_KEY, JSON.stringify(updated));
      return updated;
    });

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting story:', error);
      // Revert
      setStories(prev => {
        const updated = [removed, ...prev];
        AsyncStorage.setItem(STORIES_CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
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
      return (data || []).map(c => ({
        id: c.id,
        story_id: c.story_id,
        author_id: c.author_id,
        body: c.body,
        author_name: c.author_name,
        author_role: c.author_role as UserRole | null,
        created_at: c.created_at,
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };

  const addComment = async (storyId: string, body: string): Promise<StoryComment | null> => {
    if (!user?.id || isAnonymous) return null;

    try {
      // Moderate content before posting
      const moderationResult = await moderateContent(body);
      if (!moderationResult.safe) {
        throw new Error(moderationResult.reason || "Content flagged as inappropriate.");
      }

      const { data, error } = await supabase
        .from('story_comments')
        .insert({
          story_id: storyId,
          author_id: user.id,
          body,
          author_name: onboardingData.name || 'Anonymous',
          author_role: onboardingData.role,
        })
        .select()
        .single();

      if (error) throw error;

      // Update comment count in stories list
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
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  const deleteComment = async (commentId: string, storyId: string) => {
    try {
      const { error } = await supabase
        .from('story_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Update comment count
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

  const isStoryBookmarked = (storyId: string) => storyBookmarks.includes(storyId);

  const addStoryBookmark = async (storyId: string) => {
    setStoryBookmarks(prev => {
      const updated = [storyId, ...prev];
      AsyncStorage.setItem(STORY_BOOKMARKS_KEY, JSON.stringify(updated));
      return updated;
    });

    if (!user?.id) return;

    if (!isOnline) {
      await queueOfflineChange({
        type: 'story_bookmark_add',
        payload: { user_id: user.id, story_id: storyId },
      });
      return;
    }

    const { error } = await supabase
      .from('story_bookmarks')
      .insert({ user_id: user.id, story_id: storyId });

    if (error) {
      // If the error is a unique constraint violation (23505), it means the bookmark
      // already exists. We can treat this as a success and keep the optimistic update.
      if (error.code === '23505') {
        console.warn('Story already bookmarked (duplicate key ignored).');
      } else {
        console.error('Error adding story bookmark:', error);
        setStoryBookmarks(prev => {
          const updated = prev.filter(id => id !== storyId);
          AsyncStorage.setItem(STORY_BOOKMARKS_KEY, JSON.stringify(updated));
          return updated;
        });
      }
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
      await queueOfflineChange({
        type: 'story_bookmark_remove',
        payload: { user_id: user.id, story_id: storyId },
      });
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
