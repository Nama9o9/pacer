/**
 * Eigene Fehlercodes für alle KI-Aufrufe. Die Edge Functions bilden sie auf
 * HTTP-Status und eine verständliche deutsche Meldung für die App ab
 * (siehe _shared/http/errors.ts).
 */
export type AiErrorCode =
  /** Keine Antwort innerhalb des Timeouts (auch 504 von Gemini) */
  | 'AI_TIMEOUT'
  /** 429: Rate-Limit oder Kontingent erschöpft, auch nach dem Retry */
  | 'AI_RATE_LIMIT'
  /** 5xx oder Netzwerkfehler, auch nach dem Retry */
  | 'AI_UNAVAILABLE'
  /** Safety-Filter: Prompt oder Antwort wurde blockiert */
  | 'AI_BLOCKED'
  /** Antwort ist kein gültiges JSON oder passt nicht zum Schema */
  | 'AI_INVALID_OUTPUT'
  /** API-Key fehlt oder ist ungültig, Modell unbekannt */
  | 'AI_CONFIG'
  /** Gemini lehnt die Anfrage selbst ab (übrige 4xx), meist ein Programmierfehler */
  | 'AI_BAD_REQUEST';

/**
 * Fehler eines KI-Aufrufs.
 * message ist für Logs gedacht und enthält nie den API-Key oder Nutzerdaten.
 */
export class AiError extends Error {
  readonly code: AiErrorCode;
  /** HTTP-Status der Gemini-Antwort, falls es einen gab */
  readonly httpStatus?: number;

  constructor(code: AiErrorCode, message: string, httpStatus?: number) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}
