import { z } from 'zod';

import type { ChatMessage, GeminiOptions } from './types.ts';

/**
 * Wandelt ein zod-Schema in das JSON-Schema für Gemini um.
 * So gibt es nur eine Schema-Definition: Gemini bekommt das JSON-Schema,
 * die Antwort wird gegen dasselbe zod-Schema geprüft.
 * "$schema" wird entfernt, weil Gemini nur eine Teilmenge von JSON Schema versteht.
 * Nicht unterstützte Angaben (z. B. maxLength) ignoriert Gemini laut Doku;
 * die zod-Prüfung danach setzt sie trotzdem durch.
 */
export function toGeminiJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(schema) as Record<string, unknown>;
  return jsonSchema;
}

/** Rollen der App auf Gemini abbilden: assistant heißt dort model */
function toGeminiContent(message: ChatMessage) {
  return {
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  };
}

/**
 * Baut den Request-Body für generateContent (REST, v1beta).
 * Felder laut https://aistudio.google.com/api-reference/generate-content (Stand 22.11.2026)
 */
export function buildRequestBody(options: GeminiOptions): Record<string, unknown> {
  if (options.responseSchema && options.functionDeclarations?.length) {
    throw new Error('responseSchema und functionDeclarations nicht gleichzeitig verwenden.');
  }

  const generationConfig: Record<string, unknown> = {};
  if (options.responseSchema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseJsonSchema = toGeminiJsonSchema(options.responseSchema);
  }
  if (options.thinkingLevel) {
    generationConfig.thinkingConfig = { thinkingLevel: options.thinkingLevel };
  }

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: options.systemInstruction }] },
    contents: options.messages.map(toGeminiContent),
  };

  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }

  if (options.functionDeclarations?.length) {
    body.tools = [
      {
        functionDeclarations: options.functionDeclarations.map((declaration) => ({
          name: declaration.name,
          description: declaration.description,
          parametersJsonSchema: toGeminiJsonSchema(declaration.parameters),
        })),
      },
    ];
  }

  return body;
}
