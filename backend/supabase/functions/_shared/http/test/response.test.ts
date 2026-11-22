import { assertEquals } from '@std/assert';

import { AiError } from '../../ai/errors.ts';
import { ERROR_INFO, HttpError, toErrorPayload } from '../errors.ts';
import { errorResponse, handleCorsPreflight, jsonResponse } from '../response.ts';

Deno.test('toErrorPayload: AiError behält seinen Code, die App bekommt die deutsche Meldung', () => {
  const payload = toErrorPayload(new AiError('AI_RATE_LIMIT', 'HTTP 429 RESOURCE_EXHAUSTED', 429));

  assertEquals(payload.status, 429);
  assertEquals(payload.body, { error: { code: 'AI_RATE_LIMIT', message: ERROR_INFO.AI_RATE_LIMIT.message } });
});

Deno.test('toErrorPayload: interne Log-Meldung eines HttpError geht nicht an die App', () => {
  const payload = toErrorPayload(new HttpError('AUTH_REQUIRED', 'JWT abgelaufen um 12:00'));

  assertEquals(payload.status, 401);
  assertEquals(payload.body.error.message, 'Bitte melde dich erneut an.');
});

Deno.test('toErrorPayload: unbekannter Fehler wird INTERNAL ohne Details', () => {
  const payload = toErrorPayload(new Error('duplicate key value violates unique constraint'));

  assertEquals(payload.status, 500);
  assertEquals(payload.body.error.code, 'INTERNAL');
  assertEquals(payload.body.error.message, ERROR_INFO.INTERNAL.message);
});

Deno.test('ERROR_INFO: jeder KI-Fehlercode hat einen passenden HTTP-Status', () => {
  assertEquals(ERROR_INFO.AI_TIMEOUT.status, 504);
  assertEquals(ERROR_INFO.AI_UNAVAILABLE.status, 503);
  assertEquals(ERROR_INFO.AI_BLOCKED.status, 422);
  assertEquals(ERROR_INFO.AI_INVALID_OUTPUT.status, 502);
  assertEquals(ERROR_INFO.AI_CONFIG.status, 500);
});

Deno.test('errorResponse: JSON im einheitlichen Format mit CORS-Header', async () => {
  const response = errorResponse(new AiError('AI_TIMEOUT', 'x'));

  assertEquals(response.status, 504);
  assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
  assertEquals(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
  assertEquals((await response.json()).error.code, 'AI_TIMEOUT');
});

Deno.test('jsonResponse: Standardstatus 200', async () => {
  const response = jsonResponse({ ok: true });

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { ok: true });
});

Deno.test('handleCorsPreflight: OPTIONS wird beantwortet, POST nicht', async () => {
  const preflight = handleCorsPreflight(new Request('http://x', { method: 'OPTIONS' }));
  assertEquals(preflight?.status, 200);
  assertEquals(preflight?.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS');
  await preflight?.body?.cancel();

  assertEquals(handleCorsPreflight(new Request('http://x', { method: 'POST' })), null);
});
