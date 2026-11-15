import type { ProfileData } from '@/features/profile/types';

/**
 * Beispieldaten für den Profil-Tab, bis die Supabase-Anbindung steht.
 * Nur über useProfile verwenden, nie direkt in Screens importieren.
 */
export const MOCK_PROFILE: ProfileData = {
  goal: {
    distance_m: 21097,
    target_time_s: 2 * 3600 + 10 * 60,
    race_date: '2027-04-11',
  },
  settings: {
    coach_memory_consent: false,
    strava_connected: false,
  },
};
