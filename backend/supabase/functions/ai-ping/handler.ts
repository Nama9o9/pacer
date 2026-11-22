/**
 * ai-ping: Test-Endpunkt für die Gemini-Anbindung (M2, Schritt 1).
 *
 * Prüft Ende-zu-Ende, dass Login, API-Key, Modell, strukturierte Ausgabe
 * und Fehlerbehandlung zusammen funktionieren. Schickt keine Nutzerdaten
 * an Gemini und schreibt nichts in die Datenbank.
 *
 * TODO(M2): Vor der Abgabe entfernen oder absichern (z. B. nur für eine
 * Entwickler-Rolle), weil jeder angemeldete User damit Kontingent verbraucht.
 */
import { z } from 'zod';

import type { GeminiOptions, GeminiResult } from '../_shared/ai/mod.ts';
import { errorResponse, handleCorsPreflight, HttpError, jsonResponse } from '../_shared/http/mod.ts';

/** Winziges Antwortschema für den Test */
export const PING_SCHEMA = z.object({
  ok: z.boolean(),
  message: z.string().min(1).max(200),
});

const SYSTEM_INSTRUCTION =
  'Du bist der Test-Endpunkt eines Lauf-Coaches. Antworte ausschließlich im vorgegebenen JSON-Format.';
const PROMPT = 'Antworte mit ok = true und einer kurzen, freundlichen Begrüßung für eine Läuferin oder einen Läufer (ein Satz).';

export type PingDeps = {
  /** Gibt die userId aus dem geprüften JWT zurück oder wirft AUTH_REQUIRED */
  authenticate: (req: Request) => Promise<{ userId: string }>;
  callGemini: (options: GeminiOptions) => Promise<GeminiResult>;
};

export function createPingHandler(deps: PingDeps): (req: Request) => Promise<Response> {
  return async (req) => {
    const preflight = handleCorsPreflight(req);
    if (preflight) return preflight;

    try {
      if (req.method !== 'POST') {
        throw new HttpError('METHOD_NOT_ALLOWED');
      }

      // Nur angemeldete User; die userId wird hier nur für den Zugriffsschutz gebraucht
      await deps.authenticate(req);

      const result = await deps.callGemini({
        label: 'ai-ping',
        systemInstruction: SYSTEM_INSTRUCTION,
        messages: [{ role: 'user', content: PROMPT }],
        responseSchema: PING_SCHEMA,
      });

      return jsonResponse({
        result: result.data,
        model: result.model,
        durationMs: result.durationMs,
        attempts: result.attempts,
        usage: result.usage,
      });
    } catch (error) {
      return errorResponse(error);
    }
  };
}
