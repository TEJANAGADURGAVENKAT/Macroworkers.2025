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
  worker_status?: string | null;
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

  // Set up real-time profile updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile updated:', payload.new);
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signUp = async (email: string, password: string, fullName: string, role: 'employer' | 'worker', phone: string, category?: string) => {
    try {
      console.log('Starting registration for:', email, 'role:', role);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role: role,
            phone: phone,
            category: category,
            email: email // Explicitly include email in metadata
          }
        }
      });

      // If signup succeeds but email is null, try to update it
      if (!error && data.user && !data.user.email) {
        console.log('User created but email is null, attempting to update...');
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            email: email
          });
          if (updateError) {
            console.error('Failed to update email:', updateError);
          } else {
            console.log('Email updated successfully');
          }
        } catch (updateErr) {
          console.error('Error updating email:', updateErr);
        }
      }

      // Check if user was created successfully
      if (!error && data.user) {
        console.log('✅ User created successfully with ID:', data.user.id);
        console.log('📧 User email:', data.user.email);
        
        // Create profile manually after successful user creation
        try {
          const profileData = {
            user_id: data.user.id,
            full_name: fullName,
            role: role,
            phone: phone || '',
            email: data.user.email || email,
            category: category || null,
            rating: role === 'employer' ? 3.00 : 1.00,
            worker_status: role === 'employer' ? 'verification_pending' : 'document_upload_pending',
            status: role === 'employer' ? 'verification_pending' : 'document_upload_pending'
          };
          
          console.log('📝 Creating profile with data:', profileData);
          
          const { data: profileResult, error: profileError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();
          
          if (profileError) {
            console.error('❌ Profile creation error:', profileError);
            // Still show success for user creation, profile can be created later
          } else {
            console.log('✅ Profile created successfully:', profileResult);
          }
        } catch (profileErr) {
          console.error('❌ Failed to create profile:', profileErr);
          // Still show success for user creation
        }
      }

      if (error) {
        console.error('Registration error:', error);
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      } else if (data.user) {
        console.log('User created successfully:', data.user.id);
        
        // The profile should be created automatically by the database trigger
        // But let's also try to create it manually as a backup
        try {
          const profileData = createSafeProfileData({
            user_id: data.user.id,
            full_name: fullName,
            role: role,
            phone: phone,
            email: data.user.email || email, // Use email from signup if user.email is null
            category: category,
            rating: role === 'worker' ? 1.00 : 3.00, // New workers start with 1.00 rating
            worker_status: role === 'employer' ? 'verification_pending' : 'document_upload_pending',
            status: role === 'employer' ? 'verification_pending' : 'document_upload_pending'
          });
          
          console.log('Creating profile with data:', profileData);
          
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
              email: data.user.email || email, // Use email from signup if user.email is null
              category: category,
              worker_status: role === 'employer' ? 'verification_pending' : 'document_upload_pending',
              status: role === 'employer' ? 'verification_pending' : 'document_upload_pending'
            });
            
            console.log('Trying to update profile with data:', updateData);
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('user_id', data.user.id);
            
            if (updateError) {
              console.error('Profile update error:', updateError);
            } else {
              console.log('Profile updated successfully');
            }
          } else {
            console.log('Profile created successfully');
          }
        } catch (profileErr) {
          console.error('Failed to create profile:', profileErr);
        }

        toast({
          title: "Registration successful!",
          description: role === 'employer' 
            ? "Please check your email to verify your account. You will be redirected to document verification."
            : "Please check your email to verify your account.",
        });
        
        return { error: null };
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
      console.log('Attempting to sign in with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('Sign in successful:', data);
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