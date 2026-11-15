import {
  createEmptyRunForm,
  defaultStartTime,
  filledFields,
  parseDistanceM,
  parseOptionalInteger,
  parseRunForm,
  type RunForm,
} from '@/utils/runEntry';
import { formatGermanDate } from '@/utils/validation';

// Fester „Jetzt“-Zeitpunkt: Freitag, 13.11.2026, 18:47
const NOW = new Date(2026, 10, 13, 18, 47);

/** Gültiger Lauf, einzelne Felder werden pro Test überschrieben */
function form(overrides: Partial<RunForm> = {}): RunForm {
  return {
    date: '13.11.2026',
    startHour: '07',
    startMinute: '30',
    distanceKm: '8,5',
    durationHours: '0',
    durationMinutes: '52',
    durationSeconds: '10',
    avgHeartRate: '',
    elevationGainM: '',
    ...overrides,
  };
}

describe('parseDistanceM', () => {
  it.each([
    ['8,5', 8500],
    ['8.5', 8500],
    ['10', 10000],
    [' 5,25 ', 5250],
    ['', 0],
    ['abc', 0],
    ['8,5km', 0],
    ['-3', 0],
  ])('„%s“ → %i m', (text, expected) => {
    expect(parseDistanceM(text)).toBe(expected);
  });
});

describe('parseOptionalInteger', () => {
  it('ergibt null für leere Felder', () => {
    expect(parseOptionalInteger('')).toBeNull();
    expect(parseOptionalInteger('   ')).toBeNull();
  });

  it('liest Ziffern und lehnt alles andere ab', () => {
    expect(parseOptionalInteger('145')).toBe(145);
    expect(parseOptionalInteger('14a')).toBeNaN();
    expect(parseOptionalInteger('-5')).toBeNaN();
  });
});

describe('Standardwerte', () => {
  it('nimmt heute als Datum', () => {
    expect(formatGermanDate(new Date(2027, 0, 5))).toBe('05.01.2027');
    expect(createEmptyRunForm(NOW).date).toBe('13.11.2026');
  });

  it('rundet die Startzeit auf 5 Minuten ab, nie in die Zukunft', () => {
    expect(defaultStartTime(NOW)).toEqual({ hour: '18', minute: '45' });
    expect(defaultStartTime(new Date(2026, 10, 13, 9, 4))).toEqual({ hour: '09', minute: '00' });
  });

  it('erzeugt ein leeres Formular, das Distanz und Dauer verlangt', () => {
    const { activity, errors } = parseRunForm(createEmptyRunForm(NOW), NOW);
    expect(activity).toBeNull();
    expect(Object.keys(errors).sort()).toEqual(['distance', 'duration']);
  });
});

describe('parseRunForm: gültige Läufe', () => {
  it('rechnet in distance_m und duration_s um', () => {
    const { activity, errors } = parseRunForm(form(), NOW);
    expect(errors).toEqual({});
    expect(activity).toEqual({
      startedAt: new Date(2026, 10, 13, 7, 30),
      distanceM: 8500,
      durationS: 52 * 60 + 10,
      avgHeartRate: null,
      elevationGainM: null,
    });
  });

  it('akzeptiert Punkt statt Komma', () => {
    expect(parseRunForm(form({ distanceKm: '8.5' }), NOW).activity?.distanceM).toBe(8500);
  });

  it('übernimmt optionale Werte, wenn sie ausgefüllt sind', () => {
    const { activity } = parseRunForm(form({ avgHeartRate: '152', elevationGainM: '0' }), NOW);
    expect(activity?.avgHeartRate).toBe(152);
    expect(activity?.elevationGainM).toBe(0);
  });

  it('akzeptiert einen Lauf von gestern 23:59', () => {
    const { activity, errors } = parseRunForm(form({ date: '12.11.2026', startHour: '23', startMinute: '59' }), NOW);
    expect(errors).toEqual({});
    expect(activity?.startedAt).toEqual(new Date(2026, 10, 12, 23, 59));
  });

  it('akzeptiert einen Lauf, der genau jetzt beginnt', () => {
    expect(parseRunForm(form({ startHour: '18', startMinute: '47' }), NOW).errors).toEqual({});
  });
});

describe('parseRunForm: Datum und Startzeit', () => {
  it('lehnt Läufe in der Zukunft ab', () => {
    expect(parseRunForm(form({ startHour: '18', startMinute: '48' }), NOW).errors.date).toMatch(/Zukunft/);
    expect(parseRunForm(form({ date: '14.11.2026' }), NOW).errors.date).toMatch(/Zukunft/);
  });

  it('lehnt ungültige Daten ab', () => {
    expect(parseRunForm(form({ date: '31.02.2026' }), NOW).errors.date).toBeDefined();
    expect(parseRunForm(form({ date: '' }), NOW).errors.date).toBeDefined();
  });

  it('lehnt ungültige Uhrzeiten ab', () => {
    expect(parseRunForm(form({ startHour: '24' }), NOW).errors.startTime).toBeDefined();
    expect(parseRunForm(form({ startMinute: '60' }), NOW).errors.startTime).toBeDefined();
    expect(parseRunForm(form({ startHour: '' }), NOW).errors.startTime).toBeDefined();
  });
});

