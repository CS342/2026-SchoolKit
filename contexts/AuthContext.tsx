import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { AppRole } from '../lib/database.types';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAnonymous: boolean;
  /** App-level privilege roles for the current user (empty for regular users). */
  roles: AppRole[];
  rolesLoading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  refreshRoles: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  linkEmailPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInAnonymously: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const loadRoles = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setRoles([]);
      setRolesLoading(false);
      return;
    }
    setRolesLoading(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', uid);
    if (error) {
      console.warn('Failed to load roles:', error.message);
      setRoles([]);
    } else {
      setRoles((data ?? []).map((r) => r.role as AppRole));
    }
    setRolesLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      loadRoles(session?.user?.id);
    }).catch((error) => {
      console.warn('Failed to get session (network may be unavailable):', error.message);
      setLoading(false);
      setRolesLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      loadRoles(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, [loadRoles]);

  const refreshRoles = useCallback(async () => {
    await loadRoles(user?.id);
  }, [loadRoles, user?.id]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const linkEmailPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.updateUser({ email, password });
    return { error: error as Error | null };
  };

  const signInAnonymously = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Error signing in anonymously:', error);
      setLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.warn('Server sign-out failed, clearing local session:', (error as Error).message);
      await supabase.auth.signOut({ scope: 'local' });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAnonymous: user?.is_anonymous === true,
        roles,
        rolesLoading,
        isAdmin: roles.includes('admin'),
        isModerator: roles.includes('moderator') || roles.includes('admin'),
        refreshRoles,
        signUp,
        signInWithPassword,
        linkEmailPassword,
        signInAnonymously,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
