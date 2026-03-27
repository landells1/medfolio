'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

const PROFILE_CACHE_KEY = 'medfolio_profile_cache';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const supabase = createClient();

  // Read cached profile synchronously so sidebar never flickers to default
const [profile, setProfile] = useState<any | null>(null);

useEffect(() => {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) setProfile(JSON.parse(cached));
  } catch {}
}, []);
  
  const fetchProfile = async (userId: string) => {
      supabase.from('profiles').select('id').eq('id', userId).single().then(() => {});

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) {
        setProfile(data);
        // Update cache with fresh data
        try {
          localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
        } catch {}
      }
    } catch (err) {
      console.error('[MedFolio] Profile fetch error:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[MedFolio] Auth event:', event, newSession?.user?.email || 'no user');

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
          try { localStorage.removeItem(PROFILE_CACHE_KEY); } catch {}
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[MedFolio] Sign out error:', err);
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    try { localStorage.removeItem(PROFILE_CACHE_KEY); } catch {}
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
