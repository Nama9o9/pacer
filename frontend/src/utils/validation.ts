/**
 * Prüfregeln und Umrechnungen für das Onboarding.
 * Reine Funktionen ohne React, damit sie sich leicht testen lassen.
 * Jede validate-Funktion gibt ein Objekt mit Fehlermeldungen pro Feld zurück.
 * Ist es leer, sind alle Angaben gültig.
 */

export type ValidationErrors = Record<string, string>;

// ---------------------------------------------------------------------
// Konstanten
// ---------------------------------------------------------------------

/** Zieldistanzen für die Auswahlknöpfe, in Metern */
export const GOAL_DISTANCES = [
  { label: '5 km', meters: 5000 },
  { label: '10 km', meters: 10000 },
  { label: 'Halbmarathon', meters: 21097 },
  { label: 'Marathon', meters: 42195 },
] as const;

/** Auswahl für „Laufen seit“, gespeichert als ungefähre Monate */
export const RUNNING_SINCE_OPTIONS = [
  { label: 'unter 3 Monate', months: 1 },
  { label: '3–12 Monate', months: 6 },
  { label: '1–3 Jahre', months: 24 },
  { label: 'über 3 Jahre', months: 48 },
] as const;

/** Plausible Pace-Grenzen in Sekunden pro km (2:30 bis 15:00 min/km) */
const MIN_PACE_S_PER_KM = 150;
const MAX_PACE_S_PER_KM = 900;

// ---------------------------------------------------------------------
// Umrechnungen
// ---------------------------------------------------------------------

/** Stunden, Minuten und Sekunden in Sekunden umrechnen */
export function toSeconds(hours: number, minutes: number, seconds: number): number {
  return hours * 3600 + minutes * 60 + seconds;
}

/** Pace in Sekunden pro km aus Strecke (m) und Zeit (s) */
export function calculatePace(distanceM: number, timeS: number): number {
  return Math.round(timeS / (distanceM / 1000));
}

/** Pace als Text, z. B. 369 → "6:09" */
export function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = secondsPerKm % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Ganze Wochen von heute bis zum Datum (negativ, wenn es in der Vergangenheit liegt) */
export function weeksUntil(date: Date, today: Date = new Date()): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor((date.getTime() - today.getTime()) / msPerWeek);
}

// ---------------------------------------------------------------------
// Schritt 1: Ziel
// ---------------------------------------------------------------------

export type GoalInput = {
  distanceM: number | null;
  targetTimeS: number;
  raceDate: Date | null;
};

export function validateGoal(input: GoalInput, today: Date = new Date()): ValidationErrors {
  const errors: ValidationErrors = {};

  if (input.distanceM === null) {
    errors.distanceM = 'Bitte wähle eine Distanz.';
  }

  if (input.targetTimeS <= 0) {
    errors.targetTimeS = 'Bitte gib eine Zielzeit ein.';
  } else if (input.distanceM !== null) {
    const pace = calculatePace(input.distanceM, input.targetTimeS);
    if (pace < MIN_PACE_S_PER_KM) {
      errors.targetTimeS = 'Diese Zielzeit ist unrealistisch schnell.';
    } else if (pace > MAX_PACE_S_PER_KM) {
      errors.targetTimeS = 'Diese Zielzeit entspricht eher Gehen als Laufen.';
    }
  }

  if (input.raceDate === null) {
    errors.raceDate = 'Bitte wähle ein Wettkampfdatum.';
  } else if (input.raceDate.getTime() <= today.getTime()) {
    errors.raceDate = 'Das Wettkampfdatum muss in der Zukunft liegen.';
  }

  return errors;
}

// ---------------------------------------------------------------------
// Schritt 2: Basis
// ---------------------------------------------------------------------

export type BaselineInput = {
  runsPerWeek: number;
  kmPerWeek: number;
  longestRunKm: number;
  recent5kTimeS: number;
  runningSinceMonths: number | null;
};

export function validateBaseline(input: BaselineInput): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!Number.isInteger(input.runsPerWeek) || input.runsPerWeek < 0 || input.runsPerWeek > 14) {
    errors.runsPerWeek = 'Bitte gib zwischen 0 und 14 Läufe an.';
  }

  if (input.kmPerWeek < 0 || input.kmPerWeek > 300) {
    errors.kmPerWeek = 'Bitte gib zwischen 0 und 300 km an.';
  }

  if (input.longestRunKm < 0 || input.longestRunKm > 100) {
    errors.longestRunKm = 'Bitte gib zwischen 0 und 100 km an.';
  }

  // 12 bis 60 Minuten deckt Spitzenläufer bis Einsteiger ab
  if (input.recent5kTimeS < 12 * 60 || input.recent5kTimeS > 60 * 60) {
    errors.recent5kTimeS = 'Bitte gib eine Zeit zwischen 12 und 60 Minuten an. Eine Schätzung reicht.';
  }

  if (input.runningSinceMonths === null) {
    errors.runningSinceMonths = 'Bitte wähle aus, seit wann du läufst.';
  }

  return errors;
}

// ---------------------------------------------------------------------
// Schritt 3: Trainingstage
// ---------------------------------------------------------------------

/** Wochentage nach ISO: 1 = Montag … 7 = Sonntag */
export function validateAvailableDays(days: number[]): ValidationErrors {
  const errors: ValidationErrors = {};

  if (days.length === 0) {
    errors.availableDays = 'Bitte wähle mindestens einen Tag.';
  } else if (days.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) {
    errors.availableDays = 'Ungültiger Wochentag.';
  }

  return errors;
}

// ---------------------------------------------------------------------
// Schritt 4: Beschwerden
// ---------------------------------------------------------------------

export type PainInput = {
  hasPain: boolean;
  location: string | null;
  level: number | null;
};

export function validatePain(input: PainInput): ValidationErrors {
  const errors: ValidationErrors = {};

  // Ohne Beschwerden gibt es nichts zu prüfen
  if (!input.hasPain) return errors;

  if (!input.location) {
    errors.location = 'Bitte wähle eine Körperstelle.';
  }

  if (input.level === null || !Number.isInteger(input.level) || input.level < 0 || input.level > 10) {
    errors.level = 'Bitte gib eine Stärke zwischen 0 und 10 an.';
  }

  return errors;
}

/** Ab dieser Schmerzstärke zeigt die App den ärztlichen Hinweis (FA#0114) */
export const PAIN_WARNING_THRESHOLD = 4;