/**
 * AI Service — Google Gemini 2.x integration.
 * All DB access is mediated through ai.context.ts. Gemini never touches the DB.
 */

import { GoogleGenerativeAI, type Content } from '@google/generative-ai';
import { env } from '@/config/env';
import { AppError } from '@/shared/errors/AppError';
import { logger } from '@/config/logger';
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
    throw new AppError('AI assistant is not available. The GEMINI_API_KEY is not configured.', 503);
  }
  if (!_genai) _genai = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return _genai;
}

// ─── Chat handler ─────────────────────────────────────────────────────────────

export async function chat(dto: ChatDto, userId?: string, userName?: string): Promise<string> {
  const client = getClient();

  logger.info('[AI] Request received', {
    portal: dto.portal,
    model: env.GEMINI_MODEL,
    userId,
    messageLength: dto.message.length,
    historyLength: dto.history.length,
    message: dto.message.slice(0, 200), // log first 200 chars for debugging
  });

  const systemPrompt = buildSystemPrompt(dto.portal as AiPortal, userName);
  const contextData = await buildContext(dto.portal as AiPortal, userId);

  const model = client.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: {
      role: 'system',
      parts: [{
        text: [
          systemPrompt,
          '',
          '--- LIVE PLATFORM CONTEXT (use this data to ground your answers) ---',
          contextData,
          '--- END CONTEXT ---',
        ].join('\n'),
      }],
    },
  });

  const history: Content[] = dto.history.map((h) => ({ role: h.role, parts: h.parts }));
  const chatSession = model.startChat({ history });

  try {
    logger.info('[AI] Sending message to Gemini', { portal: dto.portal, model: env.GEMINI_MODEL, endpoint: `generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent` });
    const result = await chatSession.sendMessage(dto.message);
    const raw = result.response;
    logger.info('[AI] Raw Gemini response received', { portal: dto.portal, candidatesCount: raw.candidates?.length ?? 0 });
    const text = raw.text();
    logger.info('[AI] Response parsed', { portal: dto.portal, replyLength: text?.length ?? 0 });
    if (!text) throw AppError.internal('AI returned an empty response.');
    return text;
  } catch (err) {
    if (err instanceof AppError) throw err;

    const raw = err instanceof Error ? err.message : String(err);

    // 401 / API_KEY_INVALID — key is set but rejected by Google
    if (raw.includes('401') || raw.includes('API_KEY_INVALID') || raw.includes('UNAUTHENTICATED')) {
      logger.error('[AI] Invalid API key — check GEMINI_API_KEY in environment variables', { model: env.GEMINI_MODEL, raw });
      throw new AppError('AI assistant is temporarily unavailable. Please try again later.', 503);
    }

    // 429 quota errors — distinguish daily exhaustion from per-minute throttle
    if (raw.includes('429') || raw.includes('Too Many Requests') || raw.includes('RESOURCE_EXHAUSTED')) {
      const isDaily = raw.includes('PerDay') || raw.includes('per_day') || (raw.includes('limit: 0') && raw.includes('FreeTier'));
      if (isDaily) {
        logger.warn('[AI] Daily free-tier quota exhausted', { model: env.GEMINI_MODEL });
        throw new AppError('The AI assistant has reached its daily usage limit. Please try again tomorrow or contact support to upgrade the plan.', 429);
      }
      const retryMatch = raw.match(/retry.*?(\d+).*?s/i);
      const retryIn = retryMatch ? `${retryMatch[1]} seconds` : 'a moment';
      logger.warn('[AI] Per-minute rate limit hit', { model: env.GEMINI_MODEL, retryIn });
      throw new AppError(`The AI assistant is busy right now. Please try again in ${retryIn}.`, 429);
    }

    logger.error('[AI] Gemini API call failed', { model: env.GEMINI_MODEL, portal: dto.portal, raw, err });
    throw new AppError(`AI service error: ${raw}`, 502);
  }
}
