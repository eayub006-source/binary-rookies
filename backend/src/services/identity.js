import crypto from 'crypto';
import { supabase } from '../db/supabase.js';
import { userByAnonymousId } from '../db/queries.js';

const DEFAULT_REPUTATION = 0.1;
const SALT = process.env.IDENTITY_SALT;

if (!SALT || SALT === 'replace-with-long-random-salt') {
  console.warn('IDENTITY_SALT not set or default; set a long random string in production.');
}

/**
 * anonymous_id = hash(fingerprint + salt). Only the hash is stored (§3).
 */
export function computeAnonymousId(fingerprint) {
  if (!SALT) throw new Error('IDENTITY_SALT not configured');
  return crypto.createHash('sha256').update(String(fingerprint) + SALT).digest('hex');
}

/**
 * Verify reCAPTCHA v2 token with Google.
 */
export async function verifyCaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret || secret === 'replace-with-recaptcha-secret') {
    console.warn('RECAPTCHA_SECRET_KEY not set; skipping verification in dev.');
    return true;
  }
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = await res.json();
  return data.success === true;
}

/**
 * Register or lookup anonymous user. Creates user with DEFAULT_REPUTATION if new.
 * Returns { anonymous_id }.
 */
export async function registerOrLookup(fingerprint) {
  const anonymousId = computeAnonymousId(fingerprint);
  const { data: existing } = await userByAnonymousId(anonymousId);
  if (existing) return { anonymous_id: existing.anonymous_id };

  const { error } = await supabase.from('users').insert({
    anonymous_id: anonymousId,
    reputation_score: DEFAULT_REPUTATION,
  });
  if (error) {
    if (error.code === '23505') return { anonymous_id: anonymousId }; // race: already inserted
    throw error;
  }
  return { anonymous_id: anonymousId };
}
