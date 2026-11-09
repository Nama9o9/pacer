Claude











































Validation.test · TS
import {
  calculatePace,
  formatPace,
  parseDecimal,
  parseInteger,
  parseGermanDate,
  toSeconds,
  validateAvailableDays,
  validateBaseline,
  validateGoal,
  validatePain,
  weeksUntil,
  type BaselineInput,
  type GoalInput,
} from '@/utils/validation';
 
// Festes „Heute“, damit die Tests nicht vom echten Datum abhängen
const TODAY = new Date('2026-11-08T12:00:00');
 
describe('Textfelder auslesen', () => {
  it('liest Ganzzahlen', () => {
    expect(parseInteger('3')).toBe(3);
    expect(parseInteger('')).toBe(0);
    expect(parseInteger('abc')).toBe(0);
  });
 
  it('liest Kommazahlen mit Komma und Punkt', () => {
    expect(parseDecimal('24,5')).toBe(24.5);
    expect(parseDecimal('24.5')).toBe(24.5);
    expect(parseDecimal('')).toBe(0);
  });
});
 
describe('Umrechnungen', () => {
  it('rechnet Stunden, Minuten und Sekunden in Sekunden um', () => {
    expect(toSeconds(2, 10, 0)).toBe(7800);
    expect(toSeconds(0, 25, 30)).toBe(1530);
  });
 
  it('berechnet die Pace in Sekunden pro km', () => {
    // Halbmarathon in 2:10:00 → ca. 6:10 min/km
    expect(calculatePace(21097, 7800)).toBe(370);
    expect(calculatePace(5000, 1500)).toBe(300);
  });
 
  it('formatiert die Pace mit führender Null bei den Sekunden', () => {
    expect(formatPace(369)).toBe('6:09');
    expect(formatPace(300)).toBe('5:00');
    expect(formatPace(65)).toBe('1:05');
  });
 
  it('zählt ganze Wochen bis zum Datum', () => {
    expect(weeksUntil(new Date('2026-11-22T12:00:00'), TODAY)).toBe(2);
    expect(weeksUntil(new Date('2026-11-20T12:00:00'), TODAY)).toBe(1);
  });
});
 
describe('parseGermanDate', () => {
  it('erkennt ein gültiges Datum', () => {
    const date = parseGermanDate('18.04.2027');
    expect(date?.getFullYear()).toBe(2027);
    expect(date?.getMonth()).toBe(3);
    expect(date?.getDate()).toBe(18);
  });
 
  it('akzeptiert einstellige Tage und Monate', () => {
    expect(parseGermanDate('1.5.2027')?.getDate()).toBe(1);
  });
 
  it('lehnt unmögliche Daten ab', () => {
    expect(parseGermanDate('31.02.2027')).toBeNull();
    expect(parseGermanDate('00.05.2027')).toBeNull();
    expect(parseGermanDate('12.13.2027')).toBeNull();
  });
 
  it('lehnt falsche Formate ab', () => {
    expect(parseGermanDate('2027-04-18')).toBeNull();
    expect(parseGermanDate('18.04.27')).toBeNull();
    expect(parseGermanDate('')).toBeNull();
  });
});
 
describe('validateGoal', () => {
  const validGoal: GoalInput = {
    distanceM: 21097,
    targetTimeS: toSeconds(2, 10, 0),
    raceDate: new Date('2027-04-18T12:00:00'),
  };
 
  it('akzeptiert ein gültiges Ziel', () => {
    expect(validateGoal(validGoal, TODAY)).toEqual({});
  });
 
  it('meldet eine fehlende Distanz', () => {
    const errors = validateGoal({ ...validGoal, distanceM: null }, TODAY);
    expect(errors.distanceM).toBeDefined();
  });
 
  it('meldet eine fehlende Zielzeit', () => {
    const errors = validateGoal({ ...validGoal, targetTimeS: 0 }, TODAY);
    expect(errors.targetTimeS).toBeDefined();
  });
 
  it('lehnt eine unrealistisch schnelle Zielzeit ab', () => {
    // 5 km in 10 Minuten = 2:00 min/km
    const errors = validateGoal({ ...validGoal, distanceM: 5000, targetTimeS: 600 }, TODAY);
    expect(errors.targetTimeS).toBeDefined();
  });
 
  it('lehnt eine Zielzeit im Gehtempo ab', () => {
    // 5 km in 80 Minuten = 16:00 min/km
    const errors = validateGoal({ ...validGoal, distanceM: 5000, targetTimeS: 4800 }, TODAY);
    expect(errors.targetTimeS).toBeDefined();
  });
 
  it('lehnt ein Datum in der Vergangenheit ab', () => {
    const errors = validateGoal({ ...validGoal, raceDate: new Date('2026-10-01T12:00:00') }, TODAY);
    expect(errors.raceDate).toBeDefined();
  });
 
  it('lehnt das heutige Datum ab', () => {
    const errors = validateGoal({ ...validGoal, raceDate: TODAY }, TODAY);
    expect(errors.raceDate).toBeDefined();
  });
 
  it('meldet ein fehlendes Datum', () => {
    const errors = validateGoal({ ...validGoal, raceDate: null }, TODAY);
    expect(errors.raceDate).toBeDefined();
  });
});
 
