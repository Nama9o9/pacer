import { assessFeasibility } from '@/utils/feasibility';
import {
  assessGoal,
  buildWeek,
  daysUntil,
  formatCountdown,
  formatLongDate,
  greetingFor,
  isoWeekday,
  isTrainingDay,
  parseIsoDate,
  runDaysInWeek,
  runsOnDay,
  sumRuns,
  weekBounds,
} from '@/utils/today';

// Feste Daten statt new Date(), damit die Tests jeden Tag gleich laufen
const SUNDAY = new Date(2026, 10, 15, 10); // So, 15.11.2026
const MONDAY = new Date(2026, 10, 16, 10); // Mo, 16.11.2026
const FRIDAY = new Date(2026, 10, 13, 10); // Fr, 13.11.2026

describe('isoWeekday', () => {
  it('liefert 1 für Montag und 7 für Sonntag', () => {
    expect(isoWeekday(MONDAY)).toBe(1);
    expect(isoWeekday(FRIDAY)).toBe(5);
    expect(isoWeekday(SUNDAY)).toBe(7);
  });
});

describe('parseIsoDate', () => {
  it('liest das Datum als lokalen Tag ohne Verschiebung', () => {
    const date = parseIsoDate('2027-03-14');
    expect(date.getFullYear()).toBe(2027);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(14);
  });
});

describe('daysUntil', () => {
  it('ist 0, wenn der Wettkampf heute ist', () => {
    expect(daysUntil(new Date(2026, 10, 13, 8), new Date(2026, 10, 13, 23))).toBe(0);
  });

  it('ist 1, wenn der Wettkampf morgen ist, auch kurz vor Mitternacht', () => {
    expect(daysUntil(new Date(2026, 10, 14, 0), new Date(2026, 10, 13, 23, 59))).toBe(1);
  });

  it('ist negativ für vergangene Termine', () => {
    expect(daysUntil(new Date(2026, 10, 12), FRIDAY)).toBe(-1);
  });

  it('zählt über die Zeitumstellung hinweg ganze Tage', () => {
    // 29.03.2026 ist Beginn der Sommerzeit
    expect(daysUntil(new Date(2026, 2, 30), new Date(2026, 2, 28))).toBe(2);
  });
});

describe('formatCountdown', () => {
  it.each([
    [-3, 'Wettkampf vorbei'],
    [0, 'Heute ist Wettkampftag'],
    [1, 'Morgen ist Wettkampftag'],
    [2, 'Noch 2 Tage'],
    [6, 'Noch 6 Tage'],
    [7, 'Noch 1 Woche'],
    [8, 'Noch 1 Woche und 1 Tag'],
    [14, 'Noch 2 Wochen'],
    [87, 'Noch 12 Wochen und 3 Tage'],
  ])('%i Tage → „%s“', (days, expected) => {
    expect(formatCountdown(days)).toBe(expected);
  });
});

describe('formatLongDate', () => {
  it('schreibt Wochentag, Tag und Monat auf Deutsch', () => {
    expect(formatLongDate(FRIDAY)).toBe('Freitag, 13. November');
    expect(formatLongDate(new Date(2027, 2, 1))).toBe('Montag, 1. März');
  });
});

describe('greetingFor', () => {
  const at = (hour: number, minute = 0) => new Date(2026, 10, 13, hour, minute);

  it.each([
    [at(4, 59), 'Guten Abend'],
    [at(5), 'Guten Morgen'],
    [at(10, 59), 'Guten Morgen'],
    [at(11), 'Guten Tag'],
    [at(17, 59), 'Guten Tag'],
    [at(18), 'Guten Abend'],
    [at(0), 'Guten Abend'],
  ])('%s → %s', (date, expected) => {
    expect(greetingFor(date)).toBe(expected);
  });
});

describe('isTrainingDay', () => {
  it('erkennt Trainingstage nach ISO-Codierung', () => {
    expect(isTrainingDay(MONDAY, [1, 3, 5])).toBe(true);
    expect(isTrainingDay(SUNDAY, [1, 3, 5])).toBe(false);
    expect(isTrainingDay(SUNDAY, [7])).toBe(true);
  });

  it('ist bei leeren Trainingstagen immer false', () => {
    expect(isTrainingDay(MONDAY, [])).toBe(false);
  });
});

