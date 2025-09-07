import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createSafeProfileData, createSafeProfileUpdateData } from '@/lib/profile-utils';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  role: 'admin' | 'employer' | 'worker';
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'employer' | 'worker', phone: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();
              
              if (error) {
                console.error('Error fetching profile:', error);
              } else {
                setProfile(profileData as Profile);
                // Backfill phone from auth metadata on first login if missing
                const phoneFromMeta = (session.user.user_metadata as any)?.phone as string | undefined;
                if (!profileData?.phone && phoneFromMeta) {
                  try {
                    const updateData = createSafeProfileUpdateData({ phone: phoneFromMeta });
                    await supabase
                      .from('profiles')
                      .update(updateData)
                      .eq('user_id', session.user.id);
                  } catch (e) {
                    console.error('Failed to backfill phone:', e);
                  }
                }
              }
            } catch (error) {
              console.error('Profile fetch error:', error);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: 'employer' | 'worker', phone: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role: role,
            phone: phone
          }
        }
      });

      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive"
        });
      } else if (data.user) {
        // Create profile in profiles table
        try {
          const profileData = createSafeProfileData({
            user_id: data.user.id,
            full_name: fullName,
            role: role,
            phone: phone,
            email: data.user.email
          });
          
          const { error: profileError } = await supabase
            .from('profiles')
            .insert(profileData);

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // If insert fails, try update (in case profile already exists)
            const updateData = createSafeProfileUpdateData({
              full_name: fullName,
              role: role,
              phone: phone,
              email: data.user.email
            });
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('user_id', data.user.id);
            
            if (updateError) {
              console.error('Profile update error:', updateError);
            }
          }
        } catch (profileErr) {
          console.error('Failed to create profile:', profileErr);
        }

        toast({
          title: "Registration successful!",
          description: "Please check your email to verify your account.",
        });
      }

      return { error };
    } catch (error: any) {
      const err = error?.message || 'An unexpected error occurred';
      toast({
        title: "Registration failed",
        description: err,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      }

      return { error };
    } catch (error: any) {
      const err = error?.message || 'An unexpected error occurred';
      toast({
        title: "Sign in failed",
        description: err,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      toast({
        title: "Signed out successfully",
        description: "You have been logged out.",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        toast({
          title: "Reset failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Reset email sent",
          description: "Check your email for password reset instructions.",
        });
      }

      return { error };
    } catch (error: any) {
      const err = error?.message || 'An unexpected error occurred';
      toast({
        title: "Reset failed",
        description: err,
        variant: "destructive"
      });
      return { error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};