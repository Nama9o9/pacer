/**
 * Läufe (Tabelle activities): neutrale Eingabe, Umrechnung für die Datenbank,
 * Auswertung für die Anzeige. Reine Funktionen, das Speichern selbst liegt in
 * features/activities/saveManualActivity.ts.
 */

import type { TablesInsert } from '@/types/database.types';
import { calculatePace, formatDuration, formatPace } from '@/utils/validation';

/**
 * Ein absolvierter Lauf, unabhängig von der Quelle.
 * Manuelle Eingabe heute, später auch GPS-Aufzeichnung.
 */
export type ActivityInput = {
  startedAt: Date;
  distanceM: number;
  durationS: number;
  avgHeartRate: number | null;
  elevationGainM: number | null;
};

/** Zeile für den Insert. Vom Client nur source = 'manual' erlaubt (RLS). */
export function toManualActivityInsert(userId: string, input: ActivityInput): TablesInsert<'activities'> {
  return {
    user_id: userId,
    source: 'manual',
    started_at: input.startedAt.toISOString(),
    distance_m: input.distanceM,
    duration_s: input.durationS,
    avg_heart_rate: input.avgHeartRate,
    elevation_gain_m: input.elevationGainM,
  };
}

/** Postgres-Fehlercodes, die wir gezielt übersetzen */
const CHECK_VIOLATION = '23514';
const RLS_VIOLATION = '42501';

/** Verständliche Meldung für einen Fehler beim Speichern */
export function describeSaveError(error: { code?: string; message?: string }): string {
  if (error.code === CHECK_VIOLATION) {
    return 'Einige Werte wurden nicht akzeptiert. Bitte prüf deine Eingaben.';
  }
  if (error.code === RLS_VIOLATION) {
    return 'Du bist nicht mehr angemeldet. Bitte melde dich neu an.';
  }
  if (error.message?.toLowerCase().includes('network') || error.message?.toLowerCase().includes('fetch')) {
    return 'Keine Verbindung. Bitte prüf dein Internet und versuch es noch einmal.';
  }
  return 'Speichern hat nicht geklappt. Bitte versuch es noch einmal.';
}

// ---------------------------------------------------------------------
// Anzeige
// ---------------------------------------------------------------------

/** Kilometer mit Komma und höchstens zwei Nachkommastellen, 8500 → „8,5“ */
export function formatKm(distanceM: number): string {
  return (Math.round(distanceM / 10) / 100).toString().replace('.', ',');
}

/** Kurzfassung eines Laufs, z. B. „8,5 km in 52:10 (6:08 /km)“ */
export function formatRunSummary(distanceM: number, durationS: number): string {
  const pace = formatPace(calculatePace(distanceM, durationS));
  return `${formatKm(distanceM)} km in ${formatDuration(durationS)} (${pace} /km)`;
}
