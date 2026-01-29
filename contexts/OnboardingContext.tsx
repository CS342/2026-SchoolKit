import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

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
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
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

        // Upload to Supabase Storage
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

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        publicUrl = urlData.publicUrl;
        console.log('🖼️ Public URL:', publicUrl);
      } catch (error) {
        console.error('🖼️ Error uploading avatar:', error);
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

  // Sign in anonymously (for users who don't want to create an account)
  const signInAnonymously = async () => {
    console.log('📱 signInAnonymously called');
    setLoading(true);
    const { data, error } = await supabase.auth.signInAnonymously();
    console.log('📱 signInAnonymously result:', { userId: data?.user?.id, error: error?.message });
    if (error) {
      console.error('Error signing in:', error);
      setLoading(false);
      throw error;
    }
    console.log('📱 signInAnonymously success, user:', data?.user?.id);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
    setData(initialData);
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
