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

/** Wochentage nach ISO: 1 = Montag … 7 = Sonntag */
export const WEEKDAYS = [
  { label: 'Mo', value: 1 },
  { label: 'Di', value: 2 },
  { label: 'Mi', value: 3 },
  { label: 'Do', value: 4 },
  { label: 'Fr', value: 5 },
  { label: 'Sa', value: 6 },
  { label: 'So', value: 7 },
] as const;

/**
 * Körperstellen bei Beschwerden.
 * value entspricht dem Enum body_location in der Datenbank.
 */
export const PAIN_LOCATIONS = [
  { value: 'knee_left', label: 'Knie (links)' },
  { value: 'knee_right', label: 'Knie (rechts)' },
  { value: 'shin', label: 'Schienbein' },
  { value: 'achilles', label: 'Achillessehne' },
  { value: 'calf', label: 'Wade' },
  { value: 'foot', label: 'Fuß' },
  { value: 'hip', label: 'Hüfte' },
  { value: 'back', label: 'Rücken' },
  { value: 'other', label: 'Andere' },
] as const;

export type BodyLocation = (typeof PAIN_LOCATIONS)[number]['value'];

/** Plausible Pace-Grenzen in Sekunden pro km (2:30 bis 15:00 min/km) */
const MIN_PACE_S_PER_KM = 150;
const MAX_PACE_S_PER_KM = 900;

// ---------------------------------------------------------------------
// Umrechnungen
// ---------------------------------------------------------------------

/** Ganzzahl aus einem Textfeld; leer oder ungültig ergibt 0 */
export function parseInteger(text: string): number {
  const value = Number.parseInt(text, 10);
  return Number.isNaN(value) ? 0 : value;
}

/** Kommazahl aus einem Textfeld, akzeptiert „24,5“ und „24.5“; leer oder ungültig ergibt 0 */
export function parseDecimal(text: string): number {
  const value = Number.parseFloat(text.replace(',', '.'));
  return Number.isNaN(value) ? 0 : value;
}

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

/**
 * Datum im Format TT.MM.JJJJ in ein Date umwandeln.
 * Gibt null zurück bei falschem Format oder unmöglichem Datum (z. B. 31.02.).
 * Uhrzeit 12:00, damit Zeitzonen das Datum nicht verschieben.
 */
export function parseGermanDate(text: string): Date | null {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);

  // JavaScript macht aus dem 31.02. stillschweigend den 03.03., das fangen wir ab
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
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

export type PainEntry = {
  location: BodyLocation;
  level: number | null;
};

export type PainInput = {
  hasPain: boolean;
  pains: PainEntry[];
};

export function validatePain(input: PainInput): ValidationErrors {
  const errors: ValidationErrors = {};

  // Ohne Beschwerden gibt es nichts zu prüfen
  if (!input.hasPain) return errors;

  if (input.pains.length === 0) {
    errors.pains = 'Bitte wähle mindestens eine Körperstelle.';
    return errors;
  }

  const locations = input.pains.map((pain) => pain.location);
  if (new Set(locations).size !== locations.length) {
    errors.pains = 'Jede Körperstelle darf nur einmal vorkommen.';
  }

  const hasInvalidLevel = input.pains.some(
    (pain) => pain.level === null || !Number.isInteger(pain.level) || pain.level < 0 || pain.level > 10,
  );
  if (hasInvalidLevel) {
    errors.levels = 'Bitte gib für jede Stelle eine Stärke zwischen 0 und 10 an.';
  }

  return errors;
}

/** Höchste angegebene Stärke, 0 ohne Angaben */
export function maxPainLevel(pains: PainEntry[]): number {
  return pains.reduce((max, pain) => Math.max(max, pain.level ?? 0), 0);
}

/** Ab dieser Schmerzstärke zeigt die App den ärztlichen Hinweis (FA#0114) */
export const PAIN_WARNING_THRESHOLD = 6;