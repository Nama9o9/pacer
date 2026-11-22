/**
 * Schreibzugriff für KI-Ausgaben (Pläne, Phasen, Einheiten, Chat-Nachrichten).
 *
 * WARUM HIER RLS UMGANGEN WIRD
 * ----------------------------
 * Die Tabellen training_plans, plan_phases, plan_sessions und coach_messages
 * sind für die App bewusst nur lesbar (siehe Migrationen vom 22.11.2026).
 * Sonst könnte ein Client selbst einen „KI-Plan“ oder eine „Coach-Antwort“
 * anlegen, ohne dass die Edge Function die Ausgabe gegen Schema und
 * Sicherheitsgrenzen geprüft hat. Solche Einträge landen später als Kontext
 * wieder bei der KI.
 *
 * Deshalb schreibt nur die Edge Function, und zwar mit dem Secret Key, der
 * RLS umgeht. Damit fällt der Schutz „jeder sieht nur seine Zeilen“ hier weg.
 * Diese Datei ersetzt ihn durch drei feste Regeln:
 *
 *   1. user_id kommt immer aus dem geprüften JWT (authenticate), nie aus dem
 *      Request-Body. Der Writer setzt sie selbst und überschreibt jeden Wert,
 *      der in den Zeilen steht.
 *   2. Nur die Tabellen für KI-Ausgaben sind erlaubt (AI_WRITABLE_TABLES).
 *   3. Nur Einfügen. Lesen läuft über den User-Client (RLS greift),
 *      Statuswechsel des Users über die RPCs activate_training_plan und
 *      set_session_status.
 *
 * Den Admin-Client nur über createAiWriter benutzen und nirgends sonst
 * weitergeben.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { SupabaseEnv } from './env.ts';

/** Tabellen, in die KI-Ausgaben geschrieben werden dürfen */
export const AI_WRITABLE_TABLES = ['training_plans', 'plan_phases', 'plan_sessions', 'coach_messages'] as const;
export type AiWritableTable = (typeof AI_WRITABLE_TABLES)[number];

/** Eine Zeile ohne user_id: die setzt der Writer */
export type RowWithoutUser = Record<string, unknown> & { user_id?: never };

export type AiWriter = {
  /** Fügt Zeilen für den angemeldeten User ein und gibt die gespeicherten Zeilen zurück */
  insert(table: AiWritableTable, rows: RowWithoutUser[]): Promise<Record<string, unknown>[]>;
};

/** Client mit Secret Key (umgeht RLS). Nur für createAiWriter gedacht. */
export function createAdminClient(env: SupabaseEnv): SupabaseClient {
  return createClient(env.url, env.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Erstellt einen Writer, der ausschließlich für userId schreibt.
 * @param userId aus authenticate(), also aus dem geprüften JWT
 */
export function createAiWriter(admin: SupabaseClient, userId: string): AiWriter {
  if (!userId) {
    throw new Error('createAiWriter braucht die userId aus dem geprüften JWT.');
  }

  return {
    async insert(table, rows) {
      // Auch zur Laufzeit prüfen, falls der Tabellenname aus einer Variable kommt
      if (!(AI_WRITABLE_TABLES as readonly string[]).includes(table)) {
        throw new Error(`Tabelle ${table} ist für KI-Ausgaben nicht freigegeben.`);
      }
      if (rows.length === 0) return [];

      // user_id zuletzt setzen, damit sie jeden Wert aus den Zeilen überschreibt
      const rowsForUser = rows.map((row) => ({ ...row, user_id: userId }));
      const { data, error } = await admin.from(table).insert(rowsForUser).select();
      if (error) {
        // Nur Code und Meldung von Postgres, keine Zeileninhalte
        throw new Error(`Speichern in ${table} fehlgeschlagen (${error.code}: ${error.message}).`);
      }
      return data ?? [];
    },
  };
}
