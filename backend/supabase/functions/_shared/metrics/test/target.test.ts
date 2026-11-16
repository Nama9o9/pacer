import { assertAlmostEquals, assertEquals, assertThrows } from '@std/assert';

import { MetricsInputError } from '../errors.ts';
import { calculatePace, predictRaceTime, weeksUntil } from '../target.ts';

Deno.test('calculatePace: 5 km in 25:00 ergibt 300 s/km', () => {
  assertEquals(calculatePace(5000, 1500), 300);
});

Deno.test('calculatePace: 10 km in 52:05 ergibt 312,5 s/km', () => {
  assertAlmostEquals(calculatePace(10000, 3125), 312.5, 1e-9);
});

Deno.test('calculatePace: Distanz 0, negative Zeit und NaN werfen MetricsInputError', () => {
  assertThrows(() => calculatePace(0, 1500), MetricsInputError, 'Distanz');
  assertThrows(() => calculatePace(5000, -1), MetricsInputError, 'Zeit');
  assertThrows(() => calculatePace(Number.NaN, 1500), MetricsInputError);
  assertThrows(() => calculatePace(5000, Number.NaN), MetricsInputError);
});

Deno.test('predictRaceTime: doppelte Distanz ergibt T1 * 2^1.06', () => {
  // 2^1.06 = 2 * e^(0.06 * ln 2) ≈ 2.084932 → 1500 s * 2.084932 ≈ 3127.40 s
  assertAlmostEquals(predictRaceTime(5000, 1500, 10000), 3127.40, 0.01);
});

Deno.test('predictRaceTime: gleiche Distanz ergibt dieselbe Zeit', () => {
  assertEquals(predictRaceTime(10000, 3000, 10000), 3000);
});

Deno.test('predictRaceTime: kürzere Zieldistanz ergibt kürzere Zeit', () => {
  // 0.5^1.06 = 1 / 2.084932 ≈ 0.479632 → 3000 s * 0.479632 ≈ 1438.90 s
  assertAlmostEquals(predictRaceTime(10000, 3000, 5000), 1438.90, 0.01);
});

Deno.test('predictRaceTime: ungültige Eingaben werfen MetricsInputError', () => {
  assertThrows(() => predictRaceTime(0, 1500, 10000), MetricsInputError, 'Referenzdistanz');
  assertThrows(() => predictRaceTime(5000, -60, 10000), MetricsInputError, 'Referenzzeit');
  assertThrows(() => predictRaceTime(5000, 1500, Number.NaN), MetricsInputError, 'Zieldistanz');
});

Deno.test('weeksUntil: 146 Tage ergeben 20 volle Wochen', () => {
  // 16.11. bis 11.04.: 14 + 31 + 31 + 28 + 31 + 11 = 146 Tage = 20 Wochen + 6 Tage
  assertEquals(weeksUntil('2027-04-11', '2026-11-16'), 20);
});

Deno.test('weeksUntil: rundet ab (13 Tage = 1 Woche, 14 Tage = 2 Wochen)', () => {
  assertEquals(weeksUntil('2026-11-29', '2026-11-16'), 1);
  assertEquals(weeksUntil('2026-11-30', '2026-11-16'), 2);
});

Deno.test('weeksUntil: Wettkampf heute ergibt 0', () => {
  assertEquals(weeksUntil('2026-11-16', '2026-11-16'), 0);
});

Deno.test('weeksUntil: Wettkampf in der Vergangenheit wirft MetricsInputError', () => {
  assertThrows(() => weeksUntil('2026-11-15', '2026-11-16'), MetricsInputError, 'Vergangenheit');
});

Deno.test('weeksUntil: ungültiges Datum wirft MetricsInputError', () => {
  assertThrows(() => weeksUntil('2027-02-30', '2026-11-16'), MetricsInputError, 'kein gültiges Datum');
  assertThrows(() => weeksUntil('11.04.2027', '2026-11-16'), MetricsInputError, 'JJJJ-MM-TT');
});
