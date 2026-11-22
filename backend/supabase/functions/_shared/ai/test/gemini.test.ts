import { assert, assertEquals, assertFalse, assertRejects } from '@std/assert';
import { z } from 'zod';

import { DEFAULT_GEMINI_MODEL, RETRY_DELAY_MS } from '../config.ts';
import { AiError } from '../errors.ts';
import { callGemini } from '../gemini.ts';
import type { AiLogEntry, GeminiDeps, GeminiOptions } from '../types.ts';

const API_KEY = 'test-key-123';
const PING_SCHEMA = z.object({ ok: z.boolean(), message: z.string() });

const OPTIONS: GeminiOptions = {
  label: 'test',
  systemInstruction: 'Du bist ein Test.',
  messages: [
    { role: 'user', content: 'Hallo' },
    { role: 'assistant', content: 'Hi!' },
    { role: 'user', content: 'Bist du da?' },
  ],
  responseSchema: PING_SCHEMA,
};

/** Erfolgreiche Gemini-Antwort mit dem angegebenen Text */
function geminiBody(text: string, extra: Record<string, unknown> = {}) {
  return {
    candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP' }],
    usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 8, thoughtsTokenCount: 3, totalTokenCount: 23 },
    modelVersion: 'gemini-test-001',
    ...extra,
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

type FakeFetch = (url: string, init: RequestInit) => Promise<Response>;

/**
 * Testumgebung: gemockter fetch, feste Zeit (jeder now()-Aufruf +100 ms),
 * aufgezeichnete Pausen, Logs und Requests.
 */
function createDeps(fakeFetch: FakeFetch, env: Record<string, string> = { GEMINI_API_KEY: API_KEY }) {
  const logs: AiLogEntry[] = [];
  const sleeps: number[] = [];
  const requests: { url: string; init: RequestInit }[] = [];
  let clock = 0;

  const deps: GeminiDeps = {
    fetch: ((input: string, init: RequestInit) => {
      requests.push({ url: input, init });
      return fakeFetch(input, init);
    }) as typeof fetch,
    getEnv: (name) => env[name],
    now: () => (clock += 100),
    sleep: (ms) => {
      sleeps.push(ms);
      return Promise.resolve();
    },
    log: (entry) => logs.push(entry),
  };
  return { deps, logs, sleeps, requests };
}

/** Liefert der Reihe nach die angegebenen Antworten */
function sequence(...responses: (() => Response)[]): FakeFetch {
  let index = 0;
  return () => Promise.resolve(responses[index++]());
}

// ---------------------------------------------------------------------
// Erfolg
// ---------------------------------------------------------------------

Deno.test('callGemini: Erfolg liefert geprüfte Daten, Tokens, Modell und Dauer', async () => {
  const { deps, logs, requests } = createDeps(
    sequence(() => jsonResponse(200, geminiBody('{"ok":true,"message":"Hallo Läufer"}'))),
  );

  const result = await callGemini(OPTIONS, deps);

  assertEquals(result.data, { ok: true, message: 'Hallo Läufer' });
  assertEquals(result.model, 'gemini-test-001');
  assertEquals(result.usage, { promptTokens: 12, outputTokens: 8, thoughtsTokens: 3, totalTokens: 23 });
  assertEquals(result.attempts, 1);
  assertEquals(result.durationMs, 100);
  assertEquals(requests.length, 1);
  assertEquals(logs, [{
    event: 'ai_call',
    label: 'test',
    model: 'gemini-test-001',
    durationMs: 100,
    attempts: 1,
    ok: true,
    usage: { promptTokens: 12, outputTokens: 8, thoughtsTokens: 3, totalTokens: 23 },
  }]);
});

Deno.test('callGemini: Request nutzt Standardmodell, Key im Header und Rollen user/model', async () => {
  const { deps, requests } = createDeps(sequence(() => jsonResponse(200, geminiBody('{"ok":true,"message":"x"}'))));

  await callGemini(OPTIONS, deps);

  const { url, init } = requests[0];
  assertEquals(url, `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent`);
  assertFalse(url.includes(API_KEY), 'Key darf nicht in der URL stehen');
  assertEquals((init.headers as Record<string, string>)['x-goog-api-key'], API_KEY);

  const body = JSON.parse(init.body as string);
  assertEquals(body.systemInstruction, { parts: [{ text: 'Du bist ein Test.' }] });
  assertEquals(body.contents.map((content: { role: string }) => content.role), ['user', 'model', 'user']);
  assertEquals(body.generationConfig.responseMimeType, 'application/json');
  assertEquals(body.generationConfig.responseJsonSchema.required, ['ok', 'message']);
  assertEquals(body.generationConfig.responseJsonSchema.$schema, undefined);
});

Deno.test('callGemini: GEMINI_MODEL überschreibt das Standardmodell', async () => {
  const { deps, requests } = createDeps(
    sequence(() => jsonResponse(200, geminiBody('{"ok":true,"message":"x"}'))),
    { GEMINI_API_KEY: API_KEY, GEMINI_MODEL: 'gemini-3.8-flash' },
  );

  await callGemini(OPTIONS, deps);

  assert(requests[0].url.includes('/models/gemini-3.8-flash:generateContent'));
});

Deno.test('callGemini: Denk-Teile gehören nicht zum Text', async () => {
  const body = geminiBody('');
  body.candidates[0].content.parts = [
    { text: 'Ich überlege …', thought: true } as never,
    { text: '{"ok":true,' },
    { text: '"message":"teilweise"}' },
  ];
  const { deps } = createDeps(sequence(() => jsonResponse(200, body)));

  const result = await callGemini(OPTIONS, deps);

  assertEquals(result.data, { ok: true, message: 'teilweise' });
});

Deno.test('callGemini: Function Call wird gegen das Schema geprüft', async () => {
  const options: GeminiOptions = {
    label: 'test',
    systemInstruction: 'x',
    messages: [{ role: 'user', content: 'Plan bitte' }],
    functionDeclarations: [{
      name: 'propose_change',
      description: 'Schlägt eine Änderung vor',
      parameters: z.object({ distanceM: z.number().int().positive() }),
    }],
  };
  const body = geminiBody('');
  body.candidates[0].content.parts = [{ functionCall: { name: 'propose_change', args: { distanceM: 5000 } } } as never];
  const { deps, requests } = createDeps(sequence(() => jsonResponse(200, body)));

  const result = await callGemini(options, deps);

  assertEquals(result.functionCalls, [{ name: 'propose_change', args: { distanceM: 5000 } }]);
  const sent = JSON.parse(requests[0].init.body as string);
  assertEquals(sent.tools[0].functionDeclarations[0].name, 'propose_change');
  assertEquals(sent.tools[0].functionDeclarations[0].parametersJsonSchema.required, ['distanceM']);
});

// ---------------------------------------------------------------------
// Fehler
// ---------------------------------------------------------------------

/** Erwartet einen AiError mit diesem Code und gibt ihn zurück */
async function expectAiError(promise: Promise<unknown>, code: string): Promise<AiError> {
  const error = await assertRejects(() => promise, AiError);
  assertEquals((error as AiError).code, code);
  return error as AiError;
}

Deno.test('callGemini: Timeout bricht per AbortController ab → AI_TIMEOUT ohne Retry', async () => {
  // fetch antwortet nie von selbst, sondern nur mit Abbruch über das Signal
  const hangingFetch: FakeFetch = (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    });
  const { deps, logs, sleeps, requests } = createDeps(hangingFetch);

  await expectAiError(callGemini({ ...OPTIONS, timeoutMs: 5 }, deps), 'AI_TIMEOUT');

  assertEquals(requests.length, 1);
  assertEquals(sleeps, []);
  assertEquals(logs[0].errorCode, 'AI_TIMEOUT');
  assertFalse(logs[0].ok);
});

