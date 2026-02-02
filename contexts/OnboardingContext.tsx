import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'student-k8' | 'student-hs' | 'parent' | 'staff';
export type SchoolStatus = 'current-treatment' | 'returning-after-treatment' | 'supporting-student' | 'special-needs';

interface OnboardingData {
  name: string;
  role: UserRole | null;
  schoolStatuses: SchoolStatus[];
  gradeLevel: string;
  topics: string[];
  profilePicture: string | null;
  isCompleted: boolean;
}

export interface BookmarkWithTimestamp {
  resourceId: string;
  savedAt: number;
}

interface OnboardingContextType {
  data: OnboardingData;
  session: Session | null;
  loading: boolean;
  updateName: (name: string) => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
  updateSchoolStatuses: (statuses: SchoolStatus[]) => Promise<void>;
  updateGradeLevel: (level: string) => Promise<void>;
  updateTopics: (topics: string[]) => Promise<void>;
  updateProfilePicture: (uri: string | null) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  // Bookmarks
  bookmarks: string[];
  bookmarksWithTimestamps: BookmarkWithTimestamp[];
  addBookmark: (resourceId: string) => Promise<void>;
  removeBookmark: (resourceId: string) => Promise<void>;
  isBookmarked: (resourceId: string) => boolean;
  // Downloads
  downloads: string[];
  downloadResource: (resourceId: string) => Promise<void>;
  removeDownload: (resourceId: string) => Promise<void>;
  isDownloaded: (resourceId: string) => boolean;
  downloadAllResources: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialData: OnboardingData = {
  name: '',
  role: null,
  schoolStatuses: [],
  gradeLevel: '',
  topics: [],
  profilePicture: null,
  isCompleted: false,
};

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(initialData);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookmarksWithTimestamps, setBookmarksWithTimestamps] = useState<BookmarkWithTimestamp[]>([]);
  const [downloads, setDownloads] = useState<string[]>([]);

  // Load downloads from AsyncStorage on mount
  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const stored = await AsyncStorage.getItem('@schoolkit_downloads');
      if (stored) setDownloads(JSON.parse(stored));
    } catch (error) {
      console.error('Error loading downloads:', error);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setData(initialData);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile from Supabase
  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        setData({
          name: profile.name || '',
          role: profile.role as UserRole | null,
          schoolStatuses: (profile.school_statuses || []) as SchoolStatus[],
          gradeLevel: profile.grade_level || '',
          topics: profile.topics || [],
          profilePicture: profile.profile_picture_url,
          isCompleted: profile.is_completed || false,
        });
        // Fetch bookmarks
        fetchBookmarks(userId);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookmarks from Supabase
  const fetchBookmarks = async (userId: string) => {
    try {
      const { data: bookmarkData, error } = await supabase
        .from('user_bookmarks')
        .select('resource_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (bookmarkData) {
        const bookmarkIds = bookmarkData.map(b => b.resource_id);
        const withTimestamps: BookmarkWithTimestamp[] = bookmarkData.map(b => ({
          resourceId: b.resource_id,
          savedAt: new Date(b.created_at).getTime(),
        }));
        setBookmarks(bookmarkIds);
        setBookmarksWithTimestamps(withTimestamps);
        AsyncStorage.setItem('@schoolkit_bookmarks', JSON.stringify(bookmarkIds));
        AsyncStorage.setItem('@schoolkit_bookmarks_timestamps', JSON.stringify(withTimestamps));
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      // Try to load from cache
      const cached = await AsyncStorage.getItem('@schoolkit_bookmarks');
      const cachedTimestamps = await AsyncStorage.getItem('@schoolkit_bookmarks_timestamps');
      if (cached) setBookmarks(JSON.parse(cached));
      if (cachedTimestamps) setBookmarksWithTimestamps(JSON.parse(cachedTimestamps));
    }
  };

  // Update profile in Supabase
  const updateProfile = async (updates: Record<string, unknown>) => {
    if (!session?.user?.id) return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id);

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const updateName = async (name: string) => {
    setData(prev => ({ ...prev, name }));
    await updateProfile({ name });
  };

  const updateRole = async (role: UserRole) => {
    setData(prev => ({ ...prev, role }));
    await updateProfile({ role });
  };

  const updateSchoolStatuses = async (statuses: SchoolStatus[]) => {
    setData(prev => ({ ...prev, schoolStatuses: statuses }));
    await updateProfile({ school_statuses: statuses });
  };

  const updateGradeLevel = async (level: string) => {
    setData(prev => ({ ...prev, gradeLevel: level }));
    await updateProfile({ grade_level: level });
  };

  const updateTopics = async (topics: string[]) => {
    setData(prev => ({ ...prev, topics }));
    await updateProfile({ topics });
  };

  const updateProfilePicture = async (uri: string | null) => {
    console.log('🖼️ updateProfilePicture called with:', uri?.substring(0, 50));
    console.log('🖼️ session user id:', session?.user?.id);

    // If we have a new image, upload it to Supabase Storage
    let publicUrl = uri;

    if (uri && session?.user?.id && !uri.startsWith('http')) {
      try {
        const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${session.user.id}/avatar.${fileExt}`;
        console.log('🖼️ Uploading to:', fileName);

        // Fetch the image and convert to ArrayBuffer (works better in RN)
        const response = await fetch(uri);
        const arrayBuffer = await response.arrayBuffer();
        console.log('🖼️ ArrayBuffer size:', arrayBuffer.byteLength);

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, arrayBuffer, {
            upsert: true,
            contentType: `image/${fileExt}`,
          });

        if (uploadError) {
          console.error('🖼️ Upload error:', uploadError);
          throw uploadError;
        }

        console.log('🖼️ Upload successful!');

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        publicUrl = urlData.publicUrl;
        console.log('🖼️ Public URL:', publicUrl);
      } catch (error) {
        // Fall back to local URI if upload fails
        publicUrl = uri;
      }
    } else {
      console.log('🖼️ Skipping upload - uri:', !!uri, 'session:', !!session?.user?.id, 'isHttp:', uri?.startsWith('http'));
    }

    setData(prev => ({ ...prev, profilePicture: publicUrl }));
    await updateProfile({ profile_picture_url: publicUrl });
    console.log('🖼️ Profile updated with picture URL');
  };

  const completeOnboarding = async () => {
    setData(prev => ({ ...prev, isCompleted: true }));
    await updateProfile({ is_completed: true });
  };

  const resetOnboarding = async () => {
    setData(initialData);
    await updateProfile({
      name: '',
      role: null,
      school_statuses: [],
      grade_level: '',
      topics: [],
      profile_picture_url: null,
      is_completed: false,
    });
  };

  const signInAnonymously = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Error signing in:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
    setData(initialData);
    setBookmarks([]);
  };

  // Bookmark methods
  const addBookmark = async (resourceId: string) => {
    const now = Date.now();
    const newBookmark: BookmarkWithTimestamp = { resourceId, savedAt: now };

    setBookmarks(prev => {
      const updated = [resourceId, ...prev];
      AsyncStorage.setItem('@schoolkit_bookmarks', JSON.stringify(updated));
      return updated;
    });
    setBookmarksWithTimestamps(prev => {
      const updated = [newBookmark, ...prev];
      AsyncStorage.setItem('@schoolkit_bookmarks_timestamps', JSON.stringify(updated));
      return updated;
    });

    if (!session?.user?.id) return;
    const { error } = await supabase
      .from('user_bookmarks')
      .insert({ user_id: session.user.id, resource_id: resourceId });

    if (error) {
      console.error('Error adding bookmark:', error);
      setBookmarks(prev => {
        const updated = prev.filter(id => id !== resourceId);
        AsyncStorage.setItem('@schoolkit_bookmarks', JSON.stringify(updated));
        return updated;
      });
      setBookmarksWithTimestamps(prev => {
        const updated = prev.filter(b => b.resourceId !== resourceId);
        AsyncStorage.setItem('@schoolkit_bookmarks_timestamps', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const removeBookmark = async (resourceId: string) => {
    const removedBookmark = bookmarksWithTimestamps.find(b => b.resourceId === resourceId);

    setBookmarks(prev => {
      const updated = prev.filter(id => id !== resourceId);
      AsyncStorage.setItem('@schoolkit_bookmarks', JSON.stringify(updated));
      return updated;
    });
    setBookmarksWithTimestamps(prev => {
      const updated = prev.filter(b => b.resourceId !== resourceId);
      AsyncStorage.setItem('@schoolkit_bookmarks_timestamps', JSON.stringify(updated));
      return updated;
    });

    if (!session?.user?.id) return;
    const { error } = await supabase
      .from('user_bookmarks')
      .delete()
      .eq('user_id', session.user.id)
      .eq('resource_id', resourceId);

    if (error) {
      console.error('Error removing bookmark:', error);
      setBookmarks(prev => {
        const updated = [resourceId, ...prev];
        AsyncStorage.setItem('@schoolkit_bookmarks', JSON.stringify(updated));
        return updated;
      });
      if (removedBookmark) {
        setBookmarksWithTimestamps(prev => {
          const updated = [removedBookmark, ...prev];
          AsyncStorage.setItem('@schoolkit_bookmarks_timestamps', JSON.stringify(updated));
          return updated;
        });
      }
    }
  };

  const isBookmarked = (resourceId: string) => bookmarks.includes(resourceId);

  // Download methods
  const downloadResource = async (resourceId: string) => {
    setDownloads(prev => {
      if (prev.includes(resourceId)) return prev;
      const updated = [...prev, resourceId];
      AsyncStorage.setItem('@schoolkit_downloads', JSON.stringify(updated));
      return updated;
    });
  };

  const removeDownload = async (resourceId: string) => {
    setDownloads(prev => {
      const updated = prev.filter(id => id !== resourceId);
      AsyncStorage.setItem('@schoolkit_downloads', JSON.stringify(updated));
      return updated;
    });
  };

  const isDownloaded = (resourceId: string) => downloads.includes(resourceId);

  const downloadAllResources = async () => {
    const allResourceIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    setDownloads(allResourceIds);
    await AsyncStorage.setItem('@schoolkit_downloads', JSON.stringify(allResourceIds));
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        session,
        loading,
        updateName,
        updateRole,
        updateSchoolStatuses,
        updateGradeLevel,
        updateTopics,
        updateProfilePicture,
        completeOnboarding,
        resetOnboarding,
        signInAnonymously,
        signOut,
        bookmarks,
        bookmarksWithTimestamps,
        addBookmark,
        removeBookmark,
        isBookmarked,
        downloads,
        downloadResource,
        removeDownload,
        isDownloaded,
        downloadAllResources,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
