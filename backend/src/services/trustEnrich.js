import { computeTrustScore } from './trust.js';

const THRESHOLD_TRUE = 0.6;
const THRESHOLD_FALSE = -0.6;

function outcomeFromScore(score) {
  if (score == null) return 'neutral';
  if (score > THRESHOLD_TRUE) return 'true';
  if (score < THRESHOLD_FALSE) return 'false';
  return 'neutral';
}

/**
 * Attach trust_score, outcome, and finalized_at to a single rumor for API response.
 */
export async function enrichRumor(rumor) {
  if (!rumor) return rumor;
  const finalized = rumor.finalized_at != null;
  const trustScore = finalized ? (rumor.final_trust_score ?? null) : await computeTrustScore(rumor.id);
  return {
    ...rumor,
    trust_score: trustScore,
    outcome: outcomeFromScore(trustScore),
    finalized_at: rumor.finalized_at ?? null,
  };
}

/**
 * Attach trust fields to a list of rumors.
 */
export async function enrichRumors(rumors) {
  const out = [];
  for (const r of rumors) {
    out.push(await enrichRumor(r));
  }
  return out;
}
