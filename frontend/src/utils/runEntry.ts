/**
 * Prüfregeln für die manuelle Laufeingabe (FA#0103).
 * Reine Funktionen: Formulartexte rein, geprüfter Lauf und Fehler pro Feld raus.
 */

import type { ActivityInput } from '@/utils/activities';
import { formatGermanDate, parseDecimal, parseGermanDate, parseInteger, toSeconds } from '@/utils/validation';

/** Höchstens 100 km pro Lauf */
export const MAX_RUN_DISTANCE_M = 100_000;
/** Höchstens 24 Stunden pro Lauf */
export const MAX_RUN_DURATION_S = 24 * 3600;
/** Schneller als 2:30 min/km ist vermutlich ein Tippfehler */
export const MIN_RUN_PACE_S_PER_KM = 150;
/** Langsamer als 20:00 min/km ist vermutlich ein Tippfehler */
export const MAX_RUN_PACE_S_PER_KM = 1200;
/** Grenzen wie in der Datenbank (activities_avg_heart_rate_check) */
export const MIN_HEART_RATE = 30;
export const MAX_HEART_RATE = 250;

/** Formularwerte als Text, so wie sie in den Feldern stehen */
export type RunForm = {
  /** TT.MM.JJJJ */
  date: string;
  startHour: string;
  startMinute: string;
  /** Kilometer, „8,5“ oder „8.5“ */
  distanceKm: string;
  durationHours: string;
  durationMinutes: string;
  durationSeconds: string;
  /** optional */
  avgHeartRate: string;
  /** optional */
  elevationGainM: string;
};

/** Feldnamen für Fehlermeldungen */
export type RunField = 'date' | 'startTime' | 'distance' | 'duration' | 'avgHeartRate' | 'elevationGain';

export type RunFormResult = {
  /** Fertiger Lauf, nur wenn es keine Fehler gibt */
  activity: ActivityInput | null;
  errors: Partial<Record<RunField, string>>;
  /** Pace in s/km für die Live-Anzeige, sobald Distanz und Dauer für sich gültig sind */
  paceSPerKm: number | null;
};

const isBlank = (text: string) => text.trim() === '';

/** Nur Ziffern, damit „12a“ nicht still als 12 durchgeht */
const isDigits = (text: string) => /^\d+$/.test(text.trim());

/**
 * Optionale Ganzzahl: leer → null, ungültig → NaN.
 * NaN statt Fehlertext, damit die Meldung beim jeweiligen Feld entsteht.
 */
export function parseOptionalInteger(text: string): number | null {
  if (isBlank(text)) return null;
  return isDigits(text) ? Number.parseInt(text, 10) : Number.NaN;
}

/** Distanz in Metern aus Kilometer-Text, „8,5“ → 8500 */
export function parseDistanceM(text: string): number {
  if (!/^\d+([.,]\d+)?$/.test(text.trim())) return 0;
  return Math.round(parseDecimal(text) * 1000);
}

/**
 * Startzeit für das Formular: jetzt, auf 5 Minuten abgerundet.
 * Abrunden statt runden, damit der Standardwert nie in der Zukunft liegt.
 */
export function defaultStartTime(now: Date): { hour: string; minute: string } {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return { hour: pad(now.getHours()), minute: pad(Math.floor(now.getMinutes() / 5) * 5) };
}

/** Leeres Formular mit heute und der aktuellen Uhrzeit */
export function createEmptyRunForm(now: Date): RunForm {
  const start = defaultStartTime(now);
  return {
    date: formatGermanDate(now),
    startHour: start.hour,
    startMinute: start.minute,
    distanceKm: '',
    durationHours: '',
    durationMinutes: '',
    durationSeconds: '',
    avgHeartRate: '',
    elevationGainM: '',
  };
}

