import { assertNonNegativeInteger, assertPositive } from './errors.ts';
import { calculatePace } from './target.ts';
import type { GoalComparison, GoalComparisonInput, SessionComparison, SessionMetrics } from './types.ts';

/** Differenzen Ist minus Soll für eine Einheit, ohne Bewertung */
export function compareSession(planned: SessionMetrics, actual: SessionMetrics): SessionComparison {
  const plannedPace = calculatePace(planned.distanceM, planned.durationS);
  const actualPace = calculatePace(actual.distanceM, actual.durationS);
  const distanceDiffM = actual.distanceM - planned.distanceM;

  return {
    distanceDiffM,
    distanceDiffPct: (distanceDiffM / planned.distanceM) * 100,
    paceDiffSPerKm: actualPace - plannedPace,
  };
}

/** Abstand der Prognose zur Zielzeit, ohne Bewertung */
export function compareToGoal({ targetTimeS, predictedTimeS, weeksLeft }: GoalComparisonInput): GoalComparison {
  assertPositive(targetTimeS, 'Zielzeit');
  assertPositive(predictedTimeS, 'Prognostizierte Zeit');
  assertNonNegativeInteger(weeksLeft, 'Verbleibende Wochen');

  const gapS = predictedTimeS - targetTimeS;
  return {
    gapS,
    gapPct: (gapS / targetTimeS) * 100,
    gapPerWeekS: weeksLeft > 0 ? gapS / weeksLeft : null,
  };
}
