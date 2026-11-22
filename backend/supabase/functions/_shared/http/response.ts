import { AiError } from '../ai/errors.ts';
import { HttpError, toErrorPayload } from './errors.ts';

/**
 * CORS-Header für Aufrufe aus der App bzw. dem Browser (Expo Web).
 * Header-Liste laut https://supabase.com/docs/guides/functions/cors
 */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Antwort auf den CORS-Preflight, sonst null */
export function handleCorsPreflight(req: Request): Response | null {
  return req.method === 'OPTIONS' ? new Response('ok', { headers: corsHeaders }) : null;
}

/** JSON-Antwort mit CORS-Headern */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/**
 * Fehlerantwort im Format { error: { code, message } }.
 * Erwartete Fehler (HttpError, AiError) sind schon geloggt bzw. harmlos;
 * unerwartete werden mit Name und Meldung geloggt, gehen aber nicht an die App.
 */
export function errorResponse(error: unknown): Response {
  if (!(error instanceof HttpError) && !(error instanceof AiError)) {
    const description = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(JSON.stringify({ event: 'unexpected_error', description }));
  }
  const { status, body } = toErrorPayload(error);
  return jsonResponse(body, status);
}
