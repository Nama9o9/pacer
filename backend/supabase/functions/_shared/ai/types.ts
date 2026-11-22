import type { z } from 'zod';

/** Eine Nachricht im Verlauf, Rollen wie in coach_messages */
export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

/** Eine Funktion, die das Modell aufrufen darf (Function Calling) */
export type FunctionDeclaration = {
  name: string;
  description: string;
  /** Schema der Argumente; daraus wird das JSON-Schema für Gemini erzeugt und die Antwort geprüft */
  parameters: z.ZodType;
};

/** Ein vom Modell gewünschter Funktionsaufruf, Argumente bereits gegen das Schema geprüft */
export type FunctionCall = {
  name: string;
  args: unknown;
};

/** Denkaufwand des Modells; welche Stufen erlaubt sind, hängt vom Modell ab */
export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high';

export type GeminiOptions = {
  /** Kurzer Name des Aufrufers für die Logs, z. B. 'ai-ping' */
  label: string;
  systemInstruction: string;
  messages: ChatMessage[];
  /** Strukturierte Ausgabe: Antwort muss JSON passend zu diesem Schema sein */
  responseSchema?: z.ZodType;
  /** Function Calling; nicht zusammen mit responseSchema verwenden */
  functionDeclarations?: FunctionDeclaration[];
  /** Ohne Angabe gilt der Standard des Modells */
  thinkingLevel?: ThinkingLevel;
  /** Timeout pro Versuch in Millisekunden */
  timeoutMs?: number;
};

/** Token-Nutzung laut usageMetadata der Antwort */
export type TokenUsage = {
  promptTokens: number;
  outputTokens: number;
  thoughtsTokens: number;
  totalTokens: number;
};

export type GeminiResult = {
  /** Text der Antwort (ohne Denk-Teile); bei responseSchema das rohe JSON */
  text: string;
  /** Bei responseSchema: geparste und geprüfte Daten, sonst undefined */
  data: unknown;
  functionCalls: FunctionCall[];
  /** Modellversion laut Antwort, sonst der angefragte Modellname */
  model: string;
  usage: TokenUsage;
  durationMs: number;
  /** Anzahl der HTTP-Versuche (1 oder 2) */
  attempts: number;
};

/** Ein Logeintrag pro KI-Aufruf, für den Arbeitsbericht. Enthält nie Prompts oder Antworten. */
export type AiLogEntry = {
  event: 'ai_call';
  label: string;
  model: string;
  durationMs: number;
  attempts: number;
  ok: boolean;
  errorCode?: string;
  httpStatus?: number;
  usage?: TokenUsage;
};

/** Abhängigkeiten von außen, damit Tests ohne echten API-Aufruf und mit fester Zeit laufen */
export type GeminiDeps = {
  fetch: typeof fetch;
  /** Liest Umgebungsvariablen, in Produktion Deno.env.get */
  getEnv: (name: string) => string | undefined;
  /** Aktuelle Zeit in Millisekunden, nur für Dauer-Messungen */
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  log: (entry: AiLogEntry) => void;
};
