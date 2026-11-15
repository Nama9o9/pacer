import { describeSaveError, toManualActivityInsert, type ActivityInput } from '@/utils/activities';
import { supabase } from '@/utils/supabase';

export type SaveResult = { ok: true } | { ok: false; message: string };

/**
 * Speichert einen manuell eingetragenen Lauf in activities.
 * Gibt statt einer Exception eine verständliche Meldung zurück.
 */
export async function saveManualActivity(userId: string, input: ActivityInput): Promise<SaveResult> {
  try {
    const { error } = await supabase.from('activities').insert(toManualActivityInsert(userId, input));
    return error ? { ok: false, message: describeSaveError(error) } : { ok: true };
  } catch (cause) {
    // Netzwerkfehler können je nach Plattform auch als Exception kommen
    const message = cause instanceof Error ? cause.message : '';
    return { ok: false, message: describeSaveError({ message }) };
  }
}
