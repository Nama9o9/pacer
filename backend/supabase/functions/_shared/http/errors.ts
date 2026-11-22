import { AiError, type AiErrorCode } from '../ai/errors.ts';

/** Alle Fehlercodes, die eine Edge Function an die App zurückgeben kann */
export type AppErrorCode =
  | AiErrorCode
  /** Kein oder ungültiges Login-Token */
  | 'AUTH_REQUIRED'
  | 'METHOD_NOT_ALLOWED'
  /** Request-Body fehlt oder ist ungültig */
  | 'BAD_REQUEST'
  /** Unerwarteter Fehler, z. B. Datenbank oder fehlende Server-Konfiguration */
  | 'INTERNAL';

/** HTTP-Status und verständliche Meldung für die App je Fehlercode */
export const ERROR_INFO: Record<AppErrorCode, { status: number; message: string }> = {
  AUTH_REQUIRED: { status: 401, message: 'Bitte melde dich erneut an.' },
  METHOD_NOT_ALLOWED: { status: 405, message: 'Diese Anfrage wird nicht unterstützt.' },
  BAD_REQUEST: { status: 400, message: 'Die Anfrage war unvollständig oder ungültig.' },
  INTERNAL: { status: 500, message: 'Da ist etwas schiefgelaufen. Bitte versuch es später noch einmal.' },
  AI_TIMEOUT: { status: 504, message: 'Der Coach braucht gerade zu lange. Bitte versuch es gleich noch einmal.' },
  AI_RATE_LIMIT: {
    status: 429,
    message: 'Der Coach ist gerade stark ausgelastet. Bitte versuch es in ein paar Minuten noch einmal.',
  },
  AI_UNAVAILABLE: {
    status: 503,
    message: 'Der Coach ist gerade nicht erreichbar. Bitte versuch es später noch einmal.',
  },
  AI_BLOCKED: {
    status: 422,
    message: 'Darauf kann der Coach leider nicht antworten. Bitte formuliere deine Anfrage anders.',
  },
  AI_INVALID_OUTPUT: {
    status: 502,
    message: 'Der Coach hat keine verwertbare Antwort geliefert. Bitte versuch es noch einmal.',
  },
  AI_CONFIG: {
    status: 500,
    message: 'Der Coach ist gerade nicht richtig eingerichtet. Bitte versuch es später noch einmal.',
  },
  AI_BAD_REQUEST: {
    status: 500,
    message: 'Der Coach konnte die Anfrage nicht verarbeiten. Bitte versuch es später noch einmal.',
  },
};

/** Fehler mit Code für die App; message ist nur für Logs, die App bekommt die Meldung aus ERROR_INFO */
export class HttpError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message: string = ERROR_INFO[code].message) {
    super(message);
    this.name = 'HttpError';
    this.code = code;
  }
}

/** Einheitliches Fehlerformat aller Edge Functions */
export type ErrorBody = { error: { code: AppErrorCode; message: string } };

/**
 * Bildet einen beliebigen Fehler auf Status und Fehler-Body ab.
 * Unbekannte Fehler werden zu INTERNAL; ihre Details gehen nie an die App.
 */
export function toErrorPayload(error: unknown): { status: number; body: ErrorBody } {
  const code: AppErrorCode = error instanceof HttpError || error instanceof AiError ? error.code : 'INTERNAL';
  const { status, message } = ERROR_INFO[code];
  return { status, body: { error: { code, message } } };
}
