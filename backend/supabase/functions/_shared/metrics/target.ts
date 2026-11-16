import { toDayNumber } from './dates.ts';
import { assertPositive, MetricsInputError } from './errors.ts';
import type { IsoDate } from './types.ts';

/**
 * Exponent der Riegel-Formel T2 = T1 * (D2 / D1)^1.06.
 * Achtung: Für Freizeitläufer:innen ist die Prognose auf langen Distanzen
 * (Halbmarathon, Marathon) oft zu optimistisch, weil die Ausdauer schneller
 * nachlässt, als der Exponent annimmt.
 */
export const RIEGEL_EXPONENT = 1.06;

/** Pace in Sekunden pro Kilometer (ungerundet) */
export function calculatePace(distanceM: number, timeS: number): number {
  assertPositive(distanceM, 'Distanz');
  assertPositive(timeS, 'Zeit');
  return (timeS / distanceM) * 1000;
}

/** Prognostizierte Zielzeit in Sekunden nach der Riegel-Formel */
export function predictRaceTime(refDistanceM: number, refTimeS: number, targetDistanceM: number): number {
  assertPositive(refDistanceM, 'Referenzdistanz');
  assertPositive(refTimeS, 'Referenzzeit');
  assertPositive(targetDistanceM, 'Zieldistanz');
  return refTimeS * Math.pow(targetDistanceM / refDistanceM, RIEGEL_EXPONENT);
}

/**
 * Ganze Wochen bis zum Wettkampf (abgerundet).
 * Wettkampf heute ergibt 0, ein Datum in der Vergangenheit ist ein Fehler.
 */
export function weeksUntil(raceDate: IsoDate, today: IsoDate): number {
  const days = toDayNumber(raceDate, 'Wettkampfdatum') - toDayNumber(today, 'Heutiges Datum');
  if (days < 0) {
    throw new MetricsInputError(`Das Wettkampfdatum ${raceDate} liegt in der Vergangenheit.`);
  }
  return Math.floor(days / 7);
}
