import prisma from '../db/prisma.js';
import { rumorById, votesByRumorId, rumorsToFinalize } from '../db/queries.js';

const VOTE_WEIGHT = { true: 1, false: -1, neutral: 0 };
const FINALIZATION_DAYS = 7;
const THRESHOLD_TRUE = 0.6;
const THRESHOLD_FALSE = -0.6;
const REP_DELTA_AGREE = 0.05;
const REP_DELTA_DISAGREE = -0.05;
const REP_MIN = -1;
const REP_MAX = 1;

export async function computeTrustScore(rumorId) {
  const rumor = await rumorById(rumorId);
  if (!rumor) return null;
  if (rumor.finalized_at != null) return rumor.final_trust_score ?? null;

  const votes = await votesByRumorId(rumorId);
  if (!votes?.length) return null;

  const voterIds = [...new Set(votes.map((v) => v.voter_id))];
  const users = await prisma.user.findMany({
    where: { anonymous_id: { in: voterIds } },
    select: { anonymous_id: true, reputation_score: true },
  });
  const repByVoter = new Map(users.map((u) => [u.anonymous_id, Number(u.reputation_score) ?? 0.1]));

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

function outcomeFromScore(score) {
  if (score == null) return 'neutral';
  if (score > THRESHOLD_TRUE) return 'true';
  if (score < THRESHOLD_FALSE) return 'false';
  return 'neutral';
}

export async function finalizeRumor(rumor) {
  const score = await computeTrustScore(rumor.id);
  const finalScore = score ?? 0;
  const outcome = outcomeFromScore(finalScore);

  await prisma.rumor.update({
    where: { id: rumor.id },
    data: { final_trust_score: finalScore, finalized_at: new Date() },
  });

  const votes = await votesByRumorId(rumor.id);
  if (!votes?.length) return;

  for (const v of votes) {
    const voteOutcome = v.vote;
    let delta = 0;
    if (voteOutcome === outcome) delta = REP_DELTA_AGREE;
    else if (voteOutcome !== 'neutral' && outcome !== 'neutral') delta = REP_DELTA_DISAGREE;
    if (delta === 0) continue;

    const user = await prisma.user.findUnique({ where: { anonymous_id: v.voter_id } });
    const current = Number(user?.reputation_score ?? 0.1);
    const next = Math.max(REP_MIN, Math.min(REP_MAX, current + delta));
    await prisma.user.update({
      where: { anonymous_id: v.voter_id },
      data: { reputation_score: next, accuracy_metric: next },
    });
  }
}

export async function runFinalizationJob() {
  const toFinalize = await rumorsToFinalize(FINALIZATION_DAYS);
  if (!toFinalize?.length) return;
  for (const rumor of toFinalize) {
    try {
      await finalizeRumor(rumor);
    } catch (e) {
      console.error('Finalization failed for rumor', rumor.id, e);
    }
  }
}
