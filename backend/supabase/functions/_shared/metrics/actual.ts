import { DEFAULT_TIME_ZONE, fromDayNumber, localDateOf, mondayOf, toDayNumber } from './dates.ts';
import { assertPositive, MetricsInputError } from './errors.ts';
import type { ActivityMetricsInput, IsoDate, WeekSummary } from './types.ts';

/**
 * Ist-Kennzahlen für die Kalenderwoche Mo 00:00 bis So 23:59 (in timeZone).
 * Läufe außerhalb der Woche werden ignoriert; eine leere Liste ergibt Nullwerte.
 */
export function summarizeWeek(
  activities: readonly ActivityMetricsInput[],
  weekStart: IsoDate,
  timeZone: string = DEFAULT_TIME_ZONE,
): WeekSummary {
  const startDay = toDayNumber(weekStart, 'Wochenbeginn');
  if (mondayOf(startDay) !== startDay) {
    throw new MetricsInputError(`Wochenbeginn muss ein Montag sein (erhalten: ${weekStart}).`);
  }
  const endDay = startDay + 6;

  const inWeek = activities.filter((activity) => {
    assertPositive(activity.distance_m, 'Distanz des Laufs');
    assertPositive(activity.duration_s, 'Dauer des Laufs');
    const day = toDayNumber(localDateOf(activity.started_at, timeZone), 'Startdatum');
    return day >= startDay && day <= endDay;
  });

  const totalDistanceM = inWeek.reduce((sum, a) => sum + a.distance_m, 0);
  const totalDurationS = inWeek.reduce((sum, a) => sum + a.duration_s, 0);

  return {
    weekStart,
    totalDistanceM,
    runCount: inWeek.length,
    longestRunM: inWeek.reduce((max, a) => Math.max(max, a.distance_m), 0),
    // Nach Strecke gewichtet, nicht der Mittelwert der Einzel-Paces
    avgPaceSPerKm: totalDistanceM > 0 ? (totalDurationS / totalDistanceM) * 1000 : null,
  };
}

/**
 * Wochenkennzahlen der letzten `weeks` Wochen, älteste zuerst.
 * Die laufende Woche (die `today` enthält) ist die letzte im Ergebnis.
 */
export function summarizeRecentWeeks(
  activities: readonly ActivityMetricsInput[],
  today: IsoDate,
  weeks: number,
  timeZone: string = DEFAULT_TIME_ZONE,
): WeekSummary[] {
  if (!Number.isInteger(weeks) || weeks < 1) {
    throw new MetricsInputError(`Anzahl der Wochen muss eine ganze Zahl ab 1 sein (erhalten: ${weeks}).`);
  }
  const currentMonday = mondayOf(toDayNumber(today, 'Heutiges Datum'));

  return Array.from({ length: weeks }, (_, index) => {
    const monday = currentMonday - (weeks - 1 - index) * 7;
    return summarizeWeek(activities, fromDayNumber(monday), timeZone);
  });
}
