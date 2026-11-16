import { describeSaveError, toManualActivityInsert, type ActivityInput } from '@/utils/activities';
import { supabase } from '@/utils/supabase';

export type SaveResult = { ok: true; activityId: string } | { ok: false; message: string };

/**
 * Speichert einen manuell eingetragenen Lauf in activities.
 * Gibt die neue activity_id zurück (für den Check-in danach),
 * bei Fehlern statt einer Exception eine verständliche Meldung.
 */
export async function saveManualActivity(userId: string, input: ActivityInput): Promise<SaveResult> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert(toManualActivityInsert(userId, input))
      .select('activity_id')
      .single();
    return error ? { ok: false, message: describeSaveError(error) } : { ok: true, activityId: data.activity_id };
  } catch (cause) {
    // Netzwerkfehler können je nach Plattform auch als Exception kommen
    const message = cause instanceof Error ? cause.message : '';
    return { ok: false, message: describeSaveError({ message }) };
  }
}
