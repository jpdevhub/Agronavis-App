import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { clearNotificationTray } from '@/utils/notificationTray';
import { clearThread } from '@/features/sahayak/chatHistory';
import { clearContextSnapshot } from '@/features/sahayak/contextCache';
import { clearLanding } from '@/features/auth/landingCache';
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
    // Forget where this farmer landed. Another account signing in on the same
    // handset must not be sent straight past onboarding on their behalf.
    const current = useAuthStore.getState().user?.id;
    if (current) {
      await clearLanding(current);
      // The conversation is this farmer's, and it is full of their fields and
      // their problems. Scoping the key stops another account reading it;
      // signing out is when it should stop existing.
      clearThread(current);
      await clearContextSnapshot(current);
    }

    // The next person to hold this handset must not read the last one's
    // alerts out of the shade.
    await clearNotificationTray();

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
