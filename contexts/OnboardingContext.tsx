import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_RESOURCE_IDS } from '../constants/resources';
import { useOffline, queueOfflineChange } from './OfflineContext';
import { DEFAULT_VOICE, resolveVoice, toVoiceLang, type VoiceLang } from '../services/elevenLabs';
import { applyAppLanguage } from '../lib/i18n';

export type UserRole = 'student-elementary' | 'student-k8' | 'student-hs' | 'parent' | 'staff';
export type SchoolStatus = 'current-treatment' | 'returning-after-treatment' | 'supporting-student' | 'special-needs';

export interface OnboardingData {
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
  loading: boolean;
  updateName: (name: string) => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
  updateSchoolStatuses: (statuses: SchoolStatus[]) => Promise<void>;
  updateGradeLevel: (level: string) => Promise<void>;
  updateTopics: (topics: string[]) => Promise<void>;
  updateProfilePicture: (uri: string | null) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
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
  /** Saves these resources for offline (the caller passes the Library's ids, from
   *  useResources), keeping anything already downloaded. Defaults to the built-ins. */
  downloadAllResources: (ids?: string[]) => Promise<void>;
  // Voice
  /** The guide to read with — the saved choice, or the language's default when the saved
   *  guide doesn't read the current language or has been retired from the roster. */
  selectedVoice: string;
  /** The voice to read text in `lang` with — the chosen guide if it reads that language,
   *  else that language's default (a page can be in a language other than the app's). */
  voiceFor: (lang: VoiceLang) => string;
  updateVoice: (voiceId: string) => Promise<void>;
  // Language
  preferredLanguage: 'english' | 'spanish';
  updatePreferredLanguage: (lang: 'english' | 'spanish') => Promise<void>;
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
  const { user, loading: authLoading } = useAuth();
  const { isOnline } = useOffline();
  const [data, setData] = useState<OnboardingData>(initialData);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookmarksWithTimestamps, setBookmarksWithTimestamps] = useState<BookmarkWithTimestamp[]>([]);
  const [downloads, setDownloads] = useState<string[]>([]);
  const [voiceChoice, setSelectedVoice] = useState<string>(DEFAULT_VOICE.en);
  const [preferredLanguage, setPreferredLanguage] = useState<'english' | 'spanish'>('english');
  const selectedVoice = resolveVoice(voiceChoice, toVoiceLang(preferredLanguage));
  const voiceFor = useCallback((lang: VoiceLang) => resolveVoice(voiceChoice, lang), [voiceChoice]);

  // Load downloads, voice, and language from AsyncStorage on mount
  useEffect(() => {
    loadDownloads();
    loadVoice();
    loadLanguage();
  }, []);

  const loadVoice = async () => {
    try {
      const stored = await AsyncStorage.getItem('@schoolkit_selected_voice');
      if (stored) setSelectedVoice(stored);
    } catch (error) {
      console.error('Error loading voice:', error);
    }
  };

  const loadLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem('@schoolkit_preferred_language');
      if (stored === 'english' || stored === 'spanish') {
        setPreferredLanguage(stored);
        applyAppLanguage(stored);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const loadDownloads = async () => {
    try {
      const stored = await AsyncStorage.getItem('@schoolkit_downloads');
      if (stored) setDownloads(JSON.parse(stored));
    } catch (error) {
      console.error('Error loading downloads:', error);
    }
  };

  // Watch auth user and fetch profile when it changes
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      setLoading(true);
      fetchProfile(user.id);
    } else {
      setData(initialData);
      setBookmarks([]);
      setBookmarksWithTimestamps([]);
      setLoading(false);
    }
  }, [user?.id, authLoading]);

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

        // Set voice from profile if available
        if (profile.voice_id) {
          setSelectedVoice(profile.voice_id);
          AsyncStorage.setItem('@schoolkit_selected_voice', profile.voice_id);
        }

        // Set language from profile if available
        if (profile.preferred_language) {
          const lang = profile.preferred_language as 'english' | 'spanish';
          setPreferredLanguage(lang);
          applyAppLanguage(lang);
          AsyncStorage.setItem('@schoolkit_preferred_language', lang);
        }

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
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating profile:', error);
      await queueOfflineChange({
        type: 'profile_update',
        payload: { user_id: user.id, ...updates },
      });
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
    // Icon keys (e.g. 'icon:star') are stored directly, no upload needed
    if (uri?.startsWith('icon:')) {
      setData(prev => ({ ...prev, profilePicture: uri }));
      await updateProfile({ profile_picture_url: uri });
      return;
    }

    // If we have a new image, upload it to Supabase Storage
    let publicUrl = uri;
    let uploadFailed = false;

    if (uri && user?.id && !uri.startsWith('http')) {
      try {
        const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${user.id}/avatar.${fileExt}`;

        // Fetch the image and convert to ArrayBuffer (works better in RN)
        const response = await fetch(uri);
        const arrayBuffer = await response.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, arrayBuffer, {
            upsert: true,
            contentType: `image/${fileExt}`,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        publicUrl = urlData.publicUrl;
      } catch (error) {
        // Upload failed: keep the picked image in-memory for this session's UI,
        // but do NOT persist a local file:// URI to the DB — other devices would
        // get a dead image. Leave the previous remote value untouched.
        console.error('Avatar upload failed; not persisting local URI to DB:', error);
        uploadFailed = true;
      }
    }

    // Show the selected image locally so the UI updates immediately.
    setData(prev => ({ ...prev, profilePicture: publicUrl }));

    // Only write remote (http/https) URLs — or an explicit clear (null) — to the
    // DB column. Never persist a local file:// path.
    const isRemote = typeof publicUrl === 'string' && publicUrl.startsWith('http');
    const isClearing = publicUrl === null;
    if (!uploadFailed && (isRemote || isClearing)) {
      await updateProfile({ profile_picture_url: publicUrl });
    }
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

    if (!user?.id) return;

    if (!isOnline) {
      await queueOfflineChange({
        type: 'bookmark_add',
        payload: { user_id: user.id, resource_id: resourceId },
      });
      return;
    }

    const { error } = await supabase
      .from('user_bookmarks')
      .insert({ user_id: user.id, resource_id: resourceId });

    if (error) {
      console.warn('Error adding bookmark, likely missing local supabase table:', error.message);
      // Suppress the UI crash in dev mode, we already updated the local AsyncStorage state above
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

    if (!user?.id) return;

    if (!isOnline) {
      await queueOfflineChange({
        type: 'bookmark_remove',
        payload: { user_id: user.id, resource_id: resourceId },
      });
      return;
    }

    const { error } = await supabase
      .from('user_bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('resource_id', resourceId);

    if (error) {
      console.warn('Error removing bookmark from supabase:', error.message);
      // Suppress the UI crash in dev mode, local state is already updated
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

  const downloadAllResources = async (ids: string[] = ALL_RESOURCE_IDS) => {
    const next = [...new Set([...downloads, ...ids])];
    setDownloads(next);
    await AsyncStorage.setItem('@schoolkit_downloads', JSON.stringify(next));
  };

  const updateVoice = async (voiceId: string) => {
    setSelectedVoice(voiceId);
    await AsyncStorage.setItem('@schoolkit_selected_voice', voiceId);
    try {
      await updateProfile({ voice_id: voiceId });
    } catch (e) {
      console.warn('Failed to sync voice preference to Supabase (likely missing column):', e);
    }
  };

  const updatePreferredLanguage = async (lang: 'english' | 'spanish') => {
    setPreferredLanguage(lang);
    applyAppLanguage(lang);
    await AsyncStorage.setItem('@schoolkit_preferred_language', lang);

    // Keep the guide if it reads the new language; otherwise switch to that language's default
    const nextVoice = resolveVoice(voiceChoice, toVoiceLang(lang));
    if (nextVoice !== voiceChoice) await updateVoice(nextVoice);
    
    await updateProfile({ preferred_language: lang });
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        loading,
        updateName,
        updateRole,
        updateSchoolStatuses,
        updateGradeLevel,
        updateTopics,
        updateProfilePicture,
        completeOnboarding,
        resetOnboarding,
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
        selectedVoice,
        voiceFor,
        updateVoice,
        preferredLanguage,
        updatePreferredLanguage,
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
