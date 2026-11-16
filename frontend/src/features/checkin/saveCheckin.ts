import { describeSaveError } from '@/utils/activities';
import type { SaveCheckinArgs } from '@/utils/checkin';
import { supabase } from '@/utils/supabase';

export type SaveCheckinResult = { ok: true } | { ok: false; message: string };

/** Duplikat-Fehler: Für diesen Lauf gibt es schon einen Check-in */
const UNIQUE_VIOLATION = '23505';

/**
 * Speichert Check-in und Beschwerden in einer Transaktion (save_checkin).
 * Gibt statt einer Exception eine verständliche Meldung zurück.
 */
export async function saveCheckin(args: SaveCheckinArgs): Promise<SaveCheckinResult> {
  try {
    const { error } = await supabase.rpc('save_checkin', args);
    if (!error) return { ok: true };
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, message: 'Für diesen Lauf hast du schon einen Check-in gespeichert.' };
    }
    return { ok: false, message: describeSaveError(error) };
  } catch (cause) {
    // Netzwerkfehler können je nach Plattform auch als Exception kommen
    const message = cause instanceof Error ? cause.message : '';
    return { ok: false, message: describeSaveError({ message }) };
  }
}
