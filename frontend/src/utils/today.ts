/**
 * Logik für den Screen „Heute“.
 * Reine Funktionen ohne React; „heute“ wird immer als Parameter übergeben,
 * damit die Tests nicht vom echten Datum abhängen.
 * Wochentage nach ISO wie in der Datenbank: 1 = Montag … 7 = Sonntag.
 */

import type { Tables } from '@/types/database.types';
import { assessFeasibility, type FeasibilityResult } from '@/utils/feasibility';
import { WEEKDAYS, weeksUntil } from '@/utils/validation';

const WEEKDAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------
// Datum und Wochentag
// ---------------------------------------------------------------------

/** ISO-Wochentag eines Datums: 1 = Montag … 7 = Sonntag */
export function isoWeekday(date: Date): number {
  const day = date.getDay(); // JavaScript: 0 = Sonntag
  return day === 0 ? 7 : day;
}

/**
 * Datum „JJJJ-MM-TT“ aus der Datenbank als lokales Datum.
 * Bewusst nicht new Date(text): Das liest den Text als UTC und kann den Tag verschieben.
 * Uhrzeit 12:00 wie bei parseGermanDate.
 */
export function parseIsoDate(text: string): Date {
  const [year, month, day] = text.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

/** Kalendertage von heute bis zum Datum: 0 = heute, 1 = morgen, negativ = vorbei */
export function daysUntil(date: Date, today: Date): number {
  // Über UTC-Kalenderdaten rechnen, damit Uhrzeit und Sommerzeit keine Rolle spielen
  const target = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - start) / MS_PER_DAY);
}

// ---------------------------------------------------------------------
// Kopfzeile und Anzeige
// ---------------------------------------------------------------------

/** Datum ausgeschrieben ohne Jahr, z. B. „Freitag, 13. November“ */
export function formatLongDate(date: Date): string {
  return `${WEEKDAY_NAMES[isoWeekday(date) - 1]}, ${date.getDate()}. ${MONTH_NAMES[date.getMonth()]}`;
}

export type Greeting = 'Guten Morgen' | 'Guten Tag' | 'Guten Abend';

/** Begrüßung nach Tageszeit: 5–10 Uhr Morgen, 11–17 Uhr Tag, sonst Abend */
export function greetingFor(date: Date): Greeting {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'Guten Morgen';
  if (hour >= 11 && hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

// ---------------------------------------------------------------------
// Trainingstage und Woche
// ---------------------------------------------------------------------

/** Liegt das Datum auf einem der verfügbaren Trainingstage? */
export function isTrainingDay(date: Date, availableDays: readonly number[]): boolean {
  return availableDays.includes(isoWeekday(date));
}

export type WeekDay = {
  isoDay: number;
  /** Kurzname, z. B. „Mo“ */
  label: string;
  dayOfMonth: number;
  isTrainingDay: boolean;
  isToday: boolean;
};

/** Die aktuelle Woche von Montag bis Sonntag, in der „heute“ liegt */
export function buildWeek(today: Date, availableDays: readonly number[]): WeekDay[] {
  const mondayOffset = isoWeekday(today) - 1;

  return WEEKDAYS.map(({ label, value }) => {
    // new Date mit Tagesüberlauf rechnet Monats- und Jahreswechsel korrekt
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset + value - 1);
    return {
      isoDay: value,
      label,
      dayOfMonth: date.getDate(),
      isTrainingDay: availableDays.includes(value),
      isToday: value === mondayOffset + 1,
    };
  });
}

// ---------------------------------------------------------------------
// Ziel
// ---------------------------------------------------------------------

/** Countdown bis zum Wettkampf als Text, z. B. „Noch 3 Wochen und 2 Tage“ */
export function formatCountdown(days: number): string {
  if (days < 0) return 'Wettkampf vorbei';
  if (days === 0) return 'Heute ist Wettkampftag';
  if (days === 1) return 'Morgen ist Wettkampftag';
  if (days < 7) return `Noch ${days} Tage`;

  const weeks = Math.floor(days / 7);
  const rest = days % 7;
  const weeksText = `Noch ${weeks} ${weeks === 1 ? 'Woche' : 'Wochen'}`;
  if (rest === 0) return weeksText;
  return `${weeksText} und ${rest} ${rest === 1 ? 'Tag' : 'Tage'}`;
}

export type GoalForAssessment = Pick<Tables<'goals'>, 'distance_m' | 'target_time_s' | 'race_date' | 'created_at'>;
export type BaselineForAssessment = Pick<Tables<'baselines'>, 'recent_5k_time_s' | 'running_since_months'>;

/**
 * Machbarkeit und Prognose für das gespeicherte Ziel.
 * Die Vorbereitungszeit zählt ab Erstellung des Ziels, nicht ab heute.
 * So bleibt die Ampel stabil und entspricht der Einschätzung aus dem Onboarding.
 */
export function assessGoal(goal: GoalForAssessment, baseline: BaselineForAssessment): FeasibilityResult {
  return assessFeasibility({
    distanceM: goal.distance_m,
    targetTimeS: goal.target_time_s,
    weeksUntilRace: weeksUntil(parseIsoDate(goal.race_date), new Date(goal.created_at)),
    recent5kTimeS: baseline.recent_5k_time_s,
    runningSinceMonths: baseline.running_since_months,
  });
}
