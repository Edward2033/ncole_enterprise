/**
 * AI Service — Google Gemini 2.x integration.
 * All DB access is mediated through ai.context.ts. Gemini never touches the DB.
 */

import { GoogleGenerativeAI, type Content } from '@google/generative-ai';
import { env } from '@/config/env';
import { AppError } from '@/shared/errors/AppError';
import { buildSystemPrompt, type AiPortal } from './ai.prompts';
import { buildContext } from './ai.context';
import { z } from 'zod';

// ─── Schema ───────────────────────────────────────────────────────────────────

export const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        parts: z.array(z.object({ text: z.string() })),
      }),
    )
    .max(20)
    .default([]),
  portal: z.enum(['PUBLIC', 'CUSTOMER', 'VENDOR', 'RIDER', 'ADMIN']).default('PUBLIC'),
});

export type ChatDto = z.infer<typeof chatSchema>;

// ─── Client factory (lazy-init, one instance) ─────────────────────────────────

let _genai: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!env.GEMINI_API_KEY) {
    // Return 503 (service unavailable) with a user-friendly message — not 500
    const err = new AppError('AI assistant is not available. The GEMINI_API_KEY is not configured.', 503);
    throw err;
  }
  if (!_genai) _genai = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return _genai;
}

// ─── Chat handler ─────────────────────────────────────────────────────────────

export async function chat(dto: ChatDto, userId?: string, userName?: string): Promise<string> {
  const client = getClient();

  const systemPrompt = buildSystemPrompt(dto.portal as AiPortal, userName);
  const contextData = await buildContext(dto.portal as AiPortal, userId);

  const model = client.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: {
      role: 'system',
      parts: [
        {
          text: [
            systemPrompt,
            '',
            '--- LIVE PLATFORM CONTEXT (use this data to ground your answers) ---',
            contextData,
            '--- END CONTEXT ---',
          ].join('\n'),
        },
      ],
    },
  });

  // Reconstruct prior history for multi-turn
  const history: Content[] = dto.history.map((h) => ({
    role: h.role,
    parts: h.parts,
  }));

  const chatSession = model.startChat({ history });

  const result = await chatSession.sendMessage(dto.message);
  const text = result.response.text();

  if (!text) throw AppError.internal('AI returned an empty response.');

  return text;
}
