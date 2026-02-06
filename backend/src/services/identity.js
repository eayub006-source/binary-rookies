import crypto from 'crypto';
import prisma from '../db/prisma.js';

const DEFAULT_REPUTATION = 0.1;
const SALT = process.env.IDENTITY_SALT || 'dev-salt-change-in-production';
const RECAPTCHA_ENABLED = process.env.RECAPTCHA_SECRET_KEY && process.env.RECAPTCHA_SECRET_KEY !== 'replace-with-recaptcha-secret';

if (!process.env.IDENTITY_SALT || process.env.IDENTITY_SALT === 'replace-with-long-random-salt') {
  console.warn('IDENTITY_SALT not set; using dev fallback. Set a long random string in production.');
}
if (RECAPTCHA_ENABLED) {
  console.log('reCAPTCHA verification enabled.');
} else {
  console.warn('RECAPTCHA_SECRET_KEY not set; CAPTCHA verification skipped (dev mode).');
}

export function computeAnonymousId(fingerprint) {
  return crypto.createHash('sha256').update(String(fingerprint) + SALT).digest('hex');
}

export async function verifyCaptcha(token) {
  if (!RECAPTCHA_ENABLED) return true;
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = await res.json();
  return data.success === true;
}

export async function registerOrLookup(fingerprint) {
  const anonymousId = computeAnonymousId(fingerprint);
  const existing = await prisma.user.findUnique({ where: { anonymous_id: anonymousId } });
  if (existing) return { anonymous_id: existing.anonymous_id };

  try {
    await prisma.user.create({
      data: { anonymous_id: anonymousId, reputation_score: DEFAULT_REPUTATION },
    });
  } catch (e) {
    if (e.code === 'P2002') return { anonymous_id: anonymousId };
    throw e;
  }
  return { anonymous_id: anonymousId };
}