Deno.test('callGemini: 429 → ein Retry nach kurzer Pause, dann Erfolg', async () => {
  const { deps, sleeps, requests } = createDeps(sequence(
    () => jsonResponse(429, { error: { code: 429, status: 'RESOURCE_EXHAUSTED', message: 'quota' } }),
    () => jsonResponse(200, geminiBody('{"ok":true,"message":"zweiter Versuch"}')),
  ));

  const result = await callGemini(OPTIONS, deps);

  assertEquals(result.data, { ok: true, message: 'zweiter Versuch' });
  assertEquals(result.attempts, 2);
  assertEquals(requests.length, 2);
  assertEquals(sleeps, [RETRY_DELAY_MS]);
});

Deno.test('callGemini: 429 zweimal → AI_RATE_LIMIT', async () => {
  const rateLimited = () => jsonResponse(429, { error: { code: 429, status: 'RESOURCE_EXHAUSTED' } });
  const { deps, requests } = createDeps(sequence(rateLimited, rateLimited));

  const error = await expectAiError(callGemini(OPTIONS, deps), 'AI_RATE_LIMIT');

  assertEquals(error.httpStatus, 429);
  assertEquals(requests.length, 2);
});

Deno.test('callGemini: 500 auch nach dem Retry → AI_UNAVAILABLE, genau zwei Versuche', async () => {
  const serverError = () => jsonResponse(500, { error: { code: 500, status: 'INTERNAL' } });
  const { deps, logs, sleeps, requests } = createDeps(sequence(serverError, serverError, serverError));

  await expectAiError(callGemini(OPTIONS, deps), 'AI_UNAVAILABLE');

  assertEquals(requests.length, 2);
  assertEquals(sleeps, [RETRY_DELAY_MS]);
  assertEquals(logs.length, 1);
  assertEquals(logs[0].attempts, 2);
  assertEquals(logs[0].httpStatus, 500);
});

