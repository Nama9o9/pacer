import { painLocationLabel, setPainLevel, togglePainLocation } from '@/utils/pain';
import type { PainEntry } from '@/utils/validation';

describe('togglePainLocation', () => {
  it('fügt eine Stelle ohne Stärke hinzu und sortiert wie die Auswahl', () => {
    const pains: PainEntry[] = [{ location: 'hip', level: 3 }];
    expect(togglePainLocation(pains, 'knee_left')).toEqual([
      { location: 'knee_left', level: null },
      { location: 'hip', level: 3 },
    ]);
  });

  it('entfernt eine bereits gewählte Stelle', () => {
    const pains: PainEntry[] = [{ location: 'hip', level: 3 }];
    expect(togglePainLocation(pains, 'hip')).toEqual([]);
  });

  it('verändert die Eingabe nicht', () => {
    const pains: PainEntry[] = [{ location: 'hip', level: 3 }];
    togglePainLocation(pains, 'calf');
    expect(pains).toEqual([{ location: 'hip', level: 3 }]);
  });
});

describe('setPainLevel', () => {
  it('setzt die Stärke nur für die gewählte Stelle', () => {
    const pains: PainEntry[] = [
      { location: 'calf', level: null },
      { location: 'hip', level: 2 },
    ];
    expect(setPainLevel(pains, 'calf', 5)).toEqual([
      { location: 'calf', level: 5 },
      { location: 'hip', level: 2 },
    ]);
    expect(pains[0].level).toBeNull();
  });
});

describe('painLocationLabel', () => {
  it('liefert den deutschen Namen', () => {
    expect(painLocationLabel('achilles')).toBe('Achillessehne');
  });
});
