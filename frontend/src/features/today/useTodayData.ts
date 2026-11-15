import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Tables } from '@/types/database.types';
import { supabase } from '@/utils/supabase';
import { weekBounds } from '@/utils/today';

export type TodayGoal = Pick<Tables<'goals'>, 'distance_m' | 'target_time_s' | 'race_date' | 'created_at'>;
export type TodayBaseline = Pick<
  Tables<'baselines'>,
  'available_days' | 'recent_5k_time_s' | 'running_since_months'
>;
export type TodayRun = Pick<Tables<'activities'>, 'started_at' | 'distance_m' | 'duration_s'>;

export type TodayDataState =
  | { status: 'loading' }
  | { status: 'error' }
  /** Ziel oder Laufbasis fehlen in der Datenbank */
  | { status: 'missing' }
  | {
      status: 'ready';
      goal: TodayGoal;
      baseline: TodayBaseline;
      /** Läufe der aktuellen Woche (Mo–So, lokale Zeit) */
      weekRuns: TodayRun[];
      /** Zeitpunkt des Ladens, gilt im Screen als „jetzt“ */
      loadedAt: Date;
    };

/**
 * Lädt aktives Ziel, neueste Laufbasis und die Läufe dieser Woche für „Heute“.
 * Lädt jedes Mal neu, wenn der Screen in den Fokus kommt, z. B. nach dem Eintragen eines Laufs.
 * Ziel und Basis sind nur über user_id verbunden; complete_onboarding legt beide
 * gemeinsam an, daher gehört die neueste Basis zum aktiven Ziel.
 */
export function useTodayData(): TodayDataState & { reload: () => void } {
  const [state, setState] = useState<TodayDataState>({ status: 'loading' });
  // Zähler für „Erneut versuchen“: Jede Erhöhung löst ein neues Laden aus
  const [reloadCount, setReloadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;
      const now = new Date();
      const { start, end } = weekBounds(now);

      // Vorhandene Daten beim Neuladen stehen lassen, damit nichts flackert
      setState((prev) => (prev.status === 'ready' ? prev : { status: 'loading' }));

      // RLS liefert nur Zeilen des eingeloggten Nutzers
      Promise.all([
        supabase
          .from('goals')
          .select('distance_m, target_time_s, race_date, created_at')
          .eq('is_active', true)
          .maybeSingle(),
        supabase
          .from('baselines')
          .select('available_days, recent_5k_time_s, running_since_months')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('activities')
          .select('started_at, distance_m, duration_s')
          .gte('started_at', start.toISOString())
          .lt('started_at', end.toISOString())
          .order('started_at'),
      ]).then(([goalResult, baselineResult, runsResult]) => {
        if (!isCurrent) return;

        if (goalResult.error || baselineResult.error || runsResult.error) {
          setState({ status: 'error' });
        } else if (!goalResult.data || !baselineResult.data) {
          setState({ status: 'missing' });
        } else {
          setState({
            status: 'ready',
            goal: goalResult.data,
            baseline: baselineResult.data,
            weekRuns: runsResult.data,
            loadedAt: now,
          });
        }
      });

      return () => {
        isCurrent = false;
      };
    }, [reloadCount]),
  );

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { ...state, reload };
}
