import { createEmptyCheckinForm, NOTE_MAX_LENGTH, toSaveCheckinArgs, validateCheckin, type CheckinForm } from '@/utils/checkin';

const VALID: CheckinForm = {
  rpe: 4,
  mood: 4,
  motivation: 3,
  hasPain: false,
  pains: [],
  note: '',
};

describe('validateCheckin', () => {
  it('akzeptiert ein vollständiges Formular ohne Beschwerden', () => {
    expect(validateCheckin(VALID)).toEqual({});
  });

  it('meldet fehlende Pflichtangaben', () => {
    const errors = validateCheckin(createEmptyCheckinForm());
    expect(Object.keys(errors).sort()).toEqual(['mood', 'motivation', 'rpe']);
  });

  it('akzeptiert die Grenzwerte RPE 0 und 10, Skala 1 und 5', () => {
    expect(validateCheckin({ ...VALID, rpe: 0, mood: 1, motivation: 5 })).toEqual({});
    expect(validateCheckin({ ...VALID, rpe: 10 })).toEqual({});
  });

  it('lehnt Werte außerhalb der Skalen ab', () => {
    expect(validateCheckin({ ...VALID, rpe: 11 })).toHaveProperty('rpe');
    expect(validateCheckin({ ...VALID, rpe: 2.5 })).toHaveProperty('rpe');
    expect(validateCheckin({ ...VALID, mood: 0 })).toHaveProperty('mood');
    expect(validateCheckin({ ...VALID, motivation: 6 })).toHaveProperty('motivation');
  });

  it('verlangt bei Beschwerden Stelle und Stärke', () => {
    expect(validateCheckin({ ...VALID, hasPain: true })).toHaveProperty('pains');
    expect(validateCheckin({ ...VALID, hasPain: true, pains: [{ location: 'calf', level: null }] })).toHaveProperty(
      'levels',
    );
  });

  it('begrenzt die Notiz auf 500 Zeichen', () => {
    expect(validateCheckin({ ...VALID, note: 'a'.repeat(NOTE_MAX_LENGTH) })).toEqual({});
    expect(validateCheckin({ ...VALID, note: 'a'.repeat(NOTE_MAX_LENGTH + 1) })).toHaveProperty('note');
  });
});

describe('toSaveCheckinArgs', () => {
  it('wandelt ein gültiges Formular um, ohne Notiz und Beschwerden', () => {
    expect(toSaveCheckinArgs('act-1', VALID)).toEqual({
      p_activity_id: 'act-1',
      p_rpe: 4,
      p_mood: 4,
      p_motivation: 3,
      p_pains: [],
    });
  });

  it('übernimmt Beschwerden und kürzt Leerzeichen der Notiz', () => {
    const args = toSaveCheckinArgs('act-1', {
      ...VALID,
      hasPain: true,
      pains: [{ location: 'knee_right', level: 3 }],
      note: '  Gegenwind auf den letzten 2 km  ',
    });
    expect(args?.p_pains).toEqual([{ location: 'knee_right', level: 3 }]);
    expect(args?.p_note).toBe('Gegenwind auf den letzten 2 km');
  });

  it('sendet keine Beschwerden, wenn „Nein“ gewählt ist, auch wenn noch Stellen markiert sind', () => {
    const args = toSaveCheckinArgs('act-1', { ...VALID, hasPain: false, pains: [{ location: 'hip', level: 5 }] });
    expect(args?.p_pains).toEqual([]);
  });

  it('liefert null bei ungültigem Formular', () => {
    expect(toSaveCheckinArgs('act-1', createEmptyCheckinForm())).toBeNull();
  });
});
