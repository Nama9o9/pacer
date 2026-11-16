import { assertAlmostEquals, assertEquals, assertThrows } from '@std/assert';

import { compareSession, compareToGoal } from './compare.ts';
import { MetricsInputError } from './errors.ts';

// Geplant: 10 km in 50:00 = 300 s/km
const PLANNED = { distanceM: 10000, durationS: 3000 };

Deno.test('compareSession: weiter und schneller als geplant ergibt positive Strecke, negative Pace', () => {
  // 11 km in 3190 s = 290 s/km
  const result = compareSession(PLANNED, { distanceM: 11000, durationS: 3190 });
  assertEquals(result.distanceDiffM, 1000);
  assertAlmostEquals(result.distanceDiffPct, 10, 1e-9);
  assertAlmostEquals(result.paceDiffSPerKm, -10, 1e-9);
});

Deno.test('compareSession: kürzer und langsamer als geplant ergibt negative Strecke, positive Pace', () => {
  // 8 km in 2560 s = 320 s/km
  const result = compareSession(PLANNED, { distanceM: 8000, durationS: 2560 });
  assertEquals(result.distanceDiffM, -2000);
  assertAlmostEquals(result.distanceDiffPct, -20, 1e-9);
  assertAlmostEquals(result.paceDiffSPerKm, 20, 1e-9);
});

Deno.test('compareSession: genau wie geplant ergibt keine Abweichung', () => {
  assertEquals(compareSession(PLANNED, PLANNED), { distanceDiffM: 0, distanceDiffPct: 0, paceDiffSPerKm: 0 });
});

Deno.test('compareSession: ungültige Werte werfen MetricsInputError', () => {
  assertThrows(() => compareSession({ distanceM: 0, durationS: 3000 }, PLANNED), MetricsInputError, 'Distanz');
  assertThrows(() => compareSession(PLANNED, { distanceM: 10000, durationS: -5 }), MetricsInputError, 'Zeit');
  assertThrows(() => compareSession(PLANNED, { distanceM: Number.NaN, durationS: 3000 }), MetricsInputError);
});

Deno.test('compareToGoal: Prognose langsamer als Ziel ergibt positiven Abstand', () => {
  // Ziel 2:10:00 = 7800 s, Prognose 2:16:30 = 8190 s → +390 s = +5 %, 390 / 20 = 19,5 s pro Woche
  const result = compareToGoal({ targetTimeS: 7800, predictedTimeS: 8190, weeksLeft: 20 });
  assertEquals(result.gapS, 390);
  assertAlmostEquals(result.gapPct, 5, 1e-9);
  assertAlmostEquals(result.gapPerWeekS ?? Number.NaN, 19.5, 1e-9);
});

Deno.test('compareToGoal: Prognose schneller als Ziel ergibt negativen Abstand', () => {
  const result = compareToGoal({ targetTimeS: 7800, predictedTimeS: 7410, weeksLeft: 10 });
  assertEquals(result.gapS, -390);
  assertAlmostEquals(result.gapPct, -5, 1e-9);
  assertAlmostEquals(result.gapPerWeekS ?? Number.NaN, -39, 1e-9);
});

Deno.test('compareToGoal: keine Woche mehr übrig ergibt gapPerWeekS null', () => {
  const result = compareToGoal({ targetTimeS: 7800, predictedTimeS: 8190, weeksLeft: 0 });
  assertEquals(result.gapPerWeekS, null);
});

Deno.test('compareToGoal: ungültige Werte werfen MetricsInputError', () => {
  assertThrows(() => compareToGoal({ targetTimeS: 0, predictedTimeS: 8190, weeksLeft: 5 }), MetricsInputError);
  assertThrows(
    () => compareToGoal({ targetTimeS: 7800, predictedTimeS: Number.NaN, weeksLeft: 5 }),
    MetricsInputError,
  );
  assertThrows(() => compareToGoal({ targetTimeS: 7800, predictedTimeS: 8190, weeksLeft: -1 }), MetricsInputError);
  assertThrows(() => compareToGoal({ targetTimeS: 7800, predictedTimeS: 8190, weeksLeft: 2.5 }), MetricsInputError);
});
