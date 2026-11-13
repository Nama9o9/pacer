import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';

/** Hat der Nutzer ein aktives Ziel? Steuert, ob Onboarding oder „Heute“ erreichbar ist. */
export type GoalStatus = 'loading' | 'none' | 'active' | 'error';

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  goalStatus: GoalStatus;
  /** Status neu laden, z. B. nach abgeschlossenem Onboarding */
  refreshGoalStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  goalStatus: 'loading',
  refreshGoalStatus: async () => {},
});

// Token nur im Vordergrund automatisch erneuern (Empfehlung von Supabase für React Native)
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

/** Prüft, ob es ein aktives Ziel gibt. RLS liefert nur Ziele des eingeloggten Nutzers. */
async function fetchGoalStatus(): Promise<GoalStatus> {
  const { data, error } = await supabase
    .from('goals')
    .select('goal_id')
    .eq('is_active', true)
    .maybeSingle();

  if (error) return 'error';
  return data ? 'active' : 'none';
}

/**
 * Stellt die aktuelle Supabase-Session und den Zielstatus für die ganze App bereit.
 * Reagiert automatisch auf Login, Logout und Token-Erneuerung.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [goalStatus, setGoalStatus] = useState<GoalStatus>('loading');

  useEffect(() => {
    // Gespeicherte Session beim App-Start laden
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    // Auf spätere Änderungen hören (Login, Logout, Refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Zielstatus nur bei Nutzerwechsel laden, nicht bei jeder Token-Erneuerung
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) {
      setGoalStatus('loading');
      return;
    }

    let isCurrent = true;
    setGoalStatus('loading');
    fetchGoalStatus().then((status) => {
      // Antwort verwerfen, falls sich der Nutzer inzwischen geändert hat
      if (isCurrent) setGoalStatus(status);
    });
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  // Bewusst ohne Zwischenstand 'loading': Die Navigation bleibt stehen,
  // bis das Ergebnis da ist, und Stack.Protected leitet dann direkt um
  const refreshGoalStatus = useCallback(async () => {
    setGoalStatus(await fetchGoalStatus());
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, goalStatus, refreshGoalStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
