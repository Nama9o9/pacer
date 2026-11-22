// Einstiegspunkt für Edge Functions: Functions importieren dieses Modul statt der Einzeldateien.
// Hinweis: Hier kein Beispiel-Import mit from und Anführungszeichen hinschreiben. Die Supabase CLI
// liest Importe per Textsuche und würde ihn sonst auch im Kommentar auflösen.
export { readSupabaseEnv } from './env.ts';
export type { SupabaseEnv } from './env.ts';
export { authenticate, createUserClient, readBearerToken } from './auth.ts';
export type { AuthenticatedUser } from './auth.ts';
export { AI_WRITABLE_TABLES, createAdminClient, createAiWriter } from './aiWriter.ts';
export type { AiWritableTable, AiWriter } from './aiWriter.ts';
