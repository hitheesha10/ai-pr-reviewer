import express from 'express';
import 'dotenv/config';
import webhookRouter from './src/webhook/route.js';
import { env } from './src/config/env.js';
import { logger } from './src/utils/logger.js';

const app = express();

// ─────────────────────────────────────────────────────────────
// Webhook FIRST — needs raw body for HMAC verification.
// Must be mounted BEFORE express.json(), or the raw bytes are lost.
// ─────────────────────────────────────────────────────────────
app.use('/webhook', webhookRouter);

// Global JSON parser for all other routes (dashboard API, etc.)
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.listen(env.port, () => {
  logger.info(`Server running on http://localhost:${env.port}`);
  logger.info(`Webhook endpoint: POST http://localhost:${env.port}/webhook`);
});