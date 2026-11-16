import { assertAlmostEquals, assertEquals, assertThrows } from '@std/assert';

import { summarizeRecentWeeks, summarizeWeek } from './actual.ts';
import { MetricsInputError } from './errors.ts';
import type { ActivityMetricsInput } from './types.ts';

// Woche Mo 16.11. bis So 22.11.2026; im November gilt in Berlin UTC+1
const WEEK_START = '2026-11-16';

function run(startedAt: string, distanceM: number, durationS: number): ActivityMetricsInput {
  return { started_at: startedAt, distance_m: distanceM, duration_s: durationS };
}

const WEEK_RUNS = [
  run('2026-11-16T06:00:00Z', 5000, 1500),
  run('2026-11-18T17:00:00Z', 10000, 3300),
  run('2026-11-22T09:00:00Z', 8000, 2400),
];

Deno.test('summarizeWeek: drei Läufe in der Woche', () => {
  const summary = summarizeWeek(WEEK_RUNS, WEEK_START);
  assertEquals(summary.weekStart, WEEK_START);
  assertEquals(summary.totalDistanceM, 23000);
  assertEquals(summary.runCount, 3);
  assertEquals(summary.longestRunM, 10000);
  // (1500 + 3300 + 2400) s / 23 km = 7200 / 23 ≈ 313.043 s/km
  assertAlmostEquals(summary.avgPaceSPerKm ?? Number.NaN, 313.043, 0.001);
});

Deno.test('summarizeWeek: Läufe vor und nach der Woche werden ignoriert', () => {
  const runs = [
    run('2026-11-15T10:00:00Z', 12000, 4000), // Sonntag davor
    ...WEEK_RUNS,
    run('2026-11-23T10:00:00Z', 15000, 5000), // Montag danach
  ];
  const summary = summarizeWeek(runs, WEEK_START);
  assertEquals(summary.runCount, 3);
  assertEquals(summary.totalDistanceM, 23000);
});

Deno.test('summarizeWeek: Woche ohne Läufe ergibt Nullwerte und Pace null', () => {
  assertEquals(summarizeWeek([], WEEK_START), {
    weekStart: WEEK_START,
    totalDistanceM: 0,
    runCount: 0,
    longestRunM: 0,
    avgPaceSPerKm: null,
  });
});

Deno.test('summarizeWeek: So 23:59 gehört noch zur Woche, Mo 00:00 schon zur nächsten', () => {
  const sunday = run('2026-11-22T22:59:00Z', 5000, 1500); // So 23:59 Berlin
  const monday = run('2026-11-22T23:00:00Z', 6000, 1800); // Mo 00:00 Berlin

  const thisWeek = summarizeWeek([sunday, monday], WEEK_START);
  assertEquals(thisWeek.runCount, 1);
  assertEquals(thisWeek.totalDistanceM, 5000);

  const nextWeek = summarizeWeek([sunday, monday], '2026-11-23');
  assertEquals(nextWeek.runCount, 1);
  assertEquals(nextWeek.totalDistanceM, 6000);
});

Deno.test('summarizeWeek: Mo 00:00 zu Wochenbeginn zählt mit (auch in der Sommerzeit)', () => {
  // Winter: Mo 00:00 Berlin = So 23:00 UTC
  assertEquals(summarizeWeek([run('2026-11-15T23:00:00Z', 5000, 1500)], WEEK_START).runCount, 1);
  // Sommer: Mo 01.06.2026 00:00 Berlin = So 22:00 UTC
  assertEquals(summarizeWeek([run('2026-05-31T22:00:00Z', 5000, 1500)], '2026-06-01').runCount, 1);
});

Deno.test('summarizeWeek: Zeitzone ist wählbar', () => {
  // So 23:00 UTC ist in UTC noch Sonntag, in Berlin schon Montag
  const lateSunday = run('2026-11-22T23:00:00Z', 5000, 1500);
  assertEquals(summarizeWeek([lateSunday], WEEK_START, 'UTC').runCount, 1);
  assertEquals(summarizeWeek([lateSunday], WEEK_START).runCount, 0);
});

Deno.test('summarizeWeek: Wochenbeginn, der kein Montag ist, wirft MetricsInputError', () => {
  assertThrows(() => summarizeWeek(WEEK_RUNS, '2026-11-17'), MetricsInputError, 'Montag');
});

Deno.test('summarizeWeek: ungültiger Lauf wirft MetricsInputError', () => {
  assertThrows(() => summarizeWeek([run('2026-11-16T06:00:00Z', 0, 1500)], WEEK_START), MetricsInputError);
  assertThrows(() => summarizeWeek([run('2026-11-16T06:00:00Z', 5000, -1)], WEEK_START), MetricsInputError);
  assertThrows(() => summarizeWeek([run('kein Datum', 5000, 1500)], WEEK_START), MetricsInputError, 'Startzeit');
});

Deno.test('summarizeRecentWeeks: drei Wochen, älteste zuerst, aktuelle Woche zuletzt', () => {
  const runs = [run('2026-11-10T07:00:00Z', 7000, 2100), ...WEEK_RUNS];
  // Donnerstag 19.11. liegt in der Woche ab 16.11.
  const weeks = summarizeRecentWeeks(runs, '2026-11-19', 3);

  assertEquals(weeks.map((w) => w.weekStart), ['2026-11-02', '2026-11-09', '2026-11-16']);
  assertEquals(weeks.map((w) => w.runCount), [0, 1, 3]);
  assertEquals(weeks[0].avgPaceSPerKm, null);
  assertAlmostEquals(weeks[1].avgPaceSPerKm ?? Number.NaN, 300, 1e-9); // 2100 s / 7 km
});

Deno.test('summarizeRecentWeeks: ohne Läufe ergibt Nullwochen', () => {
  const weeks = summarizeRecentWeeks([], '2026-11-16', 2);
  assertEquals(weeks.length, 2);
  assertEquals(weeks.every((w) => w.runCount === 0 && w.avgPaceSPerKm === null), true);
});

Deno.test('summarizeRecentWeeks: ungültige Wochenanzahl wirft MetricsInputError', () => {
  assertThrows(() => summarizeRecentWeeks([], '2026-11-16', 0), MetricsInputError, 'Anzahl der Wochen');
  assertThrows(() => summarizeRecentWeeks([], '2026-11-16', 1.5), MetricsInputError, 'Anzahl der Wochen');
});
