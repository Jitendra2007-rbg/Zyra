import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../client';

export type AppRole = 'customer' | 'shop_owner' | 'admin';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);

  useEffect(() => {
    let mounted = true;

    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("useAuth: Safety timeout triggered, forcing loading to false");
        setLoading(false);
      }
    }, 5000);

    // Check for existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error("Error getting session:", err);
      setLoading(false);
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user role after state update
          setTimeout(() => {
            if (mounted) {
              fetchUserRole(session.user.id);
            }
          }, 0);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole('customer'); // Default to customer if error
        setLoading(false);
        return;
      }

      if (data) {
        setUserRole(data.role as AppRole);
      } else {
        // No role found, default to customer
        setUserRole('customer');
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setUserRole('customer');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: AppRole = 'customer') => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role,
        }
      }
    });

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { data, error };
  };

  return {
    user,
    session,
    loading,
    userRole,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  };
};
