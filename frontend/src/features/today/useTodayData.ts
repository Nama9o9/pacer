import { useCallback, useEffect, useState } from 'react';

import type { Tables } from '@/types/database.types';
import { supabase } from '@/utils/supabase';

export type TodayGoal = Pick<Tables<'goals'>, 'distance_m' | 'target_time_s' | 'race_date' | 'created_at'>;
export type TodayBaseline = Pick<
  Tables<'baselines'>,
  'available_days' | 'recent_5k_time_s' | 'running_since_months'
>;

export type TodayDataState =
  | { status: 'loading' }
  | { status: 'error' }
  /** Ziel oder Laufbasis fehlen in der Datenbank */
  | { status: 'missing' }
  | { status: 'ready'; goal: TodayGoal; baseline: TodayBaseline };

/**
 * Lädt aktives Ziel und neueste Laufbasis für den Screen „Heute“.
 * Ziel und Basis sind nur über user_id verbunden; complete_onboarding legt beide
 * gemeinsam an, daher gehört die neueste Basis zum aktiven Ziel.
 */
export function useTodayData(): TodayDataState & { reload: () => void } {
  const [state, setState] = useState<TodayDataState>({ status: 'loading' });
  // Zähler statt Funktion im Effekt: Jede Erhöhung löst ein neues Laden aus
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setState({ status: 'loading' });

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
    ]).then(([goalResult, baselineResult]) => {
      if (!isCurrent) return;

      if (goalResult.error || baselineResult.error) {
        setState({ status: 'error' });
      } else if (!goalResult.data || !baselineResult.data) {
        setState({ status: 'missing' });
      } else {
        setState({ status: 'ready', goal: goalResult.data, baseline: baselineResult.data });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { ...state, reload };
}
