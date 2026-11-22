import { assertEquals } from '@std/assert';

import { AiError, type GeminiOptions, type GeminiResult } from '../_shared/ai/mod.ts';
import { HttpError } from '../_shared/http/mod.ts';
import { createPingHandler, type PingDeps } from './handler.ts';

const RESULT: GeminiResult = {
  text: '{"ok":true,"message":"Hallo!"}',
  data: { ok: true, message: 'Hallo!' },
  functionCalls: [],
  model: 'gemini-test-001',
  usage: { promptTokens: 10, outputTokens: 5, thoughtsTokens: 0, totalTokens: 15 },
  durationMs: 420,
  attempts: 1,
};

function createDeps(overrides: Partial<PingDeps> = {}) {
  const geminiCalls: GeminiOptions[] = [];
  const deps: PingDeps = {
    authenticate: () => Promise.resolve({ userId: 'user-1' }),
    callGemini: (options) => {
      geminiCalls.push(options);
      return Promise.resolve(RESULT);
    },
    ...overrides,
  };
  return { deps, geminiCalls };
}

const post = () => new Request('http://localhost/ai-ping', { method: 'POST', headers: { Authorization: 'Bearer x' } });

Deno.test('ai-ping: Erfolg liefert Ergebnis, Modell, Dauer und Tokens', async () => {
  const { deps, geminiCalls } = createDeps();

  const response = await createPingHandler(deps)(post());

  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    result: { ok: true, message: 'Hallo!' },
    model: 'gemini-test-001',
    durationMs: 420,
    attempts: 1,
    usage: RESULT.usage,
  });
  assertEquals(geminiCalls.length, 1);
  assertEquals(geminiCalls[0].label, 'ai-ping');
});

Deno.test('ai-ping: ohne Login → 401 AUTH_REQUIRED, Gemini wird nicht aufgerufen', async () => {
  const { deps, geminiCalls } = createDeps({
    authenticate: () => Promise.reject(new HttpError('AUTH_REQUIRED')),
  });

  const response = await createPingHandler(deps)(post());

  assertEquals(response.status, 401);
  assertEquals((await response.json()).error.code, 'AUTH_REQUIRED');
  assertEquals(geminiCalls.length, 0);
});

Deno.test('ai-ping: KI-Fehler wird im einheitlichen Format zurückgegeben', async () => {
  const { deps } = createDeps({
    callGemini: () => Promise.reject(new AiError('AI_CONFIG', 'GEMINI_API_KEY ist nicht gesetzt.')),
  });

  const response = await createPingHandler(deps)(post());
  const body = await response.json();

  assertEquals(response.status, 500);
  assertEquals(body.error.code, 'AI_CONFIG');
  assertEquals(body.error.message.includes('GEMINI_API_KEY'), false);
});

Deno.test('ai-ping: GET → 405, OPTIONS → CORS-Preflight', async () => {
  const { deps } = createDeps();
  const handler = createPingHandler(deps);

  const getResponse = await handler(new Request('http://localhost/ai-ping'));
  assertEquals(getResponse.status, 405);
  await getResponse.body?.cancel();

  const optionsResponse = await handler(new Request('http://localhost/ai-ping', { method: 'OPTIONS' }));
  assertEquals(optionsResponse.status, 200);
  assertEquals(optionsResponse.headers.get('Access-Control-Allow-Origin'), '*');
  await optionsResponse.body?.cancel();
});
