import express from 'express';
import { verifySignature } from './verifySignature.js';
import { handleWebhook } from './handler.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post(
  '/',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    const deliveryId = req.headers['x-github-delivery'];

    if (!verifySignature(req.body, signature)) {
      logger.warn(`Invalid signature from ${req.ip}`);
      return res.status(401).send('Invalid signature');
    }

    let payload;
    try {
      payload = JSON.parse(req.body.toString());
    } catch (err) {
      logger.error('Failed to parse JSON body', err.message);
      return res.status(400).send('Invalid JSON');
    }

    // Respond FAST. GitHub times out at 10s and retries — we don't want duplicates.
    res.status(202).send('Accepted');

    // Process after responding
    handleWebhook(event, payload, deliveryId).catch((err) =>
      logger.error('Webhook handler error', err)
    );
  }
);

export default router;