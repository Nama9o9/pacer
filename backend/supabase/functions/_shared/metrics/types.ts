/** Kalenderdatum im Format YYYY-MM-DD, wie die Postgres-Spalte `date` (z. B. goals.race_date) */
export type IsoDate = string;

/** Zeile der Tabelle public.activities (Spaltennamen wie in der Datenbank) */
export type Activity = {
  activity_id: string;
  user_id: string;
  source: 'manual' | 'strava';
  strava_id: number | null;
  /** timestamptz als ISO-String, z. B. "2026-11-16T06:30:00+00:00" */
  started_at: string;
  distance_m: number;
  duration_s: number;
  avg_heart_rate: number | null;
  elevation_gain_m: number | null;
  created_at: string;
  updated_at: string;
};

/** Die Spalten, die für Wochenkennzahlen gebraucht werden */
export type ActivityMetricsInput = Pick<Activity, 'started_at' | 'distance_m' | 'duration_s'>;

/** Ist-Kennzahlen einer Kalenderwoche (Mo–So) */
export type WeekSummary = {
  /** Montag der Woche */
  weekStart: IsoDate;
  totalDistanceM: number;
  runCount: number;
  longestRunM: number;
  /** Gesamtzeit / Gesamtstrecke; null, wenn es in der Woche keinen Lauf gab */
  avgPaceSPerKm: number | null;
};

/** Eine Einheit mit Strecke und Dauer (geplant oder tatsächlich gelaufen) */
export type SessionMetrics = {
  distanceM: number;
  durationS: number;
};

/** Differenz Ist minus Soll für eine Einheit */
export type SessionComparison = {
  /** positiv = weiter gelaufen als geplant */
  distanceDiffM: number;
  /** Abweichung in Prozent der geplanten Strecke */
  distanceDiffPct: number;
  /** positiv = langsamer als geplant, negativ = schneller */
  paceDiffSPerKm: number;
};

export type GoalComparisonInput = {
  targetTimeS: number;
  predictedTimeS: number;
  weeksLeft: number;
};

/** Differenz Prognose minus Zielzeit */
export type GoalComparison = {
  /** positiv = Prognose ist langsamer als das Ziel */
  gapS: number;
  /** Abstand in Prozent der Zielzeit */
  gapPct: number;
  /** Abstand je verbleibender Woche; null, wenn keine Woche mehr bleibt */
  gapPerWeekS: number | null;
};
