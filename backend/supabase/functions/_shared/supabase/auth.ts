import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { HttpError } from '../http/errors.ts';
import type { SupabaseEnv } from './env.ts';

export type AuthenticatedUser = {
  /** Aus dem geprüften JWT (claim "sub"), nie aus dem Request-Body */
  userId: string;
  /** Client mit dem JWT des Users: Lesen läuft durch RLS wie in der App */
  supabase: SupabaseClient;
};

/** Liest das Token aus "Authorization: Bearer <jwt>", sonst null */
export function readBearerToken(req: Request): string | null {
  const header = req.headers.get('Authorization') ?? '';
  const match = header.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}

/** Supabase-Client, der jede Anfrage mit dem JWT des Users stellt (RLS greift) */
export function createUserClient(env: SupabaseEnv, token: string): SupabaseClient {
  return createClient(env.url, env.publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Prüft das JWT und ermittelt den User.
 *
 * Zusätzlich zur Plattform-Prüfung (verify_jwt) prüft getClaims die Signatur
 * selbst (bei asymmetrischen Keys per JWKS, sonst über den Auth-Server).
 * Nur echte Logins zählen: Der Publishable/Anon-Key ist kein User und hat
 * keine sub-Claim bzw. die Rolle "anon".
 *
 * @param makeClient in Tests ersetzbar
 */
export async function authenticate(
  req: Request,
  makeClient: (token: string) => SupabaseClient,
): Promise<AuthenticatedUser> {
  const token = readBearerToken(req);
  if (!token) {
    throw new HttpError('AUTH_REQUIRED', 'Authorization-Header fehlt.');
  }

  const supabase = makeClient(token);
  const { data, error } = await supabase.auth.getClaims(token);
  const claims = data?.claims;

  if (error || !claims) {
    throw new HttpError('AUTH_REQUIRED', 'JWT ungültig oder abgelaufen.');
  }
  if (claims.role !== 'authenticated' || typeof claims.sub !== 'string' || claims.sub === '') {
    throw new HttpError('AUTH_REQUIRED', 'Token gehört zu keinem angemeldeten User.');
  }

  return { userId: claims.sub, supabase };
}
