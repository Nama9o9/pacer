/**
 * Liest URL und Keys, die Supabase in Edge Functions automatisch setzt.
 * Neue Keys: SUPABASE_PUBLISHABLE_KEYS / SUPABASE_SECRET_KEYS als JSON
 * ({ "default": "sb_..." }). Die alten Variablen SUPABASE_ANON_KEY und
 * SUPABASE_SERVICE_ROLE_KEY dienen als Fallback, z. B. für ältere lokale CLI-Versionen.
 * Quelle: https://supabase.com/docs/guides/functions/secrets
 */
export type SupabaseEnv = {
  url: string;
  publishableKey: string;
  secretKey: string;
};

/** Liest den Eintrag "default" aus einer JSON-Variable, sonst undefined */
function readDefaultKey(json: string | undefined): string | undefined {
  if (!json) return undefined;
  try {
    const keys = JSON.parse(json) as Record<string, unknown>;
    return typeof keys.default === 'string' && keys.default !== '' ? keys.default : undefined;
  } catch {
    return undefined;
  }
}

/** Wirft einen Fehler (ohne Key-Werte), wenn URL oder Keys fehlen */
export function readSupabaseEnv(getEnv: (name: string) => string | undefined): SupabaseEnv {
  const url = getEnv('SUPABASE_URL');
  const publishableKey = readDefaultKey(getEnv('SUPABASE_PUBLISHABLE_KEYS')) ?? getEnv('SUPABASE_ANON_KEY');
  const secretKey = readDefaultKey(getEnv('SUPABASE_SECRET_KEYS')) ?? getEnv('SUPABASE_SERVICE_ROLE_KEY');

  const missing = [
    !url && 'SUPABASE_URL',
    !publishableKey && 'SUPABASE_PUBLISHABLE_KEYS/SUPABASE_ANON_KEY',
    !secretKey && 'SUPABASE_SECRET_KEYS/SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(`Supabase-Umgebung unvollständig: ${missing.join(', ')} fehlt.`);
  }

  return { url: url!, publishableKey: publishableKey!, secretKey: secretKey! };
}
