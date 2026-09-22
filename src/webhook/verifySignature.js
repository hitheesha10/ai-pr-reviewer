import crypto from 'crypto';
import { env } from '../config/env.js';

export function verifySignature(rawBody, signatureHeader) {
  if (!signatureHeader) return false;

  const expected =
    'sha256=' +
    crypto
      .createHmac('sha256', env.webhookSecret)
      .update(rawBody)
      .digest('hex');

  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}