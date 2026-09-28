import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

// Fallback chain — put your most reliable model first.
// gemini-2.0-flash is retired — do NOT include it.
const MODEL_CHAIN = [
  process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-pro',
];

const MAX_RETRIES_PER_MODEL = 3;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryable(err) {
  const msg = String(err?.message || '');
  return msg.includes('503') || msg.includes('Service Unavailable') || msg.includes('429');
}

function isRetired(err) {
  const msg = String(err?.message || '');
  return msg.includes('404') || msg.includes('no longer available');
}

async function callModel(modelName, prompt) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function askJson(systemPrompt, userContent) {
  const prompt = `${systemPrompt}\n\n---\n\n${userContent}`;

  let lastErr;

  for (const modelName of MODEL_CHAIN) {
    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const text = await callModel(modelName, prompt);
        const cleaned = text
          .replace(/^```json\s*/i, '')
          .replace(/```\s*$/, '')
          .trim();
        return JSON.parse(cleaned);
      } catch (err) {
        lastErr = err;

        // Retired model (404) — don't retry, jump to next model immediately
        if (isRetired(err)) {
          logger.warn(`Model ${modelName} is retired — skipping`);
          break;
        }

        // Non-retryable error — try next model
        if (!isRetryable(err)) {
          logger.warn(`LLM ${modelName} failed (non-retryable): ${err.message.slice(0, 80)}`);
          break;
        }

        // Retryable (503/429) — exponential backoff with jitter
        const baseDelay = [0, 2500, 6000, 11000][attempt] || 11000;
        const jitter = Math.floor(Math.random() * 1000);
        const wait = baseDelay + jitter;

        logger.warn(
          `LLM ${modelName} attempt ${attempt}/${MAX_RETRIES_PER_MODEL} failed: ${err.message.slice(0, 80)} — retrying in ${wait}ms`
        );

        await sleep(wait);
      }
    }

    logger.warn(`Model ${modelName} exhausted — trying next in chain`);
  }

  logger.error('All models failed', lastErr?.message);
  throw lastErr;
}