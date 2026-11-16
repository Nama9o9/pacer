import { MetricsInputError } from './errors.ts';
import type { IsoDate } from './types.ts';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Zeitzone, in der Kalenderwochen gezählt werden (Zielgruppe: Deutschland) */
export const DEFAULT_TIME_ZONE = 'Europe/Berlin';

/** Wandelt YYYY-MM-DD in eine fortlaufende Tagesnummer (Tage seit 1970-01-01) */
export function toDayNumber(date: IsoDate, label: string): number {
  if (!ISO_DATE_PATTERN.test(date)) {
    throw new MetricsInputError(`${label} muss im Format JJJJ-MM-TT angegeben sein (erhalten: "${date}").`);
  }
  const [year, month, day] = date.split('-').map(Number);
  const ms = Date.UTC(year, month - 1, day);
  // Rückwärts prüfen, damit z. B. 2026-02-30 nicht still zum 2. März wird
  if (new Date(ms).toISOString().slice(0, 10) !== date) {
    throw new MetricsInputError(`${label} ist kein gültiges Datum (erhalten: "${date}").`);
  }
  return ms / MS_PER_DAY;
}

/** Wandelt eine Tagesnummer zurück in YYYY-MM-DD */
export function fromDayNumber(dayNumber: number): IsoDate {
  return new Date(dayNumber * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Tagesnummer des Montags der Woche, in der der Tag liegt */
export function mondayOf(dayNumber: number): number {
  // 1970-01-01 war ein Donnerstag; daraus ergibt sich der Abstand zum Montag
  const daysSinceMonday = (((dayNumber + 3) % 7) + 7) % 7;
  return dayNumber - daysSinceMonday;
}

/** Kalenderdatum eines Zeitpunkts in der angegebenen Zeitzone */
export function localDateOf(instant: string, timeZone: string): IsoDate {
  const date = new Date(instant);
  if (Number.isNaN(date.getTime())) {
    throw new MetricsInputError(`Startzeit ist kein gültiger Zeitpunkt (erhalten: "${instant}").`);
  }
  try {
    // en-CA formatiert Datumsangaben als YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    throw new MetricsInputError(`Unbekannte Zeitzone: "${timeZone}".`);
  }
}
