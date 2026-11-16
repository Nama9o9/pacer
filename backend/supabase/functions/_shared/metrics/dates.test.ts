import { assertEquals, assertThrows } from '@std/assert';

import { fromDayNumber, localDateOf, mondayOf, toDayNumber } from './dates.ts';
import { MetricsInputError } from './errors.ts';

Deno.test('mondayOf: jeder Tag von Mo bis So führt zum selben Montag', () => {
  const days = ['2026-11-16', '2026-11-18', '2026-11-22'];
  for (const day of days) {
    assertEquals(fromDayNumber(mondayOf(toDayNumber(day, 'Tag'))), '2026-11-16');
  }
});

Deno.test('mondayOf: funktioniert auch vor 1970', () => {
  // 1969-12-31 war ein Mittwoch, der Montag davor der 29.12.1969
  assertEquals(fromDayNumber(mondayOf(toDayNumber('1969-12-31', 'Tag'))), '1969-12-29');
});

Deno.test('localDateOf: Kalenderdatum hängt von der Zeitzone ab', () => {
  assertEquals(localDateOf('2026-11-22T23:30:00Z', 'Europe/Berlin'), '2026-11-23');
  assertEquals(localDateOf('2026-11-22T23:30:00Z', 'UTC'), '2026-11-22');
});

Deno.test('localDateOf: unbekannte Zeitzone wirft MetricsInputError', () => {
  assertThrows(() => localDateOf('2026-11-22T23:30:00Z', 'Mars/Olympus'), MetricsInputError, 'Zeitzone');
});
