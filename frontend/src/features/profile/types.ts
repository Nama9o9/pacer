import type { Tables } from '@/types/database.types';

/** Aktives Ziel, Spalten wie in der Tabelle goals */
export type ProfileGoal = Pick<Tables<'goals'>, 'distance_m' | 'target_time_s' | 'race_date'>;

/**
 * Einstellungen. Dafür gibt es noch keine Tabelle; die Namen sind ein
 * Vorschlag in snake_case, passend zur Namenskonvention des Schemas.
 */
export type ProfileSettings = {
  /** Einwilligung, dass der Coach frühere Gespräche speichert (Langzeitgedächtnis) */
  coach_memory_consent: boolean;
  strava_connected: boolean;
};

export type ProfileData = {
  goal: ProfileGoal;
  settings: ProfileSettings;
};
