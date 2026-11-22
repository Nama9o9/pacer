/**
 * Gemini-Client für alle Edge Functions.
 *
 * Bewusst über die REST-API per fetch statt über das SDK @google/genai:
 * Das SDK nennt Deno/Edge-Runtimes nicht als unterstützt und verlangt ab
 * Version 3 Node 22. fetch ist in Deno eingebaut, braucht keine Abhängigkeit
 * und lässt sich in Tests einfach ersetzen.
 *
 * Genutzt wird generateContent (zustandslos): Den Verlauf speichern wir
 * selbst in coach_messages und schicken ihn bei jedem Aufruf mit.
 */
import { DEFAULT_TIMEOUT_MS, generateContentUrl, readGeminiConfig, RETRY_DELAY_MS } from './config.ts';
import { AiError } from './errors.ts';
import { buildRequestBody } from './request.ts';
import { isRetryableStatus, mapHttpError, parseGenerateContentResponse } from './response.ts';
import type { GeminiDeps, GeminiOptions, GeminiResult } from './types.ts';

/** Produktions-Abhängigkeiten; Tests übergeben eigene */
export const defaultGeminiDeps: GeminiDeps = {
  fetch: (input, init) => fetch(input, init),
  getEnv: (name) => Deno.env.get(name),
  now: () => performance.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  // Eine JSON-Zeile pro Aufruf, in den Supabase-Logs filterbar nach "ai_call"
  log: (entry) => console.log(JSON.stringify(entry)),
};

type HttpResult = { status: number; body: unknown };

/**
 * Ein einzelner HTTP-Versuch mit Timeout per AbortController.
 * Der Timeout gilt bis einschließlich Lesen des Bodys.
 */
async function sendOnce(
  url: string,
  apiKey: string,
  requestBody: string,
  timeoutMs: number,
  fetchFn: typeof fetch,
): Promise<HttpResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchFn(url, {
      method: 'POST',
      // Key im Header statt in der URL, damit er nicht in URL-Logs landet
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: requestBody,
      signal: controller.signal,
    });
    const text = await response.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      // Kein JSON (z. B. HTML-Fehlerseite eines Proxys): body bleibt null
    }
    return { status: response.status, body };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new AiError('AI_TIMEOUT', `Keine Antwort von Gemini innerhalb von ${timeoutMs} ms.`);
    }
    const name = error instanceof Error ? error.name : 'unbekannt';
    throw new AiError('AI_UNAVAILABLE', `Netzwerkfehler beim Aufruf von Gemini (${name}).`);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ruft Gemini auf und liefert Text, geprüfte strukturierte Daten oder
 * Funktionsaufrufe. Wirft bei jedem Problem einen AiError mit eigenem Code.
 *
 * Fehlerbehandlung:
 * - Timeout pro Versuch (Standard 20 s) → AI_TIMEOUT, kein Retry
 * - 429, 5xx oder Netzwerkfehler → genau ein Retry nach kurzer Pause
 * - übrige Fehler sofort, siehe mapHttpError
 *
 * Jeder Aufruf schreibt genau einen Logeintrag (Dauer, Modell, Tokens, Fehlercode).
 */
export async function callGemini(
  options: GeminiOptions,
  deps: GeminiDeps = defaultGeminiDeps,
): Promise<GeminiResult> {
  const startedAt = deps.now();
  let model = 'unbekannt';
  let attempts = 0;

  try {
    const config = readGeminiConfig(deps.getEnv);
    model = config.model;
    const url = generateContentUrl(config.model);
    const requestBody = JSON.stringify(buildRequestBody(options));
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    let result: HttpResult | undefined;
    while (!result) {
      attempts += 1;
      const isLastAttempt = attempts >= 2;
      try {
        const response = await sendOnce(url, config.apiKey, requestBody, timeoutMs, deps.fetch);
        if (response.status >= 200 && response.status < 300) {
          result = response;
        } else if (isRetryableStatus(response.status) && !isLastAttempt) {
          await deps.sleep(RETRY_DELAY_MS);
        } else {
          throw mapHttpError(response.status, response.body);
        }
      } catch (error) {
        // Netzwerkfehler ebenfalls einmal wiederholen, Timeouts nicht
        const isNetworkError = error instanceof AiError && error.code === 'AI_UNAVAILABLE' && !error.httpStatus;
        if (!isNetworkError || isLastAttempt) throw error;
        await deps.sleep(RETRY_DELAY_MS);
      }
    }

    const parsed = parseGenerateContentResponse(result.body, options);
    const durationMs = Math.round(deps.now() - startedAt);
    const usedModel = parsed.modelVersion ?? model;

    deps.log({
      event: 'ai_call',
      label: options.label,
      model: usedModel,
      durationMs,
      attempts,
      ok: true,
      usage: parsed.usage,
    });

    return {
      text: parsed.text,
      data: parsed.data,
      functionCalls: parsed.functionCalls,
      model: usedModel,
      usage: parsed.usage,
      durationMs,
      attempts,
    };
  } catch (error) {
    deps.log({
      event: 'ai_call',
      label: options.label,
      model,
      durationMs: Math.round(deps.now() - startedAt),
      attempts,
      ok: false,
      errorCode: error instanceof AiError ? error.code : 'INTERNAL',
      httpStatus: error instanceof AiError ? error.httpStatus : undefined,
    });
    throw error;
  }
}
