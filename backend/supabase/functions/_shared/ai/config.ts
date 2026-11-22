import { AiError } from './errors.ts';

/**
 * Standardmodell, falls GEMINI_MODEL nicht gesetzt ist.
 * gemini-3.5-flash-lite: stabil, im Free Tier verfügbar und das günstigste
 * aktuelle Modell (Stand der Gemini-Doku vom 22.11.2026).
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

/** Timeout pro Versuch, falls der Aufrufer keinen angibt */
export const DEFAULT_TIMEOUT_MS = 20_000;

/** Wartezeit vor dem einen Retry bei 429, 5xx oder Netzwerkfehler */
export const RETRY_DELAY_MS = 1_000;

export const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export type GeminiConfig = {
  apiKey: string;
  model: string;
};

/**
 * Liest API-Key und Modell aus der Umgebung.
 * Fehlt der Key, gibt es einen AI_CONFIG-Fehler (ohne den Key selbst zu nennen).
 */
export function readGeminiConfig(getEnv: (name: string) => string | undefined): GeminiConfig {
  const apiKey = getEnv('GEMINI_API_KEY')?.trim();
  if (!apiKey) {
    throw new AiError('AI_CONFIG', 'GEMINI_API_KEY ist nicht gesetzt.');
  }
  const model = getEnv('GEMINI_MODEL')?.trim() || DEFAULT_GEMINI_MODEL;
  return { apiKey, model };
}

/** URL für generateContent; der Modellname wird URL-kodiert */
export function generateContentUrl(model: string): string {
  return `${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}:generateContent`;
}
