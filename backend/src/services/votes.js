import prisma from '../db/prisma.js';
import { rumorById } from '../db/queries.js';
import * as demo from '../db/demoStore.js';

const VALID_VOTES = new Set(['true', 'false', 'neutral']);

function useDemo() {
  return process.env.USE_DEMO_STORE === '1';
}

export async function castVote(rumorId, voterId, vote) {
  const v = String(vote).toLowerCase();
  if (!VALID_VOTES.has(v)) {
    const e = new Error('vote must be true, false, or neutral');
    e.statusCode = 400;
    throw e;
  }
  if (useDemo()) {
    const rumor = demo.demoGetRumor(rumorId);
    if (!rumor) {
      const e = new Error('Rumor not found or deleted');
      e.statusCode = 404;
      throw e;
    }
    if (demo.demoHasVoted(rumorId, voterId)) {
      const e = new Error('Already voted on this rumor');
      e.statusCode = 409;
      throw e;
    }
    const result = demo.demoCastVote(rumorId, voterId, v);
    return result ? { rumor_id: rumorId, voter_id: voterId, vote: v } : null;
  }
  const rumor = await rumorById(rumorId);
  if (!rumor) {
    const e = new Error('Rumor not found or deleted');
    e.statusCode = 404;
    throw e;
  }
  const existing = await prisma.vote.findUnique({
    where: { rumor_id_voter_id: { rumor_id: rumorId, voter_id: voterId } },
  });
  if (existing) {
    const e = new Error('Already voted on this rumor');
    e.statusCode = 409;
    throw e;
  }
  try {
    return await prisma.vote.create({
      data: { rumor_id: rumorId, voter_id: voterId, vote: v },
    });
  } catch (e) {
    if (e.code === 'P2002') {
      const err = new Error('Already voted on this rumor');
      err.statusCode = 409;
      throw err;
    }
    throw e;
  }
}