/** Prüft das Formular und baut daraus den Lauf */
export function parseRunForm(form: RunForm, now: Date): RunFormResult {
  const errors: RunFormResult['errors'] = {};

  // Datum und Startzeit
  const day = parseGermanDate(form.date);
  const hour = parseOptionalInteger(form.startHour);
  const minute = parseOptionalInteger(form.startMinute);
  let startedAt: Date | null = null;

  if (day === null) {
    errors.date = 'Bitte gib das Datum im Format TT.MM.JJJJ ein.';
  }
  if (hour === null || minute === null || !(hour <= 23) || !(minute <= 59)) {
    errors.startTime = 'Bitte gib eine Uhrzeit zwischen 00:00 und 23:59 ein.';
  }
  if (day !== null && !errors.startTime && hour !== null && minute !== null) {
    startedAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
    if (startedAt.getTime() > now.getTime()) {
      errors.date = 'Der Lauf darf nicht in der Zukunft liegen.';
    }
  }

  // Distanz
  const distanceM = parseDistanceM(form.distanceKm);
  if (distanceM <= 0) {
    errors.distance = 'Bitte gib die Distanz in km ein, z. B. 8,5.';
  } else if (distanceM > MAX_RUN_DISTANCE_M) {
    errors.distance = 'Bitte gib höchstens 100 km ein.';
  }

  // Dauer
  const durationParts = [form.durationHours, form.durationMinutes, form.durationSeconds];
  const [h, m, s] = durationParts.map((part) => (isBlank(part) ? 0 : isDigits(part) ? parseInteger(part) : Number.NaN));
  const durationS = toSeconds(h, m, s);
  if (Number.isNaN(durationS)) {
    errors.duration = 'Bitte nur Ziffern eingeben.';
  } else if (m > 59 || s > 59) {
    errors.duration = 'Minuten und Sekunden gehen nur bis 59.';
  } else if (durationS <= 0) {
    errors.duration = 'Bitte gib die Dauer ein.';
  } else if (durationS > MAX_RUN_DURATION_S) {
    errors.duration = 'Bitte gib höchstens 24 Stunden ein.';
  }

  // Pace nur prüfen, wenn Distanz und Dauer für sich gültig sind
  let paceSPerKm: number | null = null;
  if (!errors.distance && !errors.duration) {
    paceSPerKm = durationS / (distanceM / 1000);
    if (paceSPerKm < MIN_RUN_PACE_S_PER_KM) {
      errors.duration = 'Das wäre schneller als 2:30 min/km. Bitte prüf Distanz und Dauer.';
    } else if (paceSPerKm > MAX_RUN_PACE_S_PER_KM) {
      errors.duration = 'Das wäre langsamer als 20:00 min/km. Bitte prüf Distanz und Dauer.';
    }
  }

  // Optionale Felder
  const avgHeartRate = parseOptionalInteger(form.avgHeartRate);
  if (avgHeartRate !== null && !(avgHeartRate >= MIN_HEART_RATE && avgHeartRate <= MAX_HEART_RATE)) {
    errors.avgHeartRate = `Bitte gib einen Puls zwischen ${MIN_HEART_RATE} und ${MAX_HEART_RATE} ein.`;
  }
  const elevationGainM = parseOptionalInteger(form.elevationGainM);
  if (elevationGainM !== null && Number.isNaN(elevationGainM)) {
    errors.elevationGain = 'Bitte gib die Höhenmeter als ganze Zahl ab 0 ein.';
  }

  if (Object.keys(errors).length > 0 || startedAt === null) {
    return { activity: null, errors, paceSPerKm };
  }

  return {
    activity: { startedAt, distanceM, durationS, avgHeartRate, elevationGainM },
    errors,
    paceSPerKm,
  };
}

/** Welche Felder hat der Nutzer schon ausgefüllt? Fehler leerer Felder blendet der Screen aus. */
export function filledFields(form: RunForm): Record<RunField, boolean> {
  return {
    date: !isBlank(form.date),
    startTime: !isBlank(form.startHour) || !isBlank(form.startMinute),
    distance: !isBlank(form.distanceKm),
    duration: !isBlank(form.durationHours) || !isBlank(form.durationMinutes) || !isBlank(form.durationSeconds),
    avgHeartRate: !isBlank(form.avgHeartRate),
    elevationGain: !isBlank(form.elevationGainM),
  };
}
