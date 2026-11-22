import { AiError } from './errors.ts';
import type { FunctionCall, GeminiOptions, TokenUsage } from './types.ts';

/** Gründe, aus denen Gemini eine Antwort aus Sicherheitsgründen abbricht */
const BLOCKED_FINISH_REASONS = new Set([
  'SAFETY',
  'BLOCKLIST',
  'PROHIBITED_CONTENT',
  'SPII',
  'RECITATION',
  'IMAGE_SAFETY',
]);

/** Bei diesen HTTP-Status lohnt sich ein erneuter Versuch */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/** Liest status und reason aus dem Fehler-Body von Gemini, ohne die Meldung zu übernehmen */
function describeGoogleError(body: unknown): { status?: string; reason?: string } {
  const error = (body as { error?: { status?: unknown; details?: unknown } } | null)?.error;
  const details = Array.isArray(error?.details) ? error.details : [];
  const reason = details
    .map((detail) => (detail as { reason?: unknown })?.reason)
    .find((value): value is string => typeof value === 'string');
  return { status: typeof error?.status === 'string' ? error.status : undefined, reason };
}

/**
 * Bildet eine Fehlerantwort von Gemini auf einen eigenen Fehlercode ab.
 * Fehlerformat laut https://aistudio.google.com/docs/api-errors:
 * { "error": { "code": 400, "message": "...", "status": "INVALID_ARGUMENT", "details": [...] } }
 */
export function mapHttpError(httpStatus: number, body: unknown): AiError {
  const { status, reason } = describeGoogleError(body);
  const detail = [`HTTP ${httpStatus}`, status, reason].filter(Boolean).join(' ');

  if (httpStatus === 400 && reason === 'API_KEY_INVALID') {
    return new AiError('AI_CONFIG', `Gemini lehnt den API-Key ab (${detail}).`, httpStatus);
  }
  if (httpStatus === 401 || httpStatus === 403) {
    return new AiError('AI_CONFIG', `Keine Berechtigung für Gemini (${detail}).`, httpStatus);
  }
  if (httpStatus === 404) {
    return new AiError('AI_CONFIG', `Modell nicht gefunden, GEMINI_MODEL prüfen (${detail}).`, httpStatus);
  }
  if (httpStatus === 429) {
    return new AiError('AI_RATE_LIMIT', `Rate-Limit von Gemini erreicht (${detail}).`, httpStatus);
  }
  if (httpStatus === 504) {
    return new AiError('AI_TIMEOUT', `Gemini hat die Frist überschritten (${detail}).`, httpStatus);
  }
  if (httpStatus >= 500) {
    return new AiError('AI_UNAVAILABLE', `Gemini ist nicht verfügbar (${detail}).`, httpStatus);
  }
  return new AiError('AI_BAD_REQUEST', `Gemini lehnt die Anfrage ab (${detail}).`, httpStatus);
}

type Part = { text?: unknown; thought?: unknown; functionCall?: { name?: unknown; args?: unknown } };
type GenerateContentResponse = {
  promptFeedback?: { blockReason?: unknown };
  candidates?: { finishReason?: unknown; content?: { parts?: Part[] } }[];
  usageMetadata?: Record<string, unknown>;
  modelVersion?: unknown;
};

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Token-Nutzung aus usageMetadata; fehlende Felder zählen als 0 */
export function readUsage(usageMetadata: Record<string, unknown> | undefined): TokenUsage {
  return {
    promptTokens: toCount(usageMetadata?.promptTokenCount),
    outputTokens: toCount(usageMetadata?.candidatesTokenCount),
    thoughtsTokens: toCount(usageMetadata?.thoughtsTokenCount),
    totalTokens: toCount(usageMetadata?.totalTokenCount),
  };
}

export type ParsedResponse = {
  text: string;
  data: unknown;
  functionCalls: FunctionCall[];
  modelVersion?: string;
  usage: TokenUsage;
};

/** Prüft die Argumente eines Funktionsaufrufs gegen das Schema der passenden Deklaration */
function parseFunctionCall(part: Part, options: GeminiOptions): FunctionCall {
  const name = part.functionCall?.name;
  const declaration = options.functionDeclarations?.find((candidate) => candidate.name === name);
  if (typeof name !== 'string' || !declaration) {
    throw new AiError('AI_INVALID_OUTPUT', `Unbekannte Funktion im Funktionsaufruf: ${String(name)}.`);
  }
  const result = declaration.parameters.safeParse(part.functionCall?.args ?? {});
  if (!result.success) {
    throw new AiError('AI_INVALID_OUTPUT', `Argumente für ${name} passen nicht zum Schema.`);
  }
  return { name, args: result.data };
}

/** Parst die JSON-Antwort und prüft sie gegen das Schema */
function parseStructuredOutput(text: string, options: GeminiOptions): unknown {
  if (!options.responseSchema) return undefined;

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new AiError('AI_INVALID_OUTPUT', 'Antwort ist kein gültiges JSON.');
  }

  const result = options.responseSchema.safeParse(json);
  if (!result.success) {
    // Nur die Pfade der Fehler loggen, nicht die Inhalte
    const paths = result.error.issues.map((issue) => issue.path.join('.') || '(root)').join(', ');
    throw new AiError('AI_INVALID_OUTPUT', `Antwort passt nicht zum Schema (${paths}).`);
  }
  return result.data;
}

/**
 * Wertet eine erfolgreiche generateContent-Antwort aus.
 * Wirft AI_BLOCKED bei Safety-Filter und AI_INVALID_OUTPUT bei leerer,
 * ungültiger oder nicht zum Schema passender Antwort.
 */
export function parseGenerateContentResponse(body: unknown, options: GeminiOptions): ParsedResponse {
  const response = (body ?? {}) as GenerateContentResponse;

  if (response.promptFeedback?.blockReason) {
    throw new AiError('AI_BLOCKED', `Prompt blockiert (${String(response.promptFeedback.blockReason)}).`);
  }

  const candidate = response.candidates?.[0];
  const finishReason = typeof candidate?.finishReason === 'string' ? candidate.finishReason : undefined;
  if (finishReason && BLOCKED_FINISH_REASONS.has(finishReason)) {
    throw new AiError('AI_BLOCKED', `Antwort blockiert (${finishReason}).`);
  }
  if (finishReason === 'MALFORMED_FUNCTION_CALL') {
    throw new AiError('AI_INVALID_OUTPUT', 'Ungültiger Funktionsaufruf vom Modell.');
  }

  // Denk-Teile (thought: true) gehören nicht zur Antwort
  const parts = (candidate?.content?.parts ?? []).filter((part) => part.thought !== true);
  const text = parts.map((part) => (typeof part.text === 'string' ? part.text : '')).join('');
  const functionCalls = parts
    .filter((part) => part.functionCall)
    .map((part) => parseFunctionCall(part, options));

  if (text.trim() === '' && functionCalls.length === 0) {
    throw new AiError('AI_INVALID_OUTPUT', `Leere Antwort (finishReason: ${finishReason ?? 'keine'}).`);
  }

  return {
    text,
    data: functionCalls.length > 0 ? undefined : parseStructuredOutput(text, options),
    functionCalls,
    modelVersion: typeof response.modelVersion === 'string' ? response.modelVersion : undefined,
    usage: readUsage(response.usageMetadata),
  };
}
