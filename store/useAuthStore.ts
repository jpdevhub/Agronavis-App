import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isOffline: boolean;
}

interface AuthActions {
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setOffline: (offline: boolean) => void;
  signOut: () => Promise<void>;
  initialize: () => () => void;
}

/** Session state, hydrated once at startup and kept in sync with Supabase. */
export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isOffline: false,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setLoading: (isLoading) => set({ isLoading }),

  setOffline: (isOffline) => set({ isOffline }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },

  initialize: () => {
    // Hydrate from persisted storage on cold start
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, isLoading: false });
    });

    // Stay in sync with every auth event (token refresh, sign-in, sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        set({ session, user: session?.user ?? null, isLoading: false });
      }
    );

    // Return cleanup so root layout can unsubscribe on unmount
    return () => subscription.unsubscribe();
  },
}));
