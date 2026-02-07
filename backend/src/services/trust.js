import prisma from '../db/prisma.js';
import { rumorById, votesByRumorId, rumorsToFinalize } from '../db/queries.js';

const VOTE_WEIGHT = { true: 1, false: -1, neutral: 0 };
const FINALIZATION_DAYS = 7;
const THRESHOLD_TRUE = 0.6;
const THRESHOLD_FALSE = -0.6;
const REP_DELTA_AGREE = 0.05;
const REP_DELTA_DISAGREE = -0.05;
const REP_MIN = 0.05;   // floor: prevents negative spiral (§5.2)
const REP_MAX = 1.0;
const NEW_ACCOUNT_HOURS = 48;   // votes from accounts < 48h old count at 0.25x (§5.5)
const NEW_ACCOUNT_WEIGHT = 0.25;
const VOTE_AGE_FULL_WEIGHT_HOURS = 24;  // votes from last 24h discounted (late bot swarms)

function repFloor(r) {
  return Math.max(REP_MIN, Math.min(REP_MAX, Number(r) ?? 0.1));
}

function accountAgeFactor(createdAt) {
  if (!createdAt) return 1;
  const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  return hours >= NEW_ACCOUNT_HOURS ? 1 : NEW_ACCOUNT_WEIGHT;
}

function voteAgeFactor(voteCreatedAt, rumorCreatedAt) {
  if (!voteCreatedAt) return 1;
  const voteTime = new Date(voteCreatedAt).getTime();
  const cutoff = Date.now() - VOTE_AGE_FULL_WEIGHT_HOURS * 60 * 60 * 1000;
  return voteTime >= cutoff ? 0.5 : 1;  // recent votes discounted
}

export async function computeTrustScore(rumorId) {
  const rumor = await rumorById(rumorId);
  if (!rumor) return null;
  if (rumor.finalized_at != null) return rumor.final_trust_score ?? null;

  const votes = await votesByRumorId(rumorId);
  if (!votes?.length) return null;

  const voterIds = [...new Set(votes.map((v) => v.voter_id))];
  const users = await prisma.user.findMany({
    where: { anonymous_id: { in: voterIds } },
    select: { anonymous_id: true, reputation_score: true, created_at: true },
  });
  const userByVoter = new Map(users.map((u) => [u.anonymous_id, u]));

  const voteValues = [];
  let weightedSum = 0;
  let totalAbsWeight = 0;

  for (const v of votes) {
    const u = userByVoter.get(v.voter_id);
    const rep = repFloor(u?.reputation_score);
    const accFactor = accountAgeFactor(u?.created_at);
    const ageFactor = voteAgeFactor(v.created_at, rumor.created_at);
    const w = rep * accFactor * ageFactor;
    const val = VOTE_WEIGHT[v.vote] ?? 0;
    voteValues.push(val);
    weightedSum += w * val;
    totalAbsWeight += Math.abs(w);
  }

  if (totalAbsWeight <= 0) return null;

  // Variance weighting: high disagreement lowers confidence (§5.1)
  const mean = voteValues.reduce((a, b) => a + b, 0) / voteValues.length;
  const variance = voteValues.reduce((s, x) => s + (x - mean) ** 2, 0) / voteValues.length;
  const sigmaR = Math.max(0, 1 - variance / 2);

  const raw = weightedSum / totalAbsWeight;
  const score = raw * sigmaR;
  return Math.max(-1, Math.min(1, score));
}

function outcomeFromScore(score) {
  if (score == null) return 'neutral';
  if (score > THRESHOLD_TRUE) return 'true';
  if (score < THRESHOLD_FALSE) return 'false';
  return 'neutral';
}

export async function finalizeRumor(rumor) {
  // rumor is from rumorsToFinalize: always has deleted_at IS NULL (§5.4)
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
    const current = repFloor(user?.reputation_score);
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
