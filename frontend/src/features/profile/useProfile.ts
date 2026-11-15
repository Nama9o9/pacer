import { MOCK_PROFILE } from '@/mocks/profile';

import type { ProfileData } from './types';

/**
 * Daten für den Profil-Tab: Ziel und Einstellungen.
 * TODO M2: durch Supabase-Abfrage ersetzen (goals, Einstellungen),
 * inklusive Lade- und Fehlerzustand wie in useTodayData.
 */
export function useProfile(): ProfileData {
  return MOCK_PROFILE;
}
