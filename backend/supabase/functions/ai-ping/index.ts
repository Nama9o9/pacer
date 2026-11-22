// Einstiegspunkt der Edge Function ai-ping; die Logik steht in handler.ts (testbar ohne Server)
import { callGemini } from '../_shared/ai/mod.ts';
import { authenticate, createUserClient, readSupabaseEnv } from '../_shared/supabase/mod.ts';
import { createPingHandler } from './handler.ts';

const handler = createPingHandler({
  authenticate: (req) => {
    const env = readSupabaseEnv((name) => Deno.env.get(name));
    return authenticate(req, (token) => createUserClient(env, token));
  },
  callGemini: (options) => callGemini(options),
});

Deno.serve(handler);