Deno.test('callGemini: Netzwerkfehler → ein Retry, dann AI_UNAVAILABLE', async () => {
  const { deps, requests } = createDeps(() => Promise.reject(new TypeError('connection refused')));

  await expectAiError(callGemini(OPTIONS, deps), 'AI_UNAVAILABLE');

  assertEquals(requests.length, 2);
});

Deno.test('callGemini: ungültiges JSON → AI_INVALID_OUTPUT', async () => {
  const { deps } = createDeps(sequence(() => jsonResponse(200, geminiBody('{"ok": true, "message": '))));

  await expectAiError(callGemini(OPTIONS, deps), 'AI_INVALID_OUTPUT');
});

Deno.test('callGemini: Antwort passt nicht zum Schema → AI_INVALID_OUTPUT ohne Inhalt in der Meldung', async () => {
  const { deps } = createDeps(sequence(() => jsonResponse(200, geminiBody('{"ok":"ja","geheim":"Knie zwickt"}'))));

  const error = await expectAiError(callGemini(OPTIONS, deps), 'AI_INVALID_OUTPUT');

  assertFalse(error.message.includes('Knie'), 'Inhalte der Antwort gehören nicht in die Fehlermeldung');
});

Deno.test('callGemini: leere Antwort → AI_INVALID_OUTPUT', async () => {
  const { deps } = createDeps(sequence(() => jsonResponse(200, { candidates: [] })));

  await expectAiError(callGemini(OPTIONS, deps), 'AI_INVALID_OUTPUT');
});

Deno.test('callGemini: fehlender API-Key → AI_CONFIG ohne HTTP-Aufruf', async () => {
  const { deps, logs, requests } = createDeps(sequence(), {});

  await expectAiError(callGemini(OPTIONS, deps), 'AI_CONFIG');

  assertEquals(requests.length, 0);
  assertEquals(logs[0].errorCode, 'AI_CONFIG');
});

Deno.test('callGemini: abgelehnter API-Key (400 API_KEY_INVALID) → AI_CONFIG ohne Retry', async () => {
  const { deps, requests } = createDeps(sequence(() =>
    jsonResponse(400, {
      error: {
        code: 400,
        status: 'INVALID_ARGUMENT',
        message: 'API key not valid.',
        details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'API_KEY_INVALID' }],
      },
    })
  ));

  await expectAiError(callGemini(OPTIONS, deps), 'AI_CONFIG');

  assertEquals(requests.length, 1);
});

Deno.test('callGemini: unbekanntes Modell (404) → AI_CONFIG', async () => {
  const { deps } = createDeps(sequence(() => jsonResponse(404, { error: { code: 404, status: 'NOT_FOUND' } })));

  await expectAiError(callGemini(OPTIONS, deps), 'AI_CONFIG');
});

Deno.test('callGemini: blockierter Prompt → AI_BLOCKED', async () => {
  const { deps } = createDeps(sequence(() => jsonResponse(200, { promptFeedback: { blockReason: 'SAFETY' } })));

  await expectAiError(callGemini(OPTIONS, deps), 'AI_BLOCKED');
});

Deno.test('callGemini: Antwort mit finishReason SAFETY → AI_BLOCKED', async () => {
  const body = geminiBody('');
  body.candidates[0].finishReason = 'SAFETY';
  const { deps } = createDeps(sequence(() => jsonResponse(200, body)));

  await expectAiError(callGemini(OPTIONS, deps), 'AI_BLOCKED');
});

Deno.test('callGemini: Logs enthalten weder API-Key noch Prompt oder Antwort', async () => {
  const { deps, logs } = createDeps(sequence(() => jsonResponse(200, geminiBody('{"ok":true,"message":"Antworttext"}'))));

  await callGemini(OPTIONS, deps);

  const logged = JSON.stringify(logs);
  for (const secret of [API_KEY, 'Bist du da?', 'Du bist ein Test.', 'Antworttext']) {
    assertFalse(logged.includes(secret), `Log enthält "${secret}"`);
  }
});
