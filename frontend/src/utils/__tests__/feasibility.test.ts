import { allowedImprovement, assessFeasibility, predictTime } from '@/utils/feasibility';

describe('predictTime', () => {
  it('liefert bei gleicher Distanz die Referenzzeit', () => {
    expect(predictTime(5000, 1500, 5000)).toBe(1500);
  });

  it('rechnet nach Riegel von 5 km auf 10 km hoch', () => {
    // 25:00 auf 5 km → ca. 52:07 auf 10 km
    expect(predictTime(5000, 1500, 10000)).toBe(3127);
  });
});

describe('assessFeasibility', () => {
  // 5 km in 28:30 → Halbmarathon-Prognose ca. 2:11:06
  // 1–3 Jahre Erfahrung: 0,5 % pro Woche → bei 20 Wochen 10 %
  const base = { distanceM: 21097, recent5kTimeS: 1710, weeksUntilRace: 20, runningSinceMonths: 24 };

  it('ist realistisch, wenn die Zielzeit langsamer als die Prognose ist', () => {
    const result = assessFeasibility({ ...base, targetTimeS: 8400 });
    expect(result.level).toBe('realistic');
    expect(result.reasons).toEqual([]);
    expect(result.suggestedTargetTimeS).toBeNull();
  });

  it('ist ambitioniert bei mittlerer Verbesserung', () => {
    // 20 Wochen → erlaubt 10 %, ambitioniert ab über 5 %
    const result = assessFeasibility({ ...base, targetTimeS: Math.round(result0().predictedTimeS * 0.93) });
    expect(result.level).toBe('ambitious');
    // Bei „ambitioniert“ kein Vorschlag, das Ziel ist machbar
    expect(result.suggestedTargetTimeS).toBeNull();
  });

  it('ist unrealistisch bei zu großer Verbesserung und macht einen Vorschlag', () => {
    const result = assessFeasibility({ ...base, targetTimeS: 6000 });
    expect(result.level).toBe('unrealistic');
    expect(result.suggestedTargetTimeS).not.toBeNull();
    expect(result.suggestedTargetTimeS! % 60).toBe(0);
    expect(result.suggestedTargetTimeS!).toBeGreaterThan(6000);
  });

  it('ist unrealistisch bei zu kurzer Vorbereitung, auch mit passender Zielzeit', () => {
    const result = assessFeasibility({ ...base, weeksUntilRace: 6, targetTimeS: 8400 });
    expect(result.level).toBe('unrealistic');
    expect(result.suggestedTargetTimeS).toBeNull();
  });

  it('ist ambitioniert bei knapper Vorbereitung', () => {
    // Halbmarathon: mindestens 10 Wochen, knapp unter 15
    const result = assessFeasibility({ ...base, weeksUntilRace: 12, targetTimeS: 8400 });
    expect(result.level).toBe('ambitious');
  });

  it('nimmt das schlechtere Ergebnis aus beiden Prüfungen', () => {
    const result = assessFeasibility({ ...base, weeksUntilRace: 6, targetTimeS: 6000 });
    expect(result.level).toBe('unrealistic');
    expect(result.reasons).toHaveLength(2);
  });

  it('erlaubt ohne Vorbereitungszeit keine Verbesserung', () => {
    const result = assessFeasibility({
      distanceM: 5000,
      recent5kTimeS: 1500,
      weeksUntilRace: 0,
      targetTimeS: 1490,
      runningSinceMonths: 24,
    });
    expect(result.level).toBe('unrealistic');
  });

  it('stuft eine Einsteigerin mit langer Vorbereitung als ambitioniert ein', () => {
    // Halbmarathon 1:55:00, 5 km in 30:00, seit ca. 6 Monaten, 45 Wochen
    const result = assessFeasibility({
      distanceM: 21097,
      targetTimeS: 6900,
      weeksUntilRace: 45,
      recent5kTimeS: 1800,
      runningSinceMonths: 6,
    });
    expect(result.predictedTimeS).toBe(8280);
    expect(result.level).toBe('ambitious');
  });

  it('ist bei erfahrenen Läufern strenger', () => {
    // Gleiches Ziel, über 3 Jahre Erfahrung: höchstens 8 %
    const result = assessFeasibility({
      distanceM: 21097,
      targetTimeS: 6900,
      weeksUntilRace: 45,
      recent5kTimeS: 1800,
      runningSinceMonths: 48,
    });
    expect(result.level).toBe('unrealistic');
  });
});

describe('allowedImprovement', () => {
  it('wächst mit den Wochen bis zur Obergrenze der Erfahrungsstufe', () => {
    expect(allowedImprovement(6, 10)).toBeCloseTo(0.1);
    expect(allowedImprovement(6, 45)).toBeCloseTo(0.25);
    expect(allowedImprovement(24, 45)).toBeCloseTo(0.15);
    expect(allowedImprovement(48, 45)).toBeCloseTo(0.08);
  });

  it('erlaubt ohne Vorbereitungszeit keine Verbesserung', () => {
    expect(allowedImprovement(6, 0)).toBe(0);
    expect(allowedImprovement(6, -2)).toBe(0);
  });
});

/** Hilfsfunktion: Prognose für die Basisdaten */
function result0() {
  return assessFeasibility({
    distanceM: 21097,
    recent5kTimeS: 1710,
    weeksUntilRace: 20,
    targetTimeS: 9999,
    runningSinceMonths: 24,
  });
}