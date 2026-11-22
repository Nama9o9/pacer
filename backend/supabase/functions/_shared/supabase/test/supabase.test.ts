import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import type { SupabaseClient } from '@supabase/supabase-js';

import { HttpError } from '../../http/errors.ts';
import { createAiWriter } from '../aiWriter.ts';
import { authenticate, readBearerToken } from '../auth.ts';
import { readSupabaseEnv } from '../env.ts';

const USER_ID = '00000000-0000-0000-0000-00000000000a';

// ---------------------------------------------------------------------
// readSupabaseEnv
// ---------------------------------------------------------------------

Deno.test('readSupabaseEnv: neue Keys aus den JSON-Variablen', () => {
  const env = readSupabaseEnv((name) => ({
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_PUBLISHABLE_KEYS: '{"default":"sb_publishable_x"}',
    SUPABASE_SECRET_KEYS: '{"default":"sb_secret_y"}',
    SUPABASE_ANON_KEY: 'legacy-anon',
  } as Record<string, string>)[name]);

  assertEquals(env, { url: 'http://localhost:54321', publishableKey: 'sb_publishable_x', secretKey: 'sb_secret_y' });
});

Deno.test('readSupabaseEnv: Fallback auf alte Variablen', () => {
  const env = readSupabaseEnv((name) => ({
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_ANON_KEY: 'legacy-anon',
    SUPABASE_SERVICE_ROLE_KEY: 'legacy-service',
  } as Record<string, string>)[name]);

  assertEquals(env.publishableKey, 'legacy-anon');
  assertEquals(env.secretKey, 'legacy-service');
});

Deno.test('readSupabaseEnv: fehlende Variablen werden genannt, Werte nicht', () => {
  assertThrows(
    () => readSupabaseEnv((name) => (name === 'SUPABASE_URL' ? 'http://x' : undefined)),
    Error,
    'SUPABASE_SECRET_KEYS/SUPABASE_SERVICE_ROLE_KEY',
  );
});

// ---------------------------------------------------------------------
// authenticate
// ---------------------------------------------------------------------

/** Fake-Client, dessen getClaims das angegebene Ergebnis liefert */
function fakeClaimsClient(result: { data: { claims: Record<string, unknown> } | null; error: unknown }) {
  const calls: string[] = [];
  const client = {
    auth: {
      getClaims: (jwt: string) => {
        calls.push(jwt);
        return Promise.resolve(result);
      },
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

function requestWithAuth(header?: string): Request {
  return new Request('http://x', { method: 'POST', headers: header ? { Authorization: header } : {} });
}

Deno.test('readBearerToken: liest das Token, sonst null', () => {
  assertEquals(readBearerToken(requestWithAuth('Bearer abc.def.ghi')), 'abc.def.ghi');
  assertEquals(readBearerToken(requestWithAuth('Basic xyz')), null);
  assertEquals(readBearerToken(requestWithAuth()), null);
});

Deno.test('authenticate: gültiges User-JWT liefert userId aus der sub-Claim', async () => {
  const { client, calls } = fakeClaimsClient({ data: { claims: { sub: USER_ID, role: 'authenticated' } }, error: null });

  const user = await authenticate(requestWithAuth('Bearer user-jwt'), () => client);

  assertEquals(user.userId, USER_ID);
  assertEquals(user.supabase, client);
  assertEquals(calls, ['user-jwt']);
});

Deno.test('authenticate: ohne Authorization-Header → AUTH_REQUIRED', async () => {
  const { client } = fakeClaimsClient({ data: null, error: null });

  const error = await assertRejects(() => authenticate(requestWithAuth(), () => client), HttpError);

  assertEquals(error.code, 'AUTH_REQUIRED');
});

Deno.test('authenticate: ungültiges JWT → AUTH_REQUIRED', async () => {
  const { client } = fakeClaimsClient({ data: null, error: new Error('invalid JWT') });

  const error = await assertRejects(() => authenticate(requestWithAuth('Bearer kaputt'), () => client), HttpError);

  assertEquals(error.code, 'AUTH_REQUIRED');
});

Deno.test('authenticate: Anon-Key (Rolle anon, ohne sub) ist kein Login → AUTH_REQUIRED', async () => {
  const { client } = fakeClaimsClient({ data: { claims: { role: 'anon' } }, error: null });

  const error = await assertRejects(() => authenticate(requestWithAuth('Bearer anon-key'), () => client), HttpError);

  assertEquals(error.code, 'AUTH_REQUIRED');
});

// ---------------------------------------------------------------------
// createAiWriter
// ---------------------------------------------------------------------

/** Fake-Admin-Client, der Inserts aufzeichnet */
function fakeAdminClient(error: { code: string; message: string } | null = null) {
  const inserts: { table: string; rows: Record<string, unknown>[] }[] = [];
  const client = {
    from: (table: string) => ({
      insert: (rows: Record<string, unknown>[]) => {
        inserts.push({ table, rows });
        return { select: () => Promise.resolve({ data: error ? null : rows, error }) };
      },
    }),
  } as unknown as SupabaseClient;
  return { client, inserts };
}

Deno.test('createAiWriter: setzt user_id aus dem Token und überschreibt Werte aus den Zeilen', async () => {
  const { client, inserts } = fakeAdminClient();
  const writer = createAiWriter(client, USER_ID);

  // Ein untergeschobener Wert darf nicht durchkommen (Typen verbieten ihn, zur Laufzeit wird er überschrieben)
  const sneaky = { role: 'assistant', content: 'Hallo', user_id: 'fremde-id' } as never;
  await writer.insert('coach_messages', [sneaky, { role: 'user', content: 'Hi' }]);

  assertEquals(inserts[0].table, 'coach_messages');
  assertEquals(inserts[0].rows.map((row) => row.user_id), [USER_ID, USER_ID]);
});

Deno.test('createAiWriter: andere Tabellen sind gesperrt', async () => {
  const { client, inserts } = fakeAdminClient();
  const writer = createAiWriter(client, USER_ID);

  await assertRejects(() => writer.insert('activities' as never, [{ distance_m: 1 }]), Error, 'nicht freigegeben');
  assertEquals(inserts.length, 0);
});

Deno.test('createAiWriter: ohne userId nicht erstellbar', () => {
  const { client } = fakeAdminClient();
  assertThrows(() => createAiWriter(client, ''), Error, 'userId');
});

Deno.test('createAiWriter: Datenbankfehler wird mit Code gemeldet', async () => {
  const { client } = fakeAdminClient({ code: '23514', message: 'check constraint violated' });
  const writer = createAiWriter(client, USER_ID);

  await assertRejects(() => writer.insert('coach_messages', [{ role: 'user', content: 'x' }]), Error, '23514');
});
