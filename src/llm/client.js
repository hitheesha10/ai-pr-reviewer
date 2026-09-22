import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

const model = genAI.getGenerativeModel({
 model: 'gemini-3.6-flash',
  generationConfig: {
    temperature: 0.2,
    responseMimeType: 'application/json',
  },
});

/**
 * Send a prompt to the LLM and get structured JSON back.
 * @param {string} systemPrompt
 * @param {string} userContent
 * @returns {Promise<object>}
 */
export async function askJson(systemPrompt, userContent) {
  const prompt = `${systemPrompt}\n\n---\n\n${userContent}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Gemini sometimes wraps JSON in ```json fences — strip them
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    logger.error('LLM call failed:', err.message);
    throw err;
  }
}