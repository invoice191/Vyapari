import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  business: any | null;
  loading: boolean;
  signIn: (email?: string, password?: string, useGoogle?: boolean) => Promise<void>;
  signUp: (email?: string, password?: string, fullName?: string) => Promise<void>;
  resendSignUpOtp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateBusiness: (data: any) => Promise<void>;
  fetchProfileAndBusiness: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  business: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  resendSignUpOtp: async () => {},
  signOut: async () => {},
  updateBusiness: async () => {},
  fetchProfileAndBusiness: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [business, setBusiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndBusiness(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndBusiness(session.user.id);
      } else {
        setProfile(null);
        setBusiness(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfileAndBusiness = async (userId: string) => {
    try {
      // 1. Fetch Profile with maybeSingle to avoid errors on new users
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // 2. Self-Healing: If profile is missing or business_id is missing, use the initialization RPC
      if (!profileData || !profileData.business_id) {
        console.log("[AuthContext] Profile or Business missing, triggering initialization RPC...");
        
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const meta = authUser?.user_metadata;
        
        const { data: initData, error: initError } = await supabase.rpc('initialize_new_business', {
          p_business_name: meta?.business_name || 'My New Business',
          p_full_name: meta?.full_name || 'New Vyapari'
        });

        if (initError) {
          console.error("[AuthContext] Initialization RPC failed:", initError);
          // Fallback: try to set profile if at least that exists
          if (profileData) setProfile(profileData);
          throw initError;
        }

        console.log("[AuthContext] Successfully initialized workspace:", initData.business?.id);
        setProfile(initData.profile);
        setBusiness(initData.business);
      } else {
        // Normal flow: fetch existing business
        setProfile(profileData);
        
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', profileData.business_id)
          .single();

        if (businessError) throw businessError;
        setBusiness(businessData);
      }
    } catch (err) {
      console.error("[AuthContext] Profile/Business fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email?: string, password?: string, useGoogle = false) => {
    setLoading(true);
    try {
      if (useGoogle) {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) throw error;
      } else {
        const targetEmail = email || "saurabhprajwal2220@gmail.com";
        const targetPassword = password || "admin@123";
        const { error } = await supabase.auth.signInWithPassword({ email: targetEmail, password: targetPassword });
        if (error) throw error;
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signUp = async (email?: string, password?: string, fullName?: string) => {
    setLoading(true);
    try {
      const targetEmail = email || "saurabhprajwal2220@gmail.com";
      const targetPassword = password || "admin@123";
      
      const { error } = await supabase.auth.signUp({
        email: targetEmail,
        password: targetPassword,
        options: {
          data: {
            full_name: fullName || 'New User',
          }
        }
      });
      if (error) throw error;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const resendSignUpOtp = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) throw error;
    } catch (err) {
      console.error("[AuthContext] Resend OTP error:", err);
      throw err;
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
  };

  const updateBusiness = async (data: any) => {
    if (!business?.id) return;
    try {
      const { data: updated, error } = await supabase
        .from('businesses')
        .update(data)
        .eq('id', business.id)
        .select()
        .single();

      if (error) throw error;
      setBusiness(updated);
    } catch (err) {
      console.error("[AuthContext] Update business error:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, business, loading, 
      signIn, signUp, resendSignUpOtp, signOut, 
      updateBusiness, fetchProfileAndBusiness 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