describe('parseRunForm: Distanz und Dauer', () => {
  it('erlaubt genau 100 km, aber nicht mehr', () => {
    const long = { durationHours: '10', durationMinutes: '0', durationSeconds: '0' };
    expect(parseRunForm(form({ ...long, distanceKm: '100' }), NOW).errors.distance).toBeUndefined();
    expect(parseRunForm(form({ ...long, distanceKm: '100,01' }), NOW).errors.distance).toBeDefined();
  });

  it('verlangt eine Distanz über 0', () => {
    expect(parseRunForm(form({ distanceKm: '0' }), NOW).errors.distance).toBeDefined();
  });

  it('erlaubt genau 24 Stunden, aber nicht mehr', () => {
    const ultra = { distanceKm: '100' };
    expect(parseRunForm(form({ ...ultra, durationHours: '24', durationMinutes: '0', durationSeconds: '0' }), NOW).errors.duration).toBeUndefined();
    expect(parseRunForm(form({ ...ultra, durationHours: '24', durationMinutes: '0', durationSeconds: '1' }), NOW).errors.duration).toBeDefined();
  });

  it('lehnt Minuten oder Sekunden über 59 ab', () => {
    expect(parseRunForm(form({ durationMinutes: '75' }), NOW).errors.duration).toMatch(/59/);
    expect(parseRunForm(form({ durationSeconds: '60' }), NOW).errors.duration).toMatch(/59/);
  });

  it('wertet leere Teile der Dauer als 0', () => {
    const { activity } = parseRunForm(form({ durationHours: '', durationMinutes: '30', durationSeconds: '' }), NOW);
    expect(activity?.durationS).toBe(1800);
  });
});

describe('parseRunForm: Pace-Plausibilität', () => {
  // 10 km, damit die Pace in Sekunden genau das Zehntel der Dauer ist
  const tenK = (minutes: string, seconds: string) =>
    form({ distanceKm: '10', durationHours: '', durationMinutes: minutes, durationSeconds: seconds });

  it('erlaubt genau 2:30 min/km, aber nichts Schnelleres', () => {
    expect(parseRunForm(tenK('25', '00'), NOW).errors.duration).toBeUndefined();
    expect(parseRunForm(tenK('24', '59'), NOW).errors.duration).toMatch(/schneller/);
  });

  it('erlaubt genau 20:00 min/km, aber nichts Langsameres', () => {
    const at = (h: string, m: string, s: string) =>
      form({ distanceKm: '10', durationHours: h, durationMinutes: m, durationSeconds: s });
    expect(parseRunForm(at('3', '20', '00'), NOW).errors.duration).toBeUndefined();
    expect(parseRunForm(at('3', '20', '01'), NOW).errors.duration).toMatch(/langsamer/);
  });
});

describe('parseRunForm: Live-Pace', () => {
  it('liefert die Pace, sobald Distanz und Dauer gültig sind', () => {
    expect(parseRunForm(form({ distanceKm: '10', durationHours: '', durationMinutes: '50', durationSeconds: '' }), NOW).paceSPerKm).toBe(300);
  });

  it('liefert die Pace auch bei unplausiblem Wert, damit der Nutzer den Tippfehler sieht', () => {
    expect(parseRunForm(form({ distanceKm: '100', durationHours: '', durationMinutes: '30', durationSeconds: '' }), NOW).paceSPerKm).toBe(18);
  });

  it('ist null, solange Distanz oder Dauer fehlen', () => {
    expect(parseRunForm(form({ distanceKm: '' }), NOW).paceSPerKm).toBeNull();
  });
});

describe('parseRunForm: optionale Felder', () => {
  it('prüft den Puls an den Grenzen 30 und 250', () => {
    expect(parseRunForm(form({ avgHeartRate: '30' }), NOW).errors.avgHeartRate).toBeUndefined();
    expect(parseRunForm(form({ avgHeartRate: '250' }), NOW).errors.avgHeartRate).toBeUndefined();
    expect(parseRunForm(form({ avgHeartRate: '29' }), NOW).errors.avgHeartRate).toBeDefined();
    expect(parseRunForm(form({ avgHeartRate: '251' }), NOW).errors.avgHeartRate).toBeDefined();
    expect(parseRunForm(form({ avgHeartRate: '1x' }), NOW).errors.avgHeartRate).toBeDefined();
  });

  it('lehnt negative oder ungültige Höhenmeter ab', () => {
    expect(parseRunForm(form({ elevationGainM: '-10' }), NOW).errors.elevationGain).toBeDefined();
    expect(parseRunForm(form({ elevationGainM: '12,5' }), NOW).errors.elevationGain).toBeDefined();
  });
});

describe('filledFields', () => {
  it('zeigt, welche Felder schon Text enthalten', () => {
    const fields = filledFields(form({ distanceKm: '', durationHours: '', durationMinutes: '', durationSeconds: '5' }));
    expect(fields.distance).toBe(false);
    expect(fields.duration).toBe(true);
    expect(fields.avgHeartRate).toBe(false);
  });
});
