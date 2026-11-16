/**
 * Auswahl von Beschwerden (Körperstelle + Stärke), gemeinsam genutzt
 * vom Onboarding und vom Check-in. Reine Funktionen, die Eingaben bleiben unverändert.
 */

import { PAIN_LOCATIONS, type BodyLocation, type PainEntry } from '@/utils/validation';

/** Stärken 0 bis 10 */
export const PAIN_LEVELS = Array.from({ length: 11 }, (_, i) => i);

const LOCATION_ORDER: BodyLocation[] = PAIN_LOCATIONS.map((option) => option.value);

/** Anzeigename einer Körperstelle */
export function painLocationLabel(location: BodyLocation): string {
  return PAIN_LOCATIONS.find((option) => option.value === location)?.label ?? location;
}

/** Körperstelle hinzufügen oder entfernen, Reihenfolge wie in der Auswahl */
export function togglePainLocation(pains: PainEntry[], location: BodyLocation): PainEntry[] {
  if (pains.some((pain) => pain.location === location)) {
    return pains.filter((pain) => pain.location !== location);
  }
  return [...pains, { location, level: null }].sort(
    (a, b) => LOCATION_ORDER.indexOf(a.location) - LOCATION_ORDER.indexOf(b.location),
  );
}

/** Stärke für eine Körperstelle setzen */
export function setPainLevel(pains: PainEntry[], location: BodyLocation, level: number): PainEntry[] {
  return pains.map((pain) => (pain.location === location ? { ...pain, level } : pain));
}
