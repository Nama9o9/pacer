// Einstiegspunkt für Edge Functions: Functions importieren dieses Modul statt der Einzeldateien.
// Hinweis: Hier kein Beispiel-Import mit from und Anführungszeichen hinschreiben. Die Supabase CLI
// liest Importe per Textsuche und würde ihn sonst auch im Kommentar auflösen.
export { callGemini, defaultGeminiDeps } from './gemini.ts';
export { AiError } from './errors.ts';
export type { AiErrorCode } from './errors.ts';
export { DEFAULT_GEMINI_MODEL, DEFAULT_TIMEOUT_MS } from './config.ts';
export type * from './types.ts';
