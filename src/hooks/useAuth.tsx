import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (u: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', u.id)
        .single();
        
      if (data) {
        setProfile(data);
      } else {
        const isAdminEmail = u.email === "saurabhprajwal2220@gmail.com";
        const newProfile = {
          id: u.id,
          email: u.email,
          role: isAdminEmail ? 'admin' : 'staff',
        };
        setProfile(newProfile);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Fallback profile if table doesn't exist or RLS blocks
      const isAdminEmail = u.email === "saurabhprajwal2220@gmail.com";
      setProfile({
        id: u.id,
        email: u.email,
        role: isAdminEmail ? 'admin' : 'staff',
      });
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
};
