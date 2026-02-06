import { supabase } from '../db/supabase.js';
import { rumorById, votesByRumorId, rumorsToFinalize } from '../db/queries.js';

const VOTE_WEIGHT = { true: 1, false: -1, neutral: 0 };
const FINALIZATION_DAYS = 7;
const THRESHOLD_TRUE = 0.6;
const THRESHOLD_FALSE = -0.6;
const REP_DELTA_AGREE = 0.05;
const REP_DELTA_DISAGREE = -0.05;
const REP_MIN = -1;
const REP_MAX = 1;

/**
 * Compute current trust score for a rumor (only non-deleted). Uses votes and voter reputations.
 * Returns score in [-1, 1] or null if no votes.
 */
export async function computeTrustScore(rumorId) {
  const { data: rumor, error: re } = await rumorById(rumorId);
  if (re || !rumor) return null;
  if (rumor.finalized_at != null) return rumor.final_trust_score ?? null;

  const { data: votes } = await votesByRumorId(rumorId);
  if (!votes?.length) return null;

  const voterIds = [...new Set(votes.map((v) => v.voter_id))];
  const { data: users } = await supabase.from('users').select('anonymous_id, reputation_score').in('anonymous_id', voterIds);
  const repByVoter = new Map((users ?? []).map((u) => [u.anonymous_id, Number(u.reputation_score) ?? 0.1]));

  let weightedSum = 0;
  let totalRep = 0;
  for (const v of votes) {
    const rep = repByVoter.get(v.voter_id) ?? 0.1;
    const w = VOTE_WEIGHT[v.vote] ?? 0;
    weightedSum += w * rep;
    totalRep += rep;
  }
  if (totalRep <= 0) return null;
  return Math.max(-1, Math.min(1, weightedSum / totalRep));
}

/**
 * Outcome from trust score: >0.6 true, <-0.6 false, else neutral.
 */
function outcomeFromScore(score) {
  if (score == null) return 'neutral';
  if (score > THRESHOLD_TRUE) return 'true';
  if (score < THRESHOLD_FALSE) return 'false';
  return 'neutral';
}

/**
 * Finalize one rumor: set final_trust_score and finalized_at, then update voter reputations.
 * Only call for non-deleted rumors past the finalization window.
 */
export async function finalizeRumor(rumor) {
  const score = await computeTrustScore(rumor.id);
  const finalScore = score ?? 0;
  const outcome = outcomeFromScore(finalScore);

  await supabase
    .from('rumors')
    .update({
      final_trust_score: finalScore,
      finalized_at: new Date().toISOString(),
    })
    .eq('id', rumor.id);

  const { data: votes } = await votesByRumorId(rumor.id);
  if (!votes?.length) return;

  for (const v of votes) {
    const voteOutcome = v.vote;
    let delta = 0;
    if (voteOutcome === outcome) delta = REP_DELTA_AGREE;
    else if (voteOutcome !== 'neutral' && outcome !== 'neutral') delta = REP_DELTA_DISAGREE;

    if (delta === 0) continue;

    const { data: user } = await supabase.from('users').select('reputation_score').eq('anonymous_id', v.voter_id).single();
    const current = Number(user?.reputation_score ?? 0.1);
    const next = Math.max(REP_MIN, Math.min(REP_MAX, current + delta));
    await supabase.from('users').update({ reputation_score: next }).eq('anonymous_id', v.voter_id);
  }
}

/**
 * Run finalization for all rumors past the 7-day window (non-deleted, not yet finalized).
 */
export async function runFinalizationJob() {
  const { data: toFinalize } = await rumorsToFinalize(FINALIZATION_DAYS);
  if (!toFinalize?.length) return;
  for (const rumor of toFinalize) {
    try {
      await finalizeRumor(rumor);
    } catch (e) {
      console.error('Finalization failed for rumor', rumor.id, e);
    }
  }
}