describe('validateBaseline', () => {
  const validBaseline: BaselineInput = {
    runsPerWeek: 3,
    kmPerWeek: 24,
    longestRunKm: 12,
    recent5kTimeS: toSeconds(0, 28, 30),
    runningSinceMonths: 24,
  };
 
  it('akzeptiert gültige Angaben', () => {
    expect(validateBaseline(validBaseline)).toEqual({});
  });
 
  it('akzeptiert eine Einsteigerin ohne bisherige Läufe', () => {
    const beginner = { ...validBaseline, runsPerWeek: 0, kmPerWeek: 0, longestRunKm: 0, runningSinceMonths: 1 };
    expect(validateBaseline(beginner)).toEqual({});
  });
 
  it('erlaubt einen längsten Lauf über dem Wochendurchschnitt', () => {
    // Alle zwei Wochen 10 km: im Schnitt 5 km pro Woche
    expect(validateBaseline({ ...validBaseline, kmPerWeek: 5, longestRunKm: 10 })).toEqual({});
  });
 
  it('lehnt mehr als 14 Läufe pro Woche ab', () => {
    expect(validateBaseline({ ...validBaseline, runsPerWeek: 15 }).runsPerWeek).toBeDefined();
  });
 
  it('lehnt Kommazahlen bei den Läufen ab', () => {
    expect(validateBaseline({ ...validBaseline, runsPerWeek: 2.5 }).runsPerWeek).toBeDefined();
  });
 
  it('akzeptiert genau 12 Minuten als 5-km-Zeit', () => {
    expect(validateBaseline({ ...validBaseline, recent5kTimeS: 720 })).toEqual({});
  });
 
  it('lehnt eine 5-km-Zeit unter 12 Minuten ab', () => {
    expect(validateBaseline({ ...validBaseline, recent5kTimeS: 719 }).recent5kTimeS).toBeDefined();
  });
 
  it('meldet fehlendes „Laufen seit“', () => {
    expect(validateBaseline({ ...validBaseline, runningSinceMonths: null }).runningSinceMonths).toBeDefined();
  });
});
 
describe('validateAvailableDays', () => {
  it('akzeptiert gültige Wochentage', () => {
    expect(validateAvailableDays([1, 3, 6])).toEqual({});
  });
 
  it('verlangt mindestens einen Tag', () => {
    expect(validateAvailableDays([]).availableDays).toBeDefined();
  });
 
  it('lehnt ungültige Wochentage ab', () => {
    expect(validateAvailableDays([0]).availableDays).toBeDefined();
    expect(validateAvailableDays([8]).availableDays).toBeDefined();
  });
});
 
describe('validatePain', () => {
  it('prüft nichts, wenn keine Beschwerden angegeben sind', () => {
    expect(validatePain({ hasPain: false, location: null, level: null })).toEqual({});
  });
 
  it('akzeptiert Körperstelle und Stärke', () => {
    expect(validatePain({ hasPain: true, location: 'Knie (rechts)', level: 2 })).toEqual({});
  });
 
  it('verlangt eine Körperstelle', () => {
    expect(validatePain({ hasPain: true, location: null, level: 2 }).location).toBeDefined();
  });
 
  it('verlangt eine Stärke', () => {
    expect(validatePain({ hasPain: true, location: 'Knie (rechts)', level: null }).level).toBeDefined();
  });
 
  it('lehnt eine Stärke über 10 ab', () => {
    expect(validatePain({ hasPain: true, location: 'Knie (rechts)', level: 11 }).level).toBeDefined();
  });
});