describe('buildWeek', () => {
  it('beginnt am Montag und endet am Sonntag', () => {
    const week = buildWeek(FRIDAY, [1, 3, 5]);
    expect(week.map((d) => d.label)).toEqual(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);
    expect(week.map((d) => d.dayOfMonth)).toEqual([9, 10, 11, 12, 13, 14, 15]);
  });

  it('markiert heute und die Trainingstage', () => {
    const week = buildWeek(FRIDAY, [1, 3, 5]);
    expect(week.filter((d) => d.isToday).map((d) => d.isoDay)).toEqual([5]);
    expect(week.filter((d) => d.isTrainingDay).map((d) => d.isoDay)).toEqual([1, 3, 5]);
  });

  it('zeigt am Sonntag noch die alte Woche', () => {
    const week = buildWeek(SUNDAY, []);
    expect(week[0].dayOfMonth).toBe(9);
    expect(week[6]).toMatchObject({ dayOfMonth: 15, isToday: true });
  });

  it('springt am Montag in die neue Woche', () => {
    const week = buildWeek(MONDAY, []);
    expect(week[0]).toMatchObject({ dayOfMonth: 16, isToday: true });
    expect(week[6].dayOfMonth).toBe(22);
  });

  it('rechnet über Monats- und Jahreswechsel', () => {
    const week = buildWeek(new Date(2026, 11, 31), []); // Do, 31.12.2026
    expect(week.map((d) => d.dayOfMonth)).toEqual([28, 29, 30, 31, 1, 2, 3]);
  });

  it('hat ohne Trainingstage keine Hervorhebung', () => {
    expect(buildWeek(FRIDAY, []).some((d) => d.isTrainingDay)).toBe(false);
  });
});

describe('assessGoal', () => {
  const goal = {
    distance_m: 21097,
    target_time_s: 2 * 3600 + 10 * 60,
    race_date: '2027-03-14',
    created_at: '2026-11-13T09:00:00.000Z',
  };
  const baseline = { recent_5k_time_s: 28 * 60, running_since_months: 24 };

  it('nutzt die Wochen ab Zielerstellung', () => {
    const expected = assessFeasibility({
      distanceM: goal.distance_m,
      targetTimeS: goal.target_time_s,
      weeksUntilRace: 17, // 13.11.2026 bis 14.03.2027
      recent5kTimeS: baseline.recent_5k_time_s,
      runningSinceMonths: baseline.running_since_months,
    });
    expect(assessGoal(goal, baseline)).toEqual(expected);
  });

  it('liefert die Riegel-Prognose aus der 5-km-Zeit', () => {
    expect(assessGoal(goal, baseline).predictedTimeS).toBeGreaterThan(2 * 3600);
  });
});

describe('weekBounds', () => {
  it('reicht von Montag 0:00 bis zum nächsten Montag 0:00', () => {
    expect(weekBounds(FRIDAY)).toEqual({ start: new Date(2026, 10, 9), end: new Date(2026, 10, 16) });
    expect(weekBounds(SUNDAY).start).toEqual(new Date(2026, 10, 9));
    expect(weekBounds(MONDAY).start).toEqual(new Date(2026, 10, 16));
  });
});

describe('runDaysInWeek', () => {
  // Zeitstempel wie aus der Datenbank (UTC), erzeugt aus lokaler Zeit
  const at = (...args: [number, number, number, number, number]) => new Date(...args).toISOString();

  it('ordnet Läufe dem lokalen Wochentag zu', () => {
    const runs = [at(2026, 10, 9, 7, 0), at(2026, 10, 11, 18, 30), at(2026, 10, 11, 6, 0)];
    expect(runDaysInWeek(FRIDAY, runs)).toEqual([1, 3]);
  });

  it('zählt einen Lauf kurz vor Mitternacht zum selben Tag', () => {
    expect(runDaysInWeek(FRIDAY, [at(2026, 10, 12, 23, 59)])).toEqual([4]);
  });

  it('ignoriert Läufe aus anderen Wochen', () => {
    const runs = [at(2026, 10, 8, 23, 59), at(2026, 10, 16, 0, 0)];
    expect(runDaysInWeek(FRIDAY, runs)).toEqual([]);
  });

  it('zählt Sonntag 23:59 noch zur alten Woche', () => {
    expect(runDaysInWeek(SUNDAY, [at(2026, 10, 15, 23, 59)])).toEqual([7]);
    expect(runDaysInWeek(MONDAY, [at(2026, 10, 15, 23, 59)])).toEqual([]);
  });
});

describe('buildWeek mit Läufen', () => {
  it('markiert Tage mit Lauf als erledigt', () => {
    const week = buildWeek(FRIDAY, [1, 3, 5], [1, 2]);
    expect(week.filter((d) => d.hasRun).map((d) => d.isoDay)).toEqual([1, 2]);
  });
});

describe('runsOnDay und sumRuns', () => {
  const run = (date: Date, distance_m: number, duration_s: number) => ({
    started_at: date.toISOString(),
    distance_m,
    duration_s,
  });

  it('findet nur Läufe von heute, auch kurz nach Mitternacht', () => {
    const runs = [
      run(new Date(2026, 10, 12, 23, 59), 5000, 1500),
      run(new Date(2026, 10, 13, 0, 1), 3000, 900),
      run(new Date(2026, 10, 13, 18, 0), 8500, 3130),
    ];
    expect(runsOnDay(FRIDAY, runs).map((r) => r.distance_m)).toEqual([3000, 8500]);
  });

  it('summiert Distanz und Dauer', () => {
    expect(sumRuns([run(FRIDAY, 3000, 900), run(FRIDAY, 8500, 3130)])).toEqual({ distanceM: 11500, durationS: 4030 });
    expect(sumRuns([])).toBeNull();
  });
});
