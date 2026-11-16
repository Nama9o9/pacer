/**
 * Check-in nach dem Lauf (FA#0108): Formular, Prüfung und Umwandlung
 * für die Datenbankfunktion save_checkin. Nur Erfassung, keine Bewertung.
 * Das Speichern selbst liegt in features/checkin/saveCheckin.ts.
 */

import type { Database } from '@/types/database.types';
import { validatePain, type PainEntry, type ValidationErrors } from '@/utils/validation';

export type CheckinForm = {
  /** Empfundene Anstrengung nach Borg CR-10, 0 bis 10 */
  rpe: number | null;
  /** 1 bis 5 */
  mood: number | null;
  /** 1 bis 5 */
  motivation: number | null;
  hasPain: boolean;
  pains: PainEntry[];
  note: string;
};

export type SaveCheckinArgs = Database['public']['Functions']['save_checkin']['Args'];

export const NOTE_MAX_LENGTH = 500;

/** Beschreibung der RPE-Stufen (Borg CR-10), angezeigt unter der Auswahl */
export const RPE_LABELS: Record<number, string> = {
  0: 'Ruhe',
  1: 'Sehr leicht',
  2: 'Leicht',
  3: 'Moderat',
  4: 'Etwas anstrengend',
  5: 'Anstrengend',
  6: 'Anstrengend',
  7: 'Sehr anstrengend',
  8: 'Sehr anstrengend',
  9: 'Extrem anstrengend',
  10: 'Maximal',
};

export const RPE_VALUES = Array.from({ length: 11 }, (_, i) => i);
export const FIVE_POINT_VALUES = [1, 2, 3, 4, 5];

export function createEmptyCheckinForm(): CheckinForm {
  return { rpe: null, mood: null, motivation: null, hasPain: false, pains: [], note: '' };
}

function isInRange(value: number | null, min: number, max: number): boolean {
  return value !== null && Number.isInteger(value) && value >= min && value <= max;
}

/** Fehlermeldungen je Feld, leer wenn alles passt */
export function validateCheckin(form: CheckinForm): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!isInRange(form.rpe, 0, 10)) errors.rpe = 'Bitte wähle, wie anstrengend der Lauf war.';
  if (!isInRange(form.mood, 1, 5)) errors.mood = 'Bitte wähle deine Stimmung.';
  if (!isInRange(form.motivation, 1, 5)) errors.motivation = 'Bitte wähle deine Motivation.';
  if (form.note.length > NOTE_MAX_LENGTH) {
    errors.note = `Die Notiz darf höchstens ${NOTE_MAX_LENGTH} Zeichen lang sein.`;
  }

  return { ...errors, ...validatePain({ hasPain: form.hasPain, pains: form.pains }) };
}

/**
 * Argumente für save_checkin, oder null bei ungültigem Formular.
 * Ohne Beschwerden wird eine leere Liste gesendet, eine leere Notiz als null.
 */
export function toSaveCheckinArgs(activityId: string, form: CheckinForm): SaveCheckinArgs | null {
  if (Object.keys(validateCheckin(form)).length > 0) return null;
  if (form.rpe === null || form.mood === null || form.motivation === null) return null;

  const note = form.note.trim();
  return {
    p_activity_id: activityId,
    p_rpe: form.rpe,
    p_mood: form.mood,
    p_motivation: form.motivation,
    ...(note ? { p_note: note } : {}),
    p_pains: form.hasPain ? form.pains.map(({ location, level }) => ({ location, level })) : [],
  };
}
