import { describeSaveError, formatKm, formatRunSummary, toManualActivityInsert } from '@/utils/activities';

describe('toManualActivityInsert', () => {
  it('setzt user_id und source = manual und übernimmt die Werte', () => {
    const startedAt = new Date(2026, 10, 12, 23, 59);
    const row = toManualActivityInsert('user-1', {
      startedAt,
      distanceM: 8500,
      durationS: 3130,
      avgHeartRate: null,
      elevationGainM: 40,
    });

    expect(row).toEqual({
      user_id: 'user-1',
      source: 'manual',
      started_at: startedAt.toISOString(),
      distance_m: 8500,
      duration_s: 3130,
      avg_heart_rate: null,
      elevation_gain_m: 40,
    });
  });
});

describe('describeSaveError', () => {
  it('übersetzt bekannte Fehler in verständliche Meldungen', () => {
    expect(describeSaveError({ code: '23514' })).toMatch(/Eingaben/);
    expect(describeSaveError({ code: '42501' })).toMatch(/angemeldet/);
    expect(describeSaveError({ message: 'TypeError: Network request failed' })).toMatch(/Verbindung/);
  });

  it('hat eine allgemeine Meldung für alles andere', () => {
    expect(describeSaveError({ code: '99999', message: 'boom' })).toMatch(/nicht geklappt/);
  });
});

describe('Anzeige', () => {
  it('formatiert Kilometer mit Komma', () => {
    expect(formatKm(8500)).toBe('8,5');
    expect(formatKm(10000)).toBe('10');
    expect(formatKm(21097)).toBe('21,1');
    expect(formatKm(5250)).toBe('5,25');
  });

  it('fasst einen Lauf zusammen', () => {
    expect(formatRunSummary(8500, 52 * 60 + 10)).toBe('8,5 km in 52:10 (6:08 /km)');
  });
});
